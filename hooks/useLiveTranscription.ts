"use client";

import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { useEffect, useRef, useState } from "react";

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
}

// Accepts the MediaStream that LiveKit already captured — no second getUserMedia call
export function useLiveTranscription(
  audioStream: MediaStream | null,
  language: string = "en"
) {
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connectionRef = useRef<any>(null);

  useEffect(() => {
    if (!audioStream) return;
    let active = true;

    const start = async () => {
      const res = await fetch("/api/deepgram-token");
      if (!res.ok || !active) return;
      const { key } = await res.json();
      if (!active) return;

      const deepgram = createClient(key);
      const connection = deepgram.listen.live({
        model: "nova-2",
        language,
        smart_format: true,
        interim_results: true,
        utterance_end_ms: 1000,
        vad_events: true,
      });
      connectionRef.current = connection;

      connection.on(LiveTranscriptionEvents.Open, () => {
        const recorder = new MediaRecorder(audioStream);
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
      try {
        connectionRef.current?.finish();
      } catch {
        // ignore close errors on cleanup
      }
    };
  }, [audioStream, language]);

  return transcript;
}
