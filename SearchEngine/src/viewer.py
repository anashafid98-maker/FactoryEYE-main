# src/viewer.py
import time, json, threading
from datetime import datetime, timedelta
import pyodbc
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from scipy import signal
import warnings
warnings.filterwarnings('ignore')

POLL_S = 1.0
N_HISTORY = 120

def get_connection():
    try:
        conn = pyodbc.connect("Driver={ODBC Driver 17 for SQL Server};Server=D-CZC929DNPY\\MSSQLSERVER01;Database=FactoryEYE;Trusted_Connection=yes;")
        print("[DB] Connexion réussie à la table dbo.COMPRESSEURDATA")
        return conn
    except Exception as e:
        print(f"[DB] Erreur de connexion: {e}")
        return None

def generate_psd_from_vibration(vibration_data, fs=2000.0):
    """Génère un PSD simulé à partir des données de vibration"""
    try:
        # Assurer que la vibration_data est positive et non nulle
        vibration_magnitude = max(abs(float(vibration_data)), 0.1)  # Minimum 0.1 pour éviter les valeurs nulles
        
        # Créer un signal simulé
        t = np.linspace(0, 1, int(fs))
        
        # Fréquences caractéristiques d'un compresseur (1250 RPM = ~20.8 Hz)
        rpm = 1250
        fundamental_freq = rpm / 60  # 20.8 Hz
        harmonic_2 = fundamental_freq * 2  # 41.6 Hz
        harmonic_3 = fundamental_freq * 3  # 62.5 Hz
        
        # Générer un signal avec harmoniques et bruit
        signal_clean = (vibration_magnitude * 
                       (np.sin(2 * np.pi * fundamental_freq * t) +
                        0.5 * np.sin(2 * np.pi * harmonic_2 * t) +
                        0.3 * np.sin(2 * np.pi * harmonic_3 * t) +
                        0.2 * np.sin(2 * np.pi * 100 * t) +  # 100 Hz
                        0.1 * np.sin(2 * np.pi * 150 * t)))  # 150 Hz
        
        # Ajouter du bruit
        noise = np.random.normal(0, 0.1 * vibration_magnitude, len(t))
        signal_with_noise = signal_clean + noise
        
        # Calculer le PSD avec gestion d'erreur
        freqs, psd = signal.welch(signal_with_noise, fs, nperseg=1024, scaling='density')
        
        # S'assurer qu'il n'y a pas de valeurs négatives ou nulles dans PSD
        psd = np.maximum(psd, 1e-12)  # Éviter les valeurs nulles pour l'échelle log
        
        return freqs, psd
        
    except Exception as e:
        print(f"[PSD] Erreur génération PSD: {e}")
        # Retourner un PSD par défaut en cas d'erreur
        freqs = np.linspace(0, 1000, 512)
        psd = np.ones_like(freqs) * 1e-6
        return freqs, psd

