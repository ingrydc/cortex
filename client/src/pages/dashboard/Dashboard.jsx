import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useApi, useAction } from '@/hooks/useApi'
import { semestersService } from '@/services/semesters'
import { subjectsService } from '@/services/subjects'
import { tasksService } from '@/services/tasks'
import { LoadingSpinner, ErrorMessage, EmptyState, Modal, FormField } from '@/components/ui'
import HoursTab from './HoursTab'

const SUBJECT_COLORS = ['#5c6bff','#c8f560','#ff8fab','#f5a623','#a78bfa','#38bdf8','#fb923c']
const CURRENT_YEAR   = new Date().getFullYear()

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeSemId,    setActiveSemId]    = useState(null)
  const [showNewSem,     setShowNewSem]     = useState(false)
  const [showNewSubject, setShowNewSubject] = useState(false)
  const [newSem,    setNewSem]    = useState({ year: CURRENT_YEAR, period: 1 })
  const [newSubject,setNewSubject]= useState({ name: '', professor: '', color: '#5c6bff' })
  const [semError,  setSemError]  = useState('')
  const [subjError, setSubjError] = useState('')
  const [activeTab,  setActiveTab]  = useState('semestre') // 'semestre' | 'horas'

  // ── Fetch ──
  const { data: semesters, loading: loadingSem, error: errorSem, refetch: refetchSem } =
    useApi(() => semestersService.list())

  const currentSemId = activeSemId || semesters?.[0]?._id
  const currentSem   = semesters?.find(s => s._id === currentSemId)

  const { data: subjects, loading: loadingSubj, error: errorSubj, refetch: refetchSubj } =
    useApi(() => subjectsService.list(currentSemId), [currentSemId], { immediate: !!currentSemId })

  const { data: tasks, loading: loadingTasks, refetch: refetchTasks } =
    useApi(() => tasksService.list({ done: false }))

  const { execute: execSem   } = useAction()
  const { execute: execSubj  } = useAction()
  const { execute: execToggle} = useAction()

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const avgProgress = subjects?.length
    ? Math.round(subjects.reduce((a, s) => a + (s.progress || 0), 0) / subjects.length)
    : null

  const stats = [
    { label: 'Disciplinas',     value: subjects?.length ?? '—', sub: currentSem?.name ?? '—',                        color: '#c8f560' },
    { label: 'Tarefas abertas', value: tasks?.length   ?? '—',  sub: `${tasks?.filter(t=>t.priority==='high').length??0} urgentes`, color: '#5c6bff' },
    { label: 'Semestres',       value: semesters?.length?? '—', sub: 'cadastrados',                                  color: '#f5a623' },
    { label: 'Progresso médio', value: avgProgress ?? '—', unit: avgProgress != null ? '%' : '', sub: 'do semestre', color: '#ff8fab' },
  ]

  // ── Criar semestre ──
  const handleCreateSem = async () => {
    setSemError('')
    if (!newSem.year) { setSemError('Informe o ano.'); return }
    try {
      await execSem(
        () => semestersService.create({
          name:   `${newSem.year}.${newSem.period}`,
          year:   Number(newSem.year),
          period: Number(newSem.period),
        }),
        (created) => {
          setShowNewSem(false)
          setNewSem({ year: CURRENT_YEAR, period: 1 })
          refetchSem()
          setActiveSemId(created._id)
        }
      )
    } catch (e) {
      setSemError(e.response?.data?.message || 'Erro ao criar semestre.')
    }
  }

  // ── Criar disciplina ──
  const handleCreateSubject = async () => {
    setSubjError('')
    if (!newSubject.name.trim()) { setSubjError('Nome obrigatório.'); return }
    if (!currentSemId) { setSubjError('Crie um semestre primeiro.'); return }
    try {
      await execSubj(
        () => subjectsService.create(currentSemId, newSubject),
        () => {
          setShowNewSubject(false)
          setNewSubject({ name: '', professor: '', color: '#5c6bff' })
          refetchSubj()
        }
      )
    } catch (e) {
      setSubjError(e.response?.data?.message || 'Erro ao criar disciplina.')
    }
  }

  const handleToggleTask = (task) =>
    execToggle(() => tasksService.update(task._id, { done: !task.done }), () => refetchTasks())

  if (loadingSem) return <LoadingSpinner message="Carregando..." />
  if (errorSem)   return <ErrorMessage message={errorSem} onRetry={refetchSem} />

  return (
    <div className="p-6 pb-24 md:pb-6 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] font-medium leading-tight" style={{ letterSpacing: '-0.03em' }}>
            {greeting()}, {user?.name?.split(' ')[0] ?? 'estudante'} 👋
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text2)' }}>
            {subjects?.length
              ? `${subjects.length} disciplina(s) · ${currentSem?.name}`
              : semesters?.length ? 'Adicione suas disciplinas' : 'Comece criando seu primeiro semestre'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setShowNewSem(true)}>+ Semestre</button>
          <button className="btn-accent" onClick={() => setShowNewSubject(true)}>+ Disciplina</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-5 p-1 rounded-md w-fit" style={{ background: 'var(--surface2)' }}>
        {[
          { key: 'semestre', label: '🏠 Semestre' },
          { key: 'horas',    label: '⏱ Horas Complementares' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="px-4 py-1.5 rounded-sm text-[13px] font-medium transition-all duration-150"
            style={activeTab === t.key
              ? { background: 'var(--surface)', color: 'var(--text)', boxShadow: '0 1px 6px rgba(0,0,0,0.15)' }
              : { color: 'var(--text2)' }
            }
          >{t.label}</button>
        ))}
      </div>

      {/* ── Aba: Horas Complementares ── */}
      {activeTab === 'horas' && <HoursTab />}

      {/* ── Aba: Semestre ── */}
      {activeTab === 'semestre' && <>

      {/* ── Empty state: sem semestre ── */}
      {!semesters?.length && (
        <div className="cortex-card p-10 flex flex-col items-center gap-4 text-center mb-6">
          <span className="text-5xl">🎓</span>
          <div>
            <p className="font-display text-[20px] font-medium mb-1">Nenhum semestre ainda</p>
            <p className="text-[13.5px]" style={{ color: 'var(--text2)' }}>
              Crie seu primeiro semestre para começar a organizar suas disciplinas.
            </p>
          </div>
          <button className="btn-accent" onClick={() => setShowNewSem(true)}>
            Criar primeiro semestre →
          </button>
        </div>
      )}

      {/* ── Seletor de semestre ── */}
      {semesters?.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {semesters.map(s => (
            <button key={s._id} onClick={() => setActiveSemId(s._id)}
              className="px-3 py-1.5 rounded-sm text-[12.5px] font-medium transition-all"
              style={s._id === currentSemId
                ? { background: 'var(--accent)', color: 'var(--accent-fg)' }
                : { background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }
              }
            >{s.name}</button>
          ))}
        </div>
      )}

      {/* ── Stats ── */}
      {!!semesters?.length && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map(s => (
            <div key={s.label} className="cortex-card p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: s.color }} />
              <div className="text-[10.5px] uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>{s.label}</div>
              <div className="font-display text-[30px] font-medium leading-none" style={{ letterSpacing: '-0.04em' }}>
                {s.value}<span className="text-sm">{s.unit}</span>
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--text2)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Content grid ── */}
      {!!semesters?.length && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">

          {/* Disciplinas */}
          <div className="cortex-card">
            <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[14px] font-medium">Disciplinas{currentSem ? ` — ${currentSem.name}` : ''}</span>
              <span className="text-[12px] font-medium cursor-pointer" style={{ color: 'var(--accent)' }}
                onClick={() => setShowNewSubject(true)}>+ Nova →</span>
            </div>
            {loadingSubj ? <LoadingSpinner /> : errorSubj ? <ErrorMessage message={errorSubj} onRetry={refetchSubj} /> :
             !subjects?.length ? (
              <EmptyState icon="📚" title="Nenhuma disciplina ainda"
                description="Adicione as disciplinas deste semestre."
                action={<button className="btn-accent" onClick={() => setShowNewSubject(true)}>+ Adicionar disciplina</button>}
              />
            ) : (
              <div className="p-1.5">
                {subjects.map(s => (
                  <div key={s._id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-all duration-150"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate(`/disciplina/${s._id}`)}
                  >
                    <div className="w-0.5 h-8 rounded-full shrink-0" style={{ background: s.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium truncate">{s.name}</div>
                      <div className="text-[11.5px]" style={{ color: 'var(--text2)' }}>{s.professor || 'Sem professor'}</div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[12px] font-semibold" style={{ color: s.color }}>{s.progress ?? 0}%</span>
                      <div className="w-14 h-0.5 rounded-full" style={{ background: 'var(--surface3)' }}>
                        <div className="h-full rounded-full" style={{ width: `${s.progress ?? 0}%`, background: s.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tarefas */}
          <div className="cortex-card">
            <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[14px] font-medium">Próximas tarefas</span>
              <span className="text-[12px] font-medium cursor-pointer" style={{ color: 'var(--accent)' }}
                onClick={() => navigate('/calendario')}>Ver calendário →</span>
            </div>
            {loadingTasks ? <LoadingSpinner /> : !tasks?.length ? (
              <EmptyState icon="✅" title="Tudo em dia!" description="Nenhuma tarefa pendente." />
            ) : (
              <div className="p-1.5">
                {tasks.slice(0, 6).map(t => (
                  <div key={t._id}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-sm cursor-pointer transition-all"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center text-[10px] cursor-pointer"
                      style={t.done
                        ? { background: 'var(--accent)', border: '1.5px solid var(--accent)', color: 'var(--accent-fg)' }
                        : { border: '1.5px solid var(--border2)' }
                      }
                      onClick={() => handleToggleTask(t)}
                    >{t.done && '✓'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] mb-0.5" style={t.done ? { textDecoration: 'line-through', color: 'var(--text3)' } : {}}>
                        {t.title}
                      </div>
                      <div className="text-[11px]" style={{ color: t.priority === 'high' && !t.done ? '#ff5c5c' : 'var(--text2)' }}>
                        {t.subject?.name ?? 'Sem disciplina'}
                        {t.dueDate ? ` · ${new Date(t.dueDate).toLocaleDateString('pt-BR')}` : ''}
                      </div>
                    </div>
                    {t.priority === 'high'   && !t.done && <span className="badge-red shrink-0">urgente</span>}
                    {t.priority === 'medium' && !t.done && <span className="badge-yellow shrink-0">médio</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      </> /* fim aba semestre */}

      {/* ── Modal: Novo semestre ── */}
      <Modal open={showNewSem} onClose={() => { setShowNewSem(false); setSemError('') }} title="Novo semestre">
        <div className="flex flex-col gap-4">
          {semError && (
            <div className="px-3 py-2.5 rounded-sm text-[12.5px]"
              style={{ background: 'rgba(255,92,92,0.1)', color: '#ff7070', border: '1px solid rgba(255,92,92,0.2)' }}>
              ⚠ {semError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Ano *">
              <input className="cortex-input" type="number" placeholder="2025"
                value={newSem.year}
                onChange={e => setNewSem(p => ({ ...p, year: e.target.value }))}
                min="2000" max="2099"
              />
            </FormField>
            <FormField label="Período *">
              <select className="cortex-input" value={newSem.period}
                onChange={e => setNewSem(p => ({ ...p, period: e.target.value }))}
                style={{ background: 'var(--surface2)' }}>
                <option value={1}>1º semestre</option>
                <option value={2}>2º semestre</option>
              </select>
            </FormField>
          </div>
          <div className="px-3 py-2.5 rounded-sm text-[12.5px]"
            style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
            Será criado como: <strong style={{ color: 'var(--text)' }}>{newSem.year}.{newSem.period}</strong>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button className="btn-ghost" onClick={() => { setShowNewSem(false); setSemError('') }}>Cancelar</button>
            <button className="btn-accent" onClick={handleCreateSem}>Criar semestre</button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Nova disciplina ── */}
      <Modal open={showNewSubject} onClose={() => { setShowNewSubject(false); setSubjError('') }} title="Nova disciplina">
        <div className="flex flex-col gap-4">
          {subjError && (
            <div className="px-3 py-2.5 rounded-sm text-[12.5px]"
              style={{ background: 'rgba(255,92,92,0.1)', color: '#ff7070', border: '1px solid rgba(255,92,92,0.2)' }}>
              ⚠ {subjError}
            </div>
          )}
          <FormField label="Nome *">
            <input className="cortex-input" placeholder="Ex: Engenharia de Software"
              value={newSubject.name}
              onChange={e => setNewSubject(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleCreateSubject()}
              autoFocus
            />
          </FormField>
          <FormField label="Professor">
            <input className="cortex-input" placeholder="Ex: Prof. Carvalho"
              value={newSubject.professor}
              onChange={e => setNewSubject(p => ({ ...p, professor: e.target.value }))}
            />
          </FormField>
          <FormField label="Cor">
            <div className="flex gap-2 flex-wrap">
              {SUBJECT_COLORS.map(c => (
                <button key={c} onClick={() => setNewSubject(p => ({ ...p, color: c }))}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{ background: c, outline: newSubject.color === c ? '3px solid var(--text)' : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
          </FormField>
          <div className="flex gap-2 justify-end pt-1">
            <button className="btn-ghost" onClick={() => { setShowNewSubject(false); setSubjError('') }}>Cancelar</button>
            <button className="btn-accent" onClick={handleCreateSubject}>Criar disciplina</button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
