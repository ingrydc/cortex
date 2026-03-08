/* Componentes de UI reutilizáveis */

export function LoadingSpinner({ message = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--accent)' }}
      />
      <span className="text-[13px]" style={{ color: 'var(--text2)' }}>{message}</span>
    </div>
  )
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <span className="text-3xl">⚠️</span>
      <p className="text-[13.5px]" style={{ color: 'var(--text2)' }}>{message}</p>
      {onRetry && (
        <button className="btn-ghost text-sm" onClick={onRetry}>Tentar novamente</button>
      )}
    </div>
  )
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="text-4xl">{icon}</span>
      <div>
        <p className="text-[14px] font-medium mb-1">{title}</p>
        {description && (
          <p className="text-[13px]" style={{ color: 'var(--text2)' }}>{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-lg p-6 shadow-panel animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-[18px] font-medium" style={{ letterSpacing: '-0.02em' }}>
            {title}
          </h2>
          <button
            className="w-7 h-7 rounded-sm flex items-center justify-center text-sm"
            style={{ color: 'var(--text2)', background: 'var(--surface2)' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FormField({ label, children, error }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>{label}</label>
      {children}
      {error && <span className="text-[11px]" style={{ color: '#ff7070' }}>{error}</span>}
    </div>
  )
}
