# src/insert_data.py
from datetime import datetime
import os, csv, json
from typing import Dict, Tuple
 
# try pyodbc
try:
    import pyodbc
    HAVE_PYODBC = True
except Exception:
    pyodbc = None
    HAVE_PYODBC = False
 
# load config from same package (assumes src/config.py exists)
try:
    from config import CONN_STR, TABLE_NAME, CSV_FALLBACK
except Exception:
    # defaults (change in your config.py instead)
    CONN_STR = ""
    TABLE_NAME = "dbo.COMPRESSEURDATA"
    CSV_FALLBACK = os.path.join(os.path.dirname(__file__), "..", "data", "vib_data_fallback.csv")
 
# ------------- SQL helpers -------------
def get_connection():
    """Return a pyodbc connection (raises if not available or CONN_STR empty)."""
    if not HAVE_PYODBC:
        raise RuntimeError("pyodbc non installé")
    if not CONN_STR:
        raise RuntimeError("CONN_STR non configuré dans src/config.py")
    return pyodbc.connect(CONN_STR, autocommit=False)
 
def get_table_columns(conn) -> set:
    """Return set of column names for TABLE_NAME (expects schema.table or table)."""
    cur = conn.cursor()
    if '.' in TABLE_NAME:
        schema, tbl = TABLE_NAME.split('.',1)
        schema = schema.strip('[]')
        tbl = tbl.strip('[]')
    else:
        schema = 'dbo'; tbl = TABLE_NAME
    q = """SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?"""
    cur.execute(q, schema, tbl)
    rows = cur.fetchall()
    cur.close()
    return {r[0] for r in rows}
 
def insert_dynamic_row(conn, data: Dict) -> Tuple[bool,str]:
    """
    Insert only keys that exist in the DB table.
    Returns (True,"inserted") on success else (False,error_message).
    """
    try:
        cols_av = get_table_columns(conn)
        keys = [k for k in data.keys() if k in cols_av]
        if not keys:
            return False, "no matching columns in table"
        cols_sql = ", ".join(f"[{k}]" for k in keys)
        placeholders = ", ".join("?" for _ in keys)
        q = f"INSERT INTO {TABLE_NAME} ({cols_sql}) VALUES ({placeholders})"
        params = [data[k] for k in keys]
        cur = conn.cursor()
        cur.execute(q, params)
        cur.close()
        return True, "inserted"
    except Exception as e:
        return False, str(e)
 
# ------------- CSV fallback -------------
def _ensure_dir(path):
    d = os.path.dirname(path)
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)
 
def write_csv_fallback(path: str, data: Dict):
    """Append a row to CSV fallback. Create header if needed."""
    _ensure_dir(path)
    header_needed = not os.path.exists(path)
    with open(path, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if header_needed:
            w.writerow(list(data.keys()))
        # convert nested to JSON strings where needed
        row = []
        for k in data.keys():
            v = data[k]
            if v is None:
                row.append("")
            elif isinstance(v, (dict, list)):
                row.append(json.dumps(v, ensure_ascii=False))
            else:
                row.append(v)
        w.writerow(row)
 
def flush_fallback_to_sql(conn, path: str) -> Tuple[int,str]:
    """
    Try to insert all rows from CSV fallback into SQL using insert_dynamic_row.
    If all inserted -> remove CSV file. Returns (inserted_count, status_message).
    """
    if not os.path.exists(path):
        return 0, "no file"
    with open(path, "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    if len(rows) <= 1:
        return 0, "empty"
    header = rows[0]
    data_rows = rows[1:]
    inserted = 0
    for r in data_rows:
        try:
            data = {}
            for i, col in enumerate(header):
                val = r[i] if i < len(r) else ""
                if val == "":
                    data[col] = None
                else:
                    # try to decode json
                    try:
                        data[col] = json.loads(val)
                    except Exception:
                        # try numeric
                        try:
                            if '.' in val:
                                data[col] = float(val)
                            else:
                                data[col] = int(val)
                        except Exception:
                            data[col] = val
            ok, msg = insert_dynamic_row(conn, data)
            if ok:
                inserted += 1
            else:
                # can't insert this row -> skip and continue
                print("[flush_fallback_to_sql] insert_dynamic_row failed for a row:", msg)
        except Exception as e:
            print("[flush_fallback_to_sql] row parse error:", e)
    # commit if any inserted
    try:
        conn.commit()
    except Exception as e:
        return inserted, f"commit_failed:{e}"
    # if all inserted remove file
    if inserted == len(data_rows):
        try:
            os.remove(path)
            return inserted, "flushed_and_removed"
        except Exception as e:
            return inserted, f"flushed_but_rm_failed:{e}"
    return inserted, "partial_flush"
 
# ------------- utility for quick test -------------
if __name__ == "__main__":
    print("insert_data self-test")
    sample = {
        "timestamp": datetime.utcnow().replace(microsecond=0),
        "vibration_x": 1.234,
        "vibration_y": 2.345,
        "vibration_z": 0.0,
        "vx_rms": 1.234,
        "source": "insert_data_test"
    }
    if HAVE_PYODBC:
        try:
            conn = get_connection()
            ok, msg = insert_dynamic_row(conn, sample)
            if ok:
                conn.commit()
                print("Inserted into SQL")
            else:
                print("SQL insert failed:", msg, "-> writing CSV fallback")
                write_csv_fallback(CSV_FALLBACK, sample)
                print("Wrote fallback CSV:", CSV_FALLBACK)
            conn.close()
        except Exception as e:
            print("SQL connection/insert error:", e)
            write_csv_fallback(CSV_FALLBACK, sample)
            print("Wrote fallback CSV:", CSV_FALLBACK)
    else:
        print("pyodbc not available, writing fallback CSV:", CSV_FALLBACK)
        write_csv_fallback(CSV_FALLBACK, sample)