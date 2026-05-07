import { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { SESSIONS } from './data.js';

const CommentsContext = createContext({});

function parseCsvLine(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let j = i + 1, val = '';
      while (j < line.length) {
        if (line[j] === '"' && line[j + 1] === '"') { val += '"'; j += 2; }
        else if (line[j] === '"') { j++; break; }
        else { val += line[j++]; }
      }
      fields.push(val);
      i = j;
      if (line[i] === ',') i++;
    } else {
      const j = line.indexOf(',', i);
      fields.push(j === -1 ? line.slice(i) : line.slice(i, j));
      i = j === -1 ? line.length : j + 1;
    }
  }
  return fields;
}

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

function CommentBox({ storageKey, onHasComment, onOpenChange, date, videoTs }) {
  const csvComments = useContext(CommentsContext);
  const lookupKey = date && videoTs ? `${date}|${videoTs}` : null;

  const getSaved = () => {
    try { const l = localStorage.getItem(storageKey); if (l !== null) return l; } catch {}
    return (lookupKey && csvComments[lookupKey]) || '';
  };

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [savedText, setSavedText] = useState(getSaved);
  const taRef = useRef(null);

  useEffect(() => {
    try { if (localStorage.getItem(storageKey) !== null) return; } catch {}
    if (lookupKey && csvComments[lookupKey]) setSavedText(csvComments[lookupKey]);
  }, [csvComments]);

  useEffect(() => { onHasComment?.(!!savedText); }, [savedText]);
  useEffect(() => { if (editing && taRef.current) taRef.current.focus(); }, [editing]);

  const handleOpen = (e) => {
    e.stopPropagation();
    setOpen(true);
    onOpenChange?.(true);
    if (!savedText) { setEditing(true); setDraft(""); }
    else setEditing(false);
  };

  const handleSave = () => {
    try { localStorage.setItem(storageKey, draft); } catch {}
    setSavedText(draft);
    setEditing(false);
    if (date && videoTs) {
      const escaped = draft.replace(/"/g, '""');
      fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: `${date},${videoTs},"${escaped}"`,
      }).catch(() => {});
    }
  };

  const handleCancel = () => {
    if (!savedText) { setOpen(false); onOpenChange?.(false); }
    setDraft(savedText);
    setEditing(false);
  };

  const handleClose = () => { setOpen(false); onOpenChange?.(false); };

  const handleDblClick = () => {
    setDraft(savedText);
    setEditing(true);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  if (!open) {
    return (
      <button className="q-link comment-link" onClick={handleOpen}>
        {savedText ? "Comment ✎" : "Comment"}
      </button>
    );
  }

  return (
    <div className="comment-box" onClick={(e) => e.stopPropagation()}>
      {editing ? (
        <>
          <textarea
            ref={taRef}
            className="comment-ta"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            rows={5}
          />
          <div className="comment-actions">
            <button className="comment-btn comment-cancel" onClick={handleCancel}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              Cancel
            </button>
            <button className="comment-btn comment-save" onClick={handleSave}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Save
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="comment-readonly" onDoubleClick={handleDblClick} title="Double-click to edit">
            {savedText}
          </div>
          <div className="comment-actions">
            <span className="comment-hint">Double-click to edit</span>
            <button className="comment-btn comment-cancel" onClick={handleClose}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function QuestionRow({ q, onPlay, query, sessionIso, commentKey }) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [hasComment, setHasComment] = useState(() => {
    try { return !!localStorage.getItem(commentKey); } catch { return false; }
  });

  const openTranscript = () => {
    const [yyyy, mm, dd] = sessionIso.split('-');
    const dirDate = `${yyyy}${mm}${dd}`;
    const baseName = `OpenTrader-Coaching-Webinar-${mm}-${dd}-${yyyy}`;
    window.open(`/coaching-webinar/${dirDate}/${baseName}.srt`, '_blank');
  };

  return (
    <div className="q-row">
      <button className="ts" onClick={() => onPlay(q)} title="Jump to moment">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" className="ts-play">
          <path d="M8 5v14l11-7z" />
        </svg>
        <span>{q.t}</span>
      </button>
      <div className="q-body">
        <div className="q-text"><Highlight text={q.q} query={query} /></div>
        <div className={`q-meta ${(hasComment || commentOpen) ? "q-meta-pinned" : ""}`}>
          <span className="asker">{q.asker}</span>
          <span className="q-sep">·</span>
          <button className="q-link" onClick={openTranscript}>Open transcript</button>
          <button className="q-link">Copy link</button>
          <CommentBox
            storageKey={commentKey}
            date={sessionIso.replace(/-/g, '')}
            videoTs={q.t}
            onHasComment={setHasComment}
            onOpenChange={setCommentOpen}
          />
        </div>
      </div>
    </div>
  );
}

function SessionBlock({ session, query, onPlay }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <section className="session" id={`session-${session.iso}`}>
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
            <QuestionRow key={i} q={q} query={query} onPlay={onPlay} sessionIso={session.iso} commentKey={`comment-${session.iso}-${i}`} />
          ))}
        </div>
      )}
    </section>
  );
}


