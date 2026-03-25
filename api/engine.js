// ═══════════════════════════════════════
// QBITS STRING SIZING ENGINE
// All logic runs server-side — never exposed to browser
// ═══════════════════════════════════════

const { PANELS, INVERTERS, TC_VOC, STC_TEMP, MAX_SYSTEM_V } = require("./data");

function vocT(v, t) { return v * (1 + (TC_VOC / 100) * (t - STC_TEMP)); }
function vmpT(v, t) { return v * (1 + (TC_VOC / 100) * (t - STC_TEMP)); }

function rate(n, vC, vH, vCd, inv) {
  const sv = n * vC, sh = n * vH, sc = n * vCd;
  if (sv > inv.maxDcV) return { label: "FAIL", color: "#dc2626", desc: "Voc exceeds max DC voltage", icon: "\u2715", score: 0 };
  if (sv > MAX_SYSTEM_V) return { label: "FAIL", color: "#dc2626", desc: "Exceeds 1500V system limit", icon: "\u2715", score: 0 };
  if (sh < inv.mpptMin) return { label: "FAIL", color: "#dc2626", desc: "Vmp below MPPT minimum", icon: "\u2715", score: 0 };
  if (sc > inv.mpptMax) return { label: "FAIL", color: "#dc2626", desc: "Vmp exceeds MPPT maximum", icon: "\u2715", score: 0 };
  const mH = (inv.mpptMax - sc) / inv.mpptMax;
  const mL = (sh - inv.mpptMin) / inv.mpptMin;
  const vM = (inv.maxDcV - sv) / inv.maxDcV;
  const avg = (sh + sc) / 2;
  const cl = 1 - Math.abs(avg - inv.recV) / (inv.mpptMax - inv.mpptMin);
  if (cl > 0.75 && mH > 0.05 && mL > 0.15 && vM > 0.05) return { label: "BEST", color: "#15803d", desc: "Optimal", icon: "\u2605", score: 4 };
  if (cl > 0.55 && mH > 0.03 && mL > 0.08 && vM > 0.03) return { label: "GOOD", color: "#2563eb", desc: "Good", icon: "\u25CF", score: 3 };
  if (mH > 0.01 && mL > 0.02 && vM > 0.01) return { label: "OK", color: "#d97706", desc: "Acceptable", icon: "\u25B3", score: 2 };
  return { label: "WORSE", color: "#dc2626", desc: "Poor", icon: "\u25BD", score: 1 };
}

