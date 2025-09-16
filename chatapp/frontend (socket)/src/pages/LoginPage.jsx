import { useState } from 'react'
import { FaRegUser } from "react-icons/fa";
import { HiOutlineLockClosed } from "react-icons/hi";
import { IoEye, IoEyeOff } from 'react-icons/io5'

const API_URL = process.env.REACT_APP_API_URL
console.log(API_URL)

function LoginPage({ setUser }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message)
      setUser(username)
    } catch (err) {
      setAuthError(err.message)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-w-screen min-h-screen bg-neutral-950 px-2">
      <form
        onSubmit={handleAuth}
        className="bg-neutral-800/10 text-white border border-white/50 py-10 px-4 sm:py-12 sm:px-6 rounded-xl shadow w-full max-w-xs sm:max-w-md md:max-w-lg"
      >
        <h2 className="text-2xl mb-10 sm:mb-12 font-bold text-center">Login / Signup</h2>
        <div className="relative mb-4">
          <FaRegUser size={20} className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full p-2 pl-9 border-b outline-none focus:border-b-2 focus:border-blue-400/20 bg-transparent"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="relative mb-8">
          <HiOutlineLockClosed size={24} className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full p-2 pl-9 pr-10 border-b outline-none focus:border-b-2 focus:border-blue-400/20 bg-transparent"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xl text-gray-400 focus:outline-none"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
          >
            {showPassword ? <IoEyeOff /> : <IoEye />}
          </button>
        </div>
        <button className="w-full bg-gray-600/20 cursor-pointer text-white py-2 rounded hover:bg-slate-900/10 border border-white/30 transition" type="submit">
          Login / Signup
        </button>
        {authError && <div className="text-red-600 mt-2 text-center">{authError}</div>}
      </form>
    </div>
  )
}

export default LoginPage
