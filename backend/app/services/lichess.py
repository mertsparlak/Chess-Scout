import time
import requests
from typing import List, Dict, Any, Optional

LICHESS_USER_URL = "https://lichess.org/api/user/{username}"
LICHESS_GAMES_URL = "https://lichess.org/api/games/user/{username}"
LICHESS_EXPLORER_URL = "https://explorer.lichess.ovh/lichess"

HEADERS = {
    "Accept": "application/x-chess-pgn",
    "User-Agent": "ChessScout-Analytics-Platform/1.0 (https://github.com/mertsparlak/Chess-Scout)"
}

class LichessService:
    @staticmethod
    def fetch_user_games_pgn(username: str, max_games: int = 50) -> str:
        """
        Fetches public user games from Lichess in PGN format with server-side Stockfish evaluations.
        First verifies user existence via /api/user, then fetches games with 429 retry logic.
        """
        clean_user = username.strip()

        # 1. Verify user profile existence first
        user_res = requests.get(LICHESS_USER_URL.format(username=clean_user), headers={"User-Agent": HEADERS["User-Agent"]}, timeout=10)
        if user_res.status_code == 404:
            raise ValueError(f"Lichess üzerinde '{clean_user}' adında bir kullanıcı bulunamadı.")
        
        # Extract exact case-correct username from profile if available
        if user_res.status_code == 200:
            try:
                profile_data = user_res.json()
                clean_user = profile_data.get("username", clean_user)
            except Exception:
                pass

        # 2. Fetch PGN games
        url = LICHESS_GAMES_URL.format(username=clean_user)
        params = {
            "max": max_games,
            "pgnInBody": "true",
            "clocks": "true",
            "evals": "true",
            "opening": "true"
        }

        # Attempt up to 2 requests with a short delay if 429 Rate Limit is encountered
        for attempt in range(2):
            response = requests.get(url, params=params, headers=HEADERS, timeout=20)
            
            if response.status_code == 200:
                if not response.text.strip():
                    raise ValueError(f"'{clean_user}' kullanıcısının Lichess üzerinde incelenecek maçı bulunamadı.")
                return response.text
            elif response.status_code == 429:
                if attempt == 0:
                    time.sleep(3)  # Short pause and retry once
                    continue
                else:
                    raise RuntimeError("Lichess API istek sınırına ulaşıldı (HTTP 429 Rate Limit). Lichess sunucularının soğuması için lütfen 30 saniye bekleyip tekrar deneyiniz.")
            elif response.status_code == 404:
                raise ValueError(f"'{clean_user}' kullanıcısının oyun arşivi bulunamadı.")
            else:
                raise RuntimeError(f"Lichess API hatası: HTTP {response.status_code}")

        raise RuntimeError("Lichess oyun verileri alınamadı.")

    @staticmethod
    def get_opening_explorer(fen: str) -> Optional[Dict[str, Any]]:
        params = {
            "fen": fen,
            "moves": 5,
            "topGames": 0
        }
        try:
            response = requests.get(LICHESS_EXPLORER_URL, params=params, headers={"User-Agent": HEADERS["User-Agent"]}, timeout=5)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
        return None
