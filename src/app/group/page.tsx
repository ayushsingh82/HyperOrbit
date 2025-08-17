'use client';
import React, { useRef, useState } from "react";

const GROUP = {
  name: "alpha.hl",
  members: 128,
  image: "https://api.dicebear.com/7.x/identicon/svg?seed=alpha",
};

const INITIAL_MESSAGES = [
  { id: 1, user: "Alice", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=alice", text: "Hey everyone! Welcome to alpha.hl 🚀" },
  { id: 2, user: "Bob", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=bob", text: "Hi Alice! Glad to be here." },
  { id: 3, user: "Charlie", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=charlie", text: "What's the next proposal about?" },
  { id: 4, user: "Alice", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=alice", text: "We're voting on the new treasury allocation." },
];

export default function GroupChatPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [
      ...msgs,
      {
        id: msgs.length + 1,
        user: "You",
        avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=you",
        text: input,
      },
    ]);
    setInput("");
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-black py-8 px-2">
      {/* Header */}
      <div className="flex items-center gap-4 w-full max-w-2xl mb-6 p-4 rounded-2xl bg-[#0B1614]/80 border border-[#27FEE0]/40 shadow-lg">
        <img src={GROUP.image} alt={GROUP.name} className="w-12 h-12 rounded-full border border-[#27FEE0] bg-black" />
        <div className="flex flex-col flex-1">
          <span className="text-xl font-bold text-[#27FEE0]">{GROUP.name}</span>
          <span className="text-white/70 text-xs">{GROUP.members} members</span>
        </div>
        <button className="px-4 py-1.5 rounded-lg border border-[#27FEE0] text-[#27FEE0] font-semibold text-xs transition hover:bg-[#27FEE0] hover:text-[#0B1614]">Invite</button>
      </div>
      {/* Chat Area */}
      <div ref={chatRef} className="flex-1 w-full max-w-2xl bg-[#0B1614]/70 border border-[#27FEE0]/20 rounded-2xl p-4 mb-4 overflow-y-auto h-[60vh] shadow-inner">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3 mb-4">
            <img src={msg.avatar} alt={msg.user} className="w-8 h-8 rounded-full border border-[#27FEE0]/40 bg-black" />
            <div>
              <span className="text-[#27FEE0] font-semibold text-xs">{msg.user}</span>
              <div className="text-white/90 text-sm bg-[#27FEE0]/10 rounded-xl px-4 py-2 mt-1 max-w-xs break-words">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Message Input */}
      <form onSubmit={handleSend} className="w-full max-w-2xl flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-lg px-4 py-2 bg-black/80 border border-[#27FEE0]/40 text-white focus:outline-none focus:border-[#27FEE0] transition"
        />
        <button
          type="submit"
          className="px-6 py-2 rounded-lg border-2 border-[#27FEE0] bg-[#27FEE0] text-[#0B1614] font-bold text-base transition hover:bg-transparent hover:text-[#27FEE0]"
        >
          Send
        </button>
      </form>
    </div>
  );
}
