import { neon } from "@neondatabase/serverless"
import { Redis } from "@upstash/redis"

// Initialize Neon database client
const sql = neon(process.env.DATABASE_URL!)

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// User functions
export async function getUserById(id: number) {
  const user = await sql`SELECT * FROM users WHERE id = ${id}`
  return user[0] || null
}

export async function getUserPreferences(userId: number) {
  // Try to get from cache first
  const cacheKey = `user:${userId}:preferences`
  const cachedPreferences = await redis.get(cacheKey)

  if (cachedPreferences) {
    return cachedPreferences
  }

  // If not in cache, get from database
  const preferences = await sql`SELECT * FROM user_preferences WHERE user_id = ${userId}`

  if (preferences[0]) {
    // Cache the preferences for 1 hour
    await redis.set(cacheKey, preferences[0], { ex: 3600 })
    return preferences[0]
  }

  return null
}

export async function updateUserPreferences(userId: number, preferences: any) {
  const { voice_enabled, theme, response_length } = preferences

  const result = await sql`
    UPDATE user_preferences
    SET voice_enabled = ${voice_enabled}, theme = ${theme}, response_length = ${response_length}
    WHERE user_id = ${userId}
    RETURNING *
  `

  // Update cache
  const cacheKey = `user:${userId}:preferences`
  await redis.set(cacheKey, result[0], { ex: 3600 })

  return result[0]
}

// Conversation functions
export async function getConversationById(id: number) {
  const conversation = await sql`SELECT * FROM conversations WHERE id = ${id}`
  return conversation[0] || null
}

export async function createConversation(userId: number, title: string) {
  const result = await sql`
    INSERT INTO conversations (user_id, title)
    VALUES (${userId}, ${title})
    RETURNING *
  `
  return result[0]
}

// Message functions
export async function getMessagesByConversationId(conversationId: number) {
  const messages = await sql`
    SELECT * FROM messages 
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `
  return messages
}

export async function createMessage(conversationId: number, role: string, content: string) {
  const result = await sql`
    INSERT INTO messages (conversation_id, role, content)
    VALUES (${conversationId}, ${role}, ${content})
    RETURNING *
  `
  return result[0]
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
