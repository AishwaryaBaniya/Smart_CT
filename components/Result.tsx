"use client"

import { useRouter, useSearchParams } from "next/navigation"
import SidebarLayout from "./SidebarLayout"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, ArrowLeft, Heart, Droplets, Activity, AlertTriangle, CheckCircle, Info } from "lucide-react"

const Result = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scanId = searchParams?.get("id") || ""

  const [scanResult, setScanResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!scanId) {
      setError("Scan ID not provided")
      setLoading(false)
      return
    }

    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`http://localhost:5000/api/scans/${scanId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to fetch scan results: ${res.statusText} - ${text}`)
        }
        const data = await res.json()
        setScanResult(data)
      } catch (err: any) {
        setError(err.message || "Failed to load scan results")
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [scanId])

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600 text-lg">Loading scan results...</p>
        </div>
      </SidebarLayout>
    )
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </SidebarLayout>
    )
  }

  if (!scanResult) return null

  const predictions = scanResult.predictions || {}

  function getOrganStatus(organPrefix: string, classes: string[], labels: string[]) {
    const scores = classes.map((cls) => predictions[`${organPrefix}_${cls}`] ?? 0)
    const maxIndex = scores.indexOf(Math.max(...scores))

    let severity: string
    if (maxIndex === 0) severity = "normal"
    else if (maxIndex === 1) severity = "low"
    else if (maxIndex === 2) severity = "high"
    else severity = "normal"

    return {
      status: labels[maxIndex],
      severity,
    }
  }

  const bowel = getOrganStatus("bowel", ["healthy", "injury"], ["Healthy", "Injured"])
  const extravasation = getOrganStatus("extravasation", ["healthy", "injury"], ["Absent", "Present"])
  const kidney = getOrganStatus("kidney", ["healthy", "low", "high"], ["Healthy", "Low Severity", "High Severity"])
  const liver = getOrganStatus("liver", ["healthy", "low", "high"], ["Healthy", "Low Severity", "High Severity"])
  const spleen = getOrganStatus("spleen", ["healthy", "low", "high"], ["Healthy", "Low Severity", "High Severity"])

  const findings = { bowel, extravasation, kidney, liver, spleen }

  const computeOverallRisk = (findings: Record<string, any>) => {
    const severities = Object.values(findings).map(f => f.severity)
    if (severities.includes("high")) return "High"
    if (severities.includes("low")) return "Moderate"
    return "Low"
  }

  const getOverallRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-green-100 text-green-800 border border-green-200"
      case "Moderate":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      case "High":
        return "bg-red-100 text-red-800 border border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "normal":
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case "low":
        return <Info className="h-6 w-6 text-yellow-600" />
      case "high":
        return <AlertTriangle className="h-6 w-6 text-red-600" />
      default:
        return <Info className="h-6 w-6 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "normal":
        return "bg-green-50 border-green-200"
      case "low":
        return "bg-yellow-50 border-yellow-200"
      case "high":
        return "bg-red-50 border-red-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const getStatusColor = (severity: string) => {
    switch (severity) {
      case "normal":
        return "text-green-800"
      case "low":
        return "text-yellow-800"
      case "high":
        return "text-red-800"
      default:
        return "text-gray-800"
    }
  }

  const organIcons = {
    bowel: Activity,
    extravasation: Droplets,
    liver: Heart,
    kidney: Heart,
    spleen: Heart,
  }

  const organLabels = {
    bowel: "Bowel",
    extravasation: "Internal Bleeding",
    liver: "Liver",
    kidney: "Kidney",
    spleen: "Spleen",
  }

  const overallRisk = computeOverallRisk(findings)
  const confidence = scanResult.confidence ?? 0
  const scanner = scanResult.scanner || "Unknown Scanner"
  const date = scanResult.date || "Unknown Date"
  const time = scanResult.time || "Unknown Time"

