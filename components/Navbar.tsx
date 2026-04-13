"use client";

export default function Navbar() {
  return (
    <nav className="h-14 bg-navy-900 border-b border-navy-600 flex items-center justify-between px-5 flex-shrink-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-navy-700 border border-navy-600">
          {/* Pin icon */}
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#22C55E"
            />
            <circle cx="12" cy="9" r="2.5" fill="white" />
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-lg leading-none tracking-wide">
            TIP
            <span className="text-slate-400">·</span>
            <span className="text-green-400">POV</span>
          </div>
          <div className="text-slate-400 text-[10px] leading-none mt-0.5">
            Report it. We&apos;ll sort it.
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Help */}
        <button className="w-8 h-8 rounded-full border border-navy-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-full border border-navy-600 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            3
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-navy-600">
          <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
          </div>
          <div className="text-sm leading-tight">
            <div className="text-white font-medium">Super Admin</div>
            <div className="text-slate-400 text-xs">Tip Off Admin</div>
          </div>
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </nav>
  );
}
