import os

import pandas as pd

import pyodbc

from flask import Flask, request, jsonify

from flask_cors import CORS

from datetime import datetime, timedelta
import numpy as np
 
# =========================

# CONFIG (edit as needed)

# =========================

SQL_SERVER_IP = os.getenv("SQL_SERVER_IP", "10.190.50.153")

SQL_PORT = int(os.getenv("SQL_PORT", "1433"))

SQL_DB = os.getenv("SQL_DB", "FactoryEYE")

SQL_TABLE = os.getenv("SQL_TABLE", "dbo.COMPRESSEURDATA")
 
ODBC_DRIVER = os.getenv("ODBC_DRIVER", "ODBC Driver 17 for SQL Server")

USE_WINDOWS_AUTH = os.getenv("USE_WINDOWS_AUTH", "1") == "1"

SQL_USER = os.getenv("SQL_USER", "")

SQL_PASS = os.getenv("SQL_PASS", "")
 
# If your timestamp column name is different, change it here:

TS_COL = os.getenv("TS_COL", "timestamp")
 
# =========================

# SQL CONNECT

# =========================

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

    return pyodbc.connect(conn_str)
 
# =========================

# LOAD DATA

# =========================

def load_data(time_from=None, time_to=None) -> pd.DataFrame:

    """

    Loads table rows in a time range. If no range, loads all.

    time_from/time_to: ISO strings like '2026-03-01T00:00:00'

    """

    where = []

    params = []
 
    if time_from:

        where.append(f"[{TS_COL}] >= ?")

        params.append(time_from)

    if time_to:

        where.append(f"[{TS_COL}] < ?")

        params.append(time_to)
 
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    sql = f"SELECT * FROM {SQL_TABLE} {where_sql};"
 
    with sql_connect() as conn:

        df = pd.read_sql(sql, conn, params=params)
 
    if TS_COL not in df.columns:

        raise ValueError(f"Timestamp column '{TS_COL}' not found in table {SQL_TABLE}")
 
    df[TS_COL] = pd.to_datetime(df[TS_COL], errors="coerce", utc=True)

    df = df.dropna(subset=[TS_COL]).sort_values(TS_COL)
 
    return df
 
# =========================

# STATS

# =========================

def numeric_columns(df: pd.DataFrame) -> list[str]:

    # Keep only numeric columns (ignore ids, strings, json, etc.)

    num_cols = []

    for c in df.columns:

        if c == TS_COL:

            continue

        if pd.api.types.is_numeric_dtype(df[c]):

            num_cols.append(c)

    return num_cols
 
def compute_group_stats(df: pd.DataFrame, freq: str) -> pd.DataFrame:

    """

    freq:

      'D'  => daily

      'W'  => weekly (week ending Sun by default)

      'MS' => monthly (month start)

    Returns a multi-index columns dataframe: (metric, stat)

    """

    if df.empty:

        return pd.DataFrame()
 
    cols = numeric_columns(df)

    if not cols:

        return pd.DataFrame()
 
    # group by time bucket using timestamp

    g = df.set_index(TS_COL)[cols].groupby(pd.Grouper(freq=freq))
 
    # robust quantiles

    def p95(x): return x.quantile(0.95)

    def p99(x): return x.quantile(0.99)
 
    stats = g.agg([

        "count",

        "mean",

        "std",

        "min",

        "median",

        "max",

        p95,

        p99

    ])
 
    # Make columns nice names

    stats.columns = [

        (metric, stat.__name__ if callable(stat) else stat)

        for (metric, stat) in stats.columns

    ]
 
    stats = stats.reset_index()

    return stats
 
def flatten_columns(df: pd.DataFrame) -> pd.DataFrame:

    """

    Flatten multi-index columns -> single level like vx_rms__mean

    """

    out = df.copy()

    new_cols = []

    for c in out.columns:

        if isinstance(c, tuple):

            new_cols.append(f"{c[0]}__{c[1]}")

        else:

            new_cols.append(str(c))

    out.columns = new_cols

    return out
 
# =========================

# CLI EXPORT

# =========================

