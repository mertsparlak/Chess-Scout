import math
from typing import List, Dict, Any
from collections import Counter

class FeatureExtractor:
    @staticmethod
    def extract_player_profile(games: List[Dict[str, Any]], target_username: str, eval_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not games:
            return FeatureExtractor._get_empty_profile()

        total_games = len(games)
        wins, losses, draws = 0, 0, 0
        
        cpl_list = []
        blunder_count = 0
        mistake_count = 0
        inaccuracy_count = 0
        capture_blunders = 0

        # Blunder Timing Distribution (Move Ranges)
        opening_blunders = 0    # Moves 1-15
        midgame_blunders = 0    # Moves 16-30
        late_blunders = 0       # Moves 31+

        # Tactical Patterns
        fork_blunders = 0
        pin_blunders = 0
        skewer_blunders = 0
        discovered_blunders = 0
        queen_trades_accepted = 0

        # Opening vs Midgame Accuracy Tracking
        opening_cpl = []
        midgame_cpl = []

        # Time Panic metrics
        time_panic_moves = 0
        time_panic_blunders = 0
        normal_time_moves = 0
        normal_time_blunders = 0

        # Opening Tree Diversity & Repertoire
        opening_fen_set = set()
        white_openings_counter = Counter()
        black_openings_counter = Counter()
        eco_performance = {}

        # Game outcome tracking for Post-Win & Post-Loss shifts
        post_win_blunders = 0
        post_win_moves = 0
        post_loss_blunders = 0
        post_loss_moves = 0

        # Cascade Blunder tracking
        cascade_blunders = 0
        total_initial_errors = 0

        prev_game_outcome = None

        for i, game in enumerate(games):
            user_color = game["user_color"]
            res = game["result"]
            eco = game.get("eco", "A00")
            opening_name = game.get("opening", "Unknown Opening")

            if (user_color == "white" and res == "1-0") or (user_color == "black" and res == "0-1"):
                game_outcome = "win"
                wins += 1
            elif res == "1/2-1/2":
                game_outcome = "draw"
                draws += 1
            else:
                game_outcome = "loss"
                losses += 1

            if user_color == "white":
                white_openings_counter[opening_name] += 1
            elif user_color == "black":
                black_openings_counter[opening_name] += 1

            if eco not in eco_performance:
                eco_performance[eco] = {"name": opening_name, "cpl_sum": 0, "count": 0, "wins": 0, "games_count": 0}
            
            eco_performance[eco]["games_count"] += 1
            if game_outcome == "win":
                eco_performance[eco]["wins"] += 1

            moves = game["moves"]
            for m_idx, m in enumerate(moves[:8]):
                opening_fen_set.add(m["fen_after"].split(" ")[0])

            game_evals = eval_data[i] if i < len(eval_data) else []
            recent_error_step = -10

            for step, m_eval in enumerate(game_evals):
                cpl = m_eval["cpl"]
                cpl_list.append(cpl)
                eco_performance[eco]["cpl_sum"] += cpl
                eco_performance[eco]["count"] += 1

                if step < 10:
                    opening_cpl.append(cpl)
                else:
                    midgame_cpl.append(cpl)

                qual = m_eval["quality"]
                patterns = m_eval.get("patterns", {})

                if qual == "blunder":
                    blunder_count += 1

                    # Categorize blunder timing by move step (0-indexed per ply)
                    move_number = (step // 2) + 1
                    if move_number <= 15:
                        opening_blunders += 1
                    elif move_number <= 30:
                        midgame_blunders += 1
                    else:
                        late_blunders += 1

                    if patterns.get("is_capture"):
                        capture_blunders += 1
                    if patterns.get("is_fork"):
                        fork_blunders += 1
                    if patterns.get("is_pin"):
                        pin_blunders += 1
                    if patterns.get("is_skewer"):
                        skewer_blunders += 1
                    if patterns.get("is_discovered"):
                        discovered_blunders += 1

                    if step - recent_error_step <= 3:
                        cascade_blunders += 1
                    total_initial_errors += 1
                    recent_error_step = step

                elif qual == "mistake":
                    mistake_count += 1
                    total_initial_errors += 1
                    recent_error_step = step
                elif qual == "inaccuracy":
                    inaccuracy_count += 1

                if patterns.get("is_queen_trade"):
                    queen_trades_accepted += 1

                clock = m_eval.get("clock_sec")
                if clock is not None:
                    if clock < 30.0:
                        time_panic_moves += 1
                        if qual == "blunder":
                            time_panic_blunders += 1
                    else:
                        normal_time_moves += 1
                        if qual == "blunder":
                            normal_time_blunders += 1

                if prev_game_outcome == "win":
                    post_win_moves += 1
                    if qual == "blunder":
                        post_win_blunders += 1
                elif prev_game_outcome == "loss":
                    post_loss_moves += 1
                    if qual == "blunder":
                        post_loss_blunders += 1

            prev_game_outcome = game_outcome

        # Summary ACPL & Accuracy
        acpl = sum(cpl_list) / max(1, len(cpl_list))
        overall_accuracy = round(max(15.0, min(99.0, 100.0 * math.exp(-0.0035 * acpl))), 1)

        opening_acpl = sum(opening_cpl) / max(1, len(opening_cpl)) if opening_cpl else acpl
        midgame_acpl = sum(midgame_cpl) / max(1, len(midgame_cpl)) if midgame_cpl else acpl
        opening_acc = round(max(15.0, min(99.0, 100.0 * math.exp(-0.0035 * opening_acpl))), 1)
        midgame_acc = round(max(15.0, min(99.0, 100.0 * math.exp(-0.0035 * midgame_acpl))), 1)
        out_of_book_drop = round(max(0.0, opening_acc - midgame_acc), 1)

        # Game-Normalized Frequency Metrics
        greed_index = min(100, int((capture_blunders / max(1, total_games)) * 120))
        cascade_blunder_risk = min(100, int((cascade_blunders / max(1, total_games)) * 120))

        normal_blunder_rate = (normal_time_blunders / max(1, normal_time_moves)) * 100
        time_panic_blunder_rate = (time_panic_blunders / max(1, time_panic_moves)) * 100
        time_resistance = max(10, min(99, int(100 - (time_panic_blunder_rate * 2.5))))

        post_loss_rate = (post_loss_blunders / max(1, post_loss_moves)) * 100
        tilt_index_score = min(100, int(post_loss_rate * 15))

        post_win_rate = (post_win_blunders / max(1, post_win_moves)) * 100
        overconfidence_index = min(100, int(post_win_rate * 15))

        tree_diversity = min(100, int((len(opening_fen_set) / max(1, total_games * 4)) * 100))

        # Blunder Timing Percentages
        total_blunders_denom = max(1, blunder_count)
        op_blunder_pct = round((opening_blunders / total_blunders_denom) * 100, 1)
        mid_blunder_pct = round((midgame_blunders / total_blunders_denom) * 100, 1)
        late_blunder_pct = round((late_blunders / total_blunders_denom) * 100, 1)

        if late_blunders >= midgame_blunders and late_blunders >= opening_blunders:
            peak_phase = "Oyun Sonu / Geç Aşama (Hamle 31+)"
            peak_desc = f"Hataların %{late_blunder_pct}'si Hamle 31'den sonra yapılmaktadır. Rakibi oyunu uzatarak baskı altına alın."
        elif midgame_blunders >= opening_blunders:
            peak_phase = "Orta Oyun (Hamle 16 - 30)"
            peak_desc = f"Hataların %{mid_blunder_pct}'si Hamle 16-30 arasında gerçekleşmektedir. Taş kırışmalarında karmaşıklık yaratın."
        else:
            peak_phase = "Erken Aşama / Açılış (Hamle 1 - 15)"
            peak_desc = f"Hataların %{op_blunder_pct}'si ilk 15 hamlede oluşmaktadır. Teoriden erken çıkararak doğrudan saldırın."

        # Scaled Tactical & Positional scores matching ACPL scale
        tactical_score = max(15, min(99, int(100.0 * math.exp(-0.003 * acpl))))
        positional_score = max(20, min(99, int(100.0 * math.exp(-0.0025 * acpl))))
        endgame_score = max(15, min(99, int(100.0 * math.exp(-0.003 * acpl))))
        aggression_score = max(30, min(95, int(55 + (greed_index * 0.3) + (tree_diversity * 0.15))))

        # Detailed ECO Repertoire & Vulnerability Matrix
        eco_vulnerabilities = []
        for eco_code, data in eco_performance.items():
            if data["count"] > 0:
                eco_acpl = round(data["cpl_sum"] / data["count"], 1)
                eco_games = data["games_count"]
                win_pct = round((data["wins"] / max(1, eco_games)) * 100, 1)
                eco_accuracy = round(max(15.0, min(99.0, 100.0 * math.exp(-0.0035 * eco_acpl))), 1)

                eco_vulnerabilities.append({
                    "eco": eco_code,
                    "name": data["name"],
                    "acpl": eco_acpl,
                    "accuracy_pct": eco_accuracy,
                    "win_rate_pct": win_pct,
                    "games_played": eco_games,
                    "wins": data["wins"]
                })

        # Sort weakest openings by highest ACPL & lowest win rate
        eco_vulnerabilities.sort(key=lambda x: (x["acpl"], -x["win_rate_pct"]), reverse=True)

        white_repertoire = [{"name": name, "count": cnt} for name, cnt in white_openings_counter.most_common(3)]
        black_repertoire = [{"name": name, "count": cnt} for name, cnt in black_openings_counter.most_common(3)]

        return {
            "summary": {
                "total_games": total_games,
                "wins": wins,
                "losses": losses,
                "draws": draws,
                "win_rate_pct": round((wins / max(1, total_games)) * 100, 1),
                "acpl": round(acpl, 1),
                "avg_accuracy_pct": overall_accuracy,
                "opening_accuracy_pct": opening_acc,
                "midgame_accuracy_pct": midgame_acc,
                "out_of_book_accuracy_drop_pct": out_of_book_drop,
                "blunders_per_game": round(blunder_count / max(1, total_games), 2)
            },
            "scores": {
                "TacticalSkill": tactical_score,
                "PositionalSkill": positional_score,
                "Aggression": aggression_score,
                "RiskTaking": int((aggression_score + tilt_index_score) / 2),
                "TimePressureResistance": time_resistance,
                "TreeDiversityIndex": tree_diversity,
                "TiltIndex": tilt_index_score,
                "GreedIndex": greed_index,
                "OverconfidenceIndex": overconfidence_index,
                "CascadeBlunderRisk": cascade_blunder_risk,
                "EndgameSkill": endgame_score
            },
            "blunder_timing": {
                "opening_blunders": opening_blunders,
                "midgame_blunders": midgame_blunders,
                "late_blunders": late_blunders,
                "opening_pct": op_blunder_pct,
                "midgame_pct": mid_blunder_pct,
                "late_pct": late_blunder_pct,
                "peak_phase": peak_phase,
                "peak_description": peak_desc
            },
            "tactical_weaknesses": {
                "fork_blunders": fork_blunders,
                "pin_blunders": pin_blunders,
                "skewer_blunders": skewer_blunders,
                "discovered_blunders": discovered_blunders,
                "capture_blunders": capture_blunders,
                "queen_trades_accepted": queen_trades_accepted
            },
            "repertoire": {
                "white_top": white_repertoire,
                "black_top": black_repertoire,
                "weakest_openings": eco_vulnerabilities[:3]
            },
            "metrics": {
                "normal_blunder_rate_pct": round(normal_blunder_rate, 2),
                "time_panic_blunder_rate_pct": round(time_panic_blunder_rate, 2),
                "unique_opening_fens": len(opening_fen_set)
            }
        }

    @staticmethod
    def _get_empty_profile() -> Dict[str, Any]:
        return {
            "summary": {
                "total_games": 0, "wins": 0, "losses": 0, "draws": 0, "win_rate_pct": 0,
                "acpl": 0, "avg_accuracy_pct": 0, "opening_accuracy_pct": 0, "midgame_accuracy_pct": 0,
                "out_of_book_accuracy_drop_pct": 0, "blunders_per_game": 0
            },
            "scores": {
                "TacticalSkill": 50, "PositionalSkill": 50, "Aggression": 50, "RiskTaking": 50,
                "TimePressureResistance": 50, "TreeDiversityIndex": 50, "TiltIndex": 0, "GreedIndex": 0,
                "OverconfidenceIndex": 0, "CascadeBlunderRisk": 0, "EndgameSkill": 50
            },
            "blunder_timing": {
                "opening_blunders": 0, "midgame_blunders": 0, "late_blunders": 0,
                "opening_pct": 0, "midgame_pct": 0, "late_pct": 0,
                "peak_phase": "Dengeli Dağılım", "peak_description": "Dev hata verisi yetersiz."
            },
            "tactical_weaknesses": {
                "fork_blunders": 0, "pin_blunders": 0, "skewer_blunders": 0, "discovered_blunders": 0,
                "capture_blunders": 0, "queen_trades_accepted": 0
            },
            "repertoire": {"white_top": [], "black_top": [], "weakest_openings": []},
            "metrics": {"normal_blunder_rate_pct": 0, "time_panic_blunder_rate_pct": 0, "unique_opening_fens": 0}
        }
