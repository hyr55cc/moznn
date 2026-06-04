// mozn-pages3.jsx — Settings page
const { useState: useStateS } = React;

function SettingsPage({ st, onTheme, onMode, onToggle, onGoal, openShare, onLogout }) {
  const me = st.me;
  const s = st.settings;
  const lvl = moznLevel(me.total);
  const [msg, setMsg] = useStateS("");
  const [sent, setSent] = useStateS(false);

  function sendMail() {
    const body = encodeURIComponent((msg || "").trim() + "\n\n— " + me.name + " · تطبيق مزن");
    const subject = encodeURIComponent("رسالة من تطبيق مزن ✦");
    window.location.href = "mailto:halfofthird@gmail.com?subject=" + subject + "&body=" + body;
    setSent(true); setTimeout(function () { setSent(false); setMsg(""); }, 2500);
  }

  return (
    <div className="page on cfg-page">
      <div className="cfg-card">
        <div className="cfg-title">الملف الشخصي</div>
        <div className="prof-head" style={{ marginBottom: 4 }}>
          <div className="prof-av">{avatarOf(me.name)}</div>
          <div className="prof-id">
            <div className="prof-name">{me.name}</div>
            <div className="prof-lvl">{lvl.name} · {fmt(me.total)} استغفار · 🏆 {fmt(me.firstPlaceCount)}</div>
          </div>
        </div>
      </div>

      <div className="cfg-card">
        <div className="cfg-title">الوضع</div>
        <div className="mode-seg">
          <button className={"mode-opt" + (s.mode !== "day" ? " on" : "")} onClick={function () { onMode("night"); }}>🌙 ليلي</button>
          <button className={"mode-opt" + (s.mode === "day" ? " on" : "")} onClick={function () { onMode("day"); }}>☀️ نهاري</button>
        </div>
      </div>

      <div className="cfg-card">
        <div className="cfg-title">الهدف اليومي</div>
        <div className="goal-row">
          <button className="goal-step" onClick={function () { onGoal(me.goal - 33); }}>−</button>
          <div className="goal-num">{fmt(me.goal)}</div>
          <button className="goal-step" onClick={function () { onGoal(me.goal + 33); }}>+</button>
        </div>
        <div className="goal-presets">
          {[33, 100, 313, 1000].map(function (g) {
            return <button key={g} className={"goal-chip" + (me.goal === g ? " on" : "")} onClick={function () { onGoal(g); }}>{fmt(g)}</button>;
          })}
        </div>
      </div>

      <div className="cfg-card">
        <div className="cfg-title">اللون</div>
        <div className="th-grid">
          {MOZN_THEMES.map(function (t) {
            return (
              <div key={t.id} className={"th-opt" + (s.themeId === t.id ? " on" : "")} onClick={function () { onTheme(t.id); }}>
                <div className="th-sw" style={{ background: "linear-gradient(135deg," + t.g3 + "," + t.green + ")" }}></div>
                <div className="th-lbl">{t.lbl}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cfg-card">
        <div className="cfg-title">التنبيهات الحسّية</div>
        <div className="bot-row">
          <span className="bot-nm">🔊 صوت عند الاستغفار</span>
          <label className="tog"><input type="checkbox" checked={s.sound} onChange={function (e) { onToggle("sound", e.target.checked); }} /><span className="sl"></span></label>
        </div>
        <div className="bot-row">
          <span className="bot-nm">📳 اهتزاز خفيف</span>
          <label className="tog"><input type="checkbox" checked={s.haptic} onChange={function (e) { onToggle("haptic", e.target.checked); }} /><span className="sl"></span></label>
        </div>
      </div>

      <div className="cfg-card">
        <div className="cfg-title">المشاركة</div>
        <div className="share-bar" style={{ margin: 0, cursor: "pointer" }} onClick={openShare}>
          <span className="share-lbl">🤲 ادعُ صديقاً للاستغفار</span>
          <button className="copy-btn">رابط الدعوة</button>
        </div>
      </div>

      <div className="cfg-card">
        <div className="cfg-title">تواصل معنا</div>
        <textarea
          className="contact-input" rows={3}
          placeholder="اكتب رسالتك أو ملاحظتك..."
          value={msg} onChange={function (e) { setMsg(e.target.value); }}
        ></textarea>
        <button className="login-btn" style={{ marginTop: 10 }} disabled={!msg.trim()} onClick={sendMail}>
          {sent ? "تم فتح بريدك ✓" : "إرسال إلى الفريق"}
        </button>
        <div className="firebase-badge" style={{ paddingBottom: 0 }}>
          تصل رسالتك إلى <strong>halfofthird@gmail.com</strong>
        </div>
      </div>

      <div className="cfg-card">
        <div className="cfg-title">قاعدة البيانات</div>
        <div className="firebase-badge">
          <strong id="db-mode">{window.__MOZN_DB || "قاعدة محلية (تجريبية)"}</strong><br />
          المتصدّرون يتحدّثون لحظياً
        </div>
      </div>

      <button className="btn-reset" style={{ width: "100%", marginTop: 4 }} onClick={onLogout}>تسجيل الخروج وإعادة التعيين</button>
      <div className="made-by">صُنع بواسطة <strong>نصف الثلث</strong> 🌙</div>
    </div>
  );
}

window.SettingsPage = SettingsPage;
