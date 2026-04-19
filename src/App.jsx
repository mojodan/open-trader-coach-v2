import { useState, useEffect, useMemo, useRef } from 'react';
import { SESSIONS } from './data.js';

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dusk";
  return (
    <button
      className={`theme-toggle ${isDark ? "dark" : "light"}`}
      onClick={onToggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="toggle-track">
        <span className="toggle-thumb">
          {isDark ? (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </span>
      </span>
    </button>
  );
}

function Header({ sessions, questions, theme, onThemeToggle }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-dot" />
        <span className="brand-name">OpenTrader</span>
        <span className="brand-sub">Coach</span>
      </div>
      <div className="stats">
        <div className="stat">
          <div className="stat-num">{sessions}</div>
          <div className="stat-label">Sessions</div>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <div className="stat-num">{questions.toLocaleString()}</div>
          <div className="stat-label">Questions</div>
        </div>
        <div className="stat-divider" />
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>
    </header>
  );
}

function SearchBar({ value, onChange, resultCount, query }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && document.activeElement !== ref.current) {
        e.preventDefault();
        ref.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === ref.current) {
        ref.current.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <div className="search-wrap">
      <div className="search">
        <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search sessions, topics, traders..."
          spellCheck={false}
        />
        <kbd className="kbd">/</kbd>
      </div>
      {query && (
        <div className="search-meta">
          {resultCount} {resultCount === 1 ? "match" : "matches"} for "{query}"
        </div>
      )}
    </div>
  );
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "chart", label: "Chart Review" },
  { id: "trade", label: "Trade Review" },
  { id: "mindset", label: "Mindset" },
  { id: "setup", label: "Setups" },
];

