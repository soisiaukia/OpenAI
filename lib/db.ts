import { neon } from "@neondatabase/serverless"
import { Redis } from "@upstash/redis"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || proSUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY || "",
)

// Initialize Neon database client (as fallback)
const sql = neon(process.env.DATABASE_URL || "")

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "",
})

// User functions
export async function getUserById(id: number) {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching user:", error)
    return null
  }

  return data
}

export async function getUserPreferences(userId: number) {
  // Try to get from cache first
  const cacheKey = `user:${userId}:preferences`
  const cachedPreferences = await redis.get(cacheKey)

  if (cachedPreferences) {
    return cachedPreferences
  }

  // If not in cache, get from database
  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching user preferences:", error)
    return null
  }

  if (data) {
    // Cache the preferences for 1 hour
    await redis.set(cacheKey, data, { ex: 3600 })
    return data
  }

  return null
}

export async function updateUserPreferences(userId: number, preferences: any) {
  const { voice_enabled, theme, response_length } = preferences

  const { data, error } = await supabase
    .from("user_preferences")
    .update({ voice_enabled, theme, response_length })
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating user preferences:", error)
    return null
  }

  // Update cache
  const cacheKey = `user:${userId}:preferences`
  await redis.set(cacheKey, data, { ex: 3600 })

  return data
}

// Conversation functions
export async function getConversationById(id: number) {
  const { data, error } = await supabase.from("conversations").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching conversation:", error)
    return null
  }

  return data
}

export async function createConversation(userId: number, title: string) {
  const { data, error } = await supabase
    .from("conversations")
    .insert([{ user_id: userId, title }])
    .select()
    .single()

  if (error) {
    console.error("Error creating conversation:", error)
    return null
  }

  return data
}

// Message functions
export async function getMessagesByConversationId(conversationId: number) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return []
  }

  return data
}

export async function createMessage(conversationId: number, role: string, content: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert([{ conversation_id: conversationId, role, content }])
    .select()
    .single()

  if (error) {
    console.error("Error creating message:", error)
    return null
  }

  return data
}

// Cache conversation history for quick access
export async function cacheConversationHistory(conversationId: number, messages: any[]) {
  const cacheKey = `conversation:${conversationId}:history`
  await redis.set(cacheKey, JSON.stringify(messages), { ex: 3600 }) // Cache for 1 hour
}

export async function getCachedConversationHistory(conversationId: number) {
  const cacheKey = `conversation:${conversationId}:history`
  const cachedHistory = await redis.get(cacheKey)

  if (cachedHistory) {
    return JSON.parse(cachedHistory as string)
  }

  return null
}
