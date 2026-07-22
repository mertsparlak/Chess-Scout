import io
import re
import chess.pgn
from typing import List, Dict, Any, Optional

class PGNParser:
    @staticmethod
    def parse_pgn_text(pgn_text: str, target_username: Optional[str] = None) -> List[Dict[str, Any]]:
        games_data = []
        pgn_io = io.StringIO(pgn_text)
        
        while True:
            game = chess.pgn.read_game(pgn_io)
            if game is None:
                break

            headers = dict(game.headers)
            white_user = headers.get("White", "")
            black_user = headers.get("Black", "")

            user_color = chess.WHITE
            if target_username:
                target_clean = target_username.strip().lower()
                white_clean = white_user.strip().lower()
                black_clean = black_user.strip().lower()

                if target_clean in white_clean or white_clean in target_clean:
                    user_color = chess.WHITE
                elif target_clean in black_clean or black_clean in target_clean:
                    user_color = chess.BLACK
                else:
                    user_color = chess.WHITE

            board = game.board()
            moves = []
            prev_clock = None

            for node in game.mainline():
                move = node.move
                fen_before = board.fen()
                san = board.san(move)
                uci = move.uci()
                turn = board.turn

                comment = node.comment or ""

                # Extract clock comment [%clk 0:03:15]
                clock_sec = None
                if "%clk" in comment:
                    match = re.search(r"%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)", comment)
                    if match:
                        h, m, s = match.groups()
                        clock_sec = int(h) * 3600 + int(m) * 60 + float(s)

                time_spent = None
                if clock_sec is not None and prev_clock is not None:
                    time_spent = max(0.0, prev_clock - clock_sec)

                # Extract embedded Stockfish eval [%eval 0.45] or [%eval #-2]
                eval_cp = None
                if "%eval" in comment:
                    eval_match = re.search(r"%eval\s+([#-]?\d+(?:\.\d+)?)", comment)
                    if eval_match:
                        val_str = eval_match.group(1)
                        if val_str.startswith("#-"):
                            eval_cp = -10000
                        elif val_str.startswith("#"):
                            eval_cp = 10000
                        else:
                            try:
                                eval_cp = int(float(val_str) * 100)
                            except ValueError:
                                eval_cp = None

                board.push(move)
                fen_after = board.fen()

                moves.append({
                    "san": san,
                    "uci": uci,
                    "fen_before": fen_before,
                    "fen_after": fen_after,
                    "turn": "white" if turn == chess.WHITE else "black",
                    "clock_sec": clock_sec,
                    "time_spent_sec": time_spent,
                    "eval_cp": eval_cp
                })

                if clock_sec is not None:
                    prev_clock = clock_sec

            games_data.append({
                "headers": headers,
                "white": white_user,
                "black": black_user,
                "result": headers.get("Result", "*"),
                "eco": headers.get("ECO", "A00"),
                "opening": headers.get("Opening", "Unknown"),
                "time_control": headers.get("TimeControl", "Unknown"),
                "user_color": "white" if user_color == chess.WHITE else "black",
                "total_moves": len(moves),
                "moves": moves
            })

        return games_data
