import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function Home() {
  const navigate = useNavigate()
  const { domains, fetchDomains, createRandomInbox, createCustomInbox, loading, error, clearError } = useStore()
  
  const [selectedDomain, setSelectedDomain] = useState('')
  const [customUsername, setCustomUsername] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)

  useEffect(() => {
    fetchDomains()
  }, [])

  useEffect(() => {
    if (domains.length > 0 && !selectedDomain) {
      setSelectedDomain(domains[0])
    }
  }, [domains])

  const handleGenerateRandom = async () => {
    // Pastikan domain terisi
    const domainToUse = selectedDomain || (domains.length > 0 ? domains[0] : null)
    if (!domainToUse) {
      return // No domain available
    }
    const result = await createRandomInbox(domainToUse)
    if (result) {
      navigate(`/inbox/${result.sessionId}`)
    }
  }

  const handleCreateCustom = async (e) => {
    e.preventDefault()
    if (!customUsername.trim()) return
    
    const result = await createCustomInbox(customUsername.trim().toLowerCase(), selectedDomain)
    if (result) {
      navigate(`/inbox/${result.sessionId}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="font-display text-6xl md:text-8xl text-brutal-black mb-4 tracking-wider">
          DISPOSABLE<br />
          <span className="text-brutal-orange" style={{ WebkitTextStroke: '3px #1A1A1A' }}>
            EMAIL
          </span>
        </h2>
        <p className="text-xl font-brutal text-brutal-dark">
          Instant temporary email addresses • No signup required
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="card-brutal bg-red-100 border-red-500 mb-6 flex items-center justify-between">
          <span className="text-red-700 font-bold">{error}</span>
          <button onClick={clearError} className="text-red-700 font-bold hover:underline">
            DISMISS
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="card-brutal">
        {/* Domain Selector */}
        <div className="mb-6">
          <label className="block font-bold text-brutal-black mb-2 uppercase tracking-wider">
            Select Domain
          </label>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="input-brutal cursor-pointer"
          >
            {domains.map(domain => (
              <option key={domain} value={domain}>@{domain}</option>
            ))}
          </select>
        </div>

        {/* Toggle Mode */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsCustomMode(false)}
            className={`flex-1 py-3 border-4 border-brutal-black font-bold uppercase transition-all
              ${!isCustomMode 
                ? 'bg-brutal-orange text-brutal-black shadow-brutal' 
                : 'bg-brutal-white text-brutal-black hover:bg-brutal-gray'}`}
          >
            Random
          </button>
          <button
            onClick={() => setIsCustomMode(true)}
            className={`flex-1 py-3 border-4 border-brutal-black font-bold uppercase transition-all
              ${isCustomMode 
                ? 'bg-brutal-orange text-brutal-black shadow-brutal' 
                : 'bg-brutal-white text-brutal-black hover:bg-brutal-gray'}`}
          >
            Custom
          </button>
        </div>

        {/* Random or Custom Input */}
        {isCustomMode ? (
          <form onSubmit={handleCreateCustom}>
            <div className="mb-6">
              <label className="block font-bold text-brutal-black mb-2 uppercase tracking-wider">
                Custom Username
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value.replace(/[^a-z0-9._-]/gi, ''))}
                  placeholder="yourname"
                  className="input-brutal flex-1 border-r-0"
                  maxLength={30}
                />
                <span className="px-4 py-3 border-4 border-brutal-black bg-brutal-gray font-bold">
                  @{selectedDomain}
                </span>
              </div>
              <p className="text-sm text-brutal-dark mt-2">
                3-30 characters, letters, numbers, dots, hyphens, underscores
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !customUsername.trim()}
              className="btn-brutal w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'CREATING...' : 'CREATE INBOX →'}
            </button>
          </form>
        ) : (
          <div>
            <div className="mb-6 p-4 border-4 border-dashed border-brutal-black bg-brutal-gray text-center">
              <p className="text-brutal-dark">
                Click the button below to generate a random email address
              </p>
            </div>
            <button
              onClick={handleGenerateRandom}
              disabled={loading}
              className="btn-brutal w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'GENERATING...' : 'GENERATE RANDOM EMAIL →'}
            </button>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4 mt-12">
        {[
          { icon: '⚡', title: 'INSTANT', desc: 'No signup, no waiting' },
          { icon: '🔒', title: 'PRIVATE', desc: 'Auto-delete in 20 min' },
          { icon: '📧', title: 'REAL-TIME', desc: 'Instant email delivery' }
        ].map((feature, i) => (
          <div key={i} className="card-brutal text-center hover:shadow-brutal-orange transition-shadow">
            <div className="text-4xl mb-2">{feature.icon}</div>
            <h3 className="font-display text-2xl text-brutal-black">{feature.title}</h3>
            <p className="text-brutal-dark text-sm mt-1">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Setup Guide Banner */}
      <div className="mt-12 card-brutal bg-brutal-black text-brutal-white text-center">
        <h3 className="font-display text-2xl mb-2">🛠️ WANT TO ADD YOUR OWN DOMAIN?</h3>
        <p className="text-brutal-gray mb-4">
          Panduan lengkap setup email forwarding untuk domain kamu
        </p>
        <Link to="/setup" className="btn-brutal inline-block bg-brutal-orange text-brutal-black">
          📖 BACA SETUP GUIDE →
        </Link>
      </div>
    </div>
  )
}
