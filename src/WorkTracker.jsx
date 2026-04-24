import { useState, useEffect, useCallback } from "react";
import {
  Clock, Calendar, TrendingUp, Bell, BellOff, ChevronLeft, ChevronRight,
  Plus, Trash2, Settings, X, Check, Briefcase, Sun, Moon
} from "lucide-react";

const C = {
  bg: "var(--bg)", surface: "var(--surface)", surfaceHover: "var(--surfaceHover)",
  border: "var(--border)", borderFocus: "var(--borderFocus)",
  accent: "var(--accent)", accentDim: "var(--accentDim)", accentText: "var(--accentText)",
  text: "var(--text)", muted: "var(--muted)", mutedHover: "var(--mutedHover)",
  green: "var(--green)", greenBg: "var(--greenBg)",
  red: "var(--red)", teal: "var(--teal)", tealBg: "var(--tealBg)",
  calendarInvert: "var(--calendarInvert)",
  accentDimBorder: "var(--accentDimBorder)",
  todayBorder: "var(--todayBorder)",
  hasLogsBorder: "var(--hasLogsBorder)",
};

const THEMES = {
  dark: {
    "--bg": "#0D0C0A", "--surface": "#1C1B18", "--surfaceHover": "#242320",
    "--border": "#2E2C28", "--borderFocus": "#E8A000",
    "--accent": "#E8A000", "--accentDim": "rgba(232,160,0,0.12)", "--accentText": "#0D0C0A",
    "--text": "#F2EDE4", "--muted": "#7A756C", "--mutedHover": "#9A9488",
    "--green": "#4AA87C", "--greenBg": "rgba(74,168,124,0.1)",
    "--red": "#C94848", "--teal": "#3AABB8", "--tealBg": "rgba(58,171,184,0.1)",
    "--calendarInvert": "invert(0.5)",
    "--accentDimBorder": "rgba(232,160,0,0.3)",
    "--todayBorder": "rgba(232,160,0,0.35)",
    "--hasLogsBorder": "rgba(74,168,124,0.2)",
  },
  light: {
    "--bg": "#F8F7F4", "--surface": "#FFFFFF", "--surfaceHover": "#F0EFEA",
    "--border": "#E2DED6", "--borderFocus": "#E8A000",
    "--accent": "#E8A000", "--accentDim": "rgba(232,160,0,0.15)", "--accentText": "#0D0C0A",
    "--text": "#2E2C28", "--muted": "#8A857C", "--mutedHover": "#6A655C",
    "--green": "#3A8B64", "--greenBg": "rgba(58,139,100,0.1)",
    "--red": "#C94848", "--teal": "#2B8C96", "--tealBg": "rgba(43,140,150,0.1)",
    "--calendarInvert": "invert(0)",
    "--accentDimBorder": "rgba(232,160,0,0.3)",
    "--todayBorder": "rgba(232,160,0,0.35)",
    "--hasLogsBorder": "rgba(58,139,100,0.2)",
  }
};

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const dateKey = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const parseHours = (sessions = []) =>
  sessions.reduce((t, s) => {
    const [sh, sm] = s.start.split(":").map(Number);
    const [eh, em] = s.end.split(":").map(Number);
    return t + Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
  }, 0);

const Btn = ({ children, onClick, variant = "ghost", style = {}, ...props }) => {
  const base = {
    fontFamily: "inherit", cursor: "pointer", border: "none",
    borderRadius: 8, fontSize: 13, transition: "all 0.15s", ...style,
  };
  const variants = {
    ghost: { background: "transparent", color: C.muted, padding: "6px 8px" },
    outline: { background: "transparent", color: C.text, padding: "10px 20px", border: `1px solid ${C.border}` },
    primary: { background: C.accent, color: C.accentText, padding: "10px 24px", fontWeight: 500 },
    danger: { background: "transparent", color: C.red, padding: "4px 6px" },
  };
  return <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }} {...props}>{children}</button>;
};

