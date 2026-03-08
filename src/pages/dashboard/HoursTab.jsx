import { useState } from 'react'
import { useApi, useAction } from '@/hooks/useApi'
import { hoursService } from '@/services/hours'
import { LoadingSpinner, ErrorMessage, Modal, FormField } from '@/components/ui'

// Cor por categoria
const CAT_COLOR = {
  'Ensino':                    '#5c6bff',
  'Pesquisa':                  '#c8f560',
  'Extensão':                  '#ff8fab',
  'Cultura e Arte':            '#a78bfa',
  'Esporte e Lazer':           '#38bdf8',
  'Representação Estudantil':  '#f5a623',
  'Atividades Profissionais':  '#fb923c',
  'Outras':                    '#9aa0b0',
}

const STATUS_META = {
  pending:  { label: 'Pendente',  color: '#f5a623', bg: 'rgba(245,166,35,0.12)'  },
  approved: { label: 'Aprovada',  color: '#c8f560', bg: 'rgba(200,245,96,0.12)'  },
  rejected: { label: 'Reprovada', color: '#ff5c5c', bg: 'rgba(255,92,92,0.12)'   },
}

const EMPTY_FORM = {
  title: '', category: 'Ensino', hours: '', date: '',
  institution: '', description: '', status: 'pending',
}

// ── Barra de progresso circular (SVG) ──
function CircleProgress({ percent, color, size = 56 }) {
  const r   = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * Math.min(percent, 100) / 100

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--surface3)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

