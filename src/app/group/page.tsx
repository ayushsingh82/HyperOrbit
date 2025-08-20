'use client';
import React, { useRef, useState } from "react";

const GROUP = {
  name: "alpha.hl",
  members: 128,
  image: "https://api.dicebear.com/7.x/identicon/svg?seed=alpha",
};

const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/identicon/svg?seed=alice",
  "https://api.dicebear.com/7.x/identicon/svg?seed=bob",
  "https://api.dicebear.com/7.x/identicon/svg?seed=charlie",
  "https://api.dicebear.com/7.x/identicon/svg?seed=david",
  "https://api.dicebear.com/7.x/identicon/svg?seed=emma",
  "https://api.dicebear.com/7.x/identicon/svg?seed=frank"
];

const INITIAL_MESSAGES = [
  { id: 1, user: "Alice", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=alice", text: "Hey everyone! Welcome to alpha.hl 🚀" },
  { id: 2, user: "Bob", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=bob", text: "Hi Alice! Glad to be here." },
  { id: 3, user: "Charlie", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=charlie", text: "What's the next proposal about?" },
  { id: 4, user: "Alice", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=alice", text: "We're voting on the new treasury allocation." },
];

export default function GroupChatPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const emojis = ["😀", "😂", "🤔", "👍", "🎉", "🚀", "💡", "🔥", "💎", "📈", "🎯", "⚡"];

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [
      ...msgs,
      {
        id: msgs.length + 1,
        user: "You",
        avatar: selectedAvatar,
        text: input,
      },
    ]);
    setInput("");
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }

  function addEmoji(emoji: string) {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  }

  function startRecording() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              // Handle voice message - for now just add a text indicator
              setMessages(msgs => [...msgs, {
                id: msgs.length + 1,
                user: "You",
                avatar: selectedAvatar,
                text: "🎤 Voice message recorded",
              }]);
            }
          };
          
          mediaRecorder.start();
          setIsRecording(true);
        })
        .catch(err => console.error('Error accessing microphone:', err));
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
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

      {/* Avatar Selection */}
      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0B1614]/60 border border-[#27FEE0]/20">
          <span className="text-[#27FEE0] font-semibold text-sm">Your Avatar:</span>
          <div className="relative">
            <img
              src={selectedAvatar}
              alt="Your Avatar"
              className="w-8 h-8 rounded-full border border-[#27FEE0] cursor-pointer hover:scale-110 transition"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            />
            {showAvatarPicker && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-[#0B1614] border border-[#27FEE0]/40 rounded-xl shadow-lg z-10">
                <div className="grid grid-cols-3 gap-2">
                  {AVATAR_OPTIONS.map((avatar, index) => (
                    <img
                      key={index}
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                      className={`w-10 h-10 rounded-full border-2 cursor-pointer transition ${
                        selectedAvatar === avatar ? 'border-[#27FEE0]' : 'border-[#27FEE0]/40'
                      } hover:scale-110`}
                      onClick={() => {
                        setSelectedAvatar(avatar);
                        setShowAvatarPicker(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={chatRef} className="flex-1 w-full max-w-2xl bg-[#0B1614]/70 border border-[#27FEE0]/20 rounded-2xl p-4 mb-4 overflow-y-auto h-[50vh] shadow-inner">
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

      {/* Enhanced Message Input */}
      <form onSubmit={handleSend} className="w-full max-w-2xl">
        <div className="flex gap-2 mb-2">
          {/* Avatar Picker Button */}
          <button
            type="button"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="px-3 py-2 rounded-lg border border-[#27FEE0]/40 text-[#27FEE0] hover:border-[#27FEE0] transition"
          >
            👤
          </button>
          
          {/* Emoji Picker Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-3 py-2 rounded-lg border border-[#27FEE0]/40 text-[#27FEE0] hover:border-[#27FEE0] transition"
          >
            😀
          </button>
          
          {/* Voice Recording Button */}
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={`px-3 py-2 rounded-lg border transition ${
              isRecording 
                ? 'border-red-500 text-red-500 bg-red-500/20' 
                : 'border-[#27FEE0]/40 text-[#27FEE0] hover:border-[#27FEE0]'
            }`}
          >
            {isRecording ? '🔴' : '🎤'}
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-3 p-3 bg-[#0B1614] border border-[#27FEE0]/40 rounded-xl shadow-lg">
            <div className="grid grid-cols-6 gap-2">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="text-2xl hover:scale-125 transition cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
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
        </div>
      </form>
    </div>
  );
}
