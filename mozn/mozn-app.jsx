// mozn-app.jsx — MOZN root: login, nav, theme application, share, tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": 2,
  "buttonAnim": "ripple",
  "buttonShape": "circle",
  "particles": 1
}/*EDITMODE-END*/;

const NAV = [
  { id: "counter", ico: "🏠", lbl: "العدّاد" },
  { id: "sabha", ico: "📿", lbl: "السبحة" },
  { id: "board", ico: "🏆", lbl: "المتصدّرون" },
  { id: "stats", ico: "📊", lbl: "الإحصائيات" },
  { id: "settings", ico: "⚙️", lbl: "الإعدادات" },
];

function applyTheme(el, t, mode) {
  if (!el || !t) return;
  const day = mode === "day";
  const v = { "--green": t.green, "--green2": t.g2, "--green3": t.g3 };
  if (day) {
    Object.assign(v, {
      "--bg": "#fbf7ec", "--bg2": "#fffdf6", "--card": "#ffffff", "--card2": "#f6efdc",
      "--txt": "#173029", "--txt2": "#5d7a6c", "--muted": "#9aa89e",
      "--gold": "#9a7414", "--gold2": "#a87d18", "--gold3": "#c79c2c",
      "--bdr": "rgba(138,106,46,0.22)",
    });
  } else {
    Object.assign(v, {
      "--bg": t.bg, "--bg2": t.bg2, "--card": t.card, "--card2": t.card2,
      "--txt": "#e8f5ee", "--txt2": "#90b898", "--muted": "#4a7058",
      "--gold": "#c8980a", "--gold2": "#e8b820", "--gold3": "#ffd060",
      "--bdr": "rgba(200,152,10,0.18)",
    });
  }
  Object.keys(v).forEach(function (k) { el.style.setProperty(k, v[k]); });
  el.classList.toggle("light", day);
}

// ---- Login ---------------------------------------------------------------
function Login({ onEnter }) {
  const [name, setName] = useState("");
  const h = MOZN_HADITHS[3];
  function go() { if (name.trim()) onEnter(name.trim()); }
  return (
    <div className="login-overlay">
      <div className="login-card" style={{ animation: "fadeUp .7s ease" }}>
        <img className="login-logo-img" src="mozn/icon.png" alt="مزن" />
        <div className="login-verse">﴿ فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا ﴾</div>
        <div className="login-hadith">
          <div className="hadith-t" style={{ fontSize: 16 }}>{h.t}</div>
          <div className="hadith-s">— {h.s}</div>
        </div>
        <input
          className="login-input" placeholder="اكتب اسمك للانضمام"
          value={name} maxLength={24}
          onChange={function (e) { setName(e.target.value); }}
          onKeyDown={function (e) { if (e.key === "Enter") go(); }}
        />
        <button className="login-btn" onClick={go}>← دخول</button>
        <div className="welcome" style={{ marginTop: 14 }}>اسمك يظهر في لوحة المتصدّرين العالمية</div>
      </div>
    </div>
  );
}

// ---- Share sheet ---------------------------------------------------------
function ShareSheet({ name, onClose }) {
  const [copied, setCopied] = useState(false);
  const link = "https://hyr55cc.github.io/moznn/?ref=" + encodeURIComponent(name);
  function copy() {
    try { navigator.clipboard.writeText(link); } catch (e) {}
    setCopied(true); setTimeout(function () { setCopied(false); }, 1600);
  }
  function share() {
    const text = "انضمّ إليّ في مزن للاستغفار — شارك الأجر 🤲";
    if (navigator.share) { navigator.share({ title: "مزن ✦ للاستغفار", text: text, url: link }).catch(function () {}); }
    else copy();
  }
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={function (e) { e.stopPropagation(); }}>
        <div className="sheet-handle"></div>
        <div className="login-logo" style={{ fontSize: 30, marginBottom: 2 }}>🤲</div>
        <div className="prof-name" style={{ textAlign: "center", marginBottom: 4 }}>شارك الأجر مع من تحب</div>
        <div className="welcome" style={{ textAlign: "center", marginBottom: 16 }}>«الدالّ على الخير كفاعله» — من شاركته الاستغفار فلك مثل أجره</div>
        <div className="share-bar" style={{ margin: "0 0 12px" }}>
          <span className="share-url">{link}</span>
          <button className="copy-btn" onClick={copy}>{copied ? "تم النسخ ✓" : "نسخ"}</button>
        </div>
        <button className="login-btn" onClick={share}>مشاركة الدعوة</button>
      </div>
    </div>
  );
}

