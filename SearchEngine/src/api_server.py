from flask import Flask, jsonify
from flask_cors import CORS
import time, threading
from datetime import datetime
import pyodbc
import numpy as np
from scipy import signal
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Variable globale pour stocker les données
latest_data = []
data_lock = threading.Lock()

def get_connection():
    try:
        conn = pyodbc.connect("Driver={ODBC Driver 17 for SQL Server};Server=D-CZC929DNPY\\MSSQLSERVER01;Database=FactoryEYE;Trusted_Connection=yes;")
        print("[DB] Connexion réussie")
        return conn
    except Exception as e:
        print(f"[DB] Erreur de connexion: {e}")
        return None

def generate_psd_from_vibration(vibration_data, fs=2000.0):
    """Génère un PSD simulé à partir des données de vibration"""
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

def background_data_fetcher():
    """Thread qui récupère les données en continu"""
    global latest_data
    conn = None
    
    while True:
        try:
            if conn is None:
                conn = get_connection()
            
            if conn:
                # Récupère les dernières données
                cur = conn.cursor()
                q = """
                SELECT TOP(10) 
                    id, timestamp, vibration_x, vibration_y, vibration_z, 
                    vx_rms, vy_rms, pressure, current_value, running
                FROM dbo.COMPRESSEURDATA 
                ORDER BY timestamp DESC
                """
                cur.execute(q)
                rows = cur.fetchall()
                
                new_data = []
                for r in rows:
                    vibration_x = float(r[2]) if r[2] is not None else 1.0
                    vibration_y = float(r[3]) if r[3] is not None else 1.0
                    
                    freqs_vx, psd_vx = generate_psd_from_vibration(vibration_x)
                    freqs_vy, psd_vy = generate_psd_from_vibration(vibration_y)
                    
                    item = {
                        "id": r[0],
                        "timestamp": r[1].isoformat() if hasattr(r[1], 'isoformat') else str(r[1]),
                        "vibration_x": vibration_x,
                        "vibration_y": vibration_y,
                        "vibration_z": float(r[4]) if r[4] is not None else 0.0,
                        "vx_rms": float(r[5]) if r[5] is not None else 0.1,
                        "vy_rms": float(r[6]) if r[6] is not None else 0.1,
                        "pressure": float(r[7]) if r[7] is not None else 0.0,
                        "current_value": float(r[8]) if r[8] is not None else 0.0,
                        "running": bool(r[9]) if r[9] is not None else False,
                        "spectrum_vx": {"freqs": freqs_vx.tolist(), "psd": psd_vx.tolist()},
                        "spectrum_vy": {"freqs": freqs_vy.tolist(), "psd": psd_vy.tolist()}
                    }
                    new_data.append(item)
                
                with data_lock:
                    # Ajoute les nouvelles données
                    latest_data.extend(new_data)
                    # Garde seulement les 50 dernières valeurs
                    if len(latest_data) > 50:
                        latest_data = latest_data[-50:]
                
                print(f"[API] {len(new_data)} nouvelles données, total: {len(latest_data)}")
                
            else:
                # Simulation si pas de DB
                simulated_data = {
                    "id": len(latest_data) + 1,
                    "timestamp": datetime.now().isoformat(),
                    "vibration_x": max(np.random.uniform(0.5, 2.0), 0.1),
                    "vibration_y": max(np.random.uniform(0.5, 2.0), 0.1),
                    "vibration_z": max(np.random.uniform(0.5, 2.0), 0.1),
                    "vx_rms": max(np.random.uniform(0.1, 0.5), 0.01),
                    "vy_rms": max(np.random.uniform(0.1, 0.5), 0.01),
                    "pressure": max(np.random.uniform(5, 10), 0.1),
                    "current_value": max(np.random.uniform(10, 20), 0.1),
                    "running": True
                }
                
                freqs_vx, psd_vx = generate_psd_from_vibration(simulated_data["vibration_x"])
                freqs_vy, psd_vy = generate_psd_from_vibration(simulated_data["vibration_y"])
                
                simulated_data["spectrum_vx"] = {"freqs": freqs_vx.tolist(), "psd": psd_vx.tolist()}
                simulated_data["spectrum_vy"] = {"freqs": freqs_vy.tolist(), "psd": psd_vy.tolist()}
                
                with data_lock:
                    latest_data.append(simulated_data)
                    if len(latest_data) > 50:
                        latest_data.pop(0)
                
                print(f"[SIM] Donnée simulée ajoutée, total: {len(latest_data)}")
                
        except Exception as e:
            print(f"[API Error] {e}")
            conn = None
        
        time.sleep(2.0)  # Mise à jour toutes les 2 secondes

# Routes API
@app.route('/api/data')
def get_data():
    """Retourne toutes les données actuelles"""
    with data_lock:
        return jsonify(latest_data)

@app.route('/api/latest')
def get_latest():
    """Retourne seulement la dernière mesure"""
    with data_lock:
        if latest_data:
            return jsonify(latest_data[-1])
        return jsonify({})

@app.route('/api/health')
def health():
    with data_lock:
        return jsonify({
            "status": "healthy", 
            "data_points": len(latest_data),
            "timestamp": datetime.now().isoformat()
        })

@app.route('/')
def home():
    return """
    <h1>API FactoryEYE</h1>
    <p>Endpoints disponibles:</p>
    <ul>
        <li><a href="/api/data">/api/data</a> - Toutes les données</li>
        <li><a href="/api/latest">/api/latest</a> - Dernière mesure</li>
        <li><a href="/api/health">/api/health</a> - Statut du serveur</li>
    </ul>
    """

if __name__ == '__main__':
    # Initialise avec des données de test
    print("🔄 Initialisation des données...")
    with data_lock:
        # Ajoute une donnée de test initiale
        test_data = {
            "id": 1,
            "timestamp": datetime.now().isoformat(),
            "vibration_x": 1.0,
            "vibration_y": 1.0,
            "vibration_z": 1.0,
            "vx_rms": 0.1,
            "vy_rms": 0.1,
            "pressure": 5.0,
            "current_value": 10.0,
            "running": True,
            "spectrum_vx": {"freqs": list(np.linspace(0, 1000, 512)), "psd": [1e-6] * 512},
            "spectrum_vy": {"freqs": list(np.linspace(0, 1000, 512)), "psd": [1e-6] * 512}
        }
        latest_data.append(test_data)
    
    # Démarre le thread de collecte de données
    fetcher_thread = threading.Thread(target=background_data_fetcher, daemon=True)
    fetcher_thread.start()
    
    # Démarre le serveur Flask
    print("🚀 Serveur API démarré sur http://localhost:5000")
    print("📊 Endpoints disponibles:")
    print("   GET /api/data     - Toutes les données")
    print("   GET /api/latest   - Dernière mesure") 
    print("   GET /api/health   - Statut du serveur")
    print("   GET /             - Page d'accueil")
    
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)