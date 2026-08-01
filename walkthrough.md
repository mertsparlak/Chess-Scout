# Chess-Scout - Faz 1, 2, 3 ve 4 Tamamlandı 🎯♟️

Chess-Scout (Chess Player Intelligence & Exploitation Platform) projesinde **Faz 1, Faz 2, Faz 3 ve Faz 4** tüm modülleriyle başarıyla tamamlanmıştır.

---

## 🛠️ Gerçekleştirilen Geliştirmeler

### 1. Backend & Analiz Motoru (`backend/`)
- **Game Connectors (`lichess.py` & `chess_com.py`)**: Lichess ve Chess.com API'lerinden oyuncunun son N maçını PGN formatında çeken servisler. Lichess Personal Access Token desteği ve HTTP 429 rate limit yönetimi entegre edilmiştir.
- **PGN Parser (`pgn_parser.py`)**: PGN dosyalarından FEN dizilimleri, hamleler, hamle süreleri (`%clk`) ve embedded evals ayrıştıran motor.
- **Stockfish Evaluator (`stockfish_eval.py`)**: Stockfish 16.1 (AVX2) motor entegrasyonu ve akıllı 1-ply heuristic fallback motoru.
- **Feature Extractor (`feature_extractor.py`)**:
  - **Greed Index (Aşırı Açgözlülük / Tuzak Hassasiyeti %)**
  - **Cascade Blunder Risk (Moral Çöküşü %)**
  - **Overconfidence Index (Post-Win %)** & **Tilt Index (Post-Loss %)**
  - **Açılış Repertuarı & Zayıflık Matrisi**: Beyaz/Siyah en çok oynanan açılışlar ve en çok zorlanılan 3 zayıf açılış.
  - **Blunder Zamanlama Dağılımı**: Hamle 1-15 (Açılış), 16-30 (Orta Oyun), 31+ (Oyun Sonu) blunder oranları ve kırılma noktası tespiti.
- **GM Similarity Engine (`gm_similarity.py`)**: 8 efsanevi Büyükusta ile ağırlıklı Öklid mesafeli benzerlik skoru ve dinamik Oyuncu Kimliği (Archetype) sınıflandırıcısı.
- **Counter Strategy Generator (`counter_strategy.py`)**: Exploitation Blueprint (Adım Adım Rakibi Oyundan Düşürme Rehberi).

---

### 2. Frontend Web Arayüzü (`frontend/`)
- **React + Vite Dashboard**: Modern koyu mod glassmorphism tasarımı.
- **Recharts Radar Grafiği & Dual GM Overlay**: 8 temel boyutu görselleştiren örümcek grafiği ve oyuncunun en çok benzediği Büyükusta ile interaktif çift radar kıyaslaması.
- **Açılış Repertuarı & Zayıflık Haritası**: Beyaz/Siyah açılış dağılımları ve en yüksek ACPL/en düşük kazanma oranına sahip 3 zayıf açılış kartı.
- **Blunder Zamanlama Paneli**: Oyuncunun en çok kaçıncı hamleden sonra dev hata yaptığını gösteren görsel çubuklar.
- **Scouting Raporu Dışa Aktarma (`exporter.js`)**: Tek tıkla PDF ve Markdown Scouting Raporu indirme butonları.
- **Kalıcı Lichess API Token**: Tarayıcı `localStorage` bağlantısı ile PC/tarayıcı kapansa bile korunan token ayarları.
