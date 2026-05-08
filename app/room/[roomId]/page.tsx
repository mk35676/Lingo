"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  useTracks,
  VideoTrack,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { Track } from "livekit-client";

interface VideoCallViewProps {
  roomId: string;
  onHangUp: () => void;
}

function VideoCallView({ roomId, onHangUp }: VideoCallViewProps) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  const localTrack = tracks.find((t) => t.participant.isLocal);
  // Only count as "remote" if the participant actually has a camera publishing
  const remoteTrack = tracks.find(
    (t) => !t.participant.isLocal && t.publication !== undefined
  );

  return (
    <div className="relative w-full h-dvh bg-black overflow-hidden">
      {/* Remote video — full screen */}
      <div className="absolute inset-0">
        {remoteTrack ? (
          <VideoTrack
            trackRef={remoteTrack}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#0f0623] flex flex-col items-center justify-center gap-4 px-6 text-center">
            {/* Ambient orbs */}
            <div
              aria-hidden="true"
              className="absolute -top-[15%] -left-[10%] w-[400px] h-[400px] rounded-full bg-pink-600/20 blur-[100px] pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-[15%] -right-[5%] w-[400px] h-[400px] rounded-full bg-purple-700/20 blur-[100px] pointer-events-none"
            />
            <span className="text-6xl select-none relative z-10">👋</span>
            <p className="text-white/70 text-xl font-semibold relative z-10">
              Waiting for someone to join…
            </p>
            <p className="text-white/30 text-sm relative z-10">
              Open this in another browser window to test:
            </p>
            <code className="text-white/50 text-xs bg-white/5 px-3 py-1.5 rounded-lg relative z-10">
              localhost:3000/room/{roomId}
            </code>
          </div>
        )}
      </div>

      {/* Self-view PiP — above controls bar */}
      <div className="absolute bottom-28 right-4 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900 z-10">
        {localTrack ? (
          <VideoTrack
            trackRef={localTrack}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/40 text-xs text-center px-2">
              No camera
            </span>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center z-20">
        <button
          type="button"
          onClick={onHangUp}
          className="bg-red-500 hover:bg-red-600 active:bg-red-700 active:scale-95 text-white text-lg font-bold py-4 px-12 rounded-full shadow-2xl transition-all duration-150 cursor-pointer"
        >
          Hang up
        </button>
      </div>

      <RoomAudioRenderer />
    </div>
  );
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  // Stable random name for this session
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
          onClick={() => router.push("/")}
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
      onDisconnected={() => router.push("/")}
    >
      <VideoCallView roomId={roomId} onHangUp={() => router.push("/")} />
    </LiveKitRoom>
  );
}
