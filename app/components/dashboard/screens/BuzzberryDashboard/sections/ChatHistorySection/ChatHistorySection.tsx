import React from 'react'
import { useAIChat } from '@/hooks/useAIChat'

interface ChatSession {
  id: string
  title: string
  lastMessage: string
  lastUpdated: string
  messageCount: number
}
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ChatHistorySectionProps {
  onClose: () => void
  onChatSelect?: (chatId: string) => void
}

export const ChatHistorySection: React.FC<ChatHistorySectionProps> = ({ 
  onClose, 
  onChatSelect 
}) => {
  const { 
    chatHistory, 
    removeChat, 
    clearHistory, 
    formatTimestamp, 
    refreshChatHistory // <-- add this
  } = useAIChat()

  const handleChatClick = (chatId: string) => {
    if (onChatSelect) {
      onChatSelect(chatId)
    }
    onClose()
  }

  const handleRemoveChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this chat?')) {
      removeChat(chatId)
    }
  }

  const handleClearAll = () => {
    if (!confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) return
    // Prefer authenticated server endpoint that soft-deletes all sessions for current user
    fetch('/api/chat-history/clear-all', { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        await refreshChatHistory()
      })
      .catch(() => {
        // Fallback to legacy clear by userId via client hook
        clearHistory()
      })
  }

  return (
    <aside className="h-full border-l border-[#2c3954] bg-[#0f1419] overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5">
          <h2 className="font-normal text-white text-lg tracking-[-0.11px] leading-5">
            Chat History
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
            <button 
              onClick={onClose}
              className="h-5 w-5 p-0 bg-transparent border-none outline-none cursor-pointer"
            >
              <img 
                className="h-5 w-5 transition-transform duration-200 hover:scale-110"
                alt="Close" 
                src="/cancel-01 copy.svg"
              />
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-5 pb-5">
          <Button 
            className="w-full h-12 bg-[#5661f6] hover:bg-[#4752e0] rounded-full flex items-center justify-center gap-2"
            onClick={() => {
              // Clear current session and redirect to AI search page
              window.location.href = '/dashboard/aisearch';
              setTimeout(() => {
                refreshChatHistory();
              }, 500);
            }}
          >
            <img 
              className="h-3 w-3" 
              alt="Plus" 
              src="/plus-icon.svg"
            />
            <span className="font-medium text-white text-sm">New Chat</span>
          </Button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-gray-300 font-medium mb-2">No chat history</h3>
              <p className="text-gray-500 text-sm">Your conversations will appear here</p>
            </div>
          ) : (
            chatHistory.map((chat: ChatSession) => (
              <div key={chat.id} className="relative group cursor-pointer overflow-hidden" onClick={() => handleChatClick(chat.id)}>
                <Card className="bg-transparent border-none shadow-none hover:bg-gray-800/30 transition-colors">
                  <Separator className="w-full bg-gray-700" />
                  <CardContent className="p-3.5 overflow-hidden">
                    <div className="flex items-start gap-3">
                      {/* Blue dot indicator */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full shadow-[inset_0px_2px_3px_#0304142e,inset_0px_-2px_3px_#0304142e] [background:radial-gradient(50%_50%_at_37%_31%,rgba(133,141,255,1)_0%,rgba(86,97,246,1)_100%)]">
                          <div className="w-full h-full rounded-full blur-[2px] [background:radial-gradient(50%_50%_at_37%_31%,rgba(133,141,255,1)_0%,rgba(86,97,246,1)_100%)]" />
                        </div>
                      </div>
                      
                      {/* Chat item content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-6">
                            <h3 className="font-medium text-white text-sm tracking-[-0.15px] leading-[21px] whitespace-nowrap overflow-hidden text-ellipsis">
                              {chat.title}
                            </h3>
                            <p className="mt-2 font-medium text-white text-xs tracking-[-0.07px] leading-5 line-clamp-2 break-words">
                              {chat.lastMessage}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(chat.lastUpdated)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {chat.messageCount} message{chat.messageCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={(e) => handleRemoveChat(e, chat.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 text-gray-400 hover:text-red-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <Separator className="w-full bg-gray-700" />
                </Card>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {chatHistory.length > 0 && (
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-500 text-center">
              {chatHistory.length} conversation{chatHistory.length !== 1 ? 's' : ''} saved
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}