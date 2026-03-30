import os
import time
import datetime
import threading
import traceback
from collections import deque
from typing import Any, Dict, Tuple
 
import numpy as np
from scipy import signal
from scipy.stats import kurtosis, skew
import pyodbc
from flask import Flask, jsonify, request
from flask_cors import CORS
from opcua import Client
from opcua.crypto import uacrypto
 
# =============================
# CONFIG
# =============================
 
# ---- OPC UA ----
OPCUA_ENDPOINT = os.getenv("OPCUA_ENDPOINT", "opc.tcp://10.190.50.101:4840")
APPLICATION_URI = os.getenv("OPCUA_APP_URI", "urn:FactoryEYE:OPCUA:PythonClient")
 
PLC_USER = os.getenv("PLC_USER", "admin")
PLC_PASSWORD = os.getenv("PLC_PASSWORD", "85a37517")
 
CLIENT_CERT = os.getenv("OPCUA_CLIENT_CERT", "client_cert.pem")
CLIENT_KEY  = os.getenv("OPCUA_CLIENT_KEY",  "client_key.pem")
 
SECURITY_STRING = os.getenv(
    "OPCUA_SECURITY",
    f"Basic256Sha256,SignAndEncrypt,{CLIENT_CERT},{CLIENT_KEY}"
)
 
NODE_VX = os.getenv("NODE_VX", "ns=6;s=Arp.Plc.Eclr/g_rawIN01")
NODE_I  = os.getenv("NODE_I",  "ns=6;s=Arp.Plc.Eclr/g_rawIN02")
 
# Acquisition timing
INTERVAL_S = float(os.getenv("INTERVAL_S", "1.0"))
FS = float(os.getenv("FS", str(1.0 / INTERVAL_S)))  # sampling frequency
WINDOW_SEC = float(os.getenv("WINDOW_SEC", "10"))
BUFFER_LEN = max(20, int(FS * WINDOW_SEC))
 
# PSD bands (Hz)
PSD_BANDS = [
    (0.0, 10.0),
    (10.0, 100.0),
    (100.0, 500.0),
    (500.0, 1000.0)
]
 
PSD_MAX_POINTS = int(os.getenv("PSD_MAX_POINTS", "200"))
 
# ---- Pressure model (example) ----
# pressure = A*vx_rms + B*i_mean + C  (you can change later)
CAL_A = float(os.getenv("CAL_A", "0.0"))
CAL_B = float(os.getenv("CAL_B", "0.0"))
CAL_C = float(os.getenv("CAL_C", "0.0"))
 
# ---- SQL ----
SQL_SERVER_IP = os.getenv("SQL_SERVER_IP", "10.190.50.153")
SQL_PORT = int(os.getenv("SQL_PORT", "1433"))
SQL_DB = os.getenv("SQL_DB", "FactoryEYE")
SQL_TABLE = os.getenv("SQL_TABLE", "[dbo].[COMPRESSEURDATA]")
ODBC_DRIVER = os.getenv("ODBC_DRIVER", "ODBC Driver 17 for SQL Server")
 
USE_WINDOWS_AUTH = os.getenv("USE_WINDOWS_AUTH", "1") == "1"
SQL_USER = os.getenv("SQL_USER", "plc_logger")
SQL_PASS = os.getenv("SQL_PASS", "")
 
# ---- Simulation Mode ----
# Set to "1" or "true" to enable simulation mode (generates fake data without PLC)
SIMULATION_MODE = os.getenv("SIMULATION_MODE", "0") in ("1", "true", "True")
# Save simulation data to SQL (set to "0" to disable)
SAVE_SIMULATION_TO_SQL = os.getenv("SAVE_SIMULATION_TO_SQL", "0") == "1"
 
# =============================
# UTILS
# =============================
 
def utcnow() -> datetime.datetime:
    return datetime.datetime.utcnow()
 
def downsample_xy(x: np.ndarray, y: np.ndarray, max_points: int) -> Tuple[list, list]:
    x = np.asarray(x)
    y = np.asarray(y)
    if len(x) <= max_points:
        return x.tolist(), y.tolist()
    idx = np.linspace(0, len(x) - 1, max_points).astype(int)
    return x[idx].tolist(), y[idx].tolist()
 