def export_stats(time_from=None, time_to=None, out_dir="stats_out"):

    os.makedirs(out_dir, exist_ok=True)
 
    df = load_data(time_from=time_from, time_to=time_to)

    print(f"[OK] Loaded {len(df)} rows from {SQL_TABLE}")
 
    daily = flatten_columns(compute_group_stats(df, "D"))

    weekly = flatten_columns(compute_group_stats(df, "W"))

    monthly = flatten_columns(compute_group_stats(df, "MS"))
 
    daily_path = os.path.join(out_dir, "daily_stats.csv")

    weekly_path = os.path.join(out_dir, "weekly_stats.csv")

    monthly_path = os.path.join(out_dir, "monthly_stats.csv")
 
    daily.to_csv(daily_path, index=False)

    weekly.to_csv(weekly_path, index=False)

    monthly.to_csv(monthly_path, index=False)
 
    print("[OK] Exported:")

    print(" -", daily_path)

    print(" -", weekly_path)

    print(" -", monthly_path)
 
# =========================

# OPTIONAL API (for React)

# =========================

app = Flask(__name__)
CORS(app)
 
@app.get("/api/stats")
def api_stats():
    """
    Query params:
      period = day | week | month
      from   = ISO string (optional)
      to     = ISO string (optional)

    Example:
      /api/stats?period=day&from=2026-03-01T00:00:00&to=2026-03-10T00:00:00
    """
    period = (request.args.get("period") or "day").lower()
    time_from = request.args.get("from")
    time_to = request.args.get("to")
 
    freq = {"day": "D", "week": "W", "month": "MS"}.get(period)

    if not freq:
        return jsonify({"ok": False, "error": "period must be day|week|month"}), 400

    # Try to load real data, if fails, generate simulated data
    try:
        df = load_data(time_from=time_from, time_to=time_to)
    except Exception as e:
        print(f"[WARN] Could not load data from DB: {e}")
        # Generate simulated data for the requested period
        return generate_simulated_stats(period, time_from, time_to)
 
    if df.empty:
        # No data in DB - generate simulated stats
        return generate_simulated_stats(period, time_from, time_to)

    stats = flatten_columns(compute_group_stats(df, freq))
 
    # Convert timestamps to iso for JSON
    if TS_COL in stats.columns:
        stats[TS_COL] = pd.to_datetime(stats[TS_COL], utc=True).dt.strftime("%Y-%m-%dT%H:%M:%SZ")
 
    return jsonify({
        "ok": True,
        "period": period,
        "count_rows": int(len(df)),
        "count_buckets": int(len(stats)),
        "data": stats.to_dict(orient="records")
    })

def generate_simulated_stats(period, time_from=None, time_to=None):
    """
    Generate simulated statistics when no real data is available.
    This provides realistic-looking data for demo/testing purposes.
    """
    import random
    
    # Determine date range
    end_date = datetime.now()
    if period == 'day':
        start_date = end_date - timedelta(days=7)
        num_periods = 7
    elif period == 'week':
        start_date = end_date - timedelta(weeks=4)
        num_periods = 4
    else:  # month
        start_date = end_date - timedelta(days=365)
        num_periods = 12
    
    # Generate simulated data
    simulated_data = []
    current_date = start_date
    
    for i in range(num_periods):
        if period == 'day':
            period_label = current_date.strftime("%Y-%m-%dT%H:%M:%SZ")
            current_date += timedelta(days=1)
        elif period == 'week':
            period_label = current_date.strftime("%Y-%m-%dT%H:%M:%SZ")
            current_date += timedelta(weeks=1)
        else:  # month
            period_label = current_date.strftime("%Y-%m-01T00:00:00Z")
            current_date = (current_date + timedelta(days=32)).replace(day=1)
        
        # Generate realistic-looking values with some variation
        base_val = 50 + random.uniform(-10, 10)
        
        record = {
            TS_COL: period_label,
            "vibration_x__count": random.randint(100, 500),
            "vibration_x__mean": base_val,
            "vibration_x__std": random.uniform(5, 15),
            "vibration_x__min": base_val - random.uniform(10, 20),
            "vibration_x__median": base_val,
            "vibration_x__max": base_val + random.uniform(10, 20),
            "vibration_x__p95": base_val + random.uniform(5, 10),
            "vibration_x__p99": base_val + random.uniform(8, 15),
            "vx_rms__count": random.randint(100, 500),
            "vx_rms__mean": base_val * 0.15,
            "vx_rms__std": random.uniform(1, 3),
            "vx_rms__min": base_val * 0.15 - random.uniform(2, 4),
            "vx_rms__median": base_val * 0.15,
            "vx_rms__max": base_val * 0.15 + random.uniform(2, 4),
            "vx_rms__p95": base_val * 0.15 + random.uniform(1, 2),
            "vx_rms__p99": base_val * 0.15 + random.uniform(1.5, 3),
            "pressure__count": random.randint(100, 500),
            "pressure__mean": 6.5 + random.uniform(-1, 1),
            "pressure__std": random.uniform(0.2, 0.5),
            "pressure__min": 5.5,
            "pressure__median": 6.5,
            "pressure__max": 7.5,
            "pressure__p95": 7.0,
            "pressure__p99": 7.3,
            "current_value__count": random.randint(100, 500),
            "current_value__mean": 15.0 + random.uniform(-2, 2),
            "current_value__std": random.uniform(0.5, 1.5),
            "current_value__min": 12.0,
            "current_value__median": 15.0,
            "current_value__max": 18.0,
            "current_value__p95": 17.0,
            "current_value__p99": 17.5,
        }
        simulated_data.append(record)
    
    return jsonify({
        "ok": True,
        "period": period,
        "count_rows": len(simulated_data) * 200,  # Estimated
        "count_buckets": len(simulated_data),
        "is_simulated": True,
        "data": simulated_data
    })

 
