import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareText, SendHorizonal, UserCircle2 } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { apiClient } from "@shared/lib/apiClient";
import { Button } from "@shared/components/Button";
import { useAuth } from "@store/hooks";

type ChatParticipant = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  senderId?: string;
  senderRole?: string;
};

type ChatConversation = {
  conversationId: string;
  participant: ChatParticipant | null;
  lastMessage: string;
  updatedAt: string;
};

const dateLabel = (value?: string) => {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const ChatPage = () => {
  const { userData } = useAuth();
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.conversationId === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const refreshConversations = async () => {
    const { data } = await apiClient.get<{ data: ChatConversation[] }>('/chat/conversations');
    setConversations(data.data || []);
    if (!selectedConversationId && data.data?.length) {
      setSelectedConversationId(data.data[0].conversationId);
    }
  };

  const loadParticipants = async () => {
    setLoadingParticipants(true);
    try {
      const { data } = await apiClient.get<{ data: ChatParticipant[] }>('/chat/participants');
      setParticipants(data.data || []);
    } catch {
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data } = await apiClient.get<{ data: { conversationId: string; messages: ChatMessage[] } }>(`/chat/conversations/${conversationId}/messages`);
      setMessages(data.data?.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadParticipants();
    refreshConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversationId) return;
    loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!userData?.id) return;

    const token = localStorage.getItem("accessToken");
    const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "");
    const socket = io(apiBase || window.location.origin, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (selectedConversationId) {
        socket.emit("chat:join", { conversationId: selectedConversationId });
      }
    });

    socket.on("chat:message", (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId !== selectedConversationId) {
        void refreshConversations();
        return;
      }

      setMessages((current) => {
        const alreadyExists = current.some((message) => message.timestamp === payload.message.timestamp && message.content === payload.message.content);
        if (alreadyExists) return current;
        return [...current, payload.message];
      });
      void refreshConversations();
    });

    socket.on("chat:error", (payload: { message?: string }) => {
      setSocketError(payload?.message || "Unable to send message.");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedConversationId, userData?.id]);

  useEffect(() => {
    if (!selectedConversationId || !socketRef.current) return;
    socketRef.current.emit("chat:join", { conversationId: selectedConversationId });
  }, [selectedConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversationId]);

  const openConversation = async (participantId: string) => {
    try {
      const { data } = await apiClient.post<{ data: { conversationId: string; participant: ChatParticipant; created: boolean } }>('/chat/conversations', {
        participantId,
      });
      const conversationId = data.data.conversationId;
      setSelectedConversationId(conversationId);
      await refreshConversations();
    } catch (error) {
      console.error("Failed to start conversation", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversationId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const payload = draft.trim();
      const { data } = await apiClient.post<{ data: { message: ChatMessage; conversationId: string } }>(`/chat/conversations/${selectedConversationId}/messages`, {
        content: payload,
      });
      setDraft("");
      setMessages((current) => [...current, data.data.message]);
      await refreshConversations();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--green-icon)]">Messaging</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Loan review conversations</h1>
        </div>
      </div>

      <div className="grid min-h-[700px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-gray-200 bg-gray-50 md:border-b-0 md:border-r">
          <div className="border-b border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700">Contacts</p>
          </div>

          <div className="space-y-2 p-3">
            {loadingParticipants ? (
              <p className="px-2 py-3 text-sm text-gray-500">Loading reviewers...</p>
            ) : participants.length ? (
              participants.map((participant) => (
                <button
                  key={participant.id}
                  type="button"
                  onClick={() => openConversation(participant.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white p-3 text-left transition hover:border-[var(--green-icon)] hover:bg-green-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--green-background)] text-sm font-semibold text-[var(--green-icon)]">
                    {participant.fullName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">{participant.fullName}</span>
                    <span className="block truncate text-xs text-gray-500">{participant.role}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-2 py-3 text-sm text-gray-500">No reviewers available.</p>
            )}
          </div>

          <div className="border-t border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700">Recent</p>
          </div>
          <div className="space-y-2 p-3 pb-5">
            {conversations.length ? (
              conversations.map((conversation) => (
                <button
                  key={conversation.conversationId}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.conversationId)}
                  className={`flex w-full flex-col rounded-2xl border p-3 text-left transition ${
                    selectedConversationId === conversation.conversationId
                      ? "border-[var(--green-icon)] bg-green-50"
                      : "border-transparent bg-white hover:border-gray-200"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">{conversation.participant?.fullName || "Conversation"}</span>
                    <span className="text-[10px] text-gray-400">{dateLabel(conversation.updatedAt)}</span>
                  </span>
                  <span className="mt-2 line-clamp-2 text-xs text-gray-600">{conversation.lastMessage}</span>
                </button>
              ))
            ) : (
              <p className="px-2 py-3 text-sm text-gray-500">No conversations yet.</p>
            )}
          </div>
        </aside>

        <main className="flex min-h-0 flex-col">
          {selectedConversation ? (
            <>
              <header className="flex items-center justify-between border-b border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--green-background)] text-sm font-semibold text-[var(--green-icon)]">
                    {selectedConversation.participant?.fullName?.slice(0, 2).toUpperCase() || "CH"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedConversation.participant?.fullName || "Conversation"}</p>
                    <p className="text-xs text-gray-500">{selectedConversation.participant?.role || "Reviewer"}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Active
                </span>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
                {loadingMessages ? (
                  <p className="text-sm text-gray-500">Loading conversation...</p>
                ) : messages.length ? (
                  messages.map((message, index) => {
                    const isMine = message.senderId ? message.senderId === userData?.id : message.role === "user";
                    return (
                      <div key={`${message.timestamp}-${index}`} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${isMine ? "bg-[var(--green-icon)] text-white" : "bg-white text-gray-800"}`}>
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                          <p className={`mt-1 text-[10px] ${isMine ? "text-green-100" : "text-gray-400"}`}>
                            {dateLabel(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    Start the conversation with a quick update.
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-gray-200 bg-white p-3">
                {socketError ? (
                  <p className="mb-2 text-xs text-red-600">{socketError}</p>
                ) : null}
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder="Write a message..."
                    className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[var(--green-icon)]"
                  />
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => void handleSendMessage()}
                    disabled={!draft.trim() || sending}
                    className="shrink-0"
                    leftIcon={<SendHorizonal className="h-4 w-4" />}
                  >
                    {sending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-gray-500">
              <UserCircle2 className="h-12 w-12 text-gray-300" />
              <div>
                <p className="text-lg font-semibold text-gray-700">No active chat</p>
                <p className="text-sm">Select a reviewer to begin a conversation.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
