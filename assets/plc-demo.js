/* PLC Data Logging & Reporting — interactive home-page demo.
   Everything runs in the browser on simulated data: no PLC, backend or library.
   The simulation only ticks while the section is on screen and the tab is visible. */
(() => {
'use strict';
const app = document.getElementById('pd-app');
if (!app) return;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- icons (same stroke style as the site) ---------- */
const P = {
 activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
 gauge:'<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 18 4-6"/><path d="M8 18h8"/>',
 cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/><rect x="10" y="10" width="4" height="4"/>',
 db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
 file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
 bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5"/><path d="M4 19h16"/>',
 print:'<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
 pause:'<path d="M9 5v14M15 5v14"/>',
 play:'<path d="m7 4 13 8-13 8z"/>',
 stop:'<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
 alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
 reset:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 thermo:'<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
 bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
 wave:'<path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
 box:'<path d="m21 8-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
const ico = n => `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[n] || ''}</svg>`;
$$('i[data-i]', app).forEach(i => { i.outerHTML = ico(i.dataset.i); });

/* ---------- helpers ---------- */
const pad = n => String(n).padStart(2, '0');
const nf = n => Number(n || 0).toLocaleString('en-IN');
const dstr = d => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const tstr = d => { d = new Date(d); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const sdate = d => { d = new Date(d); return `${pad(d.getDate())} ${MON[d.getMonth()]}`; };
const dtstr = d => `${sdate(d)} ${new Date(d).getFullYear()}, ${tstr(d)}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const round1 = n => Math.round(n * 10) / 10;
const DAY = 864e5, HOUR = 36e5;
const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

/* ---------- machines & simulated data ---------- */
const BASE = [
 {id:'M-101',short:'CNC-01',name:'CNC machining line',loc:'Production cell A',state:'Running',cycle:31.8,temp:47.3,pressure:5.8,vibration:1.14,load:73,power:10.7,nominal:32},
 {id:'M-102',short:'PRS-02',name:'Hydraulic press',loc:'Production cell B',state:'Running',cycle:24.5,temp:52.1,pressure:6.4,vibration:1.35,load:68,power:12.2,nominal:25},
 {id:'M-103',short:'PKG-03',name:'Packing conveyor',loc:'Packaging zone',state:'Stopped',cycle:19.3,temp:33.6,pressure:4.1,vibration:.39,load:4,power:1.1,nominal:20},
 {id:'M-104',short:'ASM-04',name:'Assembly station',loc:'Assembly cell C',state:'Fault',cycle:28.1,temp:59.8,pressure:6.9,vibration:2.35,load:2,power:.9,nominal:28}
];
const SENSORS = {
 temp:{label:'Temperature',unit:'°C',icon:'thermo',max:90,limit:70,dp:1,range:'0–90 °C'},
 pressure:{label:'Hydraulic pressure',unit:'bar',icon:'gauge',max:10,limit:8,dp:1,range:'0–10 bar'},
 vibration:{label:'Vibration RMS',unit:'mm/s',icon:'wave',max:5,limit:3,dp:2,range:'0–5 mm/s'},
 load:{label:'Motor load',unit:'%',icon:'bolt',max:100,limit:90,dp:0,range:'0–100 %'}
};
let seed = 234245;
const rnd = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296;
const rng = (a, b) => a + (b - a) * rnd();
const machines = BASE.map(m => ({...m, since: Date.now() - Math.round(rng(20, 300)) * 60000, packet: Date.now(), latency: Math.round(rng(6, 18)), trend: {temp:[], pressure:[], vibration:[], load:[]}}));
const byId = id => machines.find(m => m.id === id);
const shortName = id => byId(id)?.short || id;

let logs = [], alarms = [], seq = 0, alarmSeq = 1004;
function addLog({machineId, ts = Date.now(), event = 'Telemetry', status, units = 0, rejects = 0, message = '', severity = '', cycle, temp, pressure, vibration, load, power}) {
 const m = byId(machineId); if (!m) return null;
 const r = {id:`EVT-${String(++seq).padStart(5, '0')}`, ts, machineId, event, status: status || m.state, units, rejects,
  cycle: round1(cycle ?? m.cycle), temp: round1(temp ?? m.temp), pressure: round1(pressure ?? m.pressure),
  vibration: Math.round((vibration ?? m.vibration) * 100) / 100, load: Math.round(load ?? m.load), power: round1(power ?? m.power),
  message: message || `${event} sample received`, severity};
 logs.push(r); return r;
}
(function seedHistory() {
 const start = todayStart() - 29 * DAY, now = Date.now();
 for (let day = 0; day < 30; day++) for (let h = 0; h < 24; h++) machines.forEach((m, mi) => {
  const ts = start + day * DAY + h * HOUR + Math.round(rng(60, 1200)) * 1000;
  if (ts > now) return;
  const k = day * 24 + h + mi * 21;
  const status = k % 107 === 0 ? 'Fault' : (k % 19 === 0 || (h < 5 && mi >= 2)) ? 'Stopped' : 'Running';
  const units = status === 'Running' ? Math.round(3600 / m.nominal * rng(.72, .98)) : 0;
  const rejects = units ? Math.round(units * rng(.002, .025)) : 0;
  addLog({machineId: m.id, ts, status, units, rejects, event: status === 'Fault' ? 'Alarm' : status === 'Stopped' ? 'Status' : 'Production',
   cycle: m.nominal + rng(-2.8, 3.4), temp: m.temp + rng(-5, 4), pressure: m.pressure + rng(-.6, .5), vibration: Math.max(.05, m.vibration + rng(-.3, .3)),
   load: status === 'Running' ? clamp(m.load + rng(-12, 12), 0, 100) : rng(0, 4), power: m.power * rng(.8, 1.2),
   message: status === 'Fault' ? 'Drive communication timeout' : status === 'Stopped' ? 'Scheduled idle · waiting for operator' : 'Hourly snapshot · production counter',
   severity: status === 'Fault' ? 'Critical' : ''});
 });
 const t = Date.now();
 alarms = [
  {id:'AL-1001',ts:t - 18 * 60000,machineId:'M-104',title:'Safety interlock open',severity:'Critical',state:'Active',message:'Assembly station guard interlock was opened. Inspect the safety circuit before resetting.'},
  {id:'AL-1002',ts:t - 2 * HOUR,machineId:'M-102',title:'Motor load above warning threshold',severity:'Warning',state:'Acknowledged',message:'Transient motor load above 85 % of rated capacity.'},
  {id:'AL-1003',ts:t - 7 * HOUR,machineId:'M-101',title:'High spindle temperature',severity:'Warning',state:'Cleared',message:'Temperature briefly exceeded 65 °C and recovered.'},
  {id:'AL-1004',ts:t - 31 * HOUR,machineId:'M-103',title:'Conveyor sensor timeout',severity:'Warning',state:'Cleared',message:'Part-presence sensor did not switch within the allowed time.'}
 ];
 addLog({machineId:'M-104', ts:alarms[0].ts, event:'Alarm', status:'Fault', message:alarms[0].title, severity:'Critical'});
 logs.sort((a, b) => a.ts - b.ts);
 // warm up the rolling live trends
 machines.forEach(m => { for (let i = 0; i < 40; i++) { jitter(m); pushTrend(m, Date.now() - (40 - i) * 3000); } });
})();
function jitter(m) {
 const j = (v, step, lo, hi) => clamp(v + (Math.random() - .5) * step, lo, hi);
 const run = m.state === 'Running';
 m.temp = round1(j(m.temp + (run ? .04 : -.08), run ? 1.6 : .6, 22, 82));
 m.pressure = round1(j(m.pressure, .3, 2, 9));
 m.vibration = Math.round(j(m.vibration, run ? .2 : .06, .05, 4.5) * 100) / 100;
 m.load = run ? Math.round(j(m.load, 9, 38, 92)) : Math.round(j(m.load, 3, 0, 7));
 m.power = round1(j(m.power, .8, .1, 16));
 m.cycle = round1(j(m.cycle, .65, m.nominal - 5, m.nominal + 6));
 m.latency = Math.round(j(m.latency, 4, 4, 28));
}
function pushTrend(m, ts = Date.now()) {
 for (const k of Object.keys(m.trend)) { m.trend[k].push({ts, v: m[k]}); if (m.trend[k].length > 40) m.trend[k].shift(); }
}

/* ---------- stats ---------- */
const sum = (a, k) => a.reduce((s, r) => s + (Number(r[k]) || 0), 0);
function stats(rows) {
 const output = sum(rows, 'units'), rejects = sum(rows, 'rejects');
 const running = rows.filter(r => r.status === 'Running').length;
 return {rows, output, rejects, quality: output ? (output - rejects) / output * 100 : 100,
  availability: rows.length ? Math.round(running / rows.length * 100) : 0, avgCycle: rows.length ? sum(rows, 'cycle') / rows.length : 0};
}
const since = (t, id) => logs.filter(r => r.ts >= t && (!id || r.machineId === id));
const activeAlarms = () => alarms.filter(a => a.state === 'Active');

/* ---------- state ---------- */
let settings = {on: true, interval: 3000};
try { settings = {...settings, ...JSON.parse(localStorage.getItem('plc-demo.settings') || '{}')}; } catch {}
let view = 'overview', selected = 'M-101', cycleMachine = 'M-101', range = '24h', signal = 'temp';
let logPage = 1, sortKey = 'ts', sortDir = -1, newLogs = 0, report = null, timer = null, visible = false, ticks = 0;
const saveSettings = () => { try { localStorage.setItem('plc-demo.settings', JSON.stringify(settings)); } catch {} };

/* ---------- toasts ---------- */
const toasts = $('#pd-toasts');
function notify(msg, kind = 'ok') {
 const t = document.createElement('div'); t.className = 'pd-toast';
 t.innerHTML = `<span class="pd-led ${kind}"></span><span>${esc(msg)}</span>`;
 toasts.append(t); while (toasts.children.length > 3) toasts.firstElementChild.remove();
 setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, 3200);
}

/* ---------- badges ---------- */
const stateBadge = s => `<span class="pd-state ${s.toLowerCase()}"><span class="pd-led ${s === 'Running' ? 'ok' : s === 'Fault' ? 'bad' : 'warn'}"></span>${esc(s)}</span>`;
const tag = (txt, cls = txt) => `<span class="pd-tag ${String(cls).toLowerCase()}">${esc(txt)}</span>`;

/* ==========================================================================
   Charts — hand-built SVG, sized to the container so labels stay legible.
   One series per chart, one y-axis, dashed reference line, hover tooltip.
   ========================================================================== */
const NS = 'http://www.w3.org/2000/svg';
function niceStep(x, int) { if (x <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(x))); for (const m of [1, 2, 2.5, 5, 10]) { const st = m * p; if (int && st % 1) continue; if (st >= x) return st; } return 10 * p; }
function niceMax(v) { if (v <= 0) return 10; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function chartFrame(el) {
 const w = Math.max(260, el.clientWidth), h = el.clientHeight || 240;
 const narrow = w < 460;
 return {w, h, narrow, p: {l: 44, r: 12, t: 14, b: 26}};
}
function tooltip(el) {
 let tip = $('.pd-tip', el);
 if (!tip) { tip = document.createElement('div'); tip.className = 'pd-tip'; el.append(tip); }
 return {
  show(html, x, y) { tip.innerHTML = html; tip.classList.add('show'); const tw = tip.offsetWidth, th = tip.offsetHeight;
   tip.style.left = clamp(x - tw / 2, 0, el.clientWidth - tw) + 'px'; tip.style.top = Math.max(0, y - th - 10) + 'px'; },
  hide() { tip.classList.remove('show'); }
 };
}
const barPath = (x, y, w, h, r) => { r = Math.min(r, w / 2, h); return h <= 0 ? '' : `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; };

/* bars: data [{label, value, tip}], opts {target, targetLabel, unit, fmt} */
function barChart(el, data, opts = {}) {
 const {w, h, narrow, p} = chartFrame(el), gw = w - p.l - p.r, gh = h - p.t - p.b;
 const top = Math.max(opts.target || 0, ...data.map(d => d.value)) * 1.06 || 4;
 const max = niceStep(top / 4, data.every(d => Number.isInteger(d.value))) * 4;
 const fmt = opts.fmt || (v => nf(Math.round(v)));
 let s = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.aria || 'Bar chart')}">`;
 for (let i = 0; i <= 4; i++) { const y = p.t + gh * i / 4; s += `<line class="grid" x1="${p.l}" x2="${w - p.r}" y1="${y}" y2="${y}"/><text class="axis" x="${p.l - 8}" y="${y + 4}" text-anchor="end">${fmt(max * (1 - i / 4))}</text>`; }
 const slot = gw / data.length, gap = clamp(slot * .28, 2, 14), bw = slot - gap;
 const every = Math.ceil(data.length / (narrow ? 5 : 10));
 data.forEach((d, i) => {
  const x = p.l + i * slot + gap / 2, bh = gh * d.value / max, y = p.t + gh - bh;
  s += `<path class="bar" d="${barPath(x, y, bw, bh, 4)}"/>`;
  if (i % every === 0 || data.length <= 8) s += `<text class="axis" x="${x + bw / 2}" y="${h - 7}" text-anchor="middle">${esc(d.label)}</text>`;
  s += `<rect class="hit" data-i="${i}" x="${p.l + i * slot}" y="${p.t}" width="${slot}" height="${gh}"/>`;
 });
 if (opts.target) { const ty = p.t + gh * (1 - opts.target / max); s += `<line class="target" x1="${p.l}" x2="${w - p.r}" y1="${ty}" y2="${ty}"/><text class="target-label" x="${w - p.r}" y="${ty - 5}" text-anchor="end">${esc(opts.targetLabel || 'Target')}</text>`; }
 el.innerHTML = s + '</svg>';
 const tip = tooltip(el), bars = $$('.bar', el);
 el.onpointermove = e => { const hit = e.target.closest?.('.hit'); if (!hit) { tip.hide(); bars.forEach(b => b.classList.remove('dim')); return; }
  const i = +hit.dataset.i, d = data[i]; bars.forEach((b, j) => b.classList.toggle('dim', j !== i));
  const r = el.getBoundingClientRect(); tip.show(d.tip, p.l + i * slot + slot / 2 * (r.width / w), (p.t + gh - gh * d.value / max) * (r.height / h)); };
 el.onpointerleave = () => { tip.hide(); bars.forEach(b => b.classList.remove('dim')); };
}

/* line: data [{label, value, tip}], opts {ref, refLabel, limit, limitLabel, unit, dp, min, max} */
function lineChart(el, data, opts = {}) {
 const {w, h, narrow, p} = chartFrame(el), gw = w - p.l - p.r, gh = h - p.t - p.b;
 const vals = data.map(d => d.value).filter(v => v != null);
 const extra = [opts.ref].filter(v => v != null);
 let vmin = Math.min(...vals, ...extra), vmax = Math.max(...vals, ...extra);
 const span = Math.max(vmax - vmin, opts.minSpan || 1);
 const mid = (vmin + vmax) / 2;
 let lo = opts.min ?? (mid - span * .65), hi = opts.max ?? (mid + span * .65);
 if (opts.min == null) lo = Math.max(0, lo);
 if (opts.min == null || opts.max == null) { const st = niceStep((hi - lo) / 4); lo = opts.min ?? Math.floor(lo / st) * st; hi = opts.max ?? lo + 4 * st; if (hi < vmax) hi = lo + 4 * niceStep((vmax - lo) / 4); }
 const dp = opts.dp ?? 0, sx = i => p.l + (data.length < 2 ? gw / 2 : gw * i / (data.length - 1)), sy = v => p.t + gh * (1 - (v - lo) / (hi - lo));
 let s = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.aria || 'Line chart')}"><defs><linearGradient id="pd-area-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2d6bff" stop-opacity=".16"/><stop offset="1" stop-color="#2d6bff" stop-opacity="0"/></linearGradient></defs>`;
 for (let i = 0; i <= 4; i++) { const y = p.t + gh * i / 4, v = hi - (hi - lo) * i / 4; s += `<line class="grid" x1="${p.l}" x2="${w - p.r}" y1="${y}" y2="${y}"/><text class="axis" x="${p.l - 8}" y="${y + 4}" text-anchor="end">${+v.toFixed(2)}</text>`; }
 const pts = data.map((d, i) => d.value == null ? null : [sx(i), sy(d.value)]);
 const segs = []; let cur = []; pts.forEach(pt => { if (pt) cur.push(pt); else if (cur.length) { segs.push(cur); cur = []; } }); if (cur.length) segs.push(cur);
 segs.forEach(sg => { const d = sg.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(''); if (sg.length > 1) s += `<path class="area" d="${d}L${sg.at(-1)[0].toFixed(1)},${p.t + gh}L${sg[0][0].toFixed(1)},${p.t + gh}Z"/>`; s += `<path class="line" d="${d}"/>`; });
 if (opts.ref != null) { const y = sy(opts.ref); s += `<line class="target" x1="${p.l}" x2="${w - p.r}" y1="${y}" y2="${y}"/><text class="target-label" x="${w - p.r}" y="${y - 5}" text-anchor="end">${esc(opts.refLabel || 'Target')}</text>`; }
 if (opts.limit != null && opts.limit <= hi && opts.limit >= lo) { const y = sy(opts.limit); s += `<line class="limit" x1="${p.l}" x2="${w - p.r}" y1="${y}" y2="${y}"/><text class="limit-label" x="${p.l + 6}" y="${y - 5}">${esc(opts.limitLabel || 'Limit')}</text>`; }
 const every = Math.ceil(data.length / (narrow ? 4 : 8));
 data.forEach((d, i) => { if (i % every === 0) s += `<text class="axis" x="${sx(i)}" y="${h - 7}" text-anchor="${i === 0 ? 'start' : 'middle'}">${esc(d.label)}</text>`; });
 const last = [...pts].reverse().find(Boolean);
 if (last && opts.liveDot) s += `<circle class="dot" cx="${last[0]}" cy="${last[1]}" r="4.5"/>`;
 s += `<line class="cross" x1="0" x2="0" y1="${p.t}" y2="${p.t + gh}" visibility="hidden"/><circle class="dot hover" r="5" visibility="hidden"/><rect class="hit" x="${p.l}" y="${p.t}" width="${gw}" height="${gh}"/>`;
 el.innerHTML = s + '</svg>';
 const tip = tooltip(el), cross = $('.cross', el), dot = $('.dot.hover', el), svg = $('svg', el);
 el.onpointermove = e => { const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * (w / r.width);
  if (x < p.l - 6 || x > w - p.r + 6) { el.onpointerleave(); return; }
  const i = clamp(Math.round((x - p.l) / (gw / Math.max(1, data.length - 1))), 0, data.length - 1), d = data[i]; if (d.value == null) return;
  cross.setAttribute('x1', sx(i)); cross.setAttribute('x2', sx(i)); cross.setAttribute('visibility', 'visible');
  dot.setAttribute('cx', sx(i)); dot.setAttribute('cy', sy(d.value)); dot.setAttribute('visibility', 'visible');
  tip.show(d.tip, sx(i) * (r.width / w), sy(d.value) * (r.height / h)); };
 el.onpointerleave = () => { tip.hide(); cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); };
}

