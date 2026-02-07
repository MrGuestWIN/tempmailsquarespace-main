import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Setup() {
  const [activeTab, setActiveTab] = useState('cloudflare')

  const providers = {
    cloudflare: {
      name: 'Cloudflare',
      icon: '☁️',
      steps: [
        'Login ke Cloudflare → pilih domain kamu',
        'Klik "Email" di sidebar kiri',
        'Klik "Email Routing" → Enable jika belum aktif',
        'Scroll ke "Routing rules" → klik "Create address"',
        'Pilih "Catch-all address"',
        'Action: "Forward to" → isi email Gmail kamu',
        'Klik "Save"',
        'Verifikasi email di Gmail jika diminta'
      ]
    },
    squarespace: {
      name: 'Squarespace',
      icon: '⬛',
      steps: [
        'Login ke Squarespace → buka Settings',
        'Klik "Domains" → pilih domain kamu',
        'Klik "Email" di menu domain',
        'Klik "Email Forwarding"',
        'Klik "Add Forwarder"',
        'Email Prefix: ketik * (bintang/asterisk)',
        'Forward To: isi email Gmail kamu',
        'Klik "Save"',
        'Verifikasi email di Gmail jika diminta'
      ]
    },
    namecheap: {
      name: 'Namecheap',
      icon: '🟠',
      steps: [
        'Login ke Namecheap → Domain List',
        'Klik "Manage" pada domain kamu',
        'Klik tab "Email Forwarding"',
        'Enable Email Forwarding',
        'Alias: ketik * (catch-all)',
        'Forward To: isi email Gmail kamu',
        'Klik "Add Forwarder"',
        'Verifikasi email di Gmail jika diminta'
      ]
    },
    godaddy: {
      name: 'GoDaddy',
      icon: '🟢',
      steps: [
        'Login ke GoDaddy → My Products',
        'Klik domain kamu → "DNS"',
        'Scroll ke "Forwarding" → "Email Forwarding"',
        'Klik "Add" atau "Create"',
        'Forward: ketik * (catch-all)',
        'To: isi email Gmail kamu',
        'Klik "Save"',
        'Verifikasi email di Gmail jika diminta'
      ]
    },
    googledomains: {
      name: 'Google Domains',
      icon: '🔵',
      steps: [
        'Login ke Google Domains',
        'Pilih domain kamu',
        'Klik "Email" di sidebar',
        'Klik "Email Forwarding"',
        'Klik "Add email alias"',
        'Alias: ketik * (catch-all)',
        'Forward to: isi email Gmail kamu',
        'Klik "Add"'
      ]
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-display text-5xl md:text-7xl text-brutal-black mb-4 tracking-wider">
          SETUP<br />
          <span className="text-brutal-orange" style={{ WebkitTextStroke: '2px #1A1A1A' }}>
            GUIDE
          </span>
        </h2>
        <p className="text-lg font-brutal text-brutal-dark">
          Panduan lengkap untuk menambahkan domain kamu
        </p>
      </div>

      {/* How it works */}
      <div className="card-brutal mb-8">
        <h3 className="font-display text-2xl text-brutal-black mb-4">🔧 CARA KERJA</h3>
        <div className="grid md:grid-cols-4 gap-4 text-center">
          <div className="p-4 border-4 border-brutal-black bg-brutal-gray">
            <div className="text-3xl mb-2">1️⃣</div>
            <p className="font-bold text-sm">Email masuk ke<br />user@domain.com</p>
          </div>
          <div className="p-4 border-4 border-brutal-black bg-brutal-orange">
            <div className="text-3xl mb-2">2️⃣</div>
            <p className="font-bold text-sm">Domain forward<br />ke Gmail</p>
          </div>
          <div className="p-4 border-4 border-brutal-black bg-brutal-gray">
            <div className="text-3xl mb-2">3️⃣</div>
            <p className="font-bold text-sm">Server fetch<br />via IMAP</p>
          </div>
          <div className="p-4 border-4 border-brutal-black bg-brutal-orange">
            <div className="text-3xl mb-2">4️⃣</div>
            <p className="font-bold text-sm">Email tampil<br />di inbox user</p>
          </div>
        </div>
      </div>

      {/* Step 1: Gmail App Password */}
      <div className="card-brutal mb-8">
        <h3 className="font-display text-2xl text-brutal-black mb-4">
          📧 STEP 1: BUAT GMAIL APP PASSWORD
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">1.</span>
            <span>Buka <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-brutal-orange underline font-bold">Google Account → Security</a></span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">2.</span>
            <span>Aktifkan <strong>2-Step Verification</strong> (wajib!)</span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">3.</span>
            <span>Cari <strong>"App passwords"</strong> di search bar</span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">4.</span>
            <span>Buat app password baru → pilih <strong>"Mail"</strong></span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">5.</span>
            <span>Copy <strong>16 karakter password</strong> yang muncul</span>
          </div>
        </div>
        <div className="mt-4 p-4 border-4 border-dashed border-brutal-black bg-yellow-50">
          <p className="font-bold text-brutal-black">
            ⚠️ Simpan password ini! Akan digunakan untuk konfigurasi server.
          </p>
        </div>
      </div>

      {/* Step 2: Email Forwarding */}
      <div className="card-brutal mb-8">
        <h3 className="font-display text-2xl text-brutal-black mb-4">
          📨 STEP 2: SETUP EMAIL FORWARDING (CATCH-ALL)
        </h3>
        
        <p className="text-brutal-dark mb-4">
          Pilih provider domain kamu untuk melihat tutorial:
        </p>

        {/* Provider Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(providers).map(([key, provider]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 border-4 border-brutal-black font-bold uppercase text-sm transition-all
                ${activeTab === key 
                  ? 'bg-brutal-orange text-brutal-black shadow-brutal' 
                  : 'bg-brutal-white text-brutal-black hover:bg-brutal-gray'}`}
            >
              {provider.icon} {provider.name}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {providers[activeTab].steps.map((step, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white"
            >
              <span className="font-bold text-brutal-orange min-w-[24px]">{index + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 border-4 border-dashed border-brutal-black bg-green-50">
          <p className="font-bold text-brutal-black">
            ✅ Setelah setup, semua email ke *@domain.com akan di-forward ke Gmail!
          </p>
        </div>
      </div>

      {/* Step 3: Add to Admin */}
      <div className="card-brutal mb-8">
        <h3 className="font-display text-2xl text-brutal-black mb-4">
          ⚙️ STEP 3: TAMBAH DOMAIN DI ADMIN PANEL
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">1.</span>
            <span>Buka <Link to="/admin" className="text-brutal-orange underline font-bold">Admin Panel</Link></span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">2.</span>
            <span>Login dengan username & password admin</span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">3.</span>
            <span>Klik tab <strong>"DOMAINS"</strong></span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">4.</span>
            <span>Ketik nama domain kamu (contoh: <code className="bg-brutal-gray px-2 py-1">example.com</code>)</span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">5.</span>
            <span>Klik <strong>"ADD DOMAIN"</strong></span>
          </div>
        </div>
      </div>

      {/* Step 4: Test */}
      <div className="card-brutal mb-8 bg-brutal-orange">
        <h3 className="font-display text-2xl text-brutal-black mb-4">
          🧪 STEP 4: TEST EMAIL
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">1.</span>
            <span>Kembali ke <Link to="/" className="text-brutal-orange underline font-bold">Home</Link></span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">2.</span>
            <span>Pilih domain yang baru ditambah</span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">3.</span>
            <span>Generate email random atau buat custom</span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">4.</span>
            <span>Kirim email dari HP/email lain ke alamat tersebut</span>
          </div>
          <div className="flex items-start gap-3 p-3 border-4 border-brutal-black bg-brutal-white">
            <span className="font-bold text-brutal-orange">5.</span>
            <span>Tunggu 2-5 detik, email akan muncul otomatis! 🎉</span>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="card-brutal">
        <h3 className="font-display text-2xl text-brutal-black mb-4">❓ FAQ</h3>
        <div className="space-y-4">
          <div className="p-4 border-4 border-brutal-black bg-brutal-white">
            <p className="font-bold text-brutal-orange">Email tidak masuk?</p>
            <p className="text-brutal-dark mt-1">
              • Pastikan catch-all sudah di-setup dengan benar<br />
              • Cek Gmail spam folder<br />
              • Tunggu 5-10 menit untuk propagasi<br />
              • Pastikan Gmail App Password benar
            </p>
          </div>
          <div className="p-4 border-4 border-brutal-black bg-brutal-white">
            <p className="font-bold text-brutal-orange">Apa itu catch-all?</p>
            <p className="text-brutal-dark mt-1">
              Catch-all (*) artinya SEMUA email ke domain kamu (apapun@domain.com) 
              akan di-forward ke 1 email Gmail.
            </p>
          </div>
          <div className="p-4 border-4 border-brutal-black bg-brutal-white">
            <p className="font-bold text-brutal-orange">Berapa lama inbox aktif?</p>
            <p className="text-brutal-dark mt-1">
              Inbox otomatis expire dalam 20 menit. User bisa extend waktu jika diperlukan.
            </p>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="text-center mt-8">
        <Link to="/" className="btn-brutal inline-block">
          ← KEMBALI KE HOME
        </Link>
      </div>
    </div>
  )
}