function FilterRow({ active, onChange }) {
  return (
    <div className="filters">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          className={`chip ${active === f.id ? "chip-on" : ""}`}
          onClick={() => onChange(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? (
          <mark key={i}>{p}</mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function QuestionRow({ q, onPlay, playing, query }) {
  return (
    <div className={`q-row ${playing ? "q-playing" : ""}`}>
      <button className="ts" onClick={() => onPlay(q)} title="Jump to moment">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" className="ts-play">
          <path d="M8 5v14l11-7z" />
        </svg>
        <span>{q.t}</span>
      </button>
      <div className="q-body">
        <div className="q-text"><Highlight text={q.q} query={query} /></div>
        <div className="q-meta">
          <span className="asker">{q.asker}</span>
          <span className="q-sep">·</span>
          <button className="q-link">Open transcript</button>
          <button className="q-link">Copy link</button>
        </div>
      </div>
    </div>
  );
}

function SessionBlock({ session, query, onPlay, playingId }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <section className="session">
      <header className="session-head">
        <button className="session-toggle" onClick={() => setExpanded(!expanded)}>
          <svg className={`caret ${expanded ? "open" : ""}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="session-date">{session.date}</span>
        </button>
        <span className="session-title">{session.title}</span>
        <span className="session-dot" />
        <span className="session-duration">{session.duration}</span>
        <span className="session-count">
          {session.questions.length} {session.questions.length === 1 ? "question" : "questions"}
        </span>
      </header>
      {expanded && (
        <div className="session-body">
          {session.questions.map((q, i) => (
            <QuestionRow
              key={i}
              q={q}
              query={query}
              onPlay={onPlay}
              playing={playingId === `${session.iso}-${i}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PlayerStrip({ playing, onClose }) {
  const [pos, setPos] = useState(0);
  useEffect(() => {
    if (!playing) return;
    setPos(0);
    const id = setInterval(() => setPos((p) => (p + 0.4) % 100), 80);
    return () => clearInterval(id);
  }, [playing]);
  if (!playing) return null;
  return (
    <div className="player">
      <div className="player-inner">
        <button className="player-btn" aria-label="Pause">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
        </button>
        <div className="player-meta">
          <div className="player-title">{playing.session} · {playing.t}</div>
          <div className="player-q">{playing.q}</div>
        </div>
        <div className="player-progress"><div className="player-fill" style={{ width: `${pos}%` }} /></div>
        <button className="player-close" onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>
  );
}

function TweaksPanel({ tweaks, setTweaks, onClose }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks">
      <div className="tweaks-head">
        <span>Tweaks</span>
        <button onClick={onClose}>×</button>
      </div>
      <div className="tweaks-body">
        <div className="tweak-group">
          <div className="tweak-label">Theme</div>
          <div className="tweak-row">
            {["paper", "cream", "sage", "dusk"].map((t) => (
              <button
                key={t}
                className={`swatch swatch-${t} ${tweaks.theme === t ? "on" : ""}`}
                onClick={() => set("theme", t)}
                title={t}
              >
                <span className="swatch-name">{t}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="tweak-group">
          <div className="tweak-label">Body font</div>
          <div className="tweak-row">
            {[
              { id: "geist", label: "Geist" },
              { id: "ibm", label: "IBM Plex" },
              { id: "source", label: "Source Serif" },
            ].map((f) => (
              <button
                key={f.id}
                className={`pill ${tweaks.font === f.id ? "on" : ""}`}
                onClick={() => set("font", f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="tweak-group">
          <div className="tweak-label">Density</div>
          <div className="tweak-row">
            {["cozy", "comfortable", "airy"].map((d) => (
              <button
                key={d}
                className={`pill ${tweaks.density === d ? "on" : ""}`}
                onClick={() => set("density", d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="tweak-group">
          <div className="tweak-label">Timestamp style</div>
          <div className="tweak-row">
            {["pill", "mono", "ghost"].map((s) => (
              <button
                key={s}
                className={`pill ${tweaks.tsStyle === s ? "on" : ""}`}
                onClick={() => set("tsStyle", s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="tweak-group">
          <div className="tweak-label">Accent hue</div>
          <input
            type="range" min="10" max="360" step="1"
            value={tweaks.hue}
            onChange={(e) => set("hue", +e.target.value)}
          />
          <div className="tweak-hue">
            <div className="hue-swatch" style={{ background: `oklch(0.62 0.12 ${tweaks.hue})` }} />
            <span>hue {tweaks.hue}°</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const TWEAK_DEFAULTS = {
  theme: "paper",
  font: "geist",
  density: "comfortable",
  tsStyle: "pill",
  hue: 35,
};

export default function App() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [playing, setPlaying] = useState(null);
  const [showTweaks, setShowTweaks] = useState(false);
  const [tweaks, setTweaks] = useState(() => {
    try {
      const saved = localStorage.getItem("ot-tweaks");
      if (saved) return { ...TWEAK_DEFAULTS, ...JSON.parse(saved) };
    } catch {}
    return TWEAK_DEFAULTS;
  });

  useEffect(() => {
    localStorage.setItem("ot-tweaks", JSON.stringify(tweaks));
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.font = tweaks.font;
    document.documentElement.dataset.density = tweaks.density;
    document.documentElement.dataset.ts = tweaks.tsStyle;
    document.documentElement.style.setProperty("--hue", tweaks.hue);
  }, [tweaks]);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "__activate_edit_mode") setShowTweaks(true);
      if (e.data?.type === "__deactivate_edit_mode") setShowTweaks(false);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesFilter = (session, question) => {
      if (filter === "all") return true;
      const txt = (session.title + " " + question.q).toLowerCase();
      if (filter === "chart") return txt.includes("chart review");
      if (filter === "trade") return txt.includes("trade review") || txt.includes("trade setup");
      if (filter === "mindset") return /focus|frustrat|mindset|bored|fomo|streak|journal/i.test(txt);
      if (filter === "setup") return /setup|zone fade|support|resistance|pre-market/i.test(txt);
      return true;
    };
    return SESSIONS
      .map((s) => ({
        ...s,
        questions: s.questions.filter(
          (ques) =>
            matchesFilter(s, ques) &&
            (!q ||
              ques.q.toLowerCase().includes(q) ||
              ques.asker.toLowerCase().includes(q) ||
              s.title.toLowerCase().includes(q) ||
              s.date.toLowerCase().includes(q))
        ),
      }))
      .filter((s) => s.questions.length > 0);
  }, [query, filter]);

  const totalMatches = filtered.reduce((a, s) => a + s.questions.length, 0);

  const handlePlay = (q) => {
    const session = SESSIONS.find((s) => s.questions.includes(q));
    setPlaying({ ...q, session: session.title, sessionIso: session.iso });
  };

  const getPlayingId = (session) => {
    if (!playing) return null;
    const idx = session.questions.findIndex(
      (q) => q === playing || (q.t === playing.t && q.q === playing.q)
    );
    return idx >= 0 ? `${session.iso}-${idx}` : null;
  };

  return (
    <div className="shell">
      <Header
        sessions={SESSIONS.length}
        questions={SESSIONS.reduce((n, s) => n + s.questions.length, 0)}
        theme={tweaks.theme}
        onThemeToggle={() => setTweaks(t => ({ ...t, theme: t.theme === "dusk" ? "paper" : "dusk" }))}
      />
      <div className="sticky-bar">
        <SearchBar
          value={query}
          onChange={setQuery}
          resultCount={totalMatches}
          query={query}
        />
        <FilterRow active={filter} onChange={setFilter} />
      </div>
      <main className="list">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-big">No questions match</div>
            <div className="empty-sub">Try a different keyword or clear filters.</div>
            <button className="btn-ghost" onClick={() => { setQuery(""); setFilter("all"); }}>Reset</button>
          </div>
        ) : (
          filtered.map((s) => (
            <SessionBlock
              key={s.iso}
              session={s}
              query={query}
              onPlay={handlePlay}
              playingId={getPlayingId(s)}
            />
          ))
        )}
      </main>
      <PlayerStrip playing={playing} onClose={() => setPlaying(null)} />
      {showTweaks && (
        <TweaksPanel
          tweaks={tweaks}
          setTweaks={setTweaks}
          onClose={() => setShowTweaks(false)}
        />
      )}
      <button
        onClick={() => setShowTweaks(v => !v)}
        style={{
          position: 'fixed', bottom: 20, right: showTweaks ? 316 : 20,
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
          fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'inherit',
          boxShadow: 'var(--shadow)', transition: 'right 0.2s',
          zIndex: 99,
        }}
      >
        {showTweaks ? '✕ Close' : '⚙ Tweaks'}
      </button>
    </div>
  );
}
