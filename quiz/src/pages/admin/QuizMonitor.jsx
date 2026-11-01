import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { exportResultsToExcel, exportResultsToPDF } from '../../utils/exportResults'

function statusInfo(attempt) {
  if (!attempt) return { label: 'Belum mulai', cls: 'badge-muted' }
  if (attempt.status === 'completed') return { label: 'Selesai', cls: 'badge-success' }
  return { label: 'Sedang mengerjakan', cls: 'badge-accent' }
}

export default function QuizMonitor() {
  const { quizId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [users, setUsers] = useState([])
  const [attempts, setAttempts] = useState([])

  useEffect(() => {
    getDoc(doc(db, 'quizzes', quizId)).then((snap) => setQuiz({ id: snap.id, ...snap.data() }))
  }, [quizId])

  useEffect(() => {
    // Participants = every active, non-admin account (Hades roles: admin / member)
    return onSnapshot(collection(db, 'users'), (snap) =>
      setUsers(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.role !== 'admin' && !u.disabled)
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      )
    )
  }, [])

  useEffect(() => {
    return onSnapshot(query(collection(db, 'attempts'), where('quizId', '==', quizId)), (snap) =>
      setAttempts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
  }, [quizId])

  const attemptByUser = new Map(attempts.map((a) => [a.userId, a]))
  const completed = attempts.filter((a) => a.status === 'completed')
  const avgScore = completed.length
    ? (completed.reduce((s, a) => s + a.scorePercent, 0) / completed.length).toFixed(1)
    : '-'

  return (
    <div>
      <Link to="/admin/quizzes" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>← Kembali ke daftar quiz</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginTop: 8, marginBottom: 4 }}>
        <h1 style={{ margin: 0 }}>{quiz?.title || 'Memuat…'}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => exportResultsToExcel(quiz?.title || 'quiz', users, attemptByUser)}>
            Export Excel
          </button>
          <button className="btn btn-outline" onClick={() => exportResultsToPDF(quiz?.title || 'quiz', users, attemptByUser)}>
            Export PDF
          </button>
        </div>
      </div>
      <div style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 20 }}>Progres & hasil pengerjaan</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: '14px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Sudah mengerjakan</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 600 }}>{completed.length}/{users.length}</div>
        </div>
        <div className="card" style={{ padding: '14px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Sedang mengerjakan</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 600 }}>
            {attempts.filter((a) => a.status === 'in_progress').length}
          </div>
        </div>
        <div className="card" style={{ padding: '14px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Rata-rata nilai</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 600 }}>{avgScore}</div>
        </div>
      </div>

      <div className="card table-scroll">
        <table>
          <thead>
            <tr><th>Nama</th><th>Status</th><th>Mulai</th><th>Selesai</th><th>Nilai</th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const attempt = attemptByUser.get(u.id)
              const info = statusInfo(attempt)
              return (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td><span className={`badge ${info.cls}`}>{info.label}</span></td>
                  <td className="mono">{attempt ? new Date(attempt.startTime).toLocaleTimeString('id-ID') : '-'}</td>
                  <td className="mono">{attempt?.endTime ? new Date(attempt.endTime).toLocaleTimeString('id-ID') : '-'}</td>
                  <td className="mono">{attempt?.status === 'completed' ? `${attempt.totalPoints}/${attempt.maxPoints} (${attempt.scorePercent}%)` : '-'}</td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: 24 }}>Belum ada pengguna terdaftar</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
