import React, { useState, useRef, useEffect } from "react";
import { useChatMutation } from "../api/finguardApi";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How much loan can I get for ₹5,00,000?",
  "What's my average monthly income?",
  "Where do I spend the most?",
  "How much do I save monthly?",
  "Show my recent transactions",
  "What's my credit score?",
];

const NluChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I can help you analyze your finances. Ask me about loan eligibility, income, spending patterns, or anything about your financial health.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = useChatMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message: string) => {
    if (!message.trim() || chatMutation.isPending) return;

    const userMsg: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const result = await chatMutation.mutateAsync({ message, sessionId });
      const botMsg: Message = { role: "assistant", content: result.answer };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    }
  };

  const formatMessage = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("•")) {
        return (
          <p key={i} className="ml-2 text-sm">
            {line}
          </p>
        );
      }
      return (
        <p key={i} className="text-sm">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="panel flex flex-col h-full p-0 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-200 bg-[var(--surface-muted)] text-gray-900 rounded-t-2xl">
        <h2 className="text-sm font-semibold text-gray-900">FinGuard Financial Assistant</h2>
        <p className="text-xs text-gray-500">Ask about loan eligibility, income, or spending habits</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[460px]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-gray-100 text-gray-900 border border-gray-200"
              }`}
            >
              {formatMessage(msg.content)}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3.5 py-2.5 rounded-2xl border border-gray-200">
              <span className="text-gray-500 text-xs">Analyzing financial data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Persistent horizontal scrollable suggestions chip bar */}
      <div className="border-t border-gray-100 px-4 py-2 bg-gray-50/70">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hidden py-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 shrink-0 mr-1">Suggestions:</span>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              disabled={chatMutation.isPending}
              className="text-xs whitespace-nowrap bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-700 hover:bg-[var(--primary-soft)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors shrink-0 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 p-3 flex gap-2 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Ask me about your finances..."
          className="flex-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--primary)]"
          disabled={chatMutation.isPending}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={chatMutation.isPending || !input.trim()}
          className="rounded-xl bg-[var(--primary)] text-white px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default NluChatbot;