def band_energy(freqs: np.ndarray, psd: np.ndarray, fmin: float, fmax: float) -> float:
    mask = (freqs >= fmin) & (freqs <= fmax)
    if not np.any(mask):
        return 0.0
    y = np.asarray(psd[mask], dtype=float)
    x = np.asarray(freqs[mask], dtype=float)
    # Prefer numpy.trapz when available, but some numpy builds in restricted envs
    # may not expose it; provide a safe fallback implementation.
    try:
        return float(np.trapz(y, x))
    except AttributeError:
        if x.size < 2:
            return 0.0
        dx = x[1:] - x[:-1]
        return float(np.sum(dx * (y[1:] + y[:-1]) / 2.0))
 
# =============================
# SQL
# =============================
 
def sql_connect() -> pyodbc.Connection:
    server_part = f"tcp:{SQL_SERVER_IP},{SQL_PORT}"
    if USE_WINDOWS_AUTH:
        conn_str = (
            f"DRIVER={{{ODBC_DRIVER}}};"
            f"SERVER={server_part};"
            f"DATABASE={SQL_DB};"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
        )
    else:
        conn_str = (
            f"DRIVER={{{ODBC_DRIVER}}};"
            f"SERVER={server_part};"
            f"DATABASE={SQL_DB};"
            f"UID={SQL_USER};"
            f"PWD={SQL_PASS};"
            "TrustServerCertificate=yes;"
        )
    return pyodbc.connect(conn_str, autocommit=True)
 
