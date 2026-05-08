export default function Home() {
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

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16">
        {/* Globe icon */}
        <span
          className="text-7xl mb-6 select-none"
          role="img"
          aria-label="Globe"
        >
          🌍
        </span>

        {/* Wordmark */}
        <h1 className="text-7xl sm:text-8xl font-black text-white tracking-tight leading-none mb-4">
          Lingo
        </h1>

        {/* Tagline */}
        <p className="text-xl sm:text-2xl font-semibold text-white/85 mb-3 leading-tight">
          Talk to the world.
        </p>
        <p className="text-base sm:text-lg text-white/50 mb-14 max-w-xs leading-relaxed">
          Live video chat with real-time translation — meet anyone, anywhere.
        </p>

        {/* Start button — the focal point */}
        <button
          type="button"
          className="animate-pulse-glow bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-white text-2xl font-bold py-5 px-20 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer select-none"
        >
          Start
        </button>

        {/* Subtext */}
        <p className="mt-8 text-white/30 text-sm font-medium tracking-wide">
          5 free minutes every day · No sign-up needed
        </p>
      </div>
    </main>
  );
}
