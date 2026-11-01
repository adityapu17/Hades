import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../firebase'
import QuizForm from './QuizForm'

function statusBadge(quiz) {
  const now = Date.now()
  if (quiz.status === 'draft') return <span className="badge badge-muted">Draft</span>
  if (now < quiz.openTime) return <span className="badge badge-accent">Terjadwal</span>
  if (now > quiz.closeTime) return <span className="badge badge-muted">Selesai</span>
  return <span className="badge badge-success">Aktif</span>
}

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'quizzes'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => setQuizzes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [])

  const handleSave = async (form) => {
    if (editing) {
      await updateDoc(doc(db, 'quizzes', editing.id), { ...form })
    } else {
      await addDoc(collection(db, 'quizzes'), { ...form, createdAt: Date.now() })
    }
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (quiz) => {
    if (!confirm(`Hapus quiz "${quiz.title}"?`)) return
    await deleteDoc(doc(db, 'quizzes', quiz.id))
  }

  const toggleStatus = async (quiz) => {
    await updateDoc(doc(db, 'quizzes', quiz.id), { status: quiz.status === 'published' ? 'draft' : 'published' })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1>Quiz</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>+ Buat Quiz</button>
      </div>

      {showForm && (
        <QuizForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null) }} />
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{quiz.title}</span>
                {statusBadge(quiz)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                {quiz.questionIds.length} soal · {quiz.durationMinutes} menit ·{' '}
                {new Date(quiz.openTime).toLocaleString('id-ID')} – {new Date(quiz.closeTime).toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Link className="btn btn-outline" to={`/admin/quizzes/${quiz.id}/monitor`}>Progres & Hasil</Link>
              <button className="btn btn-ghost" onClick={() => { setEditing(quiz); setShowForm(true) }}>Edit</button>
              <button className="btn btn-ghost" onClick={() => toggleStatus(quiz)}>
                {quiz.status === 'published' ? 'Jadikan Draft' : 'Terbitkan'}
              </button>
              <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(quiz)}>Hapus</button>
            </div>
          </div>
        ))}
        {quizzes.length === 0 && (
          <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--ink-soft)' }}>Belum ada quiz.</div>
        )}
      </div>
    </div>
  )
}
