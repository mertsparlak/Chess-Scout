import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { exportMarkdownReport, printPDFReport } from './utils/exporter';

export default function App() {
  const [username, setUsername] = useState('mertparlaks');
  const [platform, setPlatform] = useState('lichess');
  const [maxGames, setMaxGames] = useState(10);
  
  // Persistent Lichess Token stored in browser localStorage
  const [lichessToken, setLichessToken] = useState(() => {
    return localStorage.getItem('chess_scout_lichess_token') || '';
  });
  
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [showGMOverlay, setShowGMOverlay] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    checkHealth();
  }, []);

  useEffect(() => {
    if (lichessToken.trim()) {
      localStorage.setItem('chess_scout_lichess_token', lichessToken.trim());
    } else {
      localStorage.removeItem('chess_scout_lichess_token');
    }
  }, [lichessToken]);

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
        body: JSON.stringify({
          username,
          platform,
          max_games: Number(maxGames),
          lichess_token: lichessToken.trim() || undefined
        })
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

  const getRadarData = (userScores, gmScores) => {
    if (!userScores) return [];
    return [
      { subject: 'Agresiflik', Oyuncu: userScores.Aggression || 50, GM: gmScores?.Aggression || 50 },
      { subject: 'Taktik Yetenek', Oyuncu: userScores.TacticalSkill || 50, GM: gmScores?.TacticalSkill || 50 },
      { subject: 'Pozisyonel', Oyuncu: userScores.PositionalSkill || 50, GM: gmScores?.PositionalSkill || 50 },
      { subject: 'Zaman Direnci', Oyuncu: userScores.TimePressureResistance || 50, GM: gmScores?.TimePressureResistance || 50 },
      { subject: 'Açılış Çeşitliliği', Oyuncu: userScores.TreeDiversityIndex || 50, GM: gmScores?.TreeDiversityIndex || 50 },
      { subject: 'Tilt Katsayısı', Oyuncu: userScores.TiltIndex || 0, GM: gmScores?.TiltIndex || 0 },
      { subject: 'Aşırı Açgözlülük', Oyuncu: userScores.GreedIndex || 0, GM: gmScores?.GreedIndex || 0 },
      { subject: 'Moral Çöküş Riski', Oyuncu: userScores.CascadeBlunderRisk || 0, GM: gmScores?.CascadeBlunderRisk || 0 },
    ];
  };

  const primaryGM = data?.gm_similarity?.primary_match;
  const timing = data?.profile?.blunder_timing;
  const tactical = data?.profile?.tactical_weaknesses;

  return (
    <div className="app-root">
      {/* Minimalist Linear-Style Header */}
      <header className="app-header">
        <div className="brand-logo">
          <span className="brand-badge">♟</span> CHESS-SCOUT
        </div>
        <div className="status-badge">
          <span className="dot-online"></span>
          {health ? (health.stockfish_available ? 'Stockfish 16.1 Active' : 'Heuristic Engine') : 'Offline'}
        </div>
      </header>

      <main className="dashboard-container">
        {/* Search Panel */}
        <div className="panel-card search-card">
          <div>
            <h1 className="search-title">Player Scouting & Intelligence Engine</h1>
            <p className="search-subtitle">
              Oyuncuların psikolojik davranış kalıplarını, zayıf açılışlarını ve efsanevi Büyükustalarla stil benzerliğini analiz edin.
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
              <option value="10">10 Oyun (Hızlı)</option>
              <option value="15">15 Oyun (Standart)</option>
              <option value="20">20 Oyun (Derin)</option>
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

          {/* Lichess Token Toggle */}
          {platform === 'lichess' && (
            <div style={{ marginTop: '0.2rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowTokenInput(!showTokenInput)}
                  style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  {showTokenInput ? 'Token Ayarlarını Gizle' : 'Lichess API Token Ayarları (Sınırsız İzin İçin)'}
                </button>

                {lichessToken.trim() ? (
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '14px', fontSize: '0.8rem', border: '1px solid rgba(16, 185, 129, 0.25)', fontWeight: 600 }}>
                    ✓ Token Kayıtlı (Sınırsız İsteğe Açık)
                  </span>
                ) : (
                  <span style={{ color: '#71717a', fontSize: '0.8rem' }}>
                    (İsteğe bağlı - Sınırsız sorgulama için)
                  </span>
                )}
              </div>

              {showTokenInput && (
                <div style={{ marginTop: '0.65rem', background: '#18181b', padding: '1rem 1.15rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                  <p style={{ color: '#a1a1aa', marginBottom: '0.65rem', fontSize: '0.85rem', lineHeight: '1.45' }}>
                    Lichess sunucularında anonim sorgular sınırlıdır. <a href="https://lichess.org/account/oauth/token" target="_blank" rel="noreferrer" style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'underline' }}>Buradan 10 saniyede ücretsiz Lichess API Token alabilirsiniz.</a> Token tarayıcınıza bir kez kaydedilir ve kalıcı olarak kullanılır.
                  </p>
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <input
                      type="password"
                      className="input-field"
                      style={{ flex: 1, fontSize: '0.85rem', padding: '0.65rem 0.85rem' }}
                      placeholder="Lichess Personal Access Token yapıştırın (lip_...)"
                      value={lichessToken}
                      onChange={(e) => setLichessToken(e.target.value)}
                    />
                    {lichessToken && (
                      <button
                        type="button"
                        onClick={() => setLichessToken('')}
                        style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f43f5e', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ color: '#f43f5e', padding: '0.85rem 1rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.25)', fontSize: '0.9rem', lineHeight: '1.4' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {data && (
          <>
            {/* Player Archetype Header */}
            {data.gm_similarity && (
              <div className="panel-card" style={{ padding: '1.5rem', background: '#121215', border: '1px solid #27272a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      OYUNCU KİMLİĞİ (ARCHETYPE)
                    </span>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', marginTop: '0.2rem' }}>
                      {data.gm_similarity.archetype.badge}
                    </h2>
                    <p style={{ color: '#a1a1aa', fontSize: '0.95rem', marginTop: '0.3rem' }}>
                      {data.gm_similarity.archetype.tagline}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="metric-card" style={{ background: '#18181b', border: '1px solid #27272a', padding: '0.85rem 1.4rem' }}>
                      <div className="metric-label">En Çok Benzeyen Büyükusta</div>
                      <div className="metric-value" style={{ fontSize: '1.6rem', color: '#f59e0b' }}>
                        %{primaryGM.similarity_pct} {primaryGM.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '0.15rem' }}>{primaryGM.title}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => printPDFReport()}
                        style={{ background: '#18181b', border: '1px solid #3f3f46', color: '#fafafa', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        📄 PDF Raporu
                      </button>
                      <button
                        type="button"
                        onClick={() => exportMarkdownReport(data)}
                        style={{ background: '#18181b', border: '1px solid #3f3f46', color: '#fafafa', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        📝 Markdown
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                <div className="metric-value">%{data.profile.summary.avg_accuracy_pct}</div>
                <div className="metric-label">Ort. Doğruluk</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{data.profile.summary.acpl}</div>
                <div className="metric-label">Centipawn Loss (ACPL)</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{data.profile.summary.blunders_per_game}</div>
                <div className="metric-label">Maç Başı Blunder</div>
              </div>
            </div>

            {/* View Filter Tabs */}
            <div className="dashboard-tabs">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                📌 Tüm Analizler
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                📊 Oyuncu Profili & Radar
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'opening' ? 'active' : ''}`}
                onClick={() => setActiveTab('opening')}
              >
                ♟️ Açılış Zayıflıkları
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'timing' ? 'active' : ''}`}
                onClick={() => setActiveTab('timing')}
              >
                ⏱️ Hata Zamanlaması
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'strategy' ? 'active' : ''}`}
                onClick={() => setActiveTab('strategy')}
              >
                🎯 Exploitation Blueprint
              </button>
            </div>

            {/* Tactical Weaknesses Breakdown */}
            {tactical && (activeTab === 'all' || activeTab === 'profile') && (
              <div className="panel-card" style={{ padding: '1.25rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.05rem', color: '#fafafa' }}>
                  🎯 Taktik Zayıflık Dağılımı
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div className="metric-card" style={{ background: '#18181b', textAlign: 'left', padding: '0.75rem 0.9rem' }}>
                    <div style={{ color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 600 }}>🧲 Açgözlü Taş Alma</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tactical.capture_blunders > 0 ? '#f43f5e' : '#10b981', marginTop: '0.2rem' }}>
                      {tactical.capture_blunders} Blunder
                    </div>
                  </div>

                  <div className="metric-card" style={{ background: '#18181b', textAlign: 'left', padding: '0.75rem 0.9rem' }}>
                    <div style={{ color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 600 }}>⚔️ Çatal (Fork) Hataları</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tactical.fork_blunders > 0 ? '#f43f5e' : '#10b981', marginTop: '0.2rem' }}>
                      {tactical.fork_blunders} Blunder
                    </div>
                  </div>

                  <div className="metric-card" style={{ background: '#18181b', textAlign: 'left', padding: '0.75rem 0.9rem' }}>
                    <div style={{ color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 600 }}>📌 Açmaz (Pin) Hataları</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tactical.pin_blunders > 0 ? '#f43f5e' : '#10b981', marginTop: '0.2rem' }}>
                      {tactical.pin_blunders} Blunder
                    </div>
                  </div>

                  <div className="metric-card" style={{ background: '#18181b', textAlign: 'left', padding: '0.75rem 0.9rem' }}>
                    <div style={{ color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 600 }}>🔍 Açarak Saldırı</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tactical.discovered_blunders > 0 ? '#f43f5e' : '#10b981', marginTop: '0.2rem' }}>
                      {tactical.discovered_blunders} Blunder
                    </div>
                  </div>

                  <div className="metric-card" style={{ background: '#18181b', textAlign: 'left', padding: '0.75rem 0.9rem' }}>
                    <div style={{ color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 600 }}>♛ Vezir Kırışma Kabulü</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>
                      {tactical.queen_trades_accepted} Maç
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Opening Repertoire Section */}
            {data.profile.repertoire && (activeTab === 'all' || activeTab === 'opening') && (
              <div className="panel-card" style={{ padding: '1.25rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.1rem', color: '#fafafa' }}>
                  ♟️ Açılış Repertuarı & Zayıflık Haritası
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginTop: '0.85rem' }}>
                  {/* White Repertoire */}
                  <div style={{ background: '#18181b', padding: '1rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#fafafa', marginBottom: '0.65rem', fontWeight: 700 }}>
                      ⚪ En Çok Oynanan (Beyaz)
                    </h3>
                    {data.profile.repertoire.white_top && data.profile.repertoire.white_top.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {data.profile.repertoire.white_top.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a1a1aa', background: '#27272a', padding: '0.4rem 0.65rem', borderRadius: '4px' }}>
                            <span>{item.name}</span>
                            <span style={{ fontWeight: 700, color: '#fafafa' }}>{item.count} oyun</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#71717a' }}>Veri yetersiz.</div>
                    )}
                  </div>

                  {/* Black Repertoire */}
                  <div style={{ background: '#18181b', padding: '1rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#fafafa', marginBottom: '0.65rem', fontWeight: 700 }}>
                      ⚫ En Çok Oynanan (Siyah)
                    </h3>
                    {data.profile.repertoire.black_top && data.profile.repertoire.black_top.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {data.profile.repertoire.black_top.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a1a1aa', background: '#27272a', padding: '0.4rem 0.65rem', borderRadius: '4px' }}>
                            <span>{item.name}</span>
                            <span style={{ fontWeight: 700, color: '#fafafa' }}>{item.count} oyun</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#71717a' }}>Veri yetersiz.</div>
                    )}
                  </div>

                  {/* Weakest Openings */}
                  <div style={{ background: 'rgba(244, 63, 94, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#f43f5e', marginBottom: '0.65rem', fontWeight: 700 }}>
                      ⚠️ En Çok Zorlandığı 3 Açılış
                    </h3>
                    {data.profile.repertoire.weakest_openings && data.profile.repertoire.weakest_openings.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {data.profile.repertoire.weakest_openings.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', padding: '0.45rem 0.65rem', borderRadius: '4px', borderLeft: '2px solid #f43f5e' }}>
                            <div style={{ fontWeight: 700, color: '#fafafa', fontSize: '0.8rem' }}>{item.eco} - {item.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem', color: '#fca5a5' }}>
                              <span>Kazanma: %{item.win_rate_pct}</span>
                              <span>ACPL: {item.acpl}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#71717a' }}>Veri yetersiz.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Blunder Timing Distribution Panel */}
            {timing && (activeTab === 'all' || activeTab === 'timing') && (
              <div className="panel-card" style={{ padding: '1.25rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.1rem', color: '#fafafa' }}>
                  ⏱️ Hata Zamanlama Dağılımı
                </h2>

                <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid #f59e0b', padding: '0.85rem 1rem', borderRadius: '6px', marginTop: '0.65rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.9rem' }}>
                    Baskın Çöküş Fazı: {timing.peak_phase}
                  </div>
                  <div style={{ color: '#a1a1aa', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                    {timing.peak_description}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                  {/* Opening Phase Moves 1-15 */}
                  <div style={{ background: '#18181b', padding: '0.85rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem', color: '#fafafa', fontWeight: 600 }}>
                      <span>Açılış (Hamle 1 - 15)</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>%{timing.opening_pct}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#27272a', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${timing.opening_pct}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.35rem' }}>{timing.opening_blunders} blunder</div>
                  </div>

                  {/* Midgame Phase Moves 16-30 */}
                  <div style={{ background: '#18181b', padding: '0.85rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem', color: '#fafafa', fontWeight: 600 }}>
                      <span>Orta Oyun (Hamle 16 - 30)</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>%{timing.midgame_pct}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#27272a', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${timing.midgame_pct}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.35rem' }}>{timing.midgame_blunders} blunder</div>
                  </div>

                  {/* Late Game Phase Moves 31+ */}
                  <div style={{ background: '#18181b', padding: '0.85rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem', color: '#fafafa', fontWeight: 600 }}>
                      <span>Oyun Sonu (Hamle 31+)</span>
                      <span style={{ color: '#f43f5e', fontWeight: 700 }}>%{timing.late_pct}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#27272a', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${timing.late_pct}%`, height: '100%', background: '#f43f5e', borderRadius: '3px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.35rem' }}>{timing.late_blunders} blunder</div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Layout Grid */}
            {(activeTab === 'all' || activeTab === 'profile' || activeTab === 'strategy') && (
              <div className="analytics-grid">
                {/* Left Column: Player Profile Radar & Behavioral Indicators */}
                {(activeTab === 'all' || activeTab === 'profile') && (
                  <div className="panel-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 className="card-title" style={{ margin: 0, fontSize: '1.05rem' }}>📊 {data.target_username} vs {primaryGM?.name}</h2>
                      <button 
                        type="button"
                        onClick={() => setShowGMOverlay(!showGMOverlay)}
                        style={{ background: '#18181b', border: '1px solid #27272a', color: '#fafafa', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        {showGMOverlay ? '👁️ Sadece Oyuncuyu Göster' : '⚔️ GM Kıyaslamasını Aç'}
                      </button>
                    </div>

                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarData(data.profile.scores, primaryGM?.gm_scores)}>
                          <PolarGrid stroke="#27272a" />
                          <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 500 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#27272a" />
                          <Radar name={data.target_username} dataKey="Oyuncu" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} />
                          {showGMOverlay && (
                            <Radar name={primaryGM?.name} dataKey="GM" stroke="#71717a" fill="#71717a" fillOpacity={0.2} />
                          )}
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Behavioral & Manipulation Indicators */}
                    <div>
                      <h3 style={{ fontSize: '0.95rem', color: '#fafafa', marginTop: '0.4rem', marginBottom: '0.65rem', fontWeight: 700 }}>
                        🎭 Psikolojik & Manipülasyon Göstergeleri
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                        <div className="metric-card" style={{ textAlign: 'left', padding: '0.75rem 0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="metric-label" style={{ fontWeight: 600 }}>Greed (Açgözlülük)</span>
                            <span className="metric-value" style={{ fontSize: '1.15rem', color: data.profile.scores.GreedIndex > 50 ? '#f43f5e' : '#10b981' }}>
                              %{data.profile.scores.GreedIndex}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.2rem', lineHeight: '1.25' }}>
                            Zehirli piyonlara veya sahte feda tuzaklarına düşme meyli.
                          </p>
                        </div>

                        <div className="metric-card" style={{ textAlign: 'left', padding: '0.75rem 0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="metric-label" style={{ fontWeight: 600 }}>Moral Çöküş Riski</span>
                            <span className="metric-value" style={{ fontSize: '1.15rem', color: data.profile.scores.CascadeBlunderRisk > 30 ? '#f43f5e' : '#10b981' }}>
                              %{data.profile.scores.CascadeBlunderRisk}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.2rem', lineHeight: '1.25' }}>
                            İlk hatadan sonraki 3 hamlede 2. dev hatayı yapma riski.
                          </p>
                        </div>

                        <div className="metric-card" style={{ textAlign: 'left', padding: '0.75rem 0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="metric-label" style={{ fontWeight: 600 }}>Post-Loss Tilt</span>
                            <span className="metric-value" style={{ fontSize: '1.15rem', color: data.profile.scores.TiltIndex > 30 ? '#f43f5e' : '#10b981' }}>
                              %{data.profile.scores.TiltIndex}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.2rem', lineHeight: '1.25' }}>
                            Mağlubiyet ardından oynanan maçta aşırı risk ve hata meyli.
                          </p>
                        </div>

                        <div className="metric-card" style={{ textAlign: 'left', padding: '0.75rem 0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="metric-label" style={{ fontWeight: 600 }}>Post-Win Özgüven</span>
                            <span className="metric-value" style={{ fontSize: '1.15rem', color: '#f59e0b' }}>
                              %{data.profile.scores.OverconfidenceIndex}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.2rem', lineHeight: '1.25' }}>
                            Galibiyet ardından oynanan maçta dikkatsiz risk alma sıklığı.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Right Column: GM Rankings & Exploitation Blueprint */}
                {(activeTab === 'all' || activeTab === 'strategy' || activeTab === 'profile') && (
                  <div className="panel-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    {/* GM Match Rankings */}
                    {data.gm_similarity && (
                      <div>
                        <h2 className="card-title" style={{ fontSize: '1.05rem' }}>🏆 Büyükusta Stil Benzerliği Listesi</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.65rem' }}>
                          {data.gm_similarity.top_matches.map((gm) => (
                            <div key={gm.id} style={{ background: '#18181b', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid #27272a' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 600, color: '#fafafa', fontSize: '0.85rem' }}>{gm.name} <span style={{ fontSize: '0.75rem', color: '#71717a' }}>({gm.title})</span></span>
                                <span style={{ fontWeight: 700, color: gm.similarity_pct > 75 ? '#f59e0b' : '#a1a1aa', fontSize: '0.85rem' }}>%{gm.similarity_pct}</span>
                              </div>
                              <div style={{ width: '100%', height: '5px', background: '#27272a', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${gm.similarity_pct}%`, height: '100%', background: gm.similarity_pct > 75 ? '#f59e0b' : '#71717a', borderRadius: '3px' }}></div>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.3rem' }}>{gm.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <h2 className="card-title" style={{ color: '#fafafa', fontSize: '1.05rem' }}>🎯 Rakip Manipülasyon Rehberi (Exploitation Blueprint)</h2>

                    <div className="strategy-item strategy-insight">
                      <strong>Özet Scouting Değerlendirmesi:</strong> {data.counter_strategy.summary_statement}
                    </div>

                    {/* Exploitation Steps */}
                    <div>
                      <h3 style={{ fontSize: '0.95rem', color: '#f59e0b', marginBottom: '0.65rem', fontWeight: 700 }}>🔥 Adım Adım Rakibi Oyundan Düşürme Planı</h3>
                      <div className="strategy-list">
                        {data.counter_strategy.exploitation_steps && data.counter_strategy.exploitation_steps.length > 0 ? (
                          data.counter_strategy.exploitation_steps.map((step, idx) => (
                            <div key={idx} className="strategy-item strategy-insight">
                              <span dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                          ))
                        ) : (
                          <div className="strategy-item strategy-insight">Standart pozisyonel oyun önerilmektedir.</div>
                        )}
                      </div>
                    </div>

                    {/* DOs and DONTs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <h3 style={{ fontSize: '0.85rem', color: '#10b981', marginBottom: '0.4rem', fontWeight: 700 }}>✅ Yapılacaklar (DOs)</h3>
                        <div className="strategy-list">
                          {data.counter_strategy.dos.map((item, idx) => (
                            <div key={idx} className="strategy-item strategy-do">
                              • {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 style={{ fontSize: '0.85rem', color: '#f43f5e', marginBottom: '0.4rem', fontWeight: 700 }}>❌ Kaçınılacaklar (DON'Ts)</h3>
                        <div className="strategy-list">
                          {data.counter_strategy.donts.map((item, idx) => (
                            <div key={idx} className="strategy-item strategy-dont">
                              • {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
