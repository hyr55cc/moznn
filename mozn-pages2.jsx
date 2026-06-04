// mozn-pages2.jsx — Leaderboard + Profile + Stats + Settings

function avatarOf(name) {
  const ch = (name || "؟").trim()[0] || "؟";
  return ch;
}

// ===========================================================================
// PROFILE SHEET (bottom modal)
// ===========================================================================
function ProfileSheet({ id, onClose }) {
  const p = MoznStore.profile(id);
  if (!p) return null;
  const lvl = moznLevel(p.total);
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={function (e) { e.stopPropagation(); }}>
        <div className="sheet-handle"></div>
        <div className="prof-head">
          <div className={"prof-av" + (p.rank === 1 ? " r1" : "")}>{avatarOf(p.name)}</div>
          <div className="prof-id">
            <div className="prof-name">{p.name}{p.me ? " (أنت)" : ""}</div>
            <div className="prof-lvl">{lvl.name} · المركز #{p.rank}</div>
          </div>
        </div>
        <div className="prof-grid">
          <div className="prof-box">
            <div className="prof-val">{fmt(p.total)}</div>
            <div className="prof-lbl">إجمالي الاستغفار</div>
          </div>
          <div className="prof-box gold">
            <div className="prof-val">🏆 {fmt(p.firstPlaceCount)}</div>
            <div className="prof-lbl">مرات المركز الأول</div>
          </div>
          {p.me ? (
            <React.Fragment>
              <div className="prof-box"><div className="prof-val">🔥 {fmt(p.streak)}</div><div className="prof-lbl">أيام متتالية</div></div>
              <div className="prof-box"><div className="prof-val">{fmt(p.bestDay)}</div><div className="prof-lbl">أفضل يوم</div></div>
            </React.Fragment>
          ) : (
            <div className="prof-box" style={{ gridColumn: "span 2" }}>
              <div className="prof-val" style={{ fontSize: 16 }}>عضو منذ {p.joined}</div>
              <div className="prof-lbl">انضمّ إلى مزن</div>
            </div>
          )}
        </div>
        {p.me && <div className="prof-since">عضو منذ {p.joined}</div>}
        <button className="login-btn" style={{ marginTop: 4 }} onClick={onClose}>إغلاق</button>
      </div>
    </div>
  );
}

// ===========================================================================
// LEADERBOARD
// ===========================================================================
function LeaderboardPage({ st, onProfile }) {
  const [tab, setTab] = useState("world");
  const full = MoznStore.ranked();
  const myRank = MoznStore.myRank();

  let rows = full;
  if (tab === "near") {
    const start = Math.max(0, myRank - 3);
    rows = full.slice(start, start + 7);
  } else {
    rows = full.slice(0, 20);
  }

  return (
    <div className="page on">
      <div className="lb-section" style={{ marginTop: 14 }}>
        <div className="lb-hdr">
          <span className="lb-title">🏆 المتصدّرون</span>
          <span className="lb-count"><span className="conn-dot" style={{ display: "inline-block", marginInlineEnd: 5 }}></span>{fmt(full.length)} مستغفر</span>
        </div>
        <div className="lb-tabs">
          <button className={"lb-tab" + (tab === "world" ? " on" : "")} onClick={function () { setTab("world"); }}>🌍 العالم</button>
          <button className={"lb-tab" + (tab === "near" ? " on" : "")} onClick={function () { setTab("near"); }}>📍 حولك</button>
        </div>

        {rows.map(function (u) {
          const cls = "lb-rank-badge" + (u.rank === 1 ? " r1" : u.rank === 2 ? " r2" : u.rank === 3 ? " r3" : "");
          return (
            <div key={u.id} className={"lb-row" + (u.me ? " me3" : "")} onClick={function () { onProfile(u.id); }} style={{ cursor: "pointer" }}>
              <div className={cls}>{u.rank <= 3 ? ["🥇", "🥈", "🥉"][u.rank - 1] : u.rank}</div>
              <div className="lb-name">{u.name}{u.me ? " · أنت" : ""}{u.firstPlaceCount > 0 ? <span className="lb-crowns"> 🏆{u.firstPlaceCount}</span> : null}</div>
              <div className="lb-score">{fmtK(u.total)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// STATS
// ===========================================================================
function StatsPage({ st }) {
  const me = st.me;
  const week = MoznStore.weekly();
  const lvl = moznLevel(me.total);
  const myRank = MoznStore.myRank();
  const max = Math.max(1, ...week.map(function (d) { return d.count; }));
  const lvlPct = lvl.ceil ? Math.min(100, Math.round(((me.total - lvl.floor) / (lvl.ceil - lvl.floor)) * 100)) : 100;

  return (
    <div className="page on stats-page">
      <div className="scard">
        <div className="scard-title">نظرة عامة</div>
        <div className="sgrid">
          <div className="sbox"><div className="sval">{fmt(me.total)}</div><div className="slbl">إجمالي الاستغفار</div></div>
          <div className="sbox gold3"><div className="sval">#{myRank}</div><div className="slbl">ترتيبك عالمياً</div></div>
          <div className="sbox"><div className="sval">{fmt(me.today)}</div><div className="slbl">اليوم</div></div>
          <div className="sbox"><div className="sval">{fmt(me.bestDay)}</div><div className="slbl">أفضل يوم</div></div>
          <div className="sbox"><div className="sval">🔥 {fmt(me.streak)}</div><div className="slbl">أيام متتالية</div></div>
          <div className="sbox gold3"><div className="sval">🏆 {fmt(me.firstPlaceCount)}</div><div className="slbl">مرات المركز الأول</div></div>
        </div>
      </div>

      <div className="scard">
        <div className="scard-title">آخر ٧ أيام</div>
        <div className="wk-chart">
          {week.map(function (d, i) {
            return (
              <div key={i} className="wk-col">
                <div className="wk-bar-track">
                  <div className={"wk-bar" + (d.isToday ? " today" : "")} style={{ height: Math.round((d.count / max) * 100) + "%" }}>
                    {d.count > 0 && <span className="wk-val">{fmtK(d.count)}</span>}
                  </div>
                </div>
                <div className={"wk-lbl" + (d.isToday ? " today" : "")}>{d.label.slice(0, 3)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="scard">
        <div className="scard-title">الرتبة</div>
        <div className="prog-top">
          <span className="prog-lbl">{lvl.name}</span>
          <span className="prog-val">{lvl.nextName ? "التالي: " + lvl.nextName : "أعلى رتبة"}</span>
        </div>
        <div className="prog-track"><div className="prog-fill" style={{ width: lvlPct + "%" }}></div></div>
        <div className="firebase-badge" style={{ paddingTop: 12 }}>
          {lvl.nextName ? "تبقّى " + fmt(Math.max(0, lvl.ceil - me.total)) + " استغفار للرتبة التالية" : "بلغت أعلى الرتب — تقبّل الله"}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProfileSheet, LeaderboardPage, StatsPage, avatarOf });
