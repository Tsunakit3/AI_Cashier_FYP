import '../styles/ChatBox.css';
import MicButton from './mic-button';
import { useState, useRef, useEffect } from "react";

export default function ChatBox({ message, onResponse }) {
    const [messages, setMessages] = useState([
        { id: 1, sender: "ai", text: "Hello 👋 I’m Lucy, your AI assistant, how may I help you today ?" },
    ]);
    const [input, setInput] = useState("");
    const chatEndRef = useRef(null);

    // --- Shared AI reply handler ---
    const handleAIReply = async (aiText) => {
        const aiMessageId = Date.now() + 1;
        // Add empty AI bubble first
        setMessages((prev) => [...prev, { id: aiMessageId, sender: "ai", text: "" }]);

        // Request TTS
        const ttsRes = await fetch("http://localhost:8020/infer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: aiText,
                speaker: "Shafiqah Idayu"
            })
        });

        if (ttsRes.ok) {
            const audioBlob = await ttsRes.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onloadedmetadata = () => {
                const duration = audio.duration; // in seconds
                const words = aiText.split(" ");
                const delay = (duration * 1000) / words.length;

                let currentText = "";
                words.forEach((word, i) => {
                    setTimeout(() => {
                        currentText += word + " ";
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === aiMessageId ? { ...msg, text: currentText } : msg
                            )
                        );
                    }, i * delay);
                });

                audio.play();
            };
        }
    };

    // Helper to add PDF ticket as bot message with preview and download
    const addTicketMessage = (pdfUrl) => {
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                sender: "ai",
                text: (
                    <span>
                        <strong>🎫 Your Ticket:</strong><br />
                        <iframe
                            src={pdfUrl}
                            title="Ticket PDF Preview"
                            style={{
                                width: "100%",
                                maxWidth: "340px",
                                height: "130px",
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                margin: "12px 0"
                            }}
                        />
                        <br />
                        <a
                            href={pdfUrl}
                            download="ticket.pdf"
                            style={{
                                display: "inline-block",
                                marginTop: "8px",
                                padding: "8px 18px",
                                background: "#3A86FF",
                                color: "#fff",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontWeight: "bold",
                                fontSize: "1em"
                            }}
                        >
                            ⬇️ Download Ticket PDF
                        </a>
                    </span>
                ),
            },
        ]);
    };

    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        const newMessage = { id: Date.now(), sender: "user", text: input };
        setMessages((prev) => [...prev, newMessage]);
        try {
            const res = await fetch("http://localhost:8010/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_message: input,
                    session_id: "1234"
                }),
            });
            const data = await res.json();
            await handleAIReply(data.text);
            if (onResponse) onResponse(data);
            
            // If ticket_details is present, generate ticket PDF
            if (data.ticket_details && data.ticket_details.ticket_id) {
                const ticketRes = await fetch("http://localhost:8010/generate_ticket", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data.ticket_details),
                });
                if (ticketRes.ok) {
                    const blob = await ticketRes.blob();
                    const pdfUrl = URL.createObjectURL(blob);
                    addTicketMessage(pdfUrl);
                }
            }
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setInput("");
        }
    };

    useEffect(() => {
        if (!message) return;
        const sendParentMessage = async () => {
            try {
                const res = await fetch("http://localhost:8010/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_message: message,
                        session_id: "1234"
                    }),
                });
                const data = await res.json();
                await handleAIReply(data.text);
                if (onResponse) onResponse(data);
            } catch (err) {
                console.error("Error:", err);
            }
        };
        sendParentMessage();
    }, [message]);

    const handleTranscript = async (transcript) => {
        const userMessage = { id: Date.now(), sender: "user", text: transcript };
        setMessages((prev) => [...prev, userMessage]);

        try {
            const res = await fetch("http://localhost:8010/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_message: transcript, session_id: "1234" }),
            });
            const data = await res.json();
            await handleAIReply(data.text);
            if (onResponse) onResponse(data);
            
            // If ticket_details is present, generate ticket PDF
            if (data.ticket_details && data.ticket_details.ticket_id) {
                const ticketRes = await fetch("http://localhost:8010/generate_ticket", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data.ticket_details),
                });
                if (ticketRes.ok) {
                    const blob = await ticketRes.blob();
                    const pdfUrl = URL.createObjectURL(blob);
                    addTicketMessage(pdfUrl);
                }
            }

        } catch (err) {
            console.error("Error:", err);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="chat-container">
            <div className="chat-header">AI Cashier : Lucy 💬</div>

            <div className="chat-body">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`message-row ${msg.sender}`}
                    >
                        <div className="message-bubble">{msg.text}</div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <form className="chat-footer" onSubmit={sendMessage}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit">➤</button>
                <MicButton onTranscript={handleTranscript} session_id="1234" />
            </form>
        </div>
    );
}