def fetch_latest_data(conn, last_ts=None):
    """Récupère les données avec les bonnes colonnes"""
    if conn is None:
        return [], last_ts
    
    cur = conn.cursor()
    try:
        if last_ts is None:
            q = """
            SELECT TOP(1) 
                id, timestamp, vibration_x, vibration_y, vibration_z, 
                vx_rms, vy_rms, pressure, current_value, running
            FROM dbo.COMPRESSEURDATA 
            ORDER BY timestamp DESC
            """
            cur.execute(q)
        else:
            q = """
            SELECT 
                id, timestamp, vibration_x, vibration_y, vibration_z, 
                vx_rms, vy_rms, pressure, current_value, running
            FROM dbo.COMPRESSEURDATA 
            WHERE timestamp > ? 
            ORDER BY timestamp ASC
            """
            cur.execute(q, last_ts)
        
        rows = cur.fetchall()
        result = []
        new_last = last_ts
        
        for r in rows:
            # Gestion sécurisée des valeurs NULL
            vibration_x = float(r[2]) if r[2] is not None else 1.0
            vibration_y = float(r[3]) if r[3] is not None else 1.0
            vibration_z = float(r[4]) if r[4] is not None else 0.0
            vx_rms = float(r[5]) if r[5] is not None else 0.1
            vy_rms = float(r[6]) if r[6] is not None else 0.1
            pressure = float(r[7]) if r[7] is not None else 0.0
            current_value = float(r[8]) if r[8] is not None else 0.0
            
            # Générer les PSD simulés avec gestion d'erreur
            try:
                freqs_vx, psd_vx = generate_psd_from_vibration(vibration_x)
                freqs_vy, psd_vy = generate_psd_from_vibration(vibration_y)
            except Exception as e:
                print(f"[PSD] Erreur lors de la génération: {e}")
                # PSD par défaut en cas d'erreur
                freqs_vx = np.linspace(0, 1000, 512)
                psd_vx = np.ones_like(freqs_vx) * 1e-6
                freqs_vy = np.linspace(0, 1000, 512)
                psd_vy = np.ones_like(freqs_vy) * 1e-6
            
            item = {
                "id": r[0],
                "timestamp": r[1],
                "vibration_x": vibration_x,
                "vibration_y": vibration_y,
                "vibration_z": vibration_z,
                "vx_rms": vx_rms,
                "vy_rms": vy_rms,
                "pressure": pressure,
                "current_value": current_value,
                "running": bool(r[9]) if r[9] is not None else False,
                "spectrum_vx": {
                    "freqs": freqs_vx.tolist(),
                    "psd": psd_vx.tolist()
                },
                "spectrum_vy": {
                    "freqs": freqs_vy.tolist(),
                    "psd": psd_vy.tolist()
                }
            }
            result.append(item)
            
            if new_last is None or r[1] > new_last:
                new_last = r[1]
                
        print(f"[DB] {len(result)} nouvelles lignes récupérées")
        return result, new_last
        
    except Exception as e:
        print(f"[DB] Erreur lors de la récupération des données: {e}")
        return [], last_ts
    finally:
        cur.close()

