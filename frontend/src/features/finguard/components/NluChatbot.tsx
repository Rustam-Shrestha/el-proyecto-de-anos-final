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
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b bg-blue-600 text-white rounded-t-lg">
        <h2 className="font-semibold">FinGuard Financial Assistant</h2>
        <p className="text-xs text-blue-100">Ask me anything about your finances</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {formatMessage(msg.content)}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <span className="text-gray-500 text-sm">Analyzing...</span>
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  disabled={chatMutation.isPending}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Ask me about your finances..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={chatMutation.isPending}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={chatMutation.isPending || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default NluChatbot;
