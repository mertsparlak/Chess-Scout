from typing import List, Dict, Any

class CounterStrategyGenerator:
    @staticmethod
    def generate_strategy(profile: Dict[str, Any]) -> Dict[str, Any]:
        scores = profile.get("scores", {})
        weaknesses = profile.get("tactical_weaknesses", {})
        repertoire = profile.get("repertoire", {})
        summary = profile.get("summary", {})

        acpl = summary.get("acpl", 50.0)
        avg_acc = summary.get("avg_accuracy_pct", 80.0)
        total_games = summary.get("total_games", 0)

        tactical = scores.get("TacticalSkill", 50)
        positional = scores.get("PositionalSkill", 50)
        aggression = scores.get("Aggression", 50)
        time_res = scores.get("TimePressureResistance", 50)
        tree_div = scores.get("TreeDiversityIndex", 50)
        tilt_idx = scores.get("TiltIndex", 0)
        greed_idx = scores.get("GreedIndex", 0)
        cascade_risk = scores.get("CascadeBlunderRisk", 0)
        overconfidence = scores.get("OverconfidenceIndex", 0)

        dos = []
        donts = []
        exploitation_steps = []

        # 1. Greed & Trap Exploitation
        if greed_idx > 40:
            dos.append("Zehirli piyon veya sahte feda gibi görünen taktik tuzaklar kur.")
            exploitation_steps.append(f"🎯 **Aşırı Açgözlülük Tuzağı (%{greed_idx} Greed Index):** Rakip materyale çok aç. Korunan piyonları veya pozisyonel olarak zayıf taşları yem olarak sun, tuzaklara düşecektir.")
        
        # 2. Cascade Blunder Exploitation
        if cascade_risk > 25:
            dos.append("Rakip ilk hatasını yaptığında hemen karmaşıklığı artır, nefes aldırma.")
            exploitation_steps.append(f"💥 **Moral Çöküşü Baskısı (%{cascade_risk} Cascade Risk):** Rakip bir hata yaptıktan hemen sonraki 3 hamle içinde ikinci dev bir hatayı yapmaya çok yatkın. Tempoyu düşürme.")

        # 3. Post-Loss Tilt or Post-Win Overconfidence
        if tilt_idx > 30:
            exploitation_steps.append(f"😡 **Tilt Manipülasyonu (%{tilt_idx} Tilt Index):** Üst üste maçlarda rakip kaybettiyse bir sonraki maça aşırı agresif ve kontrolsüz giriyor. Erken hamlelerde sağlam kalıp risk almasını bekle.")
        if overconfidence > 30:
            exploitation_steps.append(f"👑 **Aşırı Özgüven Manipülasyonu (%{overconfidence} Overconfidence):** Galibiyet ardından oynadığı maçlarda aşırı özgüvenle risk alıp hata yapıyor. Maçın başında tuzağa düşür.")

        # 4. Opening Disruption
        if tree_div < 40:
            weak_openings = repertoire.get("weakest_openings", [])
            weak_str = f" ({weak_openings[0]['name']})" if weak_openings else ""
            dos.append("Rakibin sürekli oynadığı bilinen kalıpların dışına çıkan sürpriz açılışlar seç.")
            exploitation_steps.append(f"📖 **Teori Dışına Çıkarma (%{tree_div} Tree Diversity):** Açılış repertuarı oldukça dar{weak_str}. 5. hamlede alışılmadık bir varyanta girerek rakibin ezberini boz.")

        # 5. Time Trouble Trap
        if time_res < 55:
            dos.append("Süre 1 dakikanın altına düştüğünde taşları kesmeyip tahtayı karmaşık tut.")
            exploitation_steps.append(f"⏳ **Zaman Şantajı (%{time_res} Time Resistance):** Rakibin süresi azaldığında pozisyonu basitleştirme; çoklu taş seçeneği bırakarak saatini eritmeye zorla.")

        # 6. Tactical Specific Weaknesses
        pins = weaknesses.get("pin_blunders", 0)
        forks = weaknesses.get("fork_blunders", 0)
        if pins > 0 or forks > 0:
            exploitation_steps.append(f"🍴 **Taktik Motif Zayıflığı:** İncelenen oyunlarda rakip en çok Açmaz (Pin: {pins}) ve Çatal (Fork: {forks}) motiflerinde taş kaybetti. Şah ve vezir hatlarını hedefle.")

        # If Grandmaster level (ACPL < 25) and few amateur blunders:
        if acpl < 25:
            exploitation_steps.append(f"🛡️ **Büyükusta Hassasiyeti (ACPL {acpl}):** Bu oyuncu dünya standartlarında sağlam hamle yapma doğruluğuna (%{avg_acc}) sahip. Basit hatalar yerine sadece derin açılış hazırlığı ve ekstrem zaman baskısında zorlanabilir.")

        # Defaults if empty
        if not dos:
            dos.append("Erken aşamada merkez kontrolünü alarak alan üstünlüğü sağla.")
            dos.append("Taş aktivitesini artırarak rakip şah kanadında zayıflık yarat.")
        if not donts:
            donts.append("Karmaşık ve çoklu taş fedalarının olduğu gereksiz hatlara girmekten kaçın.")
            donts.append("Plan yapmadan acele piyon sürüşleri yapma.")

        # Summary statement
        if acpl < 25:
            summary_stmt = f"İncelenen {total_games} oyunda ortalama %{avg_acc} doğrulukla (ACPL {acpl}) oynayan bu oyuncu, Usta seviyesinde hassasiyet ve üst düzey alan kontrolü gösteriyor."
        else:
            summary_stmt = f"İncelenen {total_games} oyunda ortalama %{avg_acc} doğrulukla (ACPL {acpl}) oynayan bu oyuncu, yüksek hata katsayısı ve belirgin davranış zayıflıkları sergiliyor."

        return {
            "summary_statement": summary_stmt,
            "exploitation_steps": exploitation_steps,
            "dos": dos,
            "donts": donts
        }
