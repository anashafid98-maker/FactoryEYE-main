import time
import random
from datetime import datetime
import numpy as np
import joblib
import pyodbc
import math, random
from config import CONN_STR, PAUSE_S, PATH_MODEL
from thermo import model_isentropique



CONN_STR = "Driver={ODBC Driver 17 for SQL Server};Server=D-CZC929DNPY\\MSSQLSERVER01;Database=FactoryEYE;Trusted_Connection=yes;"
print("Connected!")

# --- Paramètres d’arrêt ---
STOPS_PER_DAY     = random.choice([2, 3])
MIN_STOP_DURATION = 30 * 60     # 30 min
MAX_STOP_DURATION = 60 * 60     # 1 h
DAY_SECONDS       = 24 * 3600
 
def generate_stop_schedule():
    starts = sorted(random.uniform(3600, DAY_SECONDS - 3600)
                    for _ in range(STOPS_PER_DAY))
    return [
        (s, s + random.uniform(MIN_STOP_DURATION, MAX_STOP_DURATION))
        for s in starts
    ]
 
# --- Connexion SQL ---
def get_connection():
    return pyodbc.connect(CONN_STR)
 
# --- Génération réaliste ---
RPM=1250
V0_LPM=860.0
P_SHUTOFF_BAR=11.0 
T0_K=293.15
R_AIR=287.0
F0     = RPM / 60.0
OMEGA0 = 2 * np.pi * F0
 
def gen_vibration(t_seconds,running,
                  amps=[0.6,0.25,0.12],
                  phases=[0.0,0.5,1.0],
                  rpm=RPM):
    if not running:
        return 0.0
    
    f0 = rpm / 60.0
    omega0 = 2 * math.pi * f0

    val=0.0
    #Somme d'harmoniques
    for k,A in enumerate(amps, start=1):
        phi=phases[k-1] if k-1<len(phases) else 0.0
        val += A * math.sin(k * omega0 * t_seconds + phi)
    
    #Modlation basse fréquence (roulement)

    val*= (0.8 + 0.4*math.sin(2*math.pi*0.005*t_seconds))

    #bruit gaussien dépendant d'une petite amplitude 
    val+= random.gauss(0.0,0.05)

    if random.random()<0.002:
        val+= random.gauss(0.0,3.0) #pic aléatoire rare
        
    return val

def gen_xy_vibration(t_seconds,running,
                     amps_x=None,phases_x=None,
                     amps_y=None,phases_y=None,
                     rpm=RPM):
    if amps_x is None:
        amps_x=[0.6,0.25,0.12]
    if phases_x is None:
        phases_x=[0.0,0.5,1.0]
    if amps_y is None:
        amps_y=[0.5,0.3,0.1]
    if phases_y is None:
        phases_y=[0.0,0.3,0.7]

    vx=gen_vibration(t_seconds,running,amps_x,phases_x,rpm)
    vy=gen_vibration(t_seconds,running,amps_y,phases_y,rpm)

    vz=0.0

    return vx,vy,vz
    