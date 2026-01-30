import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import { supabase, getAuthRedirectUrl } from '../../lib/supabase'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { LanguageSelector } from '../ui/LanguageSelector'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'

export const ForgotPasswordForm: React.FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl('/auth/reset-password')
      })

      if (error) throw error
      
      setSuccess(true)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = (): void => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Theme switcher and language selector in top-right corner */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
        <LanguageSelector variant="compact" />
        <ThemeSwitcher size="sm" showLabel />
      </div>
      
      <div className="w-full max-w-md p-6">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border-white/20 shadow-xl">
          <CardHeader className="space-y-4 pb-6">
            {/* Logo/Icon */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">🔑</span>
              </div>
              <CardTitle className="text-3xl font-bold mb-2">
                {t('auth.forgotPasswordTitle')}
              </CardTitle>
              <CardDescription className="text-base">
                {t('auth.forgotPasswordDescription')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {success ? (
              <>
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {t('auth.resetLinkSent')}
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base"
                  onClick={handleBackToLogin}
                  size="lg"
                >
                  {t('auth.backToLogin')}
                </Button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t('auth.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t('auth.emailPlaceholder')}
                    className="h-12 text-base"
                  />
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
                    {isLoading ? t('common.loading') : t('auth.sendResetLink')}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-12 text-base"
                    onClick={handleBackToLogin}
                    size="lg"
                  >
                    {t('auth.backToLogin')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