// ---- App -----------------------------------------------------------------
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [st, setSt] = useState(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [page, setPage] = useState("counter");
  const [profileId, setProfileId] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const appRef = useRef(null);

  // boot
  useEffect(function () {
    const s = MoznStore.init();
    if (s) { setSt(s); } else { setNeedLogin(true); }
    const unsub = MoznStore.subscribe(function (ns) { setSt(Object.assign({}, ns)); });
    return unsub;
  }, []);

  // current mode (day/night) lives in the store settings
  const mode = st ? (st.settings.mode || "night") : "night";
  // apply theme + mode whenever either changes
  const themeObj = MOZN_THEMES[t.theme] || MOZN_THEMES[2];
  const canvasTheme = mode === "day"
    ? Object.assign({}, themeObj, { s1: "#fdf8ea", s2: "#efe4c9" })
    : themeObj;
  useEffect(function () { applyTheme(appRef.current, themeObj, mode); }, [t.theme, mode]);
  function setMode(m) { MoznStore.setSetting("mode", m); }

  const fx = {
    tap: function () { const s = st && st.settings; MoznFX.tap(s ? s.sound : true, s ? s.haptic : true); },
    milestone: function () { const s = st && st.settings; MoznFX.milestone(s ? s.sound : true, s ? s.haptic : true); },
  };

  function enter(name) {
    MoznFX.unlock();
    const s = MoznStore.register(name);
    setSt(Object.assign({}, s));
    setNeedLogin(false);
  }
  function logout() {
    try { localStorage.removeItem("mozn_state_v3"); } catch (e) {}
    MoznStore.stopLive();
    setSt(null); setNeedLogin(true); setPage("counter");
  }

  return (
    <div className="app" ref={appRef}>
      <ParticleCanvas key={"p" + t.theme + t.particles + mode} theme={canvasTheme} density={t.particles} />

      {needLogin && <Login onEnter={enter} />}

      {st && (
        <div className="fg">
          <div className="topbar">
            <div className="conn-badge"><span className="conn-dot"></span><span id="conn-label">مُتّصل</span></div>
            <div className="topbar-right">
              <button className="mode-btn" onClick={function () { setMode(mode === "day" ? "night" : "day"); }} aria-label="الوضع">
                {mode === "day" ? "☀️" : "🌙"}
              </button>
              <div className="theme-dots">
                {MOZN_THEMES.map(function (th) {
                  return <span key={th.id} className={"tdot" + (t.theme === th.id ? " on" : "")}
                    style={{ background: "linear-gradient(135deg," + th.g3 + "," + th.green + ")" }}
                    onClick={function () { setTweak("theme", th.id); }}></span>;
                })}
              </div>
            </div>
          </div>

          <div className="scroll-area">
          {page === "counter" && <CounterPage st={st} anim={t.buttonAnim} shape={t.buttonShape} openShare={function () { setShareOpen(true); }} goBoard={function () { setPage("board"); }} onProfile={setProfileId} fx={fx} />}
          {page === "sabha" && <SabhaPage st={st} fx={fx} />}
          {page === "board" && <LeaderboardPage st={st} onProfile={setProfileId} />}
          {page === "stats" && <StatsPage st={st} />}
          {page === "settings" && (
            <SettingsPage
              st={st}
              onTheme={function (id) { setTweak("theme", id); }}
              onMode={setMode}
              onToggle={function (k, v) { MoznStore.setSetting(k, v); }}
              onGoal={function (g) { MoznStore.setGoal(g); }}
              openShare={function () { setShareOpen(true); }}
              onLogout={logout}
            />
          )}
          </div>

          <nav className="nav">
            {NAV.map(function (n) {
              return (
                <button key={n.id} className={"nb" + (page === n.id ? " on" : "")} onClick={function () { setPage(n.id); }}>
                  <span className="nb-ico">{n.ico}</span>
                  <span>{n.lbl}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {profileId && <ProfileSheet id={profileId} onClose={function () { setProfileId(null); }} />}
      {shareOpen && st && <ShareSheet name={st.me.name} onClose={function () { setShareOpen(false); }} />}

      {/* ---- Tweaks ---- */}
      <TweaksPanel>
        <TweakSection label="المظهر · Theme" />
        <TweakRadio label="اللون" value={t.theme}
          options={[{ value: 0, label: "زمردي" }, { value: 1, label: "وردي" }, { value: 2, label: "نيلي" }, { value: 3, label: "رملي" }]}
          onChange={function (v) { setTweak("theme", v); }} />
        <TweakSlider label="كثافة النجوم" value={t.particles} min={0} max={2} step={0.25}
          onChange={function (v) { setTweak("particles", v); }} />
        <TweakSection label="الزر الرئيسي · Counter" />
        <TweakRadio label="الحركة" value={t.buttonAnim}
          options={[{ value: "ripple", label: "موجة" }, { value: "glow", label: "توهّج" }, { value: "burst", label: "إشعاع" }]}
          onChange={function (v) { setTweak("buttonAnim", v); }} />
        <TweakRadio label="الشكل" value={t.buttonShape}
          options={[{ value: "circle", label: "دائرة" }, { value: "pill", label: "حبّة" }, { value: "minimal", label: "بسيط" }]}
          onChange={function (v) { setTweak("buttonShape", v); }} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
