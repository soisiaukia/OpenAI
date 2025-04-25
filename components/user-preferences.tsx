"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X } from "lucide-react"

interface UserPreferencesProps {
  preferences: {
    voiceEnabled: boolean
    theme: string
    responseLength: string
  }
  setPreferences: (preferences: any) => void
  onClose: () => void
  onNewConversation: () => void
}

export function UserPreferences({ preferences, setPreferences, onClose, onNewConversation }: UserPreferencesProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
        <CardHeader className="relative">
          <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
            <X size={18} />
          </Button>
          <CardTitle>Assistant Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="voice-enabled">Voice Enabled</Label>
            <Switch
              id="voice-enabled"
              checked={preferences.voiceEnabled}
              onCheckedChange={(checked) => setPreferences({ ...preferences, voiceEnabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Theme Color</Label>
            <RadioGroup
              value={preferences.theme}
              onValueChange={(value) => setPreferences({ ...preferences, theme: value })}
              className="flex flex-wrap gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blue" id="blue" className="bg-blue-600" />
                <Label htmlFor="blue">Blue</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="purple" id="purple" className="bg-purple-600" />
                <Label htmlFor="purple">Purple</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="green" id="green" className="bg-green-600" />
                <Label htmlFor="green">Green</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="red" id="red" className="bg-red-600" />
                <Label htmlFor="red">Red</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="orange" id="orange" className="bg-orange-600" />
                <Label htmlFor="orange">Orange</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Response Length</Label>
            <RadioGroup
              value={preferences.responseLength}
              onValueChange={(value) => setPreferences({ ...preferences, responseLength: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="short" id="short" />
                <Label htmlFor="short">Short</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="long" id="long" />
                <Label htmlFor="long">Long</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={onNewConversation}>
            Start New Conversation
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
