import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'

interface LoginFormProps {
  onSuccess: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = isSignUp 
        ? await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          })
        : await supabase.auth.signInWithPassword({ email, password })

      if (error) throw error
      
      if (isSignUp && !data.user?.email_confirmed_at) {
        setError('Please check your email to confirm your account before signing in.')
      } else if (data.user) {
        onSuccess()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      {/* Theme switcher in top-right corner */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher size="sm" showLabel />
      </div>
      
      <div className="w-full max-w-sm p-4">
        <Card>
          <CardHeader className="space-y-1">
            {/* Header */}
            <div className="text-center mb-2">
              <h1 className="text-3xl font-bold mb-2">
                👨‍👩‍👧‍👦 Family OS
              </h1>
              <CardDescription>Your family's digital home</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                {isSignUp && (
                  <p className="text-sm text-muted-foreground">
                    Password should be at least 6 characters
                  </p>
                )}
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                  }}
                >
                  {isSignUp 
                    ? 'Already have an account? Sign In' 
                    : "Don't have an account? Sign Up"
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 