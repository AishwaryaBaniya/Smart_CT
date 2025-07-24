"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SidebarLayout from "@/components/SidebarLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, LogIn, UserPlus, UploadCloud } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [modelAccuracy, setModelAccuracy] = useState<string>("Loading...")

  useEffect(() => {
    const fetchModel = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/models/current")
        const data = await res.json()
        setModelAccuracy(`${data.accuracy}%`)
      } catch (err) {
        setModelAccuracy("Unavailable")
      }
    }

    fetchModel()
  }, [])

  return (
    <SidebarLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-100 px-6">
        <div className="max-w-4xl text-center space-y-8">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
            Welcome to <span className="text-blue-600">SmartCT</span>
          </h1>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            SmartCT is an intelligent diagnostic support system designed to assist medical professionals in the automatic detection of abdominal trauma from CT scan images. Leveraging state-of-the-art deep learning algorithms, SmartCT enables efficient and accurate medical decision-making with high model performance and real-time processing.
          </p>

          <div className="flex items-center justify-center space-x-2">
            <Target className="h-5 w-5 text-green-600" />
            <span className="text-lg text-gray-800">AI Model Accuracy:</span>
            <Badge className="bg-green-100 text-green-800">{modelAccuracy}</Badge>
          </div>

          <div className="flex justify-center gap-6 mt-6 flex-wrap">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-3 rounded-md"
              onClick={() => router.push("/login")}
            >
              <LogIn className="h-5 w-5 mr-2" />
              Sign In
            </Button>
            <Button
              className="bg-gray-600 hover:bg-gray-700 text-white text-lg px-6 py-3 rounded-md"
              onClick={() => router.push("/register")}
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Sign Up
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-6 py-3 rounded-md"
              onClick={() => router.push("/scan-upload")}
            >
              <UploadCloud className="h-5 w-5 mr-2" />
              Upload Scan
            </Button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
