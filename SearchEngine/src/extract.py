# extract.py
 
import os
import pandas as pd
import pyodbc
from config import CONN_STR, PATH_CSV 
 
def export_csv(path=PATH_CSV):
    cnxn = pyodbc.connect(CONN_STR)
    cwd = os.getcwd()
    print(f"[DEBUG] Répertoire courant : {cwd}")
 
    out_dir = os.path.dirname(path)
    print(f"[DEBUG] Création du dossier : {out_dir}")
    os.makedirs(out_dir, exist_ok=True)
 
    print(f"[DEBUG] Connexion SQL Server...")
    
 
    query = """
        SELECT TOP 10000
               vibration_x,
               vibration_y,
               vibration_z,
               current_value,
               pressure
          FROM dbo.COMPRESSEURDATA
        ORDER BY timestamp DESC
    """
    print(f"[DEBUG] Exécution de la requête...")
    df = pd.read_sql(query, cnxn)
    cnxn.close()
 
    print(f"[DEBUG] Lignes extraites : {len(df)}")
    if df.empty:
        print("[WARNING] Aucune donnée trouvée.")
 
    df.to_csv(path, index=False)
    abs_path = os.path.abspath(path)
    print(f"[OK] CSV généré : {abs_path}")
 
if __name__ == "__main__":
    export_csv()