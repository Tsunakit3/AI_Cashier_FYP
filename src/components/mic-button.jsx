import React, { useState, useRef } from "react";

export default function MicButton({ onTranscript, session_id }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const vadSilenceStartRef = useRef(null);
  const vadStoppedRef = useRef(false);

  const vadThreshold = 0.01; // silence detection threshold
  const vadTimeout = 1000; // ms of silence before stopping

  const startRecording = async () => {
    vadStoppedRef.current = false;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    audioChunks.current = [];
    mediaRecorder.start();
    setRecording(true);

    // Audio context for silence detection (VAD)
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    processorRef.current = audioContextRef.current.createScriptProcessor(2048, 1, 1);

    processorRef.current.onaudioprocess = (e) => {
      if (vadStoppedRef.current) return;
      const input = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < input.length; i++) {
        sum += input[i] * input[i];
      }
      const rms = Math.sqrt(sum / input.length);

      if (rms < vadThreshold) {
        if (!vadSilenceStartRef.current) vadSilenceStartRef.current = Date.now();
        if (Date.now() - vadSilenceStartRef.current > vadTimeout) {
          vadStoppedRef.current = true;
          setRecording(false); // immediately toggle off the button
          stopRecording();
        }
      } else {
        vadSilenceStartRef.current = null;
      }
    };

    source.connect(processorRef.current);
    processorRef.current.connect(audioContextRef.current.destination);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // Cleanup VAD
      if (processorRef.current) processorRef.current.disconnect();
      if (audioContextRef.current) await audioContextRef.current.close();
      vadSilenceStartRef.current = null;
      vadStoppedRef.current = false;

      const audioBlob = new Blob(audioChunks.current, { type: mimeType });
      audioChunks.current = [];

      const formData = new FormData();
      formData.append("file", audioBlob, "speech.webm");
      formData.append("session_id", session_id);

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
        onTranscript(data.transcription);
      } catch (err) {
        console.error("ASR request failed:", err);
      }
    };
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    // Cleanup happens in onstop
  };

  return (
    <button
      className={`mic-btn${recording ? " recording" : ""}`}
      onClick={recording ? stopRecording : startRecording}
      style={{
        background: recording ? "#FF006E" : "#3A86FF",
        color: "#fff",
        borderRadius: "50%",
        width: "48px",
        height: "48px",
        border: "none",
        fontSize: "1.5em",
        cursor: "pointer",
        boxShadow: recording
          ? "0 0 8px #FF006E"
          : "0 2px 8px rgba(58,134,255,0.10)",
        transition: "background 0.2s",
      }}
      title={recording ? "Stop Recording" : "Start Recording"}
    >
      {recording ? "■" : "🎤"}
    </button>
  );
}
