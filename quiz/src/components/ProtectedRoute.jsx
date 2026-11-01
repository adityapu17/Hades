import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const waiting = (text) => (
  <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>{text}</div>
)

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin, loading } = useAuth()

  // Not signed in: sign in on Hades (outside this app, so a plain redirect rather than a router <Navigate>)
  useEffect(() => {
    if (!loading && !user) window.location.replace('/#login')
  }, [loading, user])

  if (loading) return waiting('Memuat…')
  if (!user) return waiting('Mengalihkan ke halaman login…')
  if (requireAdmin && !isAdmin) return <Navigate to="/quiz" replace />

  return children
}