// ═══ MPPT DISTRIBUTION ENGINE v5 ═══
function optimize(tp, inv, panel, tMin, tMax) {
  const vC = vocT(panel.voc, tMin);
  const vH = vmpT(panel.vmp, tMax);
  const vCd = vmpT(panel.vmp, tMin);

  const validMap = {};
  for (let n = 1; n <= 40; n++) {
    const r = rate(n, vC, vH, vCd, inv);
    if (r.score >= 2) validMap[n] = r;
  }
  const validNs = Object.keys(validMap).map(Number);
  if (!validNs.length) return { error: "No valid string size", distributions: [] };

  const totalSlots = inv.stringsPerMppt.reduce((a, b) => a + b, 0);
  let best = null;

  function tryC(dists, used, type) {
    const unused = tp - used;
    if (unused < 0) return;
    const ns = dists.map(d => d.modulesPerString);
    const gap = ns.length > 1 ? Math.abs(ns[0] - ns[1]) : 0;
    const isU = ns.length <= 1 || ns[0] === ns[1];
    const minR = Math.min(...dists.map(d => d.rating.score));
    const avgR = dists.reduce((s, d) => s + d.rating.score, 0) / dists.length;
    const allM = dists.length === inv.mpptCount;
    const score = -unused * 10000000 - gap * 1000000 + (isU ? 500000 : 0) + (allM ? 200000 : 0) + minR * 10000 + avgR * 1000;
    if (!best || score > best.score) best = { distributions: dists, usedPanels: used, unusedPanels: unused, score, type, gap };
  }

  if (inv.mpptCount === 1) {
    for (const n of validNs) {
      for (let s = 1; s <= inv.stringsPerMppt[0]; s++) {
        const u = s * n;
        if (u > tp) continue;
        tryC([{ mpptIndex: 0, strings: s, modulesPerString: n, totalModules: u, maxCurrent: inv.maxDcI[0], maxStrings: inv.stringsPerMppt[0], rating: validMap[n] }], u, "uniform");
      }
    }
  } else {
    // Both MPPTs
    for (const n1 of validNs) {
      for (let s1 = 1; s1 <= inv.stringsPerMppt[0]; s1++) {
        const m1 = s1 * n1;
        if (m1 > tp) continue;
        for (const n2 of validNs) {
          for (let s2 = 1; s2 <= inv.stringsPerMppt[1]; s2++) {
            const m2 = s2 * n2;
            const used = m1 + m2;
            if (used > tp) continue;
            tryC([
              { mpptIndex: 0, strings: s1, modulesPerString: n1, totalModules: m1, maxCurrent: inv.maxDcI[0], maxStrings: inv.stringsPerMppt[0], rating: validMap[n1] },
              { mpptIndex: 1, strings: s2, modulesPerString: n2, totalModules: m2, maxCurrent: inv.maxDcI[1], maxStrings: inv.stringsPerMppt[1], rating: validMap[n2] },
            ], used, n1 === n2 ? "uniform" : "balanced");
          }
        }
      }
    }
    // MPPT1 only
    for (const n1 of validNs) {
      for (let s1 = 1; s1 <= inv.stringsPerMppt[0]; s1++) {
        const u = s1 * n1;
        if (u > tp) continue;
        tryC([{ mpptIndex: 0, strings: s1, modulesPerString: n1, totalModules: u, maxCurrent: inv.maxDcI[0], maxStrings: inv.stringsPerMppt[0], rating: validMap[n1] }], u, "partial");
      }
    }
    // MPPT2 only
    for (const n2 of validNs) {
      for (let s2 = 1; s2 <= inv.stringsPerMppt[1]; s2++) {
        const u = s2 * n2;
        if (u > tp) continue;
        tryC([{ mpptIndex: 1, strings: s2, modulesPerString: n2, totalModules: u, maxCurrent: inv.maxDcI[1], maxStrings: inv.stringsPerMppt[1], rating: validMap[n2] }], u, "partial");
      }
    }
  }

  if (!best) return { error: "Cannot fit panels", distributions: [] };

  const cw = [];
  for (const d of best.distributions) {
    const tc = d.strings * panel.isc;
    if (tc > d.maxCurrent) cw.push(`MPPT ${d.mpptIndex + 1}: ${d.strings}\u00d7${panel.isc.toFixed(1)}A = ${tc.toFixed(1)}A exceeds max ${d.maxCurrent}A`);
  }
  const ps = best.distributions.map(d => d.totalModules);
  const mxp = Math.max(...ps), mnp = Math.min(...ps);
  const imb = mxp > 0 ? ((mxp - mnp) / mxp * 100).toFixed(0) : "0";

  return { ...best, currentWarnings: cw, isBalanced: best.gap <= 1, imbalance: imb, maxTotalStrings: totalSlots };
}

function getClip(dcW, inv) {
  const al = inv.maxOutputPower;
  const de = dcW * 0.96;
  const cl = Math.max(0, de - al);
  const pct = de > 0 ? (cl / de * 100).toFixed(1) : "0";
  const ann = ((cl / 1000) * 4.5 * 300).toFixed(0);
  let sv = "none";
  if (+pct > 30) sv = "critical";
  else if (+pct > 15) sv = "high";
  else if (+pct > 5) sv = "moderate";
  else if (+pct > 0) sv = "low";
  return { dcW, acLimit: al, clipped: cl, pct, annualLoss: ann, severity: sv, dcEffective: de, ratio: (dcW / inv.ratedPower).toFixed(2) };
}

function getVoltageBar(n, panel, inv, tMin, tMax) {
  const vC = vocT(panel.voc, tMin);
  const vH = vmpT(panel.vmp, tMax);
  const vCd = vmpT(panel.vmp, tMin);
  const r = rate(n, vC, vH, vCd, inv);
  return {
    panelsPerString: n,
    vocCold: (n * vC).toFixed(1),
    vmpHot: (n * vH).toFixed(1),
    vmpCold: (n * vCd).toFixed(1),
    vocStc: (n * panel.voc).toFixed(1),
    vmpStc: (n * panel.vmp).toFixed(1),
    stringPower: (n * panel.wp / 1000).toFixed(2),
    rating: r,
    limits: { maxDcV: inv.maxDcV, mpptMin: inv.mpptMin, mpptMax: inv.mpptMax, recV: inv.recV },
  };
}