@app.get("/api/stats/columns")

def api_stats_columns():

    df = load_data()

    return jsonify({

        "ok": True,

        "numeric_columns": numeric_columns(df),

        "timestamp_column": TS_COL,

        "table": SQL_TABLE

    })

# =========================

# RAW HISTORICAL DATA ENDPOINT (for detailed analysis)

# =========================

@app.get("/api/historical/raw")
def api_historical_raw():
    """
    Query raw historical time series data from SQL.

    Query params:
      date   = YYYY-MM-DD (required)
      from   = HH:MM (optional, default 00:00)
      to     = HH:MM (optional, default 23:59)
      limit  = int (optional, default 5000, max 10000)

    Returns raw time series data for detailed analysis (FFT, waveform, etc.)
    """
    import random
    
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"ok": False, "error": "date parameter is required (YYYY-MM-DD)"}), 400

    try:
        from_dt = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return jsonify({"ok": False, "error": "Invalid date format. Use YYYY-MM-DD"}), 400

    time_from = request.args.get("from", "00:00")
    time_to = request.args.get("to", "23:59")
    limit = min(int(request.args.get("limit", "5000")), 10000)

    start_datetime = f"{date_str} {time_from}:00"
    end_datetime = f"{date_str} {time_to}:59"

    try:
        df = load_data(time_from=start_datetime, time_to=end_datetime)
    except Exception as e:
        print(f"[WARN] Could not load data, generating simulated data: {e}")
        # Generate simulated historical data
        return generate_simulated_historical_raw(date_str, time_from, time_to, limit)

    if df.empty:
        # Generate simulated data when no real data exists
        return generate_simulated_historical_raw(date_str, time_from, time_to, limit)

    if len(df) > limit:
        df = df.tail(limit)

    records = df.to_dict(orient="records")

    for rec in records:
        if TS_COL in rec and rec[TS_COL] is not None:
            if hasattr(rec[TS_COL], 'isoformat'):
                rec[TS_COL] = rec[TS_COL].isoformat()
            else:
                rec[TS_COL] = str(rec[TS_COL])

    return jsonify({
        "ok": True,
        "date": date_str,
        "time_range": f"{time_from} to {time_to}",
        "count": len(records),
        "data": records
    })

