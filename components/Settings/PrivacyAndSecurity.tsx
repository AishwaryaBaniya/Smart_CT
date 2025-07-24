"use client"

import React, { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, LogOut, Shield } from "lucide-react"

const PrivacyAndSecurity = () => {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [step, setStep] = useState<"init" | "verify">("init")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const sendVerificationCode = async () => {
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage("Verification code sent to your email.")
        setStep("verify")
      } else {
        setMessage(result.error || "Failed to send code.")
      }
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async () => {
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage("Password updated successfully.")
        setShowChangePassword(false)
        setStep("init")
        setEmail("")
        setCode("")
        setNewPassword("")
      } else {
        setMessage(result.error || "Invalid code or email.")
      }
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Card className="border-0 shadow-lg max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Privacy & Security
          </CardTitle>
          <CardDescription className="text-gray-600">
            Manage your account’s privacy and security settings.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Change Password Section */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Click below if you'd like to update your password securely.
            </p>

            {!showChangePassword ? (
              <Button onClick={() => setShowChangePassword(true)}>Change Password</Button>
            ) : (
              <div className="space-y-4 mt-4">
                {step === "init" && (
                  <>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button onClick={sendVerificationCode} disabled={loading}>
                      {loading ? "Sending..." : "Send OTP Code"}
                    </Button>
                  </>
                )}

                {step === "verify" && (
                  <>
                    <Label>OTP Code</Label>
                    <Input
                      type="text"
                      placeholder="4-digit code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      placeholder="********"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button onClick={updatePassword} disabled={loading}>
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                  </>
                )}
                {message && <p className="text-sm text-blue-600">{message}</p>}
              </div>
            )}
          </div>

          {/* Session Management */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Session Management
            </h3>
            <p className="text-sm text-gray-600">
              Monitor and log out of devices you no longer use.
            </p>
            <Button variant="destructive" className="mt-2">
              Log Out from All Devices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PrivacyAndSecurity
