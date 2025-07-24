"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import AdminSidebarLayout from "./AdminSidebarLayout"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Cog } from "lucide-react"

const SystemSettings = () => {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/settings")
      setSettings(res.data)
      setLoading(false)
    } catch (err) {
      console.error("Failed to load settings:", err)
    }
  }

  const saveSettings = async () => {
    try {
      await axios.put("http://localhost:5000/api/settings", settings)
      alert("Settings updated successfully")
    } catch (err) {
      alert("Failed to update settings")
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) return <p className="p-6">Loading system settings...</p>

  return (
    <AdminSidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <Card className="max-w-3xl mx-auto shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Cog className="h-6 w-6 text-blue-600" />
              System Settings
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Example: Model Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">AI Model</h3>
              <div className="space-y-2">
                <Label>Model Version</Label>
                <Input
                  value={settings.modelVersion}
                  onChange={(e) =>
                    setSettings({ ...settings, modelVersion: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto Update Model</Label>
                <Switch
                  checked={settings.autoUpdateModel}
                  onCheckedChange={(val) =>
                    setSettings({ ...settings, autoUpdateModel: val })
                  }
                />
              </div>
            </div>

            {/* Repeat for other sections like storage, notifications... */}

            <div className="pt-4 flex justify-end">
              <Button onClick={saveSettings} className="px-6 py-2 text-white">
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminSidebarLayout>
  )
}

export default SystemSettings
