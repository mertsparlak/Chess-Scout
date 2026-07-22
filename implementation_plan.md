# Implementation Plan - ChessMind Platform (Güncellenmiş & Detaylı Plan)

ChessMind, oyuncunun sadece en iyi hamlelerini değil, **davranış kalıplarını, zihinsel zayıflıklarını, taktiksel kör noktalarını ve oyun stilini** detaylıca modelleyen bir yapay zeka analiz ve manipülasyon platformudur.

---

## Modül ve Özellik Çıkarım Haritası (Feature Engineering Map)

### 1. Açılış (Opening Analytics)
- En sık oynanan açılışlar (Beyaz & Siyah repertuarı)
- **Açılış Ağacı Çeşitlilik İndeksi (Tree Diversity Index)**
- Teori dışına çıkıldığında (Out-of-book / Novelty) doğruluk düşüş oranı
- Belirli açılışlara karşı zorlanma / zayıflık derecesi (Opening Vulnerability Matrix)

### 2. Agresiflik & Risk (Aggression & Risk Taking)
- Erken saldırı eğilimi & Şah saldırıları sıklığı
- Feda tespiti (Taktiksel fedalar vs hatalı taş kayıpları)
- Taş aktivitesi ve alan üstünlüğü (Space & Activity Index)
- **Kazanma Sonrası Aşırı Özgüven (Overconfidence Index)**: Galibiyet ardından oynanan maçtaki risk alma artışı.

### 3. Taktiksel Zayıflıklar (Tactical Pattern Map)
- **Çatal (Fork) zayıflığı**: At/Piyon çatallarını fark etme ve düşme sıklığı.
- **Açmaz (Pin) zayıflığı**: Kale/Vezir/Fil açmazlarına yakalanma oranı.
- **Şiş (Skewer) ve Keşif Saldırısı (Discovered Attack)** duyarlılığı.
- **Arka Sıra Matı (Back-Rank Mate)** hassasiyeti.
- **Aşırı Açgözlülük / Tuzak Hassasiyeti (Greed & Trap Vulnerability)**: Zehirli piyonları veya tuzak taşları alma eğilimi.

### 4. Strateji & Oyun Sonu (Strategy & Endgame)
- **Taş Değişim Eğilimi (Exchange Preference / Queen Trade Ratio)**: Vezir ve kale değişimlerini kabul etme veya kaçınma sıklığı.
- Geçer piyon (Passed pawn) ve İzole piyon (Isolated pawn) oluşturma/savunma becerisi.
- Oyun Sonu Becerisi: Şah aktivitesi, Kale ve Piyon oyun sonu doğruluk oranı.
- **Materyal Üstünlüğünü Koruma Etkinliği**: Materyal öne geçildiğinde riski sıfırlama vs gereksiz risk alıp maçı verme eğilimi.

### 5. Zaman Yönetimi (Time Management & Pressure)
- Kritik hamlelerde harcanan süre ortalaması.
- **Zaman Paniği Hata Oranı (Time Panic Blunder Rate)**: Son 30 sn ve 10 sn kala blunder sıklığı.
- Zaman şantajı hassasiyeti (Süre azaldığında panic blunder eğilimi).

### 6. Psikolojik & Davranışsal Manipülasyon (Behavior Analytics)
- **Tilt Katsayısı (Tilt Index)**: Mağlubiyet veya ağır hata sonrası bir sonraki maçta agresiflik ve hata artışı.
- **Moral Çöküşü (Cascade Blunder Vulnerability)**: İlk hatadan hemen sonraki 3 hamlede dev bir blunder yapma riski.
- Beraberlik meyli (Draw preference) ve pasifleşme eğilimi.

---

## Fazlandırılmış Çalışma Planı

### Faz 1: Temel Veri Hattı & Gelişmiş Stockfish/PGN Evaluator
- **PGN Parser Enhancement**: Rating, Date, ECO, Opening, TimeControl, Clock (`%clk`), Zaman Harcamaları ve Oyuncu Rengi ayrıştırma.
- **Stockfish Evaluator Refinement**:
  - Maç bazlı Doğruluk Oranı (Accuracy % calculation: `100 * exp(-0.0035 * CPL)` formülü).
  - Hamle bazlı Centipawn Loss (CPL) ve Blunder/Mistake/Inaccuracy sınıflandırması.
  - `python-chess` board analizi ile **Çatal, Açmaz, Şiş, Keşif Saldırısı ve Vezir Kesme** durumlarının pozisyonel olarak tespiti.

### Faz 2: Tam Detaylı Özellik Çıkarım Motoru (Feature Engineering Engine)
- **Aggression, Risk Taking, Tactical Skill, Positional Skill, Endgame, Time Resistance, Tree Diversity, Tilt Index, Greed Index, Overconfidence Index** skorlarının 0-100% ölçeğinde hesaplanması.
- **Açılış Repertuarı Haritası**: Beyaz ve Siyah taşlarla en çok oynanan ECO açılışlarının doğruluğu ve win rate'i.
- **Taktik Zayıflık Sınıflandırıcısı**: Hangi taktik türlerinde hata yapıldığının sayısal dağılımı.

### Faz 3: Davranış Analizi & Manipülatif Karşı Strateji Üreticisi (Counter-Strategy & Exploitation Blueprint)
- **Exploitation Script (Adım Adım Rakibi Oyundan Düşürme Rehberi)**.
- **İnteraktif Web Dashboard (React + Vite)**.

### Faz 4: Oyuncu Sınıflandırma (Archetypes) & GM Benzerlik Motoru
- **Oyuncu Kimliği Sınıflandırıcı**: ör. *"Taktiksel Gambiteer"*, *"Zaman Baskısı Hata Eğilimli Saldırgan"*, *"Sağlam Pozisyonel Savunmacı"*.
- **GM Similarity Engine**: Oyuncu profilinin tarihteki büyükustalara (Kasparov, Tal, Karpov, Petrosian, Carlsen vb.) benzerlik % eşleştirmesi.

### Faz 5: Doğal Dil Raporlama & AI Scout (LLM Integration)
- Metrikleri insan dilinde anlaşılır "Scouting Report" ve kişisel antrenman tavsiyelerine dönüştürme.
