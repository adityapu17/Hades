import { Navigate, Route, HashRouter, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import Dashboard from './pages/admin/Dashboard'
import Banks from './pages/admin/Banks'
import Questions from './pages/admin/Questions'
import Quizzes from './pages/admin/Quizzes'
import QuizMonitor from './pages/admin/QuizMonitor'
import QuizList from './pages/user/QuizList'
import QuizTaking from './pages/user/QuizTaking'
import QuizResult from './pages/user/QuizResult'

function RootRedirect() {
  const { isAdmin } = useAuth()
  return <Navigate to={isAdmin ? '/admin' : '/quiz'} replace />
}

// HashRouter: this app lives under /quiz/ on the same host as Hades, and hash routes need no server rewrites
// (same style as Hades itself). Users are managed in Hades ("Kelola User"), logins happen on Hades.
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/banks" element={<ProtectedRoute requireAdmin><Layout><Banks /></Layout></ProtectedRoute>} />
          <Route path="/admin/questions" element={<ProtectedRoute requireAdmin><Layout><Questions /></Layout></ProtectedRoute>} />
          <Route path="/admin/quizzes" element={<ProtectedRoute requireAdmin><Layout><Quizzes /></Layout></ProtectedRoute>} />
          <Route path="/admin/quizzes/:quizId/monitor" element={<ProtectedRoute requireAdmin><Layout><QuizMonitor /></Layout></ProtectedRoute>} />

          {/* User */}
          <Route path="/quiz" element={<ProtectedRoute><Layout><QuizList /></Layout></ProtectedRoute>} />
          <Route path="/quiz/:quizId/take" element={<ProtectedRoute><QuizTaking /></ProtectedRoute>} />
          <Route path="/quiz/:quizId/result" element={<ProtectedRoute><Layout><QuizResult /></Layout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
