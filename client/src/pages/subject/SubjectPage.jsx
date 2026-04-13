import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi, useAction } from '@/hooks/useApi'
import { subjectsService } from '@/services/subjects'
import { materialsService } from '@/services/materials'
import { notesService } from '@/services/tasks'
import { LoadingSpinner, ErrorMessage, EmptyState, Modal, FormField } from '@/components/ui'
import NotesTab from './NotesTab'

const TYPE_META = {
  pdf:   { icon: '📄', bg: 'rgba(255,92,92,0.12)',   label: 'PDF'  },
  img:   { icon: '🖼',  bg: 'rgba(92,107,255,0.12)',  label: 'IMG'  },
  doc:   { icon: '📃',  bg: 'rgba(200,245,96,0.12)',  label: 'DOCX' },
  other: { icon: '📎',  bg: 'rgba(156,163,175,0.12)', label: 'FILE' },
}

const NAV_ITEMS = [
  { key: 'materials', icon: '📁', label: 'Materiais'    },
  { key: 'notes',     icon: '📝', label: 'Notas'        },
  { key: 'tasks',     icon: '✓',  label: 'Tarefas'      },
  { key: 'info',      icon: 'ℹ',  label: 'Informações'  },
]

export default function SubjectPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [activeNav,   setActiveNav]   = useState('materials')
  const [discOpen,    setDiscOpen]    = useState(false)
  const [showEdit,    setShowEdit]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [editForm,    setEditForm]    = useState({ name: '', professor: '', color: '' })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // ── Busca a disciplina pelo ID direto ──
  const { data: subject, loading: loadingSubj, error: errorSubj } =
    useApi(() => subjectsService.getOne(id), [id])

  // ── Busca materiais pelo ID da disciplina (sem precisar de semesterId) ──
  const { data: materials, loading: loadingMat, error: errorMat, refetch: refetchMat } =
    useApi(() => subjectsService.getMaterials(id), [id])

  const { execute: execDelete  } = useAction()
  const { execute: execSubject } = useAction()

  // ── Upload ──
  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('category', 'geral')
      await subjectsService.uploadMaterial(id, form)
      refetchMat()
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (matId) => {
    if (!window.confirm('Remover este material?')) return
    await execDelete(() => materialsService.remove(matId), () => refetchMat())
  }

  const handleEditOpen = () => {
    setEditForm({ name: subject?.name || '', professor: subject?.professor || '', color: subject?.color || '#5c6bff' })
    setShowEdit(true)
  }

  const handleEditSave = async () => {
    await execSubject(
      () => subjectsService.update(subject._id, editForm),
      () => { setShowEdit(false); window.location.reload() }
    )
  }

  const handleDeleteSubject = async () => {
    await execSubject(
      () => subjectsService.remove(subject._id),
      () => navigate('/dashboard')
    )
  }

  const categories = [...new Set(materials?.map(m => m.category) ?? [])]

  if (loadingSubj) return <LoadingSpinner message="Carregando disciplina..." />
  if (errorSubj)   return <ErrorMessage message={errorSubj} />

  return (
    <div className="flex h-full overflow-hidden">

      {discOpen && (
        <div className="fixed inset-0 bg-black/45 z-40 md:hidden" onClick={() => setDiscOpen(false)} />
      )}

      {/* ── Sidebar da disciplina ── */}
      <aside
        className={`flex flex-col shrink-0 py-3.5 z-50 transition-transform duration-300
          fixed md:relative inset-y-0 left-0
          ${discOpen ? 'translate-x-0 shadow-panel' : '-translate-x-full md:translate-x-0'}`}
        style={{ width: 214, background: 'var(--surface)', borderRight: '1px solid var(--border)', top: 48 }}
      >
        <button className="flex items-center gap-2 px-4 pb-3.5 text-[13px] transition-colors"
          style={{ color: 'var(--text2)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
          onClick={() => navigate('/dashboard')}
        >← Voltar</button>

        <div className="px-4 pb-4 border-b mb-2.5" style={{ borderColor: 'var(--border)' }}>
          <div className="w-7 h-0.5 rounded mb-2.5" style={{ background: subject?.color ?? '#5c6bff' }} />
          <div className="font-display text-[17px] font-medium mb-1" style={{ letterSpacing: '-0.02em' }}>
            {subject?.name ?? '—'}
          </div>
          <div className="text-[12px]" style={{ color: 'var(--text2)' }}>
            {subject?.professor || 'Sem professor'}
            {subject?.semester?.name ? ` · ${subject.semester.name}` : ''}
          </div>
          <div className="flex gap-1.5 mt-3">
            <button onClick={handleEditOpen}
              className="flex-1 py-1.5 rounded-sm text-[11.5px] font-medium transition-all"
              style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
            >✏ Editar</button>
            <button onClick={() => setShowConfirm(true)}
              className="flex-1 py-1.5 rounded-sm text-[11.5px] font-medium transition-all"
              style={{ background: 'rgba(255,92,92,0.08)', color: '#ff7070', border: '1px solid rgba(255,92,92,0.15)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,92,92,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,92,92,0.08)'}
            >🗑 Apagar</button>
          </div>
        </div>

        {NAV_ITEMS.map(item => (
          <div key={item.key}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] cursor-pointer transition-all ${activeNav === item.key ? 'font-medium' : ''}`}
            style={{ color: activeNav === item.key ? 'var(--text)' : 'var(--text2)', background: activeNav === item.key ? 'var(--surface2)' : 'transparent' }}
            onClick={() => { setActiveNav(item.key); setDiscOpen(false) }}
          >
            <span>{item.icon}</span>
            {item.label}
            {item.key === 'materials' && materials != null && (
              <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>
                {materials.length}
              </span>
            )}
          </div>
        ))}
      </aside>

      {/* ── Conteúdo ── */}
      <main className="flex-1 overflow-y-auto p-5 pb-24 md:pb-6 animate-fade-up">

        <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <button className="md:hidden w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onClick={() => setDiscOpen(true)}
            >☰</button>
            <div>
              <h1 className="font-display text-[24px] font-medium" style={{ letterSpacing: '-0.03em' }}>
                {NAV_ITEMS.find(n => n.key === activeNav)?.label}
              </h1>
              {activeNav === 'materials' && (
                <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text2)' }}>
                  {materials?.length ?? 0} arquivo(s)
                </p>
              )}
            </div>
          </div>
          {activeNav === 'materials' && (
            <>
              <button className="btn-accent" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? '⏳ Enviando...' : '+ Upload'}
              </button>
              <input ref={fileInputRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                onChange={handleUpload}
              />
            </>
          )}
        </div>

        {/* ── ABA: MATERIAIS ── */}
        {activeNav === 'materials' && (
          <>
            <div
              className="border-dashed border-2 rounded-md p-7 flex flex-col items-center gap-2 text-center cursor-pointer transition-all mb-6"
              style={{ borderColor: 'var(--border2)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(200,245,96,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'transparent' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-2xl">☁</span>
              <p className="text-[13px]" style={{ color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--accent)' }}>Arraste arquivos aqui</strong> ou clique para selecionar
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>PDF, DOCX, PNG, JPG — até 50MB</p>
            </div>

            {loadingMat ? <LoadingSpinner /> :
             errorMat   ? <ErrorMessage message={errorMat} onRetry={refetchMat} /> :
             !materials?.length ? (
              <EmptyState icon="📁" title="Nenhum material ainda"
                description="Faça upload do primeiro arquivo desta disciplina." />
            ) : (
              categories.map(cat => (
                <div key={cat} className="mb-6">
                  <div className="text-[10.5px] uppercase tracking-wider mb-3 capitalize" style={{ color: 'var(--text3)' }}>
                    {cat}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {materials.filter(m => m.category === cat).map(f => {
                      const meta = TYPE_META[f.type] ?? TYPE_META.other
                      return (
                        <div key={f._id}
                          className="cortex-card p-3.5 cursor-pointer flex flex-col gap-2 group transition-all duration-150"
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#5c6bff'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                          onClick={() => window.open(f.url, '_blank')}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="w-9 h-9 rounded-md flex items-center justify-center text-lg" style={{ background: meta.bg }}>
                              {meta.icon}
                            </div>
                            <button
                              className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded"
                              style={{ color: '#ff7070', background: 'rgba(255,92,92,0.1)' }}
                              onClick={e => { e.stopPropagation(); handleDelete(f._id) }}
                            >✕</button>
                          </div>
                          <div>
                            <div className="text-[12px] font-medium leading-snug mb-1 line-clamp-2">{f.name}</div>
                            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                              {meta.label} · {f.size ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : '—'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── ABA: NOTAS ── */}
        {activeNav === 'notes' && <NotesTab subjectId={id} />}

        {/* ── ABA: TAREFAS ── */}
        {activeNav === 'tasks' && (
          <EmptyState icon="✓" title="Tarefas desta disciplina"
            description="Gerencie as tarefas no Calendário."
            action={<button className="btn-ghost" onClick={() => navigate('/calendario')}>Ir para o calendário →</button>}
          />
        )}

        {/* ── ABA: INFORMAÇÕES ── */}
        {activeNav === 'info' && (
          <div className="cortex-card p-5 max-w-md">
            <h3 className="font-display text-[18px] font-medium mb-4" style={{ letterSpacing: '-0.02em' }}>
              Informações da disciplina
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Nome',      value: subject?.name },
                { label: 'Professor', value: subject?.professor || '—' },
                { label: 'Semestre',  value: subject?.semester?.name || '—' },
                { label: 'Progresso', value: `${subject?.progress ?? 0}%` },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[12px]" style={{ color: 'var(--text2)' }}>{r.label}</span>
                  <span className="text-[13px] font-medium">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal editar disciplina */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Editar disciplina">
        <div className="flex flex-col gap-4">
          <FormField label="Nome">
            <input className="cortex-input" value={editForm.name}
              onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
            />
          </FormField>
          <FormField label="Professor">
            <input className="cortex-input" value={editForm.professor}
              onChange={e => setEditForm(p => ({ ...p, professor: e.target.value }))}
              placeholder="Nome do professor"
            />
          </FormField>
          <FormField label="Cor">
            <div className="flex gap-2 flex-wrap">
              {['#5c6bff','#c8f560','#ff8fab','#f5a623','#a78bfa','#38bdf8','#fb923c'].map(c => (
                <button key={c} onClick={() => setEditForm(p => ({ ...p, color: c }))}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    background: c,
                    outline: editForm.color === c ? '2px solid var(--text)' : 'none',
                    outlineOffset: 2,
                    transform: editForm.color === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </FormField>
          <div className="flex gap-2 justify-end pt-1">
            <button className="btn-ghost" onClick={() => setShowEdit(false)}>Cancelar</button>
            <button className="btn-accent" onClick={handleEditSave}>Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar exclusão */}
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Apagar disciplina?">
        <div className="flex flex-col gap-4">
          <p className="text-[13px]" style={{ color: 'var(--text2)' }}>
            Tem certeza que deseja apagar <strong style={{ color: 'var(--text)' }}>{subject?.name}</strong>?
            Todos os materiais e notas serão perdidos.
          </p>
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost" onClick={() => setShowConfirm(false)}>Cancelar</button>
            <button className="py-2 px-4 rounded-sm text-[13px] font-medium transition-all"
              style={{ background: 'rgba(255,92,92,0.15)', color: '#ff7070' }}
              onClick={handleDeleteSubject}
            >Sim, apagar</button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
