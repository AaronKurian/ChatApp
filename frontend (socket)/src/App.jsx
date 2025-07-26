import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import './App.css'

function App() {
  const [user, setUser] = useState(() => localStorage.getItem('user') || null)

  useEffect(() => {
    if (user) localStorage.setItem('user', user)
    else localStorage.removeItem('user')
  }, [user])

  return (
    <Router>
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