def generate_simulated_historical_raw(date_str, time_from, time_to, limit):
    """Generate simulated historical raw data when no real data is available."""
    import random
    from datetime import datetime, timedelta
    
    # Parse time range
    from_hour = int(time_from.split(':')[0]) if time_from else 0
    from_min = int(time_from.split(':')[1]) if time_from and ':' in time_from else 0
    to_hour = int(time_to.split(':')[0]) if time_to else 23
    to_min = int(time_to.split(':')[1]) if time_to and ':' in time_to else 59
    
    # Calculate number of data points
    total_minutes = (to_hour * 60 + to_min) - (from_hour * 60 + from_min)
    num_points = min(limit, max(total_minutes, 48))  # At least 48 points
    
    # Generate timestamps
    base_date = datetime.strptime(date_str, "%Y-%m-%d")
    records = []
    
    for i in range(num_points):
        # Calculate timestamp
        minutes_offset = (i * total_minutes) // max(num_points - 1, 1)
        ts = base_date + timedelta(hours=from_hour, minutes=from_min + minutes_offset)
        
        # Generate realistic values with some variation
        base_val = 50 + 10 * np.sin(2 * np.pi * i / num_points)
        
        record = {
            TS_COL: ts.isoformat(),
            "vibration_x": base_val + random.uniform(-5, 5),
            "vibration_y": base_val * 0.9 + random.uniform(-3, 3),
            "vibration_z": base_val * 0.3 + random.uniform(-1, 1),
            "vx_rms": base_val * 0.15 + random.uniform(-0.5, 0.5),
            "vy_rms": base_val * 0.13 + random.uniform(-0.4, 0.4),
            "pressure": 6.5 + random.uniform(-1, 1),
            "current_value": 15.0 + random.uniform(-2, 2),
            "vx_peak": base_val + random.uniform(-2, 2),
            "vx_p2p": base_val * 2 + random.uniform(-3, 3),
            "vx_crest_factor": 1.2 + random.uniform(0, 0.5),
            "vx_kurtosis": 3.0 + random.uniform(-0.5, 0.5),
            "vx_skewness": random.uniform(-0.2, 0.2),
            "vx_dom_freq_hz": 25.0 + random.uniform(-5, 5),
            "vx_band_0_10": base_val * 0.05,
            "vx_band_10_100": base_val * 0.25,
            "vx_band_100_500": base_val * 0.45,
            "vx_band_500_1000": base_val * 0.25,
        }
        records.append(record)
    
    return jsonify({
        "ok": True,
        "date": date_str,
        "time_range": f"{time_from} to {time_to}",
        "count": len(records),
        "is_simulated": True,
        "data": records
    })

# =========================

# FREQUENCY BANDS ENDPOINT

# =========================

@app.get("/api/historical/bands")

def api_historical_bands():

    """

    Compute frequency band energies from raw vibration data.

    Query params:

      date   = YYYY-MM-DD (required)

      from   = HH:MM (optional)

      to     = HH:MM (optional)

    Returns band energies for each data point.

    """

    date_str = request.args.get("date")

    if not date_str:

        return jsonify({"ok": False, "error": "date parameter is required"}), 400

    time_from = request.args.get("from", "00:00")

    time_to = request.args.get("to", "23:59")

    start_datetime = f"{date_str} {time_from}:00"

    end_datetime = f"{date_str} {time_to}:59"

    try:

        df = load_data(time_from=start_datetime, time_to=end_datetime)

    except Exception as e:

        return jsonify({"ok": False, "error": str(e)}), 500

    # Compute frequency bands for each row (simplified estimation)

    # Assuming vibration_x contains time-domain signal, we estimate band energies

    results = []

    for idx, row in df.iterrows():

        vib_x = float(row.get("vibration_x", 0)) if row.get("vibration_x") is not None else 0

        # Simplified band energy estimation based on vibration magnitude

        # These are placeholder calculations - in production, FFT would be computed per-point

        band_0_10 = vib_x * 0.05  # Very low frequency content

        band_10_100 = vib_x * 0.25  # Low frequency

        band_100_500 = vib_x * 0.45  # Medium frequency

        band_500_1000 = vib_x * 0.25  # High frequency

        ts_val = row[TS_COL]

        timestamp = ts_val.isoformat() if hasattr(ts_val, 'isoformat') else str(ts_val)

        results.append({

            "timestamp": timestamp,

            "vx_band_0_10": band_0_10,

            "vx_band_10_100": band_10_100,

            "vx_band_100_500": band_100_500,

            "vx_band_500_1000": band_500_1000

        })

    return jsonify({
        "ok": True,
        "date": date_str,
        "count": len(results),
        "data": results
    })

# =========================

# HOURLY/DAILY/MONTHLY AGGREGATED STATS ENDPOINTS

# These endpoints execute SQL aggregation queries similar to user's SQL script

# =========================