/* time buckets for the overview charts */
const RANGES = {'6h':[6, HOUR], '24h':[12, 2 * HOUR], '7d':[7, DAY], '30d':[10, 3 * DAY]};
function buckets(rng, mid) {
 const [count, size] = RANGES[rng]; const dayBased = size >= DAY;
 const end = Date.now(), start = dayBased ? todayStart() + DAY - count * size : Math.floor(end / size) * size - (count - 1) * size;
 return Array.from({length: count}, (_, i) => {
  const from = start + i * size, to = from + size, rows = logs.filter(r => r.ts >= from && r.ts < to && (!mid || r.machineId === mid));
  const label = dayBased ? sdate(from) : `${pad(new Date(from).getHours())}:00`;
  return {from, to, label, rows, output: sum(rows, 'units'), cycle: rows.length ? sum(rows, 'cycle') / rows.length : null};
 });
}

/* ==========================================================================
   Views
   ========================================================================== */
const kpi = ({label, value, unit = '', cap, icon, tone = ''}) =>
 `<div class="pd-kpi ${tone}"><span class="pd-kpi-label">${esc(label)}${ico(icon)}</span><b class="pd-kpi-val">${value}${unit ? `<small>${unit}</small>` : ''}</b><span class="pd-kpi-cap">${esc(cap)}</span></div>`;

