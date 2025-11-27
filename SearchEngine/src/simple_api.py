from flask import Flask, jsonify
from flask_cors import CORS
import numpy as np
from scipy import signal
from datetime import datetime
import time
import threading

app = Flask(__name__)
CORS(app)

# Données simulées en mémoire
latest_data = []

def generate_psd_from_vibration(vibration_data, fs=2000.0):
    """Génère un PSD simulé identique à viewer.py"""
    try:
        vibration_magnitude = max(abs(float(vibration_data)), 0.1)
        t = np.linspace(0, 1, int(fs))
        
        rpm = 1250
        fundamental_freq = rpm / 60
        harmonic_2 = fundamental_freq * 2
        harmonic_3 = fundamental_freq * 3
        
        signal_clean = (vibration_magnitude * 
                       (np.sin(2 * np.pi * fundamental_freq * t) +
                        0.5 * np.sin(2 * np.pi * harmonic_2 * t) +
                        0.3 * np.sin(2 * np.pi * harmonic_3 * t) +
                        0.2 * np.sin(2 * np.pi * 100 * t) +
                        0.1 * np.sin(2 * np.pi * 150 * t)))
        
        noise = np.random.normal(0, 0.1 * vibration_magnitude, len(t))
        signal_with_noise = signal_clean + noise
        
        freqs, psd = signal.welch(signal_with_noise, fs, nperseg=1024, scaling='density')
        psd = np.maximum(psd, 1e-12)
        
        return freqs, psd
        
    except Exception as e:
        print(f"[PSD] Erreur: {e}")
        freqs = np.linspace(0, 1000, 512)
        psd = np.ones_like(freqs) * 1e-6
        return freqs, psd

def generate_simulated_data():
    """Génère des données simulées réalistes avec variation progressive"""
    # Variation plus lente pour simulation réaliste
    base_time = datetime.now()
    time_variation = np.sin(base_time.minute * 0.1) * 0.5
    
    base_vibration = 0.8 + time_variation + np.random.uniform(-0.2, 0.2)
    
    # Générer les PSD
    freqs_vx, psd_vx = generate_psd_from_vibration(base_vibration + np.random.uniform(-0.1, 0.1))
    freqs_vy, psd_vy = generate_psd_from_vibration(base_vibration + np.random.uniform(-0.1, 0.1))
    
    # Simulation de tendances réalistes
    pressure_variation = 5 + 2 * np.sin(base_time.minute * 0.05)
    current_variation = 10 + 3 * np.sin(base_time.minute * 0.03)
    
    return {
        "id": len(latest_data) + 1,
        "timestamp": base_time.isoformat(),
        "vibration_x": round(base_vibration + np.random.uniform(-0.05, 0.05), 3),
        "vibration_y": round(base_vibration + np.random.uniform(-0.05, 0.05), 3),
        "vibration_z": round(0.3 + np.random.uniform(0, 0.2), 3),
        "vx_rms": round(0.1 + np.random.uniform(0, 0.1), 3),
        "vy_rms": round(0.1 + np.random.uniform(0, 0.1), 3),
        "pressure": round(pressure_variation + np.random.uniform(-0.5, 0.5), 1),
        "current_value": round(current_variation + np.random.uniform(-1, 1), 1),
        "running": True,
        "spectrum_vx": {
            "freqs": freqs_vx.tolist(),
            "psd": psd_vx.tolist()
        },
        "spectrum_vy": {
            "freqs": freqs_vy.tolist(), 
            "psd": psd_vy.tolist()
        }
    }

def data_generator():
    """Générateur de données en arrière-plan - 1 minute d'intervalle"""
    global latest_data
    
    while True:
        try:
            # Ajoute une nouvelle donnée
            new_data = generate_simulated_data()
            latest_data.append(new_data)
            
            # Garde seulement les 60 dernières valeurs (1 heure de données)
            if len(latest_data) > 60:
                latest_data = latest_data[-60:]
            
            print(f"🕐 [{datetime.now().strftime('%H:%M:%S')}] Donnée générée: "
                  f"VX={new_data['vibration_x']:.3f}, "
                  f"P={new_data['pressure']:.1f} bar, "
                  f"{len(latest_data)} points")
            
        except Exception as e:
            print(f"❌ Erreur génération: {e}")
        
        # CHANGEMENT: 60 secondes au lieu de 2
        time.sleep(60)

@app.route('/api/data')
def get_data():
    """Retourne toutes les données"""
    return jsonify(latest_data)

@app.route('/api/latest')
def get_latest():
    """Retourne la dernière mesure"""
    if latest_data:
        return jsonify(latest_data[-1])
    return jsonify({})

@app.route('/api/health')
def health():
    return jsonify({
        "status": "healthy",
        "data_points": len(latest_data),
        "timestamp": datetime.now().isoformat(),
        "refresh_rate": "60 seconds"
    })

@app.route('/')
def home():
    return """
    <h1>API FactoryEYE - Simulation Virtuelle</h1>
    <p><strong>Rafraîchissement: 1 minute</strong></p>
    <p>Endpoints disponibles:</p>
    <ul>
        <li><a href="/api/data">/api/data</a> - Toutes les données ({count} points)</li>
        <li><a href="/api/latest">/api/latest</a> - Dernière mesure</li>
        <li><a href="/api/health">/api/health</a> - Statut</li>
    </ul>
    <p><em>Nouvelle donnée générée toutes les 60 secondes</em></p>
    """.format(count=len(latest_data))

if __name__ == '__main__':
    # Génère des données initiales
    print("🔄 Génération des données initiales...")
    for i in range(5):
        latest_data.append(generate_simulated_data())
        time.sleep(1)
    
    # Démarre le générateur de données
    generator_thread = threading.Thread(target=data_generator, daemon=True)
    generator_thread.start()
    
    print("🚀 Serveur Flask démarré sur http://localhost:5000")
    print("⏰ Simulation virtuelle active - Rafraîchissement toutes les 60 secondes")
    print("📊 Nouvelle donnée générée chaque minute")
    
    app.run(host='0.0.0.0', port=5000, debug=False)