import { useState } from 'react'
import { IoSendSharp } from "react-icons/io5";
function MessageInput({ onSend, msgError }) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSend(message)
    setMessage('')
  }

return (
    <form onSubmit={handleSubmit} className="flex pb-[1.06rem] p-2 bg-neutral-900">
        <input
            className="flex-1 rounded p-2 mr-2 bg-neutral-800 text-white outline-none"
            placeholder="Type a message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
        />
        <button
            className="bg-neutral-800 cursor-pointer text-white px-4 py-2 rounded hover:bg-neutral-800/50 flex items-center justify-center"
            type="submit"
            aria-label="Send"
        >
            <IoSendSharp className="h-5 w-5" />
        </button>
        {msgError && <div className="text-red-600 ml-2">{msgError}</div>}
    </form>
)
}

export default MessageInput