def save_to_database(row: Dict[str, Any]) -> None:
    """
    Inserts into dbo.COMPRESSEURDATA with KPIs columns.
    Make sure SQL ALTER TABLE has been executed.
    """
    insert_sql = f"""
    INSERT INTO {SQL_TABLE} (
        [timestamp],
        [pressure],
        [current_value],
        [vibration_x],
        [vibration_y],
        [vibration_z],
 
        [vx_rms],
        [vx_peak],
        [vx_p2p],
        [vx_crest_factor],
        [vx_kurtosis],
        [vx_skewness],
        [vx_dom_freq_hz],
        [vx_band_0_10],
        [vx_band_10_100],
        [vx_band_100_500],
        [vx_band_500_1000]
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
 
    with sql_connect() as conn:
        cur = conn.cursor()
        cur.execute(
            insert_sql,
            (
                row["timestamp"],
                row["pressure"],
                row["current_value"],
                row["vibration_x"],
                row.get("vibration_y"),
                row.get("vibration_z"),
 
                row["vx_rms"],
                row["vx_peak"],
                row["vx_p2p"],
                row["vx_crest_factor"],
                row["vx_kurtosis"],
                row["vx_skewness"],
                row["vx_dom_freq_hz"],
                row["vx_band_0_10"],
                row["vx_band_10_100"],
                row["vx_band_100_500"],
                row["vx_band_500_1000"],
            )
        )
 
# =============================
# OPC UA
# =============================
 
def opcua_make_client() -> Client:
    c = Client(OPCUA_ENDPOINT)
    c.timeout = 10
    c.application_uri = APPLICATION_URI
    c.set_security_string(SECURITY_STRING)
    c.set_user(PLC_USER)
    c.set_password(PLC_PASSWORD)
    return c
 
# =============================
# KPIs + MODEL
# =============================
 
def estimate_pressure(vx_rms: float, i_mean: float) -> float:
    # Example model (replace with your own transformation later)
    return (CAL_A * vx_rms) + (CAL_B * i_mean) + CAL_C
 
def compute_kpis(vx_arr: np.ndarray) -> Dict[str, float]:
    vx_arr = np.asarray(vx_arr, dtype=float)
 
    vx_rms = float(np.sqrt(np.mean(vx_arr ** 2)))
    vx_peak = float(np.max(np.abs(vx_arr)))
    vx_p2p = float(np.max(vx_arr) - np.min(vx_arr))
    vx_crest = float(vx_peak / vx_rms) if vx_rms > 1e-12 else 0.0
 
    # Use fisher=False so a normal distribution gives ~3
    vx_kurt = float(kurtosis(vx_arr, fisher=False, bias=False)) if len(vx_arr) >= 4 else 0.0
    vx_skew = float(skew(vx_arr, bias=False)) if len(vx_arr) >= 3 else 0.0
 
    # Welch PSD
    freqs, psd = signal.welch(vx_arr - np.mean(vx_arr), fs=FS, nperseg=min(256, len(vx_arr)))
    freqs = np.asarray(freqs, dtype=float)
    psd = np.maximum(np.asarray(psd, dtype=float), 1e-20)
 
    vx_dom_freq = float(freqs[int(np.argmax(psd))]) if len(freqs) else 0.0
 
    b0_10 = band_energy(freqs, psd, 0.0, 10.0)
    b10_100 = band_energy(freqs, psd, 10.0, 100.0)
    b100_500 = band_energy(freqs, psd, 100.0, 500.0)
    b500_1000 = band_energy(freqs, psd, 500.0, 1000.0)
 
    return {
        "vx_rms": vx_rms,
        "vx_peak": vx_peak,
        "vx_p2p": vx_p2p,
        "vx_crest_factor": vx_crest,
        "vx_kurtosis": vx_kurt,
        "vx_skewness": vx_skew,
        "vx_dom_freq_hz": vx_dom_freq,
        "vx_band_0_10": b0_10,
        "vx_band_10_100": b10_100,
        "vx_band_100_500": b100_500,
        "vx_band_500_1000": b500_1000,
        "freqs": freqs,
        "psd": psd,
    }
 
# =============================
# RUNTIME STORAGE FOR API
# =============================
 
vx_buf = deque(maxlen=BUFFER_LEN)
i_buf  = deque(maxlen=BUFFER_LEN)
 
latest_lock = threading.Lock()
latest_data: deque = deque(maxlen=500)
 
# =============================
# SIMULATION MODE
# =============================
 
def generate_simulation_data():
    """
    Generate simulated vibration and current data for testing.
    Returns (vx, current) tuple with realistic-looking values.
    """
    # Base values with some variation
    t = time.time()
   
    # Simulate vibration signal with multiple frequency components
    base_vx = 50.0  # Base vibration amplitude
    vx = base_vx + \
         10.0 * np.sin(2 * np.pi * 5 * t) + \
         5.0 * np.sin(2 * np.pi * 25 * t) + \
         2.0 * np.sin(2 * np.pi * 100 * t) + \
         np.random.normal(0, 1)  # Add some noise
   
    # Simulate current (correlated with vibration)
    base_current = 15.0
    current = base_current + \
              2.0 * np.sin(2 * np.pi * 0.5 * t) + \
              np.random.normal(0, 0.5)
   
    return float(vx), float(current)
 
# =============================
# ACQUISITION THREAD
# =============================
 
def acquisition_loop():
    # If simulation mode, use simulation function
    if SIMULATION_MODE:
        acquisition_loop_simulation()
        return
   
    # Original PLC-based acquisition
    ua = None
    n_vx = None
    n_i = None
    backoff = 2.0
 
    print("[START] PLC OPC UA -> SQL Logger (KPIs)")
    print("[INFO] OPCUA endpoint:", OPCUA_ENDPOINT)
    print("[INFO] Security:", SECURITY_STRING)
    print("[INFO] Nodes:", {"vx": NODE_VX, "current": NODE_I})
    print("[INFO] INTERVAL_S:", INTERVAL_S, "FS:", FS, "BUFFER_LEN:", BUFFER_LEN)
    print("[INFO] SQL:", f"{SQL_SERVER_IP}:{SQL_PORT}/{SQL_DB} table={SQL_TABLE} windows_auth={USE_WINDOWS_AUTH}")
 
    while True:
        try:
            if ua is None:
                ua = opcua_make_client()
                ua.connect()
                n_vx = ua.get_node(NODE_VX)
                n_i  = ua.get_node(NODE_I)
                print("[OK] OPC UA connected")
 
            vx = float(n_vx.get_value())
            cur = float(n_i.get_value())
 
            vx_buf.append(vx)
            i_buf.append(cur)
 
            if len(vx_buf) < 20:
                time.sleep(INTERVAL_S)
                continue
 
            vx_arr = np.array(vx_buf, dtype=float)
            i_arr  = np.array(i_buf, dtype=float)
 
            i_mean = float(np.mean(i_arr))
            kpi = compute_kpis(vx_arr)
 
            pressure = float(estimate_pressure(kpi["vx_rms"], i_mean))
            ts = utcnow()
 
            # Insert into SQL
            row = {
                "timestamp": ts,
                "pressure": pressure,
                "current_value": i_mean,
                "vibration_x": vx,
                "vibration_y": None,
                "vibration_z": None,
 
                "vx_rms": kpi["vx_rms"],
                "vx_peak": kpi["vx_peak"],
                "vx_p2p": kpi["vx_p2p"],
                "vx_crest_factor": kpi["vx_crest_factor"],
                "vx_kurtosis": kpi["vx_kurtosis"],
                "vx_skewness": kpi["vx_skewness"],
                "vx_dom_freq_hz": kpi["vx_dom_freq_hz"],
                "vx_band_0_10": kpi["vx_band_0_10"],
                "vx_band_10_100": kpi["vx_band_10_100"],
                "vx_band_100_500": kpi["vx_band_100_500"],
                "vx_band_500_1000": kpi["vx_band_500_1000"],
            }
            save_to_database(row)
 
            # API record (with spectrum)
            freqs_list, psd_list = downsample_xy(kpi["freqs"], kpi["psd"], PSD_MAX_POINTS)
 
            api_row = {
                "timestamp": ts.isoformat() + "Z",
                "vibration_x": vx,
                "current_value": i_mean,
                "pressure": pressure,
 
                "vx_rms": kpi["vx_rms"],
                "vx_peak": kpi["vx_peak"],
                "vx_p2p": kpi["vx_p2p"],
                "vx_crest_factor": kpi["vx_crest_factor"],
                "vx_kurtosis": kpi["vx_kurtosis"],
                "vx_skewness": kpi["vx_skewness"],
                "vx_dom_freq_hz": kpi["vx_dom_freq_hz"],
                "vx_band_0_10": kpi["vx_band_0_10"],
                "vx_band_10_100": kpi["vx_band_10_100"],
                "vx_band_100_500": kpi["vx_band_100_500"],
                "vx_band_500_1000": kpi["vx_band_500_1000"],
 
                "spectrum_vx": {"freqs": freqs_list, "psd": psd_list},
                "source": "opcua_real",
                "is_simulation": False
            }
 
            with latest_lock:
                latest_data.append(api_row)
 
            print(
                f"[INSERT] {api_row['timestamp']} "
                f"vx={vx:.2f} rms={kpi['vx_rms']:.4f} peak={kpi['vx_peak']:.2f} crest={kpi['vx_crest_factor']:.2f} "
                f"kurt={kpi['vx_kurtosis']:.2f} domF={kpi['vx_dom_freq_hz']:.2f}Hz "
                f"P={pressure:.3f} I={i_mean:.3f}"
            )
 
            backoff = 2.0
            time.sleep(INTERVAL_S)
 
        except Exception as e:
            print("\n[ERROR]", str(e))
            traceback.print_exc()
 
            try:
                if ua is not None:
                    ua.disconnect()
            except Exception:
                pass
 
            ua = None
            n_vx = None
            n_i = None
 
            print(f"[RETRY] sleeping {backoff:.1f}s ...")
            time.sleep(backoff)
            backoff = min(30.0, backoff * 1.7)
 
 
def acquisition_loop_simulation():
    """
    Simulation mode: generates fake data without PLC connection.
    Useful for testing when PLC is not available.
    """
    print("[START] SIMULATION MODE - Generating fake data")
    print("[INFO] SIMULATION_MODE enabled")
    print("[INFO] SAVE_SIMULATION_TO_SQL:", SAVE_SIMULATION_TO_SQL)
    print("[INFO] INTERVAL_S:", INTERVAL_S, "FS:", FS, "BUFFER_LEN:", BUFFER_LEN)
   
    if not SAVE_SIMULATION_TO_SQL:
        print("[INFO] SQL writes DISABLED for simulation mode")
    else:
        print("[INFO] SQL:", f"{SQL_SERVER_IP}:{SQL_PORT}/{SQL_DB} table={SQL_TABLE}")
 
    while True:
        try:
            # Generate simulated data
            vx, cur = generate_simulation_data()
 
            vx_buf.append(vx)
            i_buf.append(cur)
 
            if len(vx_buf) < 20:
                time.sleep(INTERVAL_S)
                continue
 
            vx_arr = np.array(vx_buf, dtype=float)
            i_arr  = np.array(i_buf, dtype=float)
 
            i_mean = float(np.mean(i_arr))
            kpi = compute_kpis(vx_arr)
 
            pressure = float(estimate_pressure(kpi["vx_rms"], i_mean))
            ts = utcnow()
 
            # Insert into SQL only if enabled
            if SAVE_SIMULATION_TO_SQL:
                row = {
                    "timestamp": ts,
                    "pressure": pressure,
                    "current_value": i_mean,
                    "vibration_x": vx,
                    "vibration_y": None,
                    "vibration_z": None,
 
                    "vx_rms": kpi["vx_rms"],
                    "vx_peak": kpi["vx_peak"],
                    "vx_p2p": kpi["vx_p2p"],
                    "vx_crest_factor": kpi["vx_crest_factor"],
                    "vx_kurtosis": kpi["vx_kurtosis"],
                    "vx_skewness": kpi["vx_skewness"],
                    "vx_dom_freq_hz": kpi["vx_dom_freq_hz"],
                    "vx_band_0_10": kpi["vx_band_0_10"],
                    "vx_band_10_100": kpi["vx_band_10_100"],
                    "vx_band_100_500": kpi["vx_band_100_500"],
                    "vx_band_500_1000": kpi["vx_band_500_1000"],
                }
                save_to_database(row)
                sql_status = "SQL"
            else:
                sql_status = "NO-SQL"
 
            # API record (with spectrum)
            freqs_list, psd_list = downsample_xy(kpi["freqs"], kpi["psd"], PSD_MAX_POINTS)
 
            api_row = {
                "timestamp": ts.isoformat() + "Z",
                "vibration_x": vx,
                "current_value": i_mean,
                "pressure": pressure,
 
                "vx_rms": kpi["vx_rms"],
                "vx_peak": kpi["vx_peak"],
                "vx_p2p": kpi["vx_p2p"],
                "vx_crest_factor": kpi["vx_crest_factor"],
                "vx_kurtosis": kpi["vx_kurtosis"],
                "vx_skewness": kpi["vx_skewness"],
                "vx_dom_freq_hz": kpi["vx_dom_freq_hz"],
                "vx_band_0_10": kpi["vx_band_0_10"],
                "vx_band_10_100": kpi["vx_band_10_100"],
                "vx_band_100_500": kpi["vx_band_100_500"],
                "vx_band_500_1000": kpi["vx_band_500_1000"],
 
                "spectrum_vx": {"freqs": freqs_list, "psd": psd_list},
                "source": "simulation",
                "is_simulation": True
            }
 
            with latest_lock:
                latest_data.append(api_row)
 
            print(
                f"[SIMULATION] {api_row['timestamp']} "
                f"vx={vx:.2f} rms={kpi['vx_rms']:.4f} peak={kpi['vx_peak']:.2f} crest={kpi['vx_crest_factor']:.2f} "
                f"kurt={kpi['vx_kurtosis']:.2f} domF={kpi['vx_dom_freq_hz']:.2f}Hz "
                f"P={pressure:.3f} I={i_mean:.3f} [{sql_status}]"
            )
 
            time.sleep(INTERVAL_S)
 
        except Exception as e:
            print("\n[SIMULATION ERROR]", str(e))
            traceback.print_exc()
            time.sleep(INTERVAL_S)
 
# =============================
# API
# =============================
 
app = Flask(__name__)
CORS(app)
 
@app.get("/health")
def health():
    return jsonify({"ok": True})
 
@app.get("/api/latest")
def api_latest():
    with latest_lock:
        if not latest_data:
            return jsonify({"ok": False, "error": "no data yet"}), 404
        return jsonify({"ok": True, "data": latest_data[-1]})
 
@app.get("/api/timeseries")
def api_timeseries():
    n = int(request.args.get("n", "200"))
    n = max(1, min(n, 5000))
    with latest_lock:
        data = list(latest_data)[-n:]
    return jsonify({"ok": True, "count": len(data), "data": data})
 
# =============================
# START
# =============================
 
if __name__ == "__main__":
    if PLC_PASSWORD == "CHANGE_ME_PLC_PASSWORD":
        print("[FATAL] Set PLC_PASSWORD first.")
        print('Example:')
        print('  $env:PLC_PASSWORD="your_plc_password"')
        raise SystemExit(1)
 
    t = threading.Thread(target=acquisition_loop, daemon=True)
    t.start()
 
    app.run(host="0.0.0.0", port=5000, debug=False)