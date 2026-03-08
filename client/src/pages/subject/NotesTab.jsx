import { useState, useRef, useEffect, useCallback } from 'react'
import { useApi, useAction } from '@/hooks/useApi'
import { subjectsService } from '@/services/subjects'
import { notesService } from '@/services/tasks'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/ui'

// ── Botões do toolbar ──
const TOOLBAR = [
  { cmd: 'bold',          icon: 'B',  title: 'Negrito',     style: { fontWeight: 700 } },
  { cmd: 'italic',        icon: 'I',  title: 'Itálico',     style: { fontStyle: 'italic' } },
  { cmd: 'underline',     icon: 'U',  title: 'Sublinhado',  style: { textDecoration: 'underline' } },
  { cmd: 'strikeThrough', icon: 'S',  title: 'Riscado',     style: { textDecoration: 'line-through' } },
  null, // separador
  { cmd: 'insertUnorderedList', icon: '•—', title: 'Lista' },
  { cmd: 'insertOrderedList',   icon: '1.', title: 'Lista numerada' },
  null,
  { cmd: 'formatBlock', value: 'h2',  icon: 'H2', title: 'Título' },
  { cmd: 'formatBlock', value: 'h3',  icon: 'H3', title: 'Subtítulo' },
  { cmd: 'formatBlock', value: 'p',   icon: '¶',  title: 'Parágrafo' },
  null,
  { cmd: 'removeFormat', icon: '✕',  title: 'Limpar formatação' },
]

function RichEditor({ value, onChange, placeholder = 'Comece a escrever...' }) {
  const ref = useRef(null)

  // Inicializa o conteúdo
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ''
    }
  }, [value])

  const exec = (cmd, val) => {
    document.execCommand(cmd, false, val || null)
    ref.current?.focus()
    onChange(ref.current?.innerHTML || '')
  }

  const handleInput = () => onChange(ref.current?.innerHTML || '')

  return (
    <div className="flex flex-col rounded-md overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
        {TOOLBAR.map((btn, i) =>
          btn === null ? (
            <div key={i} className="w-px h-4 mx-1" style={{ background: 'var(--border2)' }} />
          ) : (
            <button
              key={btn.cmd + (btn.value || '')}
              title={btn.title}
              onMouseDown={e => { e.preventDefault(); exec(btn.cmd, btn.value) }}
              className="w-7 h-7 rounded flex items-center justify-center text-[12px] font-mono transition-all"
              style={{ ...btn.style, color: 'var(--text2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface3)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)' }}
            >
              {btn.icon}
            </button>
          )
        )}
      </div>
      {/* Área editável */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[280px] p-4 outline-none text-[14px] leading-relaxed rich-editor"
        style={{ background: 'var(--surface)', color: 'var(--text)' }}
      />
    </div>
  )
}

