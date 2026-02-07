import { Outlet, Link, useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b-4 border-brutal-black bg-brutal-orange">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 border-4 border-brutal-black bg-brutal-white flex items-center justify-center
                          group-hover:shadow-brutal transition-all">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 8l9 6 9-6" />
                <rect x="3" y="6" width="18" height="13" rx="1" />
              </svg>
            </div>
            <h1 className="font-display text-4xl text-brutal-black tracking-wider">
              TEMPMAIL
            </h1>
          </Link>
          
          <nav className="flex gap-2 md:gap-4">
            <a 
              href="https://mrguest.pro/" 
              className="px-4 py-3 font-bold border-4 border-brutal-black bg-brutal-black text-brutal-orange 
                         shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 
                         transition-all duration-100 uppercase text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12l9-9 9 9" />
                <path d="M9 21V12h6v9" />
              </svg>
              <span className="hidden md:inline">MAIN MENU</span>
            </a>
            {location.pathname !== '/' && (
              <Link to="/" className="btn-brutal-outline text-sm">
                ← NEW INBOX
              </Link>
            )}
            <Link to="/setup" className="btn-brutal-outline text-sm">
              📖 SETUP
            </Link>
            <Link to="/admin" className="btn-brutal-outline text-sm">
              ADMIN
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-brutal-black bg-brutal-black text-brutal-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center font-brutal">
          <p className="text-brutal-orange font-bold">TEMPMAIL</p>
          <p className="text-sm mt-2 text-brutal-gray">
            Disposable email service • Emails expire in 20 minutes
          </p>
        </div>
      </footer>
    </div>
  )
}
