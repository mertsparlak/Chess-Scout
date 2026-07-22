import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function App() {
  const [username, setUsername] = useState('mertparlaks');
  const [platform, setPlatform] = useState('lichess');
  const [maxGames, setMaxGames] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const json = await res.json();
        setHealth(json);
      }
    } catch (e) {
      console.warn("Backend API offline:", e);
    }
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, platform, max_games: Number(maxGames) })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: 'Sunucu hatası oluştu.' }));
        throw new Error(errJson.detail || 'Analiz başarısız oldu.');
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRadarData = (scores) => {
    if (!scores) return [];
    return [
      { subject: 'Agresiflik', A: scores.Aggression || 50 },
      { subject: 'Taktik Yetenek', A: scores.TacticalSkill || 50 },
      { subject: 'Pozisyonel', A: scores.PositionalSkill || 50 },
      { subject: 'Zaman Direnci', A: scores.TimePressureResistance || 50 },
      { subject: 'Açılış Çeşitliliği', A: scores.TreeDiversityIndex || 50 },
      { subject: 'Tilt Katsayısı', A: scores.TiltIndex || 0 },
      { subject: 'Aşırı Açgözlülük', A: scores.GreedIndex || 0 },
      { subject: 'Moral Çöküş Riski', A: scores.CascadeBlunderRisk || 0 },
    ];
  };

  return (
    <div className="app-root">
      {/* Header */}
      <header className="app-header">
        <div className="brand-logo">
          <span>♟️</span> ChessMind AI
        </div>
        <div className="status-badge">
          <span className="dot-online"></span>
          {health ? (health.stockfish_available ? 'Stockfish Engine Online' : 'Smart Heuristic Engine Mode') : 'API Status: Offline'}
        </div>
      </header>

      <main className="dashboard-container">
        {/* Search Panel */}
        <div className="glass-panel search-card">
          <div>
            <h1 className="search-title">Chess Player Intelligence & Exploitation Platform</h1>
            <p className="search-subtitle">
              Oyuncuların davranış kalıplarını, tuzak zayıflıklarını ve psikolojik kırılma noktalarını analiz eder.
            </p>
          </div>

          <form className="search-form" onSubmit={handleAnalyze}>
            <input
              type="text"
              className="input-field"
              placeholder="Oyuncu Kullanıcı Adı (ör: hikaru, drnykterstein)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <select className="select-field" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="lichess">Lichess</option>
              <option value="chesscom">Chess.com</option>
            </select>
            <select className="select-field" value={maxGames} onChange={(e) => setMaxGames(Number(e.target.value))}>
              <option value="10">10 Oyun</option>
              <option value="15">15 Oyun</option>
              <option value="25">25 Oyun</option>
              <option value="50">50 Oyun</option>
            </select>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div> Analiz Ediliyor...
                </>
              ) : (
                '🔍 Oyuncuyu Analiz Et'
              )}
            </button>
          </form>

          {error && (
            <div style={{ color: '#ef4444', padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Dashboard Results Section */}
        {data && (
          <>
            {/* Metric Summary Row */}
            <div className="metrics-row">
              <div className="metric-card">
                <div className="metric-value">{data.profile.summary.total_games}</div>
                <div className="metric-label">İncelenen Oyun</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{data.profile.summary.win_rate_pct}%</div>
                <div className="metric-label">Kazanma Oranı</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">%{data.profile.summary.avg_accuracy_pct || 82}</div>
                <div className="metric-label">Ort. Hamle Doğruluğu</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{data.profile.summary.acpl}</div>
                <div className="metric-label">Ort. Centipawn Loss (ACPL)</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{data.profile.summary.blunders_per_game}</div>
                <div className="metric-label">Maç Başı Blunder</div>
              </div>
            </div>

            <div className="analytics-grid">
              {/* Left Column: Player Profile Radar & Behavioral Badges */}
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 className="card-title">📊 {data.target_username} Oyuncu Profili</h2>
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarData(data.profile.scores)}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" stroke="#9ca3af" tick={{ fill: '#d1d5db', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" />
                      <Radar name="Player" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Behavioral & Manipulation Metrics */}
                <h3 style={{ fontSize: '1rem', color: '#a855f7', marginTop: '0.5rem' }}>🎭 Manipülasyon Göstergeleri</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="metric-card">
                    <div className="metric-label">Greed (Açgözlülük)</div>
                    <div className="metric-value" style={{ color: data.profile.scores.GreedIndex > 50 ? '#ef4444' : '#10b981' }}>
                      %{data.profile.scores.GreedIndex}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Moral Çöküş Riski</div>
                    <div className="metric-value" style={{ color: data.profile.scores.CascadeBlunderRisk > 30 ? '#ef4444' : '#10b981' }}>
                      %{data.profile.scores.CascadeBlunderRisk}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Tilt Katsayısı (Post-Loss)</div>
                    <div className="metric-value" style={{ color: data.profile.scores.TiltIndex > 30 ? '#ef4444' : '#10b981' }}>
                      %{data.profile.scores.TiltIndex}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Aşırı Özgüven (Post-Win)</div>
                    <div className="metric-value" style={{ color: '#f59e0b' }}>
                      %{data.profile.scores.OverconfidenceIndex}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Exploitation Blueprint Script & Strategy */}
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h2 className="card-title">🎯 Rakip Manipülasyon Rehberi (Exploitation Blueprint)</h2>

                <div className="strategy-item strategy-insight">
                  <strong>Özet Scouting Değerlendirmesi:</strong> {data.counter_strategy.summary_statement}
                </div>

                {/* Exploitation Steps */}
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: '#a855f7', marginBottom: '0.75rem' }}>🔥 Adım Adım Rakibi Oyundan Düşürme Planı</h3>
                  <div className="strategy-list">
                    {data.counter_strategy.exploitation_steps && data.counter_strategy.exploitation_steps.length > 0 ? (
                      data.counter_strategy.exploitation_steps.map((step, idx) => (
                        <div key={idx} className="strategy-item" style={{ background: 'rgba(168, 85, 247, 0.08)', borderLeft: '3px solid #a855f7' }}>
                          <span dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>
                      ))
                    ) : (
                      <div className="strategy-item strategy-insight">Standart pozisyonel oyun önerilmektedir.</div>
                    )}
                  </div>
                </div>

                {/* DOs and DONTs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', color: '#10b981', marginBottom: '0.5rem' }}>✅ Yapılacaklar (DOs)</h3>
                    <div className="strategy-list">
                      {data.counter_strategy.dos.map((item, idx) => (
                        <div key={idx} className="strategy-item strategy-do" style={{ fontSize: '0.85rem' }}>
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.95rem', color: '#ef4444', marginBottom: '0.5rem' }}>❌ Kaçınılacaklar (DON'Ts)</h3>
                    <div className="strategy-list">
                      {data.counter_strategy.donts.map((item, idx) => (
                        <div key={idx} className="strategy-item strategy-dont" style={{ fontSize: '0.85rem' }}>
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
