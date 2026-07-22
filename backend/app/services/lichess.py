import requests
from typing import List, Dict, Any, Optional

LICHESS_GAMES_URL = "https://lichess.org/api/games/user/{username}"
LICHESS_EXPLORER_URL = "https://explorer.lichess.ovh/lichess"

class LichessService:
    @staticmethod
    def fetch_user_games_pgn(username: str, max_games: int = 50) -> str:
        """
        Fetches public user games from Lichess in PGN format with server-side Stockfish evaluations.
        """
        url = LICHESS_GAMES_URL.format(username=username)
        params = {
            "max": max_games,
            "pgnInBody": "true",
            "clocks": "true",
            "evals": "true",  # Enable server-side Stockfish evaluations from Lichess
            "opening": "true"
        }
        headers = {"Accept": "application/x-chess-pgn"}
        
        response = requests.get(url, params=params, headers=headers, timeout=15)
        if response.status_code == 200:
            return response.text
        elif response.status_code == 404:
            raise ValueError(f"Lichess user '{username}' not found.")
        else:
            raise RuntimeError(f"Lichess API error: {response.status_code} - {response.text}")

    @staticmethod
    def get_opening_explorer(fen: str) -> Optional[Dict[str, Any]]:
        params = {
            "fen": fen,
            "moves": 5,
            "topGames": 0
        }
        try:
            response = requests.get(LICHESS_EXPLORER_URL, params=params, timeout=5)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
        return None
