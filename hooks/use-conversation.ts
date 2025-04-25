"use client"

import { useState } from "react"

interface Message {
  role: string
  content: string
  conversationId: number
}

export function useConversation() {
  const [isLoading, setIsLoading] = useState(false)

  const saveMessage = async (message: Message) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        throw new Error("Failed to save message")
      }

      return await response.json()
    } catch (error) {
      console.error("Error saving message:", error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const startNewConversation = async (title: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 1, // Default user ID
          title,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create conversation")
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating conversation:", error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    saveMessage,
    startNewConversation,
    isLoading,
  }
}
