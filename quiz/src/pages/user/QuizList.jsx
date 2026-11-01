import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, doc, getDoc, onSnapshot, query, setDoc, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { buildAttemptSnapshot } from '../../utils/shuffle'

export default function QuizList() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [attempts, setAttempts] = useState({})
  const [startingId, setStartingId] = useState(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    return onSnapshot(collection(db, 'quizzes'), (snap) =>
      setQuizzes(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((q) => q.status === 'published'))
    )
  }, [])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'attempts'), where('userId', '==', user.uid))
    return onSnapshot(
      q,
      (snap) => {
        const mine = {}
        snap.docs.forEach((d) => {
          const data = d.data()
          mine[data.quizId] = { id: d.id, ...data }
        })
        setAttempts(mine)
      },
      (err) => console.error('Gagal memuat status attempt:', err)
    )
  }, [user])

  const handleStart = async (quiz) => {
    if (attempts[quiz.id]) {
      alert('Kamu sudah mengerjakan Quiz ini. Tidak bisa mengerjakan ulang.')
      return
    }
    setStartingId(quiz.id)
    try {
      const questionDocs = await Promise.all(
        quiz.questionIds.map((qid) => getDoc(doc(db, 'questions', qid)))
      )
      const questions = questionDocs.filter((d) => d.exists()).map((d) => ({ id: d.id, ...d.data() }))
      const snapshot = buildAttemptSnapshot(questions, {
        randomizeQuestions: quiz.randomizeQuestions,
        randomizeOptions: quiz.randomizeOptions,
      })
      const startTime = Date.now()
      const endAt = startTime + quiz.durationMinutes * 60000
      const attemptId = `${quiz.id}_${user.uid}`
      await setDoc(doc(db, 'attempts', attemptId), {
        quizId: quiz.id,
        quizTitle: quiz.title,
        userId: user.uid,
        userName: profile?.name || user.email,
        snapshot,
        answers: [],
        startTime,
        endAt,
        status: 'in_progress',
      })
      navigate(`/quiz/${quiz.id}/take`)
    } finally {
      setStartingId(null)
    }
  }

  const activeQuizzes = quizzes.filter((q) => now >= q.openTime && now <= q.closeTime)
  const upcomingQuizzes = quizzes.filter((q) => now < q.openTime)
  const endedQuizzes = quizzes.filter((q) => now > q.closeTime)

  const renderQuiz = (quiz) => {
    const attempt = attempts[quiz.id]
    const isActive = now >= quiz.openTime && now <= quiz.closeTime

    return (
      <div key={quiz.id} className="card" style={{ padding: 18, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{quiz.title}</div>
            {quiz.description && (
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 6 }}>{quiz.description}</div>
            )}
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              Durasi: <b>{quiz.durationMinutes} menit</b> · {quiz.questionIds.length} soal
              <br />
              Tersedia: {new Date(quiz.openTime).toLocaleString('id-ID')} – {new Date(quiz.closeTime).toLocaleString('id-ID')}
            </div>
          </div>
          <div>
            {attempt?.status === 'completed' && (
              <button className="btn btn-outline" onClick={() => navigate(`/quiz/${quiz.id}/result`)}>Lihat Hasil</button>
            )}
            {attempt?.status === 'in_progress' && (
              <button className="btn btn-primary" onClick={() => navigate(`/quiz/${quiz.id}/take`)}>Lanjutkan</button>
            )}
            {!attempt && isActive && (
              <button className="btn btn-primary" disabled={startingId === quiz.id} onClick={() => handleStart(quiz)}>
                {startingId === quiz.id ? 'Menyiapkan…' : 'Mulai'}
              </button>
            )}
            {!attempt && !isActive && <span className="badge badge-muted">Belum tersedia</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>Quiz Saya</h1>

      <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-soft)', marginBottom: 10 }}>
        Sedang Berlangsung
      </h3>
      {activeQuizzes.length === 0 && (
        <div className="card" style={{ padding: 20, color: 'var(--ink-soft)', marginBottom: 24 }}>Tidak ada quiz aktif saat ini.</div>
      )}
      {activeQuizzes.map(renderQuiz)}

      {upcomingQuizzes.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-soft)', margin: '24px 0 10px' }}>
            Akan Datang
          </h3>
          {upcomingQuizzes.map(renderQuiz)}
        </>
      )}

      {endedQuizzes.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-soft)', margin: '24px 0 10px' }}>
            Sudah Berakhir
          </h3>
          {endedQuizzes.map(renderQuiz)}
        </>
      )}
    </div>
  )
}
