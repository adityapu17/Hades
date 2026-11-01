// Converts an image file to base64 data URL. Capped at 500KB to stay within
// Firestore's 1MB document limit (matches the pattern used in Hades KB).
export function fileToBase64(file, maxBytes = 500 * 1024) {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`File terlalu besar (maks ${Math.round(maxBytes / 1024)}KB). Kompres dulu gambarnya.`))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}
