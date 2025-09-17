import '../styles/ChatBox.css';
import MicButton from './mic-button';
import { useState, useRef, useEffect } from "react";

export default function ChatBox({ message, onResponse, audioRef, setMouthCues, setIsTalking, setTriggerWave }) {
    const [messages, setMessages] = useState([
        { id: 1, sender: "ai", text: "Hello 👋 I’m Lucy, your AI assistant, how may I help you today ?" },
    ]);
    const [input, setInput] = useState("");
    const chatEndRef = useRef(null);

    // --- Typing indicator state ---
    const [isTyping, setIsTyping] = useState(false);

    // --- Shared AI reply handler ---
    const handleAIReply = async (aiText) => {
        const aiMessageId = Date.now() + 1;

        // Show typing indicator
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
        audio.addEventListener("ended", () => setIsTalking(false));

        // Typing effect with timing proportional to audio duration
        audio.onloadedmetadata = () => {
            setIsTyping(false); // Hide typing dots when real text starts

            const duration = audio.duration;
            const words = aiText.split(" ");
            const delay = (duration * 1000) / words.length;

            let currentText = "";
            setMessages((prev) => [...prev, { id: aiMessageId, sender: "ai", text: "" }]);

            words.forEach((word, i) => {
                setTimeout(() => {
                    currentText += word + " ";
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === aiMessageId ? { ...msg, text: currentText } : msg
                        )
                    );

                    if (i === words.length - 1) {
                        audio.play();
                    }
                }, i * delay);
            });
        };
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
                <MicButton onTranscript={(t) => handleAIReply(t)} session_id="1234" />
            </form>
        </div>
    );
}
