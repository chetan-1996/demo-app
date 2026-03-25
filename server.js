const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const { calculate, calcVoltageBar, getOptions } = require("./api/engine");

const app = express();
const PORT = process.env.PORT || 3000;

// ═══ MIDDLEWARE ═══
app.use(compression());
app.use(express.json());
app.use(cors({
    origin: [
        "https://demo-apps-henna.vercel.app",
        "https://qbitsenergy.com",
        "https://www.qbitsenergy.com",
        "https://tools.qbitsenergy.com",
        "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
}));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://demo-apps-henna.vercel.app"],
            // imgSrc: ["'self'", "data:", "https://qbitsenergy.com"],
            connectSrc: ["'self'"],
        },
    },
}));

// ═══ STATIC FILES (frontend) ═══
app.use(express.static(path.join(__dirname, "public")));

// ═══ API ROUTES ═══

// GET /api/options — dropdown values (panel & inverter list, no specs)
app.get("/api/options", (req, res) => {
    res.json(getOptions());
});

// POST /api/calculate — main calculation
app.post("/api/calculate", (req, res) => {
    const { panelWp, inverterId, totalPanels, tMin, tMax } = req.body;

    if (!panelWp || !inverterId || !totalPanels) {
        return res.status(400).json({ error: "Missing required fields: panelWp, inverterId, totalPanels" });
    }

    const result = calculate(
        Number(panelWp),
        String(inverterId),
        Number(totalPanels),
        Number(tMin ? ? -5),
        Number(tMax ? ? 50)
    );

    if (result.error) {
        return res.status(400).json({ error: result.error });
    }

    res.json(result);
});

// POST /api/voltage-bar — voltage bar for custom panel count
app.post("/api/voltage-bar", (req, res) => {
    const { panelWp, inverterId, panelsPerString, tMin, tMax } = req.body;

    if (!panelWp || !inverterId || !panelsPerString) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const result = calcVoltageBar(
        Number(panelWp),
        String(inverterId),
        Number(panelsPerString),
        Number(tMin ? ? -5),
        Number(tMax ? ? 50)
    );

    if (result.error) {
        return res.status(400).json({ error: result.error });
    }

    res.json(result);
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.0.0", uptime: process.uptime() });
});

// Catch-all → serve frontend
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ═══ START ═══
app.listen(PORT, () => {
    console.log(`\n  ⚡ Qbits String Calculator API`);
    console.log(`  ──────────────────────────────`);
    console.log(`  Server:  http://localhost:${PORT}`);
    console.log(`  API:     http://localhost:${PORT}/api/calculate`);
    console.log(`  Health:  http://localhost:${PORT}/api/health\n`);
});