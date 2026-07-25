import math
from typing import Dict, Any, List

# Consensus feature vectors for legendary Grandmasters (0-100 scale)
GRANDMASTER_DATABASE = [
    {
        "id": "kasparov",
        "name": "Garry Kasparov",
        "title": "Dinamik Taktikçi & Saldırgan",
        "era": "1985-2000 World Champion",
        "scores": {
            "Aggression": 92,
            "TacticalSkill": 96,
            "PositionalSkill": 85,
            "RiskTaking": 88,
            "TimePressureResistance": 85,
            "TreeDiversityIndex": 80,
            "GreedIndex": 40,
            "EndgameSkill": 88
        },
        "description": "Erken aşamada alan üstünlüğü ve patlayıcı taktik inisiyatif kurarak rakibi baskı altına alan agresif stil."
    },
    {
        "id": "tal",
        "name": "Mikhail Tal",
        "title": "Kaos ve Feda Ustası (Gambiteer)",
        "era": "1960-1961 World Champion",
        "scores": {
            "Aggression": 98,
            "TacticalSkill": 98,
            "PositionalSkill": 65,
            "RiskTaking": 96,
            "TimePressureResistance": 80,
            "TreeDiversityIndex": 70,
            "GreedIndex": 75,
            "EndgameSkill": 70
        },
        "description": "Karmaşık, seziye dayalı feda ve taktik tuzaklarla oyunu kaosa sürüklemeyi seven stil."
    },
    {
        "id": "karpov",
        "name": "Anatoly Karpov",
        "title": "Pozisyonel Boğucu & Profilaksi Ustası",
        "era": "1975-1985 World Champion",
        "scores": {
            "Aggression": 35,
            "TacticalSkill": 80,
            "PositionalSkill": 98,
            "RiskTaking": 25,
            "TimePressureResistance": 85,
            "TreeDiversityIndex": 50,
            "GreedIndex": 30,
            "EndgameSkill": 96
        },
        "description": "Rakibin planlarını erkenden engelleyen, yavaş yavaş alan daraltıp kusursuz oyun sonlarına giden pozisyonel stil."
    },
    {
        "id": "carlsen",
        "name": "Magnus Carlsen",
        "title": "Evrensel Taş Değirmeni (Grinder)",
        "era": "2013-2023 World Champion",
        "scores": {
            "Aggression": 70,
            "TacticalSkill": 92,
            "PositionalSkill": 96,
            "RiskTaking": 55,
            "TimePressureResistance": 98,
            "TreeDiversityIndex": 85,
            "GreedIndex": 35,
            "EndgameSkill": 99
        },
        "description": "Eşit oyun sonlarında dahi rakibin en küçük hatasını zorlayıp maçı zafere taşıyan dengeli evrensel stil."
    },
    {
        "id": "fischer",
        "name": "Bobby Fischer",
        "title": "Kristal Netliğinde Hassasiyet",
        "era": "1972-1975 World Champion",
        "scores": {
            "Aggression": 78,
            "TacticalSkill": 94,
            "PositionalSkill": 92,
            "RiskTaking": 60,
            "TimePressureResistance": 90,
            "TreeDiversityIndex": 35,
            "GreedIndex": 40,
            "EndgameSkill": 92
        },
        "description": "Dar ama mükemmel açılış teorisi, berrak taktiksel kombinasyonlar ve sıfır taviz içeren net stil."
    },
    {
        "id": "petrosian",
        "name": "Tigran Petrosian",
        "title": "Demir Profilaksi & Risk Karşıtı",
        "era": "1963-1969 World Champion",
        "scores": {
            "Aggression": 25,
            "TacticalSkill": 70,
            "PositionalSkill": 99,
            "RiskTaking": 15,
            "TimePressureResistance": 88,
            "TreeDiversityIndex": 40,
            "GreedIndex": 25,
            "EndgameSkill": 90
        },
        "description": "Önce rakibin tüm şanslarını yok eden, aşırı güvenli ve delinmez savunmaya dayalı profilaktik stil."
    },
    {
        "id": "nakamura",
        "name": "Hikaru Nakamura",
        "title": "Hızlı Hesaplama & Zaman Savaşçısı",
        "era": "Modern Top GM & Speed Chess Specialist",
        "scores": {
            "Aggression": 85,
            "TacticalSkill": 94,
            "PositionalSkill": 82,
            "RiskTaking": 75,
            "TimePressureResistance": 99,
            "TreeDiversityIndex": 75,
            "GreedIndex": 40,
            "EndgameSkill": 88
        },
        "description": "Zaman baskısında devleşen, beklenmedik savunma kaynakları bulan ve yıldırım hızında taktik hesaplayan stil."
    },
    {
        "id": "morphy",
        "name": "Paul Morphy",
        "title": "Klasik Taş Aktivitesi & Şah Avcısı",
        "era": "19th Century Legend",
        "scores": {
            "Aggression": 90,
            "TacticalSkill": 90,
            "PositionalSkill": 70,
            "RiskTaking": 85,
            "TimePressureResistance": 70,
            "TreeDiversityIndex": 35,
            "GreedIndex": 55,
            "EndgameSkill": 75
        },
        "description": "Hızlı taş gelişimi, açık dikey sürüşleri ve merkeze hızlı hakimiyet kuran klasik atak stili."
    }
]

