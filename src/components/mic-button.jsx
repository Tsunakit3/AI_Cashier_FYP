import { useState, useRef, useEffect } from "react";

export default function MicButton({ onTranscript }) {
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = "en-US"; // or "ms-MY"
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onresult = (event) => {
                let transcript = "";
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                if (onTranscript) onTranscript(transcript); // send transcript up
            };

            recognition.onend = () => {
                stopRecording();
                setListening(false);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech Recognition not supported in this browser.");
        }
    }, [onTranscript]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.onstart = () => {
                console.log("Recorder started...");
                audioChunksRef.current = [];
            };

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {

                if (audioChunksRef.current.length === 0) {
                    console.warn("⚠️ No audio chunks captured.");
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const audioUrl = URL.createObjectURL(audioBlob);

                const filename = 'voice' + Date.now() + ".wav";

                // Download the recording
                const a = document.createElement("a");
                a.href = audioUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

            mediaRecorderRef.current.start();
        } catch (err) {
            console.error("Microphone error:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.requestData(); // flush first chunk
            mediaRecorderRef.current.stop();
        }
    };

    const toggleMic = () => {
        if (!listening) {
            recognitionRef.current.start();
            startRecording();
            setListening(true);
        }
        else {
            recognitionRef.current.stop();
            setListening(false);
        }
    }

    return (
        <button type="button" onClick={toggleMic}>
            {listening ? "🛑" : "🎤"}
        </button>
    );
}