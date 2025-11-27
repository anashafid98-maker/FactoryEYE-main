import os
import time
import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

# ――― Configuration ―――
CSV_PATH   = "mesures_simulees.csv"
MODEL_PATH = "modele_regression_pression.pkl"

# Simulation
FS               = 25.0                 # Hz
DT               = 1.0 / FS             # intervalle (s)
TOTAL_DAYS       = 1                    # <<-- Use 1 day for quick test, increase if needed
TOTAL_SECONDS    = TOTAL_DAYS * 24*3600
N_SAMPLES        = int(TOTAL_SECONDS * FS)

# Arrêts
STOPS_PER_DAY     = 2 + random.randint(0,1)  # 2 ou 3 arrêts/jour
MIN_STOP_SEC      = 30*60                    # 30 min
MAX_STOP_SEC      = 60*60                    # 1 h
DAY_SEC           = 24*3600

# Compresseur
RPM    = 1500
F0     = RPM / 60.0
OMEGA0 = 2 * np.pi * F0

# ――― Fonctions de génération ―――
def generate_stop_schedule():
    stops=[]
    for day in range(TOTAL_DAYS):
        starts = sorted(random.uniform(3600, DAY_SEC-3600)
                        for _ in range(STOPS_PER_DAY))
        for s in starts:
            duration = random.uniform(MIN_STOP_SEC, MAX_STOP_SEC)
            stops.append((day*DAY_SEC + s, day*DAY_SEC + s + duration))
    return stops

def in_stop(elapsed, schedule):
    return any(start <= elapsed < end for start,end in schedule)

def gen_vibration(t):
    amps, phases = [0.5,0.2,0.1], [0.0,0.5,1.0]
    val = sum(A * np.sin((k+1)*OMEGA0 * t + phases[k]) for k,A in enumerate(amps))
    val += random.gauss(0,0.02)
    if random.random() < 0.005:
        val += random.uniform(0.1,0.3)
    return val

def gen_courant(t):
    charge = 0.5 + 0.5*np.sin(2*np.pi*0.1*t)
    base   = 5.0 + charge
    ond    = 0.2*np.sin(2*OMEGA0*t + 1)
    return base + ond + random.gauss(0,0.05)

# ――― Génération des données ―――
print("[*] Génération des données simulées…")
schedule = generate_stop_schedule()

timestamps, vibration_x_list, vibration_y_list, vibration_z_list, current_value_list, pressure_list = [], [], [], [], [], []

for i in range(N_SAMPLES):
    elapsed = i * DT
    t = elapsed
    timestamps.append(datetime.now() + timedelta(seconds=elapsed))

    if in_stop(elapsed, schedule):
        vibration_x = vibration_y = vibration_z = current_value = pressure = 0.0
    else:
        vibration_x = gen_vibration(t)
        vibration_y = gen_vibration(t+0.1)
        vibration_z = 0.0
        current_value = gen_courant(t)
        pressure = ( (abs(vibration_x)+abs(vibration_y)+abs(vibration_z))/3 )*10 + 1.0

    vibration_x_list.append(vibration_x)
    vibration_y_list.append(vibration_y)
    vibration_z_list.append(vibration_z)
    current_value_list.append(current_value)
    pressure_list.append(pressure)

# DataFrame et CSV
df = pd.DataFrame({
    "timestamp":     timestamps,
    "vibration_x":   vibration_x_list,
    "vibration_y":   vibration_y_list,
    "vibration_z":   vibration_z_list,
    "current_value": current_value_list,
    "pressure":      pressure_list
})
df.to_csv(CSV_PATH, index=False)
print(f"[OK] CSV créé : {os.path.abspath(CSV_PATH)}")

# ――― Entraînement du modèle ―――
print("[*] Entraînement du modèle ML…")
X = df[["vibration_x","vibration_y","vibration_z","current_value"]]
y = df["pressure"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Évaluation
y_pred = model.predict(X_test)
print(f"RMSE = {mean_squared_error(y_test, y_pred, squared=False):.3f}")
print(f"R²   = {r2_score(y_test, y_pred):.3f}")

# Sauvegarde du modèle
joblib.dump(model, MODEL_PATH)
print(f"[OK] Modèle sauvegardé : {os.path.abspath(MODEL_PATH)}")