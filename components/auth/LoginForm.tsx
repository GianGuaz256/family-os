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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Theme switcher in top-right corner */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeSwitcher size="sm" showLabel />
      </div>
      
      <div className="w-full max-w-md p-6">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/20 shadow-xl">
          <CardHeader className="space-y-4 pb-6">
            {/* Logo/Icon */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">👨‍👩‍👧‍👦</span>
              </div>
              <CardTitle className="text-3xl font-bold mb-2">
                Family OS
              </CardTitle>
              <CardDescription className="text-base">
                Your family's digital home
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="h-12 text-base"
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
              
              <div className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-12 text-base"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                  }}
                  size="lg"
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