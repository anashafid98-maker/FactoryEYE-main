from flask import Flask, jsonify, request
from flask_cors import CORS
import time, threading
from datetime import datetime
import pyodbc
import numpy as np
from scipy import signal
import warnings
import os
import random
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

SQL_SERVER = os.getenv("SQL_SERVER", "10.190.50.153")
SQL_DB = os.getenv("SQL_DB", "FactoryEYE")

latest_data = {}
data_lock = threading.Lock()

def get_connection():
    try:
        conn = pyodbc.connect(
            f"Driver={{ODBC Driver 17 for SQL Server}};"
            f"Server={SQL_SERVER};"
            f"Database={SQL_DB};"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
        )
        print("[DB] Connexion reussie")
        return conn
    except Exception as e:
        print(f"[DB] Erreur de connexion: {e}")
        return None

def compute_kpis(vibration_value):
    try:
        # use reduced sampling frequency so generated spectrum spans only 0‑25 Hz
        fs = 50.0
        t = np.linspace(0, 1, int(fs))
        
        rpm = 1250
        fundamental_freq = rpm / 60
        
        amp = max(abs(float(vibration_value)), 0.1)
        
        signal_clean = amp * (
            np.sin(2 * np.pi * fundamental_freq * t) +
            0.5 * np.sin(2 * np.pi * fundamental_freq * 2 * t) +
            0.3 * np.sin(2 * np.pi * fundamental_freq * 3 * t)
        )
        
        noise = np.random.normal(0, 0.1 * amp, len(t))
        signal_with_noise = signal_clean + noise
        
        vx_peak = float(np.max(np.abs(signal_with_noise)))
        vx_rms = float(np.sqrt(np.mean(signal_with_noise ** 2)))
        vx_crest = float(vx_peak / vx_rms) if vx_rms > 0 else 0
        
        if np.std(signal_with_noise) > 0:
            vx_kurtosis = float(np.mean((signal_with_noise - np.mean(signal_with_noise))**4) / (np.std(signal_with_noise)**4) - 3)
        else:
            vx_kurtosis = 0
            
        freqs, psd = signal.welch(signal_with_noise, fs, nperseg=1024)
        dom_freq = float(freqs[np.argmax(psd)])
        
        return {
            "peak": vx_peak,
            "vx_rms": vx_rms,
            "crest": vx_crest,
            "kurtosis": vx_kurtosis,
            "dom_freq": dom_freq
        }
    except Exception as e:
        print(f"[KPI Error]: {e}")
        return {"peak": 0, "vx_rms": 0, "crest": 0, "kurtosis": 0, "dom_freq": 0}

def fetch_latest_from_db():
    conn = get_connection()
    if not conn:
        return None
    
    try:
        cur = conn.cursor()
        q = """
        SELECT TOP(1) 
            timestamp, vibration_x, pressure, current_value
        FROM dbo.COMPRESSEURDATA 
        ORDER BY timestamp DESC
        """
        cur.execute(q)
        row = cur.fetchone()
        
        if row:
            vibration_x = float(row[1]) if row[1] is not None else 0
            kpis = compute_kpis(vibration_x)
            
            return {
                "timestamp": row[0].isoformat() if hasattr(row[0], 'isoformat') else str(row[0]),
                "vx": vibration_x,
                "vx_rms": kpis["vx_rms"],
                "peak": kpis["peak"],
                "crest": kpis["crest"],
                "kurtosis": kpis["kurtosis"],
                "dom_freq": kpis["dom_freq"],
                "pressure": float(row[2]) if row[2] is not None else 0,
                "current": float(row[3]) if row[3] is not None else 0,
            }
    except Exception as e:
        print(f"[DB Fetch Error]: {e}")
    finally:
        conn.close()
    
    return None

def background_fetcher():
    global latest_data
    
    while True:
        try:
            data = fetch_latest_from_db()
            if data:
                with data_lock:
                    latest_data = data
                print(f"[API] Data: vx={data['vx']:.2f} rms={data['vx_rms']:.2f}")
            else:
                print("[API] No data from DB, using simulation")
                vib = 150 + random.uniform(-30, 30)
                kpis = compute_kpis(vib)
                
                with data_lock:
                    latest_data = {
                        "timestamp": datetime.now().isoformat(),
                        "vx": vib,
                        "vx_rms": kpis["vx_rms"],
                        "peak": kpis["peak"],
                        "crest": kpis["crest"],
                        "kurtosis": kpis["kurtosis"],
                        "dom_freq": kpis["dom_freq"],
                        "pressure": 6.5 + random.uniform(-1, 1),
                        "current": 32000 + random.uniform(-1000, 1000),
                    }
        except Exception as e:
            print(f"[Fetcher Error]: {e}")
        
        time.sleep(1)

@app.route('/api/latest')
def api_latest():
    with data_lock:
        if not latest_data:
            return jsonify({
                "timestamp": datetime.now().isoformat(),
                "vx": 0, "vx_rms": 0, "peak": 0, "crest": 0,
                "kurtosis": 0, "dom_freq": 0, "pressure": 0, "current": 0,
            })
        return jsonify(latest_data)

@app.route('/api/data')
def api_data():
    with data_lock:
        return jsonify([latest_data] if latest_data else [])

@app.route('/api/timeseries')
def api_timeseries():
    n = int(request.args.get("n", "60"))
    with data_lock:
        data_list = [latest_data] * min(n, 1)
    return jsonify({"ok": True, "count": len(data_list), "data": data_list})

@app.route('/api/health')
def health():
    with data_lock:
        return jsonify({"status": "healthy", "has_data": bool(latest_data), "timestamp": datetime.now().isoformat()})

@app.route('/')
def home():
    return "<h1>FactoryEYE API</h1><p>Endpoints: /api/latest, /api/data, /api/timeseries, /api/health</p>"

if __name__ == '__main__':
    print("=" * 50)
    print("FactoryEYE API Server")
    print(f"SQL: {SQL_SERVER}/{SQL_DB}")
    print("=" * 50)
    
    fetcher = threading.Thread(target=background_fetcher, daemon=True)
    fetcher.start()
    
    print("Server running on http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)

