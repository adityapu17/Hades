import { useEffect } from 'react'

// Plays a short "closing book" animation, then calls onComplete.
// Represents the exam being "handed in and closed".
export default function SubmitTransition({ onComplete }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 1500)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div className="submit-transition-overlay">
      <div className="book-anim">
        <div className="book-spine" />
        <div className="book-page book-page-left" />
        <div className="book-page book-page-right" />
      </div>
      <div className="submit-transition-text">Mengumpulkan jawaban…</div>
    </div>
  )
}
