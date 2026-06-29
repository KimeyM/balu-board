'use client'

type Props = {
  onAdd: () => void
}

export default function AddItemButton({ onAdd }: Props) {
  return (
    <div>
      <button
        onClick={() => onAdd()}
        title="Nueva nota"
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white/70 hover:text-white text-sm font-inter tracking-wide transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Nueva nota
      </button>
    </div>
  )
}
