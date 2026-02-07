import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useStore } from '../store/useStore'

export default function Inbox() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { 
    inbox, emails, selectedEmail, 
    getInbox, fetchEmails, addEmail, getEmail, deleteEmail, extendInbox, 
    clearInbox, clearSelectedEmail, error, clearError 
  } = useStore()
  
  const [timeLeft, setTimeLeft] = useState('')
  const [socket, setSocket] = useState(null)
  const [copied, setCopied] = useState(false)

  // Load inbox and connect socket
  useEffect(() => {
    const loadInbox = async () => {
      const result = await getInbox(sessionId)
      if (!result) {
        navigate('/')
        return
      }
      await fetchEmails(sessionId)
    }
    
    loadInbox()
    
    // Connect to socket
    const newSocket = io(window.location.origin)
    setSocket(newSocket)
    
    newSocket.on('connect', () => {
      newSocket.emit('subscribe', sessionId)
    })
    
    newSocket.on('newEmail', (email) => {
      addEmail(email)
      // Play notification sound or show notification
      if (Notification.permission === 'granted') {
        new Notification('New Email!', { body: email.subject })
      }
    })
    
    return () => {
      if (newSocket) {
        newSocket.emit('unsubscribe', sessionId)
        newSocket.disconnect()
      }
      clearInbox()
    }
  }, [sessionId])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Update countdown timer
  useEffect(() => {
    if (!inbox?.expiresAt) return
    
    const updateTimer = () => {
      const now = new Date()
      const expires = new Date(inbox.expiresAt + 'Z')
      const diff = expires - now
      
      if (diff <= 0) {
        navigate('/')
        return
      }
      
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [inbox?.expiresAt])

  // Auto-refresh emails every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionId) fetchEmails(sessionId)
    }, 10000)
    return () => clearInterval(interval)
  }, [sessionId])

  const handleCopyEmail = useCallback(() => {
    if (inbox?.email) {
      navigator.clipboard.writeText(inbox.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [inbox?.email])

  const handleExtend = async () => {
    await extendInbox(sessionId)
  }

  const handleDeleteEmail = async (emailId, e) => {
    e.stopPropagation()
    await deleteEmail(sessionId, emailId)
  }

  const handleViewEmail = async (emailId) => {
    await getEmail(sessionId, emailId)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  if (!inbox) {
    return (
      <div className="card-brutal text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-xl font-bold">Loading inbox...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Error display */}
      {error && (
        <div className="card-brutal bg-red-100 border-red-500 mb-6 flex items-center justify-between">
          <span className="text-red-700 font-bold">{error}</span>
          <button onClick={clearError} className="text-red-700 font-bold hover:underline">
            DISMISS
          </button>
        </div>
      )}

      {/* Email Address Card */}
      <div className="card-brutal mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-brutal-dark uppercase tracking-wider mb-1">Your temporary email</p>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-3xl md:text-4xl text-brutal-black break-all">
                {inbox.email}
              </h2>
              <button
                onClick={handleCopyEmail}
                className="p-2 border-3 border-brutal-black bg-brutal-white hover:bg-brutal-orange transition-colors"
                title="Copy to clipboard"
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="badge-brutal flex items-center gap-2">
              <span>⏱</span>
              <span>{timeLeft}</span>
            </div>
            <button onClick={handleExtend} className="btn-brutal-outline text-sm py-2">
              + EXTEND TIME
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-5 gap-6">
        {/* Email List */}
        <div className="md:col-span-2">
          <div className="card-brutal p-0">
            <div className="p-4 border-b-4 border-brutal-black bg-brutal-orange">
              <h3 className="font-display text-2xl text-brutal-black flex items-center gap-2">
                <span>📥</span> INBOX
                <span className="badge-brutal ml-auto">{emails.length}</span>
              </h3>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto">
              {emails.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-brutal-dark font-bold">No emails yet</p>
                  <p className="text-sm text-brutal-dark mt-2">
                    Waiting for incoming mail...
                  </p>
                  <div className="mt-4 flex justify-center">
                    <div className="w-3 h-3 bg-brutal-orange border-2 border-brutal-black animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <div>
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => handleViewEmail(email.id)}
                      className={`p-4 border-b-3 border-brutal-black cursor-pointer transition-colors
                        ${selectedEmail?.id === email.id ? 'bg-brutal-orange' : 'hover:bg-brutal-gray'}
                        ${!email.is_read ? 'bg-yellow-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-brutal-black truncate">
                            {!email.is_read && <span className="text-brutal-orange mr-1">●</span>}
                            {email.from_address}
                          </p>
                          <p className="text-brutal-dark truncate">{email.subject}</p>
                          <p className="text-xs text-brutal-dark mt-1">
                            {formatDate(email.received_at)}
                            {email.attachment_count > 0 && (
                              <span className="ml-2">📎 {email.attachment_count}</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteEmail(email.id, e)}
                          className="p-1 text-red-500 hover:bg-red-100 border-2 border-transparent hover:border-red-500"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email View */}
        <div className="md:col-span-3">
          <div className="card-brutal p-0 min-h-[500px]">
            {!selectedEmail ? (
              <div className="flex items-center justify-center h-[500px]">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">✉️</div>
                  <p className="text-xl font-bold text-brutal-dark">Select an email to view</p>
                </div>
              </div>
            ) : (
              <>
                {/* Email Header */}
                <div className="p-4 border-b-4 border-brutal-black bg-brutal-gray">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-display text-2xl text-brutal-black break-words">
                        {selectedEmail.subject}
                      </h3>
                      <div className="mt-2 text-sm">
                        <p><strong>From:</strong> {selectedEmail.from_address}</p>
                        <p><strong>To:</strong> {selectedEmail.to_address}</p>
                        <p><strong>Date:</strong> {formatDate(selectedEmail.received_at)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => clearSelectedEmail()}
                      className="p-2 border-3 border-brutal-black bg-brutal-white hover:bg-red-100"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Attachments */}
                  {selectedEmail.attachments?.length > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-brutal-black">
                      <p className="font-bold text-sm mb-2">📎 ATTACHMENTS</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmail.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={`/api/inbox/${sessionId}/attachments/${att.id}`}
                            download={att.filename}
                            className="inline-flex items-center gap-1 px-3 py-1 border-2 border-brutal-black bg-brutal-white hover:bg-brutal-orange text-sm"
                          >
                            📄 {att.filename}
                            <span className="text-xs text-brutal-dark">
                              ({Math.round(att.size / 1024)}KB)
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Email Body */}
                <div className="p-4 overflow-auto max-h-[400px]">
                  {selectedEmail.html_body ? (
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html_body }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-brutal text-sm">
                      {selectedEmail.text_body || '(No content)'}
                    </pre>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Refresh indicator */}
      <div className="text-center mt-6 text-sm text-brutal-dark">
        <p>📡 Real-time updates enabled • Auto-refresh every 10 seconds</p>
      </div>
    </div>
  )
}
