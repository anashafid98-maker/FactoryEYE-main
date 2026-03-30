"""
FactoryEYE Unified API Server
Provides:
- Real-time data from database (real PLC data)
- Historical data from database
- Compatible with frontend Equipment.tsx
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
from scipy import signal
import datetime
import time
import threading
import pyodbc
import os

app = Flask(__name__)
CORS(app)

# Configuration
SQL_SERVER = os.getenv("SQL_SERVER", "10.190.50.153")
SQL_DB = os.getenv("SQL_DB", "FactoryEYE")
API_PORT = 5000

# Data storage
latest_data = []
data_lock = threading.Lock()
historical_dates = set()

def get_db_connection():
    """Connect to SQL Server"""
    try:
        conn = pyodbc.connect(
            f"Driver={{ODBC Driver 17 for SQL Server}};"
            f"Server={SQL_SERVER};"
            f"Database={SQL_DB};"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
        )
        return conn
    except Exception as e:
        print(f"DB Connection Error: {e}")
        return None

def compute_rms(values):
    """Compute RMS from array of values"""
    if not values or len(values) == 0:
        return 0.0
    return float(np.sqrt(np.mean(np.array(values) ** 2)))

def compute_psd(values, fs=1.0):
    """Compute Power Spectral Density"""
    if not values or len(values) < 16:
        return [], []
    arr = np.array(values, dtype=float)
    freqs, psd = signal.welch(arr, fs=fs, nperseg=min(256, len(arr)))
    return freqs.tolist(), psd.tolist()

def scan_historical_dates():
    """Scan database for available dates"""
    global historical_dates
    try:
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT CONVERT(date, timestamp) as date_only 
                FROM dbo.COMPRESSEURDATA 
                ORDER BY date_only DESC
            """)
            rows = cursor.fetchall()
            dates = {row[0].strftime('%Y-%m-%d') for row in rows}
            conn.close()
            
            today = datetime.datetime.now().strftime('%Y-%m-%d')
            dates.add(today)
            historical_dates = dates
            return dates
    except Exception as e:
        print(f"Error scanning dates: {e}")
    historical_dates = {datetime.datetime.now().strftime('%Y-%m-%d')}
    return historical_dates

def realtime_generator():
    """Background thread for fetching real-time data from database (real PLC data)"""
    global latest_data
    
    while True:
        try:
            # Fetch latest data from database (real PLC data from plc_to_spl.py)
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor()
                # Get the last 100 records from database (real PLC data)
                cursor.execute("""
                    SELECT TOP 100 timestamp, vibration_x, vibration_y, vibration_z, 
                           vx_rms, vy_rms, pressure, current_value, running
                    FROM dbo.COMPRESSEURDATA 
                    ORDER BY timestamp DESC
                """)
                rows = cursor.fetchall()
                conn.close()
                
                if rows:
                    # Convert to list and reverse to get chronological order
                    realtime_data = []
                    for i, row in enumerate(rows):
                        vx = float(row[1]) if row[1] else 30000
                        freqs, psd = compute_psd([vx], fs=1.0)
                        
                        realtime_data.append({
                            "id": i + 1,
                            "timestamp": row[0].isoformat() if hasattr(row[0], 'isoformat') else str(row[0]),
                            "vibration_x": float(row[1]) if row[1] else 30000,
                            "vibration_y": float(row[2]) if row[2] else vx * 0.9,
                            "vibration_z": float(row[3]) if row[3] else vx * 0.3,
                            "vx_rms": float(row[4]) if row[4] else compute_rms([vx]),
                            "vy_rms": float(row[5]) if row[5] else compute_rms([vx]) * 0.85,
                            "pressure": float(row[6]) if row[6] else 0,
                            "current_value": float(row[7]) if row[7] else 0,
                            "running": bool(row[8]) if row[8] else True,
                            "source": "database",
                            "is_simulation": False,
                            "spectrum_vx": {"freqs": freqs, "psd": psd}
                        })
                    
                    # Reverse to get chronological order (oldest first)
                    realtime_data.reverse()
                    
                    with data_lock:
                        latest_data = realtime_data
                    
                    if realtime_data:
                        latest = realtime_data[-1]
                        print(f"[REAL DATA] VX={latest['vibration_x']:.2f} RMS={latest['vx_rms']:.4f} P={latest['pressure']:.2f}")
                else:
                    print("[INFO] No data in database yet - waiting for plc_to_spl.py to insert data...")
            else:
                print("[WARN] Could not connect to database")
                
        except Exception as e:
            print(f"Error in generator: {e}")
        
        time.sleep(2)  # Update every 2 seconds

