import '../styles/ChatBox.css';
/* import { Send, Mic, MicOff } from "lucide-react"; */
import MicButton from './mic-button';
import { AIReply } from '../services/ai-reply';
import { useState, useRef, useEffect } from "react";

export default function ChatBox({ onAIResponse }) {
    const [messages, setMessages] = useState([
        { id: 1, sender: "ai", text: "Hello 👋 I’m Lucy,  your AI assistant" },
    ]);
    const [input, setInput] = useState("");
    const chatEndRef = useRef(null);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMsg = { id: Date.now(), sender: "user", text: input };
        setMessages((prev) => [...prev, newMsg]);
        setInput("");

        const aiReply = await AIReply(input);

        let aiReplyMsg = "";

        /*switch (aiReply.query_type) {
            case "ticket_query":
                aiReplyMsg = "Here is your ticket detail:" + aiReply.ticket_details.session_id + aiReply.ticket_details.from_station
                break
            case "route_query":
                aiReplyMsg = "Here is your route details" + aiReply.route_details.station_line1 + aiReply.route_details.station_line2
                break

            default:
                aiReplyMsg = aiReply.text ?? "I didn't understand that, can you retry";
        }
                */

        setMessages((prev) => [
            ...prev,
            { id: Date.now(), sender: "ai", text: aiReply.text + "\n" + aiReplyMsg },
        ]);

        if (onAIResponse) {
            onAIResponse(aiReply);
        }

    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="chat-container">
            <div className="chat-header">AI Cashier 💬</div>

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
                <MicButton onTranscript={(t) => setInput(t)} />
            </form>
        </div>
    );
}