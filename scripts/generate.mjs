// JUJUSEMPIX // gerador de SVGs do perfil (estilo "calling card": vermelho, preto e branco, letras de recorte)
//
// Uso:
//   node scripts/generate.mjs static  assets   -> peças fixas (header, stack, títulos, contatos, footer)
//   node scripts/generate.mjs dynamic dist     -> peças com dados do GitHub (status, linguagens, atividade)
//
// Variáveis de ambiente:
//   GITHUB_TOKEN    token para a API GraphQL (no Actions: secrets.GITHUB_TOKEN já basta)
//   FALLBACK_TOKEN  token reserva, usado se o primeiro falhar
//   GH_USER         usuário (padrão: Jujusempix)
//   MOCK_FILE       JSON com a resposta da GraphQL, para testar sem rede

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const USER = process.env.GH_USER || "Jujusempix";

// ───────────────────────── CONFIG (edite à vontade) ─────────────────────────
const PROFILE = {
  first: "JULIO",
  last: "CEZAR",
  codename: "JUJUSEMPIX",
  role: "DESENVOLVEDOR",
  card: [
    "A partir de hoje, cada linha",
    "de código deste perfil vai",
    "roubar a sua atenção.",
    "Não adianta resistir.",
  ],
  signature: "— J.C.",
};

const STACK = [
  "HTML5", "CSS3", "JAVASCRIPT", "TYPESCRIPT", "REACT", "BOOTSTRAP",
  "JAVA", "SPRING", "NESTJS", "MYSQL", "JEST", "POSTMAN",
];

// ───────────────────────── VISUAL ─────────────────────────
const C = { red: "#d7001b", red2: "#ff1e3c", black: "#0a0a0a", white: "#ffffff", gray: "#2a2a2a", dark: "#141414" };

const FONTS = {
  anton: ["anton", "anton-latin-400-normal.woff2", "'P5Anton','Anton','Impact',sans-serif", 0.47],
  archivo: ["archivo-black", "archivo-black-latin-400-normal.woff2", "'P5Archivo','Archivo Black','Arial Black',sans-serif", 0.72],
  abril: ["abril-fatface", "abril-fatface-latin-400-normal.woff2", "'P5Abril','Abril Fatface','Georgia',serif", 0.66],
  bebas: ["bebas-neue", "bebas-neue-latin-400-normal.woff2", "'P5Bebas','Bebas Neue','Impact',sans-serif", 0.42],
};
const FAMILY = { anton: "P5Anton", archivo: "P5Archivo", abril: "P5Abril", bebas: "P5Bebas" };

function fontData(key) {
  const [pkg, file] = FONTS[key];
  const candidates = [
    join(HERE, "node_modules", "@fontsource", pkg, "files", file),
    join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file),
    process.env.FONT_DIR ? join(process.env.FONT_DIR, "node_modules", "@fontsource", pkg, "files", file) : "",
  ].filter(Boolean);
  const p = candidates.find((c) => existsSync(c));
  return p ? readFileSync(p).toString("base64") : null;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// gerador pseudo-aleatório com semente: o recorte das letras fica igual a cada geração
