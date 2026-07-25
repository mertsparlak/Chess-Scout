import math
import chess
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services.lichess import LichessService
from app.services.chess_com import ChessComService
from app.services.pgn_parser import PGNParser
from app.analytics.stockfish_eval import StockfishEvaluator
from app.analytics.feature_extractor import FeatureExtractor
from app.analytics.counter_strategy import CounterStrategyGenerator
from app.analytics.tactical_detector import TacticalDetector
from app.analytics.gm_similarity import GMSimilarityEngine

app = FastAPI(
    title="ChessMind Intelligence Platform API",
    description="Chess Player Behavior & Scouting Analytics API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeUserRequest(BaseModel):
    username: str
    platform: str = "lichess"
    max_games: int = 15

class AnalyzePGNRequest(BaseModel):
    pgn_text: str
    target_username: Optional[str] = None

@app.get("/api/health")
def health_check():
    evaluator = StockfishEvaluator()
    has_engine = evaluator.engine is not None
    evaluator.close()
    return {
        "status": "online",
        "stockfish_available": has_engine,
        "platform": "ChessMind API v1.0"
    }

@app.post("/api/analyze/user")
def analyze_user(req: AnalyzeUserRequest):
    username = req.username.strip()
    platform = req.platform.lower().strip()
    max_games = min(req.max_games, 100)

    try:
        if platform == "lichess":
            pgn_text = LichessService.fetch_user_games_pgn(username, max_games=max_games)
        elif platform == "chesscom":
            pgn_text = ChessComService.fetch_user_games_pgn(username, max_games=max_games)
        else:
            raise HTTPException(status_code=400, detail="Platform must be 'lichess' or 'chesscom'")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch games: {str(e)}")

    if not pgn_text:
        raise HTTPException(status_code=404, detail=f"No games found for player '{username}' on {platform}.")

    return _process_pgn_analysis(pgn_text, target_username=username)

@app.post("/api/analyze/pgn")
def analyze_pgn(req: AnalyzePGNRequest):
    if not req.pgn_text.strip():
        raise HTTPException(status_code=400, detail="PGN text cannot be empty.")
    return _process_pgn_analysis(req.pgn_text, target_username=req.target_username)

def _process_pgn_analysis(pgn_text: str, target_username: Optional[str] = None) -> Dict[str, Any]:
    games = PGNParser.parse_pgn_text(pgn_text, target_username=target_username)
    if not games:
        raise HTTPException(status_code=400, detail="Could not parse any valid games from PGN.")

    if not target_username and games:
        target_username = games[0]["white"]

    evaluator = StockfishEvaluator(depth=12)
    eval_data = []

    for game in games:
        game_evals = []
        user_color = game["user_color"]
        moves = game["moves"][:50]

        # Starting eval for White is +15 cp
        current_eval_white = 15

        for idx, move_info in enumerate(moves):
            # Check if move comment has embedded eval from PGN
            eval_comment = move_info.get("eval_cp")
            
            if eval_comment is not None:
                eval_after_white = eval_comment
            else:
                # Use local Stockfish engine to get evaluation of position after move (from White POV)
                try:
                    board_after = chess.Board(move_info["fen_after"])
                    pos_eval = evaluator.evaluate_position(board_after, player_color=chess.WHITE)
                    eval_after_white = pos_eval["score_cp"]
                except Exception:
                    eval_after_white = current_eval_white

            # Calculate Centipawn Loss (CPL) for the move
            if move_info["turn"] == "white":
                cpl = max(0, current_eval_white - eval_after_white)
            else:
                cpl = max(0, eval_after_white - current_eval_white)

            # Update current eval for next move
            current_eval_white = eval_after_white

            # Evaluate quality and features ONLY if this move was played by target player
            if move_info["turn"] == user_color:
                accuracy = round(max(15.0, min(99.0, 103.0 - (0.6 * cpl))), 1)

                move_quality = "good"
                if cpl >= 200:
                    move_quality = "blunder"
                elif cpl >= 90:
                    move_quality = "mistake"
                elif cpl >= 35:
                    move_quality = "inaccuracy"

                try:
                    board_before = chess.Board(move_info["fen_before"])
                    played_move = chess.Move.from_uci(move_info["uci"])
                    patterns = TacticalDetector.detect_patterns(board_before, played_move)
                except Exception:
                    patterns = {}

                ev = {
                    "eval_before_cp": current_eval_white,
                    "eval_after_cp": eval_after_white,
                    "cpl": cpl,
                    "accuracy": accuracy,
                    "quality": move_quality,
                    "patterns": patterns,
                    "turn": move_info["turn"],
                    "clock_sec": move_info["clock_sec"]
                }
                game_evals.append(ev)

        eval_data.append(game_evals)

    evaluator.close()

    profile = FeatureExtractor.extract_player_profile(games, target_username, eval_data)
    strategy = CounterStrategyGenerator.generate_strategy(profile)
    gm_similarity = GMSimilarityEngine.compute_similarity(profile.get("scores", {}))

    return {
        "target_username": target_username,
        "profile": profile,
        "counter_strategy": strategy,
        "gm_similarity": gm_similarity,
        "games_analyzed": len(games)
    }
