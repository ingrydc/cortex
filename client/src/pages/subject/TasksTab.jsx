import { useState, useEffect } from 'react'
import { useApi, useAction } from '@/hooks/useApi'
import { tasksService } from '@/services/tasks'
import { LoadingSpinner, ErrorMessage, EmptyState, Modal, FormField } from '@/components/ui'

const PRIORITY_OPTIONS = [
  { value: 'baixa', label: 'Baixa', color: '#38bdf8' },
  { value: 'media', label: 'Média', color: '#f5a623' },
  { value: 'alta', label: 'Alta', color: '#ff7070' },
]

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const formatDateForInput = (iso) => {
  if (!iso) return ''
  return new Date(iso).toISOString().split('T')[0]
}

export default function TasksTab({ subjectId }) {
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [draft, setDraft] = useState({ title: '', dueDate: '', priority: 'media', description: '' })
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)

  const { data: allTasks, loading, error, refetch } = useApi(() => tasksService.list({ subject: subjectId }), [subjectId])
  const { execute: execCreate } = useAction()
  const { execute: execUpdate } = useAction()
  const { execute: execDelete } = useAction()

  useEffect(() => {
    if (allTasks) {
      setTasks(allTasks)
    }
  }, [allTasks])

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.done
    if (filter === 'done') return task.done
    return true
  })

  const openTask = (task) => {
    setSelectedTask(task)
    setDraft({
      title: task.title || '',
      dueDate: formatDateForInput(task.dueDate),
      priority: task.priority || 'media',
      description: task.description || '',
    })
    setIsNew(false)
    setShowModal(true)
  }

  const newTask = () => {
    setSelectedTask(null)
    setDraft({ title: '', dueDate: '', priority: 'media', description: '' })
    setIsNew(true)
    setShowModal(true)
  }

  const handleCreate = async () => {
    if (!draft.title.trim()) return setSaving(true)
    try {
      await execCreate(() => tasksService.create({ ...draft, subject: subjectId, dueDate: draft.dueDate ? new Date(draft.dueDate) : null, }), () => {
        refetch();
        setShowModal(false)
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!draft.title.trim()) return setSaving(true)
    try {
      await execUpdate(() => tasksService.update(selectedTask._id, { ...draft, dueDate: draft.dueDate ? new Date(draft.dueDate) : null, }), () => {
        refetch();
        setShowModal(false)
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleDone = async (taskId, currentDone) => {
    try {
      await execUpdate(() => tasksService.update(taskId, { done: !currentDone }), () => refetch())
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err)
    }
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('Remover esta tarefa?')) return
    await execDelete(() => tasksService.remove(taskId), () => {
      refetch()
      if (selectedTask?._id === taskId) setShowModal(false)
    })
  }

  const getPriorityInfo = (priority) => {
    return PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1]
  }

  if (loading) return <LoadingSpinner message="Carregando tarefas..." />
  if (error) return <ErrorMessage message={error} onRetry={refetch} />

  return (
    <>
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[12px]" style={{ color: 'var(--text2)' }}>Filtrar:</span>
            {[
              { key: 'all', label: 'Todas' },
              { key: 'pending', label: '⏳ Pendentes' },
              { key: 'done', label: '✓ Concluídas' },
            ].map(f => (
              <button key={f.key} className="text-[12px] px-3 py-1.5 rounded transition-all" style={{ background: filter === f.key ? 'var(--accent)' : 'var(--surface2)', color: filter === f.key ? 'var(--accent-fg)' : 'var(--text2)', border: `1px solid ${filter === f.key ? 'var(--accent)' : 'var(--border)'}`, }} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <button className="btn-accent" onClick={newTask}>+ Nova tarefa</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!filteredTasks?.length ? (
            <EmptyState icon="✓" title="Nenhuma tarefa" description={filter === 'done' ? 'Nenhuma tarefa concluída ainda.' : 'Crie uma nova tarefa para começar.'} action={filter !== 'all' ? <button className="btn-ghost text-[12px]" onClick={() => setFilter('all')}>Ver todas</button> : undefined} />
          ) : (
            <div className="grid gap-2">
              {filteredTasks.map(task => {
                const priorityInfo = getPriorityInfo(task.priority)
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.done
                return (
                  <div key={task._id} className="cortex-card p-3.5 cursor-pointer group flex items-start gap-3 transition-all" style={{ opacity: task.done ? 0.6 : 1, background: task.done ? 'rgba(92,107,255,0.05)' : 'var(--surface)', }} onClick={() => openTask(task)}>
                    <button className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all mt-0.5" style={{ borderColor: task.done ? 'var(--accent)' : 'var(--border)', background: task.done ? 'var(--accent)' : 'transparent', color: task.done ? 'var(--accent-fg)' : 'transparent', }} onClick={e => { e.stopPropagation(); handleToggleDone(task._id, task.done) }}>
                      {task.done && '✓'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-[13px]" style={{ textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'var(--text2)' : 'var(--text)', }}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          {isOverdue && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,92,92,0.15)', color: '#ff7070' }}>
                              Atrasada
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${priorityInfo.color}33`, color: priorityInfo.color }}>
                            {priorityInfo.label}
                          </span>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-[12px] mb-2" style={{ color: 'var(--text2)' }}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text3)' }}>
                        {task.dueDate && (
                          <span>📅 {formatDate(task.dueDate)}</span>
                        )}
                        {task.doneAt && (
                          <span>✓ Concluída em {formatDate(task.doneAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button className="w-7 h-7 rounded flex items-center justify-center text-[11px] transition-all" style={{ color: '#ff7070', background: 'rgba(255,92,92,0.1)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,92,92,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,92,92,0.1)'} onClick={e => { e.stopPropagation(); handleDelete(task._id) }}>
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={isNew ? 'Nova tarefa' : 'Editar tarefa'}>
        <div className="flex flex-col gap-4">
          <FormField label="Título">
            <input className="cortex-input" value={draft.title} onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} placeholder="Título da tarefa..." />
          </FormField>
          <FormField label="Descrição (opcional)">
            <textarea className="cortex-input" value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} placeholder="Detalhes da tarefa..." rows={3} style={{ fontFamily: 'inherit' }} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data de entrega">
              <input className="cortex-input" type="date" value={draft.dueDate} onChange={e => setDraft(p => ({ ...p, dueDate: e.target.value }))} />
            </FormField>
            <FormField label="Prioridade">
              <select className="cortex-input" value={draft.priority} onChange={e => setDraft(p => ({ ...p, priority: e.target.value }))}>
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-accent" onClick={isNew ? handleCreate : handleUpdate} disabled={!draft.title.trim() || saving}> {saving ? 'Salvando...' : isNew ? 'Criar tarefa' : 'Atualizar'} </button>
          </div>
        </div>
      </Modal>
    </>
  )
}