function ChatWindow({ messages, user, selectedUser, messagesEndRef }) {
  return (
    <div className="flex-1 h-0 min-h-124 scrollbar-none overflow-y-auto p-4 bg-transparent text-white">
      {selectedUser ? (
        <>
          {messages.map((msg, i) => (
            <div key={i} className={`mb-2 flex ${msg.sender === user ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3 py-2 rounded-lg ${msg.sender === user ? 'bg-green-900 rounded-tr-none ' : 'bg-neutral-700 rounded-tl-none'}`}>
                <span>{msg.message}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      ) : (
        <div className="text-gray-400">No user selected.</div>
      )}
    </div>
  )
}

export default ChatWindow
