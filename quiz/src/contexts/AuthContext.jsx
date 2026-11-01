import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

// Quiz has no login of its own: people sign in on Hades, and because Hades and /quiz/ share the same
// origin and Firebase project, the Firebase session is already here. Same rule as Hades: the account
// needs a profile created by an admin (users/{uid}) and must not be deactivated.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // firebase auth user
  const [profile, setProfile] = useState(null) // { name, role, email, ... } from Firestore
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      try {
        const snap = await getDoc(doc(db, 'users', fbUser.uid))
        const data = snap.exists() ? snap.data() : null
        if (!data || data.disabled) {
          await signOut(auth) // fires this callback again with null
          return
        }
        setUser(fbUser)
        setProfile(data)
      } catch (e) {
        console.error('[Quiz] Gagal memuat profil:', e)
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const logout = () => signOut(auth)

  const value = {
    user,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
