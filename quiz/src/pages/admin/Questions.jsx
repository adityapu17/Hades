import { useEffect, useRef, useState } from 'react'
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
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { parseQuestionExcel, downloadTemplate } from '../../utils/excelImport'
import QuestionForm from './QuestionForm'

export default function Questions() {
  const [banks, setBanks] = useState([])
  const [bankId, setBankId] = useState('')
  const [questions, setQuestions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const q = query(collection(db, 'questionBanks'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setBanks(list)
      setBankId((current) => current || list[0]?.id || '')
    })
  }, [])

  useEffect(() => {
    if (!bankId) { setQuestions([]); return }
    // Filtered by bankId only (no orderBy combined) so it works without
    // needing to set up a Firestore composite index; sorted client-side instead.
    const q = query(collection(db, 'questions'), where('bankId', '==', bankId))
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      setQuestions(list)
    })
  }, [bankId])

  const handleSave = async (form) => {
    if (editing) {
      await updateDoc(doc(db, 'questions', editing.id), { ...form })
    } else {
      await addDoc(collection(db, 'questions'), { ...form, bankId, createdAt: Date.now() })
    }
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = async (q) => {
    if (!confirm('Hapus soal ini dari bank soal?')) return
    await deleteDoc(doc(db, 'questions', q.id))
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!bankId) {
      alert('Buat atau pilih bank soal dulu sebelum upload Excel.')
      e.target.value = ''
      return
    }
    setImporting(true)
    setImportResult(null)
    try {
      const { questions: parsed, errors } = await parseQuestionExcel(file)
      if (parsed.length > 0) {
        const batch = writeBatch(db)
        parsed.forEach((q) => {
          const ref = doc(collection(db, 'questions'))
          batch.set(ref, { ...q, bankId, imageBase64: '', videoUrl: '', audioUrl: '', createdAt: Date.now() })
        })
        await batch.commit()
      }
      setImportResult({ count: parsed.length, errors })
    } catch (err) {
      setImportResult({ count: 0, errors: [err.message] })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Bank Soal</h1>
          {banks.length > 0 && (
            <select value={bankId} onChange={(e) => setBankId(e.target.value)} style={{ marginTop: 8, maxWidth: 280 }}>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>
        {banks.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={downloadTemplate}>Unduh Template Excel</button>
            <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? 'Mengunggah…' : 'Upload Excel'}
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleFileChange} />
            <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
              + Tulis Soal
            </button>
          </div>
        )}
      </div>

      {banks.length === 0 && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>
          Belum ada bank soal. <Link to="/admin/banks" style={{ color: 'var(--brand)', fontWeight: 600 }}>Buat bank soal dulu</Link> sebelum menambahkan soal.
        </div>
      )}

      {importResult && (
        <div className="card" style={{ padding: 14, marginBottom: 20, borderColor: importResult.errors.length ? 'var(--danger)' : 'var(--success)' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {importResult.count} soal berhasil diimpor
          </div>
          {importResult.errors.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--danger)', fontSize: 13 }}>
              {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <QuestionForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {questions.map((q) => (
          <div key={q.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{q.text}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13, color: 'var(--ink-soft)' }}>
                {q.options.map((opt, i) => (
                  <span
                    key={i}
                    className={i === q.correctIndex ? 'badge badge-success' : 'badge badge-muted'}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 12, color: 'var(--ink-soft)' }}>
                <span>{q.points} poin</span>
                {q.imageBase64 && <span>📷 gambar</span>}
                {q.videoUrl && <span>🎬 video</span>}
                {q.audioUrl && <span>🎧 audio</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button className="btn btn-ghost" onClick={() => { setEditing(q); setShowForm(true) }}>Edit</button>
              <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(q)}>Hapus</button>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--ink-soft)' }}>
            Belum ada soal. Tulis manual atau upload lewat Excel.
          </div>
        )}
      </div>
    </div>
  )
}
