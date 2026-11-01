import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const adminNav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/banks', label: 'Bank Soal' },
  { to: '/admin/questions', label: 'Kelola Soal' },
  { to: '/admin/quizzes', label: 'Quiz' },
]

const userNav = [{ to: '/quiz', label: 'Quiz Saya' }]

const linkStyle = (isActive) => ({
  padding: '10px 12px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  color: isActive ? 'var(--brand-dark)' : 'rgba(255,255,255,0.85)',
  background: isActive ? '#fff' : 'transparent',
  textDecoration: 'none',
})

export default function Layout({ children }) {
  const { profile, isAdmin, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav = isAdmin ? adminNav : userNav

  // Sign-in lives on Hades: log out, then land on the Hades login page
  const handleLogout = async () => {
    await logout()
    window.location.assign('/')
  }

  return (
    <div className="app-shell">
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <span className="display" style={{ color: '#fff', fontSize: 18 }}>Quiz</span>
        <button
          aria-label="Menu"
          onClick={() => setMobileOpen((v) => !v)}
          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 22, padding: 4 }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      <aside className={`app-sidebar ${mobileOpen ? 'app-sidebar-open' : ''}`}>
        <div className="display sidebar-title" style={{ color: '#fff', fontSize: 20, padding: '0 8px 8px' }}>
          Quiz
        </div>
        <a
          href="/#home"
          style={{ ...linkStyle(false), display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}
        >
          ← Kembali ke Hades KB
        </a>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => linkStyle(isActive)}
            >
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            // Users are managed in Hades, not here
            <a href="/#users" style={linkStyle(false)}>Kelola User ↗</a>
          )}
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14, marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{profile?.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
            {isAdmin ? 'Admin' : 'Member'}
          </div>
          <button
            className="btn btn-outline"
            style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            onClick={handleLogout}
          >
            Keluar
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 14 }}>
          Gabel-2026
        </div>
      </aside>

      {mobileOpen && <div className="app-sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <main className="app-content">{children}</main>
    </div>
  )
}