function rng(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function svg(w, h, body, { fonts = ["anton"], css = "", title = "" } = {}) {
  let face = "";
  for (const k of fonts) {
    const d = fontData(k);
    if (d) face += `@font-face{font-family:'${FAMILY[k]}';src:url(data:font/woff2;base64,${d}) format('woff2');}`;
  }
  const cls = Object.entries(FONTS).map(([k, v]) => `.${k}{font-family:${v[2]};}`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"${title ? ` aria-label="${esc(title)}"` : ""}>
<style>${face}${cls}
.spin{animation:spin 9s linear infinite;transform-box:fill-box;transform-origin:center;}
@keyframes spin{to{transform:rotate(360deg);}}
.pulse{animation:pulse 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center;}
@keyframes pulse{50%{transform:scale(1.12);}}
.blink{animation:blink 1s steps(1) infinite;}
@keyframes blink{50%{opacity:0;}}
${css}
</style>
<defs>
  <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="5" cy="5" r="2.4" fill="#000"/></pattern>
  <pattern id="wdots" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="4.5" cy="4.5" r="1.6" fill="#fff"/></pattern>
  <pattern id="rdots" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="4" cy="4" r="1.7" fill="${C.red}"/></pattern>
  <linearGradient id="fadeR" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>
  <linearGradient id="fadeL" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="fadeD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
${body}
</svg>`;
}

function star(cx, cy, r, ri = r * 0.45, n = 5, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const rr = i % 2 ? ri : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

// título "de recorte": cada letra num pedaço de papel diferente
const STYLES = [
  [C.white, C.black], [C.black, C.white], [C.white, C.red], [C.red, C.black], [C.black, C.red2], [C.white, C.black],
];
function ransom(text, x, y, size, seed, { delay = 0, step = 0.07, fonts = ["anton", "archivo", "abril", "bebas"] } = {}) {
  const r = rng(seed);
  let cx = x, out = "", i = 0;
  for (const ch of text) {
    if (ch === " ") { cx += size * 0.35; continue; }
    const f = fonts[Math.floor(r() * fonts.length)];
    const [bg, fg] = STYLES[Math.floor(r() * STYLES.length)];
    const s = size * (0.86 + r() * 0.28);
    const cw = Math.max(s * FONTS[f][3], s * 0.36) + s * 0.24;
    const ch2 = s * 1.08;
    const rot = (r() - 0.5) * 16;
    const dy = (r() - 0.5) * size * 0.14;
    const t0 = delay + i * step, dur = t0 + 0.32;
    const k1 = (t0 / dur).toFixed(3), k2 = ((t0 + 0.2) / dur).toFixed(3);
    const pad = s * 0.06;
    out += `<g transform="translate(${(cx + cw / 2).toFixed(1)} ${(y + dy).toFixed(1)}) rotate(${rot.toFixed(1)})"><g>
  <animateTransform attributeName="transform" type="scale" values="0;0;1.25;1" keyTimes="0;${k1};${k2};1" dur="${dur.toFixed(2)}s" fill="freeze"/>
  <rect x="${(-cw / 2 + 4).toFixed(1)}" y="${(-ch2 / 2 + 5).toFixed(1)}" width="${cw.toFixed(1)}" height="${ch2.toFixed(1)}" fill="#000" opacity=".55"/>
  <rect x="${(-cw / 2).toFixed(1)}" y="${(-ch2 / 2).toFixed(1)}" width="${cw.toFixed(1)}" height="${ch2.toFixed(1)}" fill="${bg}" stroke="${bg === C.white ? C.black : C.white}" stroke-width="${pad.toFixed(1)}"/>
  <text x="0" y="${(s * 0.36).toFixed(1)}" class="${f}" font-size="${s.toFixed(1)}" fill="${fg}" text-anchor="middle">${esc(ch)}</text>
</g></g>`;
    cx += cw + size * 0.04;
    i++;
  }
  return { svg: out, width: cx - x };
}

// faixa preta inclinada com texto branco
function ribbon(x, y, w, h, text, size, { skew = -12, bg = C.black, fg = C.white, font = "anton", shadow = C.red } = {}) {
  return `<g transform="translate(${x} ${y}) skewX(${skew})">
  <rect x="7" y="6" width="${w}" height="${h}" fill="${shadow}"/>
  <rect width="${w}" height="${h}" fill="${bg}" stroke="${C.white}" stroke-width="3"/>
  <text x="${w / 2}" y="${h / 2 + size * 0.36}" class="${font}" font-size="${size}" fill="${fg}" text-anchor="middle" letter-spacing="2">${esc(text)}</text>
</g>`;
}

// ───────────────────────── PEÇAS FIXAS ─────────────────────────
function header() {
  const W = 1000, H = 380;
  const first = ransom(PROFILE.first, 60, 150, 92, PROFILE.first + "a", { delay: 0.2 });
  const last = ransom(PROFILE.last, 110, 262, 80, PROFILE.last + "b", { delay: 0.2 + PROFILE.first.length * 0.07 });
  const cardX = 640, cardY = 70, cardW = 310, cardH = 230;
  const cardLines = PROFILE.card.map((l, i) => `<text x="24" y="${92 + i * 23}" class="archivo" font-size="13" fill="${C.black}">${esc(l)}</text>`).join("");
  const aviso = ransom("AVISO", 28, 46, 34, "aviso", { delay: 1.4, step: 0.06 });
  const body = `
<rect width="${W}" height="${H}" fill="${C.red}"/>
<rect width="${W}" height="${H}" fill="url(#dots)" opacity=".28" mask="url(#mR)"/>
<mask id="mR"><rect width="${W}" height="${H}" fill="url(#fadeR)"/></mask>

<!-- estilhaços pretos -->
<polygon points="0,${H} 0,210 140,250 90,190 330,${H}" fill="${C.black}"/>
<polygon points="0,0 210,0 120,40 260,60 0,110" fill="${C.black}"/>
<polygon points="${W},0 ${W},${H} 860,${H} 930,300 820,330 600,0" fill="${C.black}"/>
<polygon points="600,0 820,330 760,250 640,40" fill="${C.white}" opacity=".9"/>
<polygon points="${W},${H} ${W},300 950,${H}" fill="${C.red2}"/>

<!-- estrelas -->
<polygon class="spin" points="${star(560, 70, 34)}" fill="${C.black}" stroke="${C.white}" stroke-width="4"/>
<polygon class="spin" style="animation-duration:14s" points="${star(52, 320, 22)}" fill="${C.white}"/>
<polygon class="pulse" points="${star(590, 330, 16)}" fill="${C.white}" stroke="${C.black}" stroke-width="3"/>

<!-- nome em letras de recorte -->
${first.svg}
${last.svg}

${ribbon(70, 312, 430, 46, `${PROFILE.codename} // ${PROFILE.role}`, 26)}

<!-- cartão de aviso -->
<g transform="translate(${cardX} ${cardY}) rotate(5)">
  <rect x="10" y="12" width="${cardW}" height="${cardH}" fill="#000" opacity=".6"/>
  <rect width="${cardW}" height="${cardH}" fill="${C.white}" stroke="${C.black}" stroke-width="5"/>
  <rect x="10" y="10" width="${cardW - 20}" height="${cardH - 20}" fill="none" stroke="${C.red}" stroke-width="2" stroke-dasharray="10 5"/>
  ${aviso.svg}
  ${cardLines}
  <text x="${cardW - 22}" y="${cardH - 26}" class="abril" font-size="22" fill="${C.red}" text-anchor="end">${esc(PROFILE.signature)}</text>
  <polygon points="${star(36, cardH - 34, 14)}" fill="${C.red}"/>
</g>
<text x="${W - 14}" y="${H - 12}" class="bebas" font-size="16" fill="${C.white}" text-anchor="end" letter-spacing="3" opacity=".8">GITHUB.COM/${USER.toUpperCase()}</text>`;
  return svg(W, H, body, { fonts: ["anton", "archivo", "abril", "bebas"], title: `${PROFILE.first} ${PROFILE.last} — ${PROFILE.role}` });
}

function sectionTitle(text, sub, seed) {
  const W = 1000, H = 76;
  const t = ransom(text, 24, 40, 40, seed, { step: 0.05 });
  const body = `
<polygon points="0,62 ${Math.min(W - 40, t.width + 90)},48 ${Math.min(W - 20, t.width + 110)},70 0,74" fill="${C.red}"/>
${t.svg}
${sub ? `<g transform="translate(${W - 8} 46) skewX(-12)"><text class="bebas" font-size="22" fill="${C.red}" text-anchor="end" letter-spacing="3" stroke="${C.black}" stroke-width=".6">${esc(sub)}</text></g>` : ""}
<polygon class="spin" points="${star(Math.min(W - 60, t.width + 70), 26, 13)}" fill="${C.white}" stroke="${C.black}" stroke-width="3"/>`;
  return svg(W, H, body, { fonts: ["anton", "archivo", "abril", "bebas"], title: text });
}

function stack() {
  const cols = 6, cw = 150, ch = 64, gx = 12, gy = 18, W = 1000;
  const rows = Math.ceil(STACK.length / cols);
  const H = rows * ch + (rows - 1) * gy + 24;
  const ox = (W - (cols * cw + (cols - 1) * gx)) / 2;
  const r = rng("stack");
  let body = "";
  STACK.forEach((s, i) => {
    const x = ox + (i % cols) * (cw + gx), y = 12 + Math.floor(i / cols) * (ch + gy);
    const inv = (i + Math.floor(i / cols)) % 2 === 0;
    const rot = (r() - 0.5) * 6;
    const bg = inv ? C.black : C.white, fg = inv ? C.white : C.black;
    const size = s.length > 9 ? 22 : 27;
    body += `<g transform="translate(${x + cw / 2} ${y + ch / 2}) rotate(${rot.toFixed(1)})">
  <g><animateTransform attributeName="transform" type="translate" values="-30 0;-30 0;0 0" keyTimes="0;${(i * 0.05 / (i * 0.05 + 0.3)).toFixed(3)};1" dur="${(i * 0.05 + 0.3).toFixed(2)}s" fill="freeze"/>
  <polygon points="${-cw / 2 + 6},${-ch / 2 + 6} ${cw / 2 + 6},${-ch / 2 + 2} ${cw / 2 + 2},${ch / 2 + 6} ${-cw / 2 + 2},${ch / 2 + 6}" fill="${C.red}"/>
  <polygon points="${-cw / 2},${-ch / 2 + 4} ${cw / 2},${-ch / 2} ${cw / 2 - 4},${ch / 2} ${-cw / 2 + 4},${ch / 2 - 2}" fill="${bg}" stroke="${inv ? C.white : C.black}" stroke-width="3"/>
  <text x="0" y="${size * 0.36}" class="anton" font-size="${size}" fill="${fg}" text-anchor="middle" letter-spacing="1.5">${esc(s)}</text>
  <text x="${-cw / 2 + 10}" y="${-ch / 2 + 16}" class="bebas" font-size="12" fill="${C.red}">${String(i + 1).padStart(2, "0")}</text>
  </g>
</g>`;
  });
  return svg(W, H, body, { fonts: ["anton", "bebas"], title: "Tecnologias" });
}

function button(label, sub, idx) {
  const W = 270, H = 64;
  const body = `
<g transform="skewX(-12) translate(14 0)">
  <rect x="8" y="10" width="${W - 34}" height="${H - 16}" fill="${C.red}"/>
  <rect x="0" y="4" width="${W - 34}" height="${H - 16}" fill="${idx % 2 ? C.white : C.black}" stroke="${idx % 2 ? C.black : C.white}" stroke-width="3"/>
</g>
<text x="40" y="45" class="anton" font-size="26" fill="${idx % 2 ? C.black : C.white}" letter-spacing="3">${esc(label)}</text>
<text x="40" y="20" class="bebas" font-size="12" fill="${C.red}" letter-spacing="2">${esc(sub)}</text>
<polygon class="pulse" points="${star(W - 50, 30, 13)}" fill="${C.red}" stroke="${idx % 2 ? C.black : C.white}" stroke-width="2"/>`;
  return svg(W, H, body, { fonts: ["anton", "bebas"], title: label });
}

function footer() {
  const W = 1000, H = 110;
  const probe = ransom("VOLTE SEMPRE", 0, 62, 40, "footer").width;
  const tx = (W - probe) / 2;
  const t = ransom("VOLTE SEMPRE", tx, 62, 40, "footer", { step: 0.05 });
  const body = `
<polygon points="0,20 ${W},0 ${W},${H} 0,${H}" fill="${C.red}"/>
<polygon points="0,20 ${W},0 ${W},${H} 0,${H}" fill="url(#dots)" opacity=".25"/>
<polygon points="0,20 ${W},0 ${W},10 0,32" fill="${C.black}"/>
<polygon class="spin" points="${star(tx - 60, 64, 26)}" fill="${C.black}" stroke="${C.white}" stroke-width="3"/>
${t.svg}
<polygon class="spin" points="${star(tx + t.width + 50, 64, 26)}" fill="${C.white}" stroke="${C.black}" stroke-width="3"/>`;
  return svg(W, H, body, { fonts: ["anton", "archivo", "abril", "bebas"], title: "Volte sempre" });
}

// ───────────────────────── DADOS ─────────────────────────
const QUERY = `query($login:String!){
  user(login:$login){
    followers{totalCount}
    repositories(ownerAffiliations:OWNER,isFork:false,first:100,orderBy:{field:PUSHED_AT,direction:DESC}){
      totalCount
      nodes{ stargazerCount languages(first:10,orderBy:{field:SIZE,direction:DESC}){ edges{ size node{ name } } } }
    }
    contributionsCollection{
      totalCommitContributions totalPullRequestContributions totalIssueContributions restrictedContributionsCount
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
    }
  }
}`;

async function fetchData() {
  if (process.env.MOCK_FILE) return JSON.parse(readFileSync(process.env.MOCK_FILE, "utf8")).data.user;
  const tokens = [...new Set([process.env.GITHUB_TOKEN, process.env.FALLBACK_TOKEN].filter(Boolean))];
  if (!tokens.length) throw new Error("GITHUB_TOKEN não definido");
  for (let attempt = 1; attempt <= 4; attempt++) {
    const token = tokens[(attempt - 1) % tokens.length];
    try {
      const r = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "jujusempix-profile" },
        body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
      });
      const j = await r.json();
      if (!r.ok || j.errors) throw new Error(JSON.stringify(j.errors || j));
      return j.data.user;
    } catch (e) {
      console.warn(`tentativa ${attempt} falhou: ${e.message}`);
      if (attempt === 4) throw e;
      await new Promise((res) => setTimeout(res, attempt * 5000));
    }
  }
}

function crunch(u) {
  const cc = u.contributionsCollection;
  const days = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays).sort((a, b) => a.date.localeCompare(b.date));
  let i = days.length - 1;
  if (i >= 0 && days[i].contributionCount === 0) i--;
  let current = 0;
  while (i >= 0 && days[i].contributionCount > 0) { current++; i--; }
  let longest = 0, run = 0;
  for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  const langs = {};
  let stars = 0;
  for (const r of u.repositories.nodes) {
    stars += r.stargazerCount;
    for (const e of r.languages.edges) langs[e.node.name] = (langs[e.node.name] || 0) + e.size;
  }
  const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
  const topLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, size]) => ({ name, pct: (size / total) * 100 }));
  return {
    days, current, longest, stars, topLangs,
    repos: u.repositories.totalCount,
    contrib: cc.contributionCalendar.totalContributions,
    commits: cc.totalCommitContributions + cc.restrictedContributionsCount,
    prs: cc.totalPullRequestContributions,
  };
}

const stamp = () => new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo", hour12: false }).slice(0, 16).replace(" ", " // ");

// nível de 1 a 5 (as "estrelinhas" de cada atributo)
const rank = (v, steps) => 1 + steps.filter((s) => v >= s).length;

// ───────────────────────── PEÇAS DINÂMICAS ─────────────────────────
function panelBase(W, H, titleText, seed) {
  const t = ransom(titleText, 30, 52, 34, seed, { step: 0.05 });
  return `
<polygon points="10,18 ${W - 8},4 ${W - 22},${H - 10} 22,${H - 2}" fill="${C.red}"/>
<polygon points="4,10 ${W - 18},0 ${W - 30},${H - 18} 14,${H - 10}" fill="${C.black}" stroke="${C.white}" stroke-width="4"/>
<polygon points="4,10 ${W - 18},0 ${W - 30},${H - 18} 14,${H - 10}" fill="url(#rdots)" opacity=".18" mask="url(#mL${seed})"/>
<mask id="mL${seed}"><rect width="${W}" height="${H}" fill="url(#fadeD)"/></mask>
${t.svg}`;
}

function status(s) {
  const W = 490, H = 360;
  const rows = [
    ["CONTRIBUIÇÕES", s.contrib, rank(s.contrib, [50, 150, 400, 800])],
    ["COMMITS", s.commits, rank(s.commits, [40, 120, 300, 600])],
    ["PULL REQUESTS", s.prs, rank(s.prs, [5, 20, 50, 100])],
    ["REPOSITÓRIOS", s.repos, rank(s.repos, [5, 15, 30, 50])],
    ["ESTRELAS", s.stars, rank(s.stars, [3, 10, 30, 100])],
    ["SEQUÊNCIA", `${s.current}/${s.longest}`, rank(s.longest, [3, 7, 15, 30])],
  ];
  let body = panelBase(W, H, "ATRIBUTOS", "status");
  rows.forEach(([k, v, lvl], i) => {
    const y = 116 + i * 37;
    const t0 = 0.3 + i * 0.12;
    let pips = "";
    for (let p = 0; p < 5; p++) pips += `<polygon points="${star(266 + p * 20, y - 9, 8)}" fill="${p < lvl ? C.red2 : C.gray}" stroke="${p < lvl ? C.white : "none"}" stroke-width="1"/>`;
    body += `<g><animateTransform attributeName="transform" type="translate" values="-40 0;-40 0;0 0" keyTimes="0;${(t0 / (t0 + 0.25)).toFixed(3)};1" dur="${(t0 + 0.25).toFixed(2)}s" fill="freeze"/>
  <g transform="translate(${34 - i * 2} ${y - 26}) skewX(-14)"><rect width="${i % 2 ? 182 : 170}" height="30" fill="${i % 2 ? C.white : C.red}"/></g>
  <text x="${46 - i * 2}" y="${y - 3}" class="anton" font-size="19" fill="${i % 2 ? C.black : C.white}" letter-spacing="1.5">${esc(k)}</text>
  ${pips}
  <text x="${W - 50 - i * 2}" y="${y}" class="anton" font-size="27" fill="${C.white}" text-anchor="end">${esc(v)}</text>
</g>`;
  });
  body += `<text x="${W - 48}" y="${H - 28}" class="bebas" font-size="13" fill="#9a9a9a" text-anchor="end" letter-spacing="2">SEQUÊNCIA = ATUAL/RECORDE · ${stamp()}</text>`;
  return svg(W, H, body, { fonts: ["anton", "archivo", "abril", "bebas"], title: "Status" });
}

function languages(s) {
  const W = 490, H = 360, x1 = 40, x2 = W - 56, bx = x1 + 118, bmax = x2 - 70 - bx;
  let body = panelBase(W, H, "LINGUAGENS", "langs");
  const list = s.topLangs.length ? s.topLangs : [{ name: "SEM DADOS", pct: 0 }];
  const max = Math.max(...list.map((l) => l.pct), 1);
  list.forEach((l, i) => {
    const y = 116 + i * 37;
    const bw = Math.max(8, (bmax * l.pct) / max);
    const t0 = 0.3 + i * 0.12;
    body += `
<text x="${x1 - i * 2}" y="${y}" class="anton" font-size="18" fill="${C.white}" letter-spacing="1">${esc(l.name.toUpperCase())}</text>
<g transform="translate(${bx - i * 2} ${y - 18}) skewX(-18)">
  <rect width="${bmax.toFixed(1)}" height="20" fill="${C.gray}"/>
  <rect width="${bw.toFixed(1)}" height="20" fill="${i === 0 ? C.red2 : i % 2 ? C.white : C.red}">
    <animate attributeName="width" values="0;0;${bw.toFixed(1)}" keyTimes="0;${(t0 / (t0 + 0.5)).toFixed(3)};1" dur="${(t0 + 0.5).toFixed(2)}s" fill="freeze"/>
  </rect>
</g>
<text x="${x2 + 10 - i * 2}" y="${y}" class="bebas" font-size="22" fill="${C.red2}" text-anchor="end">${l.pct.toFixed(1)}%</text>`;
  });
  body += `<text x="${W - 48}" y="${H - 28}" class="bebas" font-size="13" fill="#9a9a9a" text-anchor="end" letter-spacing="2">POR BYTES · REPOSITÓRIOS PÚBLICOS</text>`;
  return svg(W, H, body, { fonts: ["anton", "archivo", "abril", "bebas"], title: "Linguagens" });
}

function activity(s) {
  const W = 1000, H = 320, N = 31;
  const days = s.days.slice(-N);
  const L = 70, R = W - 50, T = 96, B = H - 70;
  const peak = Math.max(0, ...days.map((d) => d.contributionCount));
  const max = Math.max(4, peak);
  const step = Math.ceil(max / 4), top = step * 4;
  const X = (i) => L + (i * (R - L)) / Math.max(1, days.length - 1);
  const Y = (v) => B - (v / top) * (B - T);
  const pts = days.map((d, i) => [X(i), Y(d.contributionCount)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${X(days.length - 1).toFixed(1)} ${B} L${L} ${B} Z`;
  const len = pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  const total = days.reduce((a, d) => a + d.contributionCount, 0);
  const t = ransom("ATIVIDADE", 34, 54, 36, "act", { step: 0.05 });

  let grid = "";
  for (let k = 0; k <= 4; k++) {
    const v = k * step, y = Y(v);
    grid += `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke="${k ? "#3a3a3a" : C.white}" stroke-width="${k ? 1 : 3}" stroke-dasharray="${k ? "6 6" : "0"}"/>
<text x="${L - 12}" y="${y + 6}" class="bebas" font-size="18" fill="${C.white}" text-anchor="end">${v}</text>`;
  }
  let xl = "";
  days.forEach((d, i) => {
    if (i % 5 === 0 || i === days.length - 1) {
      const [, mm, dd] = d.date.split("-");
      xl += `<text x="${X(i)}" y="${B + 26}" class="bebas" font-size="18" fill="${C.white}" text-anchor="middle">${dd}/${mm}</text>`;
    }
  });
  const marks = pts.map((p, i) => {
    const c = days[i].contributionCount;
    const t0 = (0.2 + (i / pts.length) * 1.8).toFixed(2);
    return c ? `<polygon points="${star(p[0], p[1], 8, 3.6)}" fill="${c === peak ? C.white : C.red2}" stroke="#000" stroke-width="1.5"><set attributeName="opacity" to="0" begin="0s"/><animate attributeName="opacity" from="0" to="1" begin="${t0}s" dur=".15s" fill="freeze"/></polygon>` : "";
  }).join("");

  const body = `
<polygon points="10,22 ${W - 6},6 ${W - 18},${H - 10} 20,${H - 2}" fill="${C.red}"/>
<polygon points="4,14 ${W - 16},0 ${W - 28},${H - 18} 12,${H - 10}" fill="${C.black}" stroke="${C.white}" stroke-width="4"/>
${t.svg}
<g transform="translate(${W - 60} 40) skewX(-12)"><text class="anton" font-size="22" fill="${C.white}" text-anchor="end" letter-spacing="2">TOTAL <tspan fill="${C.red2}">${total}</tspan>   PICO <tspan fill="${C.red2}">${peak}</tspan>   SEQUÊNCIA <tspan fill="${C.red2}">${s.current}</tspan></text></g>
<text x="${W - 66}" y="66" class="bebas" font-size="15" fill="#9a9a9a" text-anchor="end" letter-spacing="2">CONTRIBUIÇÕES NOS ÚLTIMOS ${days.length} DIAS</text>
${grid}
<path d="${area}" fill="url(#rdots)"><set attributeName="opacity" to="0" begin="0s"/><animate attributeName="opacity" from="0" to="1" begin="1.2s" dur=".8s" fill="freeze"/></path>
<path d="${line}" fill="none" stroke="${C.white}" stroke-width="7" stroke-linejoin="miter" stroke-dasharray="${len.toFixed(0)}" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" from="${len.toFixed(0)}" to="0" dur="2s" fill="freeze"/></path>
<path d="${line}" fill="none" stroke="${C.red2}" stroke-width="3" stroke-linejoin="miter" stroke-dasharray="${len.toFixed(0)}" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" from="${len.toFixed(0)}" to="0" dur="2s" fill="freeze"/></path>
${marks}
${xl}
<text x="40" y="${H - 26}" class="bebas" font-size="13" fill="#9a9a9a" letter-spacing="2">ATUALIZADO ${stamp()}</text>`;
  return svg(W, H, body, { fonts: ["anton", "archivo", "abril", "bebas"], title: "Atividade" });
}

// ───────────────────────── MAIN ─────────────────────────
const [mode = "dynamic", out = mode === "static" ? "assets" : "dist"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const write = (name, content) => { writeFileSync(join(out, name), content); console.log(`✓ ${join(out, name)} (${(content.length / 1024).toFixed(1)} KB)`); };

if (mode === "static" || mode === "all") {
  write("header.svg", header());
  write("stack.svg", stack());
  write("btn-instagram.svg", button("INSTAGRAM", "CONTATO 01", 0));
  write("btn-linkedin.svg", button("LINKEDIN", "CONTATO 02", 1));
  write("footer.svg", footer());
  write("title-stack.svg", sectionTitle("ARSENAL", "TECNOLOGIAS", "t1"));
  write("title-data.svg", sectionTitle("STATUS", "ATUALIZA 2X POR DIA", "t2"));
  write("title-memories.svg", sectionTitle("RECORDAÇÕES", "", "t3"));
  write("title-contact.svg", sectionTitle("CONTATO", "", "t4"));
}
if (mode === "dynamic" || mode === "all") {
  const s = crunch(await fetchData());
  write("status.svg", status(s));
  write("languages.svg", languages(s));
  write("activity.svg", activity(s));
}
