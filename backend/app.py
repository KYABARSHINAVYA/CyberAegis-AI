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
@app.route("/")
def home():
    return "Backend is running"

if __name__=="__main__":
    app.run(debug=True)