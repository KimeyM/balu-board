'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import { uploadImage } from '@/lib/db'

type Props = {
  itemId: string
  initialContent: object | null
  accentColor: string
  onChange: (json: object) => void
}

// Tamaño del texto: normal (default ~14px) vs modo título (+2pt)
const TITLE_SIZE = '1.05rem'

const TEXT_COLORS = [
  { label: 'Default',  value: '' },
  { label: 'Rojo',     value: '#ef4444' },
  { label: 'Naranja',  value: '#f97316' },
  { label: 'Amarillo', value: '#eab308' },
  { label: 'Verde',    value: '#22c55e' },
  { label: 'Azul',     value: '#3b82f6' },
  { label: 'Violeta',  value: '#a855f7' },
]


export default function TiptapEditor({ initialContent, accentColor, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image.configure({ inline: false, allowBase64: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: initialContent ?? '',
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: { class: 'outline-none min-h-[120px] font-playfair' },
      handleKeyDown: (view, event) => {
        if (event.key === 'Tab') {
          event.preventDefault()
          view.dispatch(view.state.tr.insertText('    '))
          return true
        }
        return false
      },
    },
  })

  if (!editor) return null

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Try Supabase Storage; fall back to base64 for local dev
    let src = await uploadImage(file)
    if (!src) {
      src = await fileToBase64(file)
    }
    editor.chain().focus().setImage({ src }).run()
    e.target.value = ''
  }

  const handleAddLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL del link:', prev ?? 'https://')
    if (!url) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const currentColor = editor.getAttributes('textStyle').color as string | undefined
  const isTitle = editor.getAttributes('textStyle').fontSize === TITLE_SIZE

  const toggleTitle = () => {
    if (isTitle) editor.chain().focus().unsetFontSize().run()
    else editor.chain().focus().setFontSize(TITLE_SIZE).run()
  }

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">

      {/* ── Toolbar ────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-1 px-2 py-1.5 rounded-lg shrink-0"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >

        {/* Format */}
        <Btn active={editor.isActive('bold')}      onClick={() => editor.chain().focus().toggleBold().run()}      title="Negrita (Ctrl+B)" className="font-bold">B</Btn>
        <Btn active={editor.isActive('italic')}    onClick={() => editor.chain().focus().toggleItalic().run()}    title="Cursiva (Ctrl+I)" className="italic">I</Btn>
        <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado (Ctrl+U)" className="underline">U</Btn>
        <Btn active={editor.isActive('strike')}    onClick={() => editor.chain().focus().toggleStrike().run()}    title="Tachado" className="line-through">S</Btn>
        <Btn active={isTitle}                      onClick={toggleTitle}                                          title="Modo título (texto más grande)"><span className="text-[15px] font-semibold leading-none">A</span></Btn>

        <Sep />

        {/* Text color */}
        <div className="relative group">
          <button
            title="Color de texto"
            className="w-7 h-7 rounded flex flex-col items-center justify-center gap-0.5 hover:bg-zinc-700 transition-colors border border-transparent hover:border-zinc-600"
          >
            <span className="text-xs font-bold text-zinc-300 leading-none">A</span>
            <span className="w-4 h-1 rounded-sm" style={{ backgroundColor: currentColor ?? '#e4e4e7' }} />
          </button>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col rounded-xl shadow-xl p-1.5 z-20 min-w-[110px]" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => editor.chain().focus().setColor(accentColor).run()}
              className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              <span className="w-3 h-3 rounded-full shrink-0 border border-zinc-600" style={{ backgroundColor: accentColor }} />
              <span className="text-zinc-300">Color de la card</span>
            </button>
            <div className="h-px my-1 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            {TEXT_COLORS.map(c => (
              <button
                key={c.value || 'default'}
                onClick={() => c.value
                  ? editor.chain().focus().setColor(c.value).run()
                  : editor.chain().focus().unsetColor().run()
                }
                className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
              >
                <span className="w-3 h-3 rounded-full shrink-0 border border-zinc-600" style={{ backgroundColor: c.value || '#e4e4e7' }} />
                <span className="text-zinc-300">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lists */}
        <Btn active={editor.isActive('bulletList')}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title="Lista">•≡</Btn>
        <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">1≡</Btn>
        <Btn active={editor.isActive('taskList')}    onClick={() => editor.chain().focus().toggleTaskList().run()}    title="To-do list">☑</Btn>

        <Sep />

        {/* Link */}
        <Btn active={editor.isActive('link')} onClick={handleAddLink} title="Link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </Btn>

        {/* Image — label evita el conflicto con e.preventDefault() de Btn */}
        <label
          title="Insertar imagen"
          className="w-7 h-7 rounded flex items-center justify-center text-xs transition-colors border cursor-pointer hover:bg-white/10 border-transparent text-zinc-300 hover:border-white/20"
        >
          <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="m21 15-5-5L5 21"/>
          </svg>
        </label>

      </div>

      {/* ── Editor area ─────────────────────────────────── */}
      <div
        className="flex-1 min-h-0 p-4 overflow-auto rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <EditorContent editor={editor} />
      </div>

    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────── */

function Btn({
  active, onClick, children, title, className = '',
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
  className?: string
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }} // preventDefault keeps editor focus
      title={title}
      className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-all border
        ${active
          ? 'bg-white/20 border-white/40 text-white shadow-sm'
          : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/8 hover:border-white/15'
        } ${className}`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-5 bg-zinc-700 mx-0.5 shrink-0" />
}

/* ── Helpers ──────────────────────────────────────────────── */

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
