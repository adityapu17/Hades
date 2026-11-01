import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase'

function toLocalInputValue(ms) {
  if (!ms) return ''
  const d = new Date(ms - new Date().getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 16)
}
function fromLocalInputValue(str) {
  return str ? new Date(str).getTime() : null
}

const emptyForm = {
  title: '',
  description: '',
  questionIds: [],
  openTime: null,
  closeTime: null,
  durationMinutes: 30,
  randomizeQuestions: true,
  randomizeOptions: true,
  status: 'draft',
}

export default function QuizForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyForm)
  const [banks, setBanks] = useState([])
  const [filterBankId, setFilterBankId] = useState('all')
  const [allQuestions, setAllQuestions] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return onSnapshot(query(collection(db, 'questionBanks'), orderBy('createdAt', 'desc')), (snap) =>
      setBanks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
  }, [])

  useEffect(() => {
    return onSnapshot(collection(db, 'questions'), (snap) =>
      setAllQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
  }, [])

  const bankName = (id) => banks.find((b) => b.id === id)?.name || 'Tanpa bank'
  const visibleQuestions = filterBankId === 'all'
    ? allQuestions
    : allQuestions.filter((q) => q.bankId === filterBankId)

  const toggleQuestion = (id) => {
    const questionIds = form.questionIds.includes(id)
      ? form.questionIds.filter((x) => x !== id)
      : [...form.questionIds, id]
    setForm({ ...form, questionIds })
  }

  const handleSubmit = async (e, status) => {
    e.preventDefault()
    if (form.questionIds.length === 0) {
      alert('Pilih minimal 1 soal untuk quiz ini.')
      return
    }
    setSaving(true)
    try {
      await onSave({ ...form, status: status || form.status })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <label>Judul Quiz</label>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Deskripsi</label>
        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="grid-open-close-duration" style={{ marginBottom: 12 }}>
        <div>
          <label>Waktu Buka</label>
          <input
            type="datetime-local"
            required
            value={toLocalInputValue(form.openTime)}
            onChange={(e) => setForm({ ...form, openTime: fromLocalInputValue(e.target.value) })}
          />
        </div>
        <div>
          <label>Waktu Tutup</label>
          <input
            type="datetime-local"
            required
            value={toLocalInputValue(form.closeTime)}
            onChange={(e) => setForm({ ...form, closeTime: fromLocalInputValue(e.target.value) })}
          />
        </div>
        <div>
          <label>Durasi (menit)</label>
          <input
            type="number"
            min={1}
            required
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={form.randomizeQuestions}
            onChange={(e) => setForm({ ...form, randomizeQuestions: e.target.checked })}
          />
          Acak urutan soal
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={form.randomizeOptions}
            onChange={(e) => setForm({ ...form, randomizeOptions: e.target.checked })}
          />
          Acak urutan opsi A/B/C/D
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <label style={{ marginBottom: 0 }}>Pilih Soal ({form.questionIds.length} dipilih)</label>
        <select value={filterBankId} onChange={(e) => setFilterBankId(e.target.value)} style={{ maxWidth: 240 }}>
          <option value="all">Semua bank soal</option>
          {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="card" style={{ maxHeight: 260, overflow: 'auto', padding: 8, marginBottom: 16 }}>
        {visibleQuestions.map((q) => (
          <label key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 6px', borderBottom: '1px solid var(--border)' }}>
            <input
              type="checkbox"
              style={{ width: 'auto', marginTop: 3 }}
              checked={form.questionIds.includes(q.id)}
              onChange={() => toggleQuestion(q.id)}
            />
            <span style={{ fontSize: 13, fontWeight: 400 }}>
              {q.text} <span style={{ color: 'var(--ink-soft)' }}>({q.points} poin · {bankName(q.bankId)})</span>
            </span>
          </label>
        ))}
        {visibleQuestions.length === 0 && <div style={{ padding: 10, color: 'var(--ink-soft)', fontSize: 13 }}>Tidak ada soal di bank ini.</div>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline" disabled={saving} onClick={(e) => handleSubmit(e, 'draft')}>
          Simpan Draft
        </button>
        <button className="btn btn-primary" disabled={saving} onClick={(e) => handleSubmit(e, 'published')}>
          {saving ? 'Menyimpan…' : 'Terbitkan Quiz'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>
      </div>
    </form>
  )
}
