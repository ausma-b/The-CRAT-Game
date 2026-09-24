/* =====================================================================
   APP LOGIC
   ===================================================================== */
const { useState, useEffect, useRef, useMemo } = React;
/* Straight quotes in the data become curly quotes on screen. */
const smart = t => t.replace(/(^|[\s(\[\u2014\u2013-])"/g, '$1\u201C').replace(/"/g, '\u201D')
  .replace(/(^|[\s(\[\u2014\u2013-])'/g, '$1\u2018').replace(/'/g, '\u2019');
const smartDeep = o => typeof o === 'string' ? smart(o) : Array.isArray(o) ? o.map(smartDeep)
  : (o && typeof o === 'object') ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, smartDeep(v)])) : o;
const GAME = smartDeep(GAME_SCRIPT), QUIZ = smartDeep(QUIZ_ITEMS);

const html = htm.bind(React.createElement);
const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const listJoin = arr => arr.length <= 1 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
const toTop = () => window.scrollTo(0, 0);

function useParallax() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el || REDUCED) return;
    const mv = e => { const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) - .5) * 2);
      el.style.setProperty('--my', (((e.clientY - r.top) / r.height) - .5) * 2); };
    const lv = () => { el.style.setProperty('--mx', 0); el.style.setProperty('--my', 0); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv);
    return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); };
  }, []);
  return ref;
}

/* ---------- small art pieces ---------- */
function gearD(r, teeth, depth) {
  const ri = r - depth, s = 2 * Math.PI / teeth, P = (rad, a) => (rad * Math.cos(a)).toFixed(2) + ',' + (rad * Math.sin(a)).toFixed(2);
  const pts = [];
  for (let i = 0; i < teeth; i++) { const a = i * s; pts.push(P(ri, a), P(r, a + s * .12), P(r, a + s * .38), P(ri, a + s * .5)); }
  return 'M' + pts.join('L') + 'Z';
}
function Gear({ x, y, r, teeth = 10, rot = 0, spin, rev, fill = '#B08D3C' }) {
  return html`<g transform=${`translate(${x} ${y})`}>
    <g className=${spin ? ('spin' + (rev ? ' rev' : '')) : 'gear-rot'} style=${spin ? null : { transform: `rotate(${rot}deg)` }}>
      <path d=${gearD(r, teeth, r * .22)} fill=${fill} stroke="#6E531A" strokeWidth="1.2"/>
      <circle r=${r * .5} fill="none" stroke="#6E531A" strokeWidth="1" opacity=".5"/>
      <circle r=${r * .18} fill="#3A2F1A"/>
      <circle cx=${r * .5} r=${r * .06} fill="#F4E3B0"/>
    </g></g>`;
}
function Pin() {
  return html`<svg className="pin" viewBox="0 0 28 28" aria-hidden="true">
    <defs><radialGradient id="pinG" cx="35%" cy="30%"><stop offset="0" stopColor="#F7E4A8"/><stop offset=".55" stopColor="#B5653A"/><stop offset="1" stopColor="#6B3316"/></radialGradient></defs>
    <circle cx="14" cy="14" r="11" fill="url(#pinG)"/></svg>`;
}

/* ---------- papercraft art kit ---------- */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function ArtDefs() {
  return html`<svg width="0" height="0" style=${{ position: 'absolute', overflow: 'hidden' }} aria-hidden="true" focusable="false"><defs>
    <filter id="card" x="-20%" y="-20%" width="140%" height="150%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 .22  0 0 0 0 .14  0 0 0 0 .05  0 0 0 .32 0" result="g"/>
      <feComposite in="g" in2="SourceGraphic" operator="in" result="gi"/>
      <feMerge result="tex"><feMergeNode in="SourceGraphic"/><feMergeNode in="gi"/></feMerge>
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" result="b"/>
      <feOffset in="b" dx="1.5" dy="3.5" result="o"/>
      <feFlood floodColor="#3A2508" floodOpacity=".38"/>
      <feComposite in2="o" operator="in" result="sh"/>
      <feMerge><feMergeNode in="sh"/><feMergeNode in="tex"/></feMerge>
    </filter>
    <linearGradient id="hiTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".38"/><stop offset=".55" stopColor="#fff" stopOpacity="0"/></linearGradient>
    <linearGradient id="loBot" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stopColor="#2B1A08" stopOpacity="0"/><stop offset="1" stopColor="#2B1A08" stopOpacity=".3"/></linearGradient>
    <linearGradient id="hiLeft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity=".32"/><stop offset=".55" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#2B1A08" stopOpacity=".22"/></linearGradient>
    <radialGradient id="winG" cx=".5" cy=".62" r=".75"><stop offset="0" stopColor="#FFF3C4"/><stop offset=".65" stopColor="#F4C35E"/><stop offset="1" stopColor="#D08A36"/></radialGradient>
    <radialGradient id="faceG" cx=".38" cy=".32" r=".78"><stop offset=".5" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#7A3E1C" stopOpacity=".3"/></radialGradient>
    <radialGradient id="brassR" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#F7E4A8"/><stop offset=".6" stopColor="#B08D3C"/><stop offset="1" stopColor="#6E531A"/></radialGradient>
    <radialGradient id="sunG"><stop offset="0" stopColor="#FFF0B8"/><stop offset=".7" stopColor="#F6CF6E"/><stop offset="1" stopColor="#E9AE4A"/></radialGradient>
    <linearGradient id="skyWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#93BCCB"/><stop offset=".7" stopColor="#D9DCC6"/><stop offset="1" stopColor="#F3E3C0"/></linearGradient>
    <pattern id="shingle" width="10" height="7" patternUnits="userSpaceOnUse"><path d="M0 7 Q5 1 10 7" fill="none" stroke="#000" strokeOpacity=".2" strokeWidth="1.3"/></pattern>
    <pattern id="brick" width="16" height="9" patternUnits="userSpaceOnUse"><path d="M0 9 H16 M8 0 V4.5 M0 4.5 H16 M2 4.5 V9" stroke="#000" strokeOpacity=".07" strokeWidth="1"/></pattern>
  </defs></svg>`;
}
function Person({ x = 0, y = 0, s = 1, body = '#2F6F6A', face = '#EBC4A0', hair = '#4A3432', mood = 'neutral', scarf }) {
  const bodyD = 'M-23 72 Q-25 44 -13 36 Q0 31 13 36 Q25 44 23 72 Z';
  const hairD = 'M-19 12 Q-22 -10 -3 -13 Q15 -15 20 4 Q21 11 18 15 Q16 3 6 -1 Q-6 3 -16 2 Q-18 8 -17 15Z';
  const arm = shade(body, -.2);
  return html`<g transform=${`translate(${x} ${y}) scale(${s})`}><g filter="url(#card)">
    <g fill="#FFF6E2" stroke="#FFF6E2" strokeWidth="7" strokeLinejoin="round">
      <path d=${bodyD}/><circle cy="12" r="19"/><path d=${hairD}/><circle cx="-18" cy="13" r="4"/><circle cx="18" cy="13" r="4"/>
      <ellipse cx="-22" cy="55" rx="6.5" ry="13" transform="rotate(12 -22 55)"/><ellipse cx="22" cy="55" rx="6.5" ry="13" transform="rotate(-12 22 55)"/>
    </g>
    <ellipse cx="-22" cy="55" rx="6.5" ry="13" fill=${arm} transform="rotate(12 -22 55)"/>
    <ellipse cx="22" cy="55" rx="6.5" ry="13" fill=${arm} transform="rotate(-12 22 55)"/>
    <circle cx="-24" cy="67" r="4.6" fill=${face}/><circle cx="24" cy="67" r="4.6" fill=${face}/>
    <path d=${bodyD} fill=${body}/><path d=${bodyD} fill="url(#hiLeft)"/>
    <path d="M-7 35 Q0 43 7 35" fill=${shade(body, .25)}/>
    <circle cy="51" r="1.7" fill=${shade(body, -.4)}/><circle cy="60" r="1.7" fill=${shade(body, -.4)}/>
    ${scarf && html`<g><path d="M-13 35 Q0 45 13 35 L12 41 Q0 50 -12 41Z" fill=${scarf}/><path d="M4 41 L9 54 L3 53Z" fill=${shade(scarf, -.12)}/></g>`}
    <rect x="-5" y="27" width="10" height="9" rx="3" fill=${shade(face, -.15)}/>
    <circle cx="-18" cy="13" r="4" fill=${shade(face, -.1)}/><circle cx="18" cy="13" r="4" fill=${shade(face, -.1)}/>
    <circle cy="12" r="18" fill=${face}/><circle cy="12" r="18" fill="url(#faceG)"/>
    <path d=${hairD} fill=${hair}/>
    <path d="M-11 -7 Q-1 -12 10 -8" stroke=${shade(hair, .35)} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
    <circle cx="-10.5" cy="19" r="3.8" fill="#E8836F" opacity=".5"/><circle cx="10.5" cy="19" r="3.8" fill="#E8836F" opacity=".5"/>
    <ellipse cx="-6.5" cy="13" rx="2.4" ry="3.1" fill="#2B2A33"/><circle cx="-5.7" cy="11.9" r=".95" fill="#fff"/>
    <ellipse cx="6.5" cy="13" rx="2.4" ry="3.1" fill="#2B2A33"/><circle cx="7.3" cy="11.9" r=".95" fill="#fff"/>
    ${mood === 'smile'
      ? html`<path d="M-5 20 Q0 25.5 5 20 Q0 22.5 -5 20Z" fill="#8A3A2E" stroke="#8A3A2E" strokeWidth="1.2" strokeLinejoin="round"/>`
      : html`<path d="M-3.5 21.5 Q0 22.5 3.5 21.5" stroke="#8A3A2E" strokeWidth="1.8" fill="none" strokeLinecap="round"/>`}
  </g></g>`;
}
function Win({ x, y, w, h, frame, shutter }) {
  return html`<g>
    ${shutter && html`<g><rect x=${x - w * .32} y=${y} width=${w * .3} height=${h} rx="1.5" fill=${shutter}/><rect x=${x + w * 1.02} y=${y} width=${w * .3} height=${h} rx="1.5" fill=${shutter}/></g>`}
    <rect x=${x - 1.5} y=${y - 1.5} width=${w + 3} height=${h + 3} rx="3" fill=${frame}/>
    <rect x=${x} y=${y} width=${w} height=${h} rx="2" fill="url(#winG)"/>
    <path d=${`M${x + w / 2} ${y} V${y + h} M${x} ${y + h * .5} H${x + w}`} stroke=${frame} strokeWidth="1.6"/>
    <rect x=${x - 3} y=${y + h + 1} width=${w + 6} height="3" rx="1" fill=${frame}/>
  </g>`;
}
function House({ x, y, w = 60, h = 60, wall = '#F4E6C4', roof = '#C8453A', door = '#2F6F6A', chimney }) {
  const d = w * .24, dy = d * .45, rh = w * .5;
  const side = `M${x + w} ${y - h} L${x + w + d} ${y - h - dy} L${x + w + d} ${y - dy} L${x + w} ${y}Z`;
  const gable = `M${x - 1} ${y - h} L${x + w / 2} ${y - h - rh} L${x + w + 1} ${y - h}Z`;
  const roofSide = `M${x + w / 2} ${y - h - rh} L${x + w / 2 + d} ${y - h - rh - dy} L${x + w + 4 + d} ${y - h - dy} L${x + w + 4} ${y - h}Z`;
  const frame = shade(wall, -.42), ww = w * .22, wh = Math.min(h * .24, ww * 1.25);
  const dw = w * .26, dh = h * .42, dx = x + w * .14;
  return html`<g filter="url(#card)">
    ${chimney && html`<g><rect x=${x + w * .72 + d * .4} y=${y - h - rh * .95} width=${w * .13} height=${rh * .7} fill=${shade(roof, -.35)}/><rect x=${x + w * .7 + d * .4} y=${y - h - rh * .98} width=${w * .17} height="4" fill=${shade(roof, -.5)}/></g>`}
    <path d=${side} fill=${shade(wall, -.3)}/><path d=${side} fill="url(#brick)"/>
    <rect x=${x} y=${y - h} width=${w} height=${h} fill=${wall}/>
    <rect x=${x} y=${y - h} width=${w} height=${h} fill="url(#brick)"/>
    <rect x=${x} y=${y - h} width=${w} height=${h} fill="url(#hiTop)"/>
    <rect x=${x} y=${y - h} width=${w} height=${h} fill="url(#loBot)"/>
    <path d=${roofSide} fill=${shade(roof, -.14)}/><path d=${roofSide} fill="url(#shingle)"/>
    <path d=${gable} fill=${shade(wall, .06)}/>
    <path d=${`M${x - 5} ${y - h + 2} L${x + w / 2} ${y - h - rh - 2} L${x + w + 5} ${y - h + 2}`} fill="none" stroke=${roof} strokeWidth=${Math.max(5, w * .1)} strokeLinejoin="round" strokeLinecap="round"/>
    <circle cx=${x + w / 2} cy=${y - h - rh * .36} r=${w * .085 + 1.5} fill=${frame}/><circle cx=${x + w / 2} cy=${y - h - rh * .36} r=${w * .085} fill="url(#winG)"/>
    <${Win} x=${x + w * .14} y=${y - h + h * .12} w=${ww} h=${wh} frame=${frame} shutter=${h > 64 ? roof : null}/>
    <${Win} x=${x + w * .62} y=${y - h + h * .12} w=${ww} h=${wh} frame=${frame}/>
    <${Win} x=${x + w * .62} y=${y - h * .44} w=${ww} h=${wh} frame=${frame}/>
    <path d=${`M${dx} ${y} V${y - dh + dw / 2} A${dw / 2} ${dw / 2} 0 0 1 ${dx + dw} ${y - dh + dw / 2} V${y}Z`} fill=${door}/>
    <path d=${`M${dx} ${y} V${y - dh + dw / 2} A${dw / 2} ${dw / 2} 0 0 1 ${dx + dw} ${y - dh + dw / 2} V${y}Z`} fill="url(#hiLeft)"/>
    <circle cx=${dx + dw * .78} cy=${y - dh * .42} r="1.8" fill="#F2D58C"/>
    <rect x=${dx - 3} y=${y - 2} width=${dw + 6} height="3" fill=${shade(wall, -.5)}/>
  </g>`;
}
function ClockTower({ x, y, w = 80, h = 150 }) {
  const wall = '#F3E3BE', roof = '#2F6F6A', d = w * .24, dy = d * .45, rh = w * .95;
  const side = `M${x + w} ${y - h} L${x + w + d} ${y - h - dy} L${x + w + d} ${y - dy} L${x + w} ${y}Z`;
  const spire = `M${x - 5} ${y - h} L${x + w / 2} ${y - h - rh} L${x + w + 5} ${y - h}Z`;
  const spireSide = `M${x + w / 2} ${y - h - rh} L${x + w / 2 + d} ${y - h - rh - dy} L${x + w + 5 + d} ${y - h - dy} L${x + w + 5} ${y - h}Z`;
  const cx = x + w / 2, cy = y - h + w * .52, r = w * .33, frame = shade(wall, -.42);
  return html`<g filter="url(#card)">
    <path d=${side} fill=${shade(wall, -.3)}/><path d=${side} fill="url(#brick)"/>
    <rect x=${x} y=${y - h} width=${w} height=${h} fill=${wall}/>
    <rect x=${x} y=${y - h} width=${w} height=${h} fill="url(#brick)"/><rect x=${x} y=${y - h} width=${w} height=${h} fill="url(#loBot)"/>
    <rect x=${x - 4} y=${y - h - 2} width=${w + 8} height="8" fill=${shade(wall, -.3)}/>
    <path d=${spireSide} fill=${shade(roof, -.2)}/><path d=${spireSide} fill="url(#shingle)"/>
    <path d=${spire} fill=${roof}/><path d=${spire} fill="url(#shingle)"/><path d=${spire} fill="url(#hiLeft)"/>
    <path d=${`M${cx} ${y - h - rh} V${y - h - rh - 18}`} stroke="#6E531A" strokeWidth="2.5"/>
    <path d=${`M${cx} ${y - h - rh - 18} L${cx + 14} ${y - h - rh - 13} L${cx} ${y - h - rh - 8}Z`} fill="#C8453A"/>
    <circle cx=${cx} cy=${cy} r=${r + 5} fill="url(#brassR)"/>
    <circle cx=${cx} cy=${cy} r=${r} fill="#FFF8E7"/><circle cx=${cx} cy=${cy} r=${r} fill="url(#faceG)" opacity=".6"/>
    ${[...Array(12)].map((_, i) => { const a = i / 12 * 2 * Math.PI; return html`<circle key=${i} cx=${cx + (r - 4) * Math.sin(a)} cy=${cy - (r - 4) * Math.cos(a)} r=${i % 3 ? 1.1 : 2} fill="#6E531A"/>`; })}
    <path d=${`M${cx} ${cy} L${cx} ${cy - r * .62} M${cx} ${cy} L${cx + r * .45} ${cy + r * .2}`} stroke="#2B2A33" strokeWidth="2.6" strokeLinecap="round"/>
    <circle cx=${cx} cy=${cy} r="3" fill="#B5653A"/>
    <${Win} x=${x + w * .38} y=${y - h * .45} w=${w * .24} h=${w * .28} frame=${frame}/>
    <path d=${`M${x + w * .3} ${y} V${y - h * .16} A${w * .2} ${w * .2} 0 0 1 ${x + w * .7} ${y - h * .16} V${y}Z`} fill="#B5653A"/>
    <path d=${`M${x + w * .3} ${y} V${y - h * .16} A${w * .2} ${w * .2} 0 0 1 ${x + w * .7} ${y - h * .16} V${y}Z`} fill="url(#hiLeft)"/>
  </g>`;
}
function Cloud({ x, y, s = 1 }) {
  const D = 'M-48 14 Q-58 -4 -38 -8 Q-36 -28 -14 -24 Q-4 -41 16 -30 Q34 -35 38 -16 Q60 -14 52 6 Q58 19 40 18 L-40 18 Q-56 21 -48 14Z';
  const sp = [[-30, -4, 20], [-12, -15, -35], [6, -9, 60], [22, -3, -10], [-22, 6, 80], [10, 5, 30], [34, 4, -50], [-4, 1, 15], [-36, 8, -20], [20, -20, 40]];
  const cols = ['#C8453A', '#2F6F6A', '#B08D3C', '#8FB8C9', '#B5653A'];
  return html`<g transform=${`translate(${x} ${y}) scale(${s})`} filter="url(#card)">
    <path d=${D} fill="#F8EAD0"/><path d=${D} fill="url(#loBot)"/>
    ${sp.map(([a, b, r], i) => html`<rect key=${i} x=${a} y=${b} width="7" height="2.6" rx="1.3" fill=${cols[i % 5]} transform=${`rotate(${r} ${a} ${b})`}/>`)}
  </g>`;
}
function Tree({ x, y, s = 1, c = '#4E8A5B' }) {
  return html`<g transform=${`translate(${x} ${y}) scale(${s})`} filter="url(#card)">
    <path d="M-4 0 L-2.5 -30 L2.5 -30 L4 0Z" fill="#8A5A34"/>
    <circle cx="-11" cy="-30" r="13" fill=${shade(c, -.14)}/><circle cx="11" cy="-31" r="13" fill=${shade(c, -.08)}/>
    <circle cx="0" cy="-42" r="18" fill=${c}/>
    <circle cx="-6" cy="-48" r="7" fill=${shade(c, .22)} opacity=".75"/>
    <circle cx="7" cy="-36" r="2" fill="#C8453A"/><circle cx="-9" cy="-33" r="2" fill="#C8453A"/>
  </g>`;
}
function Bunting({ x1, y1, x2, y2, sag = 18, n = 9 }) {
  const cols = ['#C8453A', '#F2D58C', '#2F6F6A', '#8FB8C9', '#B5653A'];
  const pt = t => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + sag * 4 * t * (1 - t)];
  const flags = [];
  for (let i = 0; i < n; i++) { const [ax, ay] = pt((i + .12) / n), [bx, by] = pt((i + .88) / n);
    flags.push(html`<path key=${i} d=${`M${ax} ${ay} L${bx} ${by} L${(ax + bx) / 2} ${(ay + by) / 2 + 15}Z`} fill=${cols[i % 5]}/>`); }
  return html`<g filter="url(#card)"><path d=${`M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + 2 * sag} ${x2} ${y2}`} stroke="#6E531A" strokeWidth="1.6" fill="none"/>${flags}</g>`;
}
function LampPost({ x, y }) {
  return html`<g filter="url(#card)"><rect x=${x - 2} y=${y - 60} width="4" height="60" fill="#6E531A"/>
    <rect x=${x - 6} y=${y - 4} width="12" height="5" rx="2" fill="#6E531A"/>
    <circle cx=${x} cy=${y - 66} r="12" fill="#FFE9A8" opacity=".35"/>
    <path d=${`M${x - 7} ${y - 60} L${x + 7} ${y - 60} L${x + 5} ${y - 72} L${x - 5} ${y - 72}Z`} fill="url(#winG)"/>
    <path d=${`M${x - 8} ${y - 72} L${x + 8} ${y - 72} L${x} ${y - 79}Z`} fill="#B08D3C"/></g>`;
}
const HEDGE = (y, w) => { let d = `M-40 ${y + 40} L-40 ${y}`; for (let x = -40; x < w + 40; x += 36) d += ` Q${x + 18} ${y - 16} ${x + 36} ${y}`; return d + ` L${w + 40} ${y + 40}Z`; };
function PaperFilter({ id }) {
  return html`<filter id=${id} x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#5A3E14" floodOpacity=".32"/></filter>`;
}

