// ═══════════════════════════════════════
// QBITS INVERTER & PANEL DATABASE
// This file stays on the server — never exposed to frontend
// ═══════════════════════════════════════

const PANELS = [
  { wp: 605, vmp: 40.50, imp: 14.94, voc: 48.70, isc: 15.83 },
  { wp: 610, vmp: 40.80, imp: 14.96, voc: 49.00, isc: 15.86 },
  { wp: 615, vmp: 41.10, imp: 14.98, voc: 49.30, isc: 15.89 },
  { wp: 620, vmp: 41.40, imp: 14.99, voc: 49.60, isc: 15.91 },
  { wp: 625, vmp: 41.70, imp: 15.01, voc: 49.90, isc: 15.94 },
  { wp: 630, vmp: 42.00, imp: 15.03, voc: 50.20, isc: 15.97 },
  { wp: 635, vmp: 42.30, imp: 15.05, voc: 50.50, isc: 16.00 },
  { wp: 640, vmp: 42.60, imp: 15.07, voc: 50.80, isc: 16.03 },
];

const TC_VOC = -0.23;  // %/°C
const TC_ISC = 0.061;  // %/°C
const STC_TEMP = 25;
const MAX_SYSTEM_V = 1500;

const INVERTERS = [
  // TLS Series — 1-Ph, 1 MPPT
  { id: "QB-1.5KTLS", model: "QB-1.5KTLS", series: "TLS", phase: "1-Ph", mpptCount: 1, maxDcV: 550, mpptMin: 40, mpptMax: 550, maxDcI: [20], stringsPerMppt: [1], ratedPower: 1500, maxOutputPower: 1650, maxOutputCurrent: 7.5, gridV: 230, recV: 360 },
  { id: "QB-2.0KTLS", model: "QB-2.0KTLS", series: "TLS", phase: "1-Ph", mpptCount: 1, maxDcV: 550, mpptMin: 40, mpptMax: 550, maxDcI: [20], stringsPerMppt: [1], ratedPower: 2000, maxOutputPower: 2200, maxOutputCurrent: 10, gridV: 230, recV: 360 },
  { id: "QB-2.7KTLS", model: "QB-2.7KTLS", series: "TLS", phase: "1-Ph", mpptCount: 1, maxDcV: 550, mpptMin: 40, mpptMax: 550, maxDcI: [20], stringsPerMppt: [1], ratedPower: 2700, maxOutputPower: 2970, maxOutputCurrent: 13.5, gridV: 230, recV: 360 },
  { id: "QB-3.0KTLS", model: "QB-3.0KTLS", series: "TLS", phase: "1-Ph", mpptCount: 1, maxDcV: 550, mpptMin: 40, mpptMax: 550, maxDcI: [20], stringsPerMppt: [1], ratedPower: 3000, maxOutputPower: 3300, maxOutputCurrent: 15, gridV: 230, recV: 360 },
  { id: "QB-3.3KTLS", model: "QB-3.3KTLS", series: "TLS", phase: "1-Ph", mpptCount: 1, maxDcV: 550, mpptMin: 40, mpptMax: 550, maxDcI: [20], stringsPerMppt: [1], ratedPower: 3300, maxOutputPower: 3630, maxOutputCurrent: 15, gridV: 230, recV: 360 },
  { id: "QB-3.6KTLS", model: "QB-3.6KTLS", series: "TLS", phase: "1-Ph", mpptCount: 1, maxDcV: 550, mpptMin: 40, mpptMax: 550, maxDcI: [20], stringsPerMppt: [1], ratedPower: 3600, maxOutputPower: 3960, maxOutputCurrent: 16.5, gridV: 230, recV: 360 },
  { id: "QB-4.0KTLS", model: "QB-4.0KTLS", series: "TLS", phase: "1-Ph", mpptCount: 1, maxDcV: 550, mpptMin: 40, mpptMax: 550, maxDcI: [20], stringsPerMppt: [1], ratedPower: 4000, maxOutputPower: 4400, maxOutputCurrent: 18.5, gridV: 230, recV: 360 },

  // TLD Series — 1-Ph, 2 MPPT
  { id: "QB-5KTLD", model: "QB-5KTLD", series: "TLD", phase: "1-Ph", mpptCount: 2, maxDcV: 550, mpptMin: 80, mpptMax: 550, maxDcI: [20, 20], stringsPerMppt: [1, 1], ratedPower: 5000, maxOutputPower: 5500, maxOutputCurrent: 25, gridV: 230, recV: 360 },
  { id: "QB-6KTLD", model: "QB-6KTLD", series: "TLD", phase: "1-Ph", mpptCount: 2, maxDcV: 550, mpptMin: 80, mpptMax: 550, maxDcI: [20, 20], stringsPerMppt: [1, 1], ratedPower: 6000, maxOutputPower: 6600, maxOutputCurrent: 27.3, gridV: 230, recV: 360 },
  { id: "QB-8KTLD", model: "QB-8KTLD", series: "TLD", phase: "1-Ph", mpptCount: 2, maxDcV: 550, mpptMin: 80, mpptMax: 550, maxDcI: [20, 26], stringsPerMppt: [1, 2], ratedPower: 8000, maxOutputPower: 8800, maxOutputCurrent: 36.4, gridV: 230, recV: 360 },
  { id: "QB-10KTLD", model: "QB-10KTLD", series: "TLD", phase: "1-Ph", mpptCount: 2, maxDcV: 550, mpptMin: 80, mpptMax: 550, maxDcI: [20, 30], stringsPerMppt: [1, 2], ratedPower: 10000, maxOutputPower: 11000, maxOutputCurrent: 45.5, gridV: 230, recV: 360 },

  // TLC Series — 3-Ph, 2 MPPT (6K–12K)
  { id: "QB-6KTLC", model: "QB-6KTLC", series: "TLC", phase: "3-Ph", mpptCount: 2, maxDcV: 1100, mpptMin: 180, mpptMax: 1000, maxDcI: [20, 20], stringsPerMppt: [1, 1], ratedPower: 6000, maxOutputPower: 6600, maxOutputCurrent: 10, gridV: 400, recV: 650 },
  { id: "QB-8KTLC", model: "QB-8KTLC", series: "TLC", phase: "3-Ph", mpptCount: 2, maxDcV: 1100, mpptMin: 180, mpptMax: 1000, maxDcI: [20, 20], stringsPerMppt: [1, 1], ratedPower: 8000, maxOutputPower: 8800, maxOutputCurrent: 13.3, gridV: 400, recV: 650 },
  { id: "QB-10KTLC", model: "QB-10KTLC", series: "TLC", phase: "3-Ph", mpptCount: 2, maxDcV: 1100, mpptMin: 180, mpptMax: 1000, maxDcI: [20, 20], stringsPerMppt: [1, 1], ratedPower: 10000, maxOutputPower: 11000, maxOutputCurrent: 16.7, gridV: 400, recV: 650 },
  { id: "QB-12KTLC", model: "QB-12KTLC", series: "TLC", phase: "3-Ph", mpptCount: 2, maxDcV: 1100, mpptMin: 180, mpptMax: 1000, maxDcI: [20, 20], stringsPerMppt: [1, 1], ratedPower: 12000, maxOutputPower: 13200, maxOutputCurrent: 20, gridV: 400, recV: 650 },

  // TLC Series — 3-Ph, 2 MPPT (15K–30K)
  { id: "QB-15KTLC", model: "QB-15KTLC", series: "TLC", phase: "3-Ph", mpptCount: 2, maxDcV: 1100, mpptMin: 180, mpptMax: 1000, maxDcI: [20, 30], stringsPerMppt: [1, 2], ratedPower: 15000, maxOutputPower: 16500, maxOutputCurrent: 24, gridV: 400, recV: 650 },
  { id: "QB-17KTLC", model: "QB-17KTLC", series: "TLC", phase: "3-Ph", mpptCount: 2, maxDcV: 1100, mpptMin: 180, mpptMax: 1000, maxDcI: [20, 30], stringsPerMppt: [1, 2], ratedPower: 17000, maxOutputPower: 18700, maxOutputCurrent: 28.3, gridV: 400, recV: 650 },
  { id: "QB-20KTLC", model: "QB-20KTLC", series: "TLC", phase: "3-Ph", mpptCount: 2, maxDcV: 1100, mpptMin: 180, mpptMax: 1000, maxDcI: [30, 30], stringsPerMppt: [2, 2], ratedPower: 20000, maxOutputPower: 22000, maxOutputCurrent: 32, gridV: 400, recV: 650 },
  { id: "QB-23KTLC", model: "QB-23KTLC", series: "TLC", phase: "3-Ph", mpptCount: 2, maxDcV: 1100, mpptMin: 180, mpptMax: 1000, maxDcI: [30, 30], stringsPerMppt: [2, 2], ratedPower: 23000, maxOutputPower: 25300, maxOutputCurrent: 36.5, gridV: 400, recV: 650 },
  { id: "QB-25KTLC", model: "QB-25KTLC", series: "TLC", phase: "3-Ph", mpptCount: 2, maxDcV: 1100, mpptMin: 180, mpptMax: 1000, maxDcI: [40, 30], stringsPerMppt: [2, 2], ratedPower: 25000, maxOutputPower: 27500, maxOutputCurrent: 41, gridV: 400, recV: 650 },
  { id: "QB-28KTLC", model: "QB-28KTLC", series: "TLC", phase: "3-Ph", mpptCount: 2, maxDcV: 1100, mpptMin: 180, mpptMax: 1000, maxDcI: [40, 30], stringsPerMppt: [2, 2], ratedPower: 28000, maxOutputPower: 30800, maxOutputCurrent: 45, gridV: 400, recV: 650 },
  { id: "QB-30KTLC", model: "QB-30KTLC", series: "TLC", phase: "3-Ph", mpptCount: 2, maxDcV: 1100, mpptMin: 180, mpptMax: 1000, maxDcI: [40, 40], stringsPerMppt: [2, 2], ratedPower: 30000, maxOutputPower: 33000, maxOutputCurrent: 48, gridV: 400, recV: 650 },
];

module.exports = { PANELS, INVERTERS, TC_VOC, TC_ISC, STC_TEMP, MAX_SYSTEM_V };