export default function WorkTracker() {
  const [view, setView] = useState("hero");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [workLogs, setWorkLogs] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newSession, setNewSession] = useState({ start: "09:00", end: "17:00", note: "" });
  const [settings, setSettings] = useState({ name: "", currency: "€", hourlyRate: "", theme: "dark" });
  const [notifPerm, setNotifPerm] = useState("default");
  const [notifSent, setNotifSent] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveMsg, setSaveMsg] = useState(false);

  const themeMode = settings.theme || "dark";
  useEffect(() => {
    const root = document.documentElement;
    const themeColors = THEMES[themeMode];
    for (const [key, value] of Object.entries(themeColors)) {
      root.style.setProperty(key, value);
    }
  }, [themeMode]);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease; }
      body { background: ${C.bg}; }
      ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
      .wt-input { background: ${C.surface} !important; border: 1px solid ${C.border} !important; color: ${C.text} !important;
        border-radius: 8px !important; padding: 9px 12px !important; font-size: 13px !important;
        font-family: 'JetBrains Mono', monospace !important; width: 100% !important; outline: none !important; }
      .wt-input:focus { border-color: ${C.accent} !important; }
      .wt-input::placeholder { color: ${C.muted} !important; }
      .wt-input[type="time"]::-webkit-calendar-picker-indicator { filter: ${C.calendarInvert}; cursor: pointer; }
      .cal-day:hover { background: ${C.surfaceHover} !important; border-color: ${C.border} !important; }
      .nav-btn:hover { color: ${C.text} !important; }
      .session-row:hover { border-color: ${C.border} !important; }
      .add-btn:hover { border-color: ${C.accent} !important; color: ${C.accent} !important; }
      .app-body { display: flex; max-width: 960px; margin: 0 auto; min-height: calc(100vh - 54px); flex-direction: row; }
      .cal-panel { flex: 1; padding: 1.25rem; border-right: 1px solid ${C.border}; min-width: 0; }
      .session-panel { width: 280px; padding: 1.25rem; display: flex; flex-direction: column; flex-shrink: 0; }
      @media (max-width: 768px) {
        .app-body { flex-direction: column; }
        .cal-panel { border-right: none; border-bottom: 1px solid ${C.border}; padding: 1rem; }
        .session-panel { width: 100%; padding: 1rem; }
      }
    `;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r1 = await window.storage.get("wt-v2-logs");
        if (r1) setWorkLogs(JSON.parse(r1.value));
        const r2 = await window.storage.get("wt-v2-settings");
        if (r2) setSettings(s => ({ ...s, ...JSON.parse(r2.value) }));
      } catch (_) {}
      setLoaded(true);
      if ("Notification" in window) setNotifPerm(Notification.permission);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.storage.set("wt-v2-logs", JSON.stringify(workLogs)).catch(() => {});
  }, [workLogs, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.storage.set("wt-v2-settings", JSON.stringify(settings)).catch(() => {});
  }, [settings, loaded]);

  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const monthStats = useCallback(() => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    let totalHours = 0, workedDays = 0, totalSessions = 0;
    for (let d = 1; d <= getDaysInMonth(currentMonth); d++) {
      const logs = workLogs[dateKey(y, m, d)] || [];
      if (logs.length > 0) { workedDays++; totalSessions += logs.length; totalHours += parseHours(logs); }
    }
    const rate = parseFloat(settings.hourlyRate);
    const earnings = !isNaN(rate) && rate > 0 ? totalHours * rate : null;
    return { totalHours, workedDays, totalSessions, earnings };
  }, [workLogs, currentMonth, settings.hourlyRate]);

  const addSession = () => {
    if (!selectedDate) return;
    const [sh, sm] = newSession.start.split(":").map(Number);
    const [eh, em] = newSession.end.split(":").map(Number);
    if (eh * 60 + em <= sh * 60 + sm) return;
    setWorkLogs(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), { ...newSession, id: Date.now() }],
    }));
    setShowForm(false);
    setNewSession({ start: "09:00", end: "17:00", note: "" });
  };

  const removeSession = (dk, id) => {
    setWorkLogs(prev => ({ ...prev, [dk]: (prev[dk] || []).filter(s => s.id !== id) }));
  };

  const requestNotif = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted" && !notifSent) {
      new Notification("WorkTracker Active ✓", {
        body: "You're all set! Open WorkTracker daily to log your hours.",
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⏱</text></svg>"
      });
      setNotifSent(true);
    }
  };

  const stats = monthStats();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDay(currentMonth);
  const selectedLogs = selectedDate ? (workLogs[selectedDate] || []) : [];
  const selectedHours = parseHours(selectedLogs);

  const font = { fontFamily: "'JetBrains Mono', monospace" };
  const serif = { fontFamily: "'Playfair Display', serif" };

  // ──────────────────────────── HERO ────────────────────────────
  if (view === "hero") return (
    <div style={{ ...font, minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 20% 60%, rgba(232,160,0,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 30%, rgba(201,72,72,0.04) 0%, transparent 55%)", pointerEvents: "none" }} />

      <div style={{ textAlign: "center", maxWidth: 580, position: "relative" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, border: `1px solid ${C.accentDimBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem", background: C.accentDim }}>
          <Briefcase size={26} color={C.accent} />
        </div>

        {settings.name && (
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: C.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>
            {settings.name}'s Workspace
          </p>
        )}
        {!settings.name && (
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: C.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Part-Time Work Tracker
          </p>
        )}

        <h1 style={{ ...serif, fontSize: "clamp(2.4rem,6vw,3.8rem)", fontWeight: 600, lineHeight: 1.12, marginBottom: "1.5rem" }}>
          Your hours,<br /><span style={{ color: C.accent }}>accounted for.</span>
        </h1>

        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, maxWidth: 420, margin: "0 auto 2.5rem" }}>
          Log shifts day by day. Track total hours and working days per month. Know exactly what you've earned.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="primary" onClick={() => setView("app")} style={{ borderRadius: 10, fontSize: 14 }}>
            Open Calendar →
          </Btn>
          <Btn variant="outline" onClick={() => { setView("app"); setSelectedDate(todayKey); }} style={{ borderRadius: 10, fontSize: 14 }}>
            Log Today
          </Btn>
        </div>

        {stats.workedDays > 0 && (
          <div style={{ marginTop: "3rem", display: "flex", gap: "2.5rem", justifyContent: "center" }}>
            {[
              { label: `days in ${MONTH_NAMES[month]}`, value: stats.workedDays },
              { label: "hours logged", value: stats.totalHours.toFixed(1) },
              ...(stats.earnings !== null ? [{ label: "estimated pay", value: `${settings.currency}${stats.earnings.toFixed(2)}` }] : []),
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ ...serif, fontSize: "2.2rem", color: C.accent }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {stats.workedDays === 0 && (
          <p style={{ marginTop: "2.5rem", fontSize: 12, color: C.muted }}>No sessions logged yet — open the calendar to start.</p>
        )}
      </div>
    </div>
  );

  // ──────────────────────────── MAIN APP ────────────────────────────
  return (
    <div style={{ ...font, minHeight: "100vh", background: C.bg, color: C.text }}>
      {showSettings && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 380, ...font }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <span style={{ ...serif, fontSize: 18 }}>Settings</span>
              <Btn variant="ghost" onClick={() => setShowSettings(false)}><X size={16} /></Btn>
            </div>

            {[
              { label: "Your name", key: "name", placeholder: "e.g. Alex" },
              { label: "Hourly rate", key: "hourlyRate", placeholder: "e.g. 12.50" },
              { label: "Currency symbol", key: "currency", placeholder: "€" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5 }}>{f.label}</label>
                <input className="wt-input" value={settings[f.key]} placeholder={f.placeholder}
                  onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))} />
              </div>
            ))}

            <div style={{ marginTop: "1.5rem", padding: "1rem", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 13, color: C.text }}>Daily reminder</p>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {notifPerm === "granted" ? "Notifications enabled" : "Browser notifications"}
                  </p>
                </div>
                <Btn variant="ghost" onClick={requestNotif}
                  style={{ color: notifPerm === "granted" ? C.accent : C.muted }}>
                  {notifPerm === "granted" ? <Bell size={18} /> : <BellOff size={18} />}
                </Btn>
              </div>
            </div>

            <Btn variant="primary" onClick={() => { setShowSettings(false); setSaveMsg(true); setTimeout(() => setSaveMsg(false), 2000); }}
              style={{ width: "100%", marginTop: "1.25rem", borderRadius: 10, fontSize: 14 }}>
              {saveMsg ? "Saved ✓" : "Save Settings"}
            </Btn>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ height: 54, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.25rem", position: "sticky", top: 0, background: C.bg, zIndex: 50 }}>
        <button onClick={() => setView("hero")} className="nav-btn"
          style={{ ...font, background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
          <Clock size={15} /> WorkTracker
        </button>
        <div style={{ ...serif, fontSize: 15, color: C.text }}>{MONTH_NAMES[month]} {year}</div>
        <div style={{ display: "flex", gap: 4 }}>
          <Btn variant="ghost" onClick={() => setSettings(s => ({ ...s, theme: (s.theme === "light" ? "dark" : "light") }))}>
            {settings.theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </Btn>
          <Btn variant="ghost" onClick={requestNotif} style={{ color: notifPerm === "granted" ? C.accent : C.muted }}>
            {notifPerm === "granted" ? <Bell size={15} /> : <BellOff size={15} />}
          </Btn>
          <Btn variant="ghost" onClick={() => setShowSettings(true)}><Settings size={15} /></Btn>
        </div>
      </nav>

      {/* BODY */}
      <div className="app-body">

        {/* ── LEFT: CALENDAR ── */}
        <div className="cal-panel">

          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <Btn variant="ghost" onClick={() => setCurrentMonth(new Date(year, month - 1))} className="nav-btn">
              <ChevronLeft size={18} />
            </Btn>
            <span style={{ ...serif, fontSize: 17 }}>{MONTH_NAMES[month]} {year}</span>
            <Btn variant="ghost" onClick={() => setCurrentMonth(new Date(year, month + 1))} className="nav-btn">
              <ChevronRight size={18} />
            </Btn>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 6 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.muted, padding: "3px 0", letterSpacing: "0.1em" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const dk = dateKey(year, month, d);
              const logs = workLogs[dk] || [];
              const hours = parseHours(logs);
              const isToday = dk === todayKey;
              const isSelected = dk === selectedDate;
              const hasLogs = logs.length > 0;
              const isFuture = new Date(year, month, d) > today;

              return (
                <button key={d} className="cal-day"
                  onClick={() => { setSelectedDate(dk); setShowForm(false); }}
                  style={{
                    padding: "6px 2px", minHeight: 50,
                    background: isSelected ? C.accent : isToday ? C.accentDim : hasLogs ? C.greenBg : "transparent",
                    border: `1px solid ${isSelected ? C.accent : isToday ? C.todayBorder : hasLogs ? C.hasLogsBorder : "transparent"}`,
                    borderRadius: 8, color: isSelected ? C.accentText : isFuture ? C.muted : C.text,
                    cursor: "pointer", textAlign: "center", transition: "all 0.12s",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                  }}>
                  <span style={{ fontSize: 13 }}>{d}</span>
                  {hasLogs && (
                    <span style={{ fontSize: 9, color: isSelected ? C.accentText : C.accent, fontWeight: 500 }}>
                      {hours.toFixed(1)}h
                    </span>
                  )}
                  {hasLogs && (
                    <div style={{ width: 3, height: 3, borderRadius: "50%", background: isSelected ? C.accentText : C.green }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Stats cards */}
          <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {[
              { icon: <Calendar size={14} />, label: "Days worked", value: stats.workedDays, color: C.green },
              { icon: <Clock size={14} />, label: "Hours total", value: stats.totalHours.toFixed(1) + "h", color: C.accent },
              ...(stats.earnings !== null ? [
                { icon: <TrendingUp size={14} />, label: "Estimated pay", value: `${settings.currency}${stats.earnings.toFixed(2)}`, color: C.teal }
              ] : []),
            ].map(s => (
              <div key={s.label} style={{ background: C.surface, borderRadius: 12, padding: "0.875rem 1rem", border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.muted, fontSize: 11, marginBottom: 6 }}>
                  {s.icon} {s.label}
                </div>
                <div style={{ ...serif, fontSize: 22, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Avg per day worked */}
          {stats.workedDays > 0 && (
            <div style={{ marginTop: 10, background: C.surface, borderRadius: 12, padding: "0.875rem 1rem", border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.muted }}>Avg hours per shift</span>
              <span style={{ ...serif, fontSize: 18, color: C.teal }}>
                {(stats.totalHours / stats.workedDays).toFixed(1)}h
              </span>
            </div>
          )}
        </div>

        {/* ── RIGHT: SESSION PANEL ── */}
        <div className="session-panel">
          {!selectedDate ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "2rem 0" }}>
              <Calendar size={28} color={C.border} />
              <p style={{ fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 1.7 }}>
                Tap a day to view or log work sessions
              </p>
            </div>
          ) : (
            <>
              {/* Date header */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 10, color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>
                      {selectedDate === todayKey ? "Today" : "Selected Day"}
                    </p>
                    <p style={{ ...serif, fontSize: 16, fontWeight: 600 }}>
                      {new Date(selectedDate + "T12:00:00").toLocaleDateString("default", { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Btn variant="ghost" onClick={() => setSelectedDate(null)} className="nav-btn">
                    <X size={14} />
                  </Btn>
                </div>
                {selectedLogs.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 11, color: C.accent }}>{selectedHours.toFixed(2)}h logged</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{selectedLogs.length} session{selectedLogs.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>

              {/* Sessions list */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {selectedLogs.length === 0 && !showForm && (
                  <p style={{ fontSize: 12, color: C.muted, textAlign: "center", paddingTop: "1.5rem" }}>
                    No sessions for this day yet.
                  </p>
                )}

                {selectedLogs.map(s => {
                  const [sh, sm] = s.start.split(":").map(Number);
                  const [eh, em] = s.end.split(":").map(Number);
                  const h = ((eh * 60 + em - sh * 60 - sm) / 60).toFixed(2);
                  return (
                    <div key={s.id} className="session-row" style={{
                      background: C.surface, borderRadius: 10, padding: "0.75rem 0.875rem",
                      marginBottom: 8, border: `1px solid transparent`,
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "border-color 0.12s",
                    }}>
                      <div>
                        <div style={{ fontSize: 14, color: C.text }}>
                          {s.start} <span style={{ color: C.muted }}>→</span> {s.end}
                        </div>
                        {s.note && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.note}</div>}
                        <div style={{ fontSize: 11, color: C.accent, marginTop: 3 }}>{h}h</div>
                      </div>
                      <Btn variant="danger" onClick={() => removeSession(selectedDate, s.id)}>
                        <Trash2 size={13} />
                      </Btn>
                    </div>
                  );
                })}

                {/* Add session form */}
                {showForm && (
                  <div style={{ background: C.surface, borderRadius: 10, padding: "1rem", border: `1px solid ${C.accent}`, marginBottom: 8 }}>
                    <p style={{ fontSize: 11, color: C.muted, marginBottom: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>New Session</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      {["start", "end"].map(k => (
                        <div key={k}>
                          <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{k}</label>
                          <input className="wt-input" type="time" value={newSession[k]}
                            onChange={e => setNewSession(p => ({ ...p, [k]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                    <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>Note</label>
                    <input className="wt-input" type="text" placeholder="e.g. Evening shift" value={newSession.note}
                      onChange={e => setNewSession(p => ({ ...p, note: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && addSession()}
                      style={{ marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={addSession} style={{
                        ...font, flex: 1, background: C.accent, color: C.accentText, border: "none",
                        borderRadius: 8, padding: "9px", fontSize: 13, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      }}>
                        <Check size={13} /> Save
                      </button>
                      <button onClick={() => setShowForm(false)} style={{
                        ...font, flex: 1, background: "transparent", color: C.muted,
                        border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px",
                        fontSize: 13, cursor: "pointer",
                      }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!showForm && (
                <button className="add-btn" onClick={() => setShowForm(true)} style={{
                  ...font, marginTop: "0.75rem", width: "100%", padding: "10px",
                  background: "transparent", border: `1px dashed ${C.border}`,
                  borderRadius: 10, color: C.muted, cursor: "pointer", fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "all 0.15s",
                }}>
                  <Plus size={14} /> Add Session
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
