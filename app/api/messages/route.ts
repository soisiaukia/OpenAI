import { createMessage } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { role, content, conversationId } = await req.json()

    if (!role || !content || !conversationId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
        }),
        { status: 400 },
      )
    }

    const message = await createMessage(conversationId, role, content)

    return new Response(JSON.stringify(message), { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return new Response(
      JSON.stringify({
        error: "An error occurred while creating the message",
      }),
      { status: 500 },
    )
  }
}