const busy = el => el.contains(document.activeElement) || el.matches(':hover');
const focused = el => el.contains(document.activeElement);
function drawOverview(full = true) {
 const today = stats(since(todayStart())), day = stats(since(Date.now() - DAY));
 const running = machines.filter(m => m.state === 'Running').length, act = activeAlarms().length;
 $('#pd-kpis').innerHTML = [
  kpi({label:'Active machines', value:`${running}<small>/ ${machines.length}</small>`, cap:'Currently running', icon:'cpu', tone: running === machines.length ? 'ok' : 'warn'}),
  kpi({label:'Production today', value:nf(today.output), cap:'Units, all machines', icon:'box'}),
  kpi({label:'Avg. cycle time', value:day.avgCycle.toFixed(1), unit:'s', cap:'Last 24 hours', icon:'clock'}),
  kpi({label:'First-pass yield', value:today.quality.toFixed(1), unit:'%', cap:'Good units / produced', icon:'check', tone: today.quality >= 98 ? 'ok' : 'warn'}),
  kpi({label:'Availability', value:day.availability, unit:'%', cap:'Running samples, 24 h', icon:'gauge', tone: day.availability >= 85 ? 'ok' : 'warn'}),
  kpi({label:'Active alarms', value:act, cap: act ? 'Needs attention' : 'All clear', icon:'bell', tone: act ? 'bad' : 'ok'})
 ].join('');
 $('#pd-fleet-sum').textContent = `· ${running} running, ${machines.filter(m => m.state === 'Stopped').length} stopped, ${machines.filter(m => m.state === 'Fault').length} fault`;
if (!focused($('#pd-fleet'))) $('#pd-fleet').innerHTML = machines.map(m => { const t = stats(since(todayStart(), m.id));
  return `<button type="button" class="pd-machine ${m.state.toLowerCase()}" data-machine="${m.id}" aria-label="${esc(m.name)}, ${m.state}. Open live view">
  <span class="pd-machine-top"><span class="pd-machine-id">${m.id} · ${m.short}</span>${stateBadge(m.state)}</span>
  <span><strong>${esc(m.name)}</strong><span class="pd-machine-loc" style="display:block">${esc(m.loc)}</span></span>
  <span class="pd-mstats"><span><small>Output today</small><b>${nf(t.output)}</b></span><span><small>Cycle</small><b>${m.cycle.toFixed(1)} s</b></span><span><small>Temp</small><b>${m.temp.toFixed(1)} °C</b></span></span>
  <span class="pd-plc-link"><span class="pd-led ${settings.on ? 'ok' : 'warn'}"></span>PLC link ${settings.on ? `OK · ${m.latency} ms` : 'paused'}</span></button>`; }).join('');
 const recent = logs.slice(-6).reverse();
if (!focused($('#pd-recent'))) $('#pd-recent').innerHTML = recent.map(r => `<tr class="click" data-log="${r.id}" tabindex="0"><td><span class="strong pd-mono">${tstr(r.ts)}</span><span class="sub">${sdate(r.ts)}</span></td><td class="strong">${shortName(r.machineId)}</td><td>${tag(r.event)}</td><td>${stateBadge(r.status)}</td><td class="r pd-mono">${r.units ? '+' + r.units : '—'}</td></tr>`).join('');
 const util = Math.round(running / machines.length * 100), motor = Math.round(100 - machines.reduce((s, m) => s + m.vibration, 0) / machines.length * 12);
 const tone = v => v >= 90 ? 'ok' : v < 70 ? 'warn' : '';
 $('#pd-health').innerHTML = [['Availability', day.availability], ['Quality (first-pass yield)', Math.round(day.quality)], ['Fleet utilisation', util], ['Motor health index', motor]]
  .map(([l, v]) => `<li><span>${l}</span><b>${v}%</b><span class="pd-meter" role="meter" aria-label="${l}" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="100"><i class="${tone(v)}" style="width:${v}%"></i></span></li>`).join('');
 if (full === 'tick') { if (!busy($('#pd-chart-prod')) && !busy($('#pd-chart-cycle'))) drawOverviewCharts(); }
 else if (full) drawOverviewCharts();
}
function drawOverviewCharts() {
 const b = buckets(range);
 const hours = RANGES[range][1] / HOUR;
 const target = machines.reduce((s, m) => s + 3600 / m.nominal * .88, 0) * hours;
 barChart($('#pd-chart-prod'), b.map((x, i) => ({label: x.label, value: x.output,
  tip: `<b>${nf(x.output)} units</b><span>${x.label}${i === b.length - 1 ? ' · in progress' : ''} · target ${nf(Math.round(target))}</span>`})),
  {target, targetLabel: 'Target', aria: `Production output by ${range} buckets`});
 const m = byId(cycleMachine), cb = buckets(range, cycleMachine);
 lineChart($('#pd-chart-cycle'), cb.map(x => ({label: x.label, value: x.cycle == null ? null : round1(x.cycle),
  tip: x.cycle == null ? '' : `<b>${x.cycle.toFixed(1)} s</b><span>${x.label} · ${m.short}</span>`})),
  {ref: m.nominal, refLabel: `Nominal ${m.nominal} s`, dp: 1, aria: `Average cycle time for ${m.short}`});
}

