import chess
from typing import Dict, Any, List

class TacticalDetector:
    @staticmethod
    def detect_patterns(board: chess.Board, move: chess.Move) -> Dict[str, bool]:
        """
        Detects tactical patterns: Pins, Forks, Skewers, Discovered Attacks, Captures, Queen Trades.
        """
        is_capture = board.is_capture(move)
        moved_piece = board.piece_at(move.from_square)
        
        board_copy = board.copy()
        board_copy.push(move)
        
        turn_color = moved_piece.color if moved_piece else board.turn
        enemy_color = not turn_color

        # 1. Queen Trade
        is_queen_trade = False
        if is_capture and moved_piece and moved_piece.piece_type == chess.QUEEN:
            captured_piece = board.piece_at(move.to_square)
            if captured_piece and captured_piece.piece_type == chess.QUEEN:
                is_queen_trade = True

        # 2. Fork
        is_fork = False
        attacks = board_copy.attacks(move.to_square)
        attacked_valuable = 0
        for sq in attacks:
            p = board_copy.piece_at(sq)
            if p and p.color == enemy_color and p.piece_type != chess.PAWN:
                attacked_valuable += 1
        if attacked_valuable >= 2:
            is_fork = True

        # 3. Pin
        is_pin = False
        for sq in board_copy.pieces(chess.PAWN, enemy_color) | board_copy.pieces(chess.KNIGHT, enemy_color) | board_copy.pieces(chess.BISHOP, enemy_color) | board_copy.pieces(chess.ROOK, enemy_color):
            if board_copy.is_pinned(enemy_color, sq):
                is_pin = True
                break

        # 4. Discovered Attack (A piece moved revealing an attack from another piece behind it)
        is_discovered = False
        if moved_piece and moved_piece.piece_type not in (chess.QUEEN, chess.ROOK, chess.BISHOP):
            # If sliding piece behind now attacks enemy king/queen
            for sq in board_copy.pieces(chess.QUEEN, turn_color) | board_copy.pieces(chess.ROOK, turn_color) | board_copy.pieces(chess.BISHOP, turn_color):
                for enemy_sq in board_copy.pieces(chess.KING, enemy_color) | board_copy.pieces(chess.QUEEN, enemy_color):
                    if enemy_sq in board_copy.attacks(sq):
                        is_discovered = True
                        break

        # 5. Skewer (Attacks valuable piece in front, revealing less valuable behind)
        is_skewer = is_pin and moved_piece and moved_piece.piece_type in (chess.BISHOP, chess.ROOK, chess.QUEEN)

        return {
            "is_capture": is_capture,
            "is_queen_trade": is_queen_trade,
            "is_fork": is_fork,
            "is_pin": is_pin,
            "is_discovered": is_discovered,
            "is_skewer": is_skewer
        }
