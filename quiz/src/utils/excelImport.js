import * as XLSX from 'xlsx'

// Expected columns (header row, case-insensitive):
// Soal | Opsi A | Opsi B | Opsi C | Opsi D | Jawaban Benar | Poin
// "Jawaban Benar" berisi A/B/C/D. "Poin" opsional (default 10).

const LETTER_TO_INDEX = { A: 0, B: 1, C: 2, D: 3 }

export function parseQuestionExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        const questions = []
        const errors = []

        rows.forEach((row, i) => {
          const rowNum = i + 2 // +1 header, +1 1-indexed
          const get = (key) => {
            const foundKey = Object.keys(row).find(
              (k) => k.trim().toLowerCase() === key.toLowerCase()
            )
            return foundKey ? String(row[foundKey]).trim() : ''
          }

          const text = get('Soal')
          const optA = get('Opsi A')
          const optB = get('Opsi B')
          const optC = get('Opsi C')
          const optD = get('Opsi D')
          const answerLetter = get('Jawaban Benar').toUpperCase()
          const poinRaw = get('Poin')

          if (!text && !optA && !optB && !optC && !optD) return // skip blank row

          if (!text || !optA || !optB || !optC || !optD) {
            errors.push(`Baris ${rowNum}: soal atau opsi ada yang kosong`)
            return
          }
          if (!(answerLetter in LETTER_TO_INDEX)) {
            errors.push(`Baris ${rowNum}: "Jawaban Benar" harus A/B/C/D, ditemukan "${answerLetter}"`)
            return
          }

          questions.push({
            text,
            options: [optA, optB, optC, optD],
            correctIndex: LETTER_TO_INDEX[answerLetter],
            points: poinRaw ? Number(poinRaw) || 10 : 10,
          })
        })

        resolve({ questions, errors })
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsBinaryString(file)
  })
}

export function downloadTemplate() {
  const wsData = [
    ['Soal', 'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', 'Jawaban Benar', 'Poin'],
    ['Contoh: IP address kelas A dimulai dari?', '1-126', '128-191', '192-223', '224-239', 'A', 10],
  ]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Soal')
  XLSX.writeFile(wb, 'template_soal_quiz.xlsx')
}
