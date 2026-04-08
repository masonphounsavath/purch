import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthed, loading } = useAuth()

  if (loading) return null
  if (!isAuthed) return <Navigate to="/" replace />

  return <>{children}</>
}
