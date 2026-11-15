export function startStars(){

  const cv = document.querySelector('#stars'); if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d'); let W = 0, H = 0, pts = [], raf = 0;
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size(){ const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = W*dpr; cv.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    pts = Array.from({length: Math.round(W*H/2200)}, () => ({x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.2+.2, p:Math.random()*6.28, s:Math.random()*.02+.004, g:Math.random()<.12})); }
  function draw(t){ ctx.clearRect(0,0,W,H);
    for (const s of pts){ const a = .35 + .65*Math.abs(Math.sin(s.p + t*s.s*0.06)); ctx.globalAlpha = a; ctx.fillStyle = s.g ? '#F5D87A' : '#F4EEFA'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); }
    ctx.globalAlpha = 1; if (!still) raf = requestAnimationFrame(draw); }
  size(); draw(0);
  window.addEventListener('resize', () => { cancelAnimationFrame(raf); size(); draw(0); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else if (!still) raf = requestAnimationFrame(draw); });

}
