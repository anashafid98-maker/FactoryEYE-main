import os
import pyodbc
from flask import Flask, jsonify, request
from flask_cors import CORS

# ----------------------------
# CONFIG
# ----------------------------
SQL_SERVER_IP = os.getenv("SQL_SERVER_IP", "10.190.50.153")
SQL_PORT = int(os.getenv("SQL_PORT", "1433"))
SQL_DB = os.getenv("SQL_DB", "FactoryEYE")
SQL_TABLE = os.getenv("SQL_TABLE", "dbo.COMPRESSEURDATA")
ODBC_DRIVER = os.getenv("ODBC_DRIVER", "ODBC Driver 17 for SQL Server")

USE_WINDOWS_AUTH = os.getenv("USE_WINDOWS_AUTH", "1") == "1"
SQL_USER = os.getenv("SQL_USER", "")
SQL_PASS = os.getenv("SQL_PASS", "")

# Column names (change here if your table uses different names)
COL_TS = os.getenv("COL_TS", "timestamp")
COL_VX = os.getenv("COL_VX", "vibration_x")
COL_P  = os.getenv("COL_P", "pressure")

app = Flask(__name__)
CORS(app)

def sql_connect():
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

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/api/latest")
def latest():
    """Return latest row with all KPIs."""
    with sql_connect() as conn:
        cur = conn.cursor()
        q = f"""
        SELECT TOP (1)
            [{COL_TS}] AS ts,
            [{COL_VX}] AS vx,
            [{COL_P}]  AS pressure,
            [current_value],
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
        FROM {SQL_TABLE}
        ORDER BY [{COL_TS}] DESC
        """
        row = cur.execute(q).fetchone()
        if not row:
            return jsonify({"ok": False, "error": "no data"}), 404
        return jsonify({
            "ok": True, 
            "timestamp": str(row.ts), 
            "vibration_x": float(row.vx) if row.vx is not None else 0, 
            "pressure": float(row.pressure) if row.pressure is not None else 0,
            "current_value": float(row.current_value) if row.current_value is not None else 0,
            "vx_rms": float(row.vx_rms) if row.vx_rms is not None else 0,
            "vx_peak": float(row.vx_peak) if row.vx_peak is not None else 0,
            "vx_p2p": float(row.vx_p2p) if row.vx_p2p is not None else 0,
            "vx_crest_factor": float(row.vx_crest_factor) if row.vx_crest_factor is not None else 0,
            "vx_kurtosis": float(row.vx_kurtosis) if row.vx_kurtosis is not None else 0,
            "vx_skewness": float(row.vx_skewness) if row.vx_skewness is not None else 0,
            "vx_dom_freq_hz": float(row.vx_dom_freq_hz) if row.vx_dom_freq_hz is not None else 0,
            "vx_band_0_10": float(row.vx_band_0_10) if row.vx_band_0_10 is not None else 0,
            "vx_band_10_100": float(row.vx_band_10_100) if row.vx_band_10_100 is not None else 0,
            "vx_band_100_500": float(row.vx_band_100_500) if row.vx_band_100_500 is not None else 0,
            "vx_band_500_1000": float(row.vx_band_500_1000) if row.vx_band_500_1000 is not None else 0,
        })

@app.get("/api/timeseries")
def timeseries():
    """
    Return last N points for plotting with all KPIs.
    Usage: /api/timeseries?n=200
    """
    n = int(request.args.get("n", "200"))
    n = max(1, min(n, 5000))

    with sql_connect() as conn:
        cur = conn.cursor()
        q = f"""
        SELECT TOP ({n})
            [{COL_TS}] AS ts,
            [{COL_VX}] AS vx,
            [{COL_P}]  AS pressure,
            [current_value],
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
        FROM {SQL_TABLE}
        ORDER BY [{COL_TS}] DESC
        """
        rows = cur.execute(q).fetchall()

    # reverse to chronological order
    rows = list(reversed(rows))

    return jsonify({
        "ok": True,
        "count": len(rows),
        "data": [
            {
                "timestamp": str(r.ts), 
                "vibration_x": float(r.vx) if r.vx is not None else 0, 
                "pressure": float(r.pressure) if r.pressure is not None else 0,
                "current_value": float(r.current_value) if r.current_value is not None else 0,
                "vx_rms": float(r.vx_rms) if r.vx_rms is not None else 0,
                "vx_peak": float(r.vx_peak) if r.vx_peak is not None else 0,
                "vx_p2p": float(r.vx_p2p) if r.vx_p2p is not None else 0,
                "vx_crest_factor": float(r.vx_crest_factor) if r.vx_crest_factor is not None else 0,
                "vx_kurtosis": float(r.vx_kurtosis) if r.vx_kurtosis is not None else 0,
                "vx_skewness": float(r.vx_skewness) if r.vx_skewness is not None else 0,
                "vx_dom_freq_hz": float(r.vx_dom_freq_hz) if r.vx_dom_freq_hz is not None else 0,
                "vx_band_0_10": float(r.vx_band_0_10) if r.vx_band_0_10 is not None else 0,
                "vx_band_10_100": float(r.vx_band_10_100) if r.vx_band_10_100 is not None else 0,
                "vx_band_100_500": float(r.vx_band_100_500) if r.vx_band_100_500 is not None else 0,
                "vx_band_500_1000": float(r.vx_band_500_1000) if r.vx_band_500_1000 is not None else 0,
            }
            for r in rows
        ]
    })

if __name__ == "__main__":
    # accessible from your network:
    app.run(host="0.0.0.0", port=5000, debug=False)
