import { useState, useEffect, useCallback } from 'react'

/**
 * Hook genérico para chamadas à API.
 *
 * @param {Function} fetcher   — função que retorna uma Promise (ex: () => semestersService.list())
 * @param {Array}    deps      — dependências que re-disparam o fetch (como useEffect)
 * @param {Object}   options   — { immediate: bool } — se false, não faz fetch automático
 *
 * Retorna: { data, loading, error, refetch }
 */
export function useApi(fetcher, deps = [], { immediate = true } = {}) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher()
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (immediate) execute()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute])

  return { data, loading, error, refetch: execute }
}

/**
 * Hook para ações (POST, PATCH, DELETE) — não faz fetch automático.
 * Retorna: { execute, loading, error }
 */
export function useAction() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (fn, onSuccess) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fn()
      if (onSuccess) onSuccess(res.data)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Algo deu errado.'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { execute, loading, error }
}
