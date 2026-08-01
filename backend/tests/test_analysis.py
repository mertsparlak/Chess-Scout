import pytest
from app.services.pgn_parser import PGNParser
from app.analytics.stockfish_eval import StockfishEvaluator
from app.analytics.feature_extractor import FeatureExtractor
from app.analytics.counter_strategy import CounterStrategyGenerator
from app.analytics.gm_similarity import GMSimilarityEngine

SAMPLE_PGN = """
[Event "Rated Blitz game"]
[Site "https://lichess.org/12345678"]
[Date "2026.01.01"]
[White "PlayerA"]
[Black "PlayerB"]
[Result "1-0"]
[UTCDate "2026.01.01"]
[UTCTime "12:00:00"]
[WhiteElo "1800"]
[BlackElo "1750"]
[WhiteRatingDiff "+10"]
[BlackRatingDiff "-10"]
[ECO "C50"]
[Opening "Italian Game"]
[TimeControl "180+0"]

1. e4 { [%clk 0:03:00] } e5 { [%clk 0:03:00] } 2. Nf3 { [%clk 0:02:58] } Nc6 { [%clk 0:02:57] } 3. Bc4 { [%clk 0:02:55] } Bc5 { [%clk 0:02:55] } 4. d3 { [%clk 0:02:50] } Nf6 { [%clk 0:02:50] } 1-0
"""

def test_pgn_parser():
    games = PGNParser.parse_pgn_text(SAMPLE_PGN, target_username="PlayerA")
    assert len(games) == 1
    g = games[0]
    assert g["white"] == "PlayerA"
    assert g["black"] == "PlayerB"
    assert g["user_color"] == "white"
    assert len(g["moves"]) == 8
    assert g["moves"][0]["san"] == "e4"
    assert g["moves"][0]["clock_sec"] == 180.0

def test_stockfish_evaluator():
    evaluator = StockfishEvaluator()
    ev = evaluator.evaluate_move("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", "e7e5")
    assert "cpl" in ev
    assert "accuracy" in ev
    assert "patterns" in ev
    evaluator.close()

def test_feature_extractor_and_counter_strategy():
    games = PGNParser.parse_pgn_text(SAMPLE_PGN, target_username="PlayerA")
    eval_data = [[
        {"turn": "white", "cpl": 10, "accuracy": 96.0, "quality": "good", "clock_sec": 178.0, "patterns": {"is_capture": False}},
        {"turn": "white", "cpl": 210, "accuracy": 43.0, "quality": "blunder", "clock_sec": 175.0, "patterns": {"is_capture": True, "is_fork": True}},
        {"turn": "white", "cpl": 5, "accuracy": 98.0, "quality": "good", "clock_sec": 170.0, "patterns": {"is_capture": False}},
        {"turn": "white", "cpl": 20, "accuracy": 92.0, "quality": "good", "clock_sec": 165.0, "patterns": {"is_capture": False}}
    ]]
    profile = FeatureExtractor.extract_player_profile(games, "PlayerA", eval_data)
    assert profile["summary"]["total_games"] == 1
    assert "scores" in profile
    assert profile["scores"]["GreedIndex"] > 0

    strategy = CounterStrategyGenerator.generate_strategy(profile)
    assert "dos" in strategy
    assert "donts" in strategy
    assert "exploitation_steps" in strategy
    assert len(strategy["exploitation_steps"]) > 0

def test_gm_similarity_engine():
    mock_scores = {
        "Aggression": 90,
        "TacticalSkill": 95,
        "PositionalSkill": 80,
        "RiskTaking": 85,
        "TimePressureResistance": 80,
        "TreeDiversityIndex": 75,
        "GreedIndex": 45,
        "EndgameSkill": 85
    }
    result = GMSimilarityEngine.compute_similarity(mock_scores)
    assert "top_matches" in result
    assert len(result["top_matches"]) == 4
    assert "archetype" in result
    assert result["top_matches"][0]["similarity_pct"] > 70.0
    assert result["top_matches"][0]["id"] in ["kasparov", "tal", "morphy", "nakamura"]

def test_opening_vulnerabilities_and_blunder_timing():
    games = PGNParser.parse_pgn_text(SAMPLE_PGN, target_username="PlayerA")
    eval_data = [[
        {"turn": "white", "cpl": 5, "accuracy": 98.0, "quality": "good", "clock_sec": 180.0, "patterns": {}},
        {"turn": "white", "cpl": 250, "accuracy": 35.0, "quality": "blunder", "clock_sec": 120.0, "patterns": {"is_capture": True}},
        {"turn": "white", "cpl": 300, "accuracy": 20.0, "quality": "blunder", "clock_sec": 45.0, "patterns": {}},
    ]]
    profile = FeatureExtractor.extract_player_profile(games, "PlayerA", eval_data)

    assert "repertoire" in profile
    assert "weakest_openings" in profile["repertoire"]
    assert len(profile["repertoire"]["weakest_openings"]) > 0
    assert profile["repertoire"]["weakest_openings"][0]["eco"] == "C50"

    assert "blunder_timing" in profile
    assert "peak_phase" in profile["blunder_timing"]
    assert profile["blunder_timing"]["opening_blunders"] + profile["blunder_timing"]["midgame_blunders"] + profile["blunder_timing"]["late_blunders"] == 2
