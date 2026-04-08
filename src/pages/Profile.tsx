import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Plus, MapPin, Calendar, Pencil, Trash2 } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types'

export default function Profile() {
  const { user, isAuthed, loading } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !isAuthed) navigate('/')
  }, [loading, isAuthed, navigate])

  useEffect(() => {
    if (!user) return
    async function fetchMyListings() {
      setListingsLoading(true)
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      setListings(data ?? [])
      setListingsLoading(false)
    }
    fetchMyListings()
  }, [user])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeleting(id)
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeleting(null)
  }

  async function handleToggleActive(listing: Listing) {
    const { data } = await supabase
      .from('listings')
      .update({ is_active: !listing.is_active })
      .eq('id', listing.id)
      .select()
      .single()
    if (data) setListings(prev => prev.map(l => l.id === listing.id ? data : l))
  }

  if (loading) return null

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'UN'
  const email = user?.email ?? ''
  const activeCount = listings.filter(l => l.is_active).length

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-14">
        <div className="max-w-4xl mx-auto px-6 py-10">

          {/* Profile header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-unc-blue flex items-center justify-center text-white text-xl font-semibold">
                {initials}
              </div>
              <div>
                <p className="text-lg font-semibold text-unc-navy">{email}</p>
                <p className="text-sm text-slate-body">UNC verified · @unc.edu</p>
                <div className="flex gap-4 mt-1 text-sm text-slate-body">
                  <span><span className="font-semibold text-unc-navy">{listings.length}</span> listings</span>
                  <span><span className="font-semibold text-unc-navy">{activeCount}</span> active</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-slate-body hover:text-red-500 transition-colors border border-gray-200 hover:border-red-200 rounded-lg px-4 py-2"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>

          {/* My listings */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-unc-navy">My listings</h2>
            <Link
              to="/post"
              className="flex items-center gap-2 bg-unc-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-unc-navy transition-colors"
            >
              <Plus className="w-4 h-4" />
              Post a listing
            </Link>
          </div>

          {listingsLoading ? (
            <div className="text-slate-body text-sm py-12 text-center">Loading your listings…</div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-5 h-5 text-unc-blue" />
              </div>
              <p className="font-semibold text-unc-navy mb-1">No listings yet</p>
              <p className="text-sm text-slate-body mb-5">Post your first sublease and reach hundreds of UNC students.</p>
              <Link
                to="/post"
                className="inline-flex items-center gap-2 bg-unc-blue text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-unc-navy transition-colors"
              >
                <Plus className="w-4 h-4" />
                Post a listing
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {listings.map(listing => (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-unc-navy truncate">{listing.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        listing.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {listing.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-unc-blue font-semibold text-sm mb-1">${listing.rent}/mo</p>
                    <div className="flex items-center gap-3 text-xs text-slate-body">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(listing.available_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' – '}
                        {new Date(listing.available_to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {listing.address}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(listing)}
                      className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-slate-body hover:border-unc-blue hover:text-unc-blue transition-colors"
                    >
                      {listing.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <Link
                      to={`/listings/${listing.id}`}
                      className="p-2 rounded-lg border border-gray-200 text-slate-body hover:border-unc-blue hover:text-unc-blue transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={deleting === listing.id}
                      className="p-2 rounded-lg border border-gray-200 text-slate-body hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
