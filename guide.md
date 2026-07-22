# ChessMind - Chess Player Intelligence Platform

## Proje Amacı

Bu proje, klasik bir satranç motoru geliştirmekten ziyade **bir satranç oyuncusunu analiz eden yapay zeka sistemi** geliştirmeyi amaçlamaktadır.

Mevcut satranç motorları (Stockfish, Leela Chess Zero vb.) temel olarak şu soruya cevap verir:

> "Bu pozisyondaki en iyi hamle nedir?"

Bu projenin amacı ise farklıdır:

> "Bu oyuncu nasıl oynuyor ve ona karşı en etkili strateji nedir?"

Yani sistem tahtayı değil, **oyuncunun davranışlarını** modellemeye çalışacaktır.

Bu nedenle proje bir satranç motorundan çok;

- Player Profiling
- Behavioral Analysis
- Chess Analytics
- Counter Strategy Generation

alanlarına odaklanan bir yapay zeka platformu olacaktır.

---

# Projenin Vizyonu

Amaç yalnızca oyunları analiz etmek değildir.

Sistem;

- oyuncunun oyun stilini,
- alışkanlıklarını,
- güçlü yönlerini,
- zayıf yönlerini,
- psikolojik davranış örüntülerini,
- açılış tercihlerini,
- hata tiplerini,
- zaman baskısı altındaki performansını

tespit ederek oyuncuya özel raporlar oluşturacaktır.

Uzun vadede proje, satranç oyuncularını analiz eden kapsamlı bir **Chess Player Intelligence Platform** haline gelecektir.

---

# Temel Fikir

Kullanıcı sisteme;

- Chess.com kullanıcı adı
- Lichess kullanıcı adı
- veya doğrudan PGN dosyası

verecek.

Sistem otomatik olarak oyunları analiz edecek.

Analiz sonucunda;

- oyuncu profili
- oyun stili
- güçlü yönler
- zayıf yönler
- davranış analizi
- karşı strateji önerileri

oluşturulacaktır.

---

# Örnek Çıktılar

## Oyuncu Profili

```
Aggression              : 82%
Risk Taking             : 74%
Tactical Skill          : 91%
Positional Skill        : 67%
Opening Variety         : Low
Endgame                 : 71%
Time Management         : Medium
Exchange Preference     : Low
Sacrifice Frequency     : High
```

---

## Genel Analiz

Bu oyuncu;

- aktif oyunları seviyor
- saldırı şansı gördüğünde risk alıyor
- erken vezir değişiminden kaçınıyor
- aynı açılışları sık kullanıyor
- zaman baskısında hata yapma eğilimi gösteriyor

---

## Counter Strategy

Bu oyuncuya karşı;

- repertuar dışı açılışlar kullan
- uzun pozisyonel oyunlara zorla
- erken taş değişimi yap
- zaman baskısı oluştur
- gereksiz taktik karmaşaya girme

---

# Sistem Mimarisi

```
Chess.com / Lichess / PGN

↓

Game Import

↓

PGN Parser

↓

Stockfish Analysis

↓

Feature Extraction

↓

Behavior Analysis

↓

Player Profiling

↓

Weakness Detection

↓

Counter Strategy Generator

↓

Natural Language Report
```

---

# Ana Modüller

## 1. Veri Toplama

Desteklenecek kaynaklar

- Chess.com
- Lichess
- PGN Dosyası

Görevler

- kullanıcı adı ile oyunları çekme
- PGN indirme
- cache oluşturma
- analiz kuyruğu

---

## 2. PGN Analizi

Her oyun için;

- ECO
- Açılış
- Sonuç
- Hamle sayısı
- Oyuncu rengi
- Rating
- Tarih

çıkarılacaktır.

---

## 3. Stockfish Analizi

Her hamle analiz edilerek;

- Best Move
- Played Move
- Accuracy
- Centipawn Loss
- Blunder
- Mistake
- Inaccuracy

hesaplanacaktır.

---

## 4. Feature Engineering

Bu proje için en kritik modüldür.

Örnek özellikler:

### Açılış

- En sık açılış
- Beyaz repertuarı
- Siyah repertuarı
- Açılış çeşitliliği

---

### Agresiflik

- Fedalar
- Şah saldırıları
- Taş aktivitesi
- Erken saldırı

---

### Strateji

- Taş değişimi
- Geçer piyon
- İzole piyon
- Kale aktivitesi
- Alan üstünlüğü

---

### Taktik

- Çatal
- Açmaz
- Şiş
- Keşif saldırısı
- Arka sıra matı

---

### Endgame

- Şah aktivitesi
- Kale oyun sonu
- Piyon oyun sonu

---

### Zaman Yönetimi

(Eğer zaman bilgisi mevcutsa)

- kritik hamle süreleri
- zaman baskısı
- son saniye performansı

---

# Oyuncu Modelleme

Her oyuncu için sayısal profil oluşturulacaktır.

Örneğin;

