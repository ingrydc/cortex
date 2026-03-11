import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

export default function LoginPage() {
  const [tab, setTab]           = useState('login') // 'login' | 'signup'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [surname, setSurname]   = useState('')
  const [course, setCourse]     = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [strength, setStrength] = useState(0)

  const canvasRef = useRef(null)
  const { login, register } = useAuth()
  const { theme, toggle }   = useTheme()
  const navigate            = useNavigate()

  // ── Neural canvas ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let nodes = [], animId

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      nodes = Array.from({ length: Math.floor((canvas.width * canvas.height) / 14000) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 2 + 1,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const dark = theme === 'dark'
      const nodeColor = dark ? 'rgba(200,245,96,' : 'rgba(74,90,232,'
      const lineColor = dark ? 'rgba(200,245,96,' : 'rgba(74,90,232,'

      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = nodeColor + '0.6)'
        ctx.fill()
      })

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < 140) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = lineColor + ((1 - d / 140) * 0.35) + ')'
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [theme])

  // ── Password strength ──
  const checkStrength = val => {
    let s = 0
    if (val.length >= 8) s++
    if (/[A-Z]/.test(val)) s++
    if (/[0-9]/.test(val)) s++
    if (/[^A-Za-z0-9]/.test(val)) s++
    setStrength(s)
  }

  const strengthColor = strength <= 1 ? '#ff5c5c' : strength <= 2 ? '#f5a623' : '#c8f560'
  const strengthLabel = strength <= 1 ? 'Fraca' : strength <= 2 ? 'Média' : 'Forte'

  // ── Handlers ──
  const handleLogin = async () => {
    setError(''); setSuccess('')
    if (!email || !password) { setError('Preencha todos os campos.'); return }
    setLoading(true)
    try {
      await login(email, password)
      setSuccess('Entrando no Cortex...')
      setTimeout(() => navigate('/dashboard'), 800)
    } catch {
      setError('E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    setError(''); setSuccess('')
    if (!name || !email || !password) { setError('Preencha todos os campos obrigatórios.'); return }
    if (password.length < 8) { setError('A senha precisa ter pelo menos 8 caracteres.'); return }
    setLoading(true)
    try {
      await register({ name: `${name} ${surname}`.trim(), email, password, course })
      setSuccess('Conta criada! Bem-vinda ao Cortex 🎉')
      setTimeout(() => navigate('/dashboard'), 1000)
    } catch {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = e => { if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleSignup() }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ══ PAINEL ESQUERDO — MARCA ══ */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: theme === 'dark' ? '#0f1114' : 'var(--bg2)' }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: theme === 'dark' ? 0.55 : 0.2 }} />

        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 30% 60%, rgba(200,245,96,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(92,107,255,0.06) 0%, transparent 50%)'
        }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--accent)' }} />
          <span className="font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
            cortex.
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h1 className="font-display font-light leading-tight mb-5"
            style={{ fontSize: 'clamp(36px, 4vw, 52px)', letterSpacing: '-0.03em', color: 'var(--text)' }}
          >
            Seu <em className="italic font-normal" style={{ color: 'var(--accent)' }}>segundo<br/>cérebro</em><br/>acadêmico.
          </h1>
          <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: 'var(--text2)' }}>
            Organize semestres, disciplinas, materiais e tarefas em um único lugar — feito para quem estuda de verdade.
          </p>

          {/* Features */}
          <div className="mt-10 flex flex-col gap-3">
            {[
              { icon: '📁', text: 'Materiais organizados por semestre e disciplina' },
              { icon: '📝', text: 'Notas ricas com editor integrado e tags' },
              { icon: '📅', text: 'Calendário inteligente de prazos e entregas' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-9 h-9 rounded-sm flex items-center justify-center text-base shrink-0"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                >
                  {f.icon}
                </div>
                <span className="text-[13.5px]" style={{ color: 'var(--text2)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-8 pt-7 border-t" style={{ borderColor: 'var(--border)' }}>
          {[
            { n: '2.4k', l: 'Estudantes' },
            { n: '18k',  l: 'Materiais salvos' },
            { n: '97%',  l: 'Satisfação' },
          ].map(s => (
            <div key={s.l}>
              <div className="font-display text-[28px] font-medium leading-none" style={{ letterSpacing: '-0.04em', color: 'var(--text)' }}>
                {s.n}
              </div>
              <div className="text-[11px] uppercase tracking-wider mt-1" style={{ color: 'var(--text3)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PAINEL DIREITO — FORMULÁRIO ══ */}
      <div
        className="flex flex-col justify-center w-full md:w-[460px] shrink-0 overflow-y-auto px-8 py-10 relative border-l"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Top row: tabs + toggle */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex flex-1 p-1 rounded-md" style={{ background: 'var(--surface2)' }}>
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className="flex-1 py-2 rounded-sm text-[13.5px] font-medium transition-all duration-150"
                style={tab === t
                  ? { background: 'var(--surface)', color: 'var(--text)', boxShadow: '0 1px 6px rgba(0,0,0,0.15)' }
                  : { color: 'var(--text2)' }
                }
              >
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-sm flex items-center justify-center text-base shrink-0 transition-all duration-150"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            title="Alternar tema"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>

        {/* Feedback */}
        {(error || success) && (
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-sm text-[12.5px] font-medium mb-5"
            style={error
              ? { background: 'rgba(255,92,92,0.12)', color: '#ff7070', border: '1px solid rgba(255,92,92,0.2)' }
              : { background: 'rgba(200,245,96,0.1)', color: '#a8d445', border: '1px solid rgba(200,245,96,0.2)' }
            }
          >
            {error ? '⚠' : '✓'} {error || success}
          </div>
        )}

        {tab === 'login' ? (
          /* ── LOGIN ── */
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[26px] font-medium mb-1" style={{ letterSpacing: '-0.03em' }}>
              Bem-vindo de volta.
            </h2>
            <p className="text-[13.5px] mb-7" style={{ color: 'var(--text2)' }}>
              Entre na sua conta Cortex para continuar.
            </p>

            <div className="flex flex-col gap-3.5">
              <Field label="E-mail institucional" icon="✉">
                <input
                  className="cortex-input pl-10"
                  type="email" placeholder="seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKey} autoComplete="email"
                />
              </Field>

              <Field label="Senha" icon="🔒" extra={
                <span className="text-xs font-medium cursor-pointer" style={{ color: 'var(--accent)' }}>
                  Esqueci minha senha
                </span>
              }>
                <input
                  className="cortex-input pl-10 pr-10"
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKey} autoComplete="current-password"
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-colors"
                  style={{ color: 'var(--text3)' }}
                  onClick={() => setShowPass(s => !s)}
                  type="button"
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </Field>

              <button
                className="btn-accent w-full justify-center py-3.5 text-sm font-semibold mt-1"
                onClick={handleLogin} disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar no Cortex'}
              </button>

              <Divider />
              <OAuthButtons />
              <Terms />
            </div>
          </div>
        ) : (
          /* ── SIGNUP ── */
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[26px] font-medium mb-1" style={{ letterSpacing: '-0.03em' }}>
              Criar sua conta.
            </h2>
            <p className="text-[13.5px] mb-7" style={{ color: 'var(--text2)' }}>
              Comece a organizar seus estudos com o Cortex.
            </p>

            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome" icon="👤">
                  <input className="cortex-input pl-10" type="text" placeholder="Maria"
                    value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" />
                </Field>
                <Field label="Sobrenome" icon="👤">
                  <input className="cortex-input pl-10" type="text" placeholder="Vieira"
                    value={surname} onChange={e => setSurname(e.target.value)} autoComplete="family-name" />
                </Field>
              </div>

              <Field label="E-mail institucional" icon="✉">
                <input className="cortex-input pl-10" type="email" placeholder="seu@universidade.br"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </Field>

              <Field label="Curso" icon="🎓">
                <input className="cortex-input pl-10" type="text" placeholder="Ex: Engenharia de Software"
                  value={course} onChange={e => setCourse(e.target.value)} />
              </Field>

              <Field label="Senha" icon="🔒">
                <input
                  className="cortex-input pl-10 pr-10"
                  type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => { setPassword(e.target.value); checkStrength(e.target.value) }}
                  onKeyDown={handleKey} autoComplete="new-password"
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--text3)' }}
                  onClick={() => setShowPass(s => !s)} type="button"
                >
                  {showPass ? '🙈' : '👁'}
                </button>
                {/* Strength bar */}
                {password && (
                  <div className="flex gap-1 mt-1.5">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-200"
                        style={{ background: i <= strength ? strengthColor : 'var(--border)' }}
                      />
                    ))}
                    <span className="text-[10px] ml-1" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </Field>

              <button
                className="btn-accent w-full justify-center py-3.5 text-sm font-semibold mt-1"
                onClick={handleSignup} disabled={loading}
              >
                {loading ? 'Criando conta...' : 'Criar conta no Cortex'}
              </button>

              <Divider />
              <OAuthButtons />
              <Terms />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-componentes ── */

function Field({ label, icon, extra, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>{label}</label>
        {extra}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text3)' }}>
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-[12px] my-1" style={{ color: 'var(--text3)' }}>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      ou continue com
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

function OAuthButtons() {
  const GoogleIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )

  const btnStyle = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className="flex gap-2.5">
      <button className="btn-ghost flex-1 justify-center gap-2" style={btnStyle}>
        <GoogleIcon /> Google
      </button>
    </div>
  )
}

function Terms() {
  return (
    <p className="text-center text-[11.5px] leading-relaxed mt-2" style={{ color: 'var(--text3)' }}>
      Ao continuar, você concorda com os{' '}
      <span className="cursor-pointer hover:text-[var(--accent)]" style={{ color: 'var(--text2)' }}>Termos de Uso</span>
      {' '}e{' '}
      <span className="cursor-pointer hover:text-[var(--accent)]" style={{ color: 'var(--text2)' }}>Política de Privacidade</span>
      {' '}do Cortex.
    </p>
  )
}
