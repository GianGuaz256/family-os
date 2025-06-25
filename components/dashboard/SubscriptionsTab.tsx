import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { AppHeader } from '../ui/AppHeader'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { AppConfig } from '../../lib/app-types'
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  Trash2, 
  Edit, 
  AlertCircle,
  TrendingUp,
  Tv,
  Zap,
  Shield,
  Monitor,
  Dumbbell,
  UtensilsCrossed,
  Car,
  Gamepad2,
  Newspaper,
  Cloud,
  Package,
  Eye,
  EyeOff,
  ExternalLink,
  Grid
} from 'lucide-react'

interface Subscription {
  id: string
  group_id: string
  title: string
  provider?: string
  cost: number
  currency: string
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  billing_day?: number
  payer_id?: string
  category?: 'streaming' | 'utilities' | 'insurance' | 'software' | 'fitness' | 'food' | 'transport' | 'gaming' | 'news' | 'cloud' | 'other'
  payment_method?: string
  next_payment_date: string
  start_date: string
  end_date?: string
  auto_renew: boolean
  notify_days_before: number
  is_active: boolean
  description?: string
  website_url?: string
  created_at: string
}

interface GroupMember {
  id: string
  user_id: string
  email?: string
  display_name?: string
}

interface SubscriptionsTabProps {
  subscriptions: Subscription[]
  groupId: string
  onUpdate: () => void
  isOnline: boolean
  currentUser: User
  appConfig?: AppConfig
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({
  subscriptions,
  groupId,
  onUpdate,
  isOnline,
  currentUser,
  appConfig
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'analytics'>('cards')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    provider: '',
    cost: '',
    currency: 'USD',
    billing_cycle: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    billing_day: '',
    payer_id: '',
    category: '' as '' | 'streaming' | 'utilities' | 'insurance' | 'software' | 'fitness' | 'food' | 'transport' | 'gaming' | 'news' | 'cloud' | 'other',
    payment_method: '',
    next_payment_date: '',
    start_date: '',
    end_date: '',
    auto_renew: true,
    notify_days_before: 3,
    description: '',
    website_url: ''
  })

  // Fetch group members for payer selection
  useEffect(() => {
    fetchGroupMembers()
  }, [groupId])