FEATURE_WEIGHTS = {
    "Aggression": 1.3,
    "TacticalSkill": 1.4,
    "PositionalSkill": 1.3,
    "RiskTaking": 1.2,
    "TimePressureResistance": 1.0,
    "TreeDiversityIndex": 0.8,
    "GreedIndex": 1.0,
    "EndgameSkill": 1.1
}

class GMSimilarityEngine:
    @staticmethod
    def compute_similarity(user_scores: Dict[str, int]) -> Dict[str, Any]:
        matches = []

        for gm in GRANDMASTER_DATABASE:
            gm_scores = gm["scores"]
            weighted_sum = 0.0
            total_weight = sum(FEATURE_WEIGHTS.values())

            for feat, weight in FEATURE_WEIGHTS.items():
                u_val = user_scores.get(feat, 50)
                g_val = gm_scores.get(feat, 50)
                diff = u_val - g_val
                weighted_sum += weight * (diff ** 2)

            distance = math.sqrt(weighted_sum / total_weight)
            # Calibrated distance mapping to similarity %
            similarity_pct = max(15.0, min(99.0, round(100.0 - (distance * 1.15), 1)))

            matches.append({
                "id": gm["id"],
                "name": gm["name"],
                "title": gm["title"],
                "era": gm["era"],
                "similarity_pct": similarity_pct,
                "description": gm["description"],
                "gm_scores": gm_scores
            })

        matches.sort(key=lambda x: x["similarity_pct"], reverse=True)

        top_match = matches[0]
        archetype = GMSimilarityEngine._determine_archetype(user_scores, top_match)

        return {
            "top_matches": matches[:4],
            "primary_match": top_match,
            "archetype": archetype
        }

    @staticmethod
    def _determine_archetype(user_scores: Dict[str, int], top_match: Dict[str, Any]) -> Dict[str, Any]:
        agg = user_scores.get("Aggression", 50)
        tact = user_scores.get("TacticalSkill", 50)
        pos = user_scores.get("PositionalSkill", 50)
        risk = user_scores.get("RiskTaking", 50)
        time_res = user_scores.get("TimePressureResistance", 50)
        greed = user_scores.get("GreedIndex", 0)
        tilt = user_scores.get("TiltIndex", 0)

        if agg > 75 and tact > 70:
            badge = "🔥 Taktiksel Gambiteer"
            tagline = "Keskin varyantları seven, risk alan ve rakip şaha doğrudan saldıran stil."
        elif pos > 75 and agg < 50:
            badge = "🛡️ Pozisyonel Sıkıştırıcı"
            tagline = "Taşları sağlam karelere dizen, az risk alan ve sabırlı pozisyonel stil."
        elif time_res > 80:
            badge = "⏳ Zaman Savaşçısı"
            tagline = "Zaman baskısında soğunu koruyan, hızlı ve dirençli hamle stili."
        elif greed > 60:
            badge = "💎 Materyal Avcısı"
            tagline = "Taş ve piyon kazançlarını affetmeyen, yüksek açgözlülük gösteren stil."
        elif tilt > 50:
            badge = "⚡ Duygusal Reaksiyoncu"
            tagline = "Mağlubiyet veya hata sonrası maç içi riski hızla artıran duygusal stil."
        else:
            badge = f"♟️ {top_match['name']} Tarzı Evrensel Stil"
            tagline = f"Stiliniz en çok {top_match['name']} ile benzerlik gösteriyor ({top_match['title']})."

        return {
            "badge": badge,
            "tagline": tagline,
            "closest_gm": top_match["name"]
        }
