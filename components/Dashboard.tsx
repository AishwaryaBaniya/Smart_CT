"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SidebarLayout from "./SidebarLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, Target, Upload, FileText, Settings, LogIn } from "lucide-react"

const Dashboard = () => {
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const [modelAccuracy, setModelAccuracy] = useState<string>("Loading...");

useEffect(() => {
  const fetchModelAccuracy = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/models/current");
      const data = await res.json();
      setModelAccuracy(`${data.accuracy}%`);
    } catch (err) {
      console.error("Failed to fetch model accuracy:", err);
      setModelAccuracy("Unavailable");
    }
  };

  fetchModelAccuracy();
}, []);

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      setUser(JSON.parse(userData))
      setIsAuthenticated(true)
    }
  }, [])

  const handleProtectedClick = (path: string) => {
    if (!isAuthenticated) {
      router.push("/login")
    } else {
      router.push(path)
    }
  }

  const handleLoginClick = () => {
    router.push("/login")
  }

  const stats = [
    {
      title: "Total Scans",
      value: "2",
      description: "Completed analyses",
      icon: Activity,
      color: "bg-blue-500",
    },
    {
      title: "Accuracy Rate",
      value: modelAccuracy,
      description: "AI model precision",
      icon: Target,
      color: "bg-green-500",
    },
    
 

    {
      title: "Average Time",
      value: "2s",
      description: "Processing speed",
      icon: Clock,
      color: "bg-purple-500",
    },
  ]

  const quickActions = [
    {
      title: "New Scan",
      description: "Upload and analyze CT scan",
      icon: Upload,
      path: "/upload",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "View Results",
      description: "Browse previous analyses",
      icon: FileText,
      path: "/viewresults",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Settings",
      description: "Manage your account",
      icon: Settings,
      path: "/settings",
      color: "bg-gray-600 hover:bg-gray-700",
    },
  ]

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="p-6 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {user ? `Welcome back, ${user.firstName || user.name}!` : "Welcome to SmartCT"}
              </h1>
              <p className="text-xl text-gray-600">Your AI-powered abdominal trauma detection assistant</p>
            </div>

            {!isAuthenticated && (
              <Button
                onClick={handleLoginClick}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-full ${stat.color}`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <p className="text-sm text-gray-500">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => handleProtectedClick(action.path)}
                >
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">{action.title}</CardTitle>
                    <CardDescription className="text-gray-600">{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* System Status */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700">AI Model Online</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Operational
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  )
}

export default Dashboard