function drawLive(full = true) {
 const m = byId(selected), t = stats(since(todayStart(), m.id)), d = stats(since(Date.now() - DAY, m.id));
 $('#pd-live-machine').value = m.id;
 $('#pd-live-id').textContent = `${m.id} · ${m.short}`; $('#pd-live-name').textContent = m.name; $('#pd-live-loc').textContent = m.loc;
 $('#pd-live-badge').outerHTML = stateBadge(m.state).replace('<span class="pd-state', '<span id="pd-live-badge" class="pd-state');
 $('#pd-live-led').className = `pd-led live ${m.state === 'Running' ? 'ok' : m.state === 'Fault' ? 'bad' : 'warn'}`;
 $('#pd-live-state').textContent = m.state;
 const mins = Math.max(1, Math.round((Date.now() - m.since) / 60000));
 $('#pd-live-since').textContent = `for ${mins >= 60 ? Math.floor(mins / 60) + ' h ' + (mins % 60) + ' min' : mins + ' min'}`;
 $('#pd-packet').textContent = settings.on ? `${tstr(m.packet)} · ${m.latency} ms` : 'paused';
 $('#pd-packet-led').className = `pd-led ${settings.on ? 'ok live' : 'warn'}`;
 $('#pd-run').disabled = m.state !== 'Stopped'; $('#pd-stop').disabled = m.state !== 'Running';
 $('#pd-fault').disabled = m.state === 'Fault'; $('#pd-reset').disabled = m.state !== 'Fault';
 $('#pd-live-metrics').innerHTML = [
  kpi({label:'Output today', value:nf(t.output), cap:'Units', icon:'box'}),
  kpi({label:'Latest cycle', value:m.cycle.toFixed(1), unit:'s', cap:`Nominal ${m.nominal} s`, icon:'clock'}),
  kpi({label:'Quality', value:t.quality.toFixed(1), unit:'%', cap:'First-pass yield', icon:'check', tone: t.quality >= 98 ? 'ok' : 'warn'}),
  kpi({label:'Availability', value:d.availability, unit:'%', cap:'Last 24 h', icon:'gauge', tone: d.availability >= 85 ? 'ok' : 'warn'})
 ].join('');
 $('#pd-sensors').innerHTML = Object.entries(SENSORS).map(([k, s]) => { const v = m[k], high = v > s.limit;
  return `<div class="pd-sensor${high ? ' high' : ''}"><div class="pd-sensor-head"><span>${s.label}</span>${ico(s.icon)}</div><b class="pd-sensor-val">${v.toFixed(s.dp)}<small>${s.unit}</small></b>
  <div class="pd-gauge" role="meter" aria-label="${s.label}" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="${s.max}"><i style="width:${clamp(v / s.max * 100, 0, 100)}%"></i><s style="left:${s.limit / s.max * 100}%" title="Alarm limit"></s></div>
  <div class="pd-sensor-foot"><span>${s.range} · limit ${s.limit}</span><b>${high ? 'HIGH' : 'Normal'}</b></div></div>`; }).join('');
 const io = [['X0', 'Start input', m.state === 'Running'], ['X1', 'Guard closed', m.state !== 'Fault'], ['Y0', 'Motor output', m.state === 'Running'], ['Y1', 'Fault lamp', m.state === 'Fault'], ['D100', 'Cycle counter', null, nf(t.output)], ['D200', 'Temperature ×10', null, Math.round(m.temp * 10)]];
 $('#pd-io').innerHTML = '<li class="pd-io-title" aria-hidden="true">PLC I/O diagnostics</li>' + io.map(([addr, l, on, val]) => `<li><span><code>${addr}</code>${l}</span><span class="pd-io-val">${val != null ? val : `<span class="pd-led ${on ? (addr === 'Y1' ? 'bad' : 'ok') : ''}"></span>${on ? 'ON' : 'OFF'}`}</span></li>`).join('');
 $('#pd-trend-machine').textContent = `${m.short} · ${SENSORS[signal].label.toLowerCase()}`;
 if (full !== 'tick' || !$('#pd-chart-live').matches(':hover')) drawLiveChart();
}
function drawLiveChart() {
 const m = byId(selected), s = SENSORS[signal], tr = m.trend[signal];
 const n = tr.length;
 lineChart($('#pd-chart-live'), tr.map((p, i) => ({label: i === n - 1 ? 'now' : `−${Math.round((tr[n - 1].ts - p.ts) / 1000)}s`, value: p.v, tip: `<b>${p.v.toFixed(s.dp)} ${s.unit}</b><span>${tstr(p.ts)} · ${m.short}</span>`})),
  {minSpan: s.max * .18, limit: s.limit, limitLabel: `Alarm limit ${s.limit} ${s.unit}`, dp: s.dp, liveDot: true, min: signal === 'load' ? 0 : undefined, max: signal === 'load' ? 100 : undefined, aria: `Live ${s.label} trend for ${m.short}`});
}

