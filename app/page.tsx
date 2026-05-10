"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const LANGUAGES = [
  { code: "en", label: "🇬🇧 English" },
  { code: "es", label: "🇪🇸 Spanish" },
  { code: "fr", label: "🇫🇷 French" },
  { code: "de", label: "🇩🇪 German" },
  { code: "it", label: "🇮🇹 Italian" },
  { code: "pt", label: "🇧🇷 Portuguese" },
  { code: "tr", label: "🇹🇷 Turkish" },
  { code: "ar", label: "🇸🇦 Arabic" },
  { code: "hi", label: "🇮🇳 Hindi" },
  { code: "ru", label: "🇷🇺 Russian" },
];

function getUserId(): string {
  let id = localStorage.getItem("lingo_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("lingo_user_id", id);
  }
  return id;
}

// ─── Searching screen ────────────────────────────────────────────────────────

function SearchingScreen({
  languageLabel,
  onCancel,
}: {
  languageLabel: string;
  onCancel: () => void;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f0623] flex items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute -top-[15%] -left-[10%] w-[500px] h-[500px] rounded-full bg-pink-600/25 blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[20%] -right-[5%] w-[600px] h-[600px] rounded-full bg-purple-700/25 blur-[120px] pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Sonar rings */}
        <div className="relative flex items-center justify-center w-40 h-40 mb-10">
          <div className="absolute w-40 h-40 rounded-full border-2 border-violet-400/50 animate-sonar" />
          <div
            className="absolute w-40 h-40 rounded-full border-2 border-violet-400/35 animate-sonar"
            style={{ animationDelay: "0.6s" }}
          />
          <div
            className="absolute w-40 h-40 rounded-full border-2 border-violet-400/20 animate-sonar"
            style={{ animationDelay: "1.2s" }}
          />
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 shadow-lg shadow-violet-500/50 flex items-center justify-center text-2xl select-none">
            🌍
          </div>
        </div>

        <p className="text-white text-2xl font-bold mb-2">
          Finding your match…
        </p>
        <p className="text-white/40 text-sm mb-12">
          Looking for someone who speaks {languageLabel}
        </p>

        <button
          type="button"
          onClick={onCancel}
          className="text-white/50 hover:text-white border border-white/20 hover:border-white/40 font-semibold py-3 px-10 rounded-full transition-all duration-200 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </main>
  );
}

// ─── Home ────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [isSearching, setIsSearching] = useState(false);
  const [queueId, setQueueId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handleStart = async () => {
    setIsSearching(true);
    const userId = getUserId();

    // Check if anyone is already waiting
    const { data: waiting } = await supabase
      .from("match_queue")
      .select("*")
      .eq("status", "waiting")
      .neq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (waiting) {
      // Found someone — match them and go
      const roomId = crypto.randomUUID();
      await supabase
        .from("match_queue")
        .update({ status: "matched", room_id: roomId })
        .eq("id", waiting.id);
      router.push(`/room/${roomId}`);
      return;
    }

    // Nobody waiting — add myself to the queue
    const { data: myRow, error } = await supabase
      .from("match_queue")
      .insert({ user_id: userId, language, status: "waiting" })
      .select()
      .single();

    if (error || !myRow) {
      setIsSearching(false);
      return;
    }

    setQueueId(myRow.id);

    // Subscribe to updates on my row — fires when someone matches me
    const channel = supabase
      .channel(`queue-${myRow.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "match_queue",
          filter: `id=eq.${myRow.id}`,
        },
        (payload) => {
          const row = payload.new as { status: string; room_id: string };
          if (row.status === "matched" && row.room_id) {
            router.push(`/room/${row.room_id}`);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Guard against race: check if we were already matched before subscribe finished
    const { data: check } = await supabase
      .from("match_queue")
      .select("status, room_id")
      .eq("id", myRow.id)
      .single();

    if (check?.status === "matched" && check.room_id) {
      router.push(`/room/${check.room_id}`);
    }
  };

  const handleCancel = async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (queueId) {
      await supabase.from("match_queue").delete().eq("id", queueId);
      setQueueId(null);
    }
    setIsSearching(false);
  };

  // Clean up realtime channel if the component unmounts mid-search
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const selectedLanguage = LANGUAGES.find((l) => l.code === language);

  if (isSearching) {
    return (
      <SearchingScreen
        languageLabel={selectedLanguage?.label ?? "your language"}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f0623] flex items-center justify-center">
      {/* Ambient background glow orbs */}
      <div
        aria-hidden="true"
        className="absolute -top-[15%] -left-[10%] w-[500px] h-[500px] rounded-full bg-pink-600/25 blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[20%] -right-[5%] w-[600px] h-[600px] rounded-full bg-purple-700/25 blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-[35%] right-[15%] w-[350px] h-[350px] rounded-full bg-blue-600/20 blur-[100px] pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16">
        <span
          className="text-7xl mb-6 select-none"
          role="img"
          aria-label="Globe"
        >
          🌍
        </span>

        <h1 className="text-7xl sm:text-8xl font-black text-white tracking-tight leading-none mb-4">
          Lingo
        </h1>

        <p className="text-xl sm:text-2xl font-semibold text-white/85 mb-3 leading-tight">
          Talk to the world.
        </p>
        <p className="text-base sm:text-lg text-white/50 mb-10 max-w-xs leading-relaxed">
          Live video chat with real-time translation — meet anyone, anywhere.
        </p>

        {/* Language picker */}
        <div className="mb-6 w-full max-w-xs">
          <label className="block text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">
            I speak
          </label>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-white/10 text-white font-semibold py-3.5 px-5 rounded-2xl border border-white/15 focus:outline-none focus:border-white/40 appearance-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#1a0a2e]">
                  {l.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 text-sm">
              ▾
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          type="button"
          onClick={handleStart}
          className="animate-pulse-glow bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-white text-2xl font-bold py-5 px-20 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer select-none"
        >
          Start
        </button>

        <p className="mt-8 text-white/30 text-sm font-medium tracking-wide">
          5 free minutes every day · No sign-up needed
        </p>
      </div>
    </main>
  );
}
