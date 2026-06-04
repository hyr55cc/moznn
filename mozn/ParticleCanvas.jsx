// ParticleCanvas.jsx — drifting starfield + connected gold dots (MOZN backdrop)
function ParticleCanvas({ theme, density }) {
  const ref = React.useRef(null);
  const themeRef = React.useRef(theme);
  themeRef.current = theme;
  const d = density == null ? 1 : density;
  React.useEffect(() => {
    const cv = ref.current;
    const cx = cv.getContext("2d");
    let W, H, stars = [], pts = [], raf;
    function init() {
      const host = cv.parentElement;
      W = host.offsetWidth || 390;
      H = Math.max(host.scrollHeight, 700);
      cv.width = W; cv.height = H;
      stars = []; for (let i = 0; i < Math.round(120 * d); i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + .2, o: Math.random() * .7 + .1, tw: Math.random() * Math.PI * 2, sp: Math.random() * .02 + .005 });
      pts = []; for (let i = 0; i < Math.round(26 * d); i++) pts.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .4, vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22, o: Math.random() * .2 + .05 });
    }
    function draw() {
      const t = themeRef.current;
      const g = cx.createRadialGradient(W * .5, H * .35, 0, W * .5, H * .35, H * .9);
      g.addColorStop(0, t.s1); g.addColorStop(1, t.s2);
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      stars.forEach(s => { s.tw += s.sp; const a = s.o * (.6 + .4 * Math.sin(s.tw)); cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, Math.PI * 2); cx.fillStyle = "rgba(255,255,255," + a + ")"; cx.fill(); });
      pts.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2); cx.fillStyle = "rgba(" + t.dot + "," + p.o + ")"; cx.fill(); });
      pts.forEach((p, i) => { for (let j = i + 1; j < pts.length; j++) { const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y); if (d < 90) { cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(q.x, q.y); cx.strokeStyle = "rgba(" + t.dot + "," + (0.05 * (1 - d / 90)) + ")"; cx.lineWidth = .5; cx.stroke(); } } });
      raf = requestAnimationFrame(draw);
    }
    init(); draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);
  return <canvas id="bgc" ref={ref}></canvas>;
}
window.ParticleCanvas = ParticleCanvas;
