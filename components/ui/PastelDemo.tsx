import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'

export function PastelDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Pastel Components Demo</h1>
          <p className="text-lg text-muted-foreground">Modern, rounded UI components with beautiful pastel colors</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card variant="pastel-purple">
            <CardHeader>
              <CardTitle>Team Sync Meeting</CardTitle>
              <CardDescription>Weekly product review with design and development teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="pastel-blue">1h</Badge>
                  <span className="text-sm text-muted-foreground">Duration</span>
                </div>
                <Button variant="pastel-purple" size="sm" className="w-full">
                  Join Meeting
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="pastel-blue">
            <CardHeader>
              <CardTitle>Sales Dashboard</CardTitle>
              <CardDescription>Sales volume reached $12,450 this week, showing a 15% increase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold">$12,450</div>
                <div className="flex gap-2">
                  <Badge variant="success">+15%</Badge>
                  <Badge variant="info">This week</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="pastel-cyan">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest customer orders and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Charlie Chapman</span>
                  <Badge variant="info">Sent</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Howard Hudson</span>
                  <Badge variant="destructive">Failed</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Fiona Fisher</span>
                  <Badge variant="warning">In progress</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Amanda Anderson</span>
                  <Badge variant="success">Completed</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="pastel-teal">
            <CardHeader>
              <CardTitle>Page Score</CardTitle>
              <CardDescription>Website performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">91<span className="text-lg">/100</span></div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm text-success-foreground">All good</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="pastel-yellow">
            <CardHeader>
              <CardTitle>Verification Process</CardTitle>
              <CardDescription>Complete your account verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Badge variant="success" className="w-full justify-center">
                  ✓ Verification process completed
                </Badge>
                <Button variant="warning" className="w-full">
                  Click to verify your email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="pastel-pink">
            <CardHeader>
              <CardTitle>Harry Potter Stack</CardTitle>
              <CardDescription>Books and magical adventures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="pastel-purple">Fantasy</Badge>
                <Badge variant="pastel-blue">Adventure</Badge>
                <Badge variant="pastel-cyan">Magic</Badge>
                <Button variant="pastel-pink" size="sm" className="w-full mt-4">
                  Read More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Button Showcase */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="info">Info</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button variant="pastel-purple">Pastel Purple</Button>
            <Button variant="pastel-blue">Pastel Blue</Button>
            <Button variant="pastel-cyan">Pastel Cyan</Button>
            <Button variant="pastel-teal">Pastel Teal</Button>
            <Button variant="pastel-lime">Pastel Lime</Button>
            <Button variant="pastel-yellow">Pastel Yellow</Button>
            <Button variant="pastel-orange">Pastel Orange</Button>
            <Button variant="pastel-red">Pastel Red</Button>
            <Button variant="pastel-pink">Pastel Pink</Button>
          </div>
        </div>

        {/* Badge Showcase */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Badge Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Error</Badge>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Badge variant="pastel-purple">Purple</Badge>
            <Badge variant="pastel-blue">Blue</Badge>
            <Badge variant="pastel-cyan">Cyan</Badge>
            <Badge variant="pastel-teal">Teal</Badge>
            <Badge variant="pastel-lime">Lime</Badge>
            <Badge variant="pastel-yellow">Yellow</Badge>
            <Badge variant="pastel-orange">Orange</Badge>
            <Badge variant="pastel-red">Red</Badge>
            <Badge variant="pastel-pink">Pink</Badge>
          </div>
        </div>
      </div>
    </div>
  )
} 