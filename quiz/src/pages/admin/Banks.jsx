import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../firebase'

export default function Banks() {
  const [banks, setBanks] = useState([])
  const [counts, setCounts] = useState({})
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'questionBanks'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, async (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setBanks(list)
      // count questions per bank
      const entries = await Promise.all(
        list.map(async (b) => {
          const qs = await getDocs(query(collection(db, 'questions'), where('bankId', '==', b.id)))
          return [b.id, qs.size]
        })
      )
      setCounts(Object.fromEntries(entries))
    })
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'questionBanks'), { name: name.trim(), createdAt: Date.now() })
      setName('')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (b) => {
    setEditingId(b.id)
    setEditingName(b.name)
  }

  const saveEdit = async () => {
    if (!editingName.trim()) return
    await updateDoc(doc(db, 'questionBanks', editingId), { name: editingName.trim() })
    setEditingId(null)
  }

  const handleDelete = async (b) => {
    const count = counts[b.id] || 0
    const msg = count > 0
      ? `Bank soal "${b.name}" masih punya ${count} soal di dalamnya. Soal-soal itu TIDAK akan ikut terhapus, tapi jadi tidak terkelompok. Lanjut hapus bank ini?`
      : `Hapus bank soal "${b.name}"?`
    if (!confirm(msg)) return
    await deleteDoc(doc(db, 'questionBanks', b.id))
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1>Bank Soal</h1>
        <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
          Kelompokkan soal ke dalam bank terpisah (misal per topik atau per batch), supaya tidak semua soal jadi satu lumbung besar.
        </div>
      </div>

      <form onSubmit={handleCreate} className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 8, maxWidth: 480 }}>
        <input
          placeholder="Nama bank soal baru, misal: Quiz Onboarding Batch 3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary" disabled={busy} type="submit" style={{ whiteSpace: 'nowrap' }}>
          + Buat Bank
        </button>
      </form>

      <div style={{ display: 'grid', gap: 10 }}>
        {banks.map((b) => (
          <div key={b.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {editingId === b.id ? (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                style={{ maxWidth: 300 }}
              />
            ) : (
              <div>
                <div style={{ fontWeight: 600 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{counts[b.id] || 0} soal</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 4 }}>
              {editingId === b.id ? (
                <>
                  <button className="btn btn-ghost" onClick={saveEdit}>Simpan</button>
                  <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Batal</button>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost" onClick={() => startEdit(b)}>Ganti Nama</button>
                  <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(b)}>Hapus</button>
                </>
              )}
            </div>
          </div>
        ))}
        {banks.length === 0 && (
          <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--ink-soft)' }}>
            Belum ada bank soal. Buat satu dulu di atas, misalnya "Bank Soal Umum".
          </div>
        )}
      </div>
    </div>
  )
}