const downloadReport = () => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user")
    const user = userData ? JSON.parse(userData) : { name: "Unknown Patient" }
    const patientName = user.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user.name || "Unknown Patient"

    // Create print-friendly HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CT Scan Analysis Report</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #000;
              background: #fff;
              margin: 20px;
              font-size: 12px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }
            .header h2 {
              margin: 5px 0;
              font-size: 16px;
              font-weight: normal;
            }
            .patient-info {
              margin-bottom: 30px;
            }
            .patient-info table {
              width: 100%;
              border-collapse: collapse;
            }
            .patient-info td {
              padding: 8px;
              border: 1px solid #000;
            }
            .patient-info td:first-child {
              font-weight: bold;
              width: 30%;
              background: #f5f5f5;
            }
            .assessment {
              margin-bottom: 30px;
            }
            .assessment h3 {
              font-size: 16px;
              margin-bottom: 15px;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
            }
            .risk-badge {
              display: inline-block;
              padding: 8px 16px;
              border: 2px solid #000;
              font-weight: bold;
              font-size: 14px;
            }
            .findings {
              margin-bottom: 30px;
            }
            .findings table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .findings th,
            .findings td {
              padding: 12px;
              border: 1px solid #000;
              text-align: left;
            }
            .findings th {
              background: #f5f5f5;
              font-weight: bold;
            }
            .status-normal { font-weight: bold; }
            .status-low { font-weight: bold; }
            .status-high { font-weight: bold; }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #000;
              padding-top: 20px;
              font-size: 10px;
              text-align: center;
            }
            .print-button {
              margin: 20px 0;
              text-align: center;
            }
            .print-button button {
              padding: 10px 20px;
              font-size: 14px;
              background: #000;
              color: #fff;
              border: none;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SmartCT AI Trauma Detection</h1>
            <h2>CT Scan Analysis Report</h2>
          </div>

          <div class="patient-info">
            <table>
              <tr>
                <td>Patient Name:</td>
                <td>${patientName}</td>
              </tr>
              <tr>
                <td>Scan ID:</td>
                <td>#${scanId}</td>
              </tr>
              <tr>
                <td>Date & Time:</td>
                <td>${date} at ${time}</td>
              </tr>
              <tr>
                <td>Scanner:</td>
                <td>${scanner}</td>
              </tr>
            </table>
          </div>

          <div class="assessment">
            <h3>Overall Assessment</h3>
            <p>Risk Level: <span class="risk-badge">${overallRisk}</span></p>
          </div>

          <div class="findings">
            <h3>Detailed Findings</h3>
            <table>
              <thead>
                <tr>
                  <th>Organ/System</th>
                  <th>Status</th>
                  <th>Severity Level</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(findings)
                  .map(
                    ([organ, data]) => `
                  <tr>
                    <td>${organLabels[organ as keyof typeof organLabels]}</td>
                    <td class="status-${data.severity}">${data.status}</td>
                    <td>${data.severity === "normal" ? "Normal" : data.severity === "low" ? "Low" : "High"}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p><strong>IMPORTANT NOTICE:</strong> This report is generated by AI and should be reviewed by a qualified medical professional. This analysis is for diagnostic assistance only and should not replace clinical judgment.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>

          <div class="print-button no-print">
            <button onclick="window.print()">Print Report</button>
          </div>
        </body>
      </html>
    `

    // Open new window with print content
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
    }
  }



  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.back()} className="hover:bg-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Scan Analysis Report</h1>
                <p className="text-gray-600">
                  Scan #{scanId} • {date} at {time}
                </p>
              </div>
            </div>
            <Button onClick={downloadReport} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>

          {/* Overall Assessment */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Overall Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Risk Level</h3>
                  <Badge className={`${getOverallRiskColor(overallRisk)} text-base px-4 py-2`}>
                    {overallRisk}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Findings */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Detailed Findings</CardTitle>
              <CardDescription>Organ-specific analysis results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(findings).map(([organ, data]) => {
                  const IconComponent = organIcons[organ as keyof typeof organIcons]
                  const organLabel = organLabels[organ as keyof typeof organLabels]

                  return (
                    <Card key={organ} className={`border-2 ${getSeverityColor(data.severity)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900">{organLabel}</h4>
                          </div>
                          {getSeverityIcon(data.severity)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Status</p>
                          <p className={`font-semibold text-lg ${getStatusColor(data.severity)}`}>{data.status}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Scan Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Scan Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Scanner</p>
                  <p className="text-gray-900">{scanner}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Date & Time</p>
                  <p className="text-gray-900">
                    {date} at {time}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Analysis ID</p>
                  <p className="text-gray-900">#{scanId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notice */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Important:</strong> This AI-generated analysis should be reviewed by a qualified medical
              professional. This report is for diagnostic assistance only and should not replace clinical judgment.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </SidebarLayout>
  )
}

export default Result