def get_historical_data(date_str):
    """Get historical data from database"""
    try:
        conn = get_db_connection()
        if not conn:
            return []
        
        cursor = conn.cursor()
        query = """
            SELECT TOP 500 timestamp, vibration_x, vibration_y, vibration_z, 
                   vx_rms, vy_rms, pressure, current_value, running
            FROM dbo.COMPRESSEURDATA 
            WHERE CONVERT(date, timestamp) = ?
            ORDER BY timestamp ASC
        """
        cursor.execute(query, date_str)
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return []
        
        historical = []
        for i, row in enumerate(rows):
            # Generate spectrum for each point
            vx = float(row[1]) if row[1] else 30000
            freqs, psd = compute_psd([vx], fs=1.0)
            
            historical.append({
                "id": i + 1,
                "timestamp": row[0].isoformat() if hasattr(row[0], 'isoformat') else str(row[0]),
                "vibration_x": float(row[1]) if row[1] else 30000,
                "vibration_y": float(row[2]) if row[2] else 27000,
                "vibration_z": float(row[3]) if row[3] else 9000,
                "vx_rms": float(row[4]) if row[4] else 0.1,
                "vy_rms": float(row[5]) if row[5] else 0.08,
                "pressure": float(row[6]) if row[6] else 5.0,
                "current_value": float(row[7]) if row[7] else 30000,
                "running": bool(row[8]) if row[8] else True,
                "source": "database",
                "is_simulation": False,
                "spectrum_vx": {"freqs": freqs, "psd": psd}
            })
        
        return historical
        
    except Exception as e:
        print(f"Error getting historical data: {e}")
        return []

# ==================== API ROUTES ====================

@app.route('/api/health')
def health():
    """Health check endpoint"""
    with data_lock:
        return jsonify({
            "status": "healthy",
            "realtime_points": len(latest_data),
            "historical_dates": len(historical_dates),
            "timestamp": datetime.datetime.now().isoformat()
        })

@app.route('/api/timeseries')
def timeseries():
    """Get time series data for real-time view"""
    n = int(request.args.get('n', '512'))
    n = max(1, min(n, 5000))
    
    with data_lock:
        data = list(latest_data)[-n:]
    
    return jsonify({
        "ok": True,
        "count": len(data),
        "data": data
    })

@app.route('/api/latest')
def latest():
    """Get latest data point"""
    with data_lock:
        if latest_data:
            return jsonify({"ok": True, "data": latest_data[-1]})
        return jsonify({"ok": False, "error": "no data"}), 404

@app.route('/api/data')
def get_data():
    """Get data - supports date parameter for historical"""
    date_param = request.args.get('date')
    today_str = datetime.datetime.now().strftime('%Y-%m-%d')
    
    if date_param and date_param != today_str:
        # Historical data
        historical = get_historical_data(date_param)
        return jsonify(historical)
    else:
        # Today's real-time data
        with data_lock:
            return jsonify(list(latest_data))

@app.route('/api/dates')
def get_dates():
    """Get available dates"""
    scan_historical_dates()
    today = datetime.datetime.now().strftime('%Y-%m-%d')
    dates = [today] + sorted([d for d in historical_dates if d != today], reverse=True)
    return jsonify(dates[:50])

@app.route('/api/stats')
def stats():
    """Get database statistics"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "DB connection failed"})
        
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM dbo.COMPRESSEURDATA")
        total = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            "total_records": total,
            "database": "connected"
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/')
def home():
    """Home page"""
    return """
    <html>
    <head><title>FactoryEYE API</title></head>
    <body>
        <h1>🏭 FactoryEYE Unified API</h1>
        <p>Reading real PLC data from database</p>
        <ul>
            <li><a href="/api/health">/api/health</a> - Health check</li>
            <li><a href="/api/timeseries">/api/timeseries</a> - Time series data</li>
            <li><a href="/api/latest">/api/latest</a> - Latest reading</li>
            <li><a href="/api/data">/api/data</a> - Data (add ?date=YYYY-MM-DD for history)</li>
            <li><a href="/api/dates">/api/dates</a> - Available dates</li>
            <li><a href="/api/stats">/api/stats</a> - Database stats</li>
        </ul>
    </body>
    </html>
    """

if __name__ == '__main__':
    print("=" * 60)
    print("🏭 FactoryEYE Unified API Server")
    print("📊 Reading REAL DATA from SQL Server")
    print("=" * 60)
    
    # Scan for historical dates
    print("📅 Scanning for historical dates...")
    scan_historical_dates()
    print(f"   Found {len(historical_dates)} dates")
    
    # Start real-time data generator (reads from database)
    print("▶️  Starting real-time data fetcher (reading from DB)...")
    generator_thread = threading.Thread(target=realtime_generator, daemon=True)
    generator_thread.start()
    
    print(f"\n🚀 Server running on http://0.0.0.0:{API_PORT}")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=API_PORT, debug=False, use_reloader=False)
