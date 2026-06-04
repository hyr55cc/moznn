// mozn-store.js — MOZN live data layer.
// Works out-of-the-box with a local "live" store (localStorage + simulated other
// worshippers ticking up in real time). Drop your Firebase config into
// window.MOZN_FIREBASE_CONFIG (see MOZN.html) to switch to a real shared leaderboard.

(function () {
  "use strict";
  var LS_KEY = "mozn_state_v3";

  // ---- helpers ----------------------------------------------------------
  function today() { return new Date().toISOString().slice(0, 10); }
  function yesterday() {
    var d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  // English numerals with thousands separators
  window.fmt = function (n) { return (n || 0).toLocaleString("en-US"); };
  // compact (1.2k) for tight chips
  window.fmtK = function (n) {
    n = n || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
    return "" + n;
  };

  // ---- levels -----------------------------------------------------------
  var LEVELS = [
    { min: 0, name: "مبتدئ" },
    { min: 100, name: "ذاكِر" },
    { min: 500, name: "مجتهد" },
    { min: 1500, name: "مُكثِر" },
    { min: 5000, name: "أوّاب" },
    { min: 15000, name: "محسن" },
    { min: 50000, name: "صدّيق" },
  ];
  window.moznLevel = function (total) {
    var lvl = LEVELS[0], idx = 0;
    for (var i = 0; i < LEVELS.length; i++) {
      if (total >= LEVELS[i].min) { lvl = LEVELS[i]; idx = i; }
    }
    var next = LEVELS[idx + 1] || null;
    return {
      name: lvl.name, index: idx,
      floor: lvl.min,
      ceil: next ? next.min : null,
      nextName: next ? next.name : null,
    };
  };

  // seed "world" with fabricated #1 history + join info
  var SEED = (window.MOZN_SEED || []).map(function (u, i) {
    return {
      id: "u" + i, name: u.n, total: u.s,
      firstPlaceCount: [12, 9, 7, 5, 4, 3, 2, 2, 1, 0][i] || 0,
      bot: /🤖/.test(u.n),
      joined: "2026-0" + ((i % 5) + 1) + "-1" + (i % 9),
    };
  });

  // ma'thoor adhkar for the sabha (text + virtue + target count)
  window.MOZN_ADHKAR = [
    { t: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", v: "حُطّت خطاياه وإن كانت مثل زبد البحر", target: 100 },
    { t: "سُبْحَانَ اللَّهِ الْعَظِيمِ", v: "كلمتان حبيبتان إلى الرحمن", target: 100 },
    { t: "لَا إِلَٰهَ إِلَّا اللَّهُ", v: "أفضل الذكر", target: 100 },
    { t: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", v: "مفتاح الفرج والرزق", target: 100 },
    { t: "سُبْحَانَ اللَّهِ", v: "تملأ الميزان", target: 33 },
    { t: "الْحَمْدُ لِلَّهِ", v: "تملأ الميزان", target: 33 },
    { t: "اللَّهُ أَكْبَرُ", v: "تكبير بعد الصلاة", target: 34 },
    { t: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", v: "كنز من كنوز الجنة", target: 100 },
    { t: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", v: "أولى الناس بالنبي ﷺ", target: 100 },
  ];

  function defaultState(name) {
    return {
      me: {
        id: "me", name: name, total: 0, today: 0, todayDate: today(),
        streak: 0, lastDay: null, firstPlaceCount: 0, bestDay: 0,
        goal: 100, joined: today(), history: {},
      },
      others: JSON.parse(JSON.stringify(SEED)),
      settings: { themeId: 2, mode: "night", sound: true, haptic: true, sabhaPhase: 0, sabhaCount: 0, sabhaDhikr: 0 },
      _wasFirst: false,
    };
  }

  // ---- store core -------------------------------------------------------
  var state = null;
  var listeners = [];
  function notify() { listeners.forEach(function (fn) { try { fn(state); } catch (e) {} }); }
  function persist() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }

  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) { state = JSON.parse(raw); migrate(); return state; }
    } catch (e) {}
    return null;
  }
  function migrate() {
    if (!state.settings) state.settings = { themeId: 2, mode: "night", sound: true, haptic: true, sabhaPhase: 0, sabhaCount: 0, sabhaDhikr: 0 };
    if (!state.settings.mode) state.settings.mode = "night";
    if (state.settings.sabhaDhikr == null) state.settings.sabhaDhikr = 0;
    if (!state.me.history) state.me.history = {};
    if (state.me.bestDay == null) state.me.bestDay = 0;
    if (!state.others) state.others = JSON.parse(JSON.stringify(SEED));
  }

  function rolloverDay() {
    var t = today();
    if (state.me.todayDate !== t) {
      // archive yesterday's count into history before reset
      if (state.me.today > 0) state.me.history[state.me.todayDate] = state.me.today;
      state.me.today = 0;
      state.me.todayDate = t;
    }
  }

  // ---- leaderboard ------------------------------------------------------
  function ranked() {
    var all = [{
      id: "me", name: state.me.name, total: state.me.total,
      firstPlaceCount: state.me.firstPlaceCount, joined: state.me.joined, me: true,
    }].concat(state.others);
    all.sort(function (a, b) { return b.total - a.total; });
    all.forEach(function (u, i) { u.rank = i + 1; });
    return all;
  }

  function checkFirstPlace() {
    var board = ranked();
    var isFirst = board[0] && board[0].id === "me";
    var ready = !fbEnabled() || state._fbReady;
    if (isFirst && !state._wasFirst && state.me.total > 0 && ready) {
      state.me.firstPlaceCount++;
      scheduleWrite();
    }
    state._wasFirst = isFirst;
  }

  // ---- Firebase (shared live leaderboard) -------------------------------
  function fbEnabled() { return !!window.MOZN_DB; }
  function ensureUid() {
    if (!state._uid) state._uid = "u_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
    return state._uid;
  }
  var _wt = null;
  var _LVL_EN = ["beginner", "dhakir", "mujtahid", "mukthir", "awwab", "muhsin", "siddiq"];
  function writeMe() {
    if (!fbEnabled() || !state) return;
    var idx = window.moznLevel(state.me.total).index;
    try {
      window.MOZN_DB.ref("users/" + state._uid).update({
        uid: state._uid,
        name: state.me.name,
        total: state.me.total,
        totalCount: state.me.total,        // interop with the original moznn schema
        todayCount: state.me.today,
        streak: state.me.streak,
        dailyGoal: state.me.goal,
        level: _LVL_EN[idx] || "beginner",
        firstPlaceCount: state.me.firstPlaceCount,
        joined: state.me.joined,
        lastActive: Date.now(),
      })["catch"](function (e) { console.warn("FB write denied:", e && e.message); });
    } catch (e) { console.warn("FB write error:", e); }
  }
  function scheduleWrite() {
    if (!fbEnabled() || _wt) return;
    _wt = setTimeout(function () { _wt = null; writeMe(); }, 900);
  }
  function startFirebase() {
    if (!fbEnabled() || !state || state._fbStarted) return;
    state._fbStarted = true;
    state.others = []; // real users only
    writeMe();
    try {
      window.MOZN_DB.ref("users").on("value", function (snap) {
        var val = snap.val() || {};
        state.others = Object.keys(val)
          .filter(function (k) { return k !== state._uid; })
          .map(function (k) {
            var u = val[k] || {};
            var tot = (u.total != null ? u.total : (u.totalCount != null ? u.totalCount : 0));
            return { id: k, name: u.name || "مستغفر", total: tot, firstPlaceCount: u.firstPlaceCount || 0, joined: u.joined || u.lastDate || "" };
          });
        if (!state._fbReady) {
          // first snapshot: set baseline rank without counting a false #1
          state._fbReady = true;
          var b0 = ranked();
          state._wasFirst = !!(b0[0] && b0[0].id === "me");
          notify();
          return;
        }
        checkFirstPlace();
        notify();
      }, function (err) { console.warn("FB read denied:", err && err.message); });
    } catch (e) { console.warn("FB listen error:", e); }
  }

  // ---- public API -------------------------------------------------------
  var Store = {
    LEVELS: LEVELS,
    init: function (savedName) {
      if (!load()) {
        if (savedName) state = defaultState(savedName);
        else return null; // need login
      }
      ensureUid();
      rolloverDay();
      checkFirstPlace();
      persist();
      if (fbEnabled()) startFirebase(); else this._startLive();
      return state;
    },
    register: function (name) {
      state = defaultState(name || "ضيف");
      ensureUid();
      if (fbEnabled()) state.others = [];
      persist(); notify();
      if (fbEnabled()) startFirebase(); else this._startLive();
      return state;
    },
    get: function () { return state; },
    subscribe: function (fn) {
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
    },

    // core action: add one istighfar
    increment: function (by) {
      by = by || 1;
      rolloverDay();
      var first = state.me.today === 0; // first of the day?
      state.me.today += by;
      state.me.total += by;
      if (state.me.today > state.me.bestDay) state.me.bestDay = state.me.today;
      // streak bookkeeping on first action of a day
      if (first) {
        if (state.me.lastDay === yesterday()) state.me.streak += 1;
        else if (state.me.lastDay !== today()) state.me.streak = 1;
        state.me.lastDay = today();
      }
      checkFirstPlace();
      persist(); notify();
      scheduleWrite();
    },

    setGoal: function (g) { state.me.goal = Math.max(1, g | 0); persist(); notify(); },
    setSetting: function (k, v) { state.settings[k] = v; persist(); notify(); },
    setSabha: function (count, phase) {
      state.settings.sabhaCount = count;
      state.settings.sabhaPhase = phase;
      persist(); notify();
    },
    setSabhaDhikr: function (i) {
      state.settings.sabhaDhikr = i;
      state.settings.sabhaCount = 0;
      persist(); notify();
    },

    ranked: ranked,
    myRank: function () {
      var b = ranked();
      for (var i = 0; i < b.length; i++) if (b[i].id === "me") return b[i].rank;
      return b.length;
    },
    profile: function (id) {
      if (id === "me") {
        return {
          id: "me", name: state.me.name, total: state.me.total,
          firstPlaceCount: state.me.firstPlaceCount, joined: state.me.joined,
          rank: this.myRank(), bestDay: state.me.bestDay, streak: state.me.streak, me: true,
        };
      }
      var u = state.others.filter(function (x) { return x.id === id; })[0];
      if (!u) return null;
      var b = ranked();
      var found = b.filter(function (x) { return x.id === id; })[0];
      return Object.assign({}, u, { rank: found ? found.rank : null });
    },

    // weekly history -> last 7 days [{date,label,count}]
    weekly: function () {
      var out = [];
      var days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      for (var i = 6; i >= 0; i--) {
        var d = new Date(); d.setDate(d.getDate() - i);
        var key = d.toISOString().slice(0, 10);
        var count = key === state.me.todayDate ? state.me.today : (state.me.history[key] || 0);
        out.push({ date: key, label: days[d.getDay()], count: count, isToday: i === 0 });
      }
      return out;
    },

    // ---- "live world": other worshippers tick up over time -------------
    _liveTimer: null,
    _startLive: function () {
      if (this._liveTimer || !state || fbEnabled()) return;
      var self = this;
      this._liveTimer = setInterval(function () {
        if (!state || !state.others.length) return;
        // bump 1–2 random users by a small amount
        var hits = 1 + (Math.random() < 0.4 ? 1 : 0);
        for (var k = 0; k < hits; k++) {
          var u = state.others[Math.floor(Math.random() * state.others.length)];
          u.total += Math.floor(Math.random() * (u.bot ? 9 : 5)) + 1;
        }
        checkFirstPlace();
        persist(); notify();
      }, 3500);
    },
    stopLive: function () {
      clearInterval(this._liveTimer); this._liveTimer = null;
      try { if (window.MOZN_DB) window.MOZN_DB.ref("users").off(); } catch (e) {}
    },
  };

  window.MoznStore = Store;
})();
