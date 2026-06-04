// mozn-fx.js — tactile feedback: soft WebAudio tick/chime + vibration.
(function () {
  var ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  // soft wooden "tick" for each istighfar
  function tick(vol) {
    var a = ac(); if (!a) return;
    var t = a.currentTime;
    var o = a.createOscillator(), g = a.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(660, t);
    o.frequency.exponentialRampToValueAtTime(330, t + 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime((vol || 0.25), t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + 0.14);
  }
  // warm chime for milestones / phase complete
  function chime() {
    var a = ac(); if (!a) return;
    var t = a.currentTime;
    [523.25, 659.25, 783.99].forEach(function (f, i) {
      var o = a.createOscillator(), g = a.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      var s = t + i * 0.08;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.18, s + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.5);
      o.connect(g); g.connect(a.destination);
      o.start(s); o.stop(s + 0.55);
    });
  }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) {} }

  window.MoznFX = {
    tap: function (sound, haptic) { if (sound) tick(0.22); if (haptic) buzz(12); },
    milestone: function (sound, haptic) { if (sound) chime(); if (haptic) buzz([18, 40, 18]); },
    unlock: ac,
  };
})();
