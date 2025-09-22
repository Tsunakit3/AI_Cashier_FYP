import '../styles/ChatBox.css';
import MicButton from './mic-button';
import { useState, useRef, useEffect } from "react";

export default function ChatBox({ message, onResponse, audioRef, setMouthCues, setIsTalking, setTriggerWave }) {
    const [messages, setMessages] = useState([
        { id: 1, sender: "ai", text: "Hello 👋 I’m Lucy, your AI assistant, how may I help you today ?" },
    ]);
    const [input, setInput] = useState("");
    const chatEndRef = useRef(null);
    const micRef = useRef(null); // ref to control MicButton
    const lastInputWasVoiceRef = useRef(false); // track whether last user input came from transcription

    // --- Typing indicator state ---
    const [isTyping, setIsTyping] = useState(false);

    // --- Shared AI reply handler ---
    const handleAIReply = async (aiText) => {
        const aiMessageId = Date.now() + 1;
        setIsTyping(true);

        // Trigger wave if greeting
        if (/hi|hello/i.test(aiText)) {
            setTriggerWave(true);
            setTimeout(() => setTriggerWave(false), 1500);
        }

        // Request TTS
        const ttsRes = await fetch("http://localhost:8020/infer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: aiText,
                speaker: "Shafiqah Idayu"
            })
        });

        if (!ttsRes.ok) {
            console.error("❌ TTS request failed:", ttsRes.status);
            setIsTyping(false);
            return;
        }

        const audioBlob = await ttsRes.blob();

        // Send audio to Rhubarb
        const formData = new FormData();
        formData.append("audio", audioBlob, "audio.wav");

        const rhubarbRes = await fetch("http://localhost:8030/rhubarb", {
            method: "POST",
            body: formData,
        });

        if (!rhubarbRes.ok) {
            console.error("❌ Rhubarb request failed:", rhubarbRes.status);
            setIsTyping(false);
            return;
        }

        const rhubarbJson = await rhubarbRes.json();
        setMouthCues(rhubarbJson.mouthCues);

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.addEventListener("play", () => setIsTalking(true));
        audio.addEventListener("pause", () => setIsTalking(false));
        audio.addEventListener("ended", () => {
            setIsTalking(false);
            // Auto re-arm mic only if last user input was voice
            if (lastInputWasVoiceRef.current && micRef.current && !micRef.current.isRecording()) {
                // small delay to avoid capturing tail of playback
                setTimeout(() => {
                    // Double-check still appropriate (user hasn't started typing etc.)
                    if (lastInputWasVoiceRef.current && micRef.current && !micRef.current.isRecording()) {
                        micRef.current.startRecording();
                    }
                }, 400);
            }
        });

        // Typing effect with timing proportional to audio duration
        audio.onloadedmetadata = () => {
            setIsTyping(false);

            const duration = audio.duration;
            const words = aiText.split(" ");
            const delay = (duration * 1000) / words.length;

            let currentText = "";
            setMessages((prev) => [...prev, { id: aiMessageId, sender: "ai", text: "" }]);

            // Start audio + typing together
            audio.play();

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
        };
    };

    // Helper to add PDF ticket as bot message
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

    // 🔑 Unified function for both typed + audio input
    const processUserMessage = async (userText, { source = 'text' } = {}) => {
        if (!userText.trim()) return;

        const newMessage = { id: Date.now(), sender: "user", text: userText };
        setMessages((prev) => [...prev, newMessage]);
        lastInputWasVoiceRef.current = (source === 'voice');

        try {
            const res = await fetch("http://localhost:8010/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_message: userText,
                    session_id: "1234"
                }),
            });
            const data = await res.json();
            await handleAIReply(data.text);
            if (onResponse) onResponse(data);

            // Ticket handling
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

    // --- Typed input handler
    const sendMessage = (e) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;
        processUserMessage(input, { source: 'text' });
        setInput("");
        lastInputWasVoiceRef.current = false; // typed input cancels auto reactivation
    };

    // --- External parent message handler
    useEffect(() => {
        if (!message) return;
        processUserMessage(message);
    }, [message]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    return (
        <div className="chat-container">
            <div className="chat-header">AI Cashier : Lucy 💬</div>

            <div className="chat-body">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message-row ${msg.sender}`}>
                        <div className="message-bubble">{msg.text}</div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="message-row ai">
                        <div className="message-bubble typing-indicator">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    </div>
                )}

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
                {/* 🔑 Now audio also goes through processUserMessage */}
                <MicButton ref={micRef} onTranscript={(t) => processUserMessage(t, { source: 'voice' })} session_id="1234" />
            </form>
        </div>
    );
}
