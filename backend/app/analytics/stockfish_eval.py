import os
import shutil
import math
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning, module="chess.engine")

import chess
import chess.engine
from typing import Dict, Any, Optional
from app.analytics.tactical_detector import TacticalDetector

PAWN_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
]

KNIGHT_TABLE = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
]

class StockfishEvaluator:
    def __init__(self, stockfish_path: Optional[str] = None, depth: int = 12):
        self.depth = depth
        
        local_bin = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "bin", "stockfish.exe")
        if stockfish_path and os.path.exists(stockfish_path):
            self.stockfish_path = stockfish_path
        elif os.path.exists(local_bin):
            self.stockfish_path = local_bin
        else:
            self.stockfish_path = shutil.which("stockfish")

        self.engine = None
        if self.stockfish_path and os.path.exists(self.stockfish_path):
            try:
                self.engine = chess.engine.SimpleEngine.popen_uci(self.stockfish_path)
            except Exception as e:
                print(f"Warning: Could not launch Stockfish at {self.stockfish_path}: {e}")
                self.engine = None

    def evaluate_position(self, board: chess.Board, player_color: chess.Color = chess.WHITE) -> Dict[str, Any]:
        """
        Evaluates position from player_color's Point of View (POV).
        """
        if self.engine:
            try:
                info = self.engine.analyse(board, chess.engine.Limit(depth=self.depth))
                score = info["score"].pov(player_color)
                best_move = info.get("pv", [None])[0]

                score_cp = score.score(mate_score=10000)
                is_mate = score.is_mate()

                return {
                    "score_cp": score_cp,
                    "is_mate": is_mate,
                    "best_move_uci": best_move.uci() if best_move else None,
                    "best_move_san": board.san(best_move) if best_move else None
                }
            except Exception as e:
                print(f"Stockfish eval error: {e}")

        return self._smart_heuristic_eval(board, player_color=player_color)

    def evaluate_move(self, fen_before: str, played_move_uci: str) -> Dict[str, Any]:
        board = chess.Board(fen_before)
        player_color = board.turn
        played_move = chess.Move.from_uci(played_move_uci)

        patterns = TacticalDetector.detect_patterns(board, played_move)

        eval_before = self.evaluate_position(board, player_color=player_color)
        board.push(played_move)
        eval_after = self.evaluate_position(board, player_color=player_color)

        before_cp = eval_before["score_cp"]
        after_cp = eval_after["score_cp"]
        
        cpl = max(0, before_cp - after_cp)
        accuracy = round(max(15.0, min(99.0, 103.0 - (0.6 * cpl))), 1)

        move_quality = "good"
        if cpl >= 200:
            move_quality = "blunder"
        elif cpl >= 90:
            move_quality = "mistake"
        elif cpl >= 35:
            move_quality = "inaccuracy"

        return {
            "eval_before_cp": before_cp,
            "eval_after_cp": after_cp,
            "best_move_uci": eval_before["best_move_uci"],
            "best_move_san": eval_before["best_move_san"],
            "cpl": cpl,
            "accuracy": accuracy,
            "quality": move_quality,
            "patterns": patterns
        }

    def _smart_heuristic_eval(self, board: chess.Board, player_color: chess.Color = chess.WHITE) -> Dict[str, Any]:
        piece_values = {
            chess.PAWN: 100, chess.KNIGHT: 320, chess.BISHOP: 330,
            chess.ROOK: 500, chess.QUEEN: 900, chess.KING: 20000
        }
        
        val = 0
        for sq, piece in board.piece_map().items():
            p_val = piece_values.get(piece.piece_type, 0)
            pst_bonus = 0
            if piece.piece_type == chess.PAWN:
                pst_bonus = PAWN_TABLE[sq if piece.color == chess.WHITE else chess.square_mirror(sq)]
            elif piece.piece_type == chess.KNIGHT:
                pst_bonus = KNIGHT_TABLE[sq if piece.color == chess.WHITE else chess.square_mirror(sq)]

            p_total = p_val + pst_bonus
            mult = 1 if piece.color == player_color else -1
            val += mult * p_total

        # 1-ply threat check for side to move
        if board.turn == player_color:
            max_opponent_capture = 0
            for move in board.legal_moves:
                if board.is_capture(move):
                    captured = board.piece_at(move.to_square)
                    attacker = board.piece_at(move.from_square)
                    if captured:
                        cap_gain = piece_values.get(captured.piece_type, 0) - piece_values.get(attacker.piece_type, 0)
                        if cap_gain > max_opponent_capture:
                            max_opponent_capture = cap_gain
            val -= max_opponent_capture

        return {
            "score_cp": val,
            "is_mate": False,
            "best_move_uci": None,
            "best_move_san": None
        }

    def close(self):
        if self.engine:
            self.engine.quit()
