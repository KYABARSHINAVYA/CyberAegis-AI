from flask import Flask,request,jsonify

app = Flask(__name__)

@app.route("/scan-url",methods=["POST"])
def scan_url():

    data = request.json

    url = data["url"]

    # AI model prediction
    status = "safe"
    confidence = 95

    return jsonify({
        "status":status,
        "confidence":confidence
    })
@app.route("/api/auth/login", methods=["POST"])
def login():

    data = request.json

    email = data.get("email")
    password = data.get("password")

    return jsonify({
        "success": True,
        "user": {
            "email": email
        }
    })
@app.route("/")
def home():
    return "Backend is running"

if __name__=="__main__":
    app.run(debug=True)