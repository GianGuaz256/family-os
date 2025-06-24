import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'

export function PastelDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Family OS Components Demo</h1>
          <p className="text-lg text-muted-foreground">Modern UI components for family management</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Family Meeting</CardTitle>
              <CardDescription>Weekly family sync to discuss schedules and plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">1h</Badge>
                  <span className="text-sm text-muted-foreground">Duration</span>
                </div>
                <Button variant="default" size="sm" className="w-full">
                  Join Meeting
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shopping Lists</CardTitle>
              <CardDescription>Collaborative family shopping and todo lists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold">5</div>
                <div className="flex gap-2">
                  <Badge variant="default">Active Lists</Badge>
                </div>
                <Button variant="secondary" size="sm" className="w-full">
                  View Lists
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Family Documents</CardTitle>
              <CardDescription>Important family documents and files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Insurance Policy</span>
                  <Badge variant="secondary">PDF</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">School Records</span>
                  <Badge variant="secondary">PDF</Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Button Showcase */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </div>

        {/* Badge Showcase */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Badge Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </div>
      </div>
    </div>
  )
} 