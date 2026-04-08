import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Loader, MessageCircle } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Message, Listing, Profile } from '../types'

// A "conversation" groups all messages between two users about one listing
interface Conversation {
  listing: Pick<Listing, 'id' | 'title' | 'rent'>
  other: Pick<Profile, 'id' | 'display_name'>
  lastMessage: Message
  unread: number
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Messages() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeKey = searchParams.get('c') // "listingId:otherUserId"

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convLoading, setConvLoading] = useState(true)

  const [messages, setMessages] = useState<Message[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Parse active conversation
  const [activeListing, activeOther] = activeKey?.split(':') ?? []

  // ── Load conversation list ──────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    const uid = user.id
    async function load() {
      setConvLoading(true)
      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          listing:listings(id, title, rent),
          sender:profiles!messages_sender_id_fkey(id, display_name),
          recipient:profiles!messages_recipient_id_fkey(id, display_name)
        `)
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .order('created_at', { ascending: false })

      if (!data) { setConvLoading(false); return }

      // Group by listing + other user
      const map = new Map<string, Conversation>()
      for (const msg of data as any[]) {
        const otherId   = msg.sender_id === uid ? msg.recipient_id : msg.sender_id
        const otherName = msg.sender_id === uid
          ? msg.recipient?.display_name
          : msg.sender?.display_name
        const key = `${msg.listing_id}:${otherId}`
        if (!map.has(key)) {
          map.set(key, {
            listing:     msg.listing,
            other:       { id: otherId, display_name: otherName ?? 'UNC Student' },
            lastMessage: msg,
            unread:      (!msg.read_at && msg.recipient_id === uid) ? 1 : 0,
          })
        } else {
          const conv = map.get(key)!
          if (!msg.read_at && msg.recipient_id === uid) conv.unread++
        }
      }
      setConversations(Array.from(map.values()))
      setConvLoading(false)
    }
    load()
  }, [user])

  // ── Load messages for active conversation ───────────────
  useEffect(() => {
    if (!user || !activeListing || !activeOther) return
    setMsgLoading(true)

    supabase
      .from('messages')
      .select('*')
      .eq('listing_id', activeListing)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${activeOther}),and(sender_id.eq.${activeOther},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? [])
        setMsgLoading(false)
      })

    // Mark messages as read
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('listing_id', activeListing)
      .eq('sender_id', activeOther)
      .eq('recipient_id', user.id)
      .is('read_at', null)
      .then(() => {})

    // Real-time subscription
    const channel = supabase
      .channel(`messages:${activeListing}:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${activeListing}`,
        },
        (payload) => {
          const msg = payload.new as Message
          const relevant =
            (msg.sender_id === user.id && msg.recipient_id === activeOther) ||
            (msg.sender_id === activeOther && msg.recipient_id === user.id)
          if (relevant) setMessages(prev =>
            prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, activeListing, activeOther])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!user || !activeListing || !activeOther || !body.trim()) return
    setSending(true)
    const trimmed = body.trim()
    setBody('')
    const { data } = await supabase.from('messages').insert({
      listing_id:   activeListing,
      sender_id:    user.id,
      recipient_id: activeOther,
      body:         trimmed,
    }).select().single()
    if (data) setMessages(prev =>
      prev.some(m => m.id === (data as Message).id) ? prev : [...prev, data as Message]
    )
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const activeConv = conversations.find(
    c => c.listing.id === activeListing && c.other.id === activeOther
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-0 h-screen flex flex-col">

        <h1 className="text-2xl font-bold text-unc-navy py-5 flex-shrink-0">Messages</h1>

        <div className="flex flex-1 border border-gray-100 rounded-2xl overflow-hidden min-h-0 mb-6">

          {/* ── Conversation list ── */}
          <div className="w-72 flex-shrink-0 border-r border-gray-100 overflow-y-auto">
            {convLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader className="w-5 h-5 text-unc-blue animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 px-6 text-center">
                <MessageCircle className="w-8 h-8 text-slate-200 mb-3" />
                <p className="text-sm text-slate-400">No messages yet</p>
                <p className="text-xs text-slate-300 mt-1">Messages about listings will appear here</p>
              </div>
            ) : (
              conversations.map(conv => {
                const key = `${conv.listing.id}:${conv.other.id}`
                const isActive = key === activeKey
                return (
                  <button
                    key={key}
                    onClick={() => setSearchParams({ c: key })}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50/60 border-l-2 border-l-unc-blue' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-unc-blue/15 flex items-center justify-center text-xs font-bold text-unc-blue flex-shrink-0">
                          {conv.other.display_name?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <span className="text-sm font-semibold text-unc-navy truncate">
                          {conv.other.display_name ?? 'UNC Student'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {conv.unread > 0 && (
                          <span className="w-5 h-5 bg-unc-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {conv.unread}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{timeAgo(conv.lastMessage.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 truncate pl-9">{conv.listing.title}</p>
                    <p className="text-xs text-slate-500 truncate pl-9 mt-0.5">{conv.lastMessage.body}</p>
                  </button>
                )
              })
            )}
          </div>

          {/* ── Message thread ── */}
          {!activeKey ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <MessageCircle className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-slate-400 font-medium">Select a conversation</p>
              <p className="text-slate-300 text-sm mt-1">Choose one from the left to read and reply</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {/* Thread header */}
              <div className="px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
                <p className="font-semibold text-unc-navy text-sm">
                  {activeConv?.other.display_name ?? 'UNC Student'}
                </p>
                <p className="text-xs text-slate-400 truncate">{activeConv?.listing.title}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {msgLoading ? (
                  <div className="flex justify-center pt-8">
                    <Loader className="w-5 h-5 text-unc-blue animate-spin" />
                  </div>
                ) : messages.map(msg => {
                  const isMe = msg.sender_id === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-unc-navy text-white rounded-br-sm'
                          : 'bg-gray-100 text-unc-navy rounded-bl-sm'
                      }`}>
                        {msg.body}
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-slate-400'}`}>
                          {timeAgo(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
                <div className="flex items-end gap-3">
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Type a message... (Enter to send)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-unc-navy placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-unc-blue/30 focus:border-unc-blue transition-all resize-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !body.trim()}
                    className="w-10 h-10 bg-unc-navy text-white rounded-xl flex items-center justify-center hover:bg-[#1c3a6b] transition-colors disabled:opacity-40 flex-shrink-0"
                  >
                    {sending
                      ? <Loader className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
