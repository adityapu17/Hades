import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { scoreAttempt } from '../../utils/scoring'

function scoreEmoji(scorePercent) {
  if (scorePercent > 92) return '🔥'
  if (scorePercent < 90) return '💪'
  return '👌'
}

export default function QuizResult() {
  const { quizId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    getDoc(doc(db, 'attempts', `${quizId}_${user.uid}`)).then((snap) => {
      if (!snap.exists() || snap.data().status !== 'completed') {
        navigate('/quiz')
        return
      }
      const data = snap.data()
      const result = scoreAttempt(data.snapshot, data.answers)
      setSummary({ ...data, ...result })
      setDetail(result.detail)
    })
  }, [quizId, user, navigate])

  if (!summary) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>Memuat hasil…</div>

  const wrongOnly = detail.filter((d) => !d.isCorrect)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="card" style={{ padding: 28, marginTop: 12, marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 6 }}>{summary.quizTitle}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div className="mono score-gradient-text" style={{ fontSize: 48, fontWeight: 700 }}>
            {summary.scorePercent}
          </div>
          <span className="score-emoji" aria-hidden="true">{scoreEmoji(summary.scorePercent)}</span>
        </div>
        <div style={{ color: 'var(--ink-soft)', marginBottom: 4 }}>
          {summary.totalPoints} dari {summary.maxPoints} poin
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          {detail.length - wrongOnly.length} benar · {wrongOnly.length} salah dari {detail.length} soal
        </div>
        <Link to="/quiz" className="btn btn-primary" style={{ marginTop: 18, textDecoration: 'none' }}>
          ← Kembali ke Halaman Awal
        </Link>
      </div>

      {wrongOnly.length > 0 ? (
        <>
          <h3 style={{ marginBottom: 12 }}>Evaluasi Jawaban yang Salah</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {wrongOnly.map((d, i) => (
              <div key={d.questionId} className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>{d.text}</div>
                {d.options.map((opt, oi) => {
                  const isYourAnswer = oi === d.selectedIndex
                  const isCorrectAnswer = oi === d.correctIndex
                  let style = { border: '1px solid var(--border)' }
                  if (isCorrectAnswer) style = { border: '2px solid var(--success)', background: 'var(--success-tint)' }
                  else if (isYourAnswer) style = { border: '2px solid var(--danger)', background: 'var(--danger-tint)' }
                  return (
                    <div key={oi} style={{ ...style, padding: '10px 12px', borderRadius: 8, marginBottom: 6, fontSize: 14 }}>
                      <b>{String.fromCharCode(65 + oi)}.</b> {opt}
                      {isCorrectAnswer && <span className="badge badge-success" style={{ marginLeft: 8 }}>Jawaban benar</span>}
                      {isYourAnswer && !isCorrectAnswer && <span className="badge badge-danger" style={{ marginLeft: 8 }}>Jawabanmu</span>}
                      {d.selectedIndex === null && isCorrectAnswer && <span className="badge badge-muted" style={{ marginLeft: 8 }}>Tidak dijawab</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--success)', fontWeight: 600 }}>
          Semua jawaban benar. Mantap!
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link to="/quiz" className="btn btn-outline" style={{ textDecoration: 'none' }}>
          ← Kembali ke Halaman Awal
        </Link>
      </div>
    </div>
  )
}
