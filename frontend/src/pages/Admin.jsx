import { useState, useEffect } from 'react'

const API_BASE = '/api/admin'

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState('')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  
  const [stats, setStats] = useState(null)
  const [domains, setDomains] = useState([])
  const [inboxes, setInboxes] = useState([])
  const [gmailAccounts, setGmailAccounts] = useState([])
  const [newDomain, setNewDomain] = useState('')
  const [newDomainGmail, setNewDomainGmail] = useState('')
  const [newGmail, setNewGmail] = useState({ 
    email: '', 
    app_password: '', 
    description: '',
    imap_host: 'imap.gmail.com',
    imap_port: 993
  })
  const [selectedProvider, setSelectedProvider] = useState('gmail')
  const [showGmailForm, setShowGmailForm] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [testingImapId, setTestingImapId] = useState(null)
  const [testImapResult, setTestImapResult] = useState(null)
  const [domainMasterCheckResult, setDomainMasterCheckResult] = useState(null)
  const [domainMasterCheckingId, setDomainMasterCheckingId] = useState(null)
  const [showMasterEmailForm, setShowMasterEmailForm] = useState(false)
  const [newMasterEmail, setNewMasterEmail] = useState({
    email: '',
    app_password: '',
    description: '',
    imap_host: 'imap.gmail.com',
    imap_port: 993
  })
  const [selectedMasterProvider, setSelectedMasterProvider] = useState('gmail')

  // Email provider presets
  const emailProviders = {
    gmail: { name: 'Gmail', host: 'imap.gmail.com', port: 993 },
    outlook: { name: 'Outlook/Hotmail', host: 'outlook.office365.com', port: 993 },
    yahoo: { name: 'Yahoo Mail', host: 'imap.mail.yahoo.com', port: 993 },
    zoho: { name: 'Zoho Mail', host: 'imap.zoho.com', port: 993 },
    icloud: { name: 'iCloud Mail', host: 'imap.mail.me.com', port: 993 },
    yandex: { name: 'Yandex Mail', host: 'imap.yandex.com', port: 993 },
    gmx: { name: 'GMX Mail', host: 'imap.gmx.com', port: 993 },
    custom: { name: 'Custom IMAP', host: '', port: 993 }
  }

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider)
    if (provider !== 'custom') {
      setNewGmail(prev => ({
        ...prev,
        imap_host: emailProviders[provider].host,
        imap_port: emailProviders[provider].port
      }))
    }
  }
  const handleMasterProviderChange = (provider) => {
    setSelectedMasterProvider(provider)
    if (provider !== 'custom') {
      setNewMasterEmail(prev => ({
        ...prev,
        imap_host: emailProviders[provider].host,
        imap_port: emailProviders[provider].port
      }))
    }
  }
  const [activeTab, setActiveTab] = useState('stats')

  // Check for saved token
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken')
    if (savedToken) {
      setToken(savedToken)
      setIsLoggedIn(true)
    }
  }, [])

  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn && token) {
      loadStats()
      loadDomains()
      loadInboxes()
      loadGmailAccounts()
    }
  }, [isLoggedIn, token])

  // Auto-cek master mailbox saat pilih di form Add Domain
  useEffect(() => {
    if (newDomainGmail && activeTab === 'domains') {
      testDomainMasterConnection(newDomainGmail)
    } else {
      setDomainMasterCheckResult(null)
      setDomainMasterCheckingId(null)
    }
  }, [newDomainGmail, activeTab])

  const authHeaders = () => ({
    'Authorization': `Basic ${token}`,
    'Content-Type': 'application/json'
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setToken(data.token)
      localStorage.setItem('adminToken', data.token)
      setIsLoggedIn(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setToken('')
    localStorage.removeItem('adminToken')
  }

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`, { headers: authHeaders() })
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const loadDomains = async () => {
    try {
      const res = await fetch(`${API_BASE}/domains`, { headers: authHeaders() })
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setDomains(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const loadInboxes = async () => {
    try {
      const res = await fetch(`${API_BASE}/inboxes`, { headers: authHeaders() })
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setInboxes(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const loadGmailAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/gmail-accounts`, { headers: authHeaders() })
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setGmailAccounts(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const addGmailAccount = async (e) => {
    e.preventDefault()
    if (!newGmail.email.trim() || !newGmail.app_password.trim()) return
    if (selectedProvider === 'custom' && !newGmail.imap_host.trim()) {
      setError('IMAP Host is required for custom provider')
      return
    }
    setError('')
    
    try {
      const res = await fetch(`${API_BASE}/gmail-accounts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...newGmail,
          description: newGmail.description || emailProviders[selectedProvider].name
        })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setNewGmail({ email: '', app_password: '', description: '', imap_host: 'imap.gmail.com', imap_port: 993 })
      setSelectedProvider('gmail')
      setShowGmailForm(false)
      loadGmailAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleGmailAccount = async (id, isActive) => {
    try {
      await fetch(`${API_BASE}/gmail-accounts/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !isActive })
      })
      loadGmailAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteGmailAccount = async (id) => {
    if (!confirm('Are you sure you want to delete this Gmail account?')) return
    
    try {
      const res = await fetch(`${API_BASE}/gmail-accounts/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      loadGmailAccounts()
      loadDomains()
    } catch (err) {
      setError(err.message)
    }
  }

  const testImapConnection = async (id) => {
    setTestImapResult(null)
    setTestingImapId(id)
    try {
      const res = await fetch(`${API_BASE}/gmail-accounts/${id}/test-imap`, {
        method: 'POST',
        headers: authHeaders()
      })
      const data = await res.json()
      setTestImapResult({ id, ...data })
    } catch (err) {
      setTestImapResult({ id, success: false, error: err.message })
    } finally {
      setTestingImapId(null)
    }
  }

  const testDomainMasterConnection = async (accountId) => {
    if (!accountId) {
      setDomainMasterCheckResult(null)
      return
    }
    setDomainMasterCheckResult(null)
    setDomainMasterCheckingId(accountId)
    try {
      const res = await fetch(`${API_BASE}/gmail-accounts/${accountId}/test-imap`, {
        method: 'POST',
        headers: authHeaders()
      })
      const data = await res.json()
      setDomainMasterCheckResult({ id: accountId, ...data })
    } catch (err) {
      setDomainMasterCheckResult({ id: accountId, success: false, error: err.message })
    } finally {
      setDomainMasterCheckingId(null)
    }
  }

  const addMasterEmail = async (e) => {
    e.preventDefault()
    if (!newMasterEmail.email.trim() || !newMasterEmail.app_password.trim()) return
    if (selectedMasterProvider === 'custom' && !newMasterEmail.imap_host.trim()) {
      setError('IMAP Host wajib untuk custom provider')
      return
    }
    setError('')
    try {
      const res = await fetch(`${API_BASE}/gmail-accounts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...newMasterEmail,
          description: newMasterEmail.description || emailProviders[selectedMasterProvider].name
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNewMasterEmail({ email: '', app_password: '', description: '', imap_host: 'imap.gmail.com', imap_port: 993 })
      setSelectedMasterProvider('gmail')
      setShowMasterEmailForm(false)
      loadGmailAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  const addDomain = async (e) => {
    e.preventDefault()
    if (!newDomain.trim()) return
    setError('')
    
    try {
      const res = await fetch(`${API_BASE}/domains`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ 
          domain: newDomain.trim(),
          gmail_account_id: newDomainGmail || null
        })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setNewDomain('')
      setNewDomainGmail('')
      loadDomains()
    } catch (err) {
      setError(err.message)
    }
  }

  const updateDomainGmail = async (domainId, gmailAccountId) => {
    try {
      await fetch(`${API_BASE}/domains/${domainId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ gmail_account_id: gmailAccountId || null })
      })
      loadDomains()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleDomain = async (id, isActive) => {
    try {
      await fetch(`${API_BASE}/domains/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !isActive })
      })
      loadDomains()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteDomain = async (id) => {
    if (!confirm('Are you sure you want to delete this domain?')) return
    
    try {
      const res = await fetch(`${API_BASE}/domains/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      loadDomains()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteInbox = async (id) => {
    if (!confirm('Are you sure you want to delete this inbox?')) return
    
    try {
      await fetch(`${API_BASE}/inboxes/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      loadInboxes()
      loadStats()
    } catch (err) {
      setError(err.message)
    }
  }

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card-brutal">
          <h2 className="font-display text-4xl text-brutal-black mb-6 text-center">
            ADMIN LOGIN
          </h2>
          
          {error && (
            <div className="mb-4 p-3 border-3 border-red-500 bg-red-100 text-red-700 font-bold">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block font-bold text-brutal-black mb-2 uppercase">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="input-brutal"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block font-bold text-brutal-black mb-2 uppercase">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="input-brutal"
                required
              />
            </div>
            
            <button type="submit" className="btn-brutal w-full">
              LOGIN →
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Admin dashboard
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-4xl text-brutal-black">
          ADMIN PANEL
        </h2>
        <button onClick={handleLogout} className="btn-brutal-danger">
          LOGOUT
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 border-3 border-red-500 bg-red-100 text-red-700 font-bold flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['stats', 'tools', 'gmail', 'domains', 'inboxes', 'tutorial'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setTestImapResult(null); }}
            className={`px-6 py-3 border-4 border-brutal-black font-bold uppercase transition-all
              ${activeTab === tab 
                ? 'bg-brutal-orange shadow-brutal' 
                : 'bg-brutal-white hover:bg-brutal-gray'}`}
          >
            {tab === 'gmail' ? 'GMAIL ACCOUNTS' : tab === 'tools' ? 'TOOLS' : tab}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: 'Active Domains', value: stats.activeDomains, total: stats.totalDomains },
            { label: 'Active Inboxes', value: stats.activeInboxes },
            { label: 'Emails Today', value: stats.emailsToday, total: stats.totalEmails }
          ].map((stat, i) => (
            <div key={i} className="card-brutal text-center">
              <p className="font-display text-5xl text-brutal-orange">{stat.value}</p>
              <p className="font-bold text-brutal-black uppercase mt-2">{stat.label}</p>
              {stat.total !== undefined && (
                <p className="text-sm text-brutal-dark mt-1">/ {stat.total} total</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tools Tab - Master Email (IMAP) */}
      {activeTab === 'tools' && (
        <div className="card-brutal">
          <h3 className="font-display text-2xl mb-2">Master Email (IMAP)</h3>
          <p className="text-brutal-dark text-sm mb-4">
            Daftar email tampungan untuk forward. Bukan cuma 1 email — tambah banyak master email, lalu cek koneksi IMAP (email & app password).
          </p>

          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-brutal-black uppercase text-sm">Daftar Master Email</span>
            <button
              onClick={() => setShowMasterEmailForm(!showMasterEmailForm)}
              className="btn-brutal"
            >
              {showMasterEmailForm ? 'BATAL' : '+ TAMBAH MASTER EMAIL'}
            </button>
          </div>

          {showMasterEmailForm && (
            <form onSubmit={addMasterEmail} className="mb-6 p-4 border-4 border-brutal-black bg-brutal-gray">
              <div className="mb-4">
                <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">Provider</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(emailProviders).map(([key, provider]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleMasterProviderChange(key)}
                      className={`p-2 border-3 border-brutal-black font-bold text-sm transition-all
                        ${selectedMasterProvider === key ? 'bg-brutal-orange shadow-brutal' : 'bg-brutal-white hover:bg-brutal-gray'}`}
                    >
                      {provider.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">Email</label>
                  <input
                    type="email"
                    value={newMasterEmail.email}
                    onChange={(e) => setNewMasterEmail({ ...newMasterEmail, email: e.target.value })}
                    placeholder="postmail@domain.com"
                    className="input-brutal"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">App Password</label>
                  <input
                    type="password"
                    value={newMasterEmail.app_password}
                    onChange={(e) => setNewMasterEmail({ ...newMasterEmail, app_password: e.target.value })}
                    placeholder="16 karakter app password"
                    className="input-brutal"
                    required
                  />
                </div>
              </div>
              {selectedMasterProvider === 'custom' && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">IMAP Host</label>
                    <input
                      type="text"
                      value={newMasterEmail.imap_host}
                      onChange={(e) => setNewMasterEmail({ ...newMasterEmail, imap_host: e.target.value })}
                      placeholder="imap.example.com"
                      className="input-brutal"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">IMAP Port</label>
                    <input
                      type="number"
                      value={newMasterEmail.imap_port}
                      onChange={(e) => setNewMasterEmail({ ...newMasterEmail, imap_port: parseInt(e.target.value) || 993 })}
                      className="input-brutal"
                    />
                  </div>
                </div>
              )}
              <div className="mb-4">
                <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">Keterangan (opsional)</label>
                <input
                  type="text"
                  value={newMasterEmail.description}
                  onChange={(e) => setNewMasterEmail({ ...newMasterEmail, description: e.target.value })}
                  placeholder="e.g. Tampungan domain topad119.com"
                  className="input-brutal"
                />
              </div>
              <button type="submit" className="btn-brutal">SIMPAN MASTER EMAIL</button>
            </form>
          )}

          {testImapResult && (
            <div className={`mb-4 p-3 border-4 border-brutal-black font-bold ${testImapResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {testImapResult.success ? '✓ ' + (testImapResult.message || 'OK') : '✗ ' + (testImapResult.error || 'Gagal')}
            </div>
          )}

          <div className="border-4 border-brutal-black overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brutal-black text-brutal-white font-bold uppercase text-sm">
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">IMAP Server</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Cek Koneksi</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {gmailAccounts.map((account) => (
                  <tr key={account.id} className="border-t-3 border-brutal-black">
                    <td className="p-3 font-bold text-sm break-all">{account.email}</td>
                    <td className="p-3 text-xs font-mono">{account.imap_host}:{account.imap_port}</td>
                    <td className="p-3">
                      <span className={`badge-brutal text-xs ${account.is_active ? '' : 'bg-brutal-gray'}`}>
                        {account.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => testImapConnection(account.id)}
                        disabled={testingImapId === account.id}
                        className="btn-brutal-outline text-xs py-1 px-2 disabled:opacity-50"
                      >
                        {testingImapId === account.id ? 'CEK...' : 'CEK'}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => toggleGmailAccount(account.id, account.is_active)}
                          className="btn-brutal-outline text-xs py-1 px-2"
                        >
                          {account.is_active ? 'NONAKTIFKAN' : 'AKTIFKAN'}
                        </button>
                        <button
                          onClick={() => deleteGmailAccount(account.id)}
                          className="btn-brutal-danger text-xs py-1 px-2"
                        >
                          HAPUS
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {gmailAccounts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-brutal-dark">
                      Belum ada master email. Klik &quot;Tambah Master Email&quot; untuk menambah tampungan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Accounts Tab */}
      {activeTab === 'gmail' && (
        <div className="card-brutal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-2xl">Email Accounts (IMAP)</h3>
            <button onClick={() => setShowGmailForm(!showGmailForm)} className="btn-brutal">
              {showGmailForm ? 'CANCEL' : '+ ADD EMAIL'}
            </button>
          </div>

          {showGmailForm && (
            <form onSubmit={addGmailAccount} className="mb-6 p-4 border-4 border-brutal-black bg-brutal-gray">
              {/* Provider Selection */}
              <div className="mb-4">
                <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">Email Provider</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(emailProviders).map(([key, provider]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleProviderChange(key)}
                      className={`p-2 border-3 border-brutal-black font-bold text-sm transition-all
                        ${selectedProvider === key 
                          ? 'bg-brutal-orange shadow-brutal' 
                          : 'bg-brutal-white hover:bg-brutal-gray'}`}
                    >
                      {provider.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">Email Address</label>
                  <input
                    type="email"
                    value={newGmail.email}
                    onChange={(e) => setNewGmail({ ...newGmail, email: e.target.value })}
                    placeholder={selectedProvider === 'gmail' ? 'yourmail@gmail.com' : 'yourmail@example.com'}
                    className="input-brutal"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">App Password</label>
                  <input
                    type="password"
                    value={newGmail.app_password}
                    onChange={(e) => setNewGmail({ ...newGmail, app_password: e.target.value })}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="input-brutal"
                    required
                  />
                </div>
              </div>

              {/* Custom IMAP Settings */}
              {selectedProvider === 'custom' && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">IMAP Host</label>
                    <input
                      type="text"
                      value={newGmail.imap_host}
                      onChange={(e) => setNewGmail({ ...newGmail, imap_host: e.target.value })}
                      placeholder="imap.example.com"
                      className="input-brutal"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">IMAP Port</label>
                    <input
                      type="number"
                      value={newGmail.imap_port}
                      onChange={(e) => setNewGmail({ ...newGmail, imap_port: parseInt(e.target.value) || 993 })}
                      placeholder="993"
                      className="input-brutal"
                    />
                  </div>
                </div>
              )}

              {/* Show current IMAP settings for non-custom */}
              {selectedProvider !== 'custom' && (
                <div className="mb-4 p-2 bg-brutal-white border-2 border-brutal-black text-sm">
                  <span className="font-bold">IMAP Server:</span> {emailProviders[selectedProvider].host}:{emailProviders[selectedProvider].port}
                </div>
              )}

              <div className="mb-4">
                <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">Description (Optional)</label>
                <input
                  type="text"
                  value={newGmail.description}
                  onChange={(e) => setNewGmail({ ...newGmail, description: e.target.value })}
                  placeholder="e.g. Main account for domain xyz.com"
                  className="input-brutal"
                />
              </div>
              <button type="submit" className="btn-brutal">
                SAVE EMAIL ACCOUNT
              </button>
            </form>
          )}

          <div className="border-4 border-brutal-black overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brutal-black text-brutal-white font-bold uppercase text-sm">
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">IMAP Server</th>
                  <th className="p-3 text-left">Provider</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Domains</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {gmailAccounts.map((account) => (
                  <tr key={account.id} className="border-t-3 border-brutal-black">
                    <td className="p-3 font-bold text-sm break-all">{account.email}</td>
                    <td className="p-3 text-xs font-mono">{account.imap_host}:{account.imap_port}</td>
                    <td className="p-3 text-sm">{account.description || '-'}</td>
                    <td className="p-3">
                      <span className={`badge-brutal text-xs ${account.is_active ? '' : 'bg-brutal-gray'}`}>
                        {account.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-3">{account.domain_count || 0}</td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => toggleGmailAccount(account.id, account.is_active)}
                          className="btn-brutal-outline text-xs py-1 px-2"
                        >
                          {account.is_active ? 'DISABLE' : 'ENABLE'}
                        </button>
                        <button
                          onClick={() => deleteGmailAccount(account.id)}
                          className="btn-brutal-danger text-xs py-1 px-2"
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {gmailAccounts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-brutal-dark">
                      No email accounts configured. Add one to start receiving emails.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-yellow-100 border-4 border-brutal-black">
            <p className="font-bold text-brutal-black mb-2">📌 SUPPORTED EMAIL PROVIDERS:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
              <div className="p-2 bg-white border-2 border-brutal-black">
                <strong>Gmail</strong><br/>
                <span className="text-xs text-brutal-dark">imap.gmail.com</span>
              </div>
              <div className="p-2 bg-white border-2 border-brutal-black">
                <strong>Outlook</strong><br/>
                <span className="text-xs text-brutal-dark">outlook.office365.com</span>
              </div>
              <div className="p-2 bg-white border-2 border-brutal-black">
                <strong>Yahoo</strong><br/>
                <span className="text-xs text-brutal-dark">imap.mail.yahoo.com</span>
              </div>
              <div className="p-2 bg-white border-2 border-brutal-black">
                <strong>Zoho</strong><br/>
                <span className="text-xs text-brutal-dark">imap.zoho.com</span>
              </div>
            </div>
            <p className="font-bold text-brutal-black mb-1">✅ Ready Account:</p>
            <ul className="list-disc list-inside text-sm">
              <li><strong>rheajoshua162@gmail.com</strong> - Gmail IMAP</li>
            </ul>
          </div>
        </div>
      )}

      {/* Domains Tab */}
      {activeTab === 'domains' && (
        <div className="card-brutal">
          <h3 className="font-display text-2xl mb-2">Add Domain</h3>
          <p className="text-brutal-dark text-sm mb-4">
            Pilih master mailbox tempat email forward *@domain akan masuk. Pastikan domain sudah di-pointing ke master email tersebut.
          </p>

          <div className="mb-4 p-4 border-4 border-amber-400 bg-amber-50 text-amber-900 font-bold text-sm">
            ⚠️ Pastikan domain sudah di-pointing <code className="bg-white px-1">*@domain</code> ke master email yang dipilih (di DNS / Email Forward / Squarespace dll). Tanpa itu, email tidak akan sampai ke temp mail.
          </div>

          <form onSubmit={addDomain} className="mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">Domain</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com (tanpa www)"
                  className="input-brutal w-full md:max-w-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-brutal-black mb-2 uppercase text-sm">Forward ke master mailbox (email tampungan)</label>
                <select
                  value={newDomainGmail}
                  onChange={(e) => setNewDomainGmail(e.target.value)}
                  className="input-brutal w-full md:max-w-md"
                >
                  <option value="">-- Pilih master email --</option>
                  {gmailAccounts.filter(g => g.is_active).map((g) => (
                    <option key={g.id} value={g.id}>{g.email}</option>
                  ))}
                </select>
                {newDomainGmail && (
                  <div className="mt-2 flex items-center gap-2">
                    {domainMasterCheckingId === newDomainGmail ? (
                      <span className="text-brutal-dark font-bold text-sm">Cek koneksi...</span>
                    ) : domainMasterCheckResult && domainMasterCheckResult.id === newDomainGmail ? (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 border-4 border-brutal-black font-bold text-sm ${domainMasterCheckResult.success ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                        {domainMasterCheckResult.success ? '✓ Email & App Password benar, bisa diakses' : '✗ Gagal: ' + (domainMasterCheckResult.error || 'cek email/app password')}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-brutal">
                  ADD DOMAIN
                </button>
              </div>
            </div>
          </form>

          <div className="border-4 border-brutal-black overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brutal-black text-brutal-white font-bold uppercase text-sm">
                  <th className="p-4 text-left">Domain</th>
                  <th className="p-4 text-left">Gmail Account</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Inboxes</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((domain) => (
                  <tr key={domain.id} className="border-t-3 border-brutal-black">
                    <td className="p-4 font-bold">{domain.domain}</td>
                    <td className="p-4">
                      <select
                        value={domain.gmail_account_id || ''}
                        onChange={(e) => updateDomainGmail(domain.id, e.target.value)}
                        className="input-brutal text-sm py-1"
                      >
                        <option value="">-- Not assigned --</option>
                        {gmailAccounts.filter(g => g.is_active).map((g) => (
                          <option key={g.id} value={g.id}>{g.email}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`badge-brutal text-xs ${domain.is_active ? '' : 'bg-brutal-gray'}`}>
                        {domain.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-4">{domain.active_inboxes || 0}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleDomain(domain.id, domain.is_active)}
                          className="btn-brutal-outline text-xs py-1 px-3"
                        >
                          {domain.is_active ? 'DISABLE' : 'ENABLE'}
                        </button>
                        <button
                          onClick={() => deleteDomain(domain.id)}
                          className="btn-brutal-danger text-xs py-1 px-3"
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inboxes Tab */}
      {activeTab === 'inboxes' && (
        <div className="card-brutal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-2xl">Active Inboxes</h3>
            <button onClick={loadInboxes} className="btn-brutal-outline text-sm">
              REFRESH
            </button>
          </div>

          <div className="border-4 border-brutal-black overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brutal-black text-brutal-white font-bold uppercase">
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Created</th>
                  <th className="p-4 text-left">Expires</th>
                  <th className="p-4 text-left">Emails</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inboxes.map((inbox) => (
                  <tr key={inbox.id} className="border-t-3 border-brutal-black">
                    <td className="p-4 font-bold">{inbox.username}@{inbox.domain}</td>
                    <td className="p-4 text-sm">{new Date(inbox.created_at).toLocaleString()}</td>
                    <td className="p-4 text-sm">{new Date(inbox.expires_at).toLocaleString()}</td>
                    <td className="p-4">{inbox.email_count}</td>
                    <td className="p-4">
                      <button
                        onClick={() => deleteInbox(inbox.id)}
                        className="btn-brutal-danger text-xs py-1 px-3"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))}
                {inboxes.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-brutal-dark">
                      No active inboxes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tutorial Tab */}
      {activeTab === 'tutorial' && (
        <div className="card-brutal">
          <h3 className="font-display text-3xl mb-6">📚 TUTORIAL: SETUP DOMAIN & GMAIL</h3>
          
          {/* Step 1: Email Provider Setup */}
          <div className="mb-8 p-4 border-4 border-brutal-black">
            <h4 className="font-display text-2xl mb-4 text-brutal-orange">STEP 1: SETUP EMAIL ACCOUNT (IMAP)</h4>
            
            {/* Gmail */}
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-300">
              <p className="font-bold mb-2 text-lg">📧 GMAIL</p>
              <div className="space-y-2 text-sm">
                <p><strong>Enable IMAP:</strong> Gmail → Settings → See all settings → Forwarding and POP/IMAP → Enable IMAP</p>
                <p><strong>App Password:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>Buka <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Security</a> → Enable 2FA</li>
                  <li>App passwords → Generate → Copy 16 karakter</li>
                </ul>
                <p className="text-xs bg-white p-1"><strong>IMAP:</strong> imap.gmail.com:993</p>
              </div>
            </div>

            {/* Outlook */}
            <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300">
              <p className="font-bold mb-2 text-lg">📧 OUTLOOK / HOTMAIL</p>
              <div className="space-y-2 text-sm">
                <p><strong>App Password:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>Buka <a href="https://account.microsoft.com/security" target="_blank" rel="noreferrer" className="text-blue-600 underline">Microsoft Security</a></li>
                  <li>Advanced security options → App passwords → Create new</li>
                </ul>
                <p className="text-xs bg-white p-1"><strong>IMAP:</strong> outlook.office365.com:993</p>
              </div>
            </div>

            {/* Yahoo */}
            <div className="mb-4 p-3 bg-purple-50 border-2 border-purple-300">
              <p className="font-bold mb-2 text-lg">📧 YAHOO MAIL</p>
              <div className="space-y-2 text-sm">
                <p><strong>App Password:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>Buka <a href="https://login.yahoo.com/account/security" target="_blank" rel="noreferrer" className="text-blue-600 underline">Yahoo Account Security</a></li>
                  <li>Enable 2-Step Verification</li>
                  <li>Generate app password → Select "Other App"</li>
                </ul>
                <p className="text-xs bg-white p-1"><strong>IMAP:</strong> imap.mail.yahoo.com:993</p>
              </div>
            </div>

            {/* Zoho */}
            <div className="mb-4 p-3 bg-green-50 border-2 border-green-300">
              <p className="font-bold mb-2 text-lg">📧 ZOHO MAIL (Recommended for Custom Domain)</p>
              <div className="space-y-2 text-sm">
                <p><strong>Setup:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>Buat akun di <a href="https://www.zoho.com/mail/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Zoho Mail</a> (gratis)</li>
                  <li>Settings → Security → App Passwords → Generate</li>
                  <li>Zoho mendukung custom domain gratis!</li>
                </ul>
                <p className="text-xs bg-white p-1"><strong>IMAP:</strong> imap.zoho.com:993</p>
              </div>
            </div>

            {/* iCloud */}
            <div className="mb-4 p-3 bg-gray-50 border-2 border-gray-300">
              <p className="font-bold mb-2 text-lg">📧 iCLOUD MAIL</p>
              <div className="space-y-2 text-sm">
                <p><strong>App Password:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>Buka <a href="https://appleid.apple.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Apple ID</a> → Sign-in and Security</li>
                  <li>App-Specific Passwords → Generate</li>
                </ul>
                <p className="text-xs bg-white p-1"><strong>IMAP:</strong> imap.mail.me.com:993</p>
              </div>
            </div>

            <div className="p-3 bg-yellow-100 border-2 border-yellow-500">
              <p className="font-bold">⚠️ PENTING:</p>
              <p className="text-sm">Semua provider membutuhkan <strong>App Password</strong>, bukan password biasa. App Password biasanya 16 karakter.</p>
            </div>
          </div>

          {/* Step 2: Add Gmail to System */}
          <div className="mb-8 p-4 border-4 border-brutal-black">
            <h4 className="font-display text-2xl mb-4 text-brutal-orange">STEP 2: TAMBAH GMAIL KE SISTEM</h4>
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-brutal-gray">
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Buka tab <strong>GMAIL ACCOUNTS</strong> di atas</li>
                  <li>Klik <strong>+ ADD GMAIL</strong></li>
                  <li>Masukkan email Gmail dan App Password</li>
                  <li>Tambahkan deskripsi (opsional)</li>
                  <li>Klik <strong>SAVE GMAIL ACCOUNT</strong></li>
                </ul>
              </div>

              <div className="p-3 bg-green-100 border-2 border-green-500">
                <p className="font-bold">✅ Gmail yang sudah ready:</p>
                <p className="font-mono">rheajoshua162@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Step 3: Domain Setup */}
          <div className="mb-8 p-4 border-4 border-brutal-black">
            <h4 className="font-display text-2xl mb-4 text-brutal-orange">STEP 3: SETUP DOMAIN</h4>
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-brutal-gray">
                <p className="font-bold mb-2">3.1 Setting DNS Catch-All Forwarding:</p>
                <p className="mb-2">Di domain provider (Cloudflare, Namecheap, dll):</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Buka DNS/Email settings</li>
                  <li>Setup <strong>Catch-All Email Forwarding</strong></li>
                  <li>Forward <code className="bg-brutal-black text-brutal-white px-1">*@yourdomain.com</code> ke Gmail yang sudah di-setup</li>
                  <li>Contoh: <code className="bg-brutal-black text-brutal-white px-1">*@mydomain.com → rheajoshua162@gmail.com</code></li>
                </ul>
              </div>

              <div className="p-3 bg-brutal-gray">
                <p className="font-bold mb-2">3.2 Tambah Domain di Sistem:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Buka tab <strong>DOMAINS</strong></li>
                  <li>Ketik nama domain (e.g., mydomain.com)</li>
                  <li>Pilih Gmail Account yang akan menerima email</li>
                  <li>Klik <strong>ADD DOMAIN</strong></li>
                </ul>
              </div>

              <div className="p-3 bg-blue-100 border-2 border-blue-500">
                <p className="font-bold mb-2">📧 Contoh Cloudflare Email Routing:</p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Dashboard Cloudflare → Email → Email Routing</li>
                  <li>Klik "Catch-all address"</li>
                  <li>Action: Forward to → rheajoshua162@gmail.com</li>
                  <li>Verify email dan Save</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 4: Test */}
          <div className="mb-8 p-4 border-4 border-brutal-black">
            <h4 className="font-display text-2xl mb-4 text-brutal-orange">STEP 4: TEST EMAIL</h4>
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-brutal-gray">
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Buka homepage TempMail</li>
                  <li>Buat inbox baru (e.g., test@yourdomain.com)</li>
                  <li>Kirim email dari Gmail lain ke alamat tersebut</li>
                  <li>Email akan muncul di inbox dalam 2-5 detik</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 border-4 border-red-500 bg-red-50">
            <h4 className="font-display text-2xl mb-4 text-red-600">🔧 TROUBLESHOOTING</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Email tidak masuk?</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Pastikan IMAP enabled di Gmail</li>
                <li>Cek App Password sudah benar</li>
                <li>Pastikan DNS forwarding sudah aktif (bisa delay sampai 24 jam)</li>
                <li>Cek email masuk di Gmail inbox langsung dulu</li>
                <li>Pastikan domain sudah di-assign ke Gmail account di tab DOMAINS</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
