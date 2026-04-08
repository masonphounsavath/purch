import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Browse from './pages/Browse'
import ListingDetail from './pages/ListingDetail'
import PostListing from './pages/PostListing'
import Messages from './pages/Messages'
import AuthCallback from './pages/AuthCallback'
import Profile from './pages/Profile'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
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
      </Routes>
    </BrowserRouter>
  )
}
