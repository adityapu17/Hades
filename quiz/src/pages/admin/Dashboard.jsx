import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'

export default function Dashboard() {
  const [counts, setCounts] = useState({ users: 0, questions: 0, quizzes: 0, activeQuizzes: 0 })

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, 'users'), (s) => setCounts((c) => ({ ...c, users: s.docs.filter((d) => !d.data().disabled).length }))),
      onSnapshot(collection(db, 'questions'), (s) => setCounts((c) => ({ ...c, questions: s.size }))),
      onSnapshot(collection(db, 'quizzes'), (s) => {
        const now = Date.now()
        const active = s.docs.filter((d) => {
          const q = d.data()
          return q.status === 'published' && now >= q.openTime && now <= q.closeTime
        }).length
        setCounts((c) => ({ ...c, quizzes: s.size, activeQuizzes: active }))
      }),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  const cards = [
    { label: 'Total Pengguna', value: counts.users, href: '/#users' }, // managed in Hades
    { label: 'Soal di Bank Soal', value: counts.questions, to: '/admin/questions' },
    { label: 'Total Quiz', value: counts.quizzes, to: '/admin/quizzes' },
    { label: 'Quiz Sedang Aktif', value: counts.activeQuizzes, to: '/admin/quizzes' },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>Dashboard</h1>
      <div className="grid-4">
        {cards.map((c) => {
          const body = (
            <>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 6 }}>{c.label}</div>
              <div className="mono" style={{ fontSize: 32, fontWeight: 600, color: 'var(--brand-dark)' }}>{c.value}</div>
            </>
          )
          const style = { padding: 20, textDecoration: 'none' }
          return c.href ? (
            <a key={c.label} href={c.href} className="card" style={style}>{body}</a>
          ) : (
            <Link key={c.label} to={c.to} className="card" style={style}>{body}</Link>
          )
        })}
      </div>
    </div>
  )
}
