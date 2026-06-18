import mongoose from "mongoose";

const isFalseEnv = (value) => String(value || "").trim().toLowerCase() === "false";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("MongoDB is not configured. Authentication will use in-memory storage.");
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tlsAllowInvalidCertificates: isFalseEnv(process.env.MONGO_TLS_REJECT_UNAUTHORIZED),
    });

    console.log("MongoDB connected");
    return true;
  } catch (err) {
    console.warn("MongoDB connection failed. Authentication will use in-memory storage.");
    console.warn(err.message);
    return false;
  }
};

export default connectDB;
