import { useState, useRef, useEffect } from 'react'
import PageHeader from '../components/common/PageHeader'
import {
  demoInitialMessages,
  demoSuggestedQuestions,
} from '../data/demoData'
import { generateAssistantResponse } from '../services/assistantService'
import type { ChatMessage } from '../types'
import styles from './AIAssistantPage.module.css'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(demoInitialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function generateResponse(userMessage: string): string {
    return generateAssistantResponse(userMessage)
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Simulate async AI response delay
    await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 600))

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: generateResponse(trimmed),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, assistantMsg])
    setIsLoading(false)
  }

  function handleSend() {
    sendMessage(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleSuggestion(q: string) {
    sendMessage(q)
  }

  return (
    <div className="page-content">
      <div className="container">
        <PageHeader
          title="AI Assistant"
          subtitle="Ask questions about food donation, redistribution guidelines, and how FoodBridge AI works."
        />

        <div className="notice notice-info mb-6">
          <span>ℹ</span>
          <span>
            <strong>Advisory assistant:</strong> The assistant provides illustrative responses
            to help you understand how the platform works. Responses are for demonstration
            purposes and should not replace food safety expertise or regulatory guidance.
          </span>
        </div>

        <div className={styles.chatLayout}>
          {/* ── Chat window ──────────────────────────────────────────────── */}
          <div className={styles.chatMain}>
            <div className={styles.messageList} role="log" aria-live="polite" aria-label="Chat messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                >
                  <div className={styles.messageRole}>
                    {msg.role === 'user' ? 'You' : 'FoodBridge AI'}
                  </div>
                  <div className={styles.messageBubble}>
                    <p className={styles.messageText}>{msg.content}</p>
                  </div>
                  <div className={styles.messageTime}>{formatTime(msg.timestamp)}</div>
                </div>
              ))}

              {isLoading && (
                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <div className={styles.messageRole}>FoodBridge AI</div>
                  <div className={styles.messageBubble}>
                    <div className={styles.typingIndicator} aria-label="AI is composing a response">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className={styles.inputArea}>
              <textarea
                ref={inputRef}
                className={styles.textInput}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
                rows={2}
                disabled={isLoading}
                aria-label="Message input"
              />
              <button
                className={`btn btn-primary ${styles.sendBtn}`}
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
              >
                {isLoading ? '…' : 'Send'}
              </button>
            </div>
          </div>

          {/* ── Suggested questions sidebar ───────────────────────────────── */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarTitle}>Suggested questions</div>
            <div className={styles.suggestionList}>
              {demoSuggestedQuestions.map((q) => (
                <button
                  key={q}
                  className={styles.suggestionBtn}
                  onClick={() => handleSuggestion(q)}
                  disabled={isLoading}
                >
                  {q}
                </button>
              ))}
            </div>

            <div className={styles.sidebarNote}>
              <div className={styles.sidebarNoteTitle}>About this assistant</div>
              <p>
                The assistant provides guidance on food safety, donation procedures,
                community matching, and sustainability.
              </p>
              <p className="mt-2">
                All recommendations are advisory and should be verified by a responsible
                coordinator before redistribution.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
