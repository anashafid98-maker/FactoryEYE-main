# -*- coding: utf-8 -*-
import os
import pyodbc
# config.py
CONN_STR = "Driver={ODBC Driver 17 for SQL Server};Server=D-CZC929DNPY\\MSSQLSERVER01;Database=FactoryEYE;Trusted_Connection=yes;"
print("Connected!")

TABLE_NAME = "dbo.COMPRESSEURDATA"
#Frequency of the search engine to run
FS= 2000.0
PAUSE_S=1.0/FS
WINDOWS_SECONDS=8.0
STEP_SECONDS=1.0
RPM=1250

#Simulation parameters
AMP_SCALE_X=8.0
AMP_SCALE_Y=8.0
NOISE_STD=0.05

#Bande pour calcul de puissance spectrale
BAND_DEFS=[(0,10),(10,50),(50,100),(100,200),(200,500),(500,1000),(1000,2000)]
TOP_N_PEAKS=6
LOG_EVERY=1


# Path to the folder where the search engine will store its data
PATH_CSV =r"C:\Users\Admin\Downloads\FactoryEYE-main \mesures_simulees.csv"
PATH_MODEL = r"C:\Users\Admin\Downloads\FactoryEYE-main\modele_regression_pression.pkl"

OUTPUTDIR=os.path.join(os.path.dirname(__file__),"..","data")

os.makedirs(OUTPUTDIR,exist_ok=True)

CSV_FALLBACK=os.path.join(OUTPUTDIR,"mesures_simulees.csv")

#Conditions of nominal admission of the model 

P_IN_NOM=1.0e5 #Pa
T_IN_NOM=293.15  #K(20°C)
GAMMA = 1.4 #air


#Sampling 
SAMPLES_SECONDs=60

#Vibration model params
RPM=1250
V0_LPM=860.0
P_SHUTOFF_BAR=11.0 
T0_K=293.15
R_AIR=287.0

#Simulation policy for daily steps 
DAILY_MIN_STOP_COUNT=2
DAILY_MAX_STOP_COUNT=3
MIN_STOP_DURATION_MIN=30
MAX_STOP_DURATION_MIN=60
