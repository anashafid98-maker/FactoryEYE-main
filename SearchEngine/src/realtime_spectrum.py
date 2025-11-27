from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
from scipy import signal
from datetime import datetime, timedelta
import time
import threading
import pyodbc

app = Flask(__name__)
CORS(app)

# Stockage des données
latest_data = []
data_lock = threading.Lock()
historical_dates = set()

def get_connection():
    """Connexion à la base de données SQL Server"""
    try:
        conn = pyodbc.connect(
            "Driver={ODBC Driver 17 for SQL Server};"
            "Server=D-CZC929DNPY\\MSSQLSERVER01;"
            "Database=FactoryEYE;"
            "Trusted_Connection=yes;"
        )
        print("✅ Connexion DB réussie")
        return conn
    except Exception as e:
        print(f"❌ Erreur connexion DB: {e}")
        return None

def scan_historical_dates():
    """Scanne automatiquement les dates disponibles dans la base"""
    global historical_dates
    try:
        conn = get_connection()
        dates_found = set()
        
        if conn:
            cursor = conn.cursor()
            print("🔍 Recherche des dates dans la base de données...")
            cursor.execute("""
                SELECT DISTINCT CONVERT(date, timestamp) as date_only 
                FROM dbo.COMPRESSEURDATA 
                ORDER BY date_only DESC
            """)
            rows = cursor.fetchall()
            dates_found = {row[0].strftime('%Y-%m-%d') for row in rows}
            conn.close()
            print(f"📅 Dates trouvées dans la base: {len(dates_found)} dates")
        
        # TOUJOURS inclure la date d'aujourd'hui
        today = datetime.now().strftime('%Y-%m-%d')
        dates_found.add(today)
        
        historical_dates = dates_found
        
        if dates_found:
            print("📋 Liste des dates disponibles:")
            for date in sorted(dates_found, reverse=True)[:10]:
                print(f"   - {date}")
        
        return dates_found
        
    except Exception as e:
        print(f"❌ Erreur scan dates: {e}")
        today = datetime.now().strftime('%Y-%m-%d')
        historical_dates = {today}
        return historical_dates

def generate_psd_from_vibration(vibration_data, fs=2000.0):
    """Génère un PSD simulé réaliste"""
    try:
        vibration_magnitude = max(abs(float(vibration_data)), 0.1)
        t = np.linspace(0, 1, int(fs))
        
        rpm = 1250
        fundamental_freq = rpm / 60
        harmonic_2 = fundamental_freq * 2
        harmonic_3 = fundamental_freq * 3
        
        signal_clean = (vibration_magnitude * 
                       (np.sin(2 * np.pi * fundamental_freq * t) +
                        0.5 * np.sin(2 * np.pi * harmonic_2 * t) +
                        0.3 * np.sin(2 * np.pi * harmonic_3 * t) +
                        0.2 * np.sin(2 * np.pi * 100 * t) +
                        0.1 * np.sin(2 * np.pi * 150 * t)))
        
        noise = np.random.normal(0, 0.1 * vibration_magnitude, len(t))
        signal_with_noise = signal_clean + noise
        
        freqs, psd = signal.welch(signal_with_noise, fs, nperseg=1024, scaling='density')
        psd = np.maximum(psd, 1e-12)
        
        return freqs, psd
        
    except Exception as e:
        print(f"[PSD] Erreur: {e}")
        freqs = np.linspace(0, 1000, 512)
        psd = np.ones_like(freqs) * 1e-6
        return freqs, psd

def generate_realtime_data():
    """Génère des données temps réel simulées"""
    current_time = datetime.now()
    
    minute_factor = current_time.minute / 60.0
    hour_factor = current_time.hour / 24.0
    
    base_vibration = 0.8 + 0.4 * np.sin(minute_factor * 2 * np.pi) + 0.2 * np.sin(hour_factor * 2 * np.pi)
    
    freqs_vx, psd_vx = generate_psd_from_vibration(base_vibration + np.random.uniform(-0.1, 0.1))
    freqs_vy, psd_vy = generate_psd_from_vibration(base_vibration + np.random.uniform(-0.1, 0.1))
    
    pressure_variation = 5.0 + 2.0 * np.sin(minute_factor * np.pi) + np.random.uniform(-0.3, 0.3)
    current_variation = 10.0 + 3.0 * np.sin(minute_factor * 1.5 * np.pi) + np.random.uniform(-0.5, 0.5)
    
    return {
        "id": len(latest_data) + 1,
        "timestamp": current_time.isoformat(),
        "vibration_x": round(base_vibration + np.random.uniform(-0.05, 0.05), 4),
        "vibration_y": round(base_vibration * 0.9 + np.random.uniform(-0.05, 0.05), 4),
        "vibration_z": round(base_vibration * 0.3 + np.random.uniform(-0.02, 0.02), 4),
        "vx_rms": round(base_vibration * 0.15 + np.random.uniform(0, 0.05), 4),
        "vy_rms": round(base_vibration * 0.13 + np.random.uniform(0, 0.05), 4),
        "pressure": round(pressure_variation, 2),
        "current_value": round(current_variation, 2),
        "running": True,
        "source": "realtime_simulation",
        "is_simulation": True,
        "spectrum_vx": {"freqs": freqs_vx.tolist(), "psd": psd_vx.tolist()},
        "spectrum_vy": {"freqs": freqs_vy.tolist(), "psd": psd_vy.tolist()}
    }

