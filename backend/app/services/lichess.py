import os
import time
import requests
from typing import List, Dict, Any, Optional

LICHESS_USER_URL = "https://lichess.org/api/user/{username}"
LICHESS_GAMES_URL = "https://lichess.org/api/games/user/{username}"
LICHESS_EXPLORER_URL = "https://explorer.lichess.ovh/lichess"

class LichessService:
    @staticmethod
    def fetch_user_games_pgn(username: str, max_games: int = 50, api_token: Optional[str] = None) -> str:
        """
        Fetches public user games from Lichess in PGN format.
        Supports optional Lichess Personal Access Token (or environment variable LICHESS_TOKEN)
        to bypass IP-based HTTP 429 stream rate limits.
        """
        clean_user = username.strip()

        # Get token from function arg, env var, or None
        token = api_token or os.environ.get("LICHESS_TOKEN") or os.environ.get("LICHESS_API_TOKEN")

        headers = {
            "Accept": "application/x-chess-pgn",
            "User-Agent": "ChessScout-Analytics-Platform/1.0 (https://github.com/mertsparlak/Chess-Scout)"
        }
        if token and token.strip():
            headers["Authorization"] = f"Bearer {token.strip()}"

        # 1. Verify user profile existence first via lightweight API
        user_res = requests.get(LICHESS_USER_URL.format(username=clean_user), headers={"User-Agent": headers["User-Agent"]}, timeout=10)
        if user_res.status_code == 404:
            raise ValueError(f"Lichess üzerinde '{clean_user}' adında bir kullanıcı bulunamadı.")
        
        if user_res.status_code == 200:
            try:
                profile_data = user_res.json()
                clean_user = profile_data.get("username", clean_user)
            except Exception:
                pass

        # 2. Fetch PGN games from stream endpoint
        url = LICHESS_GAMES_URL.format(username=clean_user)
        params = {
            "max": max_games,
            "pgnInBody": "true",
            "clocks": "true",
            "opening": "true"
        }

        response = requests.get(url, params=params, headers=headers, timeout=20)
        
        if response.status_code == 200:
            if not response.text.strip():
                raise ValueError(f"'{clean_user}' kullanıcısının Lichess üzerinde incelenecek maçı bulunamadı.")
            return response.text
        elif response.status_code == 429:
            raise RuntimeError(
                "Lichess API IP oran sınırına takıldı (HTTP 429 Rate Limit). "
                "Lichess anonim sorgularda IP başına dakikada 1 indirmeye izin vermektedir. "
                "Arayüze veya backend/.env dosyasına ücretsiz bir Lichess Personal Access Token girerek bu engeli anında kaldırabilirsiniz."
            )
        elif response.status_code == 401:
            raise RuntimeError("Girilen Lichess API Token geçersiz veya süresi dolmuş.")
        elif response.status_code == 404:
            raise ValueError(f"'{clean_user}' kullanıcısının oyun arşivi bulunamadı.")
        else:
            raise RuntimeError(f"Lichess API hatası: HTTP {response.status_code}")