// ═══ MAIN CALCULATE FUNCTION ═══
function calculate(panelWp, inverterId, totalPanels, tMin, tMax) {
  const panel = PANELS.find(p => p.wp === panelWp);
  if (!panel) return { error: "Invalid panel wattage" };

  const inv = INVERTERS.find(i => i.id === inverterId);
  if (!inv) return { error: "Invalid inverter model" };

  if (totalPanels < 1 || totalPanels > 500) return { error: "Total panels must be 1-500" };
  if (tMin < -40 || tMin > 50) return { error: "Min temp must be -40 to 50" };
  if (tMax < 0 || tMax > 80) return { error: "Max temp must be 0 to 80" };
  if (tMin >= tMax) return { error: "Min temp must be less than max temp" };

  const dcW = totalPanels * panel.wp;

  // Clipping
  const clipping = getClip(dcW, inv);

  // MPPT Distribution
  const distribution = optimize(totalPanels, inv, panel, tMin, tMax);

  // All valid configs
  const vC = vocT(panel.voc, tMin);
  const vH = vmpT(panel.vmp, tMax);
  const vCd = vmpT(panel.vmp, tMin);
  const mx = Math.min(Math.floor(inv.maxDcV / vC), Math.floor(MAX_SYSTEM_V / vC));
  const mn = Math.ceil(inv.mpptMin / vH);
  const configs = [];
  for (let n = Math.max(1, mn - 2); n <= Math.min(mx + 1, 40); n++) {
    const r = rate(n, vC, vH, vCd, inv);
    configs.push({
      n, rating: r,
      vocCold: (n * vC).toFixed(1),
      vmpHot: (n * vH).toFixed(1),
      vmpCold: (n * vCd).toFixed(1),
      vocStc: (n * panel.voc).toFixed(1),
      vmpStc: (n * panel.vmp).toFixed(1),
      stringPower: (n * panel.wp / 1000).toFixed(2),
    });
  }

  // Recommendations
  const recommendations = [];
  for (const testInv of INVERTERS) {
    const r = dcW / testInv.ratedPower;
    if (r < 0.7 || r > 1.5) continue;
    const d = optimize(totalPanels, testInv, panel, tMin, tMax);
    if (d.error) continue;
    const c = getClip(dcW, testInv);
    const mr = Math.min(...d.distributions.map(x => x.rating.score));
    recommendations.push({
      inverterId: testInv.id,
      model: testInv.model,
      phase: testInv.phase,
      ratedPower: testInv.ratedPower,
      dist: { usedPanels: d.usedPanels, unusedPanels: d.unusedPanels, type: d.type, gap: d.gap, distributions: d.distributions },
      clip: { severity: c.severity, pct: c.pct },
      ratio: r.toFixed(2),
      minRating: mr,
    });
  }
  recommendations.sort((a, b) => {
    const ai = (+a.ratio >= 1.05 && +a.ratio <= 1.3) ? 10 : (+a.ratio >= 0.9 && +a.ratio <= 1.4) ? 5 : 0;
    const bi = (+b.ratio >= 1.05 && +b.ratio <= 1.3) ? 10 : (+b.ratio >= 0.9 && +b.ratio <= 1.4) ? 5 : 0;
    return (bi + b.minRating * 2 - b.dist.unusedPanels * 5 - b.dist.gap * 3) - (ai + a.minRating * 2 - a.dist.unusedPanels * 5 - a.dist.gap * 3);
  });

  // Panel & inverter specs for display (only what frontend needs to show)
  const panelSpec = { wp: panel.wp, voc: panel.voc, vmp: panel.vmp, isc: panel.isc, imp: panel.imp, tcVoc: TC_VOC };
  const invSpec = {
    id: inv.id, model: inv.model, phase: inv.phase, mpptCount: inv.mpptCount,
    maxDcV: inv.maxDcV, mpptMin: inv.mpptMin, mpptMax: inv.mpptMax, recV: inv.recV,
    stringsPerMppt: inv.stringsPerMppt, maxOutputCurrent: inv.maxOutputCurrent,
    ratedPower: inv.ratedPower, maxOutputPower: inv.maxOutputPower,
  };

  return {
    panelSpec,
    inverterSpec: invSpec,
    capacity: { dc: (dcW / 1000).toFixed(2), ac: (inv.ratedPower / 1000).toFixed(2), totalPanels },
    clipping,
    distribution,
    configs,
    recommendations: recommendations.slice(0, 5),
  };
}

// ═══ VOLTAGE BAR ENDPOINT ═══
function calcVoltageBar(panelWp, inverterId, panelsPerString, tMin, tMax) {
  const panel = PANELS.find(p => p.wp === panelWp);
  if (!panel) return { error: "Invalid panel" };
  const inv = INVERTERS.find(i => i.id === inverterId);
  if (!inv) return { error: "Invalid inverter" };
  if (panelsPerString < 1 || panelsPerString > 40) return { error: "Panels per string must be 1-40" };
  return getVoltageBar(panelsPerString, panel, inv, tMin, tMax);
}

// ═══ DROPDOWN OPTIONS (safe to expose) ═══
function getOptions() {
  return {
    panels: PANELS.map(p => ({ wp: p.wp, label: `Adani ${p.wp} Wp` })),
    inverters: INVERTERS.map(i => ({
      id: i.id,
      label: `${i.model} (${i.phase}, ${i.mpptCount} MPPT) \u2014 ${i.ratedPower / 1000} kW`,
    })),
  };
}

module.exports = { calculate, calcVoltageBar, getOptions };
