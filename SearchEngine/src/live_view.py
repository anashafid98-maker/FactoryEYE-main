import time

import requests

import numpy as np

import matplotlib.pyplot as plt
 
# ======================

# CONFIG

# ======================

API_BASE = "http://10.190.50.153:5000"

# number of points to fetch for live‑view (adjustable)
# user wants 512 samples
N_POINTS = 512

REFRESH_S = 2.0
 
# If backend doesn't provide spectrum_vx, we compute FFT locally

# lowering the sampling frequency to keep spectrum limited
# backend/frontend agreed on 50 Hz per user request
FS = 50.0  # Hz (must match your acquisition loop if you want meaningful spectrum)
 
 
# ======================

# HELPERS

# ======================

def safe_float(x, default=np.nan):

    try:

        return float(x)

    except Exception:

        return default
 
def fetch_timeseries(n=N_POINTS):

    r = requests.get(f"{API_BASE}/api/timeseries", params={"n": n}, timeout=8)

    r.raise_for_status()

    js = r.json()

    return js.get("data", [])
 
def fetch_latest():

    r = requests.get(f"{API_BASE}/api/latest", timeout=8)

    r.raise_for_status()

    js = r.json()

    return js.get("data", {})
 
def compute_fft_amplitude(x: np.ndarray, fs: float):

    x = np.asarray(x, dtype=float)

    n = len(x)

    if n < 8 or fs <= 0:

        return np.array([]), np.array([])

    x = x - np.nanmean(x)

    w = np.hanning(n)

    xw = x * w

    scale = np.sum(w) / n if np.sum(w) > 1e-12 else 1.0

    X = np.fft.rfft(xw)

    freqs = np.fft.rfftfreq(n, d=1.0/fs)

    amp = (2.0 / n) * np.abs(X) / scale

    amp[0] = amp[0] / 2.0

    return freqs, np.maximum(amp, 1e-20)
 
 
# ======================

# MAIN

# ======================

