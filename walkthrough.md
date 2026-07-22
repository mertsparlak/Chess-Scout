# ChessMind - Faz 1 & Faz 2 Tamamlandı 🎯♟️

ChessMind (Chess Player Intelligence Platform) için **Faz 1 (Temel Veri Hattı, PGN & Stockfish Analiz Motoru)** ve **Faz 2 (Gelişmiş Özellik Çıkarımı & Sayısal Profilleme)** tamamlandı.

---

## 🛠️ Gerçekleştirilen Geliştirmeler

### 1. Backend & Analiz Motoru (`backend/`)
- **Game Connectors (lichess.py & chess_com.py)**: Lichess ve Chess.com API'lerinden oyuncunun son N maçını PGN formatında çeken servisler.
- **PGN Parser (pgn_parser.py)**: PGN dosyalarından FEN dizilimleri, hamleler, hamle süreleri (`%clk`) ve embedded evals ayrıştıran motor.
- **Stockfish Evaluator (stockfish_eval.py)**: Stockfish 16.1 (AVX2) motor entegrasyonu ve akıllı 1-ply heuristic fallback motoru.
- **Gelişmiş Feature Extractor (feature_extractor.py)**:
  - **Greed Index (Aşırı Açgözlülük / Tuzak Hassasiyeti %)**
  - **Cascade Blunder Risk (Moral Çöküşü %)**
  - **Overconfidence Index (Post-Win %)**
  - **Tilt Index (Post-Loss %)**
  - **Time Panic Blunder Rate**
  - **Tactical Patterns**: Pin, Fork, Skewer, Discovered Attack.
  - **8 Boyutlu Oyuncu Profili**: Agresiflik, Risk Alma, Taktiksel Yetenek, Pozisyonel Yetenek, Zaman Direnci, Açılış Çeşitliliği, Tilt ve Oyun Sonu.
- **Counter Strategy Generator (counter_strategy.py)**: Exploitation Blueprint (Adım Adım Rakibi Oyundan Düşürme Rehberi).
- **FastAPI Endpoints (main.py)**: `/api/health`, `/api/analyze/user`, `/api/analyze/pgn` API uç noktaları.

---

### 2. Frontend Web Arayüzü (`frontend/`)
- **React + Vite Dashboard**: Modern koyu mod glassmorphism tasarımı, canlı arama paneli.
- **Recharts Radar Grafiği**: 8 temel boyutu görselleştiren etkileşimli örümcek/radar grafiği.
- **Metrik Kartları & Exploitation Blueprint**: Ort. Centipawn Loss, Tilt riski, Greed göstergeleri ve Karşı Strateji tavsiye listesi.
