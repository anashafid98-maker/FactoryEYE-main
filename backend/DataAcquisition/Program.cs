using DataAcquisition.Models;
using DataAcquisition.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace DataAcquisition
{
    public static class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    config.AddJsonFile("appsettings.json", optional: false);
                    config.AddEnvironmentVariables();
                })
                .ConfigureServices((hostContext, services) =>
                {
                    // Configuration de la connexion SQL
                    var connectionString = hostContext.Configuration.GetConnectionString("FactoryDatabase");
                    services.AddSingleton(new DataCollector(connectionString));

                    // Configuration des paramètres d'acquisition
                    var acquisitionSettings = new AcquisitionSettings
                    {
                        IntervalSeconds = hostContext.Configuration.GetValue<int>("DataAcquisition:IntervalSeconds", 5),
                        MaxRetries = hostContext.Configuration.GetValue<int>("DataAcquisition:MaxRetries", 3)
                    };
                    services.AddSingleton(acquisitionSettings);

                    // Service principal
                    services.AddHostedService<AcquisitionService>();

                    // Logging SQL (optionnel)
                    services.AddLogging(builder => 
                        builder.AddFilter("Microsoft", LogLevel.Warning));
                });
    }

    public class AcquisitionService : BackgroundService
    {
        private readonly DataCollector _dataCollector;
        private readonly AcquisitionSettings _settings;
        private readonly ILogger<AcquisitionService> _logger;

        public AcquisitionService(
            DataCollector dataCollector,
            AcquisitionSettings settings,
            ILogger<AcquisitionService> logger)
        {
            _dataCollector = dataCollector;
            _settings = settings;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Service d'acquisition démarré");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var equipment = GenerateSampleData();
                    _dataCollector.SaveEquipment(equipment);
                    _logger.LogInformation($"Données enregistrées : {equipment.DeviceName}");
                }
                catch (SqlException sqlEx)
                {
                    _logger.LogError(sqlEx, "Erreur SQL");
                    await HandleRetry(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erreur inattendue");
                }

                await Task.Delay(TimeSpan.FromSeconds(_settings.IntervalSeconds), stoppingToken);
            }
        }

        private Equipement GenerateSampleData()
        {
            return new Equipement
            {
                InstanceId = new Random().Next(100, 200),
                DeviceName = $"EQ-{DateTime.Now:yyyyMMddHHmmss}"
            };
        }

        private async Task HandleRetry(CancellationToken token, int currentRetry = 0)
        {
            if (currentRetry >= _settings.MaxRetries)
            {
                _logger.LogCritical("Nombre maximum de tentatives atteint");
                return;
            }

            var delay = TimeSpan.FromSeconds(Math.Pow(2, currentRetry)); // Backoff exponentiel
            _logger.LogWarning($"Nouvelle tentative dans {delay.TotalSeconds}s...");

            await Task.Delay(delay, token);
        }
    }

    public class AcquisitionSettings
    {
        public int IntervalSeconds { get; set; }
        public int MaxRetries { get; set; }
    }
}