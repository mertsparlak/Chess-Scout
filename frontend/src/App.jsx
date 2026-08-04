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
      {/* Grandmaster Intelligence Header */}
      <header className="app-header">
        <div className="brand-logo">
          <span className="brand-icon">👑</span>
          <span>CHESS<span className="brand-text-gold">-SCOUT</span> INTEL</span>
        </div>
        <div className="status-badge">
          <span className="dot-online"></span>
          {health ? (health.stockfish_available ? 'Stockfish 16.1 Online' : 'Smart Heuristic Engine') : 'API Offline'}
        </div>
      </header>

      <main className="dashboard-container">
        {/* Search & Scouting Query Card */}
        <div className="glass-panel search-card">
          <div>
            <h1 className="search-title">Grandmaster Player Scouting & Behavior Engine</h1>
            <p className="search-subtitle">
              Rakip oyuncunun psikolojik zaaflarını, tuzak meylini, hamle çöküş hamlesini ve efsanevi Büyükustalarla stil benzerliğini analiz edin.
            </p>
          </div>

          <form className="search-form" onSubmit={handleAnalyze}>
            <input
              type="text"
              className="input-field"
              placeholder="Oyuncu Kullanıcı Adı (ör: hikaru, drnykterstein, matteorf2b)"
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
            <div style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowTokenInput(!showTokenInput)}
                  style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: 700, fontSize: '0.95rem' }}
                >
                  {showTokenInput ? '🔑 Token Ayarlarını Gizle' : '🔑 Lichess API Token Ayarları (Sınırsız İzin İçin)'}
                </button>

                {lichessToken.trim() ? (
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.3rem 0.85rem', borderRadius: '20px', fontSize: '0.85rem', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700 }}>
                    ✓ Lichess Token Kayıtlı (Sınırsız Sorgulama Aktif)
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    (İsteğe bağlı - Sınırsız sorgulama için)
                  </span>
                )}
              </div>

              {showTokenInput && (
                <div style={{ marginTop: '0.75rem', background: 'rgba(245, 158, 11, 0.08)', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <p style={{ color: '#e2e8f0', marginBottom: '0.75rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Lichess sunucularında anonim (token'sız) sorgularda API istekleri sınırlıdır. <a href="https://lichess.org/account/oauth/token" target="_blank" rel="noreferrer" style={{ color: '#fbbf24', fontWeight: 700, textDecoration: 'underline' }}>Buraya tıklayarak 10 saniyede ücretsiz Lichess API Token alabilirsiniz.</a> Token tarayıcınıza bir kez kaydedilir ve PC kapansa bile sonraki açılışlarda otomatik kullanılır.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                      type="password"
                      className="input-field"
                      style={{ flex: 1, fontSize: '0.95rem', padding: '0.75rem 1rem', background: 'rgba(0, 0, 0, 0.4)', color: '#ffffff', border: '1px solid rgba(245, 158, 11, 0.4)' }}
                      placeholder="Lichess Personal Access Token yapıştırın (lip_...)"
                      value={lichessToken}
                      onChange={(e) => setLichessToken(e.target.value)}
                    />
                    {lichessToken && (
                      <button
                        type="button"
                        onClick={() => setLichessToken('')}
                        style={{ background: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.5)', color: '#f87171', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}
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
            <div style={{ color: '#f43f5e', padding: '1rem', background: 'rgba(244, 63, 94, 0.12)', borderRadius: '10px', border: '1px solid rgba(244, 63, 94, 0.3)', marginTop: '0.75rem', fontSize: '0.95rem', lineHeight: '1.4' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Dashboard Results Section */}
        {data && (
          <>
            {/* Hero Player Archetype & Top GM Match Header */}
            {data.gm_similarity && (
              <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)', border: '1px solid rgba(245, 158, 11, 0.35)', boxShadow: '0 0 35px rgba(245, 158, 11, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                      👑 OYUNCU KİMLİĞİ (ARCHETYPE)
                    </span>
                    <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#fff', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {data.gm_similarity.archetype.badge}
                    </h2>
                    <p style={{ color: '#cbd5e1', fontSize: '1.05rem', marginTop: '0.4rem', maxWidth: '650px' }}>
                      {data.gm_similarity.archetype.tagline}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Top GM Match Pill */}
                    <div className="metric-card" style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '1.1rem 1.75rem', borderRadius: '16px' }}>
                      <div className="metric-label" style={{ color: '#94a3b8' }}>En Çok Benzeyen Büyükusta</div>
                      <div className="metric-value" style={{ fontSize: '1.9rem', color: '#fbbf24' }}>
                        %{primaryGM.similarity_pct} {primaryGM.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem', fontWeight: 600 }}>{primaryGM.title}</div>
                    </div>

                    {/* Export Report Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={() => printPDFReport()}
                        style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.5)', color: '#fbbf24', padding: '0.6rem 1.1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                      >
                        📄 PDF Raporu İndir
                      </button>
                      <button
                        type="button"
                        onClick={() => exportMarkdownReport(data)}
                        style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.5)', color: '#818cf8', padding: '0.6rem 1.1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                      >
                        📝 Markdown Raporu
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

            {/* Dashboard View Filter Tabs */}
            <div className="dashboard-tabs">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                📌 Tüm Analizler (Full Intel)
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

            {/* Tactical Weaknesses Breakdown Widget */}
            {tactical && (activeTab === 'all' || activeTab === 'profile') && (
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.2rem', color: '#fbbf24' }}>
                  🎯 Taktik Zayıflık Dağılımı (Hangi Tuzaklara Düşüyor?)
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
                  <div className="metric-card" style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', padding: '0.85rem 1rem' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>🧲 Açgözlü Taş Alma</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: tactical.capture_blunders > 0 ? '#f43f5e' : '#10b981', marginTop: '0.2rem' }}>
                      {tactical.capture_blunders} Blunder
                    </div>
                  </div>

                  <div className="metric-card" style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', padding: '0.85rem 1rem' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>⚔️ Çatal (Fork) Hataları</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: tactical.fork_blunders > 0 ? '#f43f5e' : '#10b981', marginTop: '0.2rem' }}>
                      {tactical.fork_blunders} Blunder
                    </div>
                  </div>

                  <div className="metric-card" style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', padding: '0.85rem 1rem' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>📌 Açmaz (Pin) Hataları</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: tactical.pin_blunders > 0 ? '#f43f5e' : '#10b981', marginTop: '0.2rem' }}>
                      {tactical.pin_blunders} Blunder
                    </div>
                  </div>

                  <div className="metric-card" style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', padding: '0.85rem 1rem' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>🔍 Açarak Saldırı Hataları</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: tactical.discovered_blunders > 0 ? '#f43f5e' : '#10b981', marginTop: '0.2rem' }}>
                      {tactical.discovered_blunders} Blunder
                    </div>
                  </div>

                  <div className="metric-card" style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', padding: '0.85rem 1rem' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>♛ Vezir Kırışma Kabulü</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
                      {tactical.queen_trades_accepted} Maç
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Opening Repertoire & Weakness Matrix Section */}
            {data.profile.repertoire && (activeTab === 'all' || activeTab === 'opening') && (
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.25rem', color: '#fbbf24' }}>
                  ♟️ Açılış Repertuarı & Zayıflık Haritası
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  {/* White Repertoire */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.95rem', color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                      ⚪ En Çok Oynanan (Beyaz)
                    </h3>
                    {data.profile.repertoire.white_top && data.profile.repertoire.white_top.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {data.profile.repertoire.white_top.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                            <span>{item.name}</span>
                            <span style={{ fontWeight: 800, color: '#fbbf24' }}>{item.count} oyun</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Veri yetersiz.</div>
                    )}
                  </div>

                  {/* Black Repertoire */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.95rem', color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                      ⚫ En Çok Oynanan (Siyah)
                    </h3>
                    {data.profile.repertoire.black_top && data.profile.repertoire.black_top.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {data.profile.repertoire.black_top.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                            <span>{item.name}</span>
                            <span style={{ fontWeight: 800, color: '#818cf8' }}>{item.count} oyun</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Veri yetersiz.</div>
                    )}
                  </div>

                  {/* Weakest Openings (Vulnerability Alert) */}
                  <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: '1.1rem', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                    <h3 style={{ fontSize: '0.95rem', color: '#f43f5e', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                      ⚠️ En Çok Zorlandığı 3 Açılış
                    </h3>
                    {data.profile.repertoire.weakest_openings && data.profile.repertoire.weakest_openings.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.57rem' }}>
                        {data.profile.repertoire.weakest_openings.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', background: 'rgba(244, 63, 94, 0.12)', padding: '0.5rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #f43f5e' }}>
                            <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem' }}>{item.eco} - {item.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem', color: '#fca5a5' }}>
                              <span>Kazanma: %{item.win_rate_pct}</span>
                              <span>ACPL: {item.acpl}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Veri yetersiz.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Blunder Timing Distribution Panel */}
            {timing && (activeTab === 'all' || activeTab === 'timing') && (
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.25rem', color: '#fbbf24' }}>
                  ⏱️ Hata Zamanlama Dağılımı (Hangi Hamlede Çöküyor?)
                </h2>

                <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', padding: '0.95rem 1.25rem', borderRadius: '8px', marginTop: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.95rem' }}>
                    Baskın Çöküş Fazı: {timing.peak_phase}
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {timing.peak_description}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  {/* Opening Phase Moves 1-15 */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
                      <span>Açılış (Hamle 1 - 15)</span>
                      <span style={{ color: '#818cf8', fontWeight: 800 }}>%{timing.opening_pct}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${timing.opening_pct}%`, height: '100%', background: '#818cf8', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>{timing.opening_blunders} toplam blunder</div>
                  </div>

                  {/* Midgame Phase Moves 16-30 */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
                      <span>Orta Oyun (Hamle 16 - 30)</span>
                      <span style={{ color: '#fbbf24', fontWeight: 800 }}>%{timing.midgame_pct}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${timing.midgame_pct}%`, height: '100%', background: '#fbbf24', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>{timing.midgame_blunders} toplam blunder</div>
                  </div>

                  {/* Late Game Phase Moves 31+ */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
                      <span>Oyun Sonu (Hamle 31+)</span>
                      <span style={{ color: '#f43f5e', fontWeight: 800 }}>%{timing.late_pct}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${timing.late_pct}%`, height: '100%', background: '#f43f5e', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>{timing.late_blunders} toplam blunder</div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Dual Column Layout */}
            {(activeTab === 'all' || activeTab === 'profile' || activeTab === 'strategy') && (
              <div className="analytics-grid">
                {/* Left Column: Player Profile Radar & Behavioral Indicators */}
                {(activeTab === 'all' || activeTab === 'profile') && (
                  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 className="card-title" style={{ margin: 0, fontSize: '1.2rem' }}>📊 {data.target_username} vs {primaryGM?.name}</h2>
                      <button 
                        type="button"
                        onClick={() => setShowGMOverlay(!showGMOverlay)}
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        {showGMOverlay ? '👁️ Sadece Oyuncuyu Göster' : '⚔️ GM Kıyaslamasını Aç'}
                      </button>
                    </div>

                    <div style={{ width: '100%', height: 320 }}>
                      <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarData(data.profile.scores, primaryGM?.gm_scores)}>
                          <PolarGrid stroke="rgba(255,255,255,0.12)" />
                          <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 600 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" />
                          <Radar name={data.target_username} dataKey="Oyuncu" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                          {showGMOverlay && (
                            <Radar name={primaryGM?.name} dataKey="GM" stroke="#818cf8" fill="#818cf8" fillOpacity={0.25} />
                          )}
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Behavioral & Manipulation Indicators */}
                    <div>
                      <h3 style={{ fontSize: '1.05rem', color: '#fbbf24', marginTop: '0.5rem', marginBottom: '0.75rem', fontWeight: 800 }}>
                        🎭 Psikolojik & Manipülasyon Göstergeleri
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="metric-card" style={{ textAlign: 'left', padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="metric-label" style={{ fontWeight: 700 }}>Greed (Açgözlülük)</span>
                            <span className="metric-value" style={{ fontSize: '1.25rem', color: data.profile.scores.GreedIndex > 50 ? '#f43f5e' : '#10b981' }}>
                              %{data.profile.scores.GreedIndex}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem', lineHeight: '1.3' }}>
                            Zehirli piyonlara veya sahte feda tuzaklarına düşme meyli.
                          </p>
                        </div>

                        <div className="metric-card" style={{ textAlign: 'left', padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="metric-label" style={{ fontWeight: 700 }}>Moral Çöküş Riski</span>
                            <span className="metric-value" style={{ fontSize: '1.25rem', color: data.profile.scores.CascadeBlunderRisk > 30 ? '#f43f5e' : '#10b981' }}>
                              %{data.profile.scores.CascadeBlunderRisk}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem', lineHeight: '1.3' }}>
                            İlk hatadan sonraki 3 hamlede 2. dev hatayı yapma riski.
                          </p>
                        </div>

                        <div className="metric-card" style={{ textAlign: 'left', padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="metric-label" style={{ fontWeight: 700 }}>Post-Loss Tilt</span>
                            <span className="metric-value" style={{ fontSize: '1.25rem', color: data.profile.scores.TiltIndex > 30 ? '#f43f5e' : '#10b981' }}>
                              %{data.profile.scores.TiltIndex}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem', lineHeight: '1.3' }}>
                            Mağlubiyet ardından oynanan maçta aşırı risk ve hata meyli.
                          </p>
                        </div>

                        <div className="metric-card" style={{ textAlign: 'left', padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="metric-label" style={{ fontWeight: 700 }}>Post-Win Özgüven</span>
                            <span className="metric-value" style={{ fontSize: '1.25rem', color: '#fbbf24' }}>
                              %{data.profile.scores.OverconfidenceIndex}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem', lineHeight: '1.3' }}>
                            Galibiyet ardından oynanan maçta dikkatsiz risk alma sıklığı.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Right Column: GM Rankings & Exploitation Blueprint */}
                {(activeTab === 'all' || activeTab === 'strategy' || activeTab === 'profile') && (
                  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* GM Match Rankings */}
                    {data.gm_similarity && (
                      <div>
                        <h2 className="card-title" style={{ fontSize: '1.15rem' }}>🏆 Efsanevi GM Benzerlik Sıralaması</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                          {data.gm_similarity.top_matches.map((gm) => (
                            <div key={gm.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem 1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                <span style={{ fontWeight: 700, color: '#fff' }}>{gm.name} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>({gm.title})</span></span>
                                <span style={{ fontWeight: 800, color: gm.similarity_pct > 75 ? '#fbbf24' : '#818cf8' }}>%{gm.similarity_pct}</span>
                              </div>
                              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${gm.similarity_pct}%`, height: '100%', background: gm.similarity_pct > 75 ? 'var(--gold-gradient)' : '#6366f1', borderRadius: '3px' }}></div>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>{gm.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <h2 className="card-title" style={{ color: '#fbbf24' }}>🎯 Rakip Manipülasyon Rehberi (Exploitation Blueprint)</h2>

                    <div className="strategy-item strategy-insight">
                      <strong>Özet Scouting Değerlendirmesi:</strong> {data.counter_strategy.summary_statement}
                    </div>

                    {/* Exploitation Steps */}
                    <div>
                      <h3 style={{ fontSize: '1.05rem', color: '#fbbf24', marginBottom: '0.75rem', fontWeight: 700 }}>🔥 Adım Adım Rakibi Oyundan Düşürme Planı</h3>
                      <div className="strategy-list">
                        {data.counter_strategy.exploitation_steps && data.counter_strategy.exploitation_steps.length > 0 ? (
                          data.counter_strategy.exploitation_steps.map((step, idx) => (
                            <div key={idx} className="strategy-item" style={{ background: 'rgba(245, 158, 11, 0.08)', borderLeft: '4px solid #f59e0b' }}>
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
                        <h3 style={{ fontSize: '0.95rem', color: '#10b981', marginBottom: '0.5rem', fontWeight: 700 }}>✅ Yapılacaklar (DOs)</h3>
                        <div className="strategy-list">
                          {data.counter_strategy.dos.map((item, idx) => (
                            <div key={idx} className="strategy-item strategy-do" style={{ fontSize: '0.85rem' }}>
                              • {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 style={{ fontSize: '0.95rem', color: '#f43f5e', marginBottom: '0.5rem', fontWeight: 700 }}>❌ Kaçınılacaklar (DON'Ts)</h3>
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
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
