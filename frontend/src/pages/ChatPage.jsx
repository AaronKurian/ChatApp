import { useState, useEffect, useRef } from 'react'
import UserList from '../components/UserList'
import ChatWindow from '../components/ChatWindow'
import MessageInput from '../components/MessageInput'

const API_URL = 'http://localhost:3000'

function ChatPage({ user, setUser }) {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgError, setMsgError] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then(res => res.json())
      .then(data => setUsers(data.filter(u => u.username !== user)))
      .catch(() => setUsers([]))
  }, [user])

  useEffect(() => {
    if (!selectedUser) return
    let isMounted = true
    fetch(`${API_URL}/messages?user1=${user}&user2=${selectedUser}`)
      .then(res => res.json())
      .then(data => { if (isMounted) setMessages(data) })
      .catch(() => { if (isMounted) setMessages([]) })
    return () => { isMounted = false }
  }, [user, selectedUser])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (message) => {
    setMsgError('')
    if (!message.trim()) return
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: user, receiver: selectedUser, message })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message)
      fetch(`${API_URL}/messages?user1=${user}&user2=${selectedUser}`)
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(() => {})
    } catch (err) {
      setMsgError(err.message)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen min-w-screen bg-neutral-950 transition-colors duration-300">
      <aside className="w-full md:w-72 bg-neutral-900/80 border-r border-neutral-800 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-center h-16 border-b border-neutral-800">
          <span className="text-3xl font-extrabold text-white tracking-wide">Chat Users</span>
        </div>
        <div className="flex-1">
          <UserList
            users={users}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
        </div>
        <div className="p-4 py-6 border-t scrollbar-none border-neutral-800">
          <button
            className="w-full py-2 rounded bg-red-600/30 border border-red-600/90 hover:bg-red-700/60 cursor-pointer text-white font-semibold transition"
            onClick={() => setUser(null)}
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col bg-neutral-800">
        <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center min-h-[64px]">
          <span className="text-lg  md:text-xl font-semibold text-white">
            {selectedUser ? (
              <>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 align-middle"></span>
                Chat with <span className="font-bold">{selectedUser}</span>
              </>
            ) : (
              <span className="text-neutral-400">Select a user to chat</span>
            )}
          </span>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-neutral-900/80 px-2 py-4">
            <ChatWindow
              messages={messages}
              user={user}
              selectedUser={selectedUser}
              messagesEndRef={messagesEndRef}
            />
          </div>
          {selectedUser && (
            <div className="bg-neutral-900 border-t border-neutral-800 px-4 py-3">
              <MessageInput onSend={handleSend} msgError={msgError} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ChatPage