def realtime_data_generator():
    """Générateur de données temps réel - 1 minute d'intervalle"""
    global latest_data
    
    while True:
        try:
            new_data = generate_realtime_data()
            with data_lock:
                latest_data.append(new_data)
                if len(latest_data) > 120:
                    latest_data = latest_data[-120:]
            
            print(f"🕐 [{datetime.now().strftime('%H:%M:%S')}] Donnée temps réel: VX={new_data['vibration_x']:.4f}")
            
        except Exception as e:
            print(f"❌ Erreur génération temps réel: {e}")
        
        time.sleep(60)

def historical_scanner():
    """Scanner périodique des dates historiques"""
    while True:
        try:
            print("\n🔄 Scan automatique des dates historiques...")
            scan_historical_dates()
            print(f"✅ Scan terminé - {len(historical_dates)} dates disponibles")
        except Exception as e:
            print(f"❌ Erreur scan historique: {e}")
        
        time.sleep(300)

# ==================== ROUTES API ====================

@app.route('/api/data')
def get_data():
    """Endpoint principal pour les données"""
    date_param = request.args.get('date')
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    print(f"📡 [API] GET /api/data - date: {date_param}")

    if date_param:
        print(f"🔍 Données demandées pour: {date_param}")
        if date_param == today_str:
            with data_lock:
                return jsonify(latest_data)
        else:
            # Pour les dates historiques, générer des données simulées
            simulated_data = generate_historical_data(date_param, 48)
            return jsonify(simulated_data)
    else:
        # Pas de date = données temps réel
        with data_lock:
            return jsonify(latest_data)

def generate_historical_data(date_str, count=48):
    """Génère des données historiques simulées"""
    simulated_data = []
    base_time = datetime.strptime(date_str, '%Y-%m-%d')
    
    for i in range(count):
        time_index = i / count
        base_vibration = 0.8 + 0.3 * np.sin(time_index * 4 * np.pi) + np.random.uniform(-0.1, 0.1)
        
        freqs_vx, psd_vx = generate_psd_from_vibration(base_vibration)
        freqs_vy, psd_vy = generate_psd_from_vibration(base_vibration * 0.9)
        
        pressure = 5.0 + 1.5 * np.sin(time_index * 3 * np.pi) + np.random.uniform(-0.2, 0.2)
        current_val = 10.0 + 2.0 * np.sin(time_index * 2 * np.pi) + np.random.uniform(-0.3, 0.3)
        
        timestamp = base_time + timedelta(minutes=i*30)
        
        item = {
            "id": i + 1,
            "timestamp": timestamp.isoformat(),
            "vibration_x": round(base_vibration, 4),
            "vibration_y": round(base_vibration * 0.9 + np.random.uniform(-0.05, 0.05), 4),
            "vibration_z": round(base_vibration * 0.3 + np.random.uniform(-0.02, 0.02), 4),
            "vx_rms": round(base_vibration * 0.15 + np.random.uniform(0, 0.05), 4),
            "vy_rms": round(base_vibration * 0.13 + np.random.uniform(0, 0.05), 4),
            "pressure": round(pressure, 2),
            "current_value": round(current_val, 2),
            "running": True,
            "source": "historical_simulation",
            "is_simulation": True,
            "spectrum_vx": {"freqs": freqs_vx.tolist(), "psd": psd_vx.tolist()},
            "spectrum_vy": {"freqs": freqs_vy.tolist(), "psd": psd_vy.tolist()}
        }
        simulated_data.append(item)
    
    print(f"✅ Généré {len(simulated_data)} points pour {date_str}")
    return simulated_data

# ==================== ENDPOINTS DATES ====================

