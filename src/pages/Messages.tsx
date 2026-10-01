import { useEffect, useState, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Send, Loader, MessageCircle, ArrowLeft } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Eyebrow } from '../components/ui/Eyebrow'
import { button, field } from '../components/ui/styles'
import { cn } from '../lib/utils'
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

  const conversationList = (
    <>
      {convLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader className="w-5 h-5 text-brand-sky animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <span className="w-12 h-12 rounded-[12px] bg-brand-navy text-brand-sky flex items-center justify-center mb-4">
            <MessageCircle className="w-5 h-5" />
          </span>
          <p className="font-outfit text-lg font-bold">No messages yet</p>
          <p className="text-sm text-brand-muted mt-1 mb-5">Messages about listings will appear here</p>
          <Link to="/browse" className={button('primary', 'sm')}>Browse listings</Link>
        </div>
      ) : (
        conversations.map(conv => {
          const key = `${conv.listing.id}:${conv.other.id}`
          const isActive = key === activeKey
          return (
            <button
              key={key}
              onClick={() => setSearchParams({ c: key })}
              className={cn(
                'w-full text-left px-4 py-4 border-b border-brand-line border-l-[3px] transition-colors',
                isActive ? 'bg-white border-l-brand-sky' : 'border-l-transparent hover:bg-white/70',
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center text-xs font-bold text-brand-sky flex-shrink-0">
                    {conv.other.display_name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className={cn('text-[15px] truncate', conv.unread > 0 ? 'font-bold' : 'font-semibold')}>
                    {conv.other.display_name ?? 'UNC Student'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {conv.unread > 0 && (
                    <span className="min-w-[20px] h-5 px-1 bg-brand-sky text-brand-navy text-[11px] font-bold rounded-full flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                  <span className="text-[11px] text-brand-muted">{timeAgo(conv.lastMessage.created_at)}</span>
                </div>
              </div>
              <p className="text-[13px] font-semibold text-brand-sky-ink truncate pl-[42px]">{conv.listing.title}</p>
              <p className="text-[13px] text-brand-muted truncate pl-[42px] mt-0.5">{conv.lastMessage.body}</p>
            </button>
          )
        })
      )}
    </>
  )

  const threadPanel = activeKey ? (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white">
      {/* Thread header */}
      <div className="px-5 py-4 border-b border-brand-line flex-shrink-0 flex items-center gap-3">
        <button
          onClick={() => setSearchParams({})}
          aria-label="Back to conversations"
          className="md:hidden p-1 -ml-1 text-brand-muted hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-brand-navy flex items-center justify-center text-sm font-bold text-brand-sky flex-shrink-0">
          {activeConv?.other.display_name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[15px]">
            {activeConv?.other.display_name ?? 'UNC Student'}
          </p>
          {activeConv && (
            <Link to={`/listings/${activeConv.listing.id}`} className="block text-[13px] font-medium text-brand-sky-ink truncate hover:underline underline-offset-4">
              {activeConv.listing.title}
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        {msgLoading ? (
          <div className="flex justify-center pt-8">
            <Loader className="w-5 h-5 text-brand-sky animate-spin" />
          </div>
        ) : messages.map(msg => {
          const isMe = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={cn(
                'max-w-[78%] md:max-w-[72%] px-4 py-2.5 rounded-[18px] text-[15px] leading-relaxed',
                isMe ? 'bg-brand-navy text-white rounded-br-md' : 'bg-brand-mist text-brand-navy rounded-bl-md',
              )}>
                {msg.body}
                <p className={cn('text-[11px] mt-1', isMe ? 'text-brand-subtle' : 'text-brand-muted')}>
                  {timeAgo(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 md:px-5 md:py-4 border-t border-brand-line flex-shrink-0">
        <div className="flex items-end gap-2.5">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message... (Enter to send)"
            className={cn(field, 'flex-1 resize-none')}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !body.trim()}
            aria-label="Send message"
            className="w-12 h-12 bg-brand-sky text-brand-navy rounded-[10px] flex items-center justify-center hover:brightness-105 transition disabled:opacity-40 flex-shrink-0"
          >
            {sending
              ? <Loader className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex-1 hidden md:flex flex-col items-center justify-center text-center px-8 bg-white">
      <span className="w-14 h-14 rounded-[14px] bg-brand-mist text-brand-sky-ink flex items-center justify-center mb-4">
        <MessageCircle className="w-6 h-6" />
      </span>
      <p className="font-outfit text-xl font-bold">Select a conversation</p>
      <p className="text-brand-muted text-[15px] mt-1">Choose one from the left to read and reply</p>
    </div>
  )

  return (
    <PageShell footer={false}>
      {/* Fills the viewport under the 72px header (and above the 64px mobile tab bar) */}
      <div className="mx-auto max-w-6xl px-4 md:px-8 flex flex-col h-[calc(100dvh-136px)] md:h-[calc(100dvh-72px)]">

        {/* Hide heading on mobile when thread is open */}
        <div className={cn('flex flex-col gap-1.5 py-6 md:py-8 flex-shrink-0', activeKey && 'hidden md:flex')}>
          <Eyebrow>INBOX</Eyebrow>
          <h1 className="font-outfit text-[34px] md:text-[44px] leading-none font-extrabold tracking-[-0.03em]">Messages</h1>
        </div>

        {/* Mobile: full-width list or full-width thread */}
        <div className={cn(
          'flex flex-1 border border-brand-line rounded-[20px] overflow-hidden min-h-0 mb-4 md:mb-8 shadow-[0_10px_30px_rgba(5,30,55,0.06)]',
          activeKey && 'mt-4 md:mt-0',
        )}>

          {/* Conversation list — full width on mobile (hidden when thread open), sidebar on desktop */}
          <div className={cn(
            'flex-col overflow-y-auto border-r border-brand-line bg-brand-mist',
            activeKey ? 'hidden md:flex md:w-80 md:flex-shrink-0' : 'flex w-full md:w-80 md:flex-shrink-0',
          )}>
            {conversationList}
          </div>

          {/* Thread panel — full width on mobile when active, right pane on desktop */}
          {threadPanel}
        </div>
      </div>
    </PageShell>
  )
}