def main():

    plt.ion()

    fig = plt.figure(figsize=(16, 9))
 
    ax_vib = fig.add_subplot(2, 2, 1)

    ax_spec = fig.add_subplot(2, 2, 2)

    ax_kpi = fig.add_subplot(2, 2, 3)

    ax_sys = fig.add_subplot(2, 2, 4)
 
    # --- vibration + RMS ---

    line_vx, = ax_vib.plot([], [], label="vibration_x")

    line_rms, = ax_vib.plot([], [], label="vx_rms")

    ax_vib.set_title("Vibration X + RMS")

    ax_vib.set_xlabel("Sample index")

    ax_vib.set_ylabel("Value")

    ax_vib.grid(True)

    ax_vib.legend()
 
    # --- spectrum ---

    line_spec, = ax_spec.plot([], [], label="Spectrum (PSD or FFT)")

    ax_spec.set_title("Frequency spectrum (VX)")

    ax_spec.set_xlabel("Frequency (Hz)")

    ax_spec.set_ylabel("PSD / amplitude")

    ax_spec.grid(True)

    ax_spec.legend()

    ax_spec.set_yscale("log")
 
    # --- KPIs ---

    line_peak, = ax_kpi.plot([], [], label="vx_peak")

    line_crest, = ax_kpi.plot([], [], label="vx_crest_factor")

    line_kurt, = ax_kpi.plot([], [], label="vx_kurtosis")

    line_domf, = ax_kpi.plot([], [], label="vx_dom_freq_hz")

    ax_kpi.set_title("KPIs over time")

    ax_kpi.set_xlabel("Sample index")

    ax_kpi.set_ylabel("Value")

    ax_kpi.grid(True)

    ax_kpi.legend()
 
    # --- pressure & current ---

    line_p, = ax_sys.plot([], [], label="pressure")

    line_i, = ax_sys.plot([], [], label="current_value")

    ax_sys.set_title("Pressure + Current")

    ax_sys.set_xlabel("Sample index")

    ax_sys.set_ylabel("Value")

    ax_sys.grid(True)

    ax_sys.legend()
 
    print(f"[LIVE] API: {API_BASE}")

    print("Close the plot window to stop.")
 
    while plt.fignum_exists(fig.number):

        try:

            rows = fetch_timeseries(N_POINTS)

            if not rows:

                time.sleep(REFRESH_S)

                continue
 
            # arrays

            vx = np.array([safe_float(r.get("vibration_x")) for r in rows], dtype=float)

            pr = np.array([safe_float(r.get("pressure")) for r in rows], dtype=float)

            cu = np.array([safe_float(r.get("current_value")) for r in rows], dtype=float)
 
            vx_rms = np.array([safe_float(r.get("vx_rms")) for r in rows], dtype=float)

            vx_peak = np.array([safe_float(r.get("vx_peak")) for r in rows], dtype=float)

            vx_crest = np.array([safe_float(r.get("vx_crest_factor")) for r in rows], dtype=float)

            vx_kurt = np.array([safe_float(r.get("vx_kurtosis")) for r in rows], dtype=float)

            vx_domf = np.array([safe_float(r.get("vx_dom_freq_hz")) for r in rows], dtype=float)
 
            idx = np.arange(len(rows))
 
            # --- vibration plot ---

            line_vx.set_data(idx, vx)

            line_rms.set_data(idx, vx_rms)

            ax_vib.relim()

            ax_vib.autoscale_view()
 
            # --- system plot ---

            line_p.set_data(idx, pr)

            line_i.set_data(idx, cu)

            ax_sys.relim()

            ax_sys.autoscale_view()
 
            # --- KPI plot ---

            line_peak.set_data(idx, vx_peak)

            line_crest.set_data(idx, vx_crest)

            line_kurt.set_data(idx, vx_kurt)

            line_domf.set_data(idx, vx_domf)

            ax_kpi.relim()

            ax_kpi.autoscale_view()
 
            # --- spectrum ---

            latest = fetch_latest()

            spec = latest.get("spectrum_vx") or {}

            freqs = spec.get("freqs") or []

            psd = spec.get("psd") or []
 
            if len(freqs) > 5 and len(psd) == len(freqs):

                fx = np.array([safe_float(f, 0.0) for f in freqs], dtype=float)

                fy = np.array([max(safe_float(p, 1e-20), 1e-20) for p in psd], dtype=float)

                line_spec.set_data(fx, fy)

                ax_spec.set_ylabel("PSD (from backend)")

            else:

                f_fft, amp = compute_fft_amplitude(vx, FS)

                if len(f_fft) > 0:

                    line_spec.set_data(f_fft, amp)

                    ax_spec.set_ylabel("Amplitude (local FFT)")

            ax_spec.relim()

            ax_spec.autoscale_view()
 
            # ---- Title with latest values ----

            ts = latest.get("timestamp", "n/a")

            fig.suptitle(

                f"{ts} | vx={safe_float(latest.get('vibration_x'),0):.2f} "

                f"rms={safe_float(latest.get('vx_rms'),0):.4f} "

                f"peak={safe_float(latest.get('vx_peak'),0):.2f} "

                f"crest={safe_float(latest.get('vx_crest_factor'),0):.2f} "

                f"kurt={safe_float(latest.get('vx_kurtosis'),0):.2f} "

                f"domF={safe_float(latest.get('vx_dom_freq_hz'),0):.2f}Hz "

                f"P={safe_float(latest.get('pressure'),0):.2f} "

                f"I={safe_float(latest.get('current_value'),0):.2f}",

                fontsize=10

            )
 
            fig.tight_layout(rect=[0, 0.02, 1, 0.95])

            fig.canvas.draw()

            fig.canvas.flush_events()
 
        except Exception as e:

            print("[WARN]", e)
 
        time.sleep(REFRESH_S)
 
    print("[STOP] Plot closed.")
 
 
if __name__ == "__main__":

    main()
 