function RecentHistory({ onPlay }) {
  const [rows, setRows] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/recent')
      .then(r => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  const fmtDate = (raw) => `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;

  return (
    <section className="session">
      <header className="session-head">
        <button className="session-toggle" onClick={() => setExpanded(!expanded)}>
          <svg className={`caret ${expanded ? "open" : ""}`} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="session-date">Recent History</span>
        </button>
        <span className="session-count" style={{ marginLeft: "auto" }}>
          {rows ? `${rows.length} entries` : "…"}
        </span>
      </header>
      {expanded && (
        <div className="session-body">
          {rows === null ? (
            <div className="sidebar-loading" style={{ padding: "10px 14px" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skel-row" style={{ width: `${55 + (i % 3) * 15}%`, animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="sidebar-empty">No recent activity</div>
          ) : (
            rows.map((row, i) => (
              <div
                key={i}
                className="rv-inline-row"
                onClick={() => onPlay({ t: row[2], q: row[3], isoDate: fmtDate(row[1]) })}
              >
                <button className="ts" tabIndex={-1}>
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" className="ts-play"><path d="M8 5v14l11-7z" /></svg>
                  <span>{row[2]}</span>
                </button>
                <div className="rv-inline-body">
                  <button
                    className="rv-inline-date"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById(`session-${fmtDate(row[1])}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >{fmtDate(row[1])}</button>
                  <span className="rv-inline-q">{row[3]}</span>
                  <div className="q-meta rv-meta" onClick={(e) => e.stopPropagation()}>
                    <CommentBox storageKey={`comment-rv-${row[1]}-${row[2]}`} date={row[1]} videoTs={row[2]} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
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
  const [csvComments, setCsvComments] = useState({});

  useEffect(() => {
    fetch('/comments.csv')
      .then(r => r.ok ? r.text() : '')
      .then(text => {
        const map = {};
        text.split('\n').forEach(line => {
          line = line.trim();
          if (!line) return;
          const fields = parseCsvLine(line);
          if (fields.length >= 3) map[`${fields[0]}|${fields[1]}`] = fields[2];
        });
        setCsvComments(map);
      })
      .catch(() => {});
  }, []);
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

  const openVideo = (q, session) => {
    const [yyyy, mm, dd] = session.iso.split('-');
    const dirDate = `${yyyy}${mm}${dd}`;
    const baseName = `OpenTrader-Coaching-Webinar-${mm}-${dd}-${yyyy}`;
    const origin = window.location.origin;
    const videoUrl = `${origin}/coaching-webinar/${dirDate}/${baseName}.mp4`;
    const srtUrl   = `${origin}/coaching-webinar/${dirDate}/${baseName}.srt`;
    const [m, s] = q.t.split(':').map(Number);
    const startTime = m * 60 + s;

    fetch('/logger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'webinar-date': dirDate, timestamp: q.t, question: q.q }),
    }).catch(() => {});

    const win = window.open('', '_blank', 'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no');
    if (!win) { alert('Popup blocked — please allow popups for this page.'); return; }

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="icon" type="image/png" href="/favicon.png" />
<title>OpenTrader Coach — ${mm}/${dd}/${yyyy} @ ${q.t}</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:#090b11;color:#e2d9c8;font-family:'JetBrains Mono',monospace}
  body{display:flex;flex-direction:column;align-items:center;justify-content:center}
  #bar{width:100%;background:#0f1420;border-bottom:1px solid #1d2638;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-shrink:0}
  #bar-title{font-size:0.7rem;color:#5a6880;letter-spacing:0.06em}
  #bar-date{font-size:0.75rem;color:#c8942a;font-weight:500}
  #bar-ts{font-size:0.7rem;color:#5a6880}
  #wrap{width:100%;flex:1;display:flex;align-items:center;justify-content:center;background:#000;min-height:0}
  video{width:100%;height:100%;max-height:calc(100vh - 56px);object-fit:contain;display:block}
  #status{font-size:0.72rem;color:#5a6880;padding:8px 20px;background:#090b11;width:100%;text-align:center;flex-shrink:0;border-top:1px solid #1d2638;min-height:28px}
  ::cue{background:rgba(0,0,0,0.75);color:#fff;font-family:Arial,sans-serif;font-size:1rem}
</style>
</head>
<body>
<div id="bar">
  <span id="bar-title">OPEN TRADER COACH &nbsp;·&nbsp; <span id="bar-date">${mm}/${dd}/${yyyy}</span></span>
  <span id="bar-ts">Starting at ${q.t}</span>
</div>
<div id="wrap"><video id="vid" controls preload="auto"></video></div>
<div id="status">Loading captions…</div>
<script>
(async () => {
  const vid = document.getElementById('vid');
  const status = document.getElementById('status');
  vid.src = ${JSON.stringify(videoUrl)};
  try {
    const res = await fetch(${JSON.stringify(srtUrl)});
    if (!res.ok) throw new Error('SRT not found (' + res.status + ')');
    const srt = await res.text();
    const vtt = 'WEBVTT\\n\\n' + srt
      .replace(/\\r\\n/g,'\\n')
      .replace(/(\\d{2}:\\d{2}:\\d{2}),(\\d{3})/g,'$1.$2')
      .trim();
    const blob = new Blob([vtt],{type:'text/vtt'});
    const track = document.createElement('track');
    track.kind='captions'; track.label='English'; track.srclang='en';
    track.src=URL.createObjectURL(blob); track.default=true;
    vid.appendChild(track);
    status.textContent='Captions loaded…';
  } catch(err) {
    status.textContent='No captions: '+err.message;
  }
  vid.addEventListener('loadedmetadata',()=>{
    vid.currentTime=${startTime};
    vid.playbackRate=1.5;
    for(let i=0;i<vid.textTracks.length;i++) vid.textTracks[i].mode='showing';
    status.textContent='Captions on · 1.5× · ${mm}/${dd}/${yyyy}';
    vid.play().catch(()=>{});
  },{once:true});
})();
<\/script>
</body></html>`);
    win.document.close();
  };

  const handlePlay = (q) => {
    const session = SESSIONS.find((s) => s.questions.includes(q));
    openVideo(q, session);
  };

  const handleRecentPlay = ({ t, q, isoDate }) => {
    openVideo({ t, q }, { iso: isoDate });
  };

  return (
    <CommentsContext.Provider value={csvComments}>
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
        <RecentHistory onPlay={handleRecentPlay} />
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-big">No questions match</div>
            <div className="empty-sub">Try a different keyword or clear filters.</div>
            <button className="btn-ghost" onClick={() => { setQuery(""); setFilter("all"); }}>Reset</button>
          </div>
        ) : (
          filtered.map((s) => (
            <SessionBlock key={s.iso} session={s} query={query} onPlay={handlePlay} />
          ))
        )}
      </main>
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
    </CommentsContext.Provider>
  );
}
