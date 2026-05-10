"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  useTracks,
  VideoTrack,
  RoomAudioRenderer,
  useDataChannel,
} from "@livekit/components-react";
import type { TrackReference } from "@livekit/components-react";
import { Track, VideoPresets } from "livekit-client";
import { useLiveTranscription } from "@/hooks/useLiveTranscription";

interface ChatMessage {
  id: string;
  text: string;
  isLocal: boolean;
}

// ─── Video call UI (must be inside <LiveKitRoom>) ────────────────────────────

function VideoCallView({
  onLeave,
  onSkip,
}: {
  onLeave: () => void;
  onSkip: () => void;
}) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  const localTrack = tracks.find(
    (t) => t.participant.isLocal && t.publication !== undefined
  ) as TrackReference | undefined;
  const remoteTrack = tracks.find(
    (t) => !t.participant.isLocal && t.publication !== undefined
  ) as TrackReference | undefined;

  const transcript = useLiveTranscription();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { send } = useDataChannel("chat", (msg) => {
    const text = new TextDecoder().decode(msg.payload);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, isLocal: false },
    ]);
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;
    send(new TextEncoder().encode(text), { reliable: true, topic: "chat" });
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, isLocal: true },
    ]);
    setInputText("");
  };

  return (
    <div className="relative h-dvh bg-[#0f0623] flex flex-col overflow-hidden">
      {/* Ambient orbs */}
      <div
        aria-hidden="true"
        className="absolute -top-[15%] -left-[10%] w-[500px] h-[500px] rounded-full bg-pink-600/20 blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[20%] -right-[5%] w-[500px] h-[500px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none"
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl select-none">🌍</span>
          <span className="text-white font-black text-xl tracking-tight">
            Lingo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-white font-bold text-sm py-2 px-5 rounded-full transition-all duration-150 cursor-pointer"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-sm py-2 px-5 rounded-full transition-all duration-150 cursor-pointer"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="relative z-10 flex-1 flex gap-3 px-5 pb-5 min-h-0">
        {/* Video boxes */}
        <div className="flex-1 flex gap-3 min-h-0">
          {/* Stranger */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-gray-900/80 border border-white/10">
            {remoteTrack ? (
              <VideoTrack
                trackRef={remoteTrack}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/20">
                <span className="text-4xl select-none">👤</span>
                <span className="text-xs">Waiting for match…</span>
              </div>
            )}
            <span className="absolute bottom-2 left-2 bg-black/50 text-white/60 text-xs font-semibold px-2 py-0.5 rounded-md">
              Stranger
            </span>
          </div>

          {/* You */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-gray-900/80 border border-white/10">
            {localTrack ? (
              <VideoTrack
                trackRef={localTrack}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/20">
                <span className="text-4xl select-none">📷</span>
                <span className="text-xs">No camera</span>
              </div>
            )}
            <span className="absolute bottom-2 left-2 bg-black/50 text-white/60 text-xs font-semibold px-2 py-0.5 rounded-md">
              You
            </span>
            {/* Live transcription caption */}
            {transcript?.text && (
              <div className="absolute bottom-8 left-2 right-2 flex justify-center pointer-events-none">
                <span className="bg-black/70 text-white px-3 py-1.5 rounded-xl text-xs text-center max-w-full leading-relaxed">
                  {transcript.isFinal ? (
                    transcript.text
                  ) : (
                    <span className="italic opacity-70">{transcript.text}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chat sidebar — hidden on small screens */}
        <div className="hidden sm:flex w-52 flex-col gap-2 shrink-0">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 overflow-y-auto min-h-0 flex flex-col gap-1.5">
            {messages.length === 0 ? (
              <p className="text-white/20 text-xs text-center mt-2">
                Say hi 👋
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isLocal ? "justify-end" : "justify-start"}`}
                >
                  <span
                    className={`max-w-full px-2.5 py-1.5 rounded-xl text-xs break-words leading-relaxed ${
                      msg.isLocal
                        ? "bg-violet-600 text-white rounded-br-none"
                        : "bg-white/15 text-white/80 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-1.5 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Message…"
              className="flex-1 min-w-0 bg-white/10 text-white placeholder-white/30 text-xs px-3 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-white/40"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-sm px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer shrink-0"
            >
              ↑
            </button>
          </div>
        </div>
      </div>

      <RoomAudioRenderer />
    </div>
  );
}

// ─── Room page ───────────────────────────────────────────────────────────────

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [participantName] = useState(
    () => `user-${Math.random().toString(36).slice(2, 8)}`
  );

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(
          `/api/livekit-token?room=${encodeURIComponent(roomId)}&username=${encodeURIComponent(participantName)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to get room token");
        setToken(data.token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to connect");
      }
    };
    fetchToken();
  }, [roomId, participantName]);

  const handleLeave = () => router.push("/");

  const handleSkip = () => {
    // Flag tells the home page to auto-start searching immediately
    sessionStorage.setItem("lingo_autostart", "1");
    router.push("/");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0623] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl select-none">⚠️</span>
        <p className="text-white font-semibold text-lg">{error}</p>
        <p className="text-white/40 text-sm max-w-xs">
          Make sure your LiveKit credentials are set correctly in .env.local
        </p>
        <button
          type="button"
          onClick={handleLeave}
          className="mt-4 text-white/50 hover:text-white text-sm underline transition-colors"
        >
          ← Back to home
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0f0623] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Connecting to room…</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      onDisconnected={handleLeave}
      options={{
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
        publishDefaults: {
          videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h720],
        },
      }}
    >
      <VideoCallView onLeave={handleLeave} onSkip={handleSkip} />
    </LiveKitRoom>
  );
}
