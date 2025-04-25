import { updateUserPreferences } from "@/lib/db"

export async function PUT(req: Request) {
  try {
    const { userId, preferences } = await req.json()

    if (!userId || !preferences) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
        }),
        { status: 400 },
      )
    }

    const updatedPreferences = await updateUserPreferences(userId, {
      voice_enabled: preferences.voiceEnabled,
      theme: preferences.theme,
      response_length: preferences.responseLength,
    })

    return new Response(JSON.stringify(updatedPreferences), { status: 200 })
  } catch (error) {
    console.error("Error updating preferences:", error)
    return new Response(
      JSON.stringify({
        error: "An error occurred while updating preferences",
      }),
      { status: 500 },
    )
  }
}
