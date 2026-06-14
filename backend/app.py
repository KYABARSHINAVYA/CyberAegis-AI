from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# ---------------- HOME ----------------
@app.route("/")
def home():
    return "Backend is running"


# ---------------- LOGIN ----------------
@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}

        email = data.get("email")
        password = data.get("password")

        return jsonify({
            "token": "demo_token",
            "user": {
                "email": email
            }
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Login failed",
            "details": str(e)
        }), 500


# ---------------- SCAN URL ----------------
@app.route("/scan-url", methods=["POST"])
def scan_url():
    try:
        data = request.get_json() or {}
        url = data.get("url", "")

        return jsonify({
            "status": "safe",
            "confidence": 95,
            "url": url
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Scan failed",
            "details": str(e)
        }), 500
@app.route("/api/auth/register", methods=["POST"])
def register():
    try:
        data = request.get_json() or {}

        email = data.get("email")
        password = data.get("password")

        return jsonify({
            "message": "User registered successfully",
            "user": {
                "email": email
            }
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# ---------------- IMPORTANT FOR RENDER ----------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)