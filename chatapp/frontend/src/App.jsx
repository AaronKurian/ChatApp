import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import './App.css'

function App() {
  const [user, setUser] = useState(() => localStorage.getItem('user') || null)
  const [installPromptEvent, setInstallPromptEvent] = useState(null)
  const [showInstallBar, setShowInstallBar] = useState(false)

  useEffect(() => {
    if (user) localStorage.setItem('user', user)
    else localStorage.removeItem('user')
  }, [user])

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPromptEvent(e)
      setShowInstallBar(true)
    }
    const handleAppInstalled = () => {
      setInstallPromptEvent(null)
      setShowInstallBar(false)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return (
    <Router>
      {showInstallBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 border-t border-neutral-800 text-white px-4 py-3 flex items-center justify-between">
          <span className="text-sm sm:text-base">Install this app for a better experience</span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-neutral-700 hover:bg-neutral-600 border border-neutral-500 cursor-pointer"
              onClick={() => setShowInstallBar(false)}
            >
              Not now
            </button>
            <button
              className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 border border-green-600 cursor-pointer"
              onClick={async () => {
                if (!installPromptEvent) return
                // @ts-ignore - prompt exists on event in browsers
                installPromptEvent.prompt()
                const { outcome } = await installPromptEvent.userChoice
                if (outcome === 'accepted') setShowInstallBar(false)
              }}
            >
              Install
            </button>
          </div>
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            !user ? <LoginPage setUser={setUser} /> : <Navigate to="/chat" replace />
          }
        />
        <Route
          path="/chat"
          element={
            user ? <ChatPage user={user} setUser={setUser} /> : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to={user ? "/chat" : "/"} replace />} />
      </Routes>
    </Router>
  )
}

export default App
