import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { scoreAttempt } from '../../utils/scoring'
import Timer from '../../components/Timer'
import SubmitTransition from '../../components/SubmitTransition'

export default function QuizTaking() {
  const { quizId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const attemptId = `${quizId}_${user.uid}`
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({}) // questionId -> selectedIndex
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [writeDone, setWriteDone] = useState(false)
  const [animDone, setAnimDone] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'attempts', attemptId)).then((snap) => {
      if (!snap.exists()) {
        navigate('/quiz')
        return
      }
      const data = snap.data()
      if (data.status === 'completed') {
        alert('Kamu sudah mengerjakan Quiz ini. Tidak bisa mengerjakan ulang.')
        navigate(`/quiz/${quizId}/result`)
        return
      }
      setAttempt(data)
      const ansMap = {}
      ;(data.answers || []).forEach((a) => { ansMap[a.questionId] = a.selectedIndex })
      setAnswers(ansMap)
      setIndex(data.currentIndex || 0)
      setLoading(false)
    })
  }, [attemptId, navigate, quizId])

  const persistAnswers = useCallback((nextAnswers, nextIndex) => {
    const answersArray = Object.entries(nextAnswers).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex }))
    updateDoc(doc(db, 'attempts', attemptId), { answers: answersArray, currentIndex: nextIndex })
  }, [attemptId])

  const handleSelect = (questionId, optionIndex) => {
    const next = { ...answers, [questionId]: optionIndex }
    setAnswers(next)
    persistAnswers(next, index)
  }

  const goTo = (i) => {
    setIndex(i)
    persistAnswers(answers, i)
  }

  const finishQuiz = useCallback(async () => {
    setSubmitting(true)
    setShowTransition(true)
    const answersArray = Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex }))
    const result = scoreAttempt(attempt.snapshot, answersArray)
    await updateDoc(doc(db, 'attempts', attemptId), {
      answers: answersArray,
      status: 'completed',
      endTime: Date.now(),
      totalPoints: result.totalPoints,
      maxPoints: result.maxPoints,
      scorePercent: result.scorePercent,
    })
    setWriteDone(true)
  }, [answers, attempt, attemptId])

  // Navigate only once BOTH the score has been saved AND the closing-book
  // animation has finished playing, whichever takes longer.
  useEffect(() => {
    if (writeDone && animDone) {
      navigate(`/quiz/${quizId}/result`)
    }
  }, [writeDone, animDone, navigate, quizId])

  const handleFinishClick = () => {
    const unanswered = attempt.snapshot.length - Object.keys(answers).length
    const msg = unanswered > 0
      ? `Masih ada ${unanswered} soal belum dijawab. Yakin mau selesaikan quiz sekarang?`
      : 'Yakin mau selesaikan quiz? Jawaban tidak bisa diubah lagi setelah ini.'
    if (confirm(msg)) finishQuiz()
  }

  if (loading || !attempt) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>Memuat quiz…</div>
  }

  if (showTransition) {
    return <SubmitTransition onComplete={() => setAnimDone(true)} />
  }

  const questions = attempt.snapshot
  const q = questions[index]
  const selected = answers[q.id]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="display" style={{ fontSize: 20 }}>{attempt.quizTitle}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Soal {index + 1} dari {questions.length}</div>
        </div>
        <Timer endAt={attempt.endAt} onExpire={submitting ? undefined : finishQuiz} />
      </div>

      {/* progress dots */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            onClick={() => goTo(i)}
            className="mono"
            style={{
              width: 30, height: 30, borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: i === index ? '2px solid var(--brand)' : '1px solid var(--border)',
              background: answers[qq.id] !== undefined ? 'var(--brand-tint)' : '#fff',
              color: 'var(--ink)',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{q.text}</div>

        {q.imageBase64 && <img src={q.imageBase64} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 14 }} />}
        {q.videoUrl && (
          <div style={{ marginBottom: 14 }}>
            <a href={q.videoUrl} target="_blank" rel="noreferrer" className="btn btn-outline">▶ Buka video soal</a>
          </div>
        )}
        {q.audioUrl && (
          <audio controls src={q.audioUrl} style={{ width: '100%', marginBottom: 14 }} />
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {q.options.map((opt, i) => (
            <label
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 8,
                border: selected === i ? '2px solid var(--brand)' : '1px solid var(--border)',
                background: selected === i ? 'var(--brand-tint)' : '#fff',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                style={{ width: 'auto' }}
                checked={selected === i}
                onChange={() => handleSelect(q.id, i)}
              />
              <span style={{ fontWeight: 600 }}>{String.fromCharCode(65 + i)}.</span>
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-outline" disabled={index === 0} onClick={() => goTo(index - 1)}>← Sebelumnya</button>
        <button className="btn btn-danger" disabled={submitting} onClick={handleFinishClick}>Selesaikan Quiz</button>
        <button
          className="btn btn-outline"
          disabled={index === questions.length - 1}
          onClick={() => goTo(index + 1)}
        >
          Selanjutnya →
        </button>
      </div>
    </div>
  )
}
