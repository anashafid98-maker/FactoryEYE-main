import pyodbc
import time, random 
from datetime import datetime, timedelta
import os
from config import SAMPLES_SECONDs, CONN_STR,DAILY_MIN_STOP_COUNT,DAILY_MAX_STOP_COUNT,MIN_STOP_DURATION_MIN,MAX_STOP_DURATION_MIN
from SearchEngine import gen_xy_vibration
from insert_data import insert_measures
 
# 1) Paramètres de connexion
CONN_STR = (
    "Driver={ODBC Driver 17 for SQL Server};Server= \\MSSQLSERVER01;Database=FactoryEYE;Trusted_Connection=yes;"
)
 
# ========== Helpers for daily stop schedule ==========
def make_daily_stops(for_date):
    """Génère une liste de (start_datetime, end_datetime) pour la journée `for_date`."""
    stops = []
    n = random.randint(DAILY_MIN_STOP_COUNT, DAILY_MAX_STOP_COUNT)
    # choose n random start minutes in day (avoid edges)
    for _ in range(n):
        start_min = random.randint(6*60, 22*60 - 60)  # entre 06:00 et 22:00 - 60min
        duration = random.randint(30, 60)  # minutes
        start_dt = datetime(for_date.year, for_date.month, for_date.day) + timedelta(minutes=start_min)
        end_dt = start_dt + timedelta(minutes=duration)
        stops.append((start_dt, end_dt))
    # sort and maybe merge overlapping
    stops.sort()
    merged = []
    for s,e in stops:
        if not merged:
            merged.append((s,e))
        else:
            last_s, last_e = merged[-1]
            if s <= last_e:
                # overlap -> extend
                merged[-1] = (last_s, max(last_e, e))
            else:
                merged.append((s,e))
    return merged
 
def is_in_stops(dt, stops):
    for s,e in stops:
        if s <= dt < e:
            return True
    return False
 

 # 2) Ouvrir la connexion
cnxn = pyodbc.connect(CONN_STR)
cur  = cnxn.cursor()
 
 
 
# ========== Main loop ==========
def run_forever():
    print("[generator] Démarrage du générateur de vibrations (CTRL+C pour arrêter).")
    # prepare daily stops for today
    today = datetime.now().date()
    stops_today = make_daily_stops(today)
    print("[generator] Stops today:", [(s.strftime("%H:%M"), e.strftime("%H:%M")) for s,e in stops_today])
 
    # align to next minute boundary
    def sleep_until_next_minute():
        now = datetime.now()
        next_min = (now.replace(second=0, microsecond=0) + timedelta(minutes=1))
        delta = (next_min - now).total_seconds()
        time.sleep(delta)
 
    # initial align
    sleep_until_next_minute()
    epoch_start = datetime.now()
 
    try:
        while True:
            now = datetime.now()
            # if day changed, rebuild stops
            if now.date() != today:
                today = now.date()
                stops_today = make_daily_stops(today)
                print("[generator] New stops for", today, stops_today)
 
            running = not is_in_stops(now, stops_today)
 
            # generate vibrations based on running state
            t_seconds = (now - epoch_start).total_seconds()
            vx, vy, vz = gen_xy_vibration(t_seconds, running)
 
            # pressure is not generated here (set None), or you can compute a simple proxy
            pressure = None
 
            # insert to DB or CSV
            ok_sql = insert_measures(now, pressure, None, vx, vy, vz)
            source = "SQL" if ok_sql else "CSV"
            print(f"[{now.strftime('%Y-%m-%d %H:%M')}] running={int(running)} vx={vx:+.4f} vy={vy:+.4f} -> saved to {source}")
 
            # sleep until next minute boundary to keep exact minute cadence
            sleep_until_next_minute()
 
    except KeyboardInterrupt:
        print("\n[generator] Arrêt manuel demandé. Fin.")
 
if __name__ == "__main__":
    run_forever()