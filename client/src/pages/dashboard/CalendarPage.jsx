import { useState } from 'react'
import { useApi, useAction } from '@/hooks/useApi'
import { tasksService } from '@/services/tasks'
import { subjectsService } from '@/services/subjects'
import { semestersService } from '@/services/semesters'
import { LoadingSpinner, ErrorMessage, Modal, FormField } from '@/components/ui'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function buildCalendarDays(year, month) {
  const firstDay  = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const prevTotal = new Date(year, month, 0).getDate()
  const days = []

  for (let i = firstDay - 1; i >= 0; i--)
    days.push({ day: prevTotal - i, current: false })
  for (let d = 1; d <= totalDays; d++)
    days.push({ day: d, current: true })
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++)
    days.push({ day: d, current: false })

  return days
}

export default function CalendarPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year,  setYear]  = useState(now.getFullYear())
  const [showModal,  setShowModal]  = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [newTask,    setNewTask]    = useState({ title: '', dueDate: '', priority: 'medium', subject: '' })
  const [editTask,   setEditTask]   = useState(null)
  const [editForm,   setEditForm]   = useState({ title: '', dueDate: '', priority: 'medium', subject: '' })

  // ── Fetch: tarefas com dueDate ──
  const { data: tasks, loading, error, refetch } =
    useApi(() => tasksService.list())

  // ── Fetch: todas as disciplinas do usuário ──
  const { data: subjects } = useApi(() => subjectsService.listAll())

  const { execute: execCreate } = useAction()
  const { execute: execToggle } = useAction()
  const { execute: execDelete } = useAction()
  const { execute: execUpdate } = useAction()

  // ── Navegação de mês ──
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Parseia data sem bug de timezone (evita UTC shift)
  const parseLocalDate = (iso) => {
    const [y, m, d] = iso.substring(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  // ── Dias com evento neste mês/ano → Map de day -> [cores das disciplinas] ──
  const eventDayColors = {}
  ;(tasks ?? []).forEach(t => {
    if (!t.dueDate) return
    const d = parseLocalDate(t.dueDate)
    if (d.getMonth() !== month || d.getFullYear() !== year) return
    const day = d.getDate()
    if (!eventDayColors[day]) eventDayColors[day] = []
    const subj = subjects?.find(s => s._id === (t.subject?._id || t.subject))
    const color = subj?.color || '#5c6bff'
    if (!eventDayColors[day].includes(color)) eventDayColors[day].push(color)
  })
  const eventDays = new Set(Object.keys(eventDayColors).map(Number))

  // ── Tarefas dos próximos 30 dias ordenadas por data ──
  const upcoming = (tasks ?? [])
    .filter(t => t.dueDate && !t.done)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 8)

  // ── Tarefas do dia selecionado ──
  const selectedDayTasks = selectedDay
    ? (tasks ?? []).filter(t => {
        if (!t.dueDate) return false
        const d = parseLocalDate(t.dueDate)
        return d.getDate() === selectedDay.day &&
               d.getMonth() === month &&
               d.getFullYear() === year
      }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    : []

  // ── Criar tarefa ──
  const handleCreate = async () => {
    if (!newTask.title.trim()) return
    await execCreate(
      () => tasksService.create({
        title:    newTask.title,
        dueDate:  newTask.dueDate || undefined,
        priority: newTask.priority,
        subject:  newTask.subject || undefined,
      }),
      () => {
        setShowModal(false)
        setNewTask({ title: '', dueDate: '', priority: 'medium', subject: '' })
        refetch()
      }
    )
  }

  // ── Editar tarefa ──
  const openEditTask = (task, e) => {
    e?.stopPropagation()
    setEditTask(task)
    setEditForm({
      title:    task.title,
      dueDate:  task.dueDate ? task.dueDate.substring(0, 10) : '',
      priority: task.priority || 'medium',
      subject:  task.subject?._id || task.subject || '',
    })
  }

  const handleUpdateTask = async () => {
    if (!editForm.title.trim()) return
    await execUpdate(
      () => tasksService.update(editTask._id, editForm),
      () => { setEditTask(null); refetch() }
    )
  }

  // ── Toggle done ──
  const handleToggle = (task) =>
    execToggle(() => tasksService.update(task._id, { done: !task.done }), () => refetch())

  // ── Deletar ──
  const handleDelete = (id) =>
    execDelete(() => tasksService.remove(id), () => refetch())

  // ── Formatação de data legível ──
  const formatDate = (iso) => {
    if (!iso) return ''
    const d   = parseLocalDate(iso)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diff = Math.ceil((d - now) / 86400000)

    if (diff === 0)  return 'Hoje'
    if (diff === 1)  return 'Amanhã'
    if (diff === -1) return 'Ontem'
    if (diff < 0)    return `${Math.abs(diff)}d atrás`
    if (diff < 7)    return `Em ${diff}d`

    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const calDays = buildCalendarDays(year, month)
  const todayDay = now.getMonth() === month && now.getFullYear() === year ? now.getDate() : null

  return (
    <div className="p-5 pb-24 md:pb-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] font-medium leading-tight" style={{ letterSpacing: '-0.03em' }}>
            Calendário
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text2)' }}>
            {upcoming.length} evento(s) próximo(s)
          </p>
        </div>
        <button className="btn-accent" onClick={() => {
          if (selectedDay) setNewTask(p => ({ ...p, dueDate: selectedDay.dateStr }))
          setShowModal(true)
        }}>+ Nova tarefa</button>
      </div>

      {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} onRetry={refetch} /> : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">

          {/* ── CALENDÁRIO ── */}
          <div className="cortex-card">
            <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="font-display text-[17px] font-medium">
                {MONTHS_PT[month]} {year}
              </span>
              <div className="flex gap-1.5">
                {[{ arrow: '‹', fn: prevMonth }, { arrow: '›', fn: nextMonth }].map(({ arrow, fn }) => (
                  <button key={arrow} onClick={fn}
                    className="w-7 h-7 rounded-sm flex items-center justify-center text-sm transition-all"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}
                  >
                    {arrow}
                  </button>
                ))}
              </div>
            </div>

            {/* Cabeçalho dias */}
            <div className="grid grid-cols-7 px-2.5 pt-2.5">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-[10.5px] uppercase tracking-wider py-1" style={{ color: 'var(--text3)' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Dias */}
            <div className="grid grid-cols-7 gap-0.5 px-2.5 pb-2.5">
              {calDays.map((d, i) => {
                const isToday  = d.current && d.day === todayDay
                const hasEvent = d.current && eventDays.has(d.day)
                return (
                  <div key={i}
                    className="aspect-square flex flex-col items-center justify-center rounded-md cursor-pointer text-[13px] relative transition-all duration-150"
                    style={{
                      color:      isToday ? 'var(--accent-fg)' : !d.current ? 'var(--text3)' : 'var(--text)',
                      background: isToday ? 'var(--accent)' : selectedDay?.day === d.day && d.current ? 'var(--surface2)' : 'transparent',
                      fontWeight: isToday || (selectedDay?.day === d.day && d.current) ? 700 : 400,
                      opacity:    !d.current ? 0.35 : 1,
                      outline:    selectedDay?.day === d.day && d.current && !isToday ? '2px solid var(--accent)' : 'none',
                      outlineOffset: -2,
                    }}
                    onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = isToday ? 'var(--accent)' : 'transparent' }}
                    onClick={() => {
                      if (!d.current) return
                      const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`
                      setSelectedDay(prev => prev?.day === d.day ? null : { day: d.day, dateStr })
                    }}
                  >
                    {d.day}
                    {hasEvent && (
                      <div className="absolute bottom-0.5 flex gap-0.5 justify-center flex-wrap max-w-full px-0.5">
                        {(eventDayColors[d.day] || []).map((color, ci) => (
                          <span key={ci} className="w-1 h-1 rounded-full shrink-0"
                            style={{ background: isToday ? 'var(--accent-fg)' : color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── PRÓXIMOS EVENTOS ── */}
          <div className="cortex-card">
            <div className="px-4 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[14px] font-medium">
                {selectedDay
                  ? `${String(selectedDay.day).padStart(2,'0')}/${String(month+1).padStart(2,'0')}/${year}`
                  : 'Próximos eventos'}
              </span>
              {selectedDay && (
                <button className="text-[11px] px-2 py-1 rounded-sm transition-all"
                  style={{ color: 'var(--text3)', background: 'var(--surface2)' }}
                  onClick={() => setSelectedDay(null)}
                >✕ limpar</button>
              )}
            </div>

            {selectedDay ? (
              selectedDayTasks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
                  <span className="text-3xl">📭</span>
                  <p className="text-[13px]" style={{ color: 'var(--text2)' }}>Nenhuma tarefa neste dia</p>
                  <button className="btn-accent text-[12px] mt-1"
                    onClick={() => {
                      setNewTask(p => ({ ...p, dueDate: selectedDay.dateStr }))
                      setShowModal(true)
                    }}
                  >+ Criar tarefa</button>
                </div>
              ) : (
                <div className="p-1.5">
                  {selectedDayTasks.map(t => {
                    const subj = subjects?.find(s => s._id === (t.subject?._id || t.subject))
                    return (
                      <div key={t._id}
                        className="group px-3 py-3 rounded-sm cursor-pointer transition-all duration-150 mb-0.5"
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center text-[10px] transition-all cursor-pointer"
                            style={{ border: '1.5px solid var(--border2)', background: t.done ? 'var(--accent)' : 'transparent' }}
                            onClick={() => handleToggle(t)}
                          >{t.done && '✓'}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              {t.priority === 'high' && <span className="badge-red text-[9px] px-1.5 py-0">urgente</span>}
                              {t.priority === 'medium' && <span className="badge-yellow text-[9px] px-1.5 py-0">médio</span>}
                            </div>
                            <div className="text-[13px] font-medium truncate" style={t.done ? { textDecoration: 'line-through', color: 'var(--text3)' } : {}}>{t.title}</div>
                            {subj && (
                              <div className="flex items-center gap-1.5 mt-1 text-[11.5px]" style={{ color: 'var(--text2)' }}>
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: subj.color }} />
                                {subj.name}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0 mt-0.5">
                            <button className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center"
                              style={{ color: 'var(--text3)', background: 'var(--surface3)' }}
                              onClick={(e) => openEditTask(t, e)}
                            >✏</button>
                            <button className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center"
                              style={{ color: '#ff7070', background: 'rgba(255,92,92,0.1)' }}
                              onClick={() => handleDelete(t._id)}
                            >✕</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            ) : !upcoming.length ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
                <span className="text-3xl">🎉</span>
                <p className="text-[13px]" style={{ color: 'var(--text2)' }}>Nenhum evento próximo!</p>
              </div>
            ) : (
              <div className="p-1.5">
                {upcoming.map(t => {
                  const subj = subjects?.find(s => s._id === (t.subject?._id || t.subject))
                  return (
                    <div key={t._id}
                      className="group px-3 py-3 rounded-sm cursor-pointer transition-all duration-150 mb-0.5"
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="flex items-start gap-2">
                        {/* checkbox */}
                        <div
                          className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center text-[10px] transition-all cursor-pointer"
                          style={{ border: '1.5px solid var(--border2)' }}
                          onClick={() => handleToggle(t)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
                              {formatDate(t.dueDate)}
                            </span>
                            {t.priority === 'high' && (
                              <span className="badge-red text-[9px] px-1.5 py-0">urgente</span>
                            )}
                          </div>
                          <div className="text-[13px] font-medium truncate">{t.title}</div>
                          {subj && (
                            <div className="flex items-center gap-1.5 mt-1 text-[11.5px]" style={{ color: 'var(--text2)' }}>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: subj.color }} />
                              {subj.name}
                            </div>
                          )}
                        </div>
                        {/* ações */}
                        <div className="flex gap-1 shrink-0 mt-0.5">
                          <button className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center"
                            style={{ color: 'var(--text3)', background: 'var(--surface3)' }}
                            onClick={(e) => openEditTask(t, e)}
                          >✏</button>
                          <button className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center"
                            style={{ color: '#ff7070', background: 'rgba(255,92,92,0.1)' }}
                            onClick={() => handleDelete(t._id)}
                          >✕</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── MODAL NOVA TAREFA ── */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setNewTask({ title: '', dueDate: '', priority: 'medium', subject: '' }) }} title="Nova tarefa">
        <div className="flex flex-col gap-4">

          <FormField label="Título *">
            <input className="cortex-input" placeholder="Ex: Entrega do trabalho de ES"
              value={newTask.title}
              onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </FormField>

          <FormField label="Data de entrega">
            <input className="cortex-input" type="date"
              value={newTask.dueDate}
              onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
              style={{ colorScheme: 'dark' }}
            />
          </FormField>

          <FormField label="Prioridade">
            <div className="flex gap-2">
              {[
                { value: 'low',    label: 'Baixa',  color: '#a8d445' },
                { value: 'medium', label: 'Média',  color: '#f5a623' },
                { value: 'high',   label: 'Alta',   color: '#ff5c5c' },
              ].map(p => (
                <button key={p.value}
                  onClick={() => setNewTask(t => ({ ...t, priority: p.value }))}
                  className="flex-1 py-2 rounded-sm text-[12.5px] font-medium transition-all border"
                  style={newTask.priority === p.value
                    ? { background: p.color + '20', color: p.color, borderColor: p.color }
                    : { background: 'var(--surface2)', color: 'var(--text2)', borderColor: 'var(--border)' }
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </FormField>

          {subjects?.length > 0 && (
            <FormField label="Disciplina (opcional)">
              <select className="cortex-input"
                value={newTask.subject}
                onChange={e => setNewTask(p => ({ ...p, subject: e.target.value }))}
                style={{ background: 'var(--surface2)' }}
              >
                <option value="">Sem disciplina</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </FormField>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-accent" onClick={handleCreate}>Criar tarefa</button>
          </div>
        </div>
      </Modal>


      {/* ── Modal: Editar tarefa ── */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="Editar tarefa">
        <div className="flex flex-col gap-4">
          <FormField label="Título *">
            <input className="cortex-input" value={editForm.title}
              onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleUpdateTask()}
              autoFocus
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data">
              <input className="cortex-input" type="date" value={editForm.dueDate}
                onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))}
                style={{ colorScheme: 'dark' }}
              />
            </FormField>
            <FormField label="Prioridade">
              <select className="cortex-input" value={editForm.priority}
                onChange={e => setEditForm(p => ({ ...p, priority: e.target.value }))}
                style={{ background: 'var(--surface2)' }}>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </FormField>
          </div>
          {subjects?.length > 0 && (
            <FormField label="Disciplina">
              <select className="cortex-input" value={editForm.subject}
                onChange={e => setEditForm(p => ({ ...p, subject: e.target.value }))}
                style={{ background: 'var(--surface2)' }}>
                <option value="">Sem disciplina</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </FormField>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <button className="btn-ghost" onClick={() => setEditTask(null)}>Cancelar</button>
            <button className="btn-accent" onClick={handleUpdateTask}>Salvar</button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
