import '../styles/ChatBox.css';
import MicButton from './mic-button';
import { useState, useRef, useEffect } from "react";

export default function ChatBox({ message, onResponse, audioRef, setMouthCues, setIsTalking, setTriggerWave, setTriggerBow }) {
    const [messages, setMessages] = useState([
        { id: 1, sender: "ai", text: "Hello 👋 I’m Lucy, your AI assistant, how may I help you today ?" },
    ]);
    const [input, setInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const chatEndRef = useRef(null);
    const micRef = useRef(null);
    const lastInputWasVoiceRef = useRef(false);

    const [isTyping, setIsTyping] = useState(false);

    // 🔑 Reset session (frontend only)
    const resetSession = () => {
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                sender: "ai",
                text: "🙏 Thanks for using AI Cashier, see you next time!",
            },
        ]);
        if (typeof setTriggerBow === "function") {
            setTriggerBow(true);
            setTimeout(() => setTriggerBow(false), 2000); 
        }
        setTimeout(() => {
            setMessages([
                {
                    id: 1,
                    sender: "ai",
                    text: "Hello 👋 I’m Lucy, your AI assistant, how may I help you today ?",
                },
            ]);
            setMouthCues([]);
            setIsTalking(false);
            setTriggerWave(false);
        }, 5000);
    };

    // --- Shared AI reply handler ---
    const handleAIReply = async (aiText) => {
        const aiMessageId = Date.now() + 1;
        setIsTyping(true);

        if (/hi|hello/i.test(aiText)) {
            setTriggerWave(true);
            setTimeout(() => setTriggerWave(false), 1500);
        }

        const ttsRes = await fetch("http://localhost:8020/infer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: aiText, speaker: "Shafiqah Idayu" }),
        });

        if (!ttsRes.ok) {
            console.error("❌ TTS request failed:", ttsRes.status);
            setIsTyping(false);
            return;
        }

        const audioBlob = await ttsRes.blob();

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
            if (lastInputWasVoiceRef.current && micRef.current && !micRef.current.isRecording()) {
                setTimeout(() => {
                    if (lastInputWasVoiceRef.current && micRef.current && !micRef.current.isRecording()) {
                        micRef.current.startRecording();
                    }
                }, 400);
            }
        });

        audio.onloadedmetadata = () => {
            setIsTyping(false);
            const duration = audio.duration;
            const words = aiText.split(" ");
            const delay = (duration * 1000) / words.length;

            let currentText = "";
            setMessages((prev) => [...prev, { id: aiMessageId, sender: "ai", text: "" }]);
            audio.play();

            words.forEach((word, i) => {
                setTimeout(() => {
                    currentText += word + " ";
                    setMessages((prev) =>
                        prev.map((msg) => (msg.id === aiMessageId ? { ...msg, text: currentText } : msg))
                    );
                }, i * delay);
            });
        };
    };

    // --- Add PDF ticket message ---
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
                            onClick={() => {
                                // ✅ Reset only AFTER user downloads
                                setTimeout(() => {
                                    resetSession();
                                }, 5000); // small delay to ensure download starts
                            }}
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

    // --- Process user message (typed/voice) ---
    const processUserMessage = async (userText, { source = 'text' } = {}) => {
        if (!userText.trim()) return;
        setIsProcessing(true);
        setMessages((prev) => [...prev, { id: Date.now(), sender: "user", text: userText }]);
        lastInputWasVoiceRef.current = (source === 'voice');

        try {
            const res = await fetch("http://localhost:8010/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_message: userText, session_id: "1234" }),
            });
            const data = await res.json();
            await handleAIReply(data.text);
            if (onResponse) onResponse(data);

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
        setIsProcessing(false);  
    }
    };

    const sendMessage = (e) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;
        processUserMessage(input, { source: 'text' });
        setInput("");
        lastInputWasVoiceRef.current = false;
    };

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
                <button type="submit"  disabled={isProcessing} >➤</button>
                <MicButton ref={micRef} onTranscript={(t) => processUserMessage(t, { source: 'voice' })} session_id="1234" />
                {/* 🔄 Manual reset for testing */}
                <button type="button" onClick={resetSession} style={{ marginLeft: "8px" }}  disabled={isProcessing} > Restart 🔄</button>
            </form>
        </div>
    );
}