class RealtimeViewer:
    def __init__(self):
        self.conn = None
        self.connected = False
        self.last_ts = None
        self.lock = threading.Lock()
        self.history = []

        print("[Config] Table: dbo.COMPRESSEURDATA")
        print("[Config] Surveillance PSD des vibrations en temps réel")

        # Configuration matplotlib avec style professionnel
        plt.style.use('default')
        self.fig = plt.figure(figsize=(15, 10))
        
        # Définition de la grille des graphiques
        gs = plt.GridSpec(3, 2, figure=self.fig)
        
        # Graphique PSD VX (principal)
        self.ax_psd_vx = self.fig.add_subplot(gs[0, 0])
        self.line_psd_vx, = self.ax_psd_vx.semilogy([], [], label='PSD VX', color='#2E86AB', linewidth=2)
        self.ax_psd_vx.set_xlabel("Frequency (Hz)", fontsize=12, fontweight='bold')
        self.ax_psd_vx.set_ylabel("Power Spectral Density", fontsize=12, fontweight='bold')
        self.ax_psd_vx.set_title("PSD VX - Vibration Spectrum", fontsize=14, fontweight='bold')
        self.ax_psd_vx.grid(True, alpha=0.3)
        self.ax_psd_vx.legend()
        self.ax_psd_vx.set_xlim(0, 1000)
        
        # Graphique PSD VY
        self.ax_psd_vy = self.fig.add_subplot(gs[0, 1])
        self.line_psd_vy, = self.ax_psd_vy.semilogy([], [], label='PSD VY', color='#A23B72', linewidth=2)
        self.ax_psd_vy.set_xlabel("Frequency (Hz)", fontsize=12, fontweight='bold')
        self.ax_psd_vy.set_ylabel("Power Spectral Density", fontsize=12, fontweight='bold')
        self.ax_psd_vy.set_title("PSD VY - Vibration Spectrum", fontsize=14, fontweight='bold')
        self.ax_psd_vy.grid(True, alpha=0.3)
        self.ax_psd_vy.legend()
        self.ax_psd_vy.set_xlim(0, 1000)
        
        # Graphique des vibrations temporelles
        self.ax_vib = self.fig.add_subplot(gs[1, :])
        self.line_vx, = self.ax_vib.plot([], [], label="Vibration X", color='#2E86AB', linewidth=1)
        self.line_vy, = self.ax_vib.plot([], [], label="Vibration Y", color='#A23B72', linewidth=1)
        self.line_vz, = self.ax_vib.plot([], [], label="Vibration Z", color='#F18F01', linewidth=1)
        self.ax_vib.legend()
        self.ax_vib.set_ylabel("Amplitude de Vibration", fontsize=10)
        self.ax_vib.set_xlabel("Temps", fontsize=10)
        self.ax_vib.grid(True, alpha=0.3)
        self.ax_vib.set_title("Vibrations Temporelles", fontsize=12, fontweight='bold')
        
        # Graphique des valeurs RMS
        self.ax_rms = self.fig.add_subplot(gs[2, 0])
        self.line_vx_rms, = self.ax_rms.plot([], [], label="VX RMS", color='#2E86AB', linewidth=2)
        self.line_vy_rms, = self.ax_rms.plot([], [], label="VY RMS", color='#A23B72', linewidth=2)
        self.ax_rms.legend()
        self.ax_rms.set_ylabel("Valeur RMS", fontsize=10)
        self.ax_rms.set_xlabel("Temps", fontsize=10)
        self.ax_rms.grid(True, alpha=0.3)
        self.ax_rms.set_title("Vibrations RMS", fontsize=12, fontweight='bold')
        
        # Graphique pression et courant
        self.ax_system = self.fig.add_subplot(gs[2, 1])
        self.line_pressure, = self.ax_system.plot([], [], label="Pression", color='#C73E1D', linewidth=2)
        self.line_current, = self.ax_system.plot([], [], label="Courant", color='#3F88C5', linewidth=2)
        self.ax_system.legend()
        self.ax_system.set_ylabel("Valeurs Système", fontsize=10)
        self.ax_system.set_xlabel("Temps", fontsize=10)
        self.ax_system.grid(True, alpha=0.3)
        self.ax_system.set_title("Pression et Courant", fontsize=12, fontweight='bold')
        
        self.fig.tight_layout()
        self.fig.subplots_adjust(top=0.95)

    def try_connect(self):
        try:
            self.conn = get_connection()
            self.connected = (self.conn is not None)
            if self.connected:
                print("[viewer] Connected to SQL Server")
            else:
                print("[viewer] SQL connection failed")
        except Exception as e:
            print("[viewer] SQL connect failed:", e)
            self.connected = False
            self.conn = None

    def poll_loop(self):
        if not self.connected:
            self.try_connect()
            
        while True:
            try:
                if self.connected and self.conn:
                    rows, new_last = fetch_latest_data(self.conn, self.last_ts)
                    if rows:
                        with self.lock:
                            for r in rows:
                                self.history.append(r)
                                if len(self.history) > N_HISTORY:
                                    self.history.pop(0)
                                self.last_ts = r["timestamp"]
                                
                                # Afficher les informations de diagnostic
                                if len(rows) > 0:
                                    last_row = rows[-1]
                                    print(f"[Data] VX:{last_row['vibration_x']:.3f} VY:{last_row['vibration_y']:.3f} RMS-X:{last_row['vx_rms']:.3f} P:{last_row['pressure']:.1f}")
                else:
                    # Simulation de données si pas de connexion DB
                    try:
                        with self.lock:
                            # Générer des données simulées avec des valeurs sécurisées
                            simulated_data = {
                                "timestamp": datetime.now(),
                                "vibration_x": max(np.random.uniform(0.5, 2.0), 0.1),
                                "vibration_y": max(np.random.uniform(0.5, 2.0), 0.1),
                                "vibration_z": max(np.random.uniform(0.5, 2.0), 0.1),
                                "vx_rms": max(np.random.uniform(0.1, 0.5), 0.01),
                                "vy_rms": max(np.random.uniform(0.1, 0.5), 0.01),
                                "pressure": max(np.random.uniform(5, 10), 0.1),
                                "current_value": max(np.random.uniform(10, 20), 0.1),
                                "running": True
                            }
                            
                            # Générer PSD simulés avec gestion d'erreur
                            try:
                                freqs_vx, psd_vx = generate_psd_from_vibration(simulated_data["vibration_x"])
                                freqs_vy, psd_vy = generate_psd_from_vibration(simulated_data["vibration_y"])
                            except Exception as e:
                                print(f"[Simulation PSD] Erreur: {e}")
                                freqs_vx = np.linspace(0, 1000, 512)
                                psd_vx = np.ones_like(freqs_vx) * 1e-6
                                freqs_vy = np.linspace(0, 1000, 512)
                                psd_vy = np.ones_like(freqs_vy) * 1e-6
                            
                            simulated_data["spectrum_vx"] = {
                                "freqs": freqs_vx.tolist(),
                                "psd": psd_vx.tolist()
                            }
                            simulated_data["spectrum_vy"] = {
                                "freqs": freqs_vy.tolist(),
                                "psd": psd_vy.tolist()
                            }
                            
                            self.history.append(simulated_data)
                            if len(self.history) > N_HISTORY:
                                self.history.pop(0)
                                
                    except Exception as e:
                        print(f"[Simulation] Erreur: {e}")
                        
            except Exception as e:
                print("[viewer] poll error:", e)
                self.connected = False
                try:
                    if self.conn:
                        self.conn.close()
                except:
                    pass
                self.conn = None
                
            time.sleep(POLL_S)

    def update_plot(self, frame):
        with self.lock:
            if not self.history:
                return
                
            timestamps = [h["timestamp"] for h in self.history]
            
            # Données temporelles
            vx = [h["vibration_x"] for h in self.history]
            vy = [h["vibration_y"] for h in self.history]
            vz = [h["vibration_z"] for h in self.history]
            vx_rms = [h["vx_rms"] for h in self.history]
            vy_rms = [h["vy_rms"] for h in self.history]
            pressure = [h["pressure"] for h in self.history]
            current = [h["current_value"] for h in self.history]
            
            # Mise à jour des graphiques temporels
            self.line_vx.set_data(timestamps, vx)
            self.line_vy.set_data(timestamps, vy)
            self.line_vz.set_data(timestamps, vz)
            self.ax_vib.relim()
            self.ax_vib.autoscale_view()
            
            self.line_vx_rms.set_data(timestamps, vx_rms)
            self.line_vy_rms.set_data(timestamps, vy_rms)
            self.ax_rms.relim()
            self.ax_rms.autoscale_view()
            
            self.line_pressure.set_data(timestamps, pressure)
            self.line_current.set_data(timestamps, current)
            self.ax_system.relim()
            self.ax_system.autoscale_view()
            
            # Mise à jour des graphiques PSD avec les dernières données
            last_data = self.history[-1]
            if "spectrum_vx" in last_data:
                freqs_vx = np.array(last_data["spectrum_vx"]["freqs"])
                psd_vx = np.array(last_data["spectrum_vx"]["psd"])
                self.line_psd_vx.set_data(freqs_vx, psd_vx)
                self.ax_psd_vx.relim()
                self.ax_psd_vx.autoscale_view()
                
            if "spectrum_vy" in last_data:
                freqs_vy = np.array(last_data["spectrum_vy"]["freqs"])
                psd_vy = np.array(last_data["spectrum_vy"]["psd"])
                self.line_psd_vy.set_data(freqs_vy, psd_vy)
                self.ax_psd_vy.relim()
                self.ax_psd_vy.autoscale_view()
                
            self.fig.canvas.draw_idle()

    def start(self):
        t = threading.Thread(target=self.poll_loop, daemon=True)
        t.start()
        ani = FuncAnimation(self.fig, self.update_plot, interval=int(POLL_S*1000), cache_frame_data=False)
        plt.show()

if __name__ == "__main__":
    v = RealtimeViewer()
    v.start()