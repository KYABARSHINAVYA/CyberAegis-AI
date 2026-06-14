from flask import Flask,request,jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/scan-url", methods=["POST"])
def scan_url():
    try:
        data = request.json or {}
        url = data.get("url", "")

        return jsonify({
            "status": "safe",
            "confidence": 95
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/api/auth/login", methods=["POST"])
def login():

    data = request.json
    email = data.get("email")
    password = data.get("password")

    return jsonify({
        "token": "demo_token",
        "user": {
            "email": email
        }
    })
@app.route("/")
def home():
    return "Backend is running"

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)