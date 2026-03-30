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
        return conn
    except Exception as e:
        print(f"❌ Erreur connexion DB: {e}")
        return None

def save_to_database(data_point):
    """Sauvegarde un point de données dans la base"""
    try:
        conn = get_connection()
        if not conn:
            print("❌ Impossible de se connecter à la base pour sauvegarde")
            return False
            
        cursor = conn.cursor()
        
        # Requête d'insertion
        query = """
        INSERT INTO dbo.COMPRESSEURDATA 
        (timestamp, vibration_x, vibration_y, vibration_z, vx_rms, vy_rms, pressure, current_value, running)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        cursor.execute(query, 
            data_point['timestamp'],
            data_point['vibration_x'],
            data_point['vibration_y'], 
            data_point['vibration_z'],
            data_point['vx_rms'],
            data_point['vy_rms'],
            data_point['pressure'],
            data_point['current_value'],
            data_point['running']
        )
        
        conn.commit()
        conn.close()
        
        print(f"💾 Donnée sauvegardée dans la base: VX={data_point['vibration_x']:.4f}")
        return True
        
    except Exception as e:
        print(f"❌ Erreur sauvegarde base de données: {e}")
        return False

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
    
    # Variations cycliques réalistes
    minute_factor = current_time.minute / 60.0
    hour_factor = current_time.hour / 24.0
    
    base_vibration = 0.8 + 0.4 * np.sin(minute_factor * 2 * np.pi) + 0.2 * np.sin(hour_factor * 2 * np.pi)
    
    # Générer les PSD
    freqs_vx, psd_vx = generate_psd_from_vibration(base_vibration + np.random.uniform(-0.1, 0.1))
    freqs_vy, psd_vy = generate_psd_from_vibration(base_vibration + np.random.uniform(-0.1, 0.1))
    
    # Variations corrélées
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
        "spectrum_vx": {
            "freqs": freqs_vx.tolist(),
            "psd": psd_vx.tolist()
        },
        "spectrum_vy": {
            "freqs": freqs_vy.tolist(), 
            "psd": psd_vy.tolist()
        }
    }

def generate_historical_data(date_str, count=48):
    """Génère des données historiques simulées"""
    print(f"🎮 Génération de {count} données historiques pour {date_str}")
    
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
    
    print(f"✅ Génération terminée: {len(simulated_data)} points")
    return simulated_data

def realtime_data_generator():
    """Générateur de données temps réel avec sauvegarde automatique"""
    global latest_data
    
    while True:
        try:
            new_data = generate_realtime_data()
            
            # Sauvegarder dans la base de données
            save_success = save_to_database(new_data)
            
            with data_lock:
                latest_data.append(new_data)
                
                # Garder seulement les 120 dernières valeurs en mémoire
                if len(latest_data) > 120:
                    latest_data = latest_data[-120:]
            
            status_icon = "💾" if save_success else "⚠️"
            print(f"{status_icon} [{datetime.now().strftime('%H:%M:%S')}] Donnée temps réel: "
                  f"VX={new_data['vibration_x']:.4f}, "
                  f"P={new_data['pressure']:.1f} bar")
            
        except Exception as e:
            print(f"❌ Erreur génération temps réel: {e}")
        
        time.sleep(60)  # 1 minute

def historical_scanner():
    """Scanner périodique des dates historiques"""
    while True:
        try:
            print("\n" + "="*50)
            print("🔄 SCAN AUTOMATIQUE DES DATES HISTORIQUES")
            print("="*50)
            scan_historical_dates()
            print(f"✅ Scan terminé - {len(historical_dates)} dates disponibles")
            print("="*50)
        except Exception as e:
            print(f"❌ Erreur scan historique: {e}")
        
        time.sleep(300)  # Rescan toutes les 5 minutes

def database_initializer():
    """Initialise la base de données si nécessaire"""
    try:
        conn = get_connection()
        if conn:
            cursor = conn.cursor()
            
            # Vérifier si la table existe
            cursor.execute("""
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'COMPRESSEURDATA'
            """)
            
            table_exists = cursor.fetchone()[0] > 0
            
            if not table_exists:
                print("📦 Création de la table COMPRESSEURDATA...")
                # Créer la table si elle n'existe pas
                cursor.execute("""
                    CREATE TABLE dbo.COMPRESSEURDATA (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        timestamp DATETIME2,
                        vibration_x FLOAT,
                        vibration_y FLOAT,
                        vibration_z FLOAT,
                        vx_rms FLOAT,
                        vy_rms FLOAT,
                        pressure FLOAT,
                        current_value FLOAT,
                        running BIT
                    )
                """)
                conn.commit()
                print("✅ Table COMPRESSEURDATA créée avec succès")
            else:
                print("✅ Table COMPRESSEURDATA existe déjà")
            
            conn.close()
            
    except Exception as e:
        print(f"❌ Erreur initialisation base de données: {e}")

# ==================== ROUTES API ====================

@app.route('/api/data', methods=['GET'])
def get_data():
    """Endpoint principal pour les données"""
    date_param = request.args.get('date')
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    print(f"📡 [API] GET /api/data - date: {date_param}")

    if date_param:
        print(f"🔍 Données demandées pour: {date_param}")
        if date_param == today_str:
            # Aujourd'hui = données temps réel
            with data_lock:
                print(f"✅ Retourne {len(latest_data)} données temps réel")
                return jsonify(latest_data)
        else:
            # Date historique = données de la base
            historical_data = get_historical_data_from_db(date_param)
            print(f"✅ Retourne {len(historical_data)} données historiques")
            return jsonify(historical_data)
    else:
        # Pas de date = données temps réel
        with data_lock:
            print(f"✅ Retourne {len(latest_data)} données temps réel (défaut)")
            return jsonify(latest_data)

def get_historical_data_from_db(date_str):
    """Récupère les données historiques de la base de données"""
    try:
        conn = get_connection()
        if not conn:
            print(f"❌ Impossible de se connecter à la DB pour {date_str}")
            return generate_historical_data(date_str, 48)
            
        cursor = conn.cursor()
        query = """
            SELECT timestamp, vibration_x, vibration_y, vibration_z, 
                   vx_rms, vy_rms, pressure, current_value, running
            FROM dbo.COMPRESSEURDATA 
            WHERE CONVERT(date, timestamp) = ?
            ORDER BY timestamp ASC
        """
        
        print(f"🔍 Recherche données DB pour {date_str}...")
        cursor.execute(query, date_str)
        rows = cursor.fetchall()
        historical_data = []
        
        print(f"📊 {len(rows)} enregistrements trouvés dans la base")
        
        for i, row in enumerate(rows):
            # Générer les PSD pour chaque point de données
            freqs_vx, psd_vx = generate_psd_from_vibration(row[1] if row[1] else 0.8)
            freqs_vy, psd_vy = generate_psd_from_vibration(row[2] if row[2] else 0.7)
            
            data_point = {
                "id": i + 1,
                "timestamp": row[0].isoformat() if hasattr(row[0], 'isoformat') else str(row[0]),
                "vibration_x": float(row[1]) if row[1] is not None else 0.8,
                "vibration_y": float(row[2]) if row[2] is not None else 0.7,
                "vibration_z": float(row[3]) if row[3] is not None else 0.3,
                "vx_rms": float(row[4]) if row[4] is not None else 0.1,
                "vy_rms": float(row[5]) if row[5] is not None else 0.1,
                "pressure": float(row[6]) if row[6] is not None else 5.0,
                "current_value": float(row[7]) if row[7] is not None else 10.0,
                "running": bool(row[8]) if row[8] is not None else True,
                "source": "database",
                "is_simulation": False,
                "spectrum_vx": {"freqs": freqs_vx.tolist(), "psd": psd_vx.tolist()},
                "spectrum_vy": {"freqs": freqs_vy.tolist(), "psd": psd_vy.tolist()}
            }
            historical_data.append(data_point)
        
        conn.close()
        
        # Si pas de données dans la base, générer des données simulées
        if not historical_data:
            print(f"📝 Aucune donnée trouvée pour {date_str}, génération de données simulées")
            historical_data = generate_historical_data(date_str, 48)
        
        return historical_data
        
    except Exception as e:
        print(f"❌ Erreur récupération données historiques: {e}")
        return generate_historical_data(date_str, 48)

@app.route('/api/dates', methods=['GET'])
def get_available_dates():
    """Retourne les dates disponibles"""
    print("📅 GET /api/dates")
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    all_dates = [today_str] + sorted([d for d in historical_dates if d != today_str], reverse=True)
    
    # Éviter les doublons
    unique_dates = []
    for date in all_dates:
        if date not in unique_dates:
            unique_dates.append(date)
    
    print(f"✅ Retourne {len(unique_dates)} dates")
    return jsonify(unique_dates[:50])

@app.route('/api/simulation/dates', methods=['GET'])
def get_simulation_dates():
    """Alias pour /api/dates"""
    return get_available_dates()

@app.route('/api/all-dates', methods=['GET'])
def get_all_dates():
    """Autre alias pour la compatibilité"""
    return get_available_dates()

@app.route('/api/latest', methods=['GET'])
def get_latest():
    """Dernière mesure - récupère depuis la base de données"""
    # Try to get latest from database first
    db_data = get_latest_from_db(1)
    
    if db_data and len(db_data) > 0:
        print(f"✅ Retourne dernière mesure depuis la base de données")
        return jsonify(db_data[0])
    
    # Fallback to in-memory data
    with data_lock:
        if latest_data:
            last_point = latest_data[-1]
            return jsonify(last_point)
    return jsonify({})

@app.route('/api/health', methods=['GET'])
def health():
    """Statut du système"""
    with data_lock:
        return jsonify({
            "status": "healthy",
            "realtime_data_points": len(latest_data),
            "historical_dates_count": len(historical_dates),
            "database_saving": "active",
            "timestamp": datetime.now().isoformat(),
            "today": datetime.now().strftime('%Y-%m-%d'),
            "refresh_rate": "60 seconds",
            "mode": "realtime_with_database_saving"
        })

def get_latest_from_db(limit=512):
    """Récupère les dernières données de la base de données"""
    try:
        conn = get_connection()
        if not conn:
            return []
        
        cursor = conn.cursor()
        query = f"""
            SELECT TOP ({limit}) 
                id, timestamp, vibration_x, vibration_y, vibration_z,
                vx_rms, vy_rms, pressure, current_value, running
            FROM dbo.COMPRESSEURDATA
            ORDER BY timestamp DESC
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        data = []
        for row in rows:
            # Generate PSD from vibration data
            freqs_vx, psd_vx = generate_psd_from_vibration(row[2] if row[2] else 0.8)
            freqs_vy, psd_vy = generate_psd_from_vibration(row[3] if row[3] else 0.7)
            
            data_point = {
                "id": row[0],
                "timestamp": row[1].isoformat() if hasattr(row[1], 'isoformat') else str(row[1]),
                "vibration_x": float(row[2]) if row[2] is not None else 0.0,
                "vibration_y": float(row[3]) if row[3] is not None else 0.0,
                "vibration_z": float(row[4]) if row[4] is not None else 0.0,
                "vx_rms": float(row[5]) if row[5] is not None else 0.0,
                "vy_rms": float(row[6]) if row[6] is not None else 0.0,
                "pressure": float(row[7]) if row[7] is not None else 0.0,
                "current_value": float(row[8]) if row[8] is not None else 0.0,
                "running": bool(row[9]) if row[9] is not None else True,
                "source": "database",
                "is_simulation": False,
                "spectrum_vx": {"freqs": freqs_vx.tolist(), "psd": psd_vx.tolist()},
                "spectrum_vy": {"freqs": freqs_vy.tolist(), "psd": psd_vy.tolist()}
            }
            data.append(data_point)
        
        conn.close()
        
        # Reverse to get chronological order
        return list(reversed(data))
        
    except Exception as e:
        print(f"❌ Erreur récupération données base: {e}")
        return []