/* ---------- logs ---------- */
function filteredLogs() {
 const q = $('#pd-q').value.trim().toLowerCase(), id = $('#pd-f-machine').value, ev = $('#pd-f-event').value, st = $('#pd-f-status').value, from = $('#pd-f-from').value, to = $('#pd-f-to').value;
 const rows = logs.filter(r => {
  if (id && r.machineId !== id || ev && r.event !== ev || st && r.status !== st) return false;
  if (from || to) { const d = dstr(r.ts); if (from && d < from || to && d > to) return false; }
  if (!q) return true;
  const m = byId(r.machineId); return `${r.id} ${r.machineId} ${m.short} ${m.name} ${r.event} ${r.status} ${r.message}`.toLowerCase().includes(q);
 });
 return rows.sort((a, b) => { const x = a[sortKey], y = b[sortKey]; return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sortDir || (b.ts - a.ts); });
}
function drawLogs() {
 newLogs = 0; $('#pd-log-new').hidden = true;
 const rows = filteredLogs(), size = +$('#pd-page-size').value, pages = Math.max(1, Math.ceil(rows.length / size));
 logPage = clamp(logPage, 1, pages);
 const sub = rows.slice((logPage - 1) * size, logPage * size);
 $('#pd-log-count').textContent = `${nf(rows.length)} matching record${rows.length === 1 ? '' : 's'} · ${nf(logs.length)} samples in total`;
 $('#pd-log-rows').innerHTML = sub.map(r => `<tr class="click" data-log="${r.id}" tabindex="0"><td><span class="strong pd-mono">${dtstr(r.ts)}</span><span class="sub">${r.id}</span></td><td class="strong">${shortName(r.machineId)}</td><td>${tag(r.event)}</td><td>${stateBadge(r.status)}</td><td class="r pd-mono">${nf(r.units)}</td><td class="r pd-mono">${r.cycle.toFixed(1)}</td><td class="r pd-mono">${r.temp.toFixed(1)}</td><td class="msg" title="${esc(r.message)}">${esc(r.message)}</td></tr>`).join('')
  || `<tr><td colspan="8" class="pd-empty">No records match these filters. Widen the dates or reset the filters.</td></tr>`;
 $('#pd-log-info').textContent = rows.length ? `Showing ${nf((logPage - 1) * size + 1)}–${nf(Math.min(logPage * size, rows.length))} of ${nf(rows.length)}` : 'No matching records';
 let a = Math.max(1, logPage - 2), b = Math.min(pages, a + 4); a = Math.max(1, b - 4);
 const btn = (label, pg, opts = '') => `<button type="button" data-page="${pg}" ${opts}>${label}</button>`;
 let h = btn('‹', logPage - 1, `aria-label="Previous page" ${logPage === 1 ? 'disabled' : ''}`);
 for (let i = a; i <= b; i++) h += btn(i, i, i === logPage ? 'aria-current="page"' : `aria-label="Page ${i}"`);
 $('#pd-pages').innerHTML = h + btn('›', logPage + 1, `aria-label="Next page" ${logPage === pages ? 'disabled' : ''}`);
 $$('#pd-log-table th').forEach(th => { const k = th.querySelector('[data-sort]')?.dataset.sort; if (k === sortKey) th.setAttribute('aria-sort', sortDir > 0 ? 'ascending' : 'descending'); else th.removeAttribute('aria-sort'); });
}
function openLog(id) {
 const r = logs.find(x => x.id === id); if (!r) return; const m = byId(r.machineId);
 $('#pd-dialog-title').textContent = `${r.id} · PLC record`;
 const f = [['Timestamp', dtstr(r.ts)], ['Machine', `${m.short} · ${m.name}`], ['Event', r.event], ['Machine state', r.status], ['Units produced', r.units], ['Rejected units', r.rejects], ['Cycle time', r.cycle + ' s'], ['Temperature', r.temp + ' °C'], ['Pressure', r.pressure + ' bar'], ['Vibration', r.vibration + ' mm/s'], ['Motor load', r.load + ' %'], ['Power', r.power + ' kW']];
 $('#pd-dialog-body').innerHTML = `<dl class="pd-detail">${f.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl><p class="pd-dialog-msg">${esc(r.message)}${r.severity ? ` · Severity: ${esc(r.severity)}` : ''}</p>`;
 const dlg = $('#pd-dialog'); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
}