// ── Card de categoria ──
function CategoryCard({ cat, onAddActivity }) {
  const color    = CAT_COLOR[cat.category] || '#9aa0b0'
  const percent  = cat.progress ?? (cat.totalHours > 0 ? 100 : 0)
  const hasGoal  = cat.goalHours != null
  const lastFive = cat.activities?.slice(0, 5) ?? []

  return (
    <div className="cortex-card overflow-hidden">
      {/* Topo colorido */}
      <div className="h-0.5 w-full" style={{ background: color }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{cat.category}</div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text2)' }}>
              <span style={{ color, fontWeight: 600 }}>{cat.totalHours}h</span>
              {hasGoal && <span> / {cat.goalHours}h</span>}
            </div>
          </div>

          {/* Progresso circular */}
          <div className="relative shrink-0">
            <CircleProgress percent={percent} color={color} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-semibold" style={{ color }}>
                {hasGoal ? `${percent}%` : `${cat.totalHours}h`}
              </span>
            </div>
          </div>
        </div>

        {/* Barra linear */}
        {hasGoal && (
          <div className="h-1 rounded-full mb-3" style={{ background: 'var(--surface3)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(percent, 100)}%`, background: color }}
            />
          </div>
        )}

        {/* Últimas atividades */}
        {lastFive.length > 0 && (
          <div className="flex flex-col gap-1 mb-3">
            {lastFive.map(a => {
              const s = STATUS_META[a.status] ?? STATUS_META.pending
              return (
                <div key={a._id} className="flex items-center gap-2 text-[11.5px]">
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="flex-1 truncate" style={{ color: 'var(--text2)' }}>{a.title}</span>
                  <span className="shrink-0 font-medium" style={{ color }}>{a.hours}h</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Botão adicionar */}
        <button
          className="w-full py-1.5 rounded-sm text-[12px] font-medium transition-all"
          style={{ background: color + '18', color, border: `1px solid ${color}30` }}
          onMouseEnter={e => e.currentTarget.style.background = color + '28'}
          onMouseLeave={e => e.currentTarget.style.background = color + '18'}
          onClick={() => onAddActivity(cat.category)}
        >
          + Registrar atividade
        </button>
      </div>
    </div>
  )
}

export default function HoursTab() {
  const [showForm,    setShowForm]    = useState(false)
  const [showGoals,   setShowGoals]   = useState(false)
  const [showList,    setShowList]    = useState(false)
  const [filterCat,   setFilterCat]  = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [formError,   setFormError]   = useState('')
  const [goalDraft,   setGoalDraft]   = useState({})

  const { data, loading, error, refetch } =
    useApi(() => hoursService.summary())

  const { execute: execCreate } = useAction()
  const { execute: execDelete } = useAction()
  const { execute: execGoals  } = useAction()

  const summary    = data?.summary    ?? []
  const all        = data?.all        ?? []
  const categories = data?.categories ?? []
  const grandTotal = data?.grandTotal ?? 0
  const totalGoal  = data?.totalGoal  ?? 0
  const overallPct = totalGoal > 0 ? Math.min(100, Math.round((grandTotal / totalGoal) * 100)) : null

  // ── Atividades para a lista ──
  const { data: activities, refetch: refetchList } =
    useApi(() => hoursService.listActivities(filterCat ? { category: filterCat } : {}), [filterCat, showList], { immediate: showList })

  // ── Criar atividade ──
  const handleCreate = async () => {
    setFormError('')
    if (!form.title.trim()) { setFormError('Título obrigatório.'); return }
    if (!form.hours || form.hours <= 0) { setFormError('Informe as horas.'); return }
    if (!form.date) { setFormError('Informe a data.'); return }

    try {
      await execCreate(() => hoursService.create({ ...form, hours: Number(form.hours) }), () => {
        setShowForm(false)
        setForm(EMPTY_FORM)
        refetch()
        if (showList) refetchList()
      })
    } catch (e) {
      setFormError(e.response?.data?.message || 'Erro ao registrar.')
    }
  }

  // ── Salvar metas ──
  const handleSaveGoals = async () => {
    const goals = Object.entries(goalDraft)
      .filter(([, v]) => v && Number(v) > 0)
      .map(([category, goal]) => ({ category, goal: Number(goal) }))

    await execGoals(() => hoursService.setGoals(goals), () => {
      setShowGoals(false)
      setGoalDraft({})
      refetch()
    })
  }

  // Abre form com categoria pré-selecionada
  const openFormWithCat = (cat) => {
    setForm({ ...EMPTY_FORM, category: cat })
    setShowForm(true)
  }

  if (loading) return <LoadingSpinner message="Carregando horas complementares..." />
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />

  // Categorias com algum dado (com goal ou com horas)
  const visibleCats = all.filter(c => c.totalHours > 0 || c.goalHours)
  const emptyCats   = visibleCats.length === 0

  return (
    <div className="animate-fade-up">

      {/* ── Header da aba ── */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-[22px] font-medium" style={{ letterSpacing: '-0.03em' }}>
              Horas Complementares
            </h2>
            {overallPct !== null && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(200,245,96,0.12)', color: '#a8d445' }}>
                {overallPct}% concluído
              </span>
            )}
          </div>
          <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text2)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{grandTotal}h</span> registradas
            {totalGoal > 0 && <span> de {totalGoal}h meta total</span>}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button className="btn-ghost text-[12.5px]" onClick={() => { setShowList(l => !l); setFilterCat(null) }}>
            {showList ? '📊 Visão geral' : '📋 Ver todas'}
          </button>
          <button className="btn-ghost text-[12.5px]" onClick={() => {
            // Inicializa o draft com as metas atuais
            const draft = {}
            all.forEach(c => { if (c.goalHours) draft[c.category] = c.goalHours })
            setGoalDraft(draft)
            setShowGoals(true)
          }}>
            🎯 Definir metas
          </button>
          <button className="btn-accent text-[12.5px]" onClick={() => setShowForm(true)}>
            + Registrar atividade
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {emptyCats && !showList && (
        <div className="cortex-card p-10 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">🎓</span>
          <div>
            <p className="font-display text-[18px] font-medium mb-1">Nenhuma hora registrada ainda</p>
            <p className="text-[13px]" style={{ color: 'var(--text2)' }}>
              Comece registrando suas atividades ou defina suas metas por categoria.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => { const d={}; setGoalDraft(d); setShowGoals(true) }}>
              🎯 Definir metas
            </button>
            <button className="btn-accent" onClick={() => setShowForm(true)}>
              + Registrar atividade
            </button>
          </div>
        </div>
      )}

      {/* ── Visão geral: cards por categoria ── */}
      {!showList && !emptyCats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCats.map(cat => (
            <CategoryCard key={cat.category} cat={cat} onAddActivity={openFormWithCat} />
          ))}

          {/* Card "+ Nova categoria" */}
          <div
            className="cortex-card p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[140px]"
            style={{ border: '1.5px dashed var(--border2)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onClick={() => {
              const d={}; all.forEach(c => { if (c.goalHours) d[c.category] = c.goalHours })
              setGoalDraft(d); setShowGoals(true)
            }}
          >
            <span className="text-2xl">+</span>
            <span className="text-[12.5px]" style={{ color: 'var(--text2)' }}>Adicionar categoria</span>
          </div>
        </div>
      )}

      {/* ── Lista de atividades ── */}
      {showList && (
        <div className="cortex-card">
          {/* Filtro por categoria */}
          <div className="flex gap-1.5 flex-wrap px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <button
              className="px-2.5 py-1 rounded-sm text-[11.5px] font-medium transition-all"
              style={!filterCat
                ? { background: 'var(--accent)', color: 'var(--accent-fg)' }
                : { background: 'var(--surface2)', color: 'var(--text2)' }}
              onClick={() => setFilterCat(null)}
            >Todas</button>
            {categories.map(cat => (
              <button key={cat}
                className="px-2.5 py-1 rounded-sm text-[11.5px] font-medium transition-all"
                style={filterCat === cat
                  ? { background: CAT_COLOR[cat] + '25', color: CAT_COLOR[cat], border: `1px solid ${CAT_COLOR[cat]}40` }
                  : { background: 'var(--surface2)', color: 'var(--text2)' }}
                onClick={() => setFilterCat(cat === filterCat ? null : cat)}
              >{cat}</button>
            ))}
          </div>

          {/* Tabela */}
          {!activities?.length ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <span className="text-2xl">📋</span>
              <p className="text-[13px]" style={{ color: 'var(--text2)' }}>Nenhuma atividade encontrada.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {activities.map(a => {
                const color = CAT_COLOR[a.category] || '#9aa0b0'
                const s     = STATUS_META[a.status]  ?? STATUS_META.pending
                return (
                  <div key={a._id} className="flex items-center gap-3 px-4 py-3 group transition-all"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="w-0.5 h-8 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{a.title}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--text2)' }}>
                        {a.category}
                        {a.institution ? ` · ${a.institution}` : ''}
                        {a.date ? ` · ${new Date(a.date).toLocaleDateString('pt-BR')}` : ''}
                      </div>
                    </div>
                    <span className="text-[12px] font-semibold shrink-0" style={{ color }}>{a.hours}h</span>
                    <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                    <button
                      className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded shrink-0"
                      style={{ color: '#ff7070', background: 'rgba(255,92,92,0.1)' }}
                      onClick={() => execDelete(() => hoursService.remove(a._id), () => { refetch(); refetchList() })}
                    >✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════ MODAL: Registrar atividade ══════ */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setFormError(''); setForm(EMPTY_FORM) }}
        title="Registrar atividade">
        <div className="flex flex-col gap-4">
          {formError && (
            <div className="px-3 py-2.5 rounded-sm text-[12.5px]"
              style={{ background: 'rgba(255,92,92,0.1)', color: '#ff7070', border: '1px solid rgba(255,92,92,0.2)' }}>
              ⚠ {formError}
            </div>
          )}

          <FormField label="Título da atividade *">
            <input className="cortex-input" placeholder="Ex: Monitoria de Cálculo"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Categoria *">
              <select className="cortex-input" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ background: 'var(--surface2)' }}>
                {(data?.categories ?? []).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Horas *">
              <input className="cortex-input" type="number" placeholder="Ex: 20" min="0.5" step="0.5"
                value={form.hours}
                onChange={e => setForm(p => ({ ...p, hours: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data *">
              <input className="cortex-input" type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                style={{ colorScheme: 'dark' }}
              />
            </FormField>
            <FormField label="Instituição">
              <input className="cortex-input" placeholder="Ex: UFSC"
                value={form.institution}
                onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Descrição">
            <textarea className="cortex-input resize-none" rows={2} placeholder="Descreva brevemente a atividade..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </FormField>

          <div className="flex gap-2 justify-end pt-1">
            <button className="btn-ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>Cancelar</button>
            <button className="btn-accent" onClick={handleCreate}>Registrar</button>
          </div>
        </div>
      </Modal>

      {/* ══════ MODAL: Definir metas ══════ */}
      <Modal open={showGoals} onClose={() => setShowGoals(false)} title="Definir metas por categoria">
        <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-[12.5px] mb-3" style={{ color: 'var(--text2)' }}>
            Defina quantas horas você precisa completar em cada categoria. Deixe em branco para não monitorar.
          </p>
          {(data?.categories ?? []).map(cat => {
            const color = CAT_COLOR[cat] || '#9aa0b0'
            return (
              <div key={cat} className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-[13px] flex-1">{cat}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    className="cortex-input text-right"
                    style={{ width: 72 }}
                    type="number" min="0" placeholder="—"
                    value={goalDraft[cat] ?? ''}
                    onChange={e => setGoalDraft(p => ({ ...p, [cat]: e.target.value }))}
                  />
                  <span className="text-[12px] shrink-0" style={{ color: 'var(--text3)' }}>h</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-2 justify-end pt-4">
          <button className="btn-ghost" onClick={() => setShowGoals(false)}>Cancelar</button>
          <button className="btn-accent" onClick={handleSaveGoals}>Salvar metas</button>
        </div>
      </Modal>

    </div>
  )
}
