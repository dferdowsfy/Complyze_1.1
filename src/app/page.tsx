import React from "react"
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from "@/components/ui/tabs"
import {
  Card, CardContent, CardDescription, CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Complyze AI Governance</h1>

        <Tabs defaultValue="prompt" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="prompt">Prompt Activity</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <CardTitle>Prompt Evaluation</CardTitle>
                <CardDescription>
                  Submit a prompt to see utility and safety scores. Get suggestions to improve it.
                </CardDescription>
                <Input placeholder="Enter your prompt here..." />
                <Button>Analyze Prompt</Button>
                <div className="text-sm text-gray-500">Sample Output: Utility Score: 7.8 | Safety Score: 9.1</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>
                  View trends, top prompt types, and high-risk usage over time.
                </CardDescription>
                <div className="bg-white border p-4 rounded shadow-sm">
                  <p>Top Prompt: "Summarize this contract"</p>
                  <p>High-Risk Usage (This Week): 3</p>
                  <p>Average Utility Score: 8.2</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="governance">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <CardTitle>Governance Rules</CardTitle>
                <CardDescription>
                  Review or manage prompt risk rules, redaction policies, and user access.
                </CardDescription>
                <div className="flex items-center justify-between">
                  <span>Block PII in prompts</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span>Redact sensitive outputs</span>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
} 