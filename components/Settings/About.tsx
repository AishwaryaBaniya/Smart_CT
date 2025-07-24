"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SidebarLayout from "../SidebarLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, Activity, Code, Shield, FileText, Users, CheckCircle } from "lucide-react"

export default function About() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [appInfo, setAppInfo] = useState<any>(null)

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/about")
        const data = await res.json()
        setAppInfo(data)
      } catch (err) {
        console.error("Failed to load About info", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAbout()
  }, [])

  if (loading) {
    return <SidebarLayout><div className="p-6">Loading...</div></SidebarLayout>
  }

  if (!appInfo) {
    return <SidebarLayout><div className="p-6">Failed to load app info.</div></SidebarLayout>
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-gray-900">About SmartCT</h1>

          {/* Overview */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Application Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{appInfo.description}</p>
            </CardContent>
          </Card>

          {/* Version Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center text-gray-900">
                <Info className="h-5 w-5 mr-2" />
                Version Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div><p className="text-sm text-gray-600">App Name</p><p className="text-gray-900 font-semibold">{appInfo.name}</p></div>
              <div><p className="text-sm text-gray-600">Version</p><p className="text-gray-900">{appInfo.version}</p></div>
              <div><p className="text-sm text-gray-600">Build</p><p className="text-gray-900">{appInfo.build}</p></div>
              <div><p className="text-sm text-gray-600">Release Date</p><p className="text-gray-900">{appInfo.releaseDate}</p></div>
              <div><p className="text-sm text-gray-600">Developer</p><p className="text-gray-900">{appInfo.developer}</p></div>
              <div><p className="text-sm text-gray-600">Copyright</p><p className="text-gray-900">{appInfo.copyright}</p></div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center text-gray-900">
                <Code className="h-5 w-5 mr-2" />
                Key Features
              </CardTitle>
              <CardDescription>Highlights of what SmartCT offers</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 gap-4">
                {appInfo.features?.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Legal */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center text-gray-900">
                <Shield className="h-5 w-5 mr-2" />
                Legal & Compliance
              </CardTitle>
              <CardDescription>Legal documents and policies</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "Open Source Licenses"].map((doc, idx) => (
                <Button key={idx} variant="outline" className="h-12 justify-start">
                  <FileText className="h-4 w-4 mr-3" />
                  {doc}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  )
}