@app.route('/api/timeseries', methods=['GET'])
def get_timeseries():
    """
    Endpoint pour les données de série temporelle - COMPATIBLE AVEC LE FRONTEND
    Params: n = nombre de points (défaut 200, max 5000)
    """
    n = request.args.get('n', '200')
    try:
        n = int(n)
        n = max(1, min(n, 5000))
    except ValueError:
        n = 200
    
    # Try to get data from database first (real collected data)
    db_data = get_latest_from_db(n)
    
    if db_data and len(db_data) > 0:
        print(f"✅ Retourne {len(db_data)} données depuis la base de données")
        return jsonify({
            "ok": True,
            "count": len(db_data),
            "data": db_data
        })
    
    # Fallback to in-memory data if database is empty
    with data_lock:
        timeseries_data = latest_data[-n:] if len(latest_data) >= n else latest_data
    
    print(f"⚠️ Base de données vide, retourne {len(timeseries_data)} données simulées")
    return jsonify({
        "ok": True,
        "count": len(timeseries_data),
        "data": timeseries_data
    })

@app.route('/api/historical', methods=['GET'])
def get_historical():
    """
    Endpoint pour les données historiques - COMPATIBLE AVEC LE FRONTEND
    Params:
      date = YYYY-MM-DD (requis)
      start = heure de début HH:MM (optionnel)
      end = heure de fin HH:MM (optionnel)
      limit = nombre max de points (optionnel, défaut 5000)
    """
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({"ok": False, "error": "date parameter is required"}), 400
    
    start_time = request.args.get('start', '00:00')
    end_time = request.args.get('end', '23:59')
    limit = request.args.get('limit', '5000')
    
    try:
        limit = int(limit)
        limit = max(1, min(limit, 10000))
    except ValueError:
        limit = 5000
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    # Si c'est aujourd'hui, retourner les données temps réel
    if date_str == today_str:
        with data_lock:
            historical_data = latest_data[-limit:] if len(latest_data) >= limit else latest_data
        return jsonify({
            "ok": True,
            "date": date_str,
            "count": len(historical_data),
            "data": historical_data
        })
    
    # Sinon, récupérer de la base de données
    historical_data = get_historical_data_from_db(date_str)
    
    # Limiter le nombre de résultats
    if len(historical_data) > limit:
        historical_data = historical_data[-limit:]
    
    return jsonify({
        "ok": True,
        "date": date_str,
        "count": len(historical_data),
        "data": historical_data
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Statistiques de la base de données"""
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"})
            
        cursor = conn.cursor()
        
        # Nombre total d'enregistrements
        cursor.execute("SELECT COUNT(*) FROM dbo.COMPRESSEURDATA")
        total_records = cursor.fetchone()[0]
        
        # Date du premier enregistrement
        cursor.execute("SELECT MIN(timestamp) FROM dbo.COMPRESSEURDATA")
        first_record = cursor.fetchone()[0]
        
        # Date du dernier enregistrement
        cursor.execute("SELECT MAX(timestamp) FROM dbo.COMPRESSEURDATA")
        last_record = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            "total_records": total_records,
            "first_record": first_record.isoformat() if first_record else None,
            "last_record": last_record.isoformat() if last_record else None,
            "database_size": "active"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/', methods=['GET'])
def home():
    """Page d'accueil"""
    with data_lock:
        data_count = len(latest_data)
    
    today = datetime.now().strftime('%Y-%m-%d')
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>FactoryEYE - Avec Sauvegarde Base</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }}
            .container {{ max-width: 1000px; margin: 0 auto; }}
            .header {{ background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }}
            .card {{ background: white; padding: 20px; margin: 10px 0; border-radius: 8px; }}
            .endpoint {{ background: #f8f9fa; padding: 12px; margin: 8px 0; border-left: 4px solid #007cba; }}
            .status {{ display: flex; gap: 20px; flex-wrap: wrap; }}
            .status-item {{ background: #e8f4fd; padding: 10px 15px; border-radius: 6px; }}
            .feature {{ color: #059669; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏭 FactoryEYE - Système Complet</h1>
                <p><span class="feature">💾 SAUVEGARDE AUTOMATIQUE BASE DE DONNÉES</span></p>
                
                <div class="status">
                    <div class="status-item">
                        <strong>📅 Aujourd'hui:</strong> {today}
                    </div>
                    <div class="status-item">
                        <strong>📊 Données temps réel:</strong> {data_count} points
                    </div>
                    <div class="status-item">
                        <strong>📅 Dates historiques:</strong> {len(historical_dates)} dates
                    </div>
                    <div class="status-item">
                        <strong>💾 Sauvegarde:</strong> Active
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h2>🎯 Fonctionnalités</h2>
                <ul>
                    <li><span class="feature">✅ Génération données temps réel</span> (toutes les 60s)</li>
                    <li><span class="feature">✅ Sauvegarde automatique base de données</span></li>
                    <li><span class="feature">✅ Consultation historique complet</span></li>
                    <li><span class="feature">✅ Scan automatique des dates</span></li>
                </ul>
            </div>
            
            <div class="card">
                <h2>🔗 Endpoints</h2>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/data">/api/data</a></strong>
                    <p>Données temps réel (sauvegardées automatiquement)</p>
                </div>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/dates">/api/dates</a></strong>
                    <p>Dates disponibles (base de données + aujourd'hui)</p>
                </div>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/stats">/api/stats</a></strong>
                    <p>Statistiques de la base de données</p>
                </div>
                
                <div class="endpoint">
                    <strong>GET <a href="/api/data?date={today}">/api/data?date={today}</a></strong>
                    <p>Données d'aujourd'hui (depuis la base)</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

if __name__ == '__main__':
    print("🚀 Démarrage de FactoryEYE avec Sauvegarde Base de Données...")
    print("="*60)
    
    # Initialiser la base de données
    print("📦 Initialisation de la base de données...")
    database_initializer()
    
    # Scan initial des dates historiques
    print("🔍 Premier scan des dates historiques...")
    scan_historical_dates()
    
    # Données initiales temps réel
    print("🔄 Génération des données temps réel initiales...")
    for i in range(5):
        new_data = generate_realtime_data()
        latest_data.append(new_data)
        save_to_database(new_data)  # Sauvegarder les données initiales
        time.sleep(1)
    
    # Démarrer les threads
    realtime_thread = threading.Thread(target=realtime_data_generator, daemon=True)
    historical_thread = threading.Thread(target=historical_scanner, daemon=True)
    
    realtime_thread.start()
    historical_thread.start()
    
    print("="*60)
    print("✅ SYSTÈME COMPLET DÉMARRÉ AVEC SUCCÈS!")
    print(f"📅 Aujourd'hui: {datetime.now().strftime('%Y-%m-%d')}")
    print(f"📊 Données temps réel: {len(latest_data)} points")
    print(f"📅 Dates historiques: {len(historical_dates)} dates")
    print("💾 Sauvegarde automatique: ACTIVÉE")
    print("⏱️  Rafraîchissement: 60 secondes")
    print("\n🌐 ENDPOINTS:")
    print("   ✅ GET /api/data")
    print("   ✅ GET /api/dates") 
    print("   ✅ GET /api/stats")
    print("   ✅ GET /api/health")
    print("="*60)
    
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)