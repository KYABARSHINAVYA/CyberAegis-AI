import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.js";

const router = express.Router();

const memoryUsers = [];

const isMongoReady = () => mongoose.connection.readyState === 1;

const signToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET || "aegis-dev-secret",
    { expiresIn: "1d" }
  );

const toPublicUser = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const getUserByEmail = async (email) =>
  isMongoReady()
    ? await User.findOne({ email })
    : memoryUsers.find((user) => user.email === email);

const saveMemoryUser = ({ name, email, password }) => {
  const user = {
    id: Date.now().toString(),
    name,
    email,
    password,
    createdAt: new Date(),
  };

  memoryUsers.push(user);
  return user;
};


// ================= REGISTER =================

router.post("/register", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!isMongoReady()) {
      saveMemoryUser({
        name,
        email,
        password: hashedPassword,
      });

      return res.status(201).json({
        message: "Registered successfully",
      });
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      message: "Registered successfully",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
});


// ================= LOGIN =================

router.post("/login", async (req, res) => {
  try {

    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = isMongoReady()
      ? await User.findOne({ email })
      : memoryUsers.find((entry) => entry.email === email);

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = signToken(user._id || user.id);

    res.json({
      message: "Login successful",
      token,
      user: toPublicUser(user),
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

export default router;