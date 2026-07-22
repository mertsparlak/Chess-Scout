import requests
from typing import List, Dict, Any, Optional

CHESS_COM_USER_GAMES_URL = "https://api.chess.com/pub/player/{username}/games/archives"

class ChessComService:
    @staticmethod
    def fetch_user_games_pgn(username: str, max_games: int = 50) -> str:
        """
        Fetches public user games from Chess.com in PGN format.
        """
        headers = {"User-Agent": "ChessMind-Analytics-Platform/1.0 (contact: test@example.com)"}
        archives_url = CHESS_COM_USER_GAMES_URL.format(username=username.lower())
        
        res = requests.get(archives_url, headers=headers, timeout=10)
        if res.status_code == 404:
            raise ValueError(f"Chess.com user '{username}' not found.")
        if res.status_code != 200:
            raise RuntimeError(f"Chess.com API error: {res.status_code}")

        archives = res.json().get("archives", [])
        if not archives:
            return ""

        # Fetch from latest month archives until we accumulate max_games
        pgns = []
        count = 0
        for archive_url in reversed(archives):
            if count >= max_games:
                break
            archive_res = requests.get(archive_url, headers=headers, timeout=10)
            if archive_res.status_code == 200:
                games = archive_res.json().get("games", [])
                for g in reversed(games):
                    if "pgn" in g:
                        pgns.append(g["pgn"])
                        count += 1
                        if count >= max_games:
                            break
        
        return "\n\n".join(pgns)
