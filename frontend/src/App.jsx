import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { exportMarkdownReport, printPDFReport } from './utils/exporter';

/* ── SVG Icons (no emoji slop) ── */
const ChessKnight = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 22H5v-2h14v2M13 2c-1.25 0-2.42.62-3.11 1.66L7 8l2 2 2.1-2.8 .9.8V14H8a2 2 0 0 0-2 2v4h12v-4a2 2 0 0 0-2-2h-2V7c0-.55-.45-1-1-1s-1 .45-1 1v1.5L14.5 6C14.5 3.79 13.21 2 13 2z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

export default function App() {
  const [username, setUsername] = useState('mertparlaks');
  const [platform, setPlatform] = useState('lichess');
  const [maxGames, setMaxGames] = useState(10);
  const [lichessToken, setLichessToken] = useState(() => localStorage.getItem('chess_scout_lichess_token') || '');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [showGMOverlay, setShowGMOverlay] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => { checkHealth(); }, []);

  useEffect(() => {
    if (lichessToken.trim()) localStorage.setItem('chess_scout_lichess_token', lichessToken.trim());
    else localStorage.removeItem('chess_scout_lichess_token');
  }, [lichessToken]);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) setHealth(await res.json());
    } catch (e) {
      console.warn('Backend offline:', e);
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
        body: JSON.stringify({ username, platform, max_games: Number(maxGames), lichess_token: lichessToken.trim() || undefined })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: 'Sunucu hatası.' }));
        throw new Error(errJson.detail || 'Analiz başarısız.');
      }
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRadarData = (u, g) => {
    if (!u) return [];
    return [
      { subject: 'Agresiflik', Oyuncu: u.Aggression || 50, GM: g?.Aggression || 50 },
      { subject: 'Taktik', Oyuncu: u.TacticalSkill || 50, GM: g?.TacticalSkill || 50 },
      { subject: 'Pozisyonel', Oyuncu: u.PositionalSkill || 50, GM: g?.PositionalSkill || 50 },
      { subject: 'Zaman Dir.', Oyuncu: u.TimePressureResistance || 50, GM: g?.TimePressureResistance || 50 },
      { subject: 'Açılış Çeş.', Oyuncu: u.TreeDiversityIndex || 50, GM: g?.TreeDiversityIndex || 50 },
      { subject: 'Tilt', Oyuncu: u.TiltIndex || 0, GM: g?.TiltIndex || 0 },
      { subject: 'Açgözlülük', Oyuncu: u.GreedIndex || 0, GM: g?.GreedIndex || 0 },
      { subject: 'Çöküş Riski', Oyuncu: u.CascadeBlunderRisk || 0, GM: g?.CascadeBlunderRisk || 0 },
    ];
  };

  const gm = data?.gm_similarity?.primary_match;
  const timing = data?.profile?.blunder_timing;
  const tactical = data?.profile?.tactical_weaknesses;
  const tabs = [
    { id: 'all', label: 'Genel Bakış' },
    { id: 'profile', label: 'Profil & Radar' },
    { id: 'opening', label: 'Açılışlar' },
    { id: 'timing', label: 'Zamanlama' },
    { id: 'strategy', label: 'Strateji' },
  ];

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon"><ChessKnight /></div>
          <span className="brand-name">Chess Scout</span>
        </div>
        <div className={`engine-status ${health ? '' : 'offline'}`}>
          <span className="dot" />
          {health ? (health.stockfish_available ? 'Stockfish 16.1' : 'Heuristic') : 'Offline'}
        </div>
      </header>

      <main className="main-container">
        {/* ── Hero Search ── */}
        <div className="card hero">
          <div className="hero-eyebrow">Player Intelligence</div>
          <h1 className="hero-title">Scouting & Analysis Engine</h1>
          <p className="hero-desc">
            Oyuncuların psikolojik zayıflıklarını, açılış hattalarını ve
            Büyükusta stil benzerliğini derinlemesine analiz edin.
          </p>

          <form className="search-row" onSubmit={handleAnalyze}>
            <input
              className="field field--grow"
              type="text"
              placeholder="Kullanıcı adı (ör: hikaru)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <select className="field" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="lichess">Lichess</option>
              <option value="chesscom">Chess.com</option>
            </select>
            <select className="field" value={maxGames} onChange={(e) => setMaxGames(Number(e.target.value))}>
              <option value="10">10 Oyun</option>
              <option value="15">15 Oyun</option>
              <option value="20">20 Oyun</option>
            </select>
            <button type="submit" className="btn btn-accent" disabled={loading}>
              {loading ? <><div className="spinner" /> Analiz ediliyor…</> : <><SearchIcon /> Analiz Et</>}
            </button>
          </form>

          {platform === 'lichess' && (
            <div className="token-toggle">
              <button type="button" className="token-link" onClick={() => setShowTokenInput(!showTokenInput)}>
                {showTokenInput ? 'Token gizle' : 'Lichess API Token'}
              </button>
              {lichessToken.trim() && <span className="token-saved">✓ Kayıtlı</span>}

              {showTokenInput && (
                <div className="token-panel">
                  <p>
                    Anonim sorgular sınırlıdır.{' '}
                    <a href="https://lichess.org/account/oauth/token" target="_blank" rel="noreferrer">
                      Buradan ücretsiz token alabilirsiniz.
                    </a>
                  </p>
                  <div className="token-input-row">
                    <input
                      type="password"
                      className="field field--grow"
                      placeholder="lip_..."
                      value={lichessToken}
                      onChange={(e) => setLichessToken(e.target.value)}
                    />
                    {lichessToken && (
                      <button type="button" className="btn-danger-sm" onClick={() => setLichessToken('')}>Sil</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}
        </div>

        {/* ── Results ── */}
        {data && (
          <>
            {/* Archetype Banner */}
            {data.gm_similarity && (
              <div className="card">
                <div className="archetype-banner">
                  <div>
                    <div className="archetype-label">Oyuncu Kimliği</div>
                    <div className="archetype-title">{data.gm_similarity.archetype.badge}</div>
                    <div className="archetype-tagline">{data.gm_similarity.archetype.tagline}</div>
                  </div>
                  <div>
                    <div className="archetype-gm">
                      <div className="archetype-gm-label">En Yakın Büyükusta</div>
                      <div className="archetype-gm-value">%{gm.similarity_pct}</div>
                      <div className="archetype-gm-name">{gm.name}</div>
                    </div>
                    <div className="archetype-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => printPDFReport()}>PDF</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => exportMarkdownReport(data)}>Markdown</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="stat-grid">
              <div className="stat-cell">
                <div className="stat-value">{data.profile.summary.total_games}</div>
                <div className="stat-label">Oyun</div>
              </div>
              <div className="stat-cell">
                <div className="stat-value">{data.profile.summary.win_rate_pct}%</div>
                <div className="stat-label">Kazanma</div>
              </div>
              <div className="stat-cell">
                <div className="stat-value">{data.profile.summary.avg_accuracy_pct}%</div>
                <div className="stat-label">Doğruluk</div>
              </div>
              <div className="stat-cell">
                <div className="stat-value">{data.profile.summary.acpl}</div>
                <div className="stat-label">ACPL</div>
              </div>
              <div className="stat-cell">
                <div className="stat-value">{data.profile.summary.blunders_per_game}</div>
                <div className="stat-label">Blunder/Oyun</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tab-bar">
              {tabs.map((t) => (
                <button key={t.id} type="button" className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tactical Weaknesses */}
            {tactical && (activeTab === 'all' || activeTab === 'profile') && (
              <div className="card">
                <div className="section-title">Taktik Zayıflık Dağılımı</div>
                <div className="tactical-grid">
                  <div className="tactical-cell">
                    <div className="tactical-cell-label">Açgözlü Taş Alma</div>
                    <div className={`tactical-cell-value ${tactical.capture_blunders > 0 ? 'color-negative' : 'color-positive'}`}>
                      {tactical.capture_blunders}
                    </div>
                  </div>
                  <div className="tactical-cell">
                    <div className="tactical-cell-label">Çatal (Fork)</div>
                    <div className={`tactical-cell-value ${tactical.fork_blunders > 0 ? 'color-negative' : 'color-positive'}`}>
                      {tactical.fork_blunders}
                    </div>
                  </div>
                  <div className="tactical-cell">
                    <div className="tactical-cell-label">Açmaz (Pin)</div>
                    <div className={`tactical-cell-value ${tactical.pin_blunders > 0 ? 'color-negative' : 'color-positive'}`}>
                      {tactical.pin_blunders}
                    </div>
                  </div>
                  <div className="tactical-cell">
                    <div className="tactical-cell-label">Açarak Saldırı</div>
                    <div className={`tactical-cell-value ${tactical.discovered_blunders > 0 ? 'color-negative' : 'color-positive'}`}>
                      {tactical.discovered_blunders}
                    </div>
                  </div>
                  <div className="tactical-cell">
                    <div className="tactical-cell-label">Vezir Değişimi</div>
                    <div className="tactical-cell-value color-accent">{tactical.queen_trades_accepted}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Opening Repertoire */}
            {data.profile.repertoire && (activeTab === 'all' || activeTab === 'opening') && (
              <div className="card">
                <div className="section-title">Açılış Repertuarı</div>
                <div className="three-col">
                  <div>
                    <div className="section-subtitle">Beyaz</div>
                    <div className="opening-list">
                      {data.profile.repertoire.white_top?.length > 0 ? (
                        data.profile.repertoire.white_top.map((o, i) => (
                          <div key={i} className="opening-row">
                            <span className="opening-row-name">{o.name}</span>
                            <span className="opening-row-count">{o.count}</span>
                          </div>
                        ))
                      ) : <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Veri yok</span>}
                    </div>
                  </div>
                  <div>
                    <div className="section-subtitle">Siyah</div>
                    <div className="opening-list">
                      {data.profile.repertoire.black_top?.length > 0 ? (
                        data.profile.repertoire.black_top.map((o, i) => (
                          <div key={i} className="opening-row">
                            <span className="opening-row-name">{o.name}</span>
                            <span className="opening-row-count">{o.count}</span>
                          </div>
                        ))
                      ) : <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Veri yok</span>}
                    </div>
                  </div>
                  <div>
                    <div className="section-subtitle" style={{ color: 'var(--negative)' }}>Zayıf Açılışlar</div>
                    {data.profile.repertoire.weakest_openings?.length > 0 ? (
                      data.profile.repertoire.weakest_openings.map((o, i) => (
                        <div key={i} className="weak-opening">
                          <div className="weak-opening-name">{o.eco} — {o.name}</div>
                          <div className="weak-opening-stats">
                            <span>Kazanma %{o.win_rate_pct}</span>
                            <span>ACPL {o.acpl}</span>
                          </div>
                        </div>
                      ))
                    ) : <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Veri yok</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Blunder Timing */}
            {timing && (activeTab === 'all' || activeTab === 'timing') && (
              <div className="card">
                <div className="section-title">Hata Zamanlama Dağılımı</div>
                <div className="callout" style={{ marginBottom: 'var(--space-5)' }}>
                  <div className="callout-title">Baskın Çöküş Fazı: {timing.peak_phase}</div>
                  <div className="callout-desc">{timing.peak_description}</div>
                </div>
                <div className="three-col">
                  <div className="progress-section">
                    <div className="progress-header">
                      <span style={{ color: 'var(--text-secondary)' }}>Açılış (1–15)</span>
                      <span style={{ color: 'var(--accent-text)', fontFamily: 'var(--font-mono)' }}>%{timing.opening_pct}</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill progress-fill--amber" style={{ width: `${timing.opening_pct}%` }} /></div>
                    <div className="progress-detail">{timing.opening_blunders} blunder</div>
                  </div>
                  <div className="progress-section">
                    <div className="progress-header">
                      <span style={{ color: 'var(--text-secondary)' }}>Orta Oyun (16–30)</span>
                      <span style={{ color: 'var(--accent-text)', fontFamily: 'var(--font-mono)' }}>%{timing.midgame_pct}</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill progress-fill--amber" style={{ width: `${timing.midgame_pct}%` }} /></div>
                    <div className="progress-detail">{timing.midgame_blunders} blunder</div>
                  </div>
                  <div className="progress-section">
                    <div className="progress-header">
                      <span style={{ color: 'var(--text-secondary)' }}>Son Oyun (31+)</span>
                      <span style={{ color: 'var(--negative)', fontFamily: 'var(--font-mono)' }}>%{timing.late_pct}</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill progress-fill--red" style={{ width: `${timing.late_pct}%` }} /></div>
                    <div className="progress-detail">{timing.late_blunders} blunder</div>
                  </div>
                </div>
              </div>
            )}

            {/* Two-col: Radar + Strategy */}
            {(activeTab === 'all' || activeTab === 'profile' || activeTab === 'strategy') && (
              <div className="two-col">
                {/* LEFT: Radar & Indicators */}
                {(activeTab === 'all' || activeTab === 'profile') && (
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                      <div className="section-title" style={{ marginBottom: 0 }}>{data.target_username} vs {gm?.name}</div>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowGMOverlay(!showGMOverlay)}>
                        {showGMOverlay ? 'Solo' : 'GM Karşılaştır'}
                      </button>
                    </div>

                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={getRadarData(data.profile.scores, gm?.gm_scores)}>
                          <PolarGrid stroke="rgba(168,162,158,0.12)" />
                          <PolarAngleAxis dataKey="subject" stroke="#78716c" tick={{ fill: '#a8a29e', fontSize: 10, fontWeight: 500 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(168,162,158,0.08)" />
                          <Radar name={data.target_username} dataKey="Oyuncu" stroke="#d97706" fill="#d97706" fillOpacity={0.25} />
                          {showGMOverlay && <Radar name={gm?.name} dataKey="GM" stroke="#78716c" fill="#78716c" fillOpacity={0.12} />}
                          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="section-subtitle" style={{ marginTop: 'var(--space-5)' }}>Psikolojik Göstergeler</div>
                    <div className="indicator-grid">
                      <div className="indicator">
                        <div className="indicator-header">
                          <span className="indicator-name">Açgözlülük</span>
                          <span className={`indicator-value ${data.profile.scores.GreedIndex > 50 ? 'color-negative' : 'color-positive'}`}>
                            %{data.profile.scores.GreedIndex}
                          </span>
                        </div>
                        <div className="indicator-desc">Zehirli piyon tuzaklarına düşme meyli</div>
                      </div>
                      <div className="indicator">
                        <div className="indicator-header">
                          <span className="indicator-name">Moral Çöküşü</span>
                          <span className={`indicator-value ${data.profile.scores.CascadeBlunderRisk > 30 ? 'color-negative' : 'color-positive'}`}>
                            %{data.profile.scores.CascadeBlunderRisk}
                          </span>
                        </div>
                        <div className="indicator-desc">İlk hatadan sonra peşpeşe blunder riski</div>
                      </div>
                      <div className="indicator">
                        <div className="indicator-header">
                          <span className="indicator-name">Post-Loss Tilt</span>
                          <span className={`indicator-value ${data.profile.scores.TiltIndex > 30 ? 'color-negative' : 'color-positive'}`}>
                            %{data.profile.scores.TiltIndex}
                          </span>
                        </div>
                        <div className="indicator-desc">Mağlubiyet sonrası aşırı risk alma</div>
                      </div>
                      <div className="indicator">
                        <div className="indicator-header">
                          <span className="indicator-name">Aşırı Özgüven</span>
                          <span className="indicator-value color-accent">
                            %{data.profile.scores.OverconfidenceIndex}
                          </span>
                        </div>
                        <div className="indicator-desc">Galibiyet sonrası dikkatsiz oyun</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* RIGHT: GM List + Strategy */}
                {(activeTab === 'all' || activeTab === 'strategy' || activeTab === 'profile') && (
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                    {/* GM Similarity */}
                    {data.gm_similarity && (
                      <div>
                        <div className="section-title">Büyükusta Benzerliği</div>
                        <div className="gm-list">
                          {data.gm_similarity.top_matches.map((m) => (
                            <div key={m.id} className="gm-item">
                              <div className="gm-item-header">
                                <span>
                                  <span className="gm-item-name">{m.name}</span>
                                  <span className="gm-item-title">{m.title}</span>
                                </span>
                                <span className={`gm-item-pct ${m.similarity_pct > 75 ? 'color-accent' : ''}`} style={{ color: m.similarity_pct <= 75 ? 'var(--text-tertiary)' : undefined }}>
                                  %{m.similarity_pct}
                                </span>
                              </div>
                              <div className="gm-item-bar">
                                <div className={`gm-item-bar-fill ${m.similarity_pct <= 75 ? 'gm-item-bar-fill--muted' : ''}`} style={{ width: `${m.similarity_pct}%` }} />
                              </div>
                              <div className="gm-item-desc">{m.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exploitation Blueprint */}
                    <div>
                      <div className="section-title">Exploitation Blueprint</div>
                      <div className="strategy-block strategy-block--insight" style={{ marginBottom: 'var(--space-4)' }}>
                        <strong>Scouting Özeti:</strong> {data.counter_strategy.summary_statement}
                      </div>

                      {data.counter_strategy.exploitation_steps?.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                          <div className="section-subtitle">Oyundan Düşürme Planı</div>
                          <div className="strategy-stack">
                            {data.counter_strategy.exploitation_steps.map((s, i) => (
                              <div key={i} className="strategy-block strategy-block--insight">
                                <span dangerouslySetInnerHTML={{ __html: s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="two-col" style={{ gap: 'var(--space-4)' }}>
                        <div>
                          <div className="section-subtitle" style={{ color: 'var(--positive)' }}>Yapılacaklar</div>
                          <div className="strategy-stack">
                            {data.counter_strategy.dos.map((d, i) => (
                              <div key={i} className="strategy-block strategy-block--do">{d}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="section-subtitle" style={{ color: 'var(--negative)' }}>Kaçınılacaklar</div>
                          <div className="strategy-stack">
                            {data.counter_strategy.donts.map((d, i) => (
                              <div key={i} className="strategy-block strategy-block--dont">{d}</div>
                            ))}
                          </div>
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
    </>
  );
}
