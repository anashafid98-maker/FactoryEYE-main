using System.Data.SqlClient;
using DataAcquisition.Models;

namespace DataAcquisition.Services
{
    public class DataCollector
    {
        private readonly string _connectionString;

        public DataCollector(string connectionString)
        {
            _connectionString = connectionString;
        }

        public void SaveEquipment(Equipement data)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                var cmd = new SqlCommand(
                    "INSERT INTO dbo.Equipement (InstanceId, DeviceName) VALUES (@id, @name)", 
                    connection);
                
                cmd.Parameters.AddWithValue("@id", data.InstanceId);
                cmd.Parameters.AddWithValue("@name", data.DeviceName);
                cmd.ExecuteNonQuery();
            }
        }
    }
}