@app.route('/api/dates')
def get_available_dates():
    """Retourne les dates disponibles"""
    print("📅 GET /api/dates")
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    all_dates = [today_str] + sorted([d for d in historical_dates if d != today_str], reverse=True)
    
    unique_dates = []
    for date in all_dates:
        if date not in unique_dates:
            unique_dates.append(date)
    
    print(f"✅ Retourne {len(unique_dates)} dates")
    return jsonify(unique_dates[:50])

@app.route('/api/simulation/dates')
def get_simulation_dates():
    """Alias pour /api/dates"""
    return get_available_dates()

@app.route('/api/all-dates')
def get_all_dates():
    """Autre alias pour la compatibilité"""
    return get_available_dates()

# ==================== AUTRES ENDPOINTS ====================

@app.route('/api/latest')
def get_latest():
    """Dernière mesure"""
    with data_lock:
        if latest_data:
            return jsonify(latest_data[-1])
        return jsonify({})

@app.route('/api/health')
def health():
    """Statut du système"""
    with data_lock:
        return jsonify({
            "status": "healthy",
            "realtime_data_points": len(latest_data),
            "historical_dates_count": len(historical_dates),
            "timestamp": datetime.now().isoformat(),
            "today": datetime.now().strftime('%Y-%m-%d'),
            "endpoints_available": [
                "/api/data",
                "/api/dates", 
                "/api/simulation/dates",
                "/api/all-dates",
                "/api/latest",
                "/api/health"
            ]
        })

@app.route('/api/test')
def test_endpoint():
    """Endpoint de test"""
    return jsonify({
        "message": "API FactoryEYE fonctionne!",
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            "/api/data",
            "/api/dates",
            "/api/simulation/dates", 
            "/api/all-dates",
            "/api/latest",
            "/api/health",
            "/api/test"
        ]
    })

@app.route('/')
def home():
    """Page d'accueil"""
    with data_lock:
        data_count = len(latest_data)
    
    today = datetime.now().strftime('%Y-%m-%d')
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>FactoryEYE - API</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }}
            .container {{ max-width: 1000px; margin: 0 auto; }}
            .header {{ background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }}
            .card {{ background: white; padding: 20px; margin: 10px 0; border-radius: 8px; }}
            .endpoint {{ background: #f8f9fa; padding: 12px; margin: 8px 0; border-left: 4px solid #007cba; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏭 FactoryEYE - API de Surveillance</h1>
                <p><strong>Statut: ✅ En ligne</strong> | Données temps réel: {data_count} points</p>
            </div>
            
            <div class="card">
                <h2>🔗 Endpoints Disponibles</h2>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/data">/api/data</a></strong>
                    <p>Données temps réel (aujourd'hui)</p>
                </div>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/dates">/api/dates</a></strong>
                    <p>✅ <strong>Dates disponibles</strong></p>
                </div>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/simulation/dates">/api/simulation/dates</a></strong>
                    <p>Dates disponibles (alias)</p>
                </div>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/all-dates">/api/all-dates</a></strong>
                    <p>Dates disponibles (alias)</p>
                </div>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/data?date={today}">/api/data?date={today}</a></strong>
                    <p>Données pour aujourd'hui (explicite)</p>
                </div>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/data?date=2025-11-21">/api/data?date=2025-11-21</a></strong>
                    <p>Données historiques (exemple)</p>
                </div>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/latest">/api/latest</a></strong>
                    <p>Dernière mesure</p>
                </div>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/health">/api/health</a></strong>
                    <p>Statut du système</p>
                </div>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/test">/api/test</a></strong>
                    <p>Test de l'API</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

if __name__ == '__main__':
    print("🚀 Démarrage de l'API FactoryEYE...")
    
    # Scan initial
    print("🔍 Scan initial des dates...")
    scan_historical_dates()
    
    # Données initiales
    print("🔄 Génération des données initiales...")
    for i in range(5):
        latest_data.append(generate_realtime_data())
        time.sleep(0.5)
    
    # Threads
    realtime_thread = threading.Thread(target=realtime_data_generator, daemon=True)
    historical_thread = threading.Thread(target=historical_scanner, daemon=True)
    
    realtime_thread.start()
    historical_thread.start()
    
    print("✅ API démarrée!")
    print("📊 Endpoints disponibles:")
    print("   http://localhost:5000/")
    print("   http://localhost:5000/api/data")
    print("   http://localhost:5000/api/dates")
    print("   http://localhost:5000/api/health")
    print("   http://localhost:5000/api/test")
    
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)