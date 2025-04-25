"use client"

import type React from "react"
import type { FormEvent } from "react"
import type { Message } from "ai"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { useEffect, useRef } from "react"

interface ChatInterfaceProps {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function ChatInterface({ messages, input, handleInputChange, handleSubmit, isLoading }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card className="w-full max-w-md mx-auto mb-4 bg-black/50 border-gray-800 text-white">
      <CardContent className="p-4 max-h-60 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-6">
            <p>Hello! I'm your AI assistant.</p>
            <p className="text-sm mt-2">Ask me anything or speak using the microphone button.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`mb-3 ${message.role === "user" ? "text-right" : "text-left"}`}>
              <div
                className={`inline-block px-3 py-2 rounded-lg ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-white"
                }`}
              >
                {message.content}
              </div>
              <div className="text-xs text-gray-500 mt-1">{message.role === "user" ? "You" : "Cortana"}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="text-left mb-3">
            <div className="inline-block px-3 py-2 rounded-lg bg-gray-800 text-white">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">Cortana</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter className="p-2">
        <form onSubmit={handleSubmit} className="flex w-full gap-2" id="chat-form">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send size={18} />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