/* ---------- reports ---------- */
const REPORT_TITLES = {production:'Production summary', quality:'Quality & reject analysis', downtime:'Downtime analysis', alarms:'Alarm history'};
function generateReport(silent = false) {
 const type = $('#pd-r-type').value, mid = $('#pd-r-machine').value, from = $('#pd-r-from').value, to = $('#pd-r-to').value;
 if (from && to && from > to) { notify('The start date must be on or before the end date.', 'warn'); return; }
 const rows0 = logs.filter(r => (!mid || r.machineId === mid) && (!from || dstr(r.ts) >= from) && (!to || dstr(r.ts) <= to));
 const st = stats(rows0), alarmsN = rows0.filter(r => r.event === 'Alarm').length, down = rows0.filter(r => r.status !== 'Running').length;
 let headers = [], rows = [], chart = [], chartTitle = '', chartSub = '', fmt;
 if (type === 'production' || type === 'quality') {
  const g = {}; rows0.forEach(r => { const k = dstr(r.ts) + '|' + r.machineId; (g[k] ||= {day: dstr(r.ts), mid: r.machineId, units: 0, rejects: 0, n: 0, cycle: 0, run: 0}); const x = g[k]; x.units += r.units; x.rejects += r.rejects; x.n++; x.cycle += r.cycle; x.run += r.status === 'Running' ? 1 : 0; });
  const list = Object.values(g).sort((a, b) => a.day === b.day ? a.mid.localeCompare(b.mid) : b.day.localeCompare(a.day));
  if (type === 'production') { headers = ['Date', 'Machine', 'Produced', 'Rejected', 'Avg cycle (s)', 'Availability (%)']; rows = list.map(x => [x.day, shortName(x.mid), x.units, x.rejects, round1(x.cycle / x.n), Math.round(x.run / x.n * 100)]); }
  else { headers = ['Date', 'Machine', 'Inspected', 'Passed', 'Rejected', 'Yield (%)']; rows = list.map(x => [x.day, shortName(x.mid), x.units, x.units - x.rejects, x.rejects, x.units ? round1((x.units - x.rejects) / x.units * 100) : 0]); }
  const days = {}; rows0.forEach(r => { const d = dstr(r.ts); (days[d] ||= {u: 0, rj: 0}); days[d].u += r.units; days[d].rj += r.rejects; });
  chart = Object.keys(days).sort().map(d => { const v = type === 'production' ? days[d].u : days[d].rj; return {label: sdate(d + 'T00:00'), value: v, tip: `<b>${nf(v)} ${type === 'production' ? 'units' : 'rejects'}</b><span>${sdate(d + 'T00:00')}</span>`}; });
  chartTitle = type === 'production' ? 'Daily output' : 'Daily rejected units'; chartSub = mid ? shortName(mid) : 'All machines';
 } else if (type === 'downtime') {
  const g = {}; rows0.forEach(r => { (g[r.machineId] ||= {Running: 0, Stopped: 0, Fault: 0, n: 0}); g[r.machineId][r.status]++; g[r.machineId].n++; });
  headers = ['Machine', 'Running samples', 'Stopped samples', 'Fault samples', 'Non-running*', 'Availability (%)'];
  rows = Object.entries(g).map(([id, v]) => [shortName(id), v.Running, v.Stopped, v.Fault, v.Stopped + v.Fault, Math.round(v.Running / v.n * 100)]);
  chart = rows.map(r => ({label: r[0], value: r[5], tip: `<b>${r[5]} % available</b><span>${r[0]} · ${r[4]} non-running samples</span>`}));
  chartTitle = 'Availability by machine'; chartSub = 'Share of samples in Running state'; fmt = v => Math.round(v) + '%';
 } else {
  const ev = rows0.filter(r => r.event === 'Alarm').sort((a, b) => b.ts - a.ts);
  headers = ['Timestamp', 'Machine', 'Severity', 'Machine state', 'Description']; rows = ev.map(r => [dtstr(r.ts), shortName(r.machineId), r.severity || 'Warning', r.status, r.message]);
  const g = {}; machines.forEach(m => g[m.id] = 0); ev.forEach(r => g[r.machineId]++);
  chart = Object.entries(g).map(([id, n]) => ({label: shortName(id), value: n, tip: `<b>${n} alarm event${n === 1 ? '' : 's'}</b><span>${shortName(id)}</span>`}));
  chartTitle = 'Alarm events by machine'; chartSub = 'Selected period';
 }
 const now = new Date();
 report = {type, headers, rows, generated: now.getTime()};
 $('#pd-rep-title').textContent = REPORT_TITLES[type];
 $('#pd-rep-period').textContent = `${from || 'Start of history'} to ${to || 'today'} · ${mid ? byId(mid).short + ' · ' + byId(mid).name : 'All machines'} · ${nf(rows0.length)} PLC samples`;
 $('#pd-rep-id').textContent = `RPT-${dstr(now).replace(/-/g, '')}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
 $('#pd-rep-gen').textContent = dtstr(now);
 const cards = [['Total output', nf(st.output) + ' units'], ['Rejected units', nf(st.rejects)], ['First-pass yield', st.quality.toFixed(1) + ' %'], type === 'alarms' ? ['Alarm events', nf(alarmsN)] : ['Availability', st.availability + ' %']];
 $('#pd-rep-cards').innerHTML = cards.map(([a, b]) => `<div class="pd-rep-card"><span>${a}</span><b>${b}</b></div>`).join('');
 $('#pd-rep-chart-title').textContent = chartTitle; $('#pd-rep-chart-sub').textContent = chartSub;
 const rc = $('#pd-chart-report');
 if (chart.length) barChart(rc, chart, {fmt, aria: chartTitle}); else rc.innerHTML = '<p class="pd-fine" style="padding-top:60px;text-align:center">No samples in this period.</p>';
 report.chart = {data: chart, fmt, title: chartTitle};
 const LIMIT = 120;
 $('#pd-rep-head').innerHTML = '<tr>' + headers.map((h, i) => `<th scope="col"${i > 1 && type !== 'alarms' ? ' class="r"' : ''}>${esc(h)}</th>`).join('') + '</tr>';
 $('#pd-rep-body').innerHTML = rows.slice(0, LIMIT).map(r => '<tr>' + r.map((c, i) => `<td class="${i === 0 ? 'strong' : ''}${i > 1 && type !== 'alarms' ? ' r pd-mono' : ''}">${esc(typeof c === 'number' ? nf(c) : c)}</td>`).join('') + '</tr>').join('')
  || `<tr><td colspan="${headers.length}" class="pd-empty">No sample records in this date range.</td></tr>`;
 $('#pd-rep-rows').textContent = `${nf(rows.length)} rows${rows.length > LIMIT ? ` · first ${LIMIT} shown here, exports include all` : ''}`;
 $('#pd-rep-foot').textContent = (type === 'downtime' ? '*Non-running counts are hourly samples, not exact downtime durations. ' : '') + 'All figures are generated sample values for demonstration, not real production records.';
 if (!silent) notify(`Report generated from ${nf(rows0.length)} sample records.`);
}

/* ---------- alarms ---------- */
function drawAlarms() {
 const act = activeAlarms(), crit = act.filter(a => a.severity === 'Critical'), ack = alarms.filter(a => a.state === 'Acknowledged');
 $('#pd-alarm-kpis').innerHTML = [
  kpi({label:'Active alarms', value:act.length, cap:'Currently unresolved', icon:'bell', tone: act.length ? 'bad' : 'ok'}),
  kpi({label:'Critical', value:crit.length, cap:'Requires attention', icon:'alert', tone: crit.length ? 'bad' : 'ok'}),
  kpi({label:'Acknowledged', value:ack.length, cap:'Reviewed, fault may persist', icon:'check', tone: ack.length ? 'warn' : ''})
 ].join('');
 const f = $('#pd-alarm-filter').value, rows = alarms.filter(a => f === 'all' || a.state.toLowerCase() === f).sort((a, b) => b.ts - a.ts);
 $('#pd-alarm-rows').innerHTML = rows.map(a => `<tr><td><span class="strong pd-mono">${tstr(a.ts)}</span><span class="sub">${sdate(a.ts)}</span></td><td style="white-space:normal;min-width:220px"><span class="pd-alarm-title">${esc(a.title)}</span><span class="sub">${a.id} · ${esc(a.message)}</span></td><td class="strong">${shortName(a.machineId)}</td><td>${tag(a.severity)}</td><td>${tag(a.state)}</td><td>${a.state === 'Active' ? `<button class="pd-btn sm" type="button" data-ack="${a.id}">${ico('check')}Acknowledge</button>` : '—'}</td></tr>`).join('')
  || `<tr><td colspan="6" class="pd-empty">No alarms in this category.</td></tr>`;
 $('#pd-ack-all').disabled = !act.length;
}
function syncAlarmBadge() { const n = activeAlarms().length, c = $('#pd-alarm-count'); c.textContent = n; c.hidden = !n; }

/* ---------- machine control (simulated) ---------- */
function changeState(next) {
 const m = byId(selected); if (m.state === next) return; const prev = m.state;
 m.state = next; m.since = Date.now(); m.packet = Date.now();
 const msg = next === 'Fault' ? 'Drive overload · simulated emergency stop' : next === 'Running' ? 'Operator started machine' : prev === 'Fault' ? 'Fault reset by operator' : 'Operator stopped machine';
 if (next === 'Fault') { alarms.unshift({id: `AL-${++alarmSeq}`, ts: Date.now(), machineId: m.id, title: 'Drive overload / emergency stop', severity: 'Critical', state: 'Active', message: 'Simulated fault triggered from the live monitor.'}); }
 if (prev === 'Fault') alarms.filter(a => a.machineId === m.id && a.state !== 'Cleared').forEach(a => a.state = 'Cleared');
 if (next !== 'Running') m.load = Math.min(m.load, 6);
 addLog({machineId: m.id, event: next === 'Fault' ? 'Alarm' : 'Status', status: next, message: msg, severity: next === 'Fault' ? 'Critical' : ''});
 newLogs++; syncAlarmBadge(); drawLive(); notify(`${m.short} → ${next}`, next === 'Fault' ? 'bad' : next === 'Running' ? 'ok' : 'warn');
}

/* ---------- simulation loop ---------- */
function tick() {
 if (!settings.on) return; ticks++;
 machines.forEach(m => {
  jitter(m); m.packet = Date.now(); pushTrend(m);
  if (ticks % 2 === 0) { const run = m.state === 'Running', units = run && Math.random() > .2 ? 1 : 0;
   addLog({machineId: m.id, event: units ? 'Production' : 'Telemetry', units, rejects: units && Math.random() < .015 ? 1 : 0, message: units ? 'Part cycle complete' : 'PLC heartbeat · telemetry received'}); newLogs++; }
 });
 if (logs.length > 9000) logs.splice(0, logs.length - 8800);
 refresh();
}
function refresh() {
 syncAlarmBadge();
 if (view === 'overview') drawOverview('tick');
 else if (view === 'live') drawLive('tick');
 else if (view === 'logs' && newLogs) { const b = $('#pd-log-new'); b.hidden = false; b.textContent = `+${newLogs} new record${newLogs === 1 ? '' : 's'} · refresh`; }
}
function schedule() {
 clearInterval(timer); timer = null;
 if (visible && settings.on && !document.hidden) timer = setInterval(tick, settings.interval);
 const on = settings.on;
 $('#pd-gw-state').textContent = on ? 'Simulating' : 'Paused';
 $('#pd-gw-led').className = `pd-led ${on ? 'ok live' : 'warn'}`;
 $('#pd-gw-rate').textContent = `${settings.interval / 1000} s`;
 $('#pd-rate-txt').textContent = on ? `Every ${settings.interval / 1000} seconds` : 'Paused';
 const t = $('#pd-toggle'); t.setAttribute('aria-pressed', String(!on)); t.innerHTML = on ? `${ico('pause')}<span>Pause</span>` : `${ico('play')}<span>Resume</span>`;
 $('#pd-interval').value = String(settings.interval);
}
const clock = () => { $('#pd-clock').textContent = tstr(Date.now()); };

/* ---------- navigation ---------- */
const tabs = $$('.pd-tab', app);
function setView(name, focus = false) {
 if (!$('#pd-view-' + name)) return; view = name;
 tabs.forEach(t => { const on = t.dataset.view === name; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
 $$('.pd-view', app).forEach(v => { const on = v.id === 'pd-view-' + name; v.hidden = !on; if (on && !reduce) { v.classList.remove('in'); void v.offsetWidth; v.classList.add('in'); } });
 if (name === 'overview') drawOverview(); else if (name === 'live') drawLive(); else if (name === 'logs') drawLogs(); else if (name === 'reports') { if (!report) generateReport(true); else redrawReportChart(); } else if (name === 'alarms') drawAlarms();
 const tab = tabs.find(t => t.dataset.view === name), bar = tab?.parentElement;
 if (bar && bar.scrollWidth > bar.clientWidth) { const l = tab.offsetLeft - 12, r = tab.offsetLeft + tab.offsetWidth + 12; if (l < bar.scrollLeft) bar.scrollLeft = l; else if (r > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = r - bar.clientWidth; }
}
function goTo(name) { setView(name); const top = app.getBoundingClientRect().top; if (top < 0 || top > innerHeight * .5) app.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'}); }
function redrawReportChart() { if (report?.chart?.data.length) barChart($('#pd-chart-report'), report.chart.data, {fmt: report.chart.fmt, aria: report.chart.title}); }

/* ---------- exports ---------- */
function download(blob, name) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.style.display = 'none'; document.body.append(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1000); }
function exportData(kind, format) {
 let headers, rows, name;
 if (kind === 'logs') { const sub = filteredLogs(); headers = ['Timestamp', 'Event ID', 'Machine ID', 'Machine', 'Event', 'State', 'Units', 'Rejects', 'Cycle time (s)', 'Temperature (C)', 'Pressure (bar)', 'Vibration (mm/s)', 'Motor load (%)', 'Power (kW)', 'Message'];
  rows = sub.map(r => [dtstr(r.ts), r.id, r.machineId, byId(r.machineId).name, r.event, r.status, r.units, r.rejects, r.cycle, r.temp, r.pressure, r.vibration, r.load, r.power, r.message]); name = `PLC_Event_Log_${dstr(Date.now())}`; }
 else { if (!report) generateReport(true); if (!report) return; headers = report.headers; rows = report.rows; name = `PLC_${report.type}_report_${dstr(Date.now())}`; }
 if (!rows.length) { notify('There are no records to export with the current filters.', 'warn'); return; }
 if (format === 'csv') { const line = a => a.map(v => { let s = String(v ?? ''); if (/^[\s]*[=+@-]/.test(s) && isNaN(Number(s))) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }).join(',');
  download(new Blob(['﻿', line(headers) + '\r\n', ...rows.map(r => line(r) + '\r\n')], {type: 'text/csv;charset=utf-8'}), name + '.csv'); }
 else download(makeXlsx([headers, ...rows]), name + '.xlsx');
 notify(`Exported ${nf(rows.length)} rows as ${format === 'csv' ? 'CSV' : 'Excel'}.`);
}
/* Minimal, valid Office Open XML workbook (stored ZIP), built without a library. */
function makeXlsx(table) {
 const x = t => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const col = i => { let t = ''; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) t = String.fromCharCode(65 + (n - 1) % 26) + t; return t; };
 const body = table.map((row, ri) => `<row r="${ri + 1}">${row.map((v, ci) => { const ref = col(ci) + (ri + 1); const st = ri === 0 ? ' s="1"' : '';
  return typeof v === 'number' && Number.isFinite(v) ? `<c r="${ref}"${st}><v>${v}</v></c>` : `<c r="${ref}" t="inlineStr"${st}><is><t xml:space="preserve">${x(v)}</t></is></c>`; }).join('')}</row>`).join('');
 const cols = table[0].map((h, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(48, Math.max(13, String(h).length + 6, ...table.slice(1, 60).map(r => String(r[i] ?? '').length + 2)))}" customWidth="1"/>`).join('');
 const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${body}</sheetData><autoFilter ref="A1:${col(table[0].length - 1)}${table.length}"/></worksheet>`;
 const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B1426"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
 const files = [
  ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
  ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
  ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="PLC Export" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">\'PLC Export\'!$A$1:$' + col(table[0].length - 1) + '$' + table.length + '</definedName></definedNames></workbook>'],
  ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
  ['xl/styles.xml', styles],
  ['xl/worksheets/sheet1.xml', sheet]
 ];
 const enc = new TextEncoder(), crcT = new Uint32Array(256);
 for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[i] = c >>> 0; }
 const crc = b => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
 const chunks = [], central = []; let off = 0;
 for (const [fn, content] of files) {
  const n = enc.encode(fn), d = enc.encode(content), ck = crc(d);
  const lo = new Uint8Array(30 + n.length + d.length), lv = new DataView(lo.buffer);
  lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); lv.setUint32(14, ck, true); lv.setUint32(18, d.length, true); lv.setUint32(22, d.length, true); lv.setUint16(26, n.length, true);
  lo.set(n, 30); lo.set(d, 30 + n.length); chunks.push(lo);
  const ce = new Uint8Array(46 + n.length), cv = new DataView(ce.buffer);
  cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint32(16, ck, true); cv.setUint32(20, d.length, true); cv.setUint32(24, d.length, true); cv.setUint16(28, n.length, true); cv.setUint32(42, off, true);
  ce.set(n, 46); central.push(ce); off += lo.length;
 }
 const cs = central.reduce((s, c) => s + c.length, 0), end = new Uint8Array(22), ev = new DataView(end.buffer);
 ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true); ev.setUint32(12, cs, true); ev.setUint32(16, off, true);
 return new Blob([...chunks, ...central, end], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

/* ---------- setup & events ---------- */
const dateRange = days => { const to = new Date(), from = new Date(); from.setDate(to.getDate() - (days - 1)); return [dstr(from), dstr(to)]; };
(function setupInputs() {
 const all = '<option value="">All machines</option>' + machines.map(m => `<option value="${m.id}">${m.short} · ${m.name}</option>`).join('');
 $('#pd-f-machine').innerHTML = all; $('#pd-r-machine').innerHTML = all;
 const one = machines.map(m => `<option value="${m.id}">${m.short} · ${m.name}</option>`).join('');
 $('#pd-live-machine').innerHTML = one; $('#pd-cycle-machine').innerHTML = machines.map(m => `<option value="${m.id}">${m.short}</option>`).join('');
 const [f, t] = dateRange(7); $('#pd-f-from').value = f; $('#pd-f-to').value = t; $('#pd-r-from').value = f; $('#pd-r-to').value = t;
})();

app.addEventListener('click', e => {
 const go = e.target.closest('[data-go]'); if (go) { goTo(go.dataset.go); return; }
 const tab = e.target.closest('.pd-tab'); if (tab) { setView(tab.dataset.view); return; }
 const mc = e.target.closest('[data-machine]'); if (mc) { selected = mc.dataset.machine; goTo('live'); return; }
 const lg = e.target.closest('[data-log]'); if (lg) { openLog(lg.dataset.log); return; }
 const pg = e.target.closest('[data-page]'); if (pg && !pg.disabled) { logPage = +pg.dataset.page; drawLogs(); return; }
 const so = e.target.closest('[data-sort]'); if (so) { const k = so.dataset.sort; if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = k === 'ts' || k === 'units' ? -1 : 1; } logPage = 1; drawLogs(); return; }
 const rg = e.target.closest('[data-range]'); if (rg) { range = rg.dataset.range; $$('[data-range]', app).forEach(b => b.setAttribute('aria-pressed', String(b === rg))); drawOverviewCharts(); return; }
 const sg = e.target.closest('[data-sig]'); if (sg) { signal = sg.dataset.sig; $$('[data-sig]', app).forEach(b => b.setAttribute('aria-pressed', String(b === sg))); drawLive(); return; }
 const q = e.target.closest('[data-quick]'); if (q) { const v = q.dataset.quick;
  if (v === 'reset') { $('#pd-q').value = ''; ['#pd-f-machine', '#pd-f-event', '#pd-f-status'].forEach(s => $(s).value = ''); [$('#pd-f-from').value, $('#pd-f-to').value] = dateRange(7); }
  else if (v === 'all') { $('#pd-f-from').value = ''; $('#pd-f-to').value = ''; }
  else { [$('#pd-f-from').value, $('#pd-f-to').value] = v === 'today' ? [dstr(Date.now()), dstr(Date.now())] : dateRange(7); }
  logPage = 1; drawLogs(); return; }
 const ak = e.target.closest('[data-ack]'); if (ak) { const a = alarms.find(x => x.id === ak.dataset.ack); if (a) { a.state = 'Acknowledged'; drawAlarms(); syncAlarmBadge(); notify(`${a.id} acknowledged. The machine fault is not reset.`, 'warn'); } }
});
app.addEventListener('keydown', e => {
 const row = e.target.closest?.('tr[data-log]'); if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLog(row.dataset.log); return; }
 const tab = e.target.closest?.('.pd-tab'); if (!tab) return;
 const i = tabs.indexOf(tab); let n = null;
 if (e.key === 'ArrowRight') n = (i + 1) % tabs.length; else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
 if (n != null) { e.preventDefault(); setView(tabs[n].dataset.view, true); }
});
$('#pd-toggle').addEventListener('click', () => { settings.on = !settings.on; saveSettings(); schedule(); refresh(); notify(settings.on ? 'Simulation resumed.' : 'Simulation paused. Values are frozen.', settings.on ? 'ok' : 'warn'); });
$('#pd-interval').addEventListener('change', e => { settings.interval = +e.target.value; saveSettings(); schedule(); notify(`Polling every ${settings.interval / 1000} s.`); });
$('#pd-cycle-machine').addEventListener('change', e => { cycleMachine = e.target.value; drawOverviewCharts(); });
$('#pd-live-machine').addEventListener('change', e => { selected = e.target.value; drawLive(); });
$('#pd-run').addEventListener('click', () => changeState('Running'));
$('#pd-stop').addEventListener('click', () => changeState('Stopped'));
$('#pd-fault').addEventListener('click', () => changeState('Fault'));
$('#pd-reset').addEventListener('click', () => changeState('Stopped'));
let qTimer; $('#pd-q').addEventListener('input', () => { clearTimeout(qTimer); qTimer = setTimeout(() => { logPage = 1; drawLogs(); }, 160); });
['#pd-f-machine', '#pd-f-event', '#pd-f-status', '#pd-f-from', '#pd-f-to', '#pd-page-size'].forEach(s => $(s).addEventListener('change', () => { logPage = 1; drawLogs(); }));
$('#pd-log-new').addEventListener('click', drawLogs);
$('#pd-logs-csv').addEventListener('click', () => exportData('logs', 'csv'));
$('#pd-logs-xlsx').addEventListener('click', () => exportData('logs', 'xlsx'));
$('#pd-r-go').addEventListener('click', () => generateReport());
$('#pd-r-csv').addEventListener('click', () => exportData('report', 'csv'));
$('#pd-r-xlsx').addEventListener('click', () => exportData('report', 'xlsx'));
$('#pd-r-print').addEventListener('click', () => { if (!report) generateReport(true); document.documentElement.classList.add('pd-printing'); window.print(); });
addEventListener('afterprint', () => document.documentElement.classList.remove('pd-printing'));
$('#pd-alarm-filter').addEventListener('change', drawAlarms);
$('#pd-ack-all').addEventListener('click', () => { const a = activeAlarms(); if (!a.length) return; a.forEach(x => x.state = 'Acknowledged'); drawAlarms(); syncAlarmBadge(); notify(`${a.length} alarm${a.length === 1 ? '' : 's'} acknowledged. Faults are not reset.`, 'warn'); });
const dlg = $('#pd-dialog');
dlg.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === dlg) dlg.close ? dlg.close() : dlg.removeAttribute('open'); });

/* redraw charts when their width changes */
let rz; if ('ResizeObserver' in window) new ResizeObserver(() => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => {
 if (view === 'overview') drawOverviewCharts(); else if (view === 'live') drawLiveChart(); else if (view === 'reports') redrawReportChart(); }); }).observe(app);

/* run only while the section is on screen and the browser tab is visible */
if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) refresh(); schedule(); }, {rootMargin: '120px 0px'}).observe(app);
else { visible = true; }
document.addEventListener('visibilitychange', schedule);
setInterval(() => { if (visible) clock(); }, 1000);

/* deep links: index.html#plc-demo-logs, #plc-demo-reports, … */
const fromHash = () => { const m = location.hash.match(/^#plc-demo-(overview|live|logs|reports|alarms)$/); if (m) { setView(m[1]); requestAnimationFrame(() => app.scrollIntoView({block: 'start'})); } };
addEventListener('hashchange', fromHash);

clock(); syncAlarmBadge(); schedule(); drawOverview(); fromHash();
window.PLC_DEMO = {setView, getLogs: () => logs, getAlarms: () => alarms, machines};
})();
