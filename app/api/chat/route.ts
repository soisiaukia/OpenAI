import { streamText } from "ai"
import { groq } from "@ai-sdk/groq"
import { xai } from "@ai-sdk/xai"
import { Redis } from "@upstash/redis"
import { getUserPreferences, getCachedConversationHistory, getMessagesByConversationId } from "@/lib/db"

// Initialize Redis client for rate limiting and caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "",
})

// Allow responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, userId, preferences } = await req.json()

    // Rate limiting: 20 requests per minute per user
    const rateLimitKey = `ratelimit:user:${userId}`
    const requests = await redis.incr(rateLimitKey)

    if (requests === 1) {
      await redis.expire(rateLimitKey, 60) // Expire after 60 seconds
    }

    if (requests > 20) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
        { status: 429 },
      )
    }

    // Get user preferences from database or use provided ones
    const userPrefs = preferences || (await getUserPreferences(userId))

    // Determine response length based on preferences
    let maxTokens = 300 // Default medium length
    if (userPrefs?.response_length === "short") {
      maxTokens = 150
    } else if (userPrefs?.response_length === "long") {
      maxTokens = 500
    }

    // Get conversation history from cache or database
    let conversationHistory = []
    const lastMessage = messages[messages.length - 1]

    if (lastMessage && messages.length > 1) {
      // Try to get from cache first
      const cachedHistory = await getCachedConversationHistory(1) // Default conversation ID

      if (cachedHistory) {
        conversationHistory = cachedHistory
      } else {
        // If not in cache, get from database
        const dbMessages = await getMessagesByConversationId(1) // Default conversation ID
        if (dbMessages && dbMessages.length > 0) {
          conversationHistory = dbMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          }))
        }
      }
    }

    // Define the system prompt to make the AI behave like Cortana
    const systemPrompt = `
      You are Cortana, a helpful AI assistant. Your responses should be:
      - Helpful and informative
      - Concise and to the point
      - Friendly but professional
      - Knowledgeable about technology
      
      Keep your responses relatively short for better text-to-speech experience.
      
      Current user preferences:
      - Theme: ${userPrefs?.theme || "blue"}
      - Response length: ${userPrefs?.response_length || "medium"}
      - Voice enabled: ${userPrefs?.voice_enabled ? "Yes" : "No"}
    `

    // Choose between Groq and Grok based on the complexity of the query
    // For more complex queries or when context is important, use Grok
    // For faster responses on simpler queries, use Groq
    const isComplexQuery =
      lastMessage?.content.length > 100 ||
      lastMessage?.content.includes("explain") ||
      lastMessage?.content.includes("how") ||
      messages.length > 5

    const model = isComplexQuery ? xai("grok-1") : groq("llama3-70b-8192")

    const result = streamText({
      model,
      messages,
      system: systemPrompt,
      maxTokens,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(
      JSON.stringify({
        error: "An error occurred while processing your request.",
      }),
      { status: 500 },
    )
  }
}
