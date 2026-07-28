import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

export default function App() {
  const [username, setUsername] = useState('mertparlaks');
  const [platform, setPlatform] = useState('lichess');
  const [maxGames, setMaxGames] = useState(15);
  
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

  useEffect(() => {
    checkHealth();
  }, []);

  // Save or clear lichessToken in localStorage whenever it changes
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

  return (
    <div className="app-root">
      {/* Header */}
      <header className="app-header">
        <div className="brand-logo">
          <span>♟️</span> Chess-Scout
        </div>
        <div className="status-badge">
          <span className="dot-online"></span>
          {health ? (health.stockfish_available ? 'Stockfish 16.1 Online' : 'Smart Heuristic Mode') : 'API Status: Offline'}
        </div>
      </header>

      <main className="dashboard-container">
        {/* Search Panel */}
        <div className="glass-panel search-card">
          <div>
            <h1 className="search-title">Chess-Scout: Player Intelligence & GM Matching</h1>
            <p className="search-subtitle">
              Oyuncuların psikolojik davranış kalıplarını, tuzak zayıflıklarını ve efsanevi Büyükustalarla stil benzerliğini analiz eder.
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

          {/* Lichess Token Toggle with localStorage Persistence */}
          {platform === 'lichess' && (
            <div style={{ marginTop: '0.6rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowTokenInput(!showTokenInput)}
                  style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: 700, fontSize: '0.95rem' }}
                >
                  {showTokenInput ? '🔑 Token Ayarlarını Gizle' : '🔑 Lichess API Token Ayarları (Sınırsız İzin İçin)'}
                </button>

                {lichessToken.trim() ? (
                  <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.3rem 0.8rem', borderRadius: '14px', fontSize: '0.85rem', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700 }}>
                    ✓ Lichess Token Kayıtlı (Sınırsız İzin Aktif)
                  </span>
                ) : (
                  <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                    (İsteğe bağlı - Sınırsız sorgulama için)
                  </span>
                )}
              </div>

              {showTokenInput && (
                <div style={{ marginTop: '0.75rem', background: 'rgba(168, 85, 247, 0.12)', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.35)' }}>
                  <p style={{ color: '#e5e7eb', marginBottom: '0.75rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Lichess sunucularında anonim (token'sız) sorgularda API istekleri sınırlıdır. <a href="https://lichess.org/account/oauth/token" target="_blank" rel="noreferrer" style={{ color: '#c084fc', fontWeight: 700, textDecoration: 'underline' }}>Buraya tıklayarak 10 saniyede ücretsiz Lichess API Token alabilirsiniz.</a> Token tarayıcınıza bir kez kaydedilir ve PC kapansa bile sonraki açılışlarda otomatik kullanılır.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                      type="password"
                      className="input-field"
                      style={{ flex: 1, fontSize: '0.95rem', padding: '0.75rem 1rem', background: 'rgba(0, 0, 0, 0.4)', color: '#ffffff', border: '1px solid rgba(168, 85, 247, 0.4)' }}
                      placeholder="Lichess Personal Access Token yapıştırın (lip_...)"
                      value={lichessToken}
                      onChange={(e) => setLichessToken(e.target.value)}
                    />
                    {lichessToken && (
                      <button
                        type="button"
                        onClick={() => setLichessToken('')}
                        style={{ background: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#f87171', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}
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
            <div style={{ color: '#ef4444', padding: '1rem', background: 'rgba(239, 68, 68, 0.12)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', marginTop: '0.75rem', fontSize: '0.95rem', lineHeight: '1.4' }}>
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

            {/* Archetype & Top GM Similarity Hero Banner */}
            {data.gm_similarity && (
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#a855f7', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      OYUNCU KİMLİĞİ (ARCHETYPE)
                    </span>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                      {data.gm_similarity.archetype.badge}
                    </h2>
                    <p style={{ color: '#d1d5db', fontSize: '1rem', marginTop: '0.4rem' }}>
                      {data.gm_similarity.archetype.tagline}
                    </p>
                  </div>

                  <div className="metric-card" style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '1rem 1.5rem' }}>
                    <div className="metric-label" style={{ color: '#9ca3af' }}>En Çok Benzeyen Büyükusta</div>
                    <div className="metric-value" style={{ fontSize: '1.8rem', color: '#a855f7' }}>
                      %{primaryGM.similarity_pct} {primaryGM.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>{primaryGM.title}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Opening Repertoire & Weakness Matrix Section */}
            {data.profile.repertoire && (
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 className="card-title" style={{ fontSize: '1.25rem', color: '#6366f1' }}>
                  ♟️ Açılış Repertuarı & Zayıflık Haritası
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  {/* White Repertoire */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.95rem', color: '#e5e7eb', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⚪ En Çok Oynanan (Beyaz)
                    </h3>
                    {data.profile.repertoire.white_top && data.profile.repertoire.white_top.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {data.profile.repertoire.white_top.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#d1d5db', background: 'rgba(255,255,255,0.04)', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                            <span>{item.name}</span>
                            <span style={{ fontWeight: 700, color: '#6366f1' }}>{item.count} oyun</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Veri yetersiz.</div>
                    )}
                  </div>

                  {/* Black Repertoire */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.95rem', color: '#e5e7eb', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⚫ En Çok Oynanan (Siyah)
                    </h3>
                    {data.profile.repertoire.black_top && data.profile.repertoire.black_top.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {data.profile.repertoire.black_top.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#d1d5db', background: 'rgba(255,255,255,0.04)', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                            <span>{item.name}</span>
                            <span style={{ fontWeight: 700, color: '#a855f7' }}>{item.count} oyun</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Veri yetersiz.</div>
                    )}
                  </div>

                  {/* Weakest Openings (Vulnerability Alert) */}
                  <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    <h3 style={{ fontSize: '0.95rem', color: '#ef4444', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⚠️ En Çok Zorlandığı 3 Açılış
                    </h3>
                    {data.profile.repertoire.weakest_openings && data.profile.repertoire.weakest_openings.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {data.profile.repertoire.weakest_openings.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{item.eco} - {item.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem', color: '#fca5a5' }}>
                              <span>Kazanma: %{item.win_rate_pct}</span>
                              <span>ACPL: {item.acpl}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Veri yetersiz.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="analytics-grid">
              {/* Left Column: Player Profile Radar & Behavioral Badges */}
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="card-title" style={{ margin: 0 }}>📊 {data.target_username} vs {primaryGM?.name}</h2>
                  <button 
                    type="button"
                    onClick={() => setShowGMOverlay(!showGMOverlay)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    {showGMOverlay ? '👁️ Sadece Oyuncuyu Göster' : '⚔️ GM Kıyaslamasını Aç'}
                  </button>
                </div>

                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarData(data.profile.scores, primaryGM?.gm_scores)}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" stroke="#9ca3af" tick={{ fill: '#d1d5db', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" />
                      <Radar name={data.target_username} dataKey="Oyuncu" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                      {showGMOverlay && (
                        <Radar name={primaryGM?.name} dataKey="GM" stroke="#a855f7" fill="#a855f7" fillOpacity={0.25} />
                      )}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Behavioral & Manipulation Metrics with Explanations */}
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#a855f7', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                    🎭 Psikolojik & Manipülasyon Göstergeleri
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="metric-card" style={{ textAlign: 'left', padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="metric-label" style={{ fontWeight: 600 }}>Greed (Açgözlülük)</span>
                        <span className="metric-value" style={{ fontSize: '1.25rem', color: data.profile.scores.GreedIndex > 50 ? '#ef4444' : '#10b981' }}>
                          %{data.profile.scores.GreedIndex}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem', lineHeight: '1.3' }}>
                        Zehirli piyonlara veya sahte feda tuzaklarına düşme meyli.
                      </p>
                    </div>

                    <div className="metric-card" style={{ textAlign: 'left', padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="metric-label" style={{ fontWeight: 600 }}>Moral Çöküş Riski</span>
                        <span className="metric-value" style={{ fontSize: '1.25rem', color: data.profile.scores.CascadeBlunderRisk > 30 ? '#ef4444' : '#10b981' }}>
                          %{data.profile.scores.CascadeBlunderRisk}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem', lineHeight: '1.3' }}>
                        İlk hatadan sonraki 3 hamlede 2. dev hatayı yapma riski.
                      </p>
                    </div>

                    <div className="metric-card" style={{ textAlign: 'left', padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="metric-label" style={{ fontWeight: 600 }}>Post-Loss Tilt</span>
                        <span className="metric-value" style={{ fontSize: '1.25rem', color: data.profile.scores.TiltIndex > 30 ? '#ef4444' : '#10b981' }}>
                          %{data.profile.scores.TiltIndex}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem', lineHeight: '1.3' }}>
                        Mağlubiyet ardından oynanan maçta aşırı risk ve hata meyli.
                      </p>
                    </div>

                    <div className="metric-card" style={{ textAlign: 'left', padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="metric-label" style={{ fontWeight: 600 }}>Post-Win Özgüven</span>
                        <span className="metric-value" style={{ fontSize: '1.25rem', color: '#f59e0b' }}>
                          %{data.profile.scores.OverconfidenceIndex}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem', lineHeight: '1.3' }}>
                        Galibiyet ardından oynanan maçta dikkatsiz risk alma sıklığı.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: GM Match Rankings & Exploitation Blueprint */}
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* GM Match Rankings */}
                {data.gm_similarity && (
                  <div>
                    <h2 className="card-title" style={{ fontSize: '1.15rem' }}>🏆 Büyükusta Stil Benzerliği Listesi</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                      {data.gm_similarity.top_matches.map((gm) => (
                        <div key={gm.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <span style={{ fontWeight: 600, color: '#fff' }}>{gm.name} <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>({gm.title})</span></span>
                            <span style={{ fontWeight: 800, color: gm.similarity_pct > 75 ? '#a855f7' : '#6366f1' }}>%{gm.similarity_pct}</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${gm.similarity_pct}%`, height: '100%', background: gm.similarity_pct > 75 ? 'linear-gradient(90deg, #6366f1, #a855f7)' : '#6366f1', borderRadius: '3px' }}></div>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.4rem' }}>{gm.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
