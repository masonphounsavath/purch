import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Landing from './pages/Landing'
import Browse from './pages/Browse'
import ListingDetail from './pages/ListingDetail'
import PostListing from './pages/PostListing'
import Messages from './pages/Messages'
import AuthCallback from './pages/AuthCallback'
import Profile from './pages/Profile'
import EditListing from './pages/EditListing'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Contact from './pages/Contact'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PushOptIn } from './components/PushOptIn'
import { MobileTabBar } from './components/layout/MobileTabBar'
import { NotificationEmailGate } from './components/NotificationEmailGate'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'

function AppInner() {
  const { user } = useAuth()
  // undefined = still loading, null = loaded & not set, string = set
  const [notifEmail, setNotifEmail] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!user?.id) { setNotifEmail(undefined); return }
    supabase
      .from('profiles')
      .select('notification_email')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setNotifEmail(data?.notification_email ?? null))
  }, [user?.id])

  const showGate = !!user && notifEmail === null

  return (
    <>
      {showGate && (
        <NotificationEmailGate
          userId={user.id}
          onComplete={() => setNotifEmail('set')}
        />
      )}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route
          path="/listings/:id/edit"
          element={
            <ProtectedRoute>
              <EditListing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/post"
          element={
            <ProtectedRoute>
              <PostListing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <MobileTabBar />
      {user && <PushOptIn userId={user.id} />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