```json
{
  "Aggression": 0.82,
  "RiskTaking": 0.71,
  "OpeningKnowledge": 0.84,
  "PositionalSkill": 0.66,
  "TacticalSkill": 0.91,
  "Endgame": 0.73,
  "TimePressureResistance": 0.42,
  "ExchangePreference": 0.31
}
```

---

# Davranış Analizi

Projenin en önemli kısmı budur.

Amaç yalnızca satranç analizi yapmak değildir.

Oyuncunun davranışlarını anlamaktır.

Örneğin;

- Süre azalınca hata yapıyor mu?
- Kazandıktan sonraki oyunda daha agresif mi?
- Kaybettikten sonra güvenli mi oynuyor?
- Hep aynı açılışı mı oynuyor?
- Materyal öndeyken gereksiz risk alıyor mu?
- Belirli açılışlara karşı zorlanıyor mu?
- Beraberliği tercih ediyor mu?

Bu analizler oyuncunun oyun geçmişinden çıkarılacaktır.

---

# Counter Strategy Generator

Oyuncu analiz edildikten sonra sistem öneriler oluşturacaktır.

Örneğin;

```
Bu oyuncuya karşı;

✓ Açılış repertuarını boz.

✓ Uzun oyun sonlarına git.

✓ Süre baskısı oluştur.

✓ Erken taş değişimi yap.

✓ Karmaşık taktik pozisyonlardan kaçın.

✓ Açık merkez oluştur.
```

---

# Doğal Dilde Raporlama

Son kullanıcı teknik metrikleri görmek zorunda değildir.

Örneğin;

> Son 350 oyunun analizine göre bu oyuncu keskin taktik pozisyonlarda oldukça başarılıdır ancak uzun oyun sonlarında hata oranı artmaktadır. Beyaz taşlarla sınırlı bir açılış repertuarı kullanmakta ve zaman baskısı altında doğruluğu belirgin şekilde düşmektedir.

---

# Kullanılabilecek Teknolojiler

Backend

- Python
- FastAPI

Chess

- python-chess
- Stockfish

Database

- PostgreSQL

ML

- scikit-learn
- XGBoost
- PyTorch

LLM

- Gemma
- Qwen
- Llama

Frontend

- React
- Next.js

Visualization

- Plotly
- Recharts

---

# Yol Haritası

## Faz 1

- PGN Parser
- Stockfish entegrasyonu
- Temel rapor

---

## Faz 2

- Feature Engineering
- Oyuncu profili
- Grafikler

---

## Faz 3

- Davranış analizi
- Counter Strategy
- Doğal dil raporları

---

## Faz 4

- ML modelleri
- Oyuncu sınıflandırması
- Benzer oyuncu bulma

---

## Faz 5

- LLM destekli raporlar
- Koçluk önerileri
- Kişiye özel çalışma planı

---

# Hukuki ve Etik Değerlendirme

Bu proje geliştirilirken veri kaynağı ve kullanım şekli önemlidir.

## Genel Yaklaşım

Sistem yalnızca;

- kullanıcının yüklediği PGN dosyalarını
- veya resmi API'ler üzerinden erişilebilen herkese açık oyunları

analiz edecektir.

Ham oyun verisi yeniden dağıtılmayacak, yalnızca analiz sonuçları üretilecektir.

---

## Lichess

Lichess geliştirici dostu bir platformdur.

Planlanan kullanım şekli:

- Resmi API kullanmak
- API rate limitlerine uymak
- Herkese açık oyunları analiz etmek
- Ham PGN verisini yeniden dağıtmamak

Bu yaklaşım proje için uygundur.

---

## Chess.com

Chess.com için de yalnızca resmi API kullanılacaktır.

Kesinlikle yapılmayacaklar:

- Web scraping
- Yoğun veri kazıma
- API kurallarını aşma
- Ham oyun arşivini yeniden yayınlama

---

## Gizlilik

Sistem oyuncular hakkında yalnızca oyun verilerine dayalı analizler yapacaktır.

Örneğin;

Doğru:

- "İncelenen oyunlarda süre azaldığında hata oranı artmaktadır."

Yanlış:

- "Bu oyuncu panik oluyor."

Yani sistem kişilik analizi yaptığını iddia etmeyecek, yalnızca oyun verilerinden gözlemlenen davranış örüntülerini raporlayacaktır.

---

# Uzun Vadeli Hedef

Bu proje yeni bir satranç motoru geliştirmeyi amaçlamamaktadır.

Asıl hedef;

**insan oyuncularını veri odaklı analiz eden, oyun stillerini modelleyen, davranış örüntülerini çıkaran ve bu bilgilerden karşı stratejiler üreten yapay zeka destekli bir Chess Player Intelligence Platform oluşturmaktır.**

Bu yönüyle proje;

- Chess Analytics
- Behavior Modeling
- Explainable AI
- Player Profiling
- Strategy Generation

alanlarının birleşiminde yer almaktadır.