export default function NotesTab({ subjectId }) {
  const [selected, setSelected] = useState(null) // nota selecionada para editar
  const [draft,    setDraft]    = useState({ title: '', content: '' })
  const [isNew,    setIsNew]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const saveTimerRef = useRef(null)

  const { data: notes, loading, error, refetch } =
    useApi(() => subjectsService.getNotes(subjectId), [subjectId])

  const { execute: execCreate } = useAction()
  const { execute: execUpdate } = useAction()
  const { execute: execDelete } = useAction()

  // ── Abrir nota ──
  const openNote = (note) => {
    setSelected(note)
    setDraft({ title: note.title, content: note.content || '' })
    setIsNew(false)
  }

  // ── Nova nota ──
  const newNote = () => {
    setSelected(null)
    setDraft({ title: '', content: '' })
    setIsNew(true)
  }

  // ── Auto-save com debounce (1.5s) ──
  const autoSave = useCallback((newDraft) => {
    if (!selected || isNew) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        await notesService.update(selected._id, newDraft)
        refetch()
      } finally {
        setSaving(false)
      }
    }, 1500)
  }, [selected, isNew, refetch])

  const handleDraftChange = (field, val) => {
    const next = { ...draft, [field]: val }
    setDraft(next)
    autoSave(next)
  }

  // ── Salvar nova nota ──
  const handleCreate = async () => {
    if (!draft.title.trim()) return
    setSaving(true)
    try {
      const created = await execCreate(
        () => subjectsService.createNote(subjectId, draft),
        (note) => { refetch(); openNote(note); setIsNew(false) }
      )
    } finally {
      setSaving(false)
    }
  }

  // ── Deletar nota ──
  const handleDelete = async (noteId) => {
    if (!window.confirm('Remover esta nota?')) return
    await execDelete(() => notesService.remove(noteId), () => {
      refetch()
      if (selected?._id === noteId) { setSelected(null); setIsNew(false) }
    })
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <LoadingSpinner message="Carregando notas..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  const hasEditor = isNew || !!selected

  return (
    <>
      {/* Estilos do editor */}
      <style>{`
        .rich-editor:empty:before {
          content: attr(data-placeholder);
          color: var(--text3);
          pointer-events: none;
        }
        .rich-editor h2 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 500; margin: 16px 0 8px; letter-spacing: -0.02em; }
        .rich-editor h3 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 500; margin: 12px 0 6px; }
        .rich-editor p  { margin: 6px 0; }
        .rich-editor ul { list-style: disc;    padding-left: 20px; margin: 6px 0; }
        .rich-editor ol { list-style: decimal; padding-left: 20px; margin: 6px 0; }
        .rich-editor li { margin: 3px 0; }
        .rich-editor strong { font-weight: 600; }
        .rich-editor em { font-style: italic; }
        .rich-editor u  { text-decoration: underline; }
      `}</style>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 h-full">

        {/* ── Lista de notas ── */}
        <div className="cortex-card flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="flex items-center justify-between px-3.5 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[13px] font-medium">Notas <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{notes?.length ?? 0}</span></span>
            <button className="text-[11px] font-medium px-2 py-1 rounded transition-all"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
              onClick={newNote}
            >+ Nova</button>
          </div>

          <div className="overflow-y-auto flex-1">
            {!notes?.length && !isNew ? (
              <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                <span className="text-2xl">📝</span>
                <p className="text-[12px]" style={{ color: 'var(--text2)' }}>Nenhuma nota ainda</p>
                <button className="btn-accent text-[12px] px-3 py-1.5" onClick={newNote}>Criar primeira nota</button>
              </div>
            ) : (
              <div className="p-1.5">
                {/* Item "nova nota" */}
                {isNew && (
                  <div className="px-3 py-2.5 rounded-sm mb-0.5"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <div className="text-[12.5px] font-medium" style={{ color: 'var(--text)' }}>
                      {draft.title || 'Nova nota'}
                    </div>
                    <div className="text-[10.5px] mt-0.5" style={{ color: 'var(--text3)' }}>Rascunho</div>
                  </div>
                )}
                {notes?.map(n => (
                  <div key={n._id}
                    className="group flex items-start gap-1.5 px-3 py-2.5 rounded-sm cursor-pointer transition-all mb-0.5"
                    style={{ background: selected?._id === n._id ? 'var(--surface2)' : 'transparent' }}
                    onMouseEnter={e => { if (selected?._id !== n._id) e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { if (selected?._id !== n._id) e.currentTarget.style.background = 'transparent' }}
                    onClick={() => openNote(n)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium truncate">{n.title}</div>
                      <div className="text-[10.5px] mt-0.5 truncate" style={{ color: 'var(--text3)' }}>
                        {formatDate(n.updatedAt)}
                      </div>
                    </div>
                    <button
                      className="text-[10px] opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded shrink-0 transition-opacity mt-0.5"
                      style={{ color: '#ff7070', background: 'rgba(255,92,92,0.1)' }}
                      onClick={e => { e.stopPropagation(); handleDelete(n._id) }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Editor ── */}
        {hasEditor ? (
          <div className="flex flex-col gap-3">
            {/* Título */}
            <input
              className="bg-transparent border-none outline-none font-display text-[26px] font-medium w-full"
              style={{ letterSpacing: '-0.03em', color: 'var(--text)' }}
              placeholder="Título da nota..."
              value={draft.title}
              onChange={e => handleDraftChange('title', e.target.value)}
            />

            {/* Status */}
            <div className="flex items-center gap-3">
              <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
                {isNew ? 'Rascunho — não salvo' : saving ? '⏳ Salvando...' : `✓ Salvo · ${formatDate(selected?.updatedAt)}`}
              </span>
              {selected?.tags?.length > 0 && selected.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                  {t}
                </span>
              ))}
            </div>

            {/* Editor rich text */}
            <RichEditor
              value={draft.content}
              onChange={val => handleDraftChange('content', val)}
              placeholder="Comece a escrever sua nota..."
            />

            {/* Botões */}
            {isNew && (
              <div className="flex gap-2 justify-end">
                <button className="btn-ghost" onClick={() => { setIsNew(false); setSelected(null) }}>Cancelar</button>
                <button className="btn-accent" onClick={handleCreate} disabled={!draft.title.trim() || saving}>
                  {saving ? 'Salvando...' : 'Salvar nota'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="text-4xl">📝</span>
            <p className="text-[14px] font-medium">Selecione uma nota para editar</p>
            <p className="text-[13px]" style={{ color: 'var(--text2)' }}>ou crie uma nova</p>
            <button className="btn-accent" onClick={newNote}>+ Nova nota</button>
          </div>
        )}
      </div>
    </>
  )
}
