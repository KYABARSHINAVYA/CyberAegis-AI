import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.js";

const router = express.Router();
const memoryUsers = [];
const pendingSignups = new Map();
const pendingPasswordResets = new Map();

const OTP_TTL_MS = 10 * 60 * 1000;

const toPublicUser = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const isMongoReady = () => mongoose.connection.readyState === 1;

const signToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET || "aegis-dev-secret",
    { expiresIn: "1d" }
  );

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const isFalseEnv = (value) => String(value || "").trim().toLowerCase() === "false";

export const getMissingSmtpConfig = () =>
  ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"].filter(
    (key) => !process.env[key]?.trim()
  );

const getUserByEmail = async (email) =>
  isMongoReady()
    ? await User.findOne({ email })
    : memoryUsers.find((user) => user.email === email);

const saveMemoryUser = ({ name, email, password }) => {
  const user = {
    id: `${Date.now()}`,
    name,
    email,
    password,
    createdAt: new Date(),
  };
  memoryUsers.push(user);
  return user;
};

const sendOtpEmail = async ({ to, otp, subject, intro }) => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const family = Number(process.env.SMTP_FAMILY || 4);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  const missingSmtpConfig = getMissingSmtpConfig();
  if (missingSmtpConfig.length > 0) {
    throw new Error(
      `SMTP is not configured. Missing ${missingSmtpConfig.join(", ")} in backend/.env.`
    );
  }

  let nodemailer;
  try {
    nodemailer = (await import("nodemailer")).default;
  } catch {
    throw new Error("Nodemailer is not installed. Run npm install --prefix backend before using SMTP email.");
  }

  const createTransporter = (smtpPort) => nodemailer.createTransport({
    host,
    port: smtpPort,
    family,
    secure: smtpPort === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: !isFalseEnv(process.env.SMTP_TLS_REJECT_UNAUTHORIZED),
    },
  });

  const mailOptions = {
    from,
    to,
    subject,
    text: `${intro}\n\nYour OTP is ${otp}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <p>${intro}</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p>
        <p>This OTP expires in 10 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      </div>
    `,
  };

  try {
    await createTransporter(port).sendMail(mailOptions);
  } catch (error) {
    if (port === 587 && error.code === "ECONNREFUSED") {
      await createTransporter(465).sendMail(mailOptions);
    } else {
      throw error;
    }
  }

  return { delivered: true };
};

const removeExpiredOtp = (store, email) => {
  const entry = store.get(email);
  if (entry && entry.expiresAt <= Date.now()) {
    store.delete(email);
    return true;
  }
  return false;
};

// ================= SIGNUP OTP =================
router.post("/send-signup-otp", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const hashedPassword = await bcrypt.hash(password, 10);

    pendingSignups.set(email, {
      name,
      email,
      password: hashedPassword,
      otpHash,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    await sendOtpEmail({
      to: email,
      otp,
      subject: "CyberAegis AI signup verification OTP",
      intro: "Use this OTP to verify your CyberAegis AI account signup.",
    });

    return res.json({
      message: "OTP sent to your email.",
    });
  } catch (err) {
    console.error("Signup OTP error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

router.post("/verify-signup-otp", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    if (removeExpiredOtp(pendingSignups, email)) {
      return res.status(400).json({ message: "OTP expired. Request a new OTP." });
    }

    const pending = pendingSignups.get(email);
    if (!pending) {
      return res.status(400).json({ message: "No signup OTP found for this email" });
    }

    const isValidOtp = await bcrypt.compare(otp, pending.otpHash);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      pendingSignups.delete(email);
      return res.status(400).json({ message: "User already exists" });
    }

    if (!isMongoReady()) {
      saveMemoryUser({
        name: pending.name,
        email: pending.email,
        password: pending.password,
      });
    } else {
      const user = new User({
        name: pending.name,
        email: pending.email,
        password: pending.password,
      });
      await user.save();
    }

    pendingSignups.delete(email);

    return res.status(201).json({
      message: "Email verified. Account created successfully. Please login.",
    });
  } catch (err) {
    console.error("Signup OTP verification error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!isMongoReady()) {
      saveMemoryUser({
        name,
        email,
        password: hashedPassword,
      });

      return res.status(201).json({
        message: "Registered successfully. Please login.",
      });
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // ❌ IMPORTANT: DO NOT LOGIN USER HERE
    return res.status(201).json({
      message: "Registered successfully. Please login.",
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    pendingPasswordResets.set(email, {
      otpHash,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    await sendOtpEmail({
      to: email,
      otp,
      subject: "CyberAegis AI password reset OTP",
      intro: "Use this OTP to reset your CyberAegis AI password.",
    });

    return res.json({
      message: "Password reset OTP sent to your email.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();
    const password = req.body.password;

    if (!email || !otp || !password) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (removeExpiredOtp(pendingPasswordResets, email)) {
      return res.status(400).json({ message: "OTP expired. Request a new OTP." });
    }

    const pending = pendingPasswordResets.get(email);
    if (!pending) {
      return res.status(400).json({ message: "No password reset OTP found for this email" });
    }

    const isValidOtp = await bcrypt.compare(otp, pending.otpHash);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isMongoReady()) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "No account found with this email" });
      }
      user.password = hashedPassword;
      await user.save();
    } else {
      const user = memoryUsers.find((entry) => entry.email === email);
      if (!user) {
        return res.status(404).json({ message: "No account found with this email" });
      }
      user.password = hashedPassword;
    }

    pendingPasswordResets.delete(email);

    return res.json({ message: "Password reset successfully. Please login." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = isMongoReady()
      ? await User.findOne({ email })
      : memoryUsers.find((entry) => entry.email === email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user._id || user.id);

    res.json({
      message: "Login successful",
      token,
      user: toPublicUser(user),
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