@app.get("/api/stats/hourly")
def api_stats_hourly():
    """
    Get hourly aggregated statistics.
    
    Query params:
      from   = ISO string (optional, e.g., '2026-03-01T00:00:00')
      to     = ISO string (optional, e.g., '2026-03-08T00:00:00')
      id     = equipment id (optional, filters by specific equipment)
    
    Returns columns: id, bucket_utc, vx_avg, vx_max, vx_min, i_avg, i_max, i_min, n
    """
    time_from = request.args.get("from")
    time_to = request.args.get("to")
    equipment_id = request.args.get("id")
    
    # Build SQL query matching user's script
    sql = """
    SELECT
      id,
      DATEADD(hour, DATEDIFF(hour, 0, [timestamp]), 0) AS bucket_utc,
      AVG(vx_rms_mm_s) AS vx_avg,
      MAX(vx_rms_mm_s) AS vx_max,
      MIN(vx_rms_mm_s) AS vx_min,
      AVG(i_raw_count) AS i_avg,
      MAX(i_raw_count) AS i_max,
      MIN(i_raw_count) AS i_min,
      COUNT(*) AS n
    FROM dbo.COMPRESSEURDATA
    """
    
    where_clauses = []
    params = []
    
    if time_from:
        where_clauses.append("[timestamp] >= ?")
        params.append(time_from)
    if time_to:
        where_clauses.append("[timestamp] <= ?")
        params.append(time_to)
    if equipment_id:
        where_clauses.append("id = ?")
        params.append(equipment_id)
    
    # Add vibration_x/y/z NOT NULL filter (matching user's query)
    where_clauses.append("vibration_x IS NOT NULL")
    where_clauses.append("vibration_y IS NOT NULL")
    where_clauses.append("vibration_z IS NOT NULL")
    
    if where_clauses:
        sql += " WHERE " + " AND ".join(where_clauses)
    
    sql += " GROUP BY id, DATEADD(hour, DATEDIFF(hour, 0, timestamp), 0)"
    sql += " ORDER BY id, bucket_utc"
    
    try:
        with sql_connect() as conn:
            df = pd.read_sql(sql, conn, params=params)
        
        # Convert bucket_utc to ISO string
        if 'bucket_utc' in df.columns:
            df['bucket_utc'] = pd.to_datetime(df['bucket_utc']).dt.strftime("%Y-%m-%dT%H:%M:%S")
        
        return jsonify({
            "ok": True,
            "period": "hourly",
            "count": len(df),
            "data": df.to_dict(orient="records")
        })
    except Exception as e:
        print(f"[ERROR] /api/stats/hourly: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.get("/api/stats/daily")
def api_stats_daily():
    """
    Get daily aggregated statistics.
    
    Query params:
      from   = ISO string (optional, e.g., '2026-03-01T00:00:00')
      to     = ISO string (optional, e.g., '2026-03-08T00:00:00')
      id     = equipment id (optional, filters by specific equipment)
    
    Returns columns: id, bucket_utc, vx_avg, vx_max, vx_min, n
    """
    time_from = request.args.get("from")
    time_to = request.args.get("to")
    equipment_id = request.args.get("id")
    
    # Build SQL query matching user's script
    sql = """
    SELECT
      id,
      DATEADD(day, DATEDIFF(day, 0, [timestamp]), 0) AS bucket_utc,
      AVG(vx_rms_mm_s) AS vx_avg,
      MAX(vx_rms_mm_s) AS vx_max,
      MIN(vx_rms_mm_s) AS vx_min,
      COUNT(*) AS n
    FROM dbo.COMPRESSEURDATA
    """
    
    where_clauses = []
    params = []
    
    if time_from:
        where_clauses.append("[timestamp] >= ?")
        params.append(time_from)
    if time_to:
        where_clauses.append("[timestamp] <= ?")
        params.append(time_to)
    if equipment_id:
        where_clauses.append("id = ?")
        params.append(equipment_id)
    
    # Add vibration_x/y/z NOT NULL filter
    where_clauses.append("vibration_x IS NOT NULL")
    where_clauses.append("vibration_y IS NOT NULL")
    where_clauses.append("vibration_z IS NOT NULL")
    
    if where_clauses:
        sql += " WHERE " + " AND ".join(where_clauses)
    
    sql += " GROUP BY id, DATEADD(day, DATEDIFF(day, 0, timestamp), 0)"
    sql += " ORDER BY id, bucket_utc"
    
    try:
        with sql_connect() as conn:
            df = pd.read_sql(sql, conn, params=params)
        
        # Convert bucket_utc to ISO string
        if 'bucket_utc' in df.columns:
            df['bucket_utc'] = pd.to_datetime(df['bucket_utc']).dt.strftime("%Y-%m-%dT%H:%M:%S")
        
        return jsonify({
            "ok": True,
            "period": "daily",
            "count": len(df),
            "data": df.to_dict(orient="records")
        })
    except Exception as e:
        print(f"[ERROR] /api/stats/daily: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.get("/api/stats/monthly")
def api_stats_monthly():
    """
    Get monthly aggregated statistics.
    
    Query params:
      from   = ISO string (optional, e.g., '2026-03-01T00:00:00')
      to     = ISO string (optional, e.g., '2026-03-08T00:00:00')
      id     = equipment id (optional, filters by specific equipment)
    
    Returns columns: id, bucket_utc, vx_avg, vx_max, vx_min, n
    """
    time_from = request.args.get("from")
    time_to = request.args.get("to")
    equipment_id = request.args.get("id")
    
    # Build SQL query matching user's script
    sql = """
    SELECT
      id,
      DATEADD(month, DATEDIFF(month, 0, [timestamp]), 0) AS bucket_utc,
      AVG(vx_rms_mm_s) AS vx_avg,
      MAX(vx_rms_mm_s) AS vx_max,
      MIN(vx_rms_mm_s) AS vx_min,
      COUNT(*) AS n
    FROM dbo.COMPRESSEURDATA
    """
    
    where_clauses = []
    params = []
    
    if time_from:
        where_clauses.append("[timestamp] >= ?")
        params.append(time_from)
    if time_to:
        where_clauses.append("[timestamp] <= ?")
        params.append(time_to)
    if equipment_id:
        where_clauses.append("id = ?")
        params.append(equipment_id)
    
    # Add vibration_x/y/z NOT NULL filter
    where_clauses.append("vibration_x IS NOT NULL")
    where_clauses.append("vibration_y IS NOT NULL")
    where_clauses.append("vibration_z IS NOT NULL")
    
    if where_clauses:
        sql += " WHERE " + " AND ".join(where_clauses)
    
    sql += " GROUP BY id, DATEADD(month, DATEDIFF(month, 0, timestamp), 0)"
    sql += " ORDER BY id, bucket_utc"
    
    try:
        with sql_connect() as conn:
            df = pd.read_sql(sql, conn, params=params)
        
        # Convert bucket_utc to ISO string
        if 'bucket_utc' in df.columns:
            df['bucket_utc'] = pd.to_datetime(df['bucket_utc']).dt.strftime("%Y-%m-%dT%H:%M:%S")
        
        return jsonify({
            "ok": True,
            "period": "monthly",
            "count": len(df),
            "data": df.to_dict(orient="records")
        })
    except Exception as e:
        print(f"[ERROR] /api/stats/monthly: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


# =========================
# DATES ENDPOINT - For getting available dates
# =========================

@app.get("/api/dates")
def api_dates():
    """
    Get available dates from the database.
    Returns list of dates that have data.
    """
    try:
        # Query distinct dates from the database
        sql = """
        SELECT DISTINCT CONVERT(date, timestamp) as date_only 
        FROM dbo.COMPRESSEURDATA 
        ORDER BY date_only DESC
        """
        
        with sql_connect() as conn:
            df = pd.read_sql(sql, conn)
        
        dates = []
        if not df.empty and 'date_only' in df.columns:
            for date_val in df['date_only']:
                if pd.notna(date_val):
                    if hasattr(date_val, 'strftime'):
                        dates.append(date_val.strftime('%Y-%m-%d'))
                    else:
                        dates.append(str(date_val))
        
        # Always include today
        today = datetime.now().strftime('%Y-%m-%d')
        if today not in dates:
            dates.insert(0, today)
        
        return jsonify({
            "ok": True,
            "dates": dates
        })
    except Exception as e:
        print(f"[ERROR] /api/dates: {e}")
        # Return fallback dates
        today = datetime.now()
        dates = []
        for i in range(7):
            d = today - timedelta(days=i)
            dates.append(d.strftime('%Y-%m-%d'))
        return jsonify({
            "ok": True,
            "dates": dates,
            "is_fallback": True
        })


if __name__ == "__main__":

    # If you want export only, run with:

    #   python stats_aggregator.py export

    import sys

    if len(sys.argv) >= 2 and sys.argv[1].lower() == "export":

        export_stats()

    else:

        # API mode

        print("[START] Stats API on http://0.0.0.0:5001")

        app.run(host="0.0.0.0", port=5001, debug=False)
 