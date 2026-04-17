"use client";

interface NavbarProps {
  userName?: string;
  onLogout?: () => void;
}

export default function Navbar({ userName = "User", onLogout }: NavbarProps) {
  // Initials from display name
  const initials = userName
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <nav className="h-14 bg-navy-900 border-b border-navy-600 flex items-center justify-between px-5 flex-shrink-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-navy-700 border border-navy-600">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#22C55E" />
            <circle cx="12" cy="9" r="2.5" fill="white" />
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-lg leading-none tracking-wide">
            TIP<span className="text-slate-400">·</span><span className="text-green-400">POV</span>
          </div>
          <div className="text-slate-400 text-[10px] leading-none mt-0.5">Report it. We&apos;ll sort it.</div>
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
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">3</span>
        </button>

        {/* User + logout */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-navy-600">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <span className="text-sm font-medium text-white">{userName}</span>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out"
              className="ml-1 w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
