import { useState } from 'react'
import { useApi, useAction } from ‘@/hooks/useApi’
import { tasksService } from ‘@/services/tasks’
import { LoadingSpinner, ErrorMessage, EmptyState, Modal, FormField } from ‘@/components/ui’

const PRIORITY_META = {
high:   { label: ‘Urgente’, color: ‘#ff5c5c’, bg: ‘rgba(255,92,92,0.12)’  },
medium: { label: ‘Médio’,   color: ‘#f5a623’, bg: ‘rgba(245,166,35,0.12)’ },
low:    { label: ‘Baixa’,   color: ‘#9aa0b0’, bg: ‘rgba(154,160,176,0.12)’},
}

const EMPTY_FORM = { title: ‘’, dueDate: ‘’, priority: ‘medium’ }

function formatDate(iso) {
if (!iso) return ‘’
const d    = new Date(iso)
const now  = new Date()
const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
if (diff === 0)  return ‘Hoje’
if (diff === 1)  return ‘Amanhã’
if (diff < 0)   return `Atrasada ${Math.abs(diff)}d`
if (diff < 7)   return `Em ${diff}d`
return d.toLocaleDateString(‘pt-BR’, { day: ‘2-digit’, month: ‘short’ })
}

export default function TasksTab({ subjectId, subjectColor }) {
const [showForm, setShowForm] = useState(false)
const [form,     setForm]     = useState(EMPTY_FORM)
const [filter,   setFilter]   = useState(‘open’) // ‘open’ | ‘done’ | ‘all’
const [formError,setFormError]= useState(’’)

const { data: tasks, loading, error, refetch } =
useApi(() => tasksService.list({ subject: subjectId }), [subjectId])

const { execute: execCreate } = useAction()
const { execute: execToggle } = useAction()
const { execute: execDelete } = useAction()

const filtered = (tasks ?? []).filter(t => {
if (filter === ‘open’) return !t.done
if (filter === ‘done’) return t.done
return true
})

const openCount = (tasks ?? []).filter(t => !t.done).length
const doneCount = (tasks ?? []).filter(t =>  t.done).length

const handleCreate = async () => {
setFormError(’’)
if (!form.title.trim()) { setFormError(‘Título obrigatório.’); return }
try {
await execCreate(
() => tasksService.create({ …form, subject: subjectId }),
() => { setShowForm(false); setForm(EMPTY_FORM); refetch() }
)
} catch (e) {
setFormError(e.response?.data?.message || ‘Erro ao criar tarefa.’)
}
}

const handleToggle = (task) =>
execToggle(
() => tasksService.update(task._id, { done: !task.done }),
() => refetch()
)

const handleDelete = async (id) => {
if (!window.confirm(‘Remover esta tarefa?’)) return
await execDelete(() => tasksService.remove(id), () => refetch())
}

if (loading) return <LoadingSpinner message="Carregando tarefas..." />
if (error)   return <ErrorMessage message={error} onRetry={refetch} />

return (
<div className="animate-fade-up">

```
  {/* ── Header ── */}
  <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
    <div>
      <h2 className="font-display text-[22px] font-medium" style={{ letterSpacing: '-0.03em' }}>
        Tarefas
      </h2>
      <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text2)' }}>
        <span style={{ color: subjectColor ?? 'var(--accent)', fontWeight: 600 }}>{openCount}</span> abertas
        {doneCount > 0 && <span> · {doneCount} concluídas</span>}
      </p>
    </div>
    <button className="btn-accent" onClick={() => setShowForm(true)}>+ Nova tarefa</button>
  </div>

  {/* ── Filtros ── */}
  <div className="flex gap-1.5 mb-5">
    {[
      { key: 'open', label: `Abertas (${openCount})`  },
      { key: 'done', label: `Concluídas (${doneCount})` },
      { key: 'all',  label: 'Todas'                   },
    ].map(f => (
      <button key={f.key} onClick={() => setFilter(f.key)}
        className="px-3 py-1.5 rounded-sm text-[12px] font-medium transition-all"
        style={filter === f.key
          ? { background: subjectColor ?? 'var(--accent)', color: filter === f.key ? 'var(--accent-fg)' : 'var(--text)', opacity: 1 }
          : { background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }
        }
      >{f.label}</button>
    ))}
  </div>

  {/* ── Lista ── */}
  {!filtered.length ? (
    <EmptyState
      icon={filter === 'done' ? '✅' : '✓'}
      title={filter === 'done' ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa aberta'}
      description={filter === 'done' ? 'As tarefas concluídas aparecerão aqui.' : 'Adicione tarefas para esta disciplina.'}
      action={filter !== 'done' && <button className="btn-accent" onClick={() => setShowForm(true)}>+ Nova tarefa</button>}
    />
  ) : (
    <div className="cortex-card">
      {filtered.map((task, i) => {
        const p    = PRIORITY_META[task.priority] ?? PRIORITY_META.low
        const date = formatDate(task.dueDate)
        const late = task.dueDate && new Date(task.dueDate) < new Date() && !task.done
        return (
          <div key={task._id}
            className="flex items-start gap-3 px-4 py-3.5 group transition-all"
            style={{
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Checkbox */}
            <div
              className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center text-[10px] cursor-pointer transition-all"
              style={task.done
                ? { background: subjectColor ?? 'var(--accent)', border: `1.5px solid ${subjectColor ?? 'var(--accent)'}`, color: 'var(--accent-fg)' }
                : { border: '1.5px solid var(--border2)' }
              }
              onClick={() => handleToggle(task)}
            >{task.done && '✓'}</div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] mb-1"
                style={task.done ? { textDecoration: 'line-through', color: 'var(--text3)' } : {}}
              >{task.title}</div>
              <div className="flex items-center gap-2 flex-wrap">
                {date && (
                  <span className="text-[11px]"
                    style={{ color: late ? '#ff5c5c' : 'var(--text2)' }}>
                    {late ? '⚠ ' : ''}{date}
                  </span>
                )}
                {!task.done && (
                  <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: p.bg, color: p.color }}>
                    {p.label}
                  </span>
                )}
                {task.done && task.doneAt && (
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
                    Concluída em {new Date(task.doneAt).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>

            {/* Delete */}
            <button
              className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded shrink-0"
              style={{ color: '#ff7070', background: 'rgba(255,92,92,0.1)' }}
              onClick={() => handleDelete(task._id)}
            >✕</button>
          </div>
        )
      })}
    </div>
  )}

  {/* ── Modal: Nova tarefa ── */}
  <Modal open={showForm} onClose={() => { setShowForm(false); setFormError(''); setForm(EMPTY_FORM) }}
    title="Nova tarefa">
    <div className="flex flex-col gap-4">
      {formError && (
        <div className="px-3 py-2.5 rounded-sm text-[12.5px]"
          style={{ background: 'rgba(255,92,92,0.1)', color: '#ff7070', border: '1px solid rgba(255,92,92,0.2)' }}>
          ⚠ {formError}
        </div>
      )}

      <FormField label="Título *">
        <input className="cortex-input" placeholder="Ex: Entregar trabalho"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          autoFocus
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Data de entrega">
          <input className="cortex-input" type="date"
            value={form.dueDate}
            onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
            style={{ colorScheme: 'dark' }}
          />
        </FormField>
        <FormField label="Prioridade">
          <select className="cortex-input" value={form.priority}
            onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
            style={{ background: 'var(--surface2)' }}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </FormField>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button className="btn-ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>Cancelar</button>
        <button className="btn-accent" onClick={handleCreate}>Criar tarefa</button>
      </div>
    </div>
  </Modal>
</div>
```

)
}
