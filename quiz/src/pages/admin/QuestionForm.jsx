import { useState } from 'react'
import { fileToBase64 } from '../../utils/fileToBase64'

const emptyQuestion = {
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  points: 10,
  imageBase64: '',
  videoUrl: '',
  audioUrl: '',
}

export default function QuestionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyQuestion)
  const [imgError, setImgError] = useState('')
  const [saving, setSaving] = useState(false)

  const setOption = (i, val) => {
    const options = [...form.options]
    options[i] = val
    setForm({ ...form, options })
  }

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgError('')
    try {
      const base64 = await fileToBase64(file)
      setForm({ ...form, imageBase64: base64 })
    } catch (err) {
      setImgError(err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <label>Pertanyaan</label>
        <textarea
          required
          rows={3}
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
        />
      </div>

      <div className="grid-2" style={{ marginBottom: 12 }}>
        {['A', 'B', 'C', 'D'].map((letter, i) => (
          <div key={letter}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="radio"
                name="correct"
                style={{ width: 'auto' }}
                checked={form.correctIndex === i}
                onChange={() => setForm({ ...form, correctIndex: i })}
              />
              Opsi {letter} {form.correctIndex === i && <span className="badge badge-success">Benar</span>}
            </label>
            <input
              required
              value={form.options[i]}
              onChange={(e) => setOption(i, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label>Poin</label>
          <input
            type="number"
            min={1}
            required
            value={form.points}
            onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Lampiran gambar (opsional, maks 500KB)</label>
        <input type="file" accept="image/*" onChange={handleImage} />
        {imgError && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{imgError}</div>}
        {form.imageBase64 && (
          <div style={{ marginTop: 8 }}>
            <img src={form.imageBase64} alt="preview" style={{ maxWidth: 200, borderRadius: 8 }} />
            <button
              type="button"
              className="btn btn-ghost"
              style={{ display: 'block', color: 'var(--danger)' }}
              onClick={() => setForm({ ...form, imageBase64: '' })}
            >
              Hapus gambar
            </button>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div>
          <label>Link video (opsional)</label>
          <input
            placeholder="https://youtube.com/... atau link Drive"
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          />
        </div>
        <div>
          <label>Link audio (opsional)</label>
          <input
            placeholder="https://... file mp3"
            value={form.audioUrl}
            onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
          />
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: -8, marginBottom: 16 }}>
        Video/audio pakai link (bukan upload langsung) supaya nggak kena limit ukuran database gratis.
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" disabled={saving} type="submit">
          {saving ? 'Menyimpan…' : 'Simpan Soal'}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>Batal</button>
      </div>
    </form>
  )
}
