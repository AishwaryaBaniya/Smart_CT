"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Bell, CheckCircle, Mail, Lock, AlertTriangle } from "lucide-react"

type NotificationItem = {
  _id: string
  type: "scan" | "message" | "security" | "alert"
  title: string
  description: string
  timestamp: string
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch notifications")
        }

        const data = await res.json()
        setNotifications(data)
      } catch (err) {
        console.error(err)
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const iconMap = {
    scan: <CheckCircle className="h-5 w-5 text-green-600" />,
    message: <Mail className="h-5 w-5 text-blue-600" />,
    security: <Lock className="h-5 w-5 text-yellow-600" />,
    alert: <AlertTriangle className="h-5 w-5 text-red-600" />,
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Card className="border-0 shadow-lg max-w-3xl mx-auto">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Notifications
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-500 text-center">Loading notifications...</p>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className="flex items-start gap-4 border rounded-lg p-4 bg-white shadow-sm hover:shadow transition"
              >
                <div>{iconMap[notification.type]}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                  <p className="text-sm text-gray-600">{notification.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center">No notifications yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Notifications

