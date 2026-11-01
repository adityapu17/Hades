import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function buildRows(users, attemptByUser) {
  return users.map((u) => {
    const attempt = attemptByUser.get(u.id)
    const status = !attempt ? 'Belum mulai' : attempt.status === 'completed' ? 'Selesai' : 'Sedang mengerjakan'
    return {
      nama: u.name,
      email: u.email,
      status,
      mulai: attempt ? new Date(attempt.startTime).toLocaleString('id-ID') : '-',
      selesai: attempt?.endTime ? new Date(attempt.endTime).toLocaleString('id-ID') : '-',
      poin: attempt?.status === 'completed' ? `${attempt.totalPoints}/${attempt.maxPoints}` : '-',
      nilai: attempt?.status === 'completed' ? `${attempt.scorePercent}%` : '-',
    }
  })
}

export function exportResultsToExcel(quizTitle, users, attemptByUser) {
  const rows = buildRows(users, attemptByUser)
  const wsData = [
    ['Nama', 'Email', 'Status', 'Mulai', 'Selesai', 'Poin', 'Nilai'],
    ...rows.map((r) => [r.nama, r.email, r.status, r.mulai, r.selesai, r.poin, r.nilai]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!cols'] = [{ wch: 22 }, { wch: 26 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 10 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Hasil Quiz')
  const safeName = quizTitle.replace(/[^a-z0-9]+/gi, '_').slice(0, 40)
  XLSX.writeFile(wb, `hasil_${safeName}.xlsx`)
}

export function exportResultsToPDF(quizTitle, users, attemptByUser) {
  const rows = buildRows(users, attemptByUser)
  const docPdf = new jsPDF({ orientation: 'landscape' })

  docPdf.setFontSize(14)
  docPdf.text(`Rekap Hasil Quiz: ${quizTitle}`, 14, 16)
  docPdf.setFontSize(9)
  docPdf.setTextColor(120)
  docPdf.text(`Diunduh: ${new Date().toLocaleString('id-ID')}`, 14, 22)

  autoTable(docPdf, {
    startY: 28,
    head: [['Nama', 'Email', 'Status', 'Mulai', 'Selesai', 'Poin', 'Nilai']],
    body: rows.map((r) => [r.nama, r.email, r.status, r.mulai, r.selesai, r.poin, r.nilai]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [44, 95, 92] },
  })

  const safeName = quizTitle.replace(/[^a-z0-9]+/gi, '_').slice(0, 40)
  docPdf.save(`hasil_${safeName}.pdf`)
}
