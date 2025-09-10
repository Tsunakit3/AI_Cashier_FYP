import { useState, useRef } from "react";

export default function MicButton({ onTranscript }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // ✅ Use WebM with Opus (works with your backend process_audio)
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    audioChunks.current = [];
    mediaRecorder.start();
    setRecording(true);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // ✅ Always send as .webm
      const audioBlob = new Blob(audioChunks.current, { type: mimeType });
      audioChunks.current = [];

      const formData = new FormData();
      formData.append("file", audioBlob, "speech.webm");
      formData.append("session_id", "1234"); // Replace with dynamic session_id if needed

      try {
        const res = await fetch("http://localhost:8000/transcribe", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error("ASR API error:", res.status, errText);
          return;
        }
        const data = await res.json();
        onTranscript(data.transcription); // ✅ matches backend
      } catch (err) {
        console.error("ASR request failed:", err);
      }
    };
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <button type="button" onClick={recording ? stopRecording : startRecording}>
      {recording ? "⏹ Stop" : "🎤 Mic"}
    </button>
  );
}
