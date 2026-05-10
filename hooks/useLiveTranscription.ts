"use client";

import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { useEffect, useRef, useState } from "react";

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
}

export function useLiveTranscription(language: string = "en") {
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Store the live connection so we can close it on cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connectionRef = useRef<any>(null);

  useEffect(() => {
    let active = true;

    const start = async () => {
      // Fetch the key from our server endpoint — never bundled in client JS
      const res = await fetch("/api/deepgram-token");
      if (!res.ok) {
        console.error("[Deepgram] Could not fetch API key");
        return;
      }
      const { key } = await res.json();
      if (!active) return;

      // Get microphone audio (separate from the LiveKit stream)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch {
        console.error("[Deepgram] Microphone access denied");
        return;
      }
      if (!active) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      // Connect to Deepgram
      const deepgram = createClient(key);
      const connection = deepgram.listen.live({
        model: "nova-2",
        language,
        smart_format: true,
        interim_results: true,
        utterance_end_ms: "1000",
        vad_events: true,
      });
      connectionRef.current = connection;

      connection.on(LiveTranscriptionEvents.Open, () => {
        // Start streaming audio in 250 ms chunks
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.addEventListener("dataavailable", (e) => {
          if (e.data.size > 0 && connection.getReadyState() === 1) {
            connection.send(e.data);
          }
        });

        recorder.start(250);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const alt = data.channel?.alternatives?.[0];
        if (!alt?.transcript) return;

        setTranscript({ text: alt.transcript, isFinal: data.is_final ?? false });

        // Log every final segment so you can track API usage in dev
        if (data.is_final) {
          console.log(`[Deepgram STT] "${alt.transcript}"`);
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error("[Deepgram] Error:", err);
      });
    };

    start().catch(console.error);

    return () => {
      active = false;
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        connectionRef.current?.finish();
      } catch {
        // ignore close errors
      }
    };
  }, [language]);

  return transcript;
}
