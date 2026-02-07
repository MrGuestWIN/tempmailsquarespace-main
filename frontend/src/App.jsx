import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Inbox from './pages/Inbox'
import Admin from './pages/Admin'
import Setup from './pages/Setup'
import Layout from './components/Layout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="inbox/:sessionId" element={<Inbox />} />
        <Route path="admin" element={<Admin />} />
        <Route path="setup" element={<Setup />} />
      </Route>
    </Routes>
  )
}

export default App
