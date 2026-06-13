import React, { useState } from "react";

export default function ThreatCopilot({ searchHistory = [] }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text:
        "Hello. I'm ShieldAI Threat Copilot.\nAsk me anything about threats detected by your platform."
    }
  ]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const question = input;

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        sender: "user",
        text: question
      }
    ]);

    setInput("");
    setLoading(true);

    try {
      const apiKey = localStorage.getItem("gemini_api_key");

      if (!apiKey) {
        setMessages(prev => [
          ...prev,
          {
            sender: "ai",
            text: "Gemini API key not found. Please add it in Settings."
          }
        ]);
        setLoading(false);
        return;
      }

      const prompt = `
You are ShieldAI Threat Copilot, an expert cybersecurity assistant.

Recent scan history:
${JSON.stringify(searchHistory)}

User Question:
${question}

Answer only according to the user's question.

Provide accurate and professional answers.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();

      const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.error?.message ||
        "Unable to generate a response.";

      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: answer
        }
      ]);
    } catch (error) {
      console.error(error);

      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "Failed to contact Gemini API."
        }
      ]);
    }

    setLoading(false);
  };

  return (
    <div>

      {/* Messages */}
      <div
        style={{
          height: "75vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent:
                msg.sender === "user"
                  ? "flex-end"
                  : "flex-start",
              marginBottom: "15px"
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "15px 18px",
                borderRadius:
                  msg.sender === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",

                background:
                  msg.sender === "user"
                    ? "linear-gradient(135deg,#8b5cf6,#3b82f6)"
                    : "#111827",

                border:
                  msg.sender === "ai"
                    ? "1px solid rgba(0,255,213,.15)"
                    : "none",

                color: "white",
                lineHeight: "1.6",
                textAlign: "left",
                whiteSpace: "pre-wrap"
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  marginBottom: "8px",
                  color:
                    msg.sender === "user"
                      ? "#d8b4fe"
                      : "#00ffd5"
                }}
              >
                {msg.sender === "user"
                  ? "You"
                  : "ShieldAI"}
              </div>

              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start"
            }}
          >
            <div
              style={{
                background: "#111827",
                color: "#00ffd5",
                padding: "15px",
                borderRadius: "18px"
              }}
            >
              ShieldAI is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "20px"
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="Ask about today's threats..."
          style={{
            flex: 1,
            padding: "15px",
            borderRadius: "15px",
            background: "#0f172a",
            border: "1px solid rgba(0,255,213,.2)",
            color: "white"
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            width: "60px",
            borderRadius: "15px",
            border: "none",
            cursor: "pointer",
            background:
              "linear-gradient(135deg,#8b5cf6,#3b82f6)",
            color: "white",
            fontSize: "20px"
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
