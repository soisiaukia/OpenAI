import { createConversation } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { userId, title } = await req.json()

    if (!userId || !title) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
        }),
        { status: 400 },
      )
    }

    const conversation = await createConversation(userId, title)

    return new Response(JSON.stringify(conversation), { status: 201 })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return new Response(
      JSON.stringify({
        error: "An error occurred while creating the conversation",
      }),
      { status: 500 },
    )
  }
}
