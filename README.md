# ♟️ Chess-Scout: Player Intelligence & Exploitation Platform

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Chess-Scout**, satranç oyuncularının psikolojik davranma kalıplarını, zamana karşı direncini, açılış zayıflıklarını ve efsanevi Büyükustalarla (GM) olan stil benzerliğini analiz eden; rakibi oyundan düşürmek için adım adım **Karşı Strateji Rehberi (Exploitation Blueprint)** üreten yapay zeka destekli bir oyuncu istihbarat platformudur.

---

## 🔥 Temel Özellikler

- **🔍 Çoklu Platform Desteği:** Lichess ve Chess.com hesaplarından otomatik PGN çekimi. İsteğe bağlı Lichess Personal Access Token desteği ile IP sınırlamalarına takılmadan sınırsız sorgulama.
- **🤖 Stockfish 16.1 Analiz Motoru:** Hamle hamle Centipawn Loss (ACPL), CAPS 2.0 doğruluk hesaplaması ve akıllı 1-ply heuristic motor yedeklemesi.
- **🏆 Efsanevi GM Stil Benzerliği:** 8 boyutlu Öklid özelliği vektörü üzerinden oyuncunun stilini 8 efsane Büyükusta (*Magnus Carlsen, Garry Kasparov, Mikhail Tal, Anatoly Karpov, Bobby Fischer, Tigran Petrosian, Hikaru Nakamura, Paul Morphy*) ile kıyaslama ve **Oyuncu Kimliği (Archetype)** rozeti atama.
- **🎭 Psikolojik & Manipülasyon Göstergeleri:**
  - **Greed (Açgözlülük) Index:** Zehirli piyon veya sahte feda tuzaklarına düşme meyli.
  - **Cascade Blunder Risk:** İlk hatadan sonraki 3 hamlede ikinci dev hatayı yapma riski.
  - **Post-Loss Tilt & Post-Win Özgüven:** Mağlubiyet ve galibiyet sonrası risk alma katsayıları.
- **♟️ Açılış Repertuarı & Zayıflık Haritası:** Beyaz ve Siyah taşlarla en çok oynanan ECO açılışları ve oyuncunun en çok zorlandığı 3 zayıf açılış kartı.
- **⏱️ Hata Zamanlama Dağılımı:** Dev hataların (Blunder) hamle aralıklarına göre analizi (*Açılış: Hamle 1-15, Orta Oyun: 16-30, Oyun Sonu: 31+*) ve kırılma noktası tespiti.
- **🎯 Exploitation Blueprint:** Rakibin zayıflıklarını lehine çevirmek için adım adım **Yapılacaklar (DOs)** ve **Kaçınılacaklar (DON'Ts)** strateji kartları.
- **📄 Rapor Dışa Aktarma:** Scouting analiz sonuçlarını tek tıkla **PDF** veya **Markdown** belgesi olarak indirme.
- **🎨 Modern Slate Dark Arayüz:** Linear UI standartlarında minimal, göz yormayan karanlık tema ve sekmeli navigasyon.

---

## 🛠️ Mimari & Teknoloji Yığını

### Backend
- **Core:** Python 3.11+, FastAPI, Uvicorn
- **Chess Engine:** `python-chess`, Stockfish 16.1 AVX2
- **Analytics Engine:** Custom Feature Extractor, CAPS 2.0 Accuracy Formula, Weighted Euclidean GM Distance

### Frontend
- **Framework:** React 18, Vite
- **Styling:** Modern Vanilla CSS (Zero-slop Linear dark design system)
- **Charts:** Recharts (Radar / Spider Chart)
- **Export Utility:** Client-side Markdown & PDF Print Exporter

---

## 🚀 Yerel Kurulum & Çalıştırma Rehberi

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları takip edebilirsiniz:

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/mertsparlak/Chess-Scout.git
cd Chess-Scout
```

---

### 2. Backend (FastAPI) Çalıştırma

#### Gerekli Paketleri Yükleyin:
```bash
cd backend
python -m venv venv
# Windows için sanal ortamı aktifleştirin:
venv\Scripts\activate
# Bağımlılıkları yükleyin:
pip install -r requirements.txt
```

#### Backend Sunucusunu Başlatın:
```bash
python -m uvicorn app.main:app --reload --port 8000
```
> Sunucu başarıyla başladığında `http://localhost:8000/docs` adresinden API dokümantasyonuna erişebilirsiniz.

---

### 3. Frontend (React / Vite) Çalıştırma

Yeni bir terminal penceresi açın ve frontend dizinine geçin:

```bash
cd frontend
npm install
npm run dev
```
> Uygulama varsayılan olarak `http://localhost:5173` adresinde yayına girecektir.

---

## 🧪 Birim Testleri Çalıştırma

Backend analiz motorunun ve GM benzerlik algoritmasının birim testlerini çalıştırmak için:

```bash
python -m pytest backend/tests
```

---

## 📜 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
