import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { FormField } from '@/components/ui'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #5c6bff, #c8f560)',
  'linear-gradient(135deg, #ff5c5c, #ffb347)',
  'linear-gradient(135deg, #a855f7, #ec4899)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #10b981, #c8f560)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
]

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth()

  const [form, setForm] = useState({
    name:            user?.name    || '',
    course:          user?.course  || '',
    avatarColor:     user?.avatar  || AVATAR_COLORS[0],
  })
  const [passwords, setPasswords] = useState({
    current: '', newPass: '', confirm: '',
  })
  const [saving,      setSaving]      = useState(false)
  const [savingPass,  setSavingPass]  = useState(false)
  const [successMsg,  setSuccessMsg]  = useState('')
  const [errorMsg,    setErrorMsg]    = useState('')
  const [passError,   setPassError]   = useState('')
  const [passSuccess, setPassSuccess] = useState('')

  const initials = user?.name
    ?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'U'

  const handleSave = async () => {
    setErrorMsg(''); setSuccessMsg('')
    if (!form.name.trim()) { setErrorMsg('Nome obrigatório.'); return }
    setSaving(true)
    try {
      await updateProfile({ name: form.name, course: form.course, avatar: form.avatarColor })
      setSuccessMsg('Perfil atualizado com sucesso!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e) {
      setErrorMsg(e.response?.data?.message || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handlePassword = async () => {
    setPassError(''); setPassSuccess('')
    if (!passwords.current)           { setPassError('Digite a senha atual.');       return }
    if (passwords.newPass.length < 8) { setPassError('Nova senha: mínimo 8 chars.'); return }
    if (passwords.newPass !== passwords.confirm) { setPassError('Senhas não conferem.'); return }
    setSavingPass(true)
    try {
      await updateProfile({ currentPassword: passwords.current, newPassword: passwords.newPass })
      setPasswords({ current: '', newPass: '', confirm: '' })
      setPassSuccess('Senha alterada com sucesso!')
      setTimeout(() => setPassSuccess(''), 3000)
    } catch (e) {
      setPassError(e.response?.data?.message || 'Erro ao alterar senha.')
    } finally {
      setSavingPass(false)
    }
  }

  return (
    <div className="p-5 pb-24 md:pb-8 max-w-2xl mx-auto animate-fade-up">

      {/* ── Header ── */}
      <div className="mb-7">
        <h1 className="font-display text-[28px] font-medium" style={{ letterSpacing: '-0.03em' }}>
          Meu perfil
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text2)' }}>
          Gerencie suas informações pessoais e segurança.
        </p>
      </div>

      {/* ── Avatar + nome ── */}
      <div className="cortex-card p-5 mb-4">
        <h2 className="text-[14px] font-semibold mb-4">Informações pessoais</h2>

        {/* Avatar preview + seletor de cor */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0 transition-all duration-300"
            style={{ background: form.avatarColor, color: '#0d0e10' }}
          >
            {initials}
          </div>
          <div>
            <p className="text-[12px] mb-2" style={{ color: 'var(--text2)' }}>Cor do avatar</p>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map(color => (
                <button key={color}
                  onClick={() => setForm(p => ({ ...p, avatarColor: color }))}
                  className="w-6 h-6 rounded-full transition-all"
                  style={{
                    background: color,
                    outline: form.avatarColor === color ? '2px solid var(--text)' : 'none',
                    outlineOffset: 2,
                    transform: form.avatarColor === color ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <FormField label="Nome completo">
            <input className="cortex-input" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Seu nome"
            />
          </FormField>

          <FormField label="E-mail">
            <input className="cortex-input" value={user?.email || ''} disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
          </FormField>

          <FormField label="Curso">
            <input className="cortex-input" value={form.course}
              onChange={e => setForm(p => ({ ...p, course: e.target.value }))}
              placeholder="Ex: Tecnologia em Sistemas para Internet"
            />
          </FormField>
        </div>

        {errorMsg && (
          <div className="mt-3 px-3 py-2.5 rounded-sm text-[12.5px]"
            style={{ background: 'rgba(255,92,92,0.1)', color: '#ff7070', border: '1px solid rgba(255,92,92,0.2)' }}>
            ⚠ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-3 px-3 py-2.5 rounded-sm text-[12.5px]"
            style={{ background: 'rgba(200,245,96,0.1)', color: '#a0c830', border: '1px solid rgba(200,245,96,0.2)' }}>
            ✓ {successMsg}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button className="btn-accent" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      {/* ── Alterar senha ── */}
      <div className="cortex-card p-5 mb-4">
        <h2 className="text-[14px] font-semibold mb-4">Alterar senha</h2>
        <div className="flex flex-col gap-3">
          <FormField label="Senha atual">
            <input className="cortex-input" type="password" value={passwords.current}
              onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
              placeholder="••••••••"
            />
          </FormField>
          <FormField label="Nova senha">
            <input className="cortex-input" type="password" value={passwords.newPass}
              onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
            />
          </FormField>
          <FormField label="Confirmar nova senha">
            <input className="cortex-input" type="password" value={passwords.confirm}
              onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repita a nova senha"
            />
          </FormField>
        </div>

        {passError && (
          <div className="mt-3 px-3 py-2.5 rounded-sm text-[12.5px]"
            style={{ background: 'rgba(255,92,92,0.1)', color: '#ff7070', border: '1px solid rgba(255,92,92,0.2)' }}>
            ⚠ {passError}
          </div>
        )}
        {passSuccess && (
          <div className="mt-3 px-3 py-2.5 rounded-sm text-[12.5px]"
            style={{ background: 'rgba(200,245,96,0.1)', color: '#a0c830', border: '1px solid rgba(200,245,96,0.2)' }}>
            ✓ {passSuccess}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button className="btn-accent" onClick={handlePassword} disabled={savingPass}>
            {savingPass ? 'Alterando...' : 'Alterar senha'}
          </button>
        </div>
      </div>

      {/* ── Conta ── */}
      <div className="cortex-card p-5">
        <h2 className="text-[14px] font-semibold mb-1">Conta</h2>
        <p className="text-[12px] mb-4" style={{ color: 'var(--text2)' }}>
          Membro desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—'}
        </p>
        <button
          className="w-full py-2.5 rounded-sm text-[13px] font-medium transition-all"
          style={{ background: 'rgba(255,92,92,0.08)', color: '#ff7070', border: '1px solid rgba(255,92,92,0.15)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,92,92,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,92,92,0.08)'}
          onClick={logout}
        >
          Sair da conta →
        </button>
      </div>

    </div>
  )
}