/* ---------- header triangle ---------- */
function MiniTriangle({ active }) {
  const pts = { offender: [48, 12], target: [14, 62], guardian: [82, 62] };
  const col = { offender: '#C8453A', target: '#2F6F6A', guardian: '#B08D3C' };
  return html`<svg width="96" height="74" viewBox="0 0 96 74" role="img" aria-label=${`Crime triangle: ${active === 'all' ? 'all three corners' : active + ' corner'} active`}>
    <path d="M48 12 L14 62 L82 62 Z" fill="#FFF8E7" stroke="#2B2A33" strokeWidth="2" strokeLinejoin="round"/>
    ${Object.entries(pts).map(([k, [x, y]]) => {
      const on = active === k || active === 'all';
      return html`<g key=${k}>
        ${on && html`<circle cx=${x} cy=${y} r="13" fill=${col[k]} className="glow"/>`}
        <circle cx=${x} cy=${y} r="9" fill=${on ? col[k] : '#E4DAC2'} stroke="#2B2A33" strokeWidth="1.5"/>
        <text x=${x} y=${y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill=${on ? '#fff' : '#4A4552'} fontFamily="Georgia,serif">${k[0].toUpperCase()}</text>
      </g>`;})}
  </svg>`;
}
const HEADER_INFO = {
  note: ['none', 'Before you begin'], act1: ['offender', 'Act 1 · Offender'], act2: ['target', 'Act 2 · Target'],
  act3: ['guardian', 'Act 3 · Guardian'], map: ['all', 'Your CRAT Map'], discuss: ['all', 'Act 4 · Class Discussion'],
};
function GameHeader({ screen, onHome }) {
  const [active, label] = HEADER_INFO[screen] || ['none', ''];
  return html`<header className="topbar">
    <button className="backlink" onClick=${onHome}>← The CRAT Game</button>
    <div className="tri-wrap"><span className="tri-label">${label}</span><${MiniTriangle} active=${active}/></div>
  </header>`;
}

/* ---------- shared bits ---------- */
function Paper({ children, className = '', tilt = '', inner = '' }) {
  return html`<div className=${'pw ' + tilt + ' ' + className}><div className=${'paper ' + inner}>${children}</div></div>`;
}
function Callout({ c }) {
  return html`<div className="callout-wrap pw"><${Pin}/><div className="callout" role="note">
    <span className="label">CRAT Callout ${c.n}</span>
    <h3>${c.title}</h3><p className="measure">${c.text}</p></div></div>`;
}
function Choices({ options, picked, onPick, disabledIds = [] }) {
  return html`<div className="choices">${options.map(o => {
    const dis = picked != null || disabledIds.includes(o.id);
    const cls = 'choice' + (picked === o.id ? ' picked' : '') + ((picked != null && picked !== o.id) || disabledIds.includes(o.id) ? ' dim' : '');
    return html`<button key=${o.id} className=${cls} disabled=${dis} onClick=${() => onPick(o)} aria-pressed=${picked === o.id}>
      <span className="key" aria-hidden="true">${o.id}</span><span>${o.text}${disabledIds.includes(o.id) ? html`<span className="small muted"> (not available this time)</span>` : ''}</span></button>`;})}</div>`;
}
function ActTitle({ act, sub }) {
  return html`<div className="stack" style=${{ gap: '4px' }}>
    <span className="label">${sub}</span>
    <h1 style=${{ fontSize: 'clamp(34px,5vw,64px)' }}>${act}</h1></div>`;
}

/* =====================================================================
   LANDING
   ===================================================================== */
function LandingDiorama() {
  const ref = useParallax();
  return html`<div ref=${ref} aria-hidden="true" className="dio-frame"><svg className="diorama" viewBox="0 0 1200 270" preserveAspectRatio="xMidYMax slice">
    <g className="layer" style=${{ '--d': 3 }}>
      <rect x="-60" y="-40" width="1320" height="340" fill="url(#skyWarm)"/>
      <circle cx="1040" cy="66" r="44" fill="#F6CF6E" opacity=".25"/><circle cx="1040" cy="66" r="30" fill="url(#sunG)" filter="url(#card)"/>
      <${Cloud} x=${170} y=${66} s=${1.15}/><${Cloud} x=${840} y=${52} s=${.95}/><${Cloud} x=${470} y=${40} s=${.62}/>
      <path d="M-60 180 Q120 118 300 158 T640 138 T980 148 T1260 128 L1260 300 L-60 300Z" fill="#A8C2A0" filter="url(#card)"/>
      <path d="M-60 204 Q200 160 420 194 T860 180 T1260 190 L1260 300 L-60 300Z" fill="#8DB08F" filter="url(#card)"/>
    </g>
    <g className="layer" style=${{ '--d': 8 }}>
      <${Bunting} x1=${40} y1=${122} x2=${540} y2=${132} sag=${22} n=${12}/>
      <${Tree} x=${24} y=${236} s=${1.15}/>
      <${House} x=${50} y=${238} w=${64} h=${60} wall="#F6E7C6" roof="#C8453A" door="#2F6F6A"/>
      <${House} x=${150} y=${238} w=${56} h=${80} wall="#F1D7A2" roof="#2F6F6A" door="#C8453A" chimney=${true}/>
      <${Tree} x=${240} y=${240} s=${.9} c="#5E9A6A"/>
      <${House} x=${264} y=${238} w=${72} h=${56} wall="#EFD0BC" roof="#B5653A" door="#2F6F6A"/>
      <${House} x=${376} y=${238} w=${58} h=${72} wall="#DDEAE5" roof="#C8453A" door="#B08D3C" chimney=${true}/>
      <${ClockTower} x=${558} y=${240} w=${84} h=${148}/>
      <${House} x=${722} y=${238} w=${60} h=${66} wall="#F1D7A2" roof="#C8453A" door="#2F6F6A" chimney=${true}/>
      <${Tree} x=${814} y=${240} c="#4E8A5B"/>
      <${House} x=${838} y=${238} w=${66} h=${54} wall="#F6E7C6" roof="#2F6F6A" door="#C8453A"/>
      <${House} x=${942} y=${238} w=${56} h=${78} wall="#EFD0BC" roof="#B5653A" door="#2F6F6A"/>
      <${House} x=${1040} y=${238} w=${70} h=${58} wall="#DDEAE5" roof="#C8453A" door="#B08D3C" chimney=${true}/>
      <${Tree} x=${1160} y=${238} s=${1.1} c="#5E9A6A"/>
    </g>
    <g className="layer" style=${{ '--d': 14 }}>
      <${LampPost} x=${520} y=${250}/>
      <${Person} x=${470} y=${204} s=${.5} body="#2F6F6A" mood="smile" scarf="#F2D58C"/>
      <${Person} x=${700} y=${206} s=${.48} body="#C8453A" hair="#7A4A2A" face="#D9A57E" mood="smile"/>
      <${Gear} x=${412} y=${238} r=${24} teeth=${11} spin=${true}/>
      <${Gear} x=${446} y=${220} r=${14} teeth=${8} spin=${true} rev=${true} fill="#B5653A"/>
      <${Gear} x=${792} y=${240} r=${20} teeth=${10} spin=${true} rev=${true}/>
      <path d=${HEDGE(254, 1200)} fill="#2F6F6A" filter="url(#card)"/>
    </g>
  </svg></div>`;
}
function TileArtGame() {
  return html`<svg className="tile-art" viewBox="0 0 300 126" aria-hidden="true">
    <path d="M150 20 L62 110 L238 110 Z" fill="none" stroke="#B08D3C" strokeWidth="4" strokeDasharray="2 8" strokeLinecap="round"/>
    <${Person} x=${150} y=${4} s=${.62} body="#C8453A" hair="#3B3440"/>
    <${Person} x=${62} y=${64} s=${.62} body="#2F6F6A" mood="smile" face="#D9A57E"/>
    <${Person} x=${238} y=${64} s=${.62} body="#B08D3C" mood="smile" hair="#7A4A2A"/>
  </svg>`;
}
function TileArtQuiz() {
  return html`<svg className="tile-art" viewBox="0 0 300 126" aria-hidden="true">
    <rect x="92" y="16" width="120" height="96" rx="3" fill="#E6D6AE" transform="rotate(-6 150 60)" filter="url(#card)"/>
    <g transform="rotate(3 150 60)" filter="url(#card)">
      <rect x="92" y="14" width="120" height="96" rx="3" fill="#FFF8E7"/>
      ${[34, 58, 82].map((y, i) => html`<g key=${y}><circle cx="112" cy=${y} r="7.5" fill=${i === 1 ? '#C8453A' : '#3F8F4F'}/>
        <path d=${i === 1 ? `M108 ${y - 4} L116 ${y + 4} M116 ${y - 4} L108 ${y + 4}` : `M108 ${y} L111 ${y + 3} L117 ${y - 4}`} stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <rect x="126" y=${y - 3} width="66" height="6" rx="3" fill="#E1D2AC"/></g>`)}
    </g>
    <path d="M214 30 L236 96 L228 100 L206 34Z" fill="#B5653A" filter="url(#card)"/><path d="M236 96 L232 106 L228 100Z" fill="#2B2A33"/>
    <${Gear} x=${70} y=${90} r=${18} teeth=${9} spin=${true}/>
  </svg>`;
}
function Landing({ go }) {
  const L = GAME.landing;
  const [about, setAbout] = useState(false);
  return html`<main className="wrap stack" style=${{ gap: '22px', paddingTop: '28px' }}>
    <div className="stack" style=${{ gap: '10px' }}>
      <span className="label">Cyber Routine Activity Theory</span>
      <h1 className="hero-title">The <em>CRAT</em> Game</h1>
      <p className="tagline">${L.tagline}</p>
    </div>
    <${LandingDiorama}/>
    <div className="tiles">
      <div className="pw tile-wrap"><button className="tile" onClick=${() => go('note')}>
        <${TileArtGame}/><span className="tile-h"><span className="emoji" aria-hidden="true">${L.gameTile.emoji}</span>${L.gameTile.title}</span>
        <p className="muted">${L.gameTile.sub}</p></button></div>
      <div className="pw tile-wrap"><button className="tile" onClick=${() => go('quiz')}>
        <${TileArtQuiz}/><span className="tile-h"><span className="emoji" aria-hidden="true">${L.quizTile.emoji}</span>${L.quizTile.title}</span>
        <p className="muted">${L.quizTile.sub}</p></button></div>
    </div>
    <p className="cites">${L.cites}</p>
    <div style=${{ textAlign: 'center' }}><button className="linkish" onClick=${() => setAbout(true)}>About</button></div>
    ${about && html`<${About} onClose=${() => setAbout(false)}/>`}
  </main>`;
}
function About({ onClose }) {
  const btn = useRef(null);
  useEffect(() => { btn.current && btn.current.focus(); const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  return html`<div className="scrim" onClick=${e => e.target === e.currentTarget && onClose()}>
    <div className="modal pw" role="dialog" aria-modal="true" aria-labelledby="about-h"><div className="paper stack">
      <div className="row" style=${{ justifyContent: 'space-between' }}><h2 id="about-h" style=${{ fontSize: '2em' }}>About</h2>
        <button ref=${btn} className="btn btn-ghost" onClick=${onClose}>Close</button></div>
      <span className="label">References</span>
      <div className="refs">${READINGS.map(r => html`<p key=${r.key}>${r.full}</p>`)}</div>
    </div></div></div>`;
}

/* =====================================================================
   CONTENT NOTE
   ===================================================================== */
function ContentNote({ onBegin, onBack }) {
  const C = GAME.contentNote;
  return html`<main className="wrap" style=${{ paddingTop: '20px' }}>
    <${Paper} tilt="tilt-l"><div className="stack" style=${{ maxWidth: '62ch' }}>
      <span className="label">Content note</span>
      <h1 style=${{ fontSize: 'clamp(34px,4.5vw,56px)' }}>${C.title}</h1>
      <p style=${{ fontSize: '1.08em' }}>${C.text}</p>
      <div className="row"><button className="btn btn-brass" onClick=${onBegin}>Begin</button><button className="btn btn-ghost" onClick=${onBack}>Back</button></div>
    </div><//>
  </main>`;
}

/* =====================================================================
   ACT 1
   ===================================================================== */
function SceneJob({ ad }) {
  return html`<div className="row" style=${{ justifyContent: 'center', flexWrap: 'nowrap', gap: '8px' }}>
    <svg viewBox="-40 -30 80 110" style=${{ width: '28%', maxWidth: '130px', flex: 'none' }} aria-hidden="true"><${Person} mood="neutral"/></svg>
    <div className="adphone" role="img" aria-label=${'Job ad on a phone: ' + ad.join(' ')}>
      <div className="scr"><div className="bar">JOBS NEAR YOU</div>${ad.map((l, i) => html`<p key=${i} style=${{ fontWeight: i === 0 ? 700 : 400 }}>${l}</p>`)}
      <div style=${{ marginTop: '10px', background: '#C8453A', color: '#fff', borderRadius: '6px', textAlign: 'center', fontSize: '.8em', padding: '4px' }}>Apply now</div></div>
    </div></div>`;
}
function SceneCompound() {
  const ref = useParallax();
  return html`<div ref=${ref}><svg className="scene" viewBox="0 0 400 230" role="img" aria-label="A minibus drives through a barred gate into a grey paper compound on the coast">
    <g className="layer" style=${{ '--d': 3 }}>
      <rect x="-20" y="-20" width="440" height="270" fill="url(#skyWarm)"/>
      <${Cloud} x=${330} y=${34} s=${.55}/>
      <path d="M-20 94 Q100 86 200 94 T420 92 L420 170 L-20 170Z" fill="#5E8FA3" filter="url(#card)"/>
      <path d="M0 106 Q20 102 40 106 T80 106 T120 106 T160 106 T200 106 T240 106 T280 106 T320 106 T360 106 T400 106" stroke="#D4E6E2" strokeWidth="2" fill="none" opacity=".8"/>
      <g filter="url(#card)"><path d="M18 150 Q14 110 28 78 L32 79 Q22 112 26 150Z" fill="#8A5A34"/>
        <path d="M30 78 Q10 70 0 84 Q16 76 30 80Z M30 78 Q50 66 62 80 Q46 72 30 80Z M30 78 Q24 58 8 60 Q22 64 30 80Z M30 78 Q40 58 56 60 Q40 64 30 80Z" fill="#4E8A5B"/></g>
    </g>
    <g className="layer" style=${{ '--d': 7 }}>
      <g filter="url(#card)">
        <path d="M372 84 L386 78 L386 190 L372 196Z" fill="#7E796F"/>
        <path d="M40 84 L60 76 L100 84 L150 75 L200 83 L250 76 L300 84 L340 76 L372 84 L372 196 L40 196Z" fill="#A9A49A"/>
        <path d="M40 84 L60 76 L100 84 L150 75 L200 83 L250 76 L300 84 L340 76 L372 84 L372 196 L40 196Z" fill="url(#brick)"/>
        <path d="M40 84 L60 76 L100 84 L150 75 L200 83 L250 76 L300 84 L340 76 L372 84 L372 196 L40 196Z" fill="url(#hiTop)"/>
        ${[72, 112, 290, 330].map(x => html`<g key=${x}><rect x=${x} y="102" width="18" height="12" rx="2" fill="#5E5A53"/><path d=${`M${x + 6} 102 V114 M${x + 12} 102 V114`} stroke="#8C877E" strokeWidth="1.5"/></g>`)}
        <rect x="156" y="106" width="90" height="90" rx="3" fill="#6F6A61"/>
        <rect x="162" y="112" width="78" height="84" fill="#3E3B42"/>
        ${[0, 1, 2, 3, 4, 5, 6].map(i => html`<rect key=${i} x=${166 + i * 11} y="112" width="4" height="84" rx="2" fill="#9C978D"/>`)}
        <rect x="162" y="112" width="78" height="5" fill="#9C978D"/>
      </g>
    </g>
    <g className="layer" style=${{ '--d': 12 }}>
      <rect x="-20" y="192" width="440" height="50" fill="#CDBF9C" filter="url(#card)"/>
      <g className=${REDUCED ? '' : 'bus'} style=${REDUCED ? { transform: 'translateX(52px)' } : null}><g filter="url(#card)">
        <rect x="18" y="146" width="100" height="46" rx="10" fill="#F2D58C"/>
        <rect x="18" y="146" width="100" height="46" rx="10" fill="url(#hiTop)"/>
        <rect x="18" y="146" width="100" height="46" rx="10" fill="url(#loBot)"/>
        ${[28, 50, 72].map(x => html`<g key=${x}><rect x=${x} y="154" width="17" height="15" rx="3" fill="#8FB8C9"/><path d=${`M${x + 3} 166 L${x + 10} 157`} stroke="#fff" strokeWidth="2" opacity=".7"/></g>`)}
        <rect x="96" y="154" width="15" height="24" rx="3" fill="#8FB8C9"/>
        <rect x="18" y="176" width="100" height="5" fill="#B5653A"/>
        <circle cx="114" cy="184" r="3" fill="#FFF3C4"/>
        <circle cx="42" cy="193" r="9" fill="#3A3440"/><circle cx="42" cy="193" r="3.5" fill="url(#brassR)"/>
        <circle cx="96" cy="193" r="9" fill="#3A3440"/><circle cx="96" cy="193" r="3.5" fill="url(#brassR)"/>
      </g></g>
    </g></svg></div>`;
}
function SceneQuota() {
  const ref = useParallax();
  return html`<div ref=${ref}><svg className="scene" viewBox="0 0 400 230" role="img" aria-label="A brass quota board above rows of phone stands">
    <defs><${PaperFilter} id="qps"/><linearGradient id="brassG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D9BD72"/><stop offset="1" stopColor="#8E6F28"/></linearGradient></defs>
    <g className="layer" style=${{ '--d': 3 }}><rect width="400" height="230" fill="#9C978D"/><rect y="170" width="400" height="60" fill="#7E796F"/></g>
    <g className="layer" style=${{ '--d': 7 }} filter="url(#qps)">
      <rect x="80" y="18" width="240" height="110" rx="6" fill="url(#brassG)" stroke="#6E531A" strokeWidth="2"/>
      ${[[88,26],[312,26],[88,120],[312,120]].map(([x, y], i) => html`<circle key=${i} cx=${x} cy=${y} r="3" fill="#F4E3B0"/>`)}
      <text x="200" y="46" textAnchor="middle" fontFamily="Courier New,monospace" fontSize="14" fontWeight="700" fill="#2B2A33" letterSpacing="3">DAILY QUOTA</text>
      ${['2','0','0','0'].map((d, i) => html`<g key=${i}><rect x=${122 + i * 40} y="58" width="34" height="54" rx="3" fill="#2B2A33"/>
        <text x=${139 + i * 40} y="98" textAnchor="middle" fontFamily="Georgia,serif" fontSize="36" fill="#F2D58C">${d}</text></g>`)}
    </g>
    <g className="layer" style=${{ '--d': 12 }} filter="url(#qps)">
      ${[0,1,2,3,4,5,6,7].map(i => html`<g key=${i}><rect x=${22 + i * 46} y="150" width="34" height="8" fill="#5E5A53"/>
        <rect x=${29 + i * 46} y="128" width="20" height="30" rx="3" fill="#2B2A33"/><rect x=${31 + i * 46} y="131" width="16" height="22" rx="2" fill="#8FB8C9"/></g>`)}
      ${[0,1,2,3,4,5,6,7].map(i => html`<g key=${'b' + i}><rect x=${22 + i * 46} y="196" width="34" height="8" fill="#5E5A53"/>
        <rect x=${29 + i * 46} y="174" width="20" height="30" rx="3" fill="#2B2A33"/><rect x=${31 + i * 46} y="177" width="16" height="22" rx="2" fill="#8FB8C9"/></g>`)}
    </g></svg></div>`;
}
function TubeScene({ onDone }) {
  const [sent, setSent] = useState(REDUCED ? 2000 : 0);
  const [stage, setStage] = useState(REDUCED ? 3 : 0);
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => {
    if (REDUCED) { done.current(); return; }
    let raf; const t0 = performance.now();
    const tick = t => { const p = Math.min(1, (t - t0) / 1700); setSent(Math.round(2000 * p)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const a = setTimeout(() => setStage(1), 1900), b = setTimeout(() => setStage(2), 2700), c = setTimeout(() => { setStage(3); done.current(); }, 3400);
    return () => { cancelAnimationFrame(raf); clearTimeout(a); clearTimeout(b); clearTimeout(c); };
  }, []);
  const O = [122, 132];
  const targets = [[158, 58], [170, 120], [238, 50], [246, 96], [312, 44], [352, 132], [334, 62]];
  const running = stage < 3;
  const ga = Math.PI * (1 + sent / 2000);
  return html`<div className="stack" style=${{ gap: '12px' }}>
    <svg className="scene" viewBox="0 0 400 200" role="img" aria-label="A brass steam-powered message machine fires paper envelopes across a papercraft map of the world">
      <rect x="-10" y="-10" width="420" height="220" fill="#E6D4AC"/><rect x="-10" y="-10" width="420" height="220" fill="url(#brick)"/>
      <rect x="-10" y="176" width="420" height="34" fill="#9B7A45" filter="url(#card)"/>
      <rect x="114" y="10" width="280" height="166" rx="4" fill="#FFF6E2" filter="url(#card)" transform="rotate(-1 254 93)"/>
      <g transform="rotate(-1 254 93)">
        <rect x="120" y="16" width="268" height="154" rx="3" fill="#9CC3CF"/>
        <rect x="120" y="16" width="268" height="154" rx="3" fill="url(#hiTop)"/>
        ${[[140, 150], [200, 74], [280, 150], [370, 100]].map(([x, y], i) => html`<path key=${i} d=${`M${x} ${y} q5 -4 10 0 q5 4 10 0`} stroke="#E4F0F2" strokeWidth="1.6" fill="none"/>`)}
        <g filter="url(#card)">
          <path d="M134 44 Q152 24 186 30 Q200 42 190 58 Q176 72 162 80 Q148 72 140 62 Q128 54 134 44Z" fill="#B7C99B"/>
          <path d="M168 92 Q184 88 188 106 Q186 128 174 152 Q166 134 164 114 Q160 98 168 92Z" fill="#9FBF8E"/>
          <path d="M226 38 Q240 30 256 36 Q258 48 246 54 Q232 52 226 38Z" fill="#D8C38F"/>
          <path d="M230 64 Q254 60 264 74 Q266 98 252 124 Q242 112 236 94 Q226 80 230 64Z" fill="#E3C98F"/>
          <path d="M262 32 Q298 20 338 28 Q364 38 356 58 Q342 72 320 74 Q304 84 290 76 Q272 66 266 52 Q258 42 262 32Z" fill="#B7C99B"/>
          <path d="M306 76 Q316 80 314 94 Q306 90 304 82Z" fill="#9FBF8E"/>
          <path d="M326 122 Q346 112 364 120 Q372 134 358 146 Q340 148 328 140 Q320 130 326 122Z" fill="#E3C98F"/>
        </g>
        <path d="M309 86 Q340 96 358 132" stroke="#B5653A" strokeWidth="1.8" strokeDasharray="3 4" fill="none"/>
        <g transform="translate(372 36)" filter="url(#card)"><circle r="11" fill="#FFF6E2"/><path d="M0 -10 L3 0 L0 10 L-3 0Z" fill="#C8453A"/><path d="M-10 0 L0 -3 L10 0 L0 3Z" fill="#6E531A"/></g>
        <g filter="url(#card)"><circle cx="309" cy="84" r="5" fill="#C8453A"/><circle cx="358" cy="132" r="5" fill="#2F6F6A"/></g>
        <${PaperTag} x=${300} y=${94} w=${60} text="Compound" size=${9}/>
        <${PaperTag} x=${346} y=${142} w=${56} text="Brisbane" size=${9}/>
        ${[[124, 20], [384, 20], [124, 166], [384, 166]].map(([x, y], i) => html`<circle key=${i} cx=${x} cy=${y} r="3.5" fill="url(#brassR)"/>`)}
      </g>
      <g filter="url(#card)">
        <rect x="10" y="164" width="96" height="12" rx="3" fill="#6F4E22"/>
        <rect x="22" y="36" width="15" height="42" fill="#B5653A"/><rect x="18" y="32" width="23" height="7" rx="2" fill="#8A4A28"/>
        <rect x="16" y="68" width="76" height="98" rx="18" fill="#B08D3C"/>
        <rect x="16" y="68" width="76" height="98" rx="18" fill="url(#hiLeft)"/>
        <path d="M16 96 H92 M16 140 H92" stroke="#6E531A" strokeWidth="3"/>
        ${[24, 38, 52, 66, 80].map(x => html`<g key=${x}><circle cx=${x + 2} cy="92" r="1.8" fill="#F4E3B0"/><circle cx=${x + 2} cy="144" r="1.8" fill="#F4E3B0"/></g>`)}
        <path d="M92 124 H124 V140 H92Z" fill="#B5653A"/><path d="M92 124 H124 V140 H92Z" fill="url(#hiTop)"/>
        <rect x="104" y="121" width="5" height="22" rx="1.5" fill="#8A4A28"/><rect x="116" y="121" width="5" height="22" rx="1.5" fill="#8A4A28"/>
        <path d="M88 70 L104 52" stroke="#6E531A" strokeWidth="4" strokeLinecap="round"/><circle cx="105" cy="51" r="5" fill="#C8453A"/>
      </g>
      <g transform="translate(54 118)" filter="url(#card)">
        <circle r="19" fill="url(#brassR)"/><circle r="14.5" fill="#FFF8E7"/>
        ${[0, 1, 2, 3, 4].map(i => { const a = Math.PI * (1 + i / 4); return html`<circle key=${i} cx=${11 * Math.cos(a)} cy=${11 * Math.sin(a)} r="1.1" fill="#6E531A"/>`; })}
        <path d=${`M0 0 L${12 * Math.cos(ga)} ${12 * Math.sin(ga)}`} stroke="#C8453A" strokeWidth="2.5" strokeLinecap="round"/><circle r="2.5" fill="#6E531A"/>
      </g>
      ${running && !REDUCED && [0, 1, 2].map(i => html`<circle key=${i} className="steam" cx="30" cy="28" r=${8 + i * 2} fill="#FFF6E2" style=${{ animationDelay: (i * .5) + 's' }}/>`)}
      <${Gear} x=${16} y=${70} r=${12} teeth=${8} spin=${running} fill="#B5653A"/>
      <${Gear} x=${96} y=${164} r=${14} teeth=${9} spin=${running} rev=${true}/>
      ${targets.map(([tx, ty], i) => html`<g key=${i} className=${'env' + (running ? '' : ' stop')} style=${{ '--tx': (tx - O[0]) + 'px', '--ty': (ty - O[1]) + 'px', animationDelay: (i * .2) + 's', transformBox: 'view-box' }}>
        <rect x=${O[0] - 8} y=${O[1] - 6} width="16" height="11" rx="1.5" fill="#FFF8E7"/>
        <path d=${`M${O[0] - 8} ${O[1] - 6} L${O[0]} ${O[1]} L${O[0] + 8} ${O[1] - 6}`} stroke="#C9B98C" strokeWidth="1" fill="none"/>
        <circle cx=${O[0]} cy=${O[1]} r="2.3" fill="#C8453A"/></g>`)}
    </svg>
    <div className="counter" aria-live="polite">
      <div><b>${sent.toLocaleString('en-AU')}</b><span>sent</span></div>
      <div className=${stage >= 1 ? '' : 'off'}><b>${stage >= 1 ? 41 : '—'}</b><span>replies</span></div>
      <div className=${stage >= 2 ? '' : 'off'}><b>${stage >= 2 ? 4 : '—'}</b><span>long conversations</span></div>
    </div></div>`;
}
function Act1({ onDone }) {
  const S = GAME.act1;
  const [step, setStep] = useState(0);
  const [opener, setOpener] = useState(null); const [animDone, setAnimDone] = useState(false);
  const [moment, setMoment] = useState(null); const [story, setStory] = useState(null);
  const top = useRef(null);
  const next = () => { setStep(s => s + 1); setTimeout(() => top.current && top.current.scrollIntoView({ block: 'start' }), 0); };
  const scenes = [html`<${SceneJob} ad=${S.panels[0].ad}/>`, html`<${SceneCompound}/>`, html`<${SceneQuota}/>`];
  return html`<main className="wrap stack" ref=${top}>
    <${ActTitle} act=${S.title} sub=${S.role}/>
    ${step <= 2 && html`<${Paper} tilt=${step % 2 ? 'tilt-r' : 'tilt-l'}>
      <div className="panel-grid">
        <div role="button" tabIndex="-1" onClick=${next} style=${{ cursor: 'pointer' }}>${scenes[step]}</div>
        <div className="stack">
          <span className="label">Scene 1.1 · Panel ${step + 1} of 3</span>
          <p className="caption">${S.panels[step].caption}</p>
          <div className="row"><button className="btn btn-brass" onClick=${next}>${step < 2 ? 'Next' : 'Start the shift'}</button>
            <div className="dots" aria-hidden="true">${[0,1,2].map(i => html`<i key=${i} className=${i === step ? 'on' : ''}></i>`)}</div></div>
        </div></div><//>`}

    ${step === 3 && html`<${Paper}><div className="stack">
      <span className="label">Scene 1.2 · Choice</span><h2 style=${{ fontSize: '1.9em' }}>${S.opener.prompt}</h2>
      <p className="muted">${S.opener.context}</p>
      <${Choices} options=${S.opener.options} picked=${opener && opener.id} onPick=${setOpener}/>
      ${opener && html`<${TubeScene} onDone=${() => setAnimDone(true)}/>`}
      ${opener && animDone && html`<div className="stack">
        <p style=${{ fontWeight: 700 }}>${S.opener.animLine}</p>
        <p className="feedback">${opener.feedback}</p>
        <div><button className="btn btn-brass" onClick=${next}>Continue</button></div></div>`}
    </div><//>`}

    ${step === 4 && html`<${Paper} tilt="tilt-r"><div className="stack">
      <span className="label">Scene 1.3 · Choice</span><h2 style=${{ fontSize: '1.9em' }}>${S.moment.prompt}</h2>
      <${Choices} options=${S.moment.options} picked=${moment && moment.id} onPick=${setMoment}/>
      ${moment && html`<div className="stack"><p className="feedback">${moment.result}</p><div><button className="btn btn-brass" onClick=${next}>Continue</button></div></div>`}
    </div><//>`}

    ${step === 5 && html`<${Paper}><div className="stack">
      <span className="label">Scene 1.4 · Choice</span><h2 style=${{ fontSize: '1.9em' }}>${S.story.prompt}</h2>
      <${Choices} options=${S.story.options} picked=${story && story.id} onPick=${setStory}/>
      ${story && html`<div className="stack"><p className="feedback"><b>${S.story.labelPrefix}</b> ${story.label}.</p><div><button className="btn btn-brass" onClick=${next}>Continue</button></div></div>`}
    </div><//>`}

    ${step <= 5 && html`<${VivaStrip} caption="The scam’s target finder is always turning: Value, Inertia, Visibility and Access decide who is a suitable target."/>`}
    ${step === 6 && html`<div className="stack" style=${{ gap: '26px' }}>
      <${Callout} c=${S.callout}/>
      <div className="night"><svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" style=${{ flex: 'none' }}><path d="M24 4 A14 14 0 1 0 32 26 A11 11 0 1 1 24 4Z" fill="#F2D58C"/></svg>
        <p><b>2:14 a.m.</b> ${S.transition}</p></div>
      <${Paper} inner="teal"><${VivaStrip} fast=${true} caption="In Brisbane, one phone lights up. The target’s VIVA gears start to turn."/><//>
      <div><button className="btn btn-brass" onClick=${() => onDone({ opener: opener.id, moment: moment.id, story: story.id })}>Continue to Act 2</button></div>
    </div>`}
  </main>`;
}

/* =====================================================================
   ACT 2
   ===================================================================== */
const GEAR_NAMES = { value: 'Value', inertia: 'Inertia', visibility: 'Visibility', access: 'Access' };
const VIVA_COL = { value: '#B08D3C', inertia: '#B5653A', visibility: '#2F6F6A', access: '#C8453A' };
function VivaGear({ x, y, r, k, rot = 0, spin = 'slow', rev, hot }) {
  const c = VIVA_COL[k];
  return html`<g transform=${`translate(${x} ${y})`} filter="url(#card)">
    ${hot && html`<circle r=${r + 7} fill="#F6CF6E" opacity=".5" className="glow"/>`}
    <g className=${spin ? 'spin ' + spin + (rev ? ' rev' : '') : ''}>
      <g className="gear-rot" style=${{ transform: `rotate(${rot}deg)` }}>
        <path d=${gearD(r, 10, r * .26)} fill=${c}/>
        <path d=${gearD(r, 10, r * .26)} fill="url(#hiTop)"/>
        <circle r=${r * .6} fill=${shade(c, .35)}/>
        ${[0, 60, 120].map(a => html`<rect key=${a} x=${-r * .08} y=${-r * .58} width=${r * .16} height=${r * 1.16} rx=${r * .06} fill=${shade(c, -.12)} transform=${`rotate(${a})`}/>`)}
        <circle r=${r * .26} fill="url(#brassR)"/><circle r=${r * .08} fill="#3A2F1A"/>
      </g></g></g>`;
}
function PaperTag({ x, y, w, text, size = 11 }) {
  return html`<g filter="url(#card)"><rect x=${x - w / 2} y=${y} width=${w} height=${size + 9} rx="3" fill="#FFF6E2"/>
    <circle cx=${x - w / 2 + 5} cy=${y + (size + 9) / 2} r="1.6" fill="#B08D3C"/>
    <text x=${x + 2} y=${y + size + 3} textAnchor="middle" fontSize=${size} fontWeight="700" fill="#2B2A33" fontFamily="Alegreya,Georgia,serif">${text}</text></g>`;
}
function VivaStrip({ caption, fast }) {
  const ks = ['value', 'inertia', 'visibility', 'access'];
  return html`<figure className="viva-strip" aria-label=${caption + ' Gears: Value, Inertia, Visibility, Access.'}>
    <svg viewBox="0 0 400 118" aria-hidden="true">
      <rect x="18" y="44" width="364" height="10" rx="5" fill="#8A6A2A" filter="url(#card)"/>
      ${ks.map((k, i) => html`<g key=${k}><${VivaGear} x=${62 + i * 92} y=${48} r=${36} k=${k} spin=${fast ? 'fast' : 'slow'} rev=${i % 2 === 1}/>
        <${PaperTag} x=${62 + i * 92} y=${92} w=${80} text=${GEAR_NAMES[k]} size=${13}/></g>`)}
    </svg>
    <figcaption className="small muted">${caption}</figcaption></figure>`;
}
function Meters({ suit, guard, gears, exploit }) {
  const ang = -90 + suit * 18;
  const pos = { value: [40, 146], inertia: [100, 152], visibility: [160, 152], access: [220, 146] };
  return html`<div className="meters">
    <svg viewBox="0 -24 260 222" role="img" aria-label=${`Target suitability ${suit} out of 10`}>
      <defs><linearGradient id="dialG" x1="0" x2="1"><stop offset="0" stopColor="#3F8F4F"/><stop offset=".5" stopColor="#E3C067"/><stop offset="1" stopColor="#C8453A"/></linearGradient></defs>
      <${PaperTag} x=${130} y=${-22} w=${150} text="Target suitability" size=${12}/>
      <g filter="url(#card)">
        <path d="M22 110 A108 108 0 0 1 238 110 Z" fill="url(#brassR)"/>
        <path d="M32 108 A98 98 0 0 1 228 108 Z" fill="#FFF6E2"/>
        <path d="M42 104 A88 88 0 0 1 218 104" fill="none" stroke="url(#dialG)" strokeWidth="13" strokeLinecap="round"/>
      </g>
      ${[0, 2, 4, 6, 8, 10].map(v => { const a = Math.PI * (1 + v / 10); return html`<text key=${v} x=${130 + 64 * Math.cos(a)} y=${104 + 64 * Math.sin(a) + 4} textAnchor="middle" fontSize="10" fill="#4A4552" fontFamily="Georgia,serif">${v}</text>`; })}
      <g className="needle" style=${{ transform: `rotate(${ang}deg)`, transformOrigin: '130px 104px', transformBox: 'view-box' }} filter="url(#card)">
        <path d="M126 104 L130 30 L134 104Z" fill="#B5653A"/></g>
      <circle cx="130" cy="104" r="9" fill="url(#brassR)"/>
      <text x="130" y="127" textAnchor="middle" fontSize="14" fontWeight="700" fill="#2B2A33" fontFamily="Georgia,serif">${suit} / 10</text>
      ${Object.entries(pos).map(([k, [x, y]], i) => html`<g key=${k}>
        <${VivaGear} x=${x} y=${y} r=${19} k=${k} rot=${gears[k] * 60} rev=${i % 2 === 1} hot=${exploit[k] > 0}/>
        <${PaperTag} x=${x} y=${y + 24} w=${54} text=${GEAR_NAMES[k]} size=${10}/></g>`)}
    </svg>
    <svg className="lamp" viewBox="0 0 120 170" role="img" aria-label=${`Self-guardianship lamp at ${guard} out of 10`}>
      <defs><radialGradient id="lampG"><stop offset="0" stopColor="#FFE9A8" stopOpacity="1"/><stop offset="1" stopColor="#FFE9A8" stopOpacity="0"/></radialGradient></defs>
      <${PaperTag} x=${60} y=${2} w=${96} text="Self-guard" size=${11}/>
      <circle cx="60" cy="72" r="54" fill="url(#lampG)" className="lampglow" opacity=${.1 + guard / 10 * .9}/>
      <g filter="url(#card)">
        <path d="M40 72 A20 20 0 1 1 80 72 Q76 86 72 94 L48 94 Q44 86 40 72Z" fill=${guard >= 5 ? '#FFF1BF' : '#EDE3C8'}/>
        <path d="M40 72 A20 20 0 1 1 80 72 Q76 86 72 94 L48 94 Q44 86 40 72Z" fill="url(#hiLeft)"/>
        <path d="M52 84 Q56 70 60 84 Q64 70 68 84" stroke=${guard >= 3 ? '#C8453A' : '#A9A49A'} strokeWidth="2" fill="none"/>
        <rect x="46" y="94" width="28" height="18" rx="3" fill="url(#brassR)"/>
        <path d="M46 100 H74 M46 106 H74" stroke="#6E531A" strokeWidth="1.2"/>
        <rect x="30" y="130" width="60" height="22" rx="4" fill="#3A3440"/>
      </g>
      <text x="60" y="146" textAnchor="middle" fontSize="14" fill="#F2D58C" fontFamily="Courier New,monospace">${guard} / 10</text>
    </svg></div>`;
}
function SiteThumb() {
  return html`<div className="media" role="img" aria-label="A fake delivery web page asking for details and card payment"><svg viewBox="0 0 150 110" style=${{ width: '190px', height: '140px' }}>
    <rect width="150" height="110" rx="6" fill="#FFFFFF"/><rect width="150" height="18" rx="6" fill="#E3C067"/><rect y="12" width="150" height="6" fill="#E3C067"/>
    <text x="8" y="13" fontSize="8" fontWeight="700" fill="#2B2A33" fontFamily="Georgia,serif">PARCEL DEPOT</text>
    <text x="8" y="32" fontSize="7.5" fill="#2B2A33" fontFamily="Georgia,serif">Redelivery fee: $2.99</text>
    ${['Full name', 'Address', 'Date of birth', 'Card number'].map((l, i) => html`<g key=${l}><text x="8" y=${46 + i * 15} fontSize="6" fill="#6F6A61" fontFamily="Georgia,serif">${l}</text>
      <rect x="54" y=${40 + i * 15} width="86" height="9" rx="2" fill="#F3EEE3" stroke="#D9D2C4"/></g>`)}
    <rect x="54" y="98" width="86" height="9" rx="3" fill="#C8453A"/><text x="97" y="105" textAnchor="middle" fontSize="6" fill="#fff" fontFamily="Georgia,serif">PAY NOW</text></svg></div>`;
}
function PrizeCard() {
  return html`<div className="media" role="img" aria-label="A shiny $500 gift card image"><svg viewBox="0 0 150 94" style=${{ width: '170px', height: '106px' }}>
    <rect width="150" height="94" rx="10" fill="#C8453A"/><rect width="150" height="94" rx="10" fill="url(#hiTop)"/>
    <circle cx="124" cy="22" r="30" fill="#F2D58C" opacity=".35"/>
    <text x="12" y="30" fontSize="11" fill="#FFF8E7" fontFamily="Georgia,serif" fontWeight="700">GIFT CARD</text>
    <text x="12" y="70" fontSize="30" fill="#FFF8E7" fontFamily="Georgia,serif" fontWeight="700">$500</text>
    <path d="M110 60 l6 -12 l6 12 l-6 12Z" fill="#F2D58C"/></svg></div>`;
}
function msgView(m, i, defaultWho) {
  if (m.type === 'sys') return html`<div key=${i} className="sys">${m.text}</div>`;
  if (m.type === 'act') return html`<div key=${i} className="act">${m.text}</div>`;
  if (m.type === 'note') return html`<div key=${i} className="act" style=${{ background: '#F6DDD5', borderColor: '#C8453A' }}>⚠ ${m.text}</div>`;
  if (m.type === 'photos') return html`<${PhotosThumbs} key=${i}/>`;
  if (m.type === 'shot') return html`<${CryptoShot} key=${i}/>`;
  if (m.type === 'site') return html`<${SiteThumb} key=${i}/>`;
  if (m.type === 'prize') return html`<${PrizeCard} key=${i}/>`;
  if (m.type === 'code') return html`<div key=${i} className="msg in"><span className="who">Text message</span>Your one-time code is 481 207. Do not share this code with anyone, including bank staff.</div>`;
  if (m.type === 'priya') return html`<div key=${i} className="msg priya"><span className="who">Priya</span>${m.text}</div>`;
  if (m.type === 'out') return html`<div key=${i} className="msg out"><span className="who">You (Alex)</span>${m.text}</div>`;
  return html`<div key=${i} className="msg in"><span className="who">${m.who || defaultWho}</span>${m.text}${m.time ? html`<span className="tm">${m.time}</span>` : ''}</div>`;
}
function TriNode({ x, y, fill, lines, r = 39, size = 17 }) {
  return html`<g filter="url(#card)"><circle cx=${x} cy=${y} r=${r + 5} fill="#FFF6E2"/><circle cx=${x} cy=${y} r=${r} fill=${fill}/><circle cx=${x} cy=${y} r=${r} fill="url(#hiTop)"/>
    ${lines.map((l, i) => html`<text key=${i} x=${x} y=${y + size * .35 - (lines.length - 1) * size * .53 + i * size * 1.06} textAnchor="middle" fontSize=${size} fontWeight="700" fill="#FFFFFF" fontFamily="Alegreya,Georgia,serif">${l}</text>`)}</g>`;
}
function MapTriangle() {
  return html`<svg viewBox="0 0 440 300" style=${{ width: '100%', maxWidth: '460px', margin: '0 auto', display: 'block' }} role="img" aria-label="Crime triangle with Offender, Target and Guardian corners">
    <path d="M220 62 L96 238 L344 238 Z" fill="#FFF6E2" filter="url(#card)"/>
    <path d="M220 74 L108 232 L332 232 Z" fill="#F4E3BE"/>
    <path d="M220 74 L108 232 L332 232 Z" fill="url(#hiTop)"/>
    <path d="M220 74 L108 232 L332 232 Z" fill="none" stroke="#B08D3C" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round"/>
    <${Gear} x=${220} y=${178} r=${24} teeth=${11} spin=${true}/>
    <${Gear} x=${250} y=${156} r=${13} teeth=${8} spin=${true} rev=${true} fill="#B5653A"/>
    <${TriNode} x=${220} y=${62} fill="#B0392F" lines=${['Offender']}/>
    <${TriNode} x=${96} y=${238} fill="#2A635F" lines=${['Target']}/>
    <${TriNode} x=${344} y=${238} fill="#6E531A" lines=${['Guardian']} size=${15}/>
  </svg>`;
}
function PhotosThumbs() {
  return html`<div className="media" aria-label="Two drawn photos: a wine cellar and a sports car" role="img">
    <svg viewBox="0 0 110 80"><rect width="110" height="80" fill="#5A3A2A"/>
      ${[10, 42, 74].map(x => html`<path key=${x} d=${`M${x} 80 L${x} 30 Q${x + 13} 12 ${x + 26} 30 L${x + 26} 80Z`} fill="#3A2418"/>`)}
      ${[0,1,2,3,4,5,6,7,8].map(i => html`<circle key=${i} cx=${16 + (i % 3) * 7 + Math.floor(i / 3) * 32} cy=${48 + (i % 2) * 10} r="3" fill="#8B1E2B"/>`)}</svg>
    <svg viewBox="0 0 110 80"><rect width="110" height="80" fill="#8FB8C9"/><rect y="56" width="110" height="24" fill="#6F6A61"/>
      <path d="M12 56 Q16 40 36 38 L52 28 L78 28 L92 40 Q102 42 100 56Z" fill="#C8453A" stroke="#2B2A33"/>
      <path d="M54 32 L76 32 L86 40 L50 40Z" fill="#D4E6E2"/><circle cx="32" cy="58" r="8" fill="#2B2A33"/><circle cx="84" cy="58" r="8" fill="#2B2A33"/></svg>
  </div>`;
}
function CryptoShot() {
  return html`<div className="media" role="img" aria-label="A screenshot of an app showing big profits"><svg viewBox="0 0 110 80" style=${{ width: '160px', height: '116px' }}>
    <rect width="110" height="80" fill="#1F2A30"/><text x="8" y="14" fontSize="8" fill="#9FB3BA" fontFamily="Courier New,monospace">PORTFOLIO</text>
    <text x="8" y="28" fontSize="12" fill="#7FE0A0" fontFamily="Georgia,serif" fontWeight="700">+184%</text>
    <path d="M6 70 L20 64 L32 66 L46 54 L58 56 L72 40 L86 36 L104 16" stroke="#7FE0A0" strokeWidth="2" fill="none"/>
    <path d="M6 70 L20 64 L32 66 L46 54 L58 56 L72 40 L86 36 L104 16 L104 76 L6 76Z" fill="#7FE0A0" opacity=".15"/></svg></div>`;
}
function VideoBackdrop({ scene }) {
  if (scene === 'beach') return html`<g>
    <rect width="400" height="300" fill="url(#skyWarm)"/>
    <circle cx="332" cy="58" r="30" fill="#F6CF6E" opacity=".3"/><circle cx="332" cy="58" r="20" fill="url(#sunG)" filter="url(#card)"/>
    <${Cloud} x=${86} y=${44} s=${.7}/>
    <path d="M-10 128 Q100 120 200 128 T410 126 L410 196 L-10 196Z" fill="#3E8FA3" filter="url(#card)"/>
    <path d="M-10 150 Q100 142 200 150 T410 148 L410 200 L-10 200Z" fill="#5FB3C2"/>
    ${[[30, 140], [150, 160], [300, 136], [360, 164]].map(([x, y], i) => html`<path key=${i} d=${`M${x} ${y} q6 -5 12 0 q6 5 12 0`} stroke="#E4F4F6" strokeWidth="2" fill="none"/>`)}
    <path d="M-10 186 Q120 170 240 184 T410 178 L410 310 L-10 310Z" fill="#F1D9A0" filter="url(#card)"/>
    <path d="M-10 196 Q120 182 240 194 T410 188" stroke="#FFF6E2" strokeWidth="4" fill="none" opacity=".8"/>
    <g filter="url(#card)"><path d="M36 250 Q30 190 52 140 L58 142 Q40 192 46 250Z" fill="#8A5A34"/>
      <path d="M55 140 Q28 124 8 142 Q30 132 56 144Z M55 140 Q86 118 108 136 Q82 128 56 144Z M55 140 Q48 108 20 106 Q44 114 56 144Z M55 140 Q70 106 96 104 Q72 116 56 144Z" fill="#4E8A5B"/>
      <circle cx="52" cy="146" r="4" fill="#6B4A2A"/><circle cx="60" cy="148" r="4" fill="#6B4A2A"/></g>
    <g filter="url(#card)"><path d="M356 262 Q362 206 346 168 L352 166 Q370 206 366 262Z" fill="#8A5A34"/>
      <path d="M349 166 Q322 150 300 164 Q326 158 350 170Z M349 166 Q380 146 400 160 Q376 156 350 170Z M349 166 Q346 136 320 132 Q342 142 350 170Z" fill="#5E9A6A"/></g>
    <g filter="url(#card)"><path d="M300 236 L340 236 L320 206Z" fill="#C8453A"/><path d="M320 206 L320 244" stroke="#6E531A" strokeWidth="2"/></g>
  </g>`;
  return html`<g>
    <rect width="400" height="300" fill="#E8D7B4"/><rect width="400" height="300" fill="url(#brick)"/>
    <g filter="url(#card)"><rect x="276" y="36" width="92" height="80" rx="4" fill="#FFF6E2"/><rect x="282" y="42" width="80" height="68" fill="#9CC3CF"/>
      <path d="M322 42 V110 M282 76 H362" stroke="#FFF6E2" strokeWidth="4"/></g>
    <g filter="url(#card)"><rect x="18" y="96" width="96" height="8" fill="#8A5A34"/>
      ${[26, 42, 58, 74, 90].map((x, i) => html`<g key=${x}><rect x=${x} y="62" width="10" height="34" rx="3" fill=${i % 2 ? '#6B1E2B' : '#8B2A38'}/><rect x=${x + 3} y="54" width="4" height="10" fill="#3A2418"/></g>`)}</g>
    <rect y="236" width="400" height="64" fill="#B89B6A" filter="url(#card)"/>
  </g>`;
}
function Face({ lipOpen, blink, glitch, turn, shimmer, hat }) {
  const head = 'M-62 -6 Q-64 -80 0 -82 Q64 -80 62 -6 Q60 56 0 80 Q-60 56 -62 -6Z';
  return html`<g transform="translate(200 150)">
    <g className=${turn ? 'turn' : ''} style=${{ transformBox: 'fill-box', transformOrigin: 'center' }}>
      <g filter="url(#card)">
        <path d="M-104 160 Q-100 88 -30 78 L30 78 Q100 88 104 160Z" fill="#FFF6E2" stroke="#FFF6E2" strokeWidth="8" strokeLinejoin="round"/>
        <path d="M-104 160 Q-100 88 -30 78 L30 78 Q100 88 104 160Z" fill=${hat ? '#F3E3BE' : '#3E6F7A'}/>
        <path d="M-104 160 Q-100 88 -30 78 L30 78 Q100 88 104 160Z" fill="url(#hiLeft)"/>
        ${hat && html`<path d="M-30 80 L0 118 L30 80Z" fill="#2F6F6A"/>`}
        <path d="M-14 62 H14 V86 Q0 94 -14 86Z" fill="#DDB08C"/>
        <path d=${head} fill="#FFF6E2" stroke="#FFF6E2" strokeWidth="8" strokeLinejoin="round"/>
        <ellipse cx="-62" cy="0" rx="10" ry="16" fill="#E2B892"/><ellipse cx="62" cy="0" rx="10" ry="16" fill="#E2B892"/>
        <path d=${head} fill="#F0CDA8"/>
        <path d=${head} fill="url(#faceG)"/>
        <ellipse cx="-20" cy="-34" rx="30" ry="18" fill="#fff" opacity=".28"/>
        ${!hat && html`<path d="M-64 -14 Q-62 -90 0 -88 Q62 -90 64 -14 Q54 -56 0 -58 Q-54 -56 -64 -14Z" fill="#4A3432"/>`}
        ${hat && html`<g>
          <path d="M-66 -40 Q-66 -110 0 -112 Q66 -110 66 -40Z" fill="#9A3027"/>
          <path d="M-66 -40 Q-66 -110 0 -112 Q66 -110 66 -40Z" fill="url(#hiLeft)"/>
          <rect x="-66" y="-54" width="132" height="14" fill="#2B2A33"/>
          <path d="M-104 -34 Q0 -60 104 -34 Q0 -20 -104 -34Z" fill="#B0392F"/>
          <path d="M-104 -34 Q0 -60 104 -34 Q0 -20 -104 -34Z" fill="url(#loBot)"/>
          <circle cx="40" cy="-47" r="6" fill="#F2D58C"/></g>`}
        <circle cx="-34" cy="22" r="11" fill="#E8836F" opacity=".35"/><circle cx="34" cy="22" r="11" fill="#E8836F" opacity=".35"/>
        ${blink ? html`<path d="M-32 -6 Q-22 -2 -12 -6 M12 -6 Q22 -2 32 -6" stroke="#2B2A33" strokeWidth="3.5" fill="none" strokeLinecap="round"/>`
          : html`<g><ellipse cx="-22" cy="-6" rx="9" ry="7.5" fill="#FFFDF6"/><ellipse cx="22" cy="-6" rx="9" ry="7.5" fill="#FFFDF6"/>
            <circle cx="-22" cy="-5" r="4.6" fill="#2B2A33"/><circle cx="22" cy="-5" r="4.6" fill="#2B2A33"/>
            <circle cx="-20.5" cy="-7" r="1.6" fill="#fff"/><circle cx="23.5" cy="-7" r="1.6" fill="#fff"/></g>`}
        <path d="M-32 -22 Q-22 -27 -12 -22 M12 -22 Q22 -27 32 -22" stroke="#6B4A3A" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M-3 4 Q-6 18 2 20" stroke="#C99A78" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <ellipse cx="0" cy="40" rx="17" ry=${lipOpen ? 9 : 3} fill="#A0524A" style=${{ transition: 'ry .12s' }}/>
        ${lipOpen && html`<ellipse cx="0" cy="36" rx="10" ry="2.2" fill="#FFF6E2"/>`}
      </g>
      <path d="M-58 22 Q-44 70 0 78 Q44 70 58 22" fill="none" stroke="#C6E6F2" strokeWidth="6" strokeLinecap="round" opacity=${shimmer ? 1 : 0} className=${shimmer ? 'shimmer' : ''}/>
      ${glitch && html`<g className="glitch"><rect x="-72" y="14" width="144" height="11" fill="#8FB8C9" opacity=".65"/><rect x="-62" y="44" width="124" height="8" fill="#C8453A" opacity=".45"/><rect x="-68" y="-30" width="54" height="9" fill="#F0CDA8"/><rect x="10" y="60" width="50" height="6" fill="#F6CF6E" opacity=".6"/></g>`}
    </g></g>`;
}
function VideoCall({ mode, onEnd, cfg }) {
  const C = cfg;
  const [t, setT] = useState(0);
  const endRef = useRef(onEnd); endRef.current = onEnd;
  useEffect(() => {
    if (mode !== 'call') return;
    const id = setInterval(() => setT(v => v + .25), 250);
    return () => clearInterval(id);
  }, [mode]);
  useEffect(() => { if (mode === 'call' && t >= C.seconds) endRef.current(); }, [t]);
  const cap = C.captions.filter(c => c[0] <= t).slice(-1)[0];
  const since = cap ? t - cap[0] : 99;
  const lipOpen = since > .75 && since < 3.2 && Math.floor(t * 4) % 2 === 0;
  const shimmer = t >= C.handAt && t < C.handAt + 1.6;
  const blink = t >= C.blinkAt && t < C.blinkAt + .25;
  const left = Math.max(0, Math.ceil(C.seconds - t));
  return html`<div className="stack" style=${{ gap: '10px' }}>
    <div className="video" role="img" aria-label=${C.scene === 'beach' ? 'A staged winner video on a tropical beach, with a papercraft face in a red sun hat that is slightly too smooth' : 'A staged video call with a papercraft face that is slightly too smooth'}>
      <svg viewBox="0 0 400 300"><${VideoBackdrop} scene=${C.scene}/>
        <${Face} hat=${C.scene === 'beach'} lipOpen=${mode === 'call' && lipOpen} blink=${blink} shimmer=${mode === 'call' && shimmer} turn=${mode === 'turn'} glitch=${mode === 'turn'}/>
        ${mode === 'call' && t >= C.handAt && t < C.handAt + 1.8 && html`<g className=${REDUCED ? '' : 'hand'} style=${{ transformBox: 'view-box' }}>
          <path d="M0 250 Q20 180 50 190 L60 140 Q66 130 72 140 L70 190 L84 130 Q90 122 96 132 L88 196 L104 150 Q110 142 116 152 L104 210 Q98 250 70 262Z" fill="#E2B892" opacity=".97" filter="url(#card)"/></g>`}
      </svg>
      <div className="vtop"><span><span className="rec"></span>${mode === 'call' ? C.label : C.label + ' · replay'}</span><span>${mode === 'call' ? `0:${String(left).padStart(2, '0')}` : ''}</span></div>
      ${mode === 'call' && cap && html`<div className="vcap" aria-live="polite">${C.speaker}: ${cap[1]}</div>`}
    </div>
    ${mode === 'call' && html`<div className="stack" style=${{ gap: '10px' }}><p className="small muted">${C.signs}</p>
      <div><button className="btn btn-ghost" onClick=${() => endRef.current()}>${C.skipLabel || 'Skip to the end of the call'}</button></div></div>`}
  </div>`;
}
function ReverseSearch() {
  return html`<div className="row" role="img" aria-label="Reverse image search: Daniel's photo matches a stock model's profile" style=${{ gap: '10px', flexWrap: 'nowrap' }}>
    <svg viewBox="0 0 100 100" style=${{ width: '90px', flex: 'none' }}><rect width="100" height="100" rx="6" fill="#2A3A40"/>
      <circle cx="50" cy="42" r="20" fill="#F0D8BE"/><path d="M30 38 Q32 18 50 18 Q68 18 70 38 Q62 28 50 28 Q38 28 30 38Z" fill="#3B3440"/><path d="M16 100 Q20 66 50 66 Q80 66 84 100Z" fill="#3E5C66"/></svg>
    <span style=${{ fontSize: '1.6em' }} aria-hidden="true">→</span>
    <div style=${{ background: '#fff', border: '1px solid rgba(43,42,51,.2)', borderRadius: '8px', padding: '8px', flex: 1, minWidth: 0 }}>
      <span className="label" style=${{ color: '#9A3027' }}>Match found</span>
      <div className="row" style=${{ gap: '6px', flexWrap: 'nowrap', marginTop: '4px' }}>
        <svg viewBox="0 0 60 60" style=${{ width: '52px', flex: 'none' }}><rect width="60" height="60" fill="#D9CCAA"/><circle cx="30" cy="24" r="12" fill="#7E796F"/><path d="M8 60 Q10 38 30 38 Q50 38 52 60Z" fill="#7E796F"/></svg>
        <span className="small">Stock model profile · same photos</span></div></div></div>`;
}

function computeEnding(picks) {
  if (picks.D1 === 'C') return 'protected';
  if (picks.D5 !== 'A') return 'protected';
  return null; // decided with guard below
}
function Act2({ onDone, opener = 'A' }) {
  const S = GAME.act2, R = S.routes[opener] || S.routes.A, D = R.decisions;
  const fresh = () => ({ d: 0, phase: 'ask', log: [...D[0].incoming], suit: 3, guard: 2,
    gears: { value: 0, inertia: 0, visibility: 0, access: 0 }, exploit: { value: 0, inertia: 0, visibility: 0, access: 0 },
    picks: {}, last: null, ending: null, switched: false });
  const [st, setSt] = useState(fresh);
  const [noC, setNoC] = useState(false);
  const logRef = useRef(null); const topRef = useRef(null);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [st.log.length, st.phase]);
  const dec = D[st.d];

  function pick(o) {
    setSt(s => {
      const gears = { ...s.gears }, exploit = { ...s.exploit };
      if (o.gear) { gears[o.gear] += 1; exploit[o.gear] += 1; }
      if (o.inertia === 'down') { gears.inertia -= 1; exploit.inertia += 1; }
      if (o.inertia === 'up') { gears.inertia += 1; }
      const add = [];
      if (o.reply) add.push({ type: 'out', text: o.reply });
      if (o.action) add.push({ type: 'act', text: o.action });
      if (o.note) add.push({ type: 'note', text: o.note });
      if (o.follow) add.push(...o.follow);
      return { ...s, gears, exploit, suit: clamp(s.suit + (o.suit || 0), 0, 10), guard: clamp(s.guard + (o.guard || 0), 0, 10),
        picks: { ...s.picks, [dec.id]: o.id }, last: o, phase: 'result', log: [...s.log, ...add], switched: s.switched || !!o.switchApp };
    });
  }
  function cont() {
    setSt(s => {
      const o = s.last;
      if (o.earlyExit) return { ...s, phase: 'ending', ending: 'protected', early: true };
      if (s.d === D.length - 1) {
        let e = computeEnding(s.picks);
        if (!e) e = s.guard >= 4 ? 'near' : 'hooked';
        return { ...s, phase: 'ending', ending: e };
      }
      const nd = s.d + 1, nx = D[nd];
      return { ...s, d: nd, last: null, phase: nx.call ? 'call' : 'ask', log: [...s.log, ...nx.incoming] };
    });
  }
  function endCall() { setSt(s => s.phase !== 'call' ? s : ({ ...s, phase: 'ask', log: [...s.log, ...D[s.d].afterCall] })); }
  function replay() { setNoC(true); setSt(fresh()); topRef.current && topRef.current.scrollIntoView({ block: 'start' }); }

  const exploited = Object.entries(st.exploit).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k]) => GEAR_NAMES[k]);
  const endingOf = e => e === 'protected' ? S.protectedEnding : R.endings[e];
  const finish = () => onDone({ ending: endingOf(st.ending).title, exploited });

  const changeChips = o => {
    const out = [];
    if (o.suit) out.push(html`<span className="chip warn" key="s">Suitability +${o.suit}</span>`);
    if (o.gear) out.push(html`<span className="chip warn" key="g">${GEAR_NAMES[o.gear]} gear turns</span>`);
    if (o.inertia === 'down') out.push(html`<span className="chip warn" key="i">Inertia goes down</span>`);
    if (o.inertia === 'up') out.push(html`<span className="chip" key="iu">Inertia goes up</span>`);
    if (o.guard) out.push(html`<span className=${'chip' + (o.guard < 0 ? ' warn' : '')} key="gd">Self-guardianship ${o.guard > 0 ? '+' : '−'}${Math.abs(o.guard)}</span>`);
    return out;
  };

  return html`<main className="wrap stack" ref=${topRef}>
    <${ActTitle} act=${R.title} sub=${S.role}/>
    <p className="measure">${R.intro || S.intro}</p>
    <div className="act2">
      <div className="stack">
        <div className="phone"><div className="ph-head"><span className="av" aria-hidden="true"></span>
          <span>${dec.contact || R.contact}${st.switched ? ' · other app' : ' · SMS'}</span></div>
          <div className="log" ref=${logRef} aria-live="polite">${st.log.map((m, i) => msgView(m, i, R.contact))}</div></div>
      </div>
      <div className="stack">
        <${Paper}><${Meters} suit=${st.suit} guard=${st.guard} gears=${st.gears} exploit=${st.exploit}/><//>

        ${st.phase === 'call' && html`<${Paper} inner="teal"><div className="stack"><span className="label">${dec.id} · ${R.call.callLabel}</span><${VideoCall} mode="call" onEnd=${endCall} cfg=${R.call}/></div><//>`}

        ${(st.phase === 'ask' || st.phase === 'result') && html`<${Paper}><div className="stack">
          <span className="label">Decision ${st.d + 1} of 5</span>
          <h2 style=${{ fontSize: '1.7em' }}>${dec.prompt}</h2>
          <${Choices} options=${dec.options} picked=${st.picks[dec.id] || null} onPick=${pick} disabledIds=${noC && dec.id === 'D1' ? ['C'] : []}/>
          ${st.phase === 'result' && st.last && html`<div className="stack">
            ${st.last.show === 'turn' && html`<div className="stack"><${VideoCall} mode="turn" cfg=${R.call}/><p className="feedback">${R.turnNote}</p></div>`}
            ${st.last.show === 'search' && html`<div className="stack"><${ReverseSearch}/><p className="feedback">${R.searchNote}</p></div>`}
            <div className="chips">${changeChips(st.last)}</div>
            <div><button className="btn btn-brass" onClick=${cont}>${st.last.earlyExit || st.d === D.length - 1 ? 'See how it ends' : 'Continue'}</button></div>
          </div>`}
        </div><//>`}

        ${st.phase === 'ending' && html`<div className=${'ending ' + st.ending}>
          <div className="stack">
            <span className="label">Ending</span>
            <h3>${st.ending === 'protected' ? '✓ ' : st.ending === 'near' ? '! ' : '✗ '}${endingOf(st.ending).title}</h3>
            <p>${endingOf(st.ending).text}</p>
            <svg viewBox="0 0 400 70" style=${{ width: '100%', maxWidth: '360px' }} aria-hidden="true">${['value', 'inertia', 'visibility', 'access'].map((k, i) => html`<g key=${k}><${VivaGear} x=${50 + i * 100} y=${30} r=${24} k=${k} spin=${st.exploit[k] > 0 ? 'fast' : 'slow'} rev=${i % 2 === 1} hot=${st.exploit[k] > 0}/><text x=${50 + i * 100} y=${68} textAnchor="middle" fontSize="12" fontWeight="700" fill="#2B2A33" fontFamily="Alegreya,Georgia,serif">${GEAR_NAMES[k]}</text></g>`)}</svg>
            <p className="small"><b>VIVA gears most exploited:</b> ${exploited.length ? listJoin(exploited) : 'none. The scam found nothing to grip.'}</p>
            ${st.early ? html`<div className="row"><button className="btn btn-brass" onClick=${replay}>${S.replayLabel}</button>
                <button className="linkish" onClick=${() => setSt(s => ({ ...s, phase: 'callout' }))}>Skip to the CRAT Callout</button></div>`
              : html`<div><button className="btn btn-brass" onClick=${() => setSt(s => ({ ...s, phase: 'callout' }))}>Read the CRAT Callout</button></div>`}
          </div></div>`}

        ${st.phase === 'callout' && html`<div className="stack" style=${{ gap: '20px' }}><${Callout} c=${S.callout}/>
          <div><button className="btn btn-brass" onClick=${finish}>Continue to Act 3</button></div></div>`}
      </div>
    </div>
  </main>`;
}

/* =====================================================================
   ACT 3
   ===================================================================== */
function GuardianIcon({ kind }) {
  const p = { className: 'ic', viewBox: '0 0 64 64', 'aria-hidden': 'true' };
  switch (kind) {
    case 'priya': return html`<svg ...${p}><${Person} x=${32} y=${13} s=${.6} body="#C8453A" mood="smile" scarf="#F2D58C" hair="#2E2530" face="#C98E68"/></svg>`;
    case 'bank': return html`<svg ...${p}><g filter="url(#card)">
      <rect x="8" y="48" width="48" height="8" rx="1" fill="#9A7A2F"/><rect x="10" y="24" width="44" height="26" fill="#F3E3BE"/><rect x="10" y="24" width="44" height="26" fill="url(#loBot)"/>
      ${[16, 27, 37, 48].map(x => html`<rect key=${x} x=${x - 3} y="26" width="6" height="22" rx="1" fill="#FFF8E7"/>`)}
      <path d="M6 25 L32 9 L58 25Z" fill="#B08D3C"/><path d="M6 25 L32 9 L58 25Z" fill="url(#hiTop)"/><circle cx="32" cy="19" r="3.4" fill="#F7E4A8"/></g></svg>`;
    case 'telco': return html`<svg ...${p}><g filter="url(#card)">
      <path d="M32 18 L20 58 L25 58 L32 30 L39 58 L44 58Z" fill="#B5653A"/><path d="M24 46 H40 L39 50 H25Z M27 36 H37 L36 39 H28Z" fill="#8A4A28"/>
      <circle cx="32" cy="16" r="5" fill="#C8453A"/><circle cx="30.5" cy="14.5" r="1.5" fill="#fff" opacity=".6"/></g>
      <path d="M22 8 Q17 16 22 24 M42 8 Q47 16 42 24 M15 4 Q8 16 15 28 M49 4 Q56 16 49 28" stroke="#2F6F6A" strokeWidth="3" fill="none" strokeLinecap="round"/></svg>`;
    case 'platform': return html`<svg ...${p}><g filter="url(#card)">
      <path d="M6 10 Q6 6 10 6 H54 Q58 6 58 10 V40 Q58 44 54 44 H26 L14 54 V44 H10 Q6 44 6 40Z" fill="#8FB8C9"/><path d="M6 10 Q6 6 10 6 H54 Q58 6 58 10 V40 Q58 44 54 44 H26 L14 54 V44 H10 Q6 44 6 40Z" fill="url(#hiTop)"/>
      <path d="M32 12 L44 16 V25 Q44 34 32 38 Q20 34 20 25 V16Z" fill="#FFF8E7"/><path d="M26 25 L30 29 L38 20" stroke="#3F8F4F" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></g></svg>`;
    case 'scamwatch': return html`<svg ...${p}><g filter="url(#card)">
      <rect x="15" y="36" width="9" height="16" rx="2" fill="#8A4A28"/>
      <path d="M8 24 Q8 22 10 22 H20 L46 8 V52 L20 38 H10 Q8 38 8 36Z" fill="#B5653A"/><path d="M8 24 Q8 22 10 22 H20 L46 8 V52 L20 38 H10 Q8 38 8 36Z" fill="url(#hiTop)"/>
      <ellipse cx="46" cy="30" rx="4" ry="22" fill="url(#brassR)"/></g>
      <path d="M52 20 Q58 30 52 40" stroke="#2F6F6A" strokeWidth="3" fill="none" strokeLinecap="round"/></svg>`;
    case 'afp': return html`<svg ...${p}><g filter="url(#card)">
      <path d="M32 4 L38.5 21 L57 21 L42 32 L48 50 L32 39 L16 50 L22 32 L7 21 L25.5 21Z" fill="url(#brassR)"/>
      <circle cx="32" cy="28" r="8" fill="#2F6F6A"/><circle cx="32" cy="28" r="4" fill="#F7E4A8"/></g></svg>`;
    case 'esafety': return html`<svg ...${p}><g filter="url(#card)">
      <path d="M32 5 L54 13 V30 Q54 48 32 58 Q10 48 10 30 V13Z" fill="#2F6F6A"/><path d="M32 13 L46 18 V30 Q46 42 32 49Z" fill="#8FB8C9"/>
      <path d="M32 5 L54 13 V30 Q54 48 32 58 Q10 48 10 30 V13Z" fill="url(#hiLeft)"/></g></svg>`;
    default: return html`<svg ...${p}><${Person} x=${22} y=${18} s=${.42} body="#A9A49A" face="#D9CDBA" hair="#7E796F"/><${Person} x=${43} y=${24} s=${.36} body="#9C978D" face="#D9CDBA" hair="#6F6A61"/></svg>`;
  }
}
function Clock({ lit }) {
  const segs = [];
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / 12) * 2 * Math.PI - Math.PI / 2, r = 70;
    const d = `M80 80 L${80 + r * Math.cos(a0)} ${80 + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${80 + r * Math.cos(a1)} ${80 + r * Math.sin(a1)}Z`;
    segs.push(html`<path key=${i} d=${d} className="seg-on" fill=${i < lit ? '#D9BD72' : '#F3E9D2'} stroke=${i % 2 ? '#6E531A' : '#C9B98C'} strokeWidth=${i % 2 ? 2 : 1}/>`);
  }
  const hand = lit / 12 * 360;
  return html`<svg viewBox="0 0 160 160" width="180" height="180" role="img" aria-label=${`Clock face: ${lit / 2} of 6 segments lit`} style=${{ maxWidth: '100%' }}>
    <circle cx="80" cy="80" r="76" fill="#B08D3C" stroke="#6E531A" strokeWidth="3"/>${segs}
    <g className="needle" style=${{ transform: `rotate(${hand}deg)`, transformOrigin: '80px 80px', transformBox: 'view-box' }}><path d="M78 80 L80 18 L82 80Z" fill="#2B2A33"/></g>
    <circle cx="80" cy="80" r="7" fill="#2B2A33"/></svg>`;
}
function ZoomTriangle() {
  const Z = GAME.act3.zoom;
  const Pill = ({ cx, cy, lines, bg, fg, w }) => {
    const h = lines.length * 20 + 12;
    return html`<g filter="url(#card)"><rect x=${cx - w / 2} y=${cy - h / 2} width=${w} height=${h} rx="12" fill=${bg}/>
      ${lines.map((l, i) => html`<text key=${i} x=${cx} y=${cy - h / 2 + 22 + i * 20} textAnchor="middle" fontSize="16" fontWeight="700" fill=${fg} fontFamily="Alegreya,Georgia,serif">${l}</text>`)}</g>`;
  };
  const Node = ({ x, y, fill, lines }) => html`<g filter="url(#card)"><circle cx=${x} cy=${y} r="44" fill="#FFF6E2"/><circle cx=${x} cy=${y} r="39" fill=${fill}/><circle cx=${x} cy=${y} r="39" fill="url(#hiTop)"/>
    ${lines.map((l, i) => html`<text key=${i} x=${x} y=${y + 6 - (lines.length - 1) * 9 + i * 18} textAnchor="middle" fontSize="17" fontWeight="700" fill="#FFFFFF" fontFamily="Alegreya,Georgia,serif">${l}</text>`)}</g>`;
  return html`<div style=${{ overflow: 'hidden', borderRadius: '10px' }}><svg className="scene zoom" viewBox="0 0 520 540" role="img" aria-label=${`Crime triangle with an outer ring of controllers. ${Z.guardians}. ${Z.place}. ${Z.handlers}. ${Z.super}.`} style=${{ maxWidth: '640px', margin: '0 auto', transformOrigin: 'center' }}>
    <circle cx="260" cy="280" r="248" fill="#F8EFD6" stroke="#B08D3C" strokeWidth="4" strokeDasharray="12 7"/>
    <path d="M260 160 L160 340 L360 340 Z" fill="#FFF8E7" stroke="#6E531A" strokeWidth="3" strokeLinejoin="round" filter="url(#card)"/>
    <text x="260" y="285" textAnchor="middle" fontSize="13" fill="#4A4552" fontFamily="Courier New,monospace" letterSpacing="2">CONVERGENCE</text>
    <${Node} x=${260} y=${160} fill="#B0392F" lines=${['Offender']}/>
    <${Node} x=${160} y=${340} fill="#2A635F" lines=${['Target']}/>
    <${Node} x=${360} y=${340} fill="#6E531A" lines=${['Online', 'place']}/>
    <${Pill} cx=${260} cy=${32} w=${440} lines=${[Z.super]} bg="#6E531A" fg="#FFF8E7"/>
    <${Pill} cx=${260} cy=${88} w=${290} lines=${[Z.handlers]} bg="#F6DDD5" fg="#8A2A22"/>
    <${Pill} cx=${160} cy=${414} w=${172} lines=${['Guardians protect', 'the target']} bg="#D4E6E2" fg="#1E4A46"/>
    <${Pill} cx=${356} cy=${414} w=${188} lines=${['Place managers control', 'the online places']} bg="#F2E4BC" fg="#5A4413"/>
  </svg></div>`;
}
function SquareSky() {
  const ref = useParallax();
  return html`<div ref=${ref} aria-hidden="true" className="dio-frame"><svg className="square-sky" viewBox="0 0 1000 200" preserveAspectRatio="xMidYMax slice">
    <g className="layer" style=${{ '--d': 3 }}>
      <rect x="-40" y="-40" width="1080" height="280" fill="url(#skyWarm)"/>
      <${Cloud} x=${170} y=${48} s=${.8}/><${Cloud} x=${820} y=${40} s=${.7}/>
      <path d="M-40 150 Q200 96 420 130 T1040 116 L1040 240 L-40 240Z" fill="#A8C2A0" filter="url(#card)"/>
    </g>
    <g className="layer" style=${{ '--d': 8 }}>
      <${Tree} x=${150} y=${182}/>
      <${House} x=${176} y=${182} w=${56} h=${56} wall="#EFD0BC" roof="#C8453A" door="#2F6F6A"/>
      <${House} x=${270} y=${182} w=${60} h=${72} wall="#F1D7A2" roof="#2F6F6A" door="#C8453A" chimney=${true}/>
      <${House} x=${364} y=${182} w=${56} h=${60} wall="#DDEAE5" roof="#B5653A" door="#B08D3C"/>
      <${ClockTower} x=${458} y=${184} w=${78} h=${120}/>
      <${House} x=${592} y=${182} w=${60} h=${64} wall="#F6E7C6" roof="#C8453A" door="#2F6F6A" chimney=${true}/>
      <${House} x=${690} y=${182} w=${56} h=${52} wall="#EFD0BC" roof="#2F6F6A" door="#C8453A"/>
      <${House} x=${780} y=${182} w=${62} h=${70} wall="#F1D7A2" roof="#B5653A" door="#2F6F6A"/>
      <${Tree} x=${880} y=${184} s=${1.1} c="#5E9A6A"/>
    </g>
    <g className="layer" style=${{ '--d': 12 }}>
      <${Bunting} x1=${120} y1=${92} x2=${440} y2=${100} sag=${16} n=${9}/>
      <${Bunting} x1=${560} y1=${100} x2=${900} y2=${88} sag=${16} n=${9}/>
      <rect x="-40" y="182" width="1080" height="40" fill="#D8C79E" filter="url(#card)"/>
    </g>
  </svg></div>`;
}
function Act3({ onDone }) {
  const S = GAME.act3;
  const [chosen, setChosen] = useState([]);
  const [stage, setStage] = useState('place');
  const [lit, setLit] = useState(0);
  const [hint, setHint] = useState('');
  const top = useRef(null);
  const score = chosen.reduce((a, id) => a + S.guardians.find(g => g.id === id).value, 0);
  const toggle = id => {
    if (stage !== 'place') return;
    setHint('');
    setChosen(c => c.includes(id) ? c.filter(x => x !== id) : c.length >= 3 ? (setHint('You only have three tokens. Take one back first.'), c) : [...c, id]);
  };
  const drop = (e, id) => { e.preventDefault(); if (!chosen.includes(id)) toggle(id); };
  function wind() {
    setStage('reveal');
    const target = score * 2;
    if (REDUCED) { setLit(target); return; }
    let n = 0; const iv = setInterval(() => { n += 1; setLit(Math.min(n, target)); if (n >= target) clearInterval(iv); }, 180);
  }
  const result = S.results.find(r => score >= r.min).text;
  const go = s => { setStage(s); setTimeout(() => top.current && top.current.scrollIntoView({ block: 'start' }), 0); };
  return html`<main className="wrap stack" ref=${top}>
    <${ActTitle} act=${S.title} sub=${S.role}/>
    ${(stage === 'place' || stage === 'reveal') && html`<div className="stack">
      <${SquareSky}/>
      <p className="measure" style=${{ fontSize: '1.06em' }}>${S.intro}</p>
      <div className="row" style=${{ justifyContent: 'space-between' }}>
        <div className="tray" aria-live="polite"><span className="label">Tokens</span>
          ${[0,1,2].map(i => i < 3 - chosen.length
            ? html`<span key=${i} className="token" draggable=${stage === 'place' ? 'true' : 'false'} onDragStart=${e => e.dataTransfer.setData('text/plain', 'token')} title="Drag onto a guardian, or tap a guardian"></span>`
            : html`<span key=${i} className="token ghost"></span>`)}
          <span className="small muted">${3 - chosen.length} left · drag a token, or tap a guardian</span></div>
        ${stage === 'place' && html`<button className="btn btn-brass" disabled=${chosen.length !== 3} onClick=${wind}>Wind the clock</button>`}
      </div>
      ${hint && html`<p className="small" style=${{ color: '#9A3027' }}>${hint}</p>`}
      <div className="plinths">${S.guardians.map(g => {
        const on = chosen.includes(g.id), rev = stage !== 'place';
        return html`<button key=${g.id} className=${'plinth' + (on ? ' sel' : '') + (rev ? ' revealed' : '')} aria-pressed=${on}
            onClick=${() => toggle(g.id)} onDragOver=${e => stage === 'place' && e.preventDefault()} onDrop=${e => drop(e, g.id)} disabled=${rev && !on ? false : false}>
          ${on && html`<span className="seg"><span className="token" aria-hidden="true"></span></span>`}
          ${!rev ? html`<div className="stack" style=${{ gap: '6px', alignItems: 'center' }}><${GuardianIcon} kind=${g.icon}/><span className="nm">${g.name}</span>${on && html`<span className="small" style=${{ color: '#6E531A' }}>Token placed</span>`}</div>`
            : html`<div className="stack" style=${{ gap: '6px' }}><div className="row" style=${{ gap: '8px', flexWrap: 'nowrap' }}><${GuardianIcon} kind=${g.icon}/><span className="nm">${g.name}</span></div>
              <span className="role">${g.role}</span>
              <dl><dt>Can: </dt><dd>${g.can}</dd><br/><dt>Limit: </dt><dd>${g.limit}</dd></dl>
              <span className="chip brass" style=${{ alignSelf: 'flex-start' }}>${g.value} ${g.value === 1 ? 'segment' : 'segments'}</span></div>`}
        </button>`;})}</div>
      <div className="sea"><span className="label">Across the sea</span>
        <div className="handler" aria-disabled="true"><${GuardianIcon} kind="handler"/><div><b>${S.handler.name}</b><p className="small">${S.handler.note}</p></div></div></div>
    </div>`}

    ${stage === 'reveal' && html`<${Paper} inner="teal"><div className="clockwrap">
      <${Clock} lit=${lit}/>
      <div className="stack">
        <span className="label">The clock tower</span>
        <p style=${{ fontSize: '1.3em', fontWeight: 700 }}>${score} of 6 segments lit</p>
        <p>${result}</p>
        ${chosen.includes('esafety') && html`<p className="small muted">${S.esafetyNote}</p>`}
        <div><button className="btn btn-brass" onClick=${() => go('zoom')}>Zoom out</button></div>
      </div></div><//>`}

    ${(stage === 'zoom' || stage === 'callout') && html`<div className="stack" style=${{ gap: '24px' }}>
      <${Paper}><${ZoomTriangle}/><//>
      ${stage === 'zoom' ? html`<div><button className="btn btn-brass" onClick=${() => setStage('callout')}>Read the CRAT Callout</button></div>`
        : html`<div className="stack" style=${{ gap: '20px' }}><${Callout} c=${S.callout}/><div><button className="btn btn-brass" onClick=${() => onDone({ chosen, score })}>See your CRAT Map</button></div></div>`}
    </div>`}
  </main>`;
}

/* =====================================================================
   CRAT MAP
   ===================================================================== */
function CratMap({ game, go, replay }) {
  const A1 = GAME.act1, G = GAME.act3.guardians;
  const op = A1.opener.options.find(o => o.id === game.act1.opener);
  const sto = A1.story.options.find(o => o.id === game.act1.story);
  const lines = {
    offender: `Min opened with the ${op.short} script and told themselves: ${sto.text}`,
    target: game.act2.exploited.length ? `Alex was most exposed through ${listJoin(game.act2.exploited.slice(0, 2))}. Ending: ${game.act2.ending}.` : `Alex gave the scam nothing to grip. Ending: ${game.act2.ending}.`,
    guardian: `You chose ${listJoin(game.act3.chosen.map(id => G.find(g => g.id === id).short))}.`,
  };
  return html`<main className="wrap stack">
    <${Paper} inner="poster"><div className="stack">
      <span className="label">All three corners</span>
      <h1 style=${{ fontSize: 'clamp(36px,5vw,64px)' }}>${GAME.map.title}</h1>
      <${MapTriangle}/>
      <div className="corners">
        <div className="corner" style=${{ '--c': '#C8453A' }}><h3>Offender</h3><p>${lines.offender}</p></div>
        <div className="corner" style=${{ '--c': '#2F6F6A' }}><h3>Target</h3><p>${lines.target}</p></div>
        <div className="corner" style=${{ '--c': '#6E531A' }}><h3>Guardian</h3><p>${lines.guardian}</p></div>
      </div>
      <div className="row">
        <button className="btn btn-brass" onClick=${() => go('discuss')}>Class Discussion</button>
        <button className="btn btn-ghost" onClick=${replay}>Replay</button>
        <button className="btn btn-ghost" onClick=${() => go('quiz')}>Try the Readings Quiz</button>
        <button className="backlink" onClick=${() => go('landing')}>← The CRAT Game</button>
      </div>
    </div><//>
    <aside className="support" aria-label="Support"><p>${GAME.map.support}</p></aside>
  </main>`;
}

/* =====================================================================
   ACT 4: DISCUSSION
   ===================================================================== */
function Discussion({ go }) {
  const P = GAME.discussion.prompts;
  const [proj, setProj] = useState(false); const [i, setI] = useState(0);
  const [secs, setSecs] = useState(180); const [run, setRun] = useState(false);
  useEffect(() => { if (!run) return; const id = setInterval(() => setSecs(s => { if (s <= 1) { setRun(false); return 0; } return s - 1; }), 1000); return () => clearInterval(id); }, [run]);
  useEffect(() => { if (!proj) return; const k = e => { if (e.key === 'ArrowRight') setI(v => Math.min(P.length - 1, v + 1)); if (e.key === 'ArrowLeft') setI(v => Math.max(0, v - 1)); if (e.key === 'Escape') setProj(false); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [proj]);
  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  if (proj) return html`<div className="proj" role="dialog" aria-modal="true" aria-label="Projector mode">
    <div className="proj-bar"><span className="label">Prompt ${i + 1} of ${P.length}</span>
      <div className="row"><span className="timer" aria-live="off">${mmss}</span>
        <button className="btn btn-ghost" onClick=${() => setRun(r => !r)}>${run ? 'Pause timer' : 'Start 3-minute timer'}</button>
        <button className="btn btn-ghost" onClick=${() => { setRun(false); setSecs(180); }}>Reset</button>
        <button className="btn btn-ghost" onClick=${() => setProj(false)}>Exit projector mode</button></div></div>
    <div className="proj-body"><h2>${P[i].title}</h2><p>${P[i].text}</p></div>
    <div className="proj-bar"><button className="btn btn-brass" disabled=${i === 0} onClick=${() => setI(i - 1)}>← Previous</button>
      <button className="btn btn-brass" disabled=${i === P.length - 1} onClick=${() => setI(i + 1)}>Next →</button></div>
  </div>`;
  return html`<main className="wrap stack">
    <div className="row" style=${{ justifyContent: 'space-between' }}><${ActTitle} act=${GAME.discussion.title} sub="Tutor-led"/>
      <button className="btn btn-brass" onClick=${() => { setI(0); setProj(true); }}>Projector mode</button></div>
    <div className="prompts">${P.map((p, n) => html`<${Paper} key=${n} tilt=${n % 2 ? 'tilt-r' : 'tilt-l'}><div className="prompt">
      <span className="label">Prompt ${n + 1}</span><h3>${p.title}</h3><p>${p.text}</p>
      <button className="linkish" onClick=${() => { setI(n); setProj(true); }}>Project this prompt</button></div><//>`)}</div>
    <div className="row"><button className="btn btn-ghost" onClick=${() => go('map')}>Back to your CRAT Map</button>
      <button className="btn btn-ghost" onClick=${() => go('quiz')}>Try the Readings Quiz</button></div>
    <aside className="support"><p>${GAME.map.support}</p></aside>
  </main>`;
}

/* =====================================================================
   QUIZ
   ===================================================================== */
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const stripLead = s => { const t = s.replace(/^(Correct\.|Incorrect:)\s*/, ''); return cap(t); };
function Quiz({ go }) {
  const [phase, setPhase] = useState('intro');
  const [filter, setFilter] = useState('all');
  const [run, setRun] = useState(null);
  const top = useRef(null);
  const scroll = () => setTimeout(() => top.current && top.current.scrollIntoView({ block: 'start' }), 0);
  const startWith = items => { setRun({ items, perms: items.map(() => shuffle([0, 1, 2, 3])), i: 0, answers: {} }); setPhase('q'); scroll(); };
  const filtered = () => QUIZ.map((q, i) => i).filter(i => filter === 'all' || QUIZ[i].reading === filter);

  if (phase === 'intro') return html`<main className="wrap stack" ref=${top}>
    <header className="topbar"><button className="backlink" onClick=${() => go('landing')}>← The CRAT Game</button></header>
    <h1 style=${{ fontSize: 'clamp(40px,6vw,76px)' }}>Readings Quiz</h1>
    <div className="readings">${READINGS.map((r, n) => html`<${Paper} key=${r.key} tilt=${n === 1 ? 'tilt-r' : 'tilt-l'}><div className="reading">
      <span className="label">${r.inText}</span><h3>${r.short}</h3><p className="full">${r.full}</p></div><//>`)}</div>
    <div className="stack" style=${{ gap: '10px' }}><span className="label">Which questions?</span>
      <div className="filters" role="group" aria-label="Filter questions by reading">
        ${[['all', 'All 30'], ...READINGS.map(r => [r.key, r.chip])].map(([k, l]) => html`<button key=${k} className="fchip" aria-pressed=${filter === k} onClick=${() => setFilter(k)}>${l}</button>`)}</div></div>
    <div><button className="btn btn-brass" onClick=${() => startWith(filtered())}>Start</button></div>
  </main>`;

  if (phase === 'q') {
    const qi = run.items[run.i], Q = QUIZ[qi], ans = run.answers[qi], total = run.items.length;
    const choose = letter => setRun(r => ({ ...r, answers: { ...r.answers, [qi]: letter } }));
    const next = () => { if (run.i + 1 >= total) { setPhase('results'); scroll(); } else { setRun(r => ({ ...r, i: r.i + 1 })); scroll(); } };
    return html`<main className="wrap stack" ref=${top}>
      <header className="topbar"><button className="backlink" onClick=${() => go('landing')}>← The CRAT Game</button>
        <span className="tri-label">Readings Quiz</span></header>
      <div className="stack" style=${{ gap: '6px' }}>
        <div className="row" style=${{ justifyContent: 'space-between' }}><span className="label">Question ${run.i + 1} of ${total}</span></div>
        <div className="progress" role="progressbar" aria-valuemin="0" aria-valuemax=${total} aria-valuenow=${run.i + 1}><i style=${{ width: ((run.i + 1) / total * 100) + '%' }}></i></div>
      </div>
      <${Paper}><div className="stack">
        <div className="qhead"><span className="label">${READINGS.find(r => r.key === Q.reading).inText}</span><span className="citetag">${Q.cite}</span></div>
        <p className="qtext">${Q.question}</p>
        <div className="choices">${run.perms[run.i].map((oi, pos) => {
          const [letter, text, expl] = Q.options[oi];
          const isCorrect = letter === Q.answer, isChosen = ans === letter;
          let cls = 'opt', verdict = null;
          if (ans) {
            if (isChosen && isCorrect) { cls += ' ok'; verdict = '✓ Correct'; }
            else if (isChosen) { cls += ' bad'; verdict = '✗ Incorrect'; }
            else if (isCorrect) { cls += ' ok'; verdict = '✓ Correct answer'; }
            else cls += ' faded';
          }
          return html`<button key=${letter} className=${cls} disabled=${!!ans} onClick=${() => choose(letter)}>
            <span className="top"><span className="key" aria-hidden="true">${'ABCD'[pos]}</span><span>${text}</span></span>
            ${verdict && html`<span className="explain"><span className="verdict">${verdict}.</span> ${stripLead(expl)}</span>`}
          </button>`;})}</div>
        ${ans && html`<div aria-live="polite" className="row"><button className="btn btn-brass" onClick=${next}>${run.i + 1 >= total ? 'See results' : 'Next'}</button></div>`}
      </div><//>
    </main>`;
  }

  // results
  const items = run.items, right = items.filter(i => run.answers[i] === QUIZ[i].answer);
  const missed = items.filter(i => run.answers[i] !== QUIZ[i].answer);
  const optText = (Q, l) => (Q.options.find(o => o[0] === l) || []);
  return html`<main className="wrap stack" ref=${top}>
    <header className="topbar"><button className="backlink" onClick=${() => go('landing')}>← The CRAT Game</button></header>
    <${Paper}><div className="stack">
      <span className="label">Results</span>
      <p className="score">${right.length}<span style=${{ fontSize: '.45em', color: 'var(--ink-2)' }}> / ${items.length}</span></p>
      <div className="bars">${READINGS.map(r => {
        const mine = items.filter(i => QUIZ[i].reading === r.key); if (!mine.length) return null;
        const ok = mine.filter(i => run.answers[i] === QUIZ[i].answer).length;
        return html`<div key=${r.key} className="bar-row"><span>${r.inText}</span>
          <div className="progress"><i style=${{ width: (ok / mine.length * 100) + '%' }}></i></div><span className="n">${ok} / ${mine.length}</span></div>`;})}</div>
      <div className="row">
        <button className="btn btn-brass" onClick=${() => startWith(items)}>Retry</button>
        <button className="btn btn-ghost" disabled=${!missed.length} onClick=${() => startWith(missed)}>Retry only the ones I missed</button>
        <button className="backlink" onClick=${() => go('landing')}>← The CRAT Game</button>
      </div></div><//>
    <details className="review" open>
      <summary style=${{ cursor: 'pointer', fontFamily: 'var(--f-display)', fontSize: '1.8em' }}>Review my answers</summary>
      <ol>${items.map(i => { const Q = QUIZ[i], a = run.answers[i], ok = a === Q.answer, mine = optText(Q, a), cor = optText(Q, Q.answer);
        return html`<li key=${i}><p style=${{ fontWeight: 600 }}>${Q.question} <span className="citetag">${Q.cite}</span></p>
          <span className=${'ans ' + (ok ? 'ok' : 'bad')}><b>${ok ? '✓ Your answer (correct):' : '✗ Your answer (incorrect):'}</b> ${mine[1]} <span className="muted">${stripLead(mine[2] || '')}</span></span>
          ${!ok && html`<span className="ans ok"><b>✓ Correct answer:</b> ${cor[1]} <span className="muted">${stripLead(cor[2])}</span></span>`}</li>`;})}</ol>
    </details>
  </main>`;
}

/* =====================================================================
   APP
   ===================================================================== */
function App() {
  const [screen, setScreen] = useState('landing');
  const [game, setGame] = useState({});
  const [runKey, setRunKey] = useState(0);
  const go = s => { setScreen(s); toTop(); };
  const replay = () => { setGame({}); setRunKey(k => k + 1); go('act1'); };
  const gameScreens = ['note', 'act1', 'act2', 'act3', 'map', 'discuss'];
  return html`<div>
    <${ArtDefs}/>
    ${gameScreens.includes(screen) && html`<div className="wrap" style=${{ paddingBlock: '6px 0' }}><${GameHeader} screen=${screen} onHome=${() => go('landing')}/></div>`}
    ${screen === 'landing' && html`<${Landing} go=${go}/>`}
    ${screen === 'note' && html`<${ContentNote} onBegin=${() => go('act1')} onBack=${() => go('landing')}/>`}
    ${screen === 'act1' && html`<${Act1} key=${'a1' + runKey} onDone=${r => { setGame(g => ({ ...g, act1: r })); go('act2'); }}/>`}
    ${screen === 'act2' && html`<${Act2} key=${'a2' + runKey} opener=${game.act1 && game.act1.opener} onDone=${r => { setGame(g => ({ ...g, act2: r })); go('act3'); }}/>`}
    ${screen === 'act3' && html`<${Act3} key=${'a3' + runKey} onDone=${r => { setGame(g => ({ ...g, act3: r })); go('map'); }}/>`}
    ${screen === 'map' && (game.act1 && game.act2 && game.act3
      ? html`<${CratMap} game=${game} go=${go} replay=${replay}/>`
      : html`<main className="wrap"><p>Play the game first to build your map.</p><button className="btn btn-brass" onClick=${replay}>Play</button></main>`)}
    ${screen === 'discuss' && html`<${Discussion} go=${go}/>`}
    ${screen === 'quiz' && html`<${Quiz} go=${go}/>`}
  </div>`;
}
ReactDOM.createRoot(document.getElementById('root')).render(html`<${App}/>`);
