import os
import sys
import zipfile
import requests
import io

STOCKFISH_WIN_URL = "https://github.com/official-stockfish/Stockfish/releases/download/sf_16.1/stockfish-windows-x86-64-avx2.zip"

def ensure_stockfish() -> str:
    """
    Ensures Stockfish binary is present in backend/bin/stockfish.exe.
    If missing, attempts to download the official Stockfish release.
    Returns path to stockfish executable.
    """
    bin_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "bin")
    os.makedirs(bin_dir, exist_ok=True)
    exe_path = os.path.join(bin_dir, "stockfish.exe")

    if os.path.exists(exe_path):
        return exe_path

    print(f"Downloading Stockfish engine to {exe_path}...")
    try:
        res = requests.get(STOCKFISH_WIN_URL, timeout=30)
        if res.status_code == 200:
            with zipfile.ZipFile(io.BytesIO(res.content)) as z:
                for file_info in z.infolist():
                    if file_info.filename.endswith(".exe"):
                        with z.open(file_info) as source, open(exe_path, "wb") as target:
                            target.write(source.read())
                        print("Stockfish engine downloaded successfully!")
                        return exe_path
    except Exception as e:
        print(f"Could not download Stockfish automatically: {e}")

    return ""

if __name__ == "__main__":
    path = ensure_stockfish()
    print("Stockfish path:", path)
