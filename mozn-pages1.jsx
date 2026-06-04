// mozn-pages1.jsx — Counter + Sabha pages
const { useState, useEffect, useRef } = React;

// ---- small shared bits ----------------------------------------------------
function StatCell({ val, lbl }) {
  return (
    <div className="ss">
      <div className="ss-val">{val}</div>
      <div className="ss-lbl">{lbl}</div>
    </div>
  );
}

function Ripples({ items }) {
  return items.map(function (id) {
    return <span key={id} className="ripple3"></span>;
  });
}

// ===========================================================================
// COUNTER PAGE
// ===========================================================================
function CounterPage({ st, anim, shape, density, openShare, goBoard, onProfile, fx }) {
  const me = st.me;
  const [ripples, setRipples] = useState([]);
  const [hadithIdx, setHadithIdx] = useState(0);
  const [pop, setPop] = useState(false);
  const rid = useRef(0);
  const board = MoznStore.ranked();
  const myRank = MoznStore.myRank();
  const lvl = moznLevel(me.total);

  useEffect(function () {
    const h = setInterval(function () {
      setHadithIdx(function (i) { return (i + 1) % MOZN_HADITHS.length; });
    }, 9000);
    return function () { clearInterval(h); };
  }, []);

  function tap() {
    const before = me.today;
    MoznStore.increment(1);
    const after = before + 1;
    // milestone every 33 / goal hit -> chime, else tick
    const hitGoal = after === me.goal;
    const milestone = after % 33 === 0 || hitGoal;
    if (milestone) fx.milestone(); else fx.tap();
    // ripple
    const id = ++rid.current;
    setRipples(function (r) { return r.concat(id); });
    setTimeout(function () {
      setRipples(function (r) { return r.filter(function (x) { return x !== id; }); });
    }, 900);
    setPop(true);
    setTimeout(function () { setPop(false); }, 130);
  }

  const goalPct = Math.min(100, Math.round((me.today / me.goal) * 100));
  const hadith = MOZN_HADITHS[hadithIdx];

  return (
    <div className="page on">
      <div className="title-wrap">
        <img className="app-logo" src="mozn/icon.png" alt="مزن · للاستغفار" />
        <div className="app-verse">سَابِقُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ</div>
        <div className="welcome">مرحباً بعودتك، {me.name} — نسأل الله أن يتقبّل</div>
      </div>

      <div className="stats-strip">
        <StatCell val={fmt(me.today)} lbl="اليوم" />
        <StatCell val={fmt(me.total)} lbl="الإجمالي" />
        <StatCell val={fmt(me.streak)} lbl="أيام متتالية" />
        <StatCell val={"#" + myRank} lbl="ترتيبك" />
      </div>

      <div className="hadith-box" key={hadithIdx}>
        <div className="hadith-t">{hadith.t}</div>
        <div className="hadith-s">— {hadith.s}</div>
      </div>

      <div className="btn-wrap">
        <div className="name-level">
          <div className="name-txt">{lvl.name}</div>
          <div className="level-txt">
            {lvl.nextName
              ? "إلى رتبة " + lvl.nextName + " · " + fmt(Math.max(0, lvl.ceil - me.total)) + " استغفار"
              : "أعلى رتبة — ما شاء الله"}
          </div>
        </div>

        <button
          className={"btn-outer anim-" + anim + " shape-" + shape + (pop ? " pressed" : "")}
          onClick={tap}
        >
          {anim === "ripple" && <Ripples items={ripples} />}
          {anim === "glow" && <span className="glow-pulse" data-on={ripples.length > 0}></span>}
          {anim === "burst" && ripples.map(function (id) {
            return <span key={id} className="starburst">{Array.from({ length: 8 }).map(function (_, i) {
              return <i key={i} style={{ "--a": (i * 45) + "deg" }}></i>;
            })}</span>;
          })}
          <span className="btn-ar">أستغفر الله</span>
          <span className="btn-sub">العظيم وأتوب إليه</span>
        </button>
      </div>

      <div className="prog-card">
        <div className="prog-top">
          <span className="prog-lbl">🎯 هدف اليوم</span>
          <span className="prog-val">{fmt(me.today)} / {fmt(me.goal)}</span>
        </div>
        <div className="prog-track"><div className="prog-fill" style={{ width: goalPct + "%" }}></div></div>
        <div className="prog-boxes">
          <div className="pbox"><div className="pbox-val">🔥 {fmt(me.streak)}</div><div className="pbox-lbl">يوم متتالٍ</div></div>
          <div className="pbox"><div className="pbox-val">{fmt(me.bestDay)}</div><div className="pbox-lbl">أفضل يوم</div></div>
        </div>
      </div>

      <div className="share-bar" onClick={openShare} style={{ cursor: "pointer" }}>
        <span className="share-lbl">🤲 شارك الأجر مع من تحب</span>
        <button className="copy-btn">دعوة ←</button>
      </div>

      <div className="lb-section" style={{ marginTop: 4 }}>
        <div className="lb-hdr">
          <span className="lb-title">🏆 المتصدّرون</span>
          <span className="lb-count" onClick={goBoard} style={{ cursor: "pointer", color: "var(--gold2)" }}>عرض الكل ←</span>
        </div>
        {board.slice(0, 5).map(function (u) {
          const cls = "lb-rank-badge" + (u.rank === 1 ? " r1" : u.rank === 2 ? " r2" : u.rank === 3 ? " r3" : "");
          return (
            <div key={u.id} className={"lb-row" + (u.me ? " me3" : "")} onClick={function () { onProfile(u.id); }} style={{ cursor: "pointer" }}>
              <div className={cls}>{u.rank <= 3 ? ["🥇", "🥈", "🥉"][u.rank - 1] : u.rank}</div>
              <div className="lb-name">{u.name}{u.me ? " · أنت" : ""}</div>
              <div className="lb-score">{fmtK(u.total)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// SABHA PAGE — selectable ma'thoor adhkar counter
// ===========================================================================

function SabhaPage({ st, fx }) {
  const di = st.settings.sabhaDhikr || 0;
  const count = st.settings.sabhaCount || 0;
  const dhikr = MOZN_ADHKAR[di] || MOZN_ADHKAR[0];
  const [rounds, setRounds] = useState(0);
  const [justDone, setJustDone] = useState(false);

  function bead() {
    const s = MoznStore.get().settings;
    const d = MOZN_ADHKAR[s.sabhaDhikr || 0];
    const next = (s.sabhaCount || 0) + 1;
    if (next >= d.target) {
      fx.milestone();
      MoznStore.setSabha(0, s.sabhaPhase || 0);
      setRounds(function (r) { return r + 1; });
      setJustDone(true);
      setTimeout(function () { setJustDone(false); }, 1800);
    } else {
      fx.tap();
      MoznStore.setSabha(next, s.sabhaPhase || 0);
    }
  }
  function pick(i) { fx.tap(); MoznStore.setSabhaDhikr(i); setRounds(0); }
  function reset() { MoznStore.setSabha(0, st.settings.sabhaPhase || 0); setRounds(0); }

  const pct = Math.round((count / dhikr.target) * 100);
  const R = 86, C = 2 * Math.PI * R;

  return (
    <div className="page on">
      <div className="sabha-wrap">
        <div className="sabha-head">السُّبْحَة · الأذكار المأثورة</div>

        <div className="dhikr-chips">
          {MOZN_ADHKAR.map(function (d, i) {
            return (
              <button key={i} className={"dhikr-chip" + (i === di ? " on" : "")} onClick={function () { pick(i); }}>
                {d.t}
              </button>
            );
          })}
        </div>

        <div className="dhikr-active">{dhikr.t}</div>
        <div className="dhikr-virtue">«{dhikr.v}»</div>

        <button className="sabha-ring-btn" onClick={bead}>
          <svg className="sabha-ring" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={R} className="ring-bg" />
            <circle cx="100" cy="100" r={R} className="ring-fg"
              style={{ strokeDasharray: C, strokeDashoffset: C * (1 - count / dhikr.target) }} />
          </svg>
          <span className="sabha-num">{count}</span>
          <span className="sabha-target">/ {dhikr.target}</span>
          <span className="sabha-tap-hint">{justDone ? "✓ تقبّل الله" : "اضغط للتسبيح"}</span>
        </button>

        <div className="sabha-meta">
          <span>{pct}%</span>
          <span>·</span>
          <span>دورات مكتملة: {fmt(rounds)}</span>
        </div>

        <button className="btn-reset" onClick={reset}>إعادة العدّ</button>
      </div>
    </div>
  );
}

Object.assign(window, { CounterPage, SabhaPage, StatCell });
