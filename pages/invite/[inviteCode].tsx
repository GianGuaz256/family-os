import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { User } from '@supabase/supabase-js'
import { supabase, getAuthRedirectUrl } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher'
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  UserPlus,
  LogIn
} from 'lucide-react'

interface FamilyGroup {
  id: string
  name: string
  owner_id: string
  invite_code: string
  created_at: string
}

export default function InvitePage() {
  const router = useRouter()
  const { inviteCode } = router.query
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [family, setFamily] = useState<FamilyGroup | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState(false)
  
  // Auth form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  useEffect(() => {
    // Check current auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        if (session?.user && family && event === 'SIGNED_IN') {
          // User just authenticated, try to join the family
          await joinFamily()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [family])

  useEffect(() => {
    if (router.isReady && inviteCode && typeof inviteCode === 'string') {
      fetchFamilyByInviteCode(inviteCode)
    }
  }, [router.isReady, inviteCode])

  const fetchFamilyByInviteCode = async (code: string) => {
    try {
      setError('')
      const { data, error } = await supabase
        .from('family_groups')
        .select('*')
        .eq('invite_code', code)
        .single()

      if (error) {
        console.error('Error fetching family by invite code:', error)
        if (error.code === 'PGRST116') {
          setError('Invalid or expired invite link.')
        } else {
          setError('Failed to load family information.')
        }
        return
      }

      if (data) {
        setFamily(data)
      } else {
        setError('Invalid or expired invite link.')
      }
    } catch (error: any) {
      console.error('Error fetching family:', error)
      setError('Failed to load family information.')
    }
  }

  const joinFamily = async () => {
    if (!user || !family) return

    setIsJoining(true)
    try {
      setError('')
      
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', family.id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        setSuccess('You are already a member of this family!')
        setTimeout(() => {
          router.push('/')
        }, 2000)
        return
      }

      // Add user to the family
      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: family.id,
          user_id: user.id
        }])

      if (error) throw error

      setSuccess(`Welcome to "${family.name}"! Redirecting to your family dashboard...`)
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error: any) {
      console.error('Error joining family:', error)
      setError('Failed to join family. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName
            },
            emailRedirectTo: getAuthRedirectUrl(`/invite/${inviteCode}`)
          }
        })

        if (error) throw error

        if (!data.user?.email_confirmed_at) {
          setSuccess('Please check your email to confirm your account, then return to this link.')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
        
        // joinFamily will be called automatically via the auth state change
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsAuthLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !family) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute top-6 right-6">
          <ThemeSwitcher size="sm" showLabel />
        </div>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Family OS
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute top-6 right-6">
          <ThemeSwitcher size="sm" showLabel />
        </div>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Success!</h2>
            <p className="text-muted-foreground">{success}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="absolute top-6 right-6">
        <ThemeSwitcher size="sm" showLabel />
      </div>
      
      <div className="w-full max-w-md p-6">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/20 shadow-xl">
          <CardHeader className="space-y-4 pb-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold mb-2">
                Join "{family?.name}"
              </CardTitle>
              <CardDescription className="text-base">
                You've been invited to join a family on Family OS
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {user ? (
              // User is authenticated - show join button
              <div className="space-y-4 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    You're signed in as:
                  </p>
                  <p className="font-medium">{user.email}</p>
                </div>
                
                <Button
                  onClick={joinFamily}
                  disabled={isJoining}
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  size="lg"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Joining Family...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Join "{family?.name}"
                    </>
                  )}
                </Button>
              </div>
            ) : showAuthForm ? (
              // Show auth form
              <form onSubmit={handleAuth} className="space-y-5">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="display-name" className="text-sm font-medium">Display Name</Label>
                    <Input
                      id="display-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="h-12 text-base"
                    />
                  </div>
                )}
                
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
                
                <div className="space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    disabled={isAuthLoading}
                    size="lg"
                  >
                    {isAuthLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {isSignUp ? 'Creating Account...' : 'Signing In...'}
                      </>
                    ) : (
                      <>
                        {isSignUp ? (
                          <>
                            <UserPlus className="h-5 w-5 mr-2" />
                            Create Account & Join
                          </>
                        ) : (
                          <>
                            <LogIn className="h-5 w-5 mr-2" />
                            Sign In & Join
                          </>
                        )}
                      </>
                    )}
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
            ) : (
              // Show initial options
              <div className="space-y-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    To join this family, you need to sign in or create an account
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowAuthForm(true)}
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    size="lg"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In to Join
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setIsSignUp(true)
                      setShowAuthForm(true)
                    }}
                    variant="outline"
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create Account to Join
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 