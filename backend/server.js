import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import connectDB from "./config/db.js";

// Utilities
import { analyzeEmail } from './utils/emailAnalyzer.js';
import { analyzeUrl } from './utils/urlAnalyzer.js';
import {
  analyzeImage,
  analyzeAudio,
  analyzeVideo
} from './utils/mediaAnalyzer.js';

import axios from 'axios';

// Routes
import authRoutes from './routes/authRoutes.js';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

connectDB();

const app = express();

const PORT = process.env.PORT || 5000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

// Uploads directory
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// In-Memory Database (re-instantiated on boot for mock demonstration)

// Store all analysis results
const analysisHistory = [];
// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// ================= AUTHENTICATION ROUTES =================

// Registration Endpoint


// Login Endpoint

// Update Profile Details
;

// ================= CORE FORENSIC ANALYSIS ROUTES =================

// 1. Email and Message Analysis endpoint
app.post('/api/analyze/email', async (req, res) => {
  try {
    const { content, headers, apiKey } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required for analysis.' });
    }
    const report = await analyzeEmail(content, headers || '', apiKey || '');

analysisHistory.push({
  type: "email",
  score: report.threatScore,
  threatLevel: report.threatLevel,
  timestamp: new Date()
});

res.json(report);
  } catch (error) {
    console.error('Email analysis API error:', error);
    res.status(500).json({ error: 'Server error during email analysis.' });
  }
});

// 2. URL and Website Analysis endpoint
app.post('/api/analyze/url', async (req, res) => {
  try {
    const { url, apiKey } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required for analysis.' });
    }
    const report = await analyzeUrl(url, apiKey || '');

analysisHistory.push({
  type: "url",
  score: report.threatScore,
  threatLevel: report.threatLevel,
  timestamp: new Date()
});

res.json(report);
  } catch (error) {
    console.error('URL analysis API error:', error);
    res.status(500).json({ error: 'Server error during URL analysis.' });
  }
});

// 3. Media Upload Analysis endpoint (Image, Audio, Video)
app.post('/api/analyze/media', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    const { type } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    let report;
    const fileMime = file.mimetype.toLowerCase();
    const mediaType = type || (
      fileMime.startsWith('image/') ? 'image' :
      fileMime.startsWith('audio/') ? 'audio' :
      fileMime.startsWith('video/') ? 'video' : null
    );

    if (mediaType === 'image') {
      report = analyzeImage(file);
    } else if (mediaType === 'audio') {
      report = analyzeAudio(file);
    } else if (mediaType === 'video') {
      report = analyzeVideo(file);
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Unsupported media type.' });
    }

    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.warn('Failed to delete temp file:', err.message);
    }
    res.json(report);

   analysisHistory.push({
  type: report.mediaType,
  score: report.threatScore,
  threatLevel: report.threatLevel,
  timestamp: new Date()
});
  } catch (error) {
    console.error('Media analysis API error:', error);
    res.status(500).json({ error: 'Server error during media analysis.' });
  }
});

// 4. UNIVERSAL Auto-Detect Classifier endpoint (Multipart / JSON Text)
app.post('/api/analyze/universal', upload.single('file'), async (req, res) => {
  try {
    // A. File Upload Case
    if (req.file) {
      const file = req.file;
      const fileMime = file.mimetype.toLowerCase();
      let report;

      if (fileMime.startsWith('image/')) {
        report = analyzeImage(file);
      } else if (fileMime.startsWith('audio/')) {
        report = analyzeAudio(file);
      } else if (fileMime.startsWith('video/')) {
        report = analyzeVideo(file);
      } else {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Unsupported file type dropped in Universal Shield.' });
      }

      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.warn('Failed to delete temp file:', err.message);
      }

      return res.json({
        detectedType: report.mediaType,
        ...report
      });
    }

    // B. Text Paste Case
    const { text, apiKey } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'No text or file was provided for universal analysis.' });
    }

    const trimmedText = text.trim();
    // Classify: Does it look like a URL?
    // Starts with http/https OR matches domain-like character groupings (no spaces, contains a dot, and TLD)
    const isUrl = /^https?:\/\//i.test(trimmedText) || 
                  (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,6}(\/[^\s]*)?$/.test(trimmedText) && !trimmedText.includes(' '));

    if (isUrl) {
      const report = await analyzeUrl(trimmedText, apiKey || '');
      return res.json({
        detectedType: 'url',
        ...report
      });
    } else {
      const report = await analyzeEmail(trimmedText, '', apiKey || '');
      return res.json({
        detectedType: 'email',
        ...report
      });
    }

  } catch (error) {
    console.error('Universal analysis error:', error);
    res.status(500).json({ error: 'Server error in Universal Shield.' });
  }
});
app.get("/api/analysis/history", (req, res) => {
  res.json(analysisHistory);
});
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Mode:", mode);
  console.log("Received Token:", token);
  console.log("Expected Token:", process.env.VERIFY_TOKEN);

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("Webhook verified!");
    return res.status(200).send(challenge);
  }

  console.log("Webhook verification failed");
  return res.sendStatus(403);
});


app.get("/api/dashboard/stats", (req, res) => {

  const totalScans = analysisHistory.length;

  const threatsDetected = analysisHistory.filter(
    item =>
      item.threatLevel === "HIGH" ||
      item.threatLevel === "CRITICAL"
  ).length;

  const deepfakeAlerts = analysisHistory.filter(
    item =>
      item.type === "image" ||
      item.type === "video" ||
      item.type === "audio"
  ).length;

  res.json({
    defenseShield: "ACTIVE",
    totalScans,
    threatsDetected,
    deepfakeAlerts
  });

});

// Telegram Alerts endpoint
app.post('/api/alerts/telegram', async (req, res) => {
  try {
    const { to, message, incident } = req.body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const defaultChatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !defaultChatId) {
      return res.status(400).json({
        ok: false,
        error: 'Telegram Bot API is not configured on the server.',
        setup: [
          'Set TELEGRAM_BOT_TOKEN in backend .env',
          'Set TELEGRAM_CHAT_ID in backend .env'
        ]
      });
    }

    const targetChatId = (to && to.trim()) || defaultChatId;
    if (!targetChatId) {
      return res.status(400).json({ ok: false, error: 'No destination chat ID provided.' });
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const payload = {
      chat_id: targetChatId,
      text: message || buildTelegramMessage(incident),
      disable_web_page_preview: true
    };

    const resp = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return res.json({ ok: true, provider: 'telegram_bot', to: targetChatId, data: resp.data });
  } catch (err) {
    console.error('Telegram send error:', err?.response?.data || err.message || err);
    return res.status(500).json({ ok: false, error: 'Failed to send Telegram message', details: err?.response?.data || err.message });
  }
});

function buildTelegramMessage(incident) {
  if (!incident) return 'AegisShield Alert: Review your dashboard for recent threats.';
  return `AegisShield Alert\nType: ${String(incident.type || 'scan').toUpperCase()}\nSeverity: ${incident.severity || 'low'}\nMessage: ${incident.message || 'Please review'}\nTime: ${incident.time || new Date().toLocaleString()}`;
}


app.get("/", (req, res) => {
  res.send("🛡️ AegisShield AI Backend is running!");
});


// Start Server
app.listen(PORT, () => {
  console.log(`🛡️ AegisShield AI Security Backend running on port ${PORT}`);
});
