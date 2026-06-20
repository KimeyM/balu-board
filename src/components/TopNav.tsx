export default function TopNav() {
  return (
    <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-7 py-5 pointer-events-none">
      <div className="flex items-center gap-2.5 pointer-events-auto select-none">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28" className="shrink-0 opacity-75">
          <path d="M245.2 134.289C294.12 73.9855 219.025 82.2174 208.126 76.763C204.296 74.849 200.528 56.3705 192.005 60.6375C178.88 67.2036 179.995 101.383 178.571 112.785C177.798 118.991 169.133 127.877 166.285 134.289C161.739 144.521 156.744 156.692 148.393 169.402C140.043 182.113 122.592 191.967 113.857 201.681C76.682 243.002 92.6204 291.579 133.435 322.992C174.716 354.764 347.131 342.906 298.399 269.769" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M225.903 162.283C238.018 206.627 220.627 252.936 220.627 296.357C220.627 301.354 230.543 296.532 235.401 297.425" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M162.667 208.879C172.419 210.315 181.319 217.474 188.222 224.166C222.582 257.481 178.688 279.87 176.257 291.647C175.708 294.311 187.035 296.145 189.31 296.389" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M211.536 62.994C218.161 56.7795 219.425 67.6568 220.627 73.6378" stroke="#F0EEE9" strokeOpacity="0.9" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 className="font-playfair text-[#F0EEE9] text-xl font-semibold tracking-wide opacity-80">
          Balu Board
        </h1>
      </div>

      <div className="pointer-events-auto">
        <a
          href="/api/auth/logout"
          title="Cerrar sesión"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#F0EEE9]/25 hover:text-[#F0EEE9]/65 hover:bg-white/5 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </a>
      </div>
    </header>
  )
}
