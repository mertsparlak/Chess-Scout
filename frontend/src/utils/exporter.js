/**
 * Scouting Report Exporter for Chess-Scout.
 * Generates downloadable Markdown and PDF/HTML print reports.
 */

export function exportMarkdownReport(data) {
  if (!data) return;

  const target = data.target_username || "Oyuncu";
  const summary = data.profile?.summary || {};
  const scores = data.profile?.scores || {};
  const strategy = data.counter_strategy || {};
  const gmSim = data.gm_similarity || {};
  const timing = data.profile?.blunder_timing || {};
  const repertoire = data.profile?.repertoire || {};

  let md = `# ♟️ CHESS-SCOUT PLAYER INTELLIGENCE REPORT
**Hedef Oyuncu:** ${target}  
**İncelenen Oyun:** ${summary.total_games || 0}  
**Kazanma Oranı:** %${summary.win_rate_pct || 0}  
**Ortalama Hamle Doğruluğu:** %${summary.avg_accuracy_pct || 0}  
**Centipawn Loss (ACPL):** ${summary.acpl || 0}  

---

## 🏆 Oyuncu Kimliği & Büyükusta Stil Benzerliği
- **Archetype (Oyuncu Kimliği):** ${gmSim.archetype?.badge || 'Belirlenmedi'}
- **Açıklama:** ${gmSim.archetype?.tagline || ''}
- **En Çok Benzeyen Büyükusta:** %${gmSim.primary_match?.similarity_pct || 0} ${gmSim.primary_match?.name || ''} (${gmSim.primary_match?.title || ''})

### Efsanevi GM Benzerlik Sıralaması:
`;

  if (gmSim.top_matches) {
    gmSim.top_matches.forEach(gm => {
      md += `- **${gm.name}** (%${gm.similarity_pct}): ${gm.description}\n`;
    });
  }

  md += `\n---

## 🎭 Psikolojik & Manipülasyon Göstergeleri
- **Greed (Açgözlülük):** %${scores.GreedIndex || 0} (Zehirli piyon ve feda tuzaklarına düşme meyli)
- **Moral Çöküş Riski:** %${scores.CascadeBlunderRisk || 0} (İlk hatadan sonra 2. dev hatayı yapma riski)
- **Post-Loss Tilt Katsayısı:** %${scores.TiltIndex || 0} (Mağlubiyet sonrası maç içi risk meyli)
- **Post-Win Özgüven:** %${scores.OverconfidenceIndex || 0} (Galibiyet sonrası dikkatsiz risk alma sıklığı)

---

## ⏱️ Hata Zamanlama Dağılımı (Hangi Hamlede Çöküyor?)
- **Baskın Çöküş Fazı:** ${timing.peak_phase || 'Dengeli'}
- **Detay:** ${timing.peak_description || ''}
- **Açılış (Hamle 1-15):** %${timing.opening_pct || 0} (${timing.opening_blunders || 0} blunder)
- **Orta Oyun (Hamle 16-30):** %${timing.midgame_pct || 0} (${timing.midgame_blunders || 0} blunder)
- **Oyun Sonu (Hamle 31+):** %${timing.late_pct || 0} (${timing.late_blunders || 0} blunder)

---

## ♟️ Açılış Zayıflık Haritası
### En Çok Zorlandığı Açılışlar:
`;

  if (repertoire.weakest_openings) {
    repertoire.weakest_openings.forEach(op => {
      md += `- **${op.eco} - ${op.name}**: Kazanma Oranı: %${op.win_rate_pct}, ACPL: ${op.acpl}\n`;
    });
  }

  md += `\n---

## 🎯 Rakip Manipülasyon Rehberi (Exploitation Blueprint)
**Özet Değerlendirme:** ${strategy.summary_statement || ''}

### Adım Adım Rakibi Oyundan Düşürme Planı:
`;

  if (strategy.exploitation_steps) {
    strategy.exploitation_steps.forEach((step, idx) => {
      md += `${idx + 1}. ${step.replace(/\*\*/g, '')}\n`;
    });
  }

  md += `\n### ✅ Yapılacaklar (DOs):\n`;
  if (strategy.dos) {
    strategy.dos.forEach(d => md += `- ${d}\n`);
  }

  md += `\n### ❌ Kaçınılacaklar (DON'Ts):\n`;
  if (strategy.donts) {
    strategy.donts.forEach(d => md += `- ${d}\n`);
  }

  md += `\n---\n*Rapor Chess-Scout Intelligence Platform tarafından otomatik oluşturulmuştur.*`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${target}_Chess_Scout_Report.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printPDFReport() {
  window.print();
}
