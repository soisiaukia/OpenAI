"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { Canvas } from "@react-three/fiber"
import { Environment, OrbitControls } from "@react-three/drei"
import { Assistant3D } from "@/components/assistant-3d"
import { ChatInterface } from "@/components/chat-interface"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Settings } from "lucide-react"
import { UserPreferences } from "@/components/user-preferences"
import { useConversation } from "@/hooks/use-conversation"

// Declare SpeechRecognition
declare var webkitSpeechRecognition: any
declare var SpeechRecognition: any

export default function Home() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [userPreferences, setUserPreferences] = useState({
    voiceEnabled: true,
    theme: "blue",
    responseLength: "medium",
  })

  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const recognitionRef = useRef<any>(null)

  const { saveMessage, startNewConversation } = useConversation()

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    body: {
      userId: 1, // Default user ID
      preferences: userPreferences,
    },
    onResponse: (response) => {
      // This is called when the API starts streaming the response
      console.log("Response started", response)
    },
    onFinish: async (message) => {
      // Save the message to the database when the response is complete
      await saveMessage({
        role: "assistant",
        content: message.content,
        conversationId: 1, // Default conversation ID
      })
    },
  })

  // Initialize speech synthesis
  useEffect(() => {
    speechSynthesisRef.current = new SpeechSynthesisUtterance()
    speechSynthesisRef.current.rate = 1
    speechSynthesisRef.current.pitch = 1
    speechSynthesisRef.current.volume = 1

    // Select a female voice if available
    window.speechSynthesis.onvoiceschanged = () => {
      const voices = window.speechSynthesis.getVoices()
      const femaleVoice = voices.find((voice) => voice.name.includes("Female") || voice.name.includes("female"))
      if (femaleVoice) {
        speechSynthesisRef.current!.voice = femaleVoice
      }
    }

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognitionAPI = window.SpeechRecognition || webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognitionAPI()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        handleInputChange({ target: { value: transcript } } as any)
        setTimeout(() => {
          const form = document.getElementById("chat-form") as HTMLFormElement
          if (form) form.requestSubmit()
        }, 500)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [handleInputChange])

  // Handle form submission with database saving
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!input.trim()) return

    // Save user message to database
    await saveMessage({
      role: "user",
      content: input,
      conversationId: 1, // Default conversation ID
    })

    // Submit to AI
    handleSubmit(e)
  }

  // Speak the latest assistant message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === "assistant" && !isSpeaking && userPreferences.voiceEnabled) {
      setIsSpeaking(true)
      speechSynthesisRef.current!.text = lastMessage.content
      window.speechSynthesis.speak(speechSynthesisRef.current!)

      speechSynthesisRef.current!.onend = () => {
        setIsSpeaking(false)
      }
    }
  }, [messages, isSpeaking, userPreferences.voiceEnabled])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.abort()
      setIsListening(false)
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const handleStartNewConversation = async () => {
    await startNewConversation("New Conversation")
    setMessages([])
  }

  return (
    <main className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="flex-1 relative">
        <Canvas className="w-full h-full">
          <OrbitControls enableZoom={false} enablePan={false} />
          <Assistant3D isSpeaking={isSpeaking} isLoading={isLoading} theme={userPreferences.theme} />
          <Environment preset="night" />
        </Canvas>

        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="icon"
            className="rounded-full p-3 bg-white/10 text-white"
          >
            <Settings size={24} />
          </Button>

          <Button
            onClick={toggleListening}
            variant="outline"
            size="icon"
            className={`rounded-full p-3 ${isListening ? "bg-red-500 text-white" : "bg-white/10 text-white"}`}
            disabled={!userPreferences.voiceEnabled}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </Button>
        </div>

        {showSettings && (
          <UserPreferences
            preferences={userPreferences}
            setPreferences={setUserPreferences}
            onClose={() => setShowSettings(false)}
            onNewConversation={handleStartNewConversation}
          />
        )}
      </div>

      <ChatInterface
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleFormSubmit}
        isLoading={isLoading}
      />
    </main>
  )
}