  // Listen for custom events from BottomActions
  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      if (event.detail.type === 'subscription') {
        setShowCreateModal(true)
      }
    }

    window.addEventListener('openCreateModal', handleOpenModal as EventListener)
    return () => {
      window.removeEventListener('openCreateModal', handleOpenModal as EventListener)
    }
  }, [])

  const fetchGroupMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id
        `)
        .eq('group_id', groupId)

      if (error) throw error

      // For now, we'll just use user IDs and emails
      // In a real app, you'd fetch user profiles
      setGroupMembers(data?.map(member => ({
        ...member,
        email: member.user_id === currentUser.id ? currentUser.email : `User ${member.user_id.slice(0, 8)}`,
        display_name: member.user_id === currentUser.id ? 'You' : `User ${member.user_id.slice(0, 8)}`
      })) || [])
    } catch (error) {
      console.error('Error fetching group members:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      provider: '',
      cost: '',
      currency: 'USD',
      billing_cycle: 'monthly',
      billing_day: '',
      payer_id: '',
      category: '',
      payment_method: '',
      next_payment_date: '',
      start_date: '',
      end_date: '',
      auto_renew: true,
      notify_days_before: 3,
      description: '',
      website_url: ''
    })
    setEditingSubscription(null)
  }

  const openEditModal = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setFormData({
      title: subscription.title,
      provider: subscription.provider || '',
      cost: subscription.cost.toString(),
      currency: subscription.currency,
      billing_cycle: subscription.billing_cycle,
      billing_day: subscription.billing_day?.toString() || '',
      payer_id: subscription.payer_id || '',
      category: subscription.category || '',
      payment_method: subscription.payment_method || '',
      next_payment_date: subscription.next_payment_date,
      start_date: subscription.start_date,
      end_date: subscription.end_date || '',
      auto_renew: subscription.auto_renew,
      notify_days_before: subscription.notify_days_before,
      description: subscription.description || '',
      website_url: subscription.website_url || ''
    })
    setShowEditModal(true)
  }

  const addSubscription = async () => {
    if (!formData.title.trim() || !formData.cost || !formData.next_payment_date || !formData.start_date || !isOnline) return

    setIsLoading(true)
    try {
      const subscriptionData = {
        group_id: groupId,
        title: formData.title,
        provider: formData.provider || null,
        cost: parseFloat(formData.cost),
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        billing_day: formData.billing_day ? parseInt(formData.billing_day) : null,
        payer_id: formData.payer_id || null,
        category: formData.category || null,
        payment_method: formData.payment_method || null,
        next_payment_date: formData.next_payment_date,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        auto_renew: formData.auto_renew,
        notify_days_before: formData.notify_days_before,
        is_active: true,
        description: formData.description || null,
        website_url: formData.website_url || null
      }

      const { error } = await supabase
        .from('subscriptions')
        .insert([subscriptionData])

      if (error) throw error
      
      resetForm()
      setShowCreateModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSubscription = async () => {
    if (!editingSubscription || !formData.title.trim() || !formData.cost || !formData.next_payment_date || !formData.start_date || !isOnline) return

    setIsLoading(true)
    try {
      const subscriptionData = {
        title: formData.title,
        provider: formData.provider || null,
        cost: parseFloat(formData.cost),
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        billing_day: formData.billing_day ? parseInt(formData.billing_day) : null,
        payer_id: formData.payer_id || null,
        category: formData.category || null,
        payment_method: formData.payment_method || null,
        next_payment_date: formData.next_payment_date,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        auto_renew: formData.auto_renew,
        notify_days_before: formData.notify_days_before,
        description: formData.description || null,
        website_url: formData.website_url || null
      }

      const { error } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', editingSubscription.id)

      if (error) throw error
      
      resetForm()
      setShowEditModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSubscription = async (subscriptionId: string) => {
    if (!isOnline || !confirm('Are you sure you want to delete this subscription?')) return

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting subscription:', error)
    }
  }

  const toggleSubscriptionStatus = async (subscriptionId: string, isActive: boolean) => {
    if (!isOnline) return

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ is_active: !isActive })
        .eq('id', subscriptionId)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error toggling subscription status:', error)
    }
  }

  // Helper functions
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'streaming': return Tv
      case 'utilities': return Zap
      case 'insurance': return Shield
      case 'software': return Monitor
      case 'fitness': return Dumbbell
      case 'food': return UtensilsCrossed
      case 'transport': return Car
      case 'gaming': return Gamepad2
      case 'news': return Newspaper
      case 'cloud': return Cloud
      default: return Package
    }
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'streaming': return 'bg-red-100 text-red-800 border-red-200'
      case 'utilities': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'insurance': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'software': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'fitness': return 'bg-green-100 text-green-800 border-green-200'
      case 'food': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'transport': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'gaming': return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'news': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cloud': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const calculateMonthlyTotal = () => {
    return subscriptions
      .filter(sub => sub.is_active)
      .reduce((total, sub) => {
        let monthlyAmount = sub.cost
        switch (sub.billing_cycle) {
          case 'weekly': monthlyAmount = sub.cost * 4.33; break
          case 'quarterly': monthlyAmount = sub.cost / 3; break
          case 'yearly': monthlyAmount = sub.cost / 12; break
          default: monthlyAmount = sub.cost
        }
        return total + monthlyAmount
      }, 0)
  }

  const calculateYearlyTotal = () => {
    return subscriptions
      .filter(sub => sub.is_active)
      .reduce((total, sub) => {
        let yearlyAmount = sub.cost
        switch (sub.billing_cycle) {
          case 'weekly': yearlyAmount = sub.cost * 52; break
          case 'monthly': yearlyAmount = sub.cost * 12; break
          case 'quarterly': yearlyAmount = sub.cost * 4; break
          default: yearlyAmount = sub.cost
        }
        return total + yearlyAmount
      }, 0)
  }

  const getUpcomingPayments = () => {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    
    return subscriptions
      .filter(sub => sub.is_active && new Date(sub.next_payment_date) <= nextWeek)
      .sort((a, b) => new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime())
  }

  const getCategoryBreakdown = () => {
    const breakdown = subscriptions
      .filter(sub => sub.is_active)
      .reduce((acc, sub) => {
        const category = sub.category || 'other'
        let monthlyAmount = sub.cost
        switch (sub.billing_cycle) {
          case 'weekly': monthlyAmount = sub.cost * 4.33; break
          case 'quarterly': monthlyAmount = sub.cost / 3; break
          case 'yearly': monthlyAmount = sub.cost / 12; break
        }
        acc[category] = (acc[category] || 0) + monthlyAmount
        return acc
      }, {} as Record<string, number>)

    return Object.entries(breakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isPaymentSoon = (date: string) => {
    const paymentDate = new Date(date)
    const today = new Date()
    const diffTime = paymentDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays >= 0
  }

  const activeSubscriptions = subscriptions.filter(sub => sub.is_active)
  const inactiveSubscriptions = subscriptions.filter(sub => !sub.is_active)
  const upcomingPayments = getUpcomingPayments()
  const categoryBreakdown = getCategoryBreakdown()

  return (
    <div className="space-y-6">
      {/* App Header with icon and styling */}
      {appConfig && (
        <AppHeader
          title={appConfig.name}
          appIcon={appConfig.icon}
          appColor={appConfig.color}
          appDescription={appConfig.description}
          transparent={true}
          showUserControls={false}
          viewSwitcher={
            <div className="inline-flex rounded-lg border bg-muted p-1 shrink-0">
              <button
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  viewMode === 'cards'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted-foreground/10'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  viewMode === 'analytics'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted-foreground/10'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
              </button>
            </div>
          }
        />
      )}
      
      {/* Header */}
      {!appConfig && (
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold truncate">Subscriptions</h2>
          <div className="inline-flex rounded-lg border bg-muted p-1 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                viewMode === 'cards'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted-foreground/10'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                viewMode === 'analytics'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted-foreground/10'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeSubscriptions.length}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly</p>
                <p className="text-2xl font-bold">{formatCurrency(calculateMonthlyTotal(), 'USD')}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yearly</p>
                <p className="text-2xl font-bold">{formatCurrency(calculateYearlyTotal(), 'USD')}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Soon</p>
                <p className="text-2xl font-bold">{upcomingPayments.length}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments Alert */}
      {upcomingPayments.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {upcomingPayments.length} payment(s) due in the next 7 days
          </AlertDescription>
        </Alert>
      )}

      {/* Content based on view mode */}
      {viewMode === 'cards' ? (
        <div className="space-y-6">
          {/* Active Subscriptions */}
          {activeSubscriptions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Active Subscriptions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSubscriptions.map((subscription) => {
                  const CategoryIcon = getCategoryIcon(subscription.category)
                  const categoryColor = getCategoryColor(subscription.category)
                  const payer = groupMembers.find(m => m.user_id === subscription.payer_id)
                  
                  return (
                    <Card key={subscription.id} className={`relative ${isPaymentSoon(subscription.next_payment_date) ? 'ring-2 ring-orange-200' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${categoryColor.replace('text-', 'text-').replace('bg-', 'bg-').replace('border-', 'bg-')}`}>
                              <CategoryIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{subscription.title}</h4>
                              {subscription.provider && (
                                <p className="text-sm text-muted-foreground">{subscription.provider}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSubscriptionStatus(subscription.id, subscription.is_active)}
                              disabled={!isOnline}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(subscription)}
                              disabled={!isOnline}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSubscription(subscription.id)}
                              disabled={!isOnline}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Cost</span>
                            <span className="font-semibold">
                              {formatCurrency(subscription.cost, subscription.currency)}
                              <span className="text-xs text-muted-foreground ml-1">
                                /{subscription.billing_cycle}
                              </span>
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Next Payment</span>
                            <span className={`text-sm font-medium ${isPaymentSoon(subscription.next_payment_date) ? 'text-orange-600' : ''}`}>
                              {formatDate(subscription.next_payment_date)}
                            </span>
                          </div>

                          {payer && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Payer</span>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {payer.display_name?.charAt(0).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{payer.display_name || payer.email}</span>
                              </div>
                            </div>
                          )}

                          {subscription.category && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Category</span>
                              <Badge variant="secondary" className={`text-xs ${categoryColor}`}>
                                {subscription.category}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {subscription.website_url && (
                          <div className="mt-3 pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => window.open(subscription.website_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit Website
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {subscriptions.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
                <p className="text-muted-foreground mb-4">Start tracking your family subscriptions to get cost insights</p>
                <Button onClick={() => setShowCreateModal(true)} disabled={!isOnline}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Subscription
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Analytics View */
        <div className="space-y-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {categoryBreakdown.map(({ category, amount }) => {
                    const percentage = (amount / calculateMonthlyTotal()) * 100
                    const CategoryIcon = getCategoryIcon(category)
                    const categoryColor = getCategoryColor(category)
                    
                    return (
                      <div key={category} className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${categoryColor.replace('text-', 'text-').replace('bg-', 'bg-').replace('border-', 'bg-')}`}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{category}</span>
                            <span className="text-sm font-semibold">{formatCurrency(amount, 'USD')}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No active subscriptions to analyze</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false)
          setShowEditModal(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}</DialogTitle>
            <DialogDescription>
              {editingSubscription ? 'Update subscription details' : 'Add a new recurring subscription to track family expenses'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Subscription Name *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Netflix, Spotify, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="Company name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="9.99"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Billing Cycle *</Label>
                <Select value={formData.billing_cycle} onValueChange={(value: any) => setFormData(prev => ({ ...prev, billing_cycle: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="streaming">Streaming</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="food">Food & Delivery</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="news">News & Media</SelectItem>
                    <SelectItem value="cloud">Cloud Storage</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payer_id">Who Pays?</Label>
                <Select value={formData.payer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, payer_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payer" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.display_name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="next_payment_date">Next Payment Date *</Label>
                <Input
                  id="next_payment_date"
                  type="date"
                  value={formData.next_payment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_payment_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                placeholder="Credit Card, PayPal, Bank Transfer, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://netflix.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional notes about this subscription..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingSubscription ? updateSubscription : addSubscription}
                disabled={!formData.title.trim() || !formData.cost || !formData.next_payment_date || !formData.start_date || isLoading || !isOnline}
              >
                {isLoading ? 'Saving...' : editingSubscription ? 'Update Subscription' : 'Add Subscription'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 