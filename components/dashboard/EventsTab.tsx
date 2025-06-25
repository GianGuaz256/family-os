import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { AppHeader } from '../ui/AppHeader'
import {
  CalendarProvider,
  CalendarDate,
  CalendarDatePicker,
  CalendarMonthPicker,
  CalendarYearPicker,
  CalendarDatePagination,
  CalendarHeader,
  CalendarBody,
  CalendarItem,
  useCalendar,
  type Feature
} from '../ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { AppConfig } from '../../lib/app-types'
import { Plus, Calendar as CalendarIcon, Clock, Trash2, Grid, List, Repeat, CalendarDays, FileText, Edit, MapPin, Filter, DollarSign } from 'lucide-react'
// Removed date-fns dependency - using native Date methods instead

interface Event {
  id: string
  title: string
  date: string
  start_datetime?: string
  end_datetime?: string
  event_type: 'single' | 'recurring' | 'range'
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  recurrence_interval?: number
  recurrence_end_date?: string
  description?: string
  created_at: string
}

interface Subscription {
  id: string
  group_id: string
  title: string
  provider?: string
  cost: number
  currency: string
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  next_payment_date: string
  category?: string
  payer_id?: string
  is_active: boolean
  created_at: string
}

interface EventsTabProps {
  events: Event[]
  subscriptions?: Subscription[]
  groupId: string
  onUpdate: () => void
  isOnline: boolean
  appConfig?: AppConfig
}

export const EventsTab: React.FC<EventsTabProps> = ({
  events,
  subscriptions = [],
  groupId,
  onUpdate,
  isOnline,
  appConfig
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventStartTime, setNewEventStartTime] = useState('')
  const [newEventEndTime, setNewEventEndTime] = useState('')
  const [newEventEndDate, setNewEventEndDate] = useState('')
  const [newEventType, setNewEventType] = useState<'single' | 'recurring' | 'range'>('single')
  const [newEventDescription, setNewEventDescription] = useState('')
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(() => {
    // Initialize from localStorage if available, otherwise default to 'calendar'
    if (typeof window !== 'undefined') {
      const savedViewMode = localStorage.getItem('family-os-events-view-mode')
      return (savedViewMode === 'list' || savedViewMode === 'calendar') ? savedViewMode : 'calendar'
    }
    return 'calendar'
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickEventTitle, setQuickEventTitle] = useState('')
  const [eventFilter, setEventFilter] = useState<'all' | 'events' | 'subscriptions'>('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeleteRangeModal, setShowDeleteRangeModal] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState<(Event & { isInstance?: boolean; originalDate?: string; isSubscription?: boolean }) | null>(null)
  const [deleteOption, setDeleteOption] = useState<'single' | 'all' | 'future'>('single')

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('family-os-events-view-mode', viewMode)
    }
  }, [viewMode])

  // Helper function to format date in local timezone (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Listen for custom events from BottomActions
  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      if (event.detail.type === 'event') {
        // Pre-fill date if one is selected
        if (selectedDate) {
          setNewEventDate(formatDateForInput(selectedDate))
        }
        setShowCreateModal(true)
      }
    }

    window.addEventListener('openCreateModal', handleOpenModal as EventListener)
    return () => {
      window.removeEventListener('openCreateModal', handleOpenModal as EventListener)
    }
  }, [selectedDate])

  const resetForm = () => {
    setNewEventTitle('')
    setNewEventDate('')
    setNewEventStartTime('')
    setNewEventEndTime('')
    setNewEventEndDate('')
    setNewEventType('single')
    setNewEventDescription('')
    setRecurrencePattern('weekly')
    setRecurrenceInterval(1)
    setRecurrenceEndDate('')
    setEditingEvent(null)
  }

  const resetDeleteModal = () => {
    setShowDeleteModal(false)
    setShowDeleteRangeModal(false)
    setDeletingEvent(null)
    setDeleteOption('single')
  }

  const openEditModal = (event: Event) => {
    setEditingEvent(event)
    setNewEventTitle(event.title)
    setNewEventDate(event.date)
    
    // Parse datetime fields to separate date and time
    if (event.start_datetime) {
      const startDate = new Date(event.start_datetime)
      setNewEventDate(formatDateForInput(startDate))
      setNewEventStartTime(startDate.toTimeString().slice(0, 5))
    }
    
    if (event.end_datetime) {
      const endDate = new Date(event.end_datetime)
      if (event.event_type === 'range') {
        setNewEventEndDate(formatDateForInput(endDate))
        // Only set end time if it's not the default end-of-day time (23:59)
        const timeString = endDate.toTimeString().slice(0, 5)
        if (timeString !== '23:59') {
          setNewEventEndTime(timeString)
        }
      } else {
        setNewEventEndTime(endDate.toTimeString().slice(0, 5))
      }
    }
    
    setNewEventType(event.event_type)
    setNewEventDescription(event.description || '')
    setRecurrencePattern(event.recurrence_pattern || 'weekly')
    setRecurrenceInterval(event.recurrence_interval || 1)
    setRecurrenceEndDate(event.recurrence_end_date || '')
    setShowEditModal(true)
  }

  const buildDateTimeString = (date: string, time?: string): string => {
    if (!time) {
      // If no time specified, use the date as-is for backward compatibility
      return date
    }
    return `${date}T${time}:00`
  }

  const addEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate || !isOnline) return

    // Validation for different event types
    if (newEventType === 'range' && !newEventEndDate) {
      alert('Please select an end date for date range events')
      return
    }

    setIsLoading(true)
    try {
      const eventData: any = {
        group_id: groupId,
        title: newEventTitle,
        date: newEventDate,
        event_type: newEventType,
        description: newEventDescription || null
      }

      // Add datetime fields if times are specified
      if (newEventStartTime) {
        eventData.start_datetime = buildDateTimeString(newEventDate, newEventStartTime)
      }

      // Add fields based on event type
      if (newEventType === 'range') {
        // Always set end_datetime for range events to ensure calendar display works
        eventData.end_datetime = newEventEndTime 
          ? buildDateTimeString(newEventEndDate, newEventEndTime)
          : buildDateTimeString(newEventEndDate, '23:59') // End of day if no time specified
      } else if (newEventType === 'recurring') {
        eventData.recurrence_pattern = recurrencePattern
        eventData.recurrence_interval = recurrenceInterval
        eventData.recurrence_end_date = recurrenceEndDate || null
      }

      // Add end time for single events if specified
      if (newEventType === 'single' && newEventEndTime) {
        eventData.end_datetime = buildDateTimeString(newEventDate, newEventEndTime)
      }

      const { error } = await supabase
        .from('events')
        .insert([eventData])

      if (error) throw error
      
      resetForm()
      setShowCreateModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateEvent = async () => {
    if (!editingEvent || !newEventTitle.trim() || !newEventDate || !isOnline) return

    // Validation for different event types
    if (newEventType === 'range' && !newEventEndDate) {
      alert('Please select an end date for date range events')
      return
    }

    setIsLoading(true)
    try {
      const eventData: any = {
        title: newEventTitle,
        date: newEventDate,
        event_type: newEventType,
        description: newEventDescription || null,
        start_datetime: null,
        end_datetime: null
      }

      // Add datetime fields if times are specified
      if (newEventStartTime) {
        eventData.start_datetime = buildDateTimeString(newEventDate, newEventStartTime)
      }

      // Add fields based on event type
      if (newEventType === 'range') {
        // Always set end_datetime for range events to ensure calendar display works
        eventData.end_datetime = newEventEndTime 
          ? buildDateTimeString(newEventEndDate, newEventEndTime)
          : buildDateTimeString(newEventEndDate, '23:59') // End of day if no time specified
      } else if (newEventType === 'recurring') {
        eventData.recurrence_pattern = recurrencePattern
        eventData.recurrence_interval = recurrenceInterval
        eventData.recurrence_end_date = recurrenceEndDate || null
      }

      // Add end time for single events if specified
      if (newEventType === 'single' && newEventEndTime) {
        eventData.end_datetime = buildDateTimeString(newEventDate, newEventEndTime)
      }

      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', editingEvent.id)

      if (error) throw error
      
      resetForm()
      setShowEditModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addQuickEvent = async () => {
    if (!quickEventTitle.trim() || !selectedDate || !isOnline) return

    setIsLoading(true)
    try {
      const eventData = {
        group_id: groupId,
        title: quickEventTitle,
        date: formatDateForInput(selectedDate),
        event_type: 'single' as const,
        description: null
      }

      const { error } = await supabase
        .from('events')
        .insert([eventData])

      if (error) throw error
      
      // Reset form
      setQuickEventTitle('')
      setShowQuickAdd(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding quick event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  // Sync with calendar's selected date on mount
  useEffect(() => {
    if (selectedDate) {
      // Set the calendar's selected date to match our local state
      const { setSelectedDate: setCalendarSelectedDate } = useCalendar.getState()
      setCalendarSelectedDate(selectedDate)
    }
  }, [])

  const handleQuickAdd = () => {
    if (selectedDate) {
      setShowQuickAdd(true)
    }
  }

  const handleDeleteClick = (event: Event & { isInstance?: boolean; originalDate?: string; isSubscription?: boolean }) => {
    if (!isOnline) return
    
    // If it's a subscription, delete directly
    if (event.isSubscription) {
      if (confirm('Are you sure you want to delete this subscription?')) {
        deleteEventDirect(event.id)
      }
      return
    }
    
    // If it's a single event, delete directly
    if (event.event_type === 'single') {
      if (confirm('Are you sure you want to delete this event?')) {
        deleteEventDirect(event.id)
      }
      return
    }
    
    // If it's a date range event, show confirmation modal
    if (event.event_type === 'range') {
      setDeletingEvent(event)
      setShowDeleteRangeModal(true)
      return
    }
    
    // If it's a recurring event, show modal with options
    setDeletingEvent(event)
    setShowDeleteModal(true)
  }

  const deleteEventDirect = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleDeleteRangeEvent = async () => {
    if (!deletingEvent || !isOnline) return

    setIsLoading(true)
    try {
      await deleteEventDirect(deletingEvent.id)
      resetDeleteModal()
    } catch (error) {
      console.error('Error deleting range event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecurringEventDelete = async () => {
    if (!deletingEvent || !isOnline) return

    setIsLoading(true)
    try {
      // Extract the original UUID from instance IDs
      // Instance IDs are in format: "uuid-YYYY-MM-DD"
      // We need to extract just the UUID part (36 characters including hyphens)
      const originalId = deletingEvent.id.length > 36 
        ? deletingEvent.id.substring(0, 36)
        : deletingEvent.id

      switch (deleteOption) {
        case 'single':
          // For single instance deletion, we need to add an exception date or split the series
          await handleSingleInstanceDelete(originalId, deletingEvent.date)
          break
          
        case 'all':
          // Delete the entire recurring series
          await deleteEventDirect(originalId)
          break
          
        case 'future':
          // Update the recurrence_end_date to be the day before this instance
          await handleFutureInstancesDelete(originalId, deletingEvent.date)
          break
      }
      
      resetDeleteModal()
      onUpdate()
    } catch (error) {
      console.error('Error deleting recurring event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSingleInstanceDelete = async (originalId: string, instanceDate: string) => {
    const { data: originalEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', originalId)
      .single()

    if (fetchError) throw fetchError

    const originalStartDate = new Date(originalEvent.date)
    const deleteDate = new Date(instanceDate)
    const endDate = originalEvent.recurrence_end_date ? new Date(originalEvent.recurrence_end_date) : null

    // Case 1: Deleting the first instance - shift the start date
    if (originalEvent.date === instanceDate) {
      const nextDate = calculateNextOccurrence(
        originalStartDate, 
        originalEvent.recurrence_pattern, 
        originalEvent.recurrence_interval || 1
      )
      
      const { error } = await supabase
        .from('events')
        .update({ 
          date: nextDate.toISOString().split('T')[0],
          start_datetime: originalEvent.start_datetime ? 
            buildDateTimeString(nextDate.toISOString().split('T')[0], originalEvent.start_datetime.split('T')[1]?.slice(0, 5)) :
            null
        })
        .eq('id', originalId)
        
      if (error) throw error
      return
    }

    // Case 2: Deleting the last instance (if there's an end date and this is the last occurrence)
    if (endDate && deleteDate.getTime() === endDate.getTime()) {
      const previousDate = calculatePreviousOccurrence(
        deleteDate,
        originalEvent.recurrence_pattern,
        originalEvent.recurrence_interval || 1
      )
      
      const { error } = await supabase
        .from('events')
        .update({ 
          recurrence_end_date: previousDate.toISOString().split('T')[0]
        })
        .eq('id', originalId)
        
      if (error) throw error
      return
    }

    // Case 3: Deleting from the middle - split the series into two parts
    // First part: original event ending the day before the deleted instance
    const dayBefore = new Date(deleteDate)
    dayBefore.setDate(dayBefore.getDate() - 1)
    
    // Update the original event to end before the deleted instance
    const { error: updateError } = await supabase
      .from('events')
      .update({ 
        recurrence_end_date: dayBefore.toISOString().split('T')[0]
      })
      .eq('id', originalId)
    
    if (updateError) throw updateError

    // Second part: create a new series starting after the deleted instance
    // Only if there are more occurrences after the deleted date
    const dayAfter = calculateNextOccurrence(
      deleteDate,
      originalEvent.recurrence_pattern,
      originalEvent.recurrence_interval || 1
    )

    // Check if there should be a second series (if original had an end date and dayAfter is before it)
    const shouldCreateSecondSeries = !endDate || dayAfter <= endDate

    if (shouldCreateSecondSeries) {
      const newEventData: any = {
        group_id: originalEvent.group_id,
        title: originalEvent.title,
        date: dayAfter.toISOString().split('T')[0],
        event_type: originalEvent.event_type,
        recurrence_pattern: originalEvent.recurrence_pattern,
        recurrence_interval: originalEvent.recurrence_interval,
        recurrence_end_date: originalEvent.recurrence_end_date,
        description: originalEvent.description
      }

      // Copy datetime fields if they exist
      if (originalEvent.start_datetime) {
        newEventData.start_datetime = buildDateTimeString(
          dayAfter.toISOString().split('T')[0], 
          originalEvent.start_datetime.split('T')[1]?.slice(0, 5)
        )
      }

      if (originalEvent.end_datetime) {
        newEventData.end_datetime = buildDateTimeString(
          dayAfter.toISOString().split('T')[0], 
          originalEvent.end_datetime.split('T')[1]?.slice(0, 5)
        )
      }

      const { error: createError } = await supabase
        .from('events')
        .insert([newEventData])

      if (createError) throw createError
    }
  }

  const handleFutureInstancesDelete = async (originalId: string, fromDate: string) => {
    // Set the recurrence_end_date to the day before this instance
    const instanceDate = new Date(fromDate)
    const endDate = new Date(instanceDate)
    endDate.setDate(endDate.getDate() - 1)
    
    const { error } = await supabase
      .from('events')
      .update({ 
        recurrence_end_date: endDate.toISOString().split('T')[0] 
      })
      .eq('id', originalId)
      
    if (error) throw error
  }

  const calculateNextOccurrence = (date: Date, pattern: string, interval: number): Date => {
    const nextDate = new Date(date)
    
    switch (pattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval)
        break
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * interval))
        break
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval)
        break
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + interval)
        break
    }
    
    return nextDate
  }

  const calculatePreviousOccurrence = (date: Date, pattern: string, interval: number): Date => {
    const prevDate = new Date(date)
    
    switch (pattern) {
      case 'daily':
        prevDate.setDate(prevDate.getDate() - interval)
        break
      case 'weekly':
        prevDate.setDate(prevDate.getDate() - (7 * interval))
        break
      case 'monthly':
        prevDate.setMonth(prevDate.getMonth() - interval)
        break
      case 'yearly':
        prevDate.setFullYear(prevDate.getFullYear() - interval)
        break
    }
    
    return prevDate
  }

  // Helper function to generate recurring event instances
  const generateRecurringInstances = (event: Event): Array<Event & { isInstance: boolean }> => {
    if (event.event_type !== 'recurring' || !event.recurrence_pattern) {
      return [{ ...event, isInstance: false }]
    }

    const instances: Array<Event & { isInstance: boolean }> = []
    const startDate = new Date(event.date)
    const interval = event.recurrence_interval || 1
    
    // If no end date, generate instances for the next 2 years
    const maxDate = event.recurrence_end_date 
      ? new Date(event.recurrence_end_date)
      : new Date(startDate.getFullYear() + 2, startDate.getMonth(), startDate.getDate())
    
    let currentDate = new Date(startDate)
    let instanceCount = 0
    const maxInstances = 1000 // Safety limit to prevent infinite loops
    
    while (currentDate <= maxDate && instanceCount < maxInstances) {
      instances.push({
        ...event,
        id: `${event.id}-${currentDate.toISOString().split('T')[0]}`,
        date: currentDate.toISOString().split('T')[0],
        isInstance: currentDate.getTime() !== startDate.getTime()
      })
      
      instanceCount++
      
      // Calculate next occurrence
      switch (event.recurrence_pattern) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + interval)
          break
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * interval))
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + interval)
          break
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + interval)
          break
      }
    }
    
    return instances
  }

  // Helper function to format currency
  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount)
    } catch {
      return `${currency} ${amount.toFixed(2)}`
    }
  }

  // Convert subscriptions to event-like objects for unified display
  const subscriptionEvents = subscriptions
    .filter(sub => sub.is_active)
    .map(sub => ({
      ...sub,
      id: `subscription-${sub.id}`,
      title: `💳 ${sub.title}${sub.cost ? ` - ${formatCurrency(sub.cost, sub.currency)}` : ''}`,
      date: sub.next_payment_date,
      start_datetime: undefined,
      end_datetime: undefined,
      event_type: 'subscription' as const,
      recurrence_pattern: undefined,
      recurrence_interval: undefined,
      recurrence_end_date: undefined,
      description: `Subscription payment - ${sub.billing_cycle}${sub.provider ? ` | ${sub.provider}` : ''}`,
      isSubscription: true
    }))

  // Expand all events to include recurring instances (for calendar display)
  const expandedEvents = events.flatMap(event => generateRecurringInstances(event))

  // Create a filtered version for upcoming events list with special handling
  const getUpcomingListEvents = () => {
    const upcomingListEvents: any[] = []
    
    events.forEach(event => {
      if (event.event_type === 'recurring') {
        // For recurring events, only show the first occurrence in upcoming list
        const firstInstance = generateRecurringInstances(event)[0]
        if (firstInstance) {
          upcomingListEvents.push({ ...firstInstance, isFirstRecurrence: true })
        }
      } else if (event.event_type === 'range') {
        // For date range events, show both start and end dates
        upcomingListEvents.push({
          ...event,
          id: `${event.id}-start`,
          isRangeStart: true
        })
        
        if (event.end_datetime) {
          const endDate = new Date(event.end_datetime).toISOString().split('T')[0]
          upcomingListEvents.push({
            ...event,
            id: `${event.id}-end`,
            date: endDate,
            title: `${event.title} (Ends)`,
            isRangeEnd: true
          })
        }
      } else {
        // Single events remain unchanged
        upcomingListEvents.push({ ...event, isInstance: false })
      }
    })
    
    return upcomingListEvents
  }

  // Combine events and subscriptions based on filter
  const getFilteredEvents = () => {
    switch (eventFilter) {
      case 'events':
        return expandedEvents
      case 'subscriptions':
        return subscriptionEvents as any[]
      default:
        return [...expandedEvents, ...subscriptionEvents] as any[]
    }
  }

  const allDisplayEvents = getFilteredEvents()
  const upcomingListEvents = getUpcomingListEvents()

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const formatShortDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid'
    }
  }

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return null
    }
  }

  const getEventTimeDisplay = (event: Event) => {
    const startTime = event.start_datetime ? formatTime(event.start_datetime) : null
    const endTime = event.end_datetime ? formatTime(event.end_datetime) : null
    
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`
    } else if (startTime) {
      return startTime
    } else if (endTime) {
      return `Until ${endTime}`
    }
    return null
  }

  // Helper function to get event type info
  const getEventTypeInfo = (event: any) => {
    // Handle special upcoming list event types
    if (event.isFirstRecurrence) {
      return {
        icon: Repeat,
        label: `First of recurring ${event.recurrence_pattern}`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-l-blue-500'
      }
    }
    
    if (event.isRangeStart) {
      return {
        icon: CalendarDays,
        label: `Range starts`,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-l-purple-500'
      }
    }
    
    if (event.isRangeEnd) {
      return {
        icon: CalendarDays,
        label: `Range ends`,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-l-purple-500'
      }
    }

    switch (event.event_type) {
      case 'recurring':
        return {
          icon: Repeat,
          label: `Recurring ${event.recurrence_pattern}`,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-l-blue-500'
        }
      case 'range':
        return {
          icon: CalendarDays,
          label: `Until ${formatShortDate(event.end_datetime ? new Date(event.end_datetime).toISOString().split('T')[0] : event.date)}`,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          borderColor: 'border-l-purple-500'
        }
      default:
        return {
          icon: CalendarIcon,
          label: 'Single event',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-l-green-500'
        }
    }
  }

  const isUpcoming = (dateString: string) => {
    try {
      // Fix timezone issue by forcing local timezone
      const eventDate = new Date(dateString + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= today
    } catch {
      return false
    }
  }

  // Sort all events for calendar display
  const sortedEvents = allDisplayEvents.sort((a, b) => {
    try {
      const dateA = new Date(a.date + 'T00:00:00').getTime()
      const dateB = new Date(b.date + 'T00:00:00').getTime()
      return dateA - dateB
    } catch {
      return 0
    }
  })

  // Sort upcoming list events separately
  const sortedUpcomingListEvents = [...upcomingListEvents, ...subscriptionEvents].sort((a, b) => {
    try {
      const dateA = new Date(a.date + 'T00:00:00').getTime()
      const dateB = new Date(b.date + 'T00:00:00').getTime()
      return dateA - dateB
    } catch {
      return 0
    }
  })

  const upcomingEvents = sortedUpcomingListEvents.filter(event => isUpcoming(event.date))
  const pastEvents = sortedUpcomingListEvents.filter(event => !isUpcoming(event.date))

  // Get minimum date for input (today)
  const today = formatDateForInput(new Date())

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return allDisplayEvents.filter(event => {
      // Fix timezone issue by forcing local timezone
      const eventDate = new Date(event.date + 'T00:00:00')
      
      // For single events and recurring instances, check exact date match
      if (event.event_type !== 'range') {
        return eventDate.getFullYear() === date.getFullYear() &&
               eventDate.getMonth() === date.getMonth() &&
               eventDate.getDate() === date.getDate()
      }
      
      // For date range events, check if the selected date falls within the range
      const startDate = new Date(event.date + 'T00:00:00')
      const endDate = event.end_datetime ? new Date(event.end_datetime) : startDate
      
      // Reset time to compare dates only
      const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const rangeStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      
      return selectedDate >= rangeStart && selectedDate <= rangeEnd
    })
  }

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  // Reusable Event Card Component
  const EventCard: React.FC<{
    event: any // Using any to handle both events and subscriptions
    variant?: 'list' | 'compact'
    showDate?: boolean
  }> = ({ event, variant = 'list', showDate = false }) => {
    const typeInfo = getEventTypeInfo(event)
    const TypeIcon = typeInfo.icon
    const timeDisplay = getEventTimeDisplay(event)
    const isUpcomingEvent = isUpcoming(event.date)
    const isSubscription = event.isSubscription || event.event_type === 'subscription'
    
    if (variant === 'compact') {
      return (
        <Card className="hover:shadow-md transition-shadow relative">
          <div 
            className="absolute left-3 top-3 bottom-3 w-1 rounded-full"
            style={{ backgroundColor: typeInfo.borderColor === 'border-l-blue-500' ? '#3B82F6' : 
                     typeInfo.borderColor === 'border-l-green-500' ? '#10B981' : 
                     typeInfo.borderColor === 'border-l-purple-500' ? '#8B5CF6' : '#6B7280' }}
          />
          <CardContent className="p-3 pl-8">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{event.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TypeIcon className="h-3 w-3" />
                  </div>
                </div>
                {timeDisplay && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mb-1">
                    <Clock className="h-3 w-3" />
                    <span>{timeDisplay}</span>
                  </div>
                )}
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-1 overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {event.description}
                  </p>
                )}
                <div className={`${typeInfo.bgColor} ${typeInfo.color} px-2 py-1 rounded text-xs font-medium mt-2 inline-block`}>
                  {typeInfo.label}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                {!isSubscription ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(event)}
                      disabled={!isOnline}
                      className="text-gray-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(event)}
                      disabled={!isOnline}
                      className="text-gray-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground px-2">
                    Subscription
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    // List variant (full size)
    const borderColor = isUpcomingEvent ? 'border-l-green-400' : 'border-l-gray-300'
    const gradientColors = isUpcomingEvent ? 'from-green-50 to-white' : 'from-gray-50 to-white'
    const opacity = isUpcomingEvent ? '' : 'opacity-75 hover:opacity-90'
    const badgeBorder = isUpcomingEvent ? 'border-green-200' : 'border-gray-200'
    const badgeTextColor = isUpcomingEvent ? 'text-green-600' : 'text-gray-500'
    const badgeNumberColor = isUpcomingEvent ? 'text-green-800' : 'text-gray-600'
    const titleColor = isUpcomingEvent ? 'text-gray-900' : 'text-gray-700'
    const timeColor = isUpcomingEvent ? 'text-green-700' : 'text-gray-600'
    const descColor = isUpcomingEvent ? 'text-gray-600' : 'text-gray-500'
    const dateColor = isUpcomingEvent ? 'text-gray-500' : 'text-gray-400'

    return (
      <Card className={`modern-card bg-gradient-to-r ${gradientColors} hover:shadow-md transition-all duration-200 ${opacity} relative`}>
        <div 
          className="absolute left-4 top-4 bottom-4 w-1 rounded-full"
          style={{ backgroundColor: isUpcomingEvent ? 
            (typeInfo.borderColor === 'border-l-blue-500' ? '#3B82F6' : 
             typeInfo.borderColor === 'border-l-green-500' ? '#10B981' : 
             typeInfo.borderColor === 'border-l-purple-500' ? '#8B5CF6' : '#10B981') : '#6B7280' }}
        />
        <CardContent className="p-4 pl-10">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              {/* Date Badge */}
              <div className="flex-shrink-0">
                <div className={`bg-white border-2 ${badgeBorder} rounded-2xl px-3 py-2 text-center min-w-[60px]`}>
                  <div className={`text-xs font-medium ${badgeTextColor} uppercase tracking-wide`}>
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className={`text-lg font-bold ${badgeNumberColor}`}>
                    {new Date(event.date).getDate()}
                  </div>
                </div>
              </div>
              
              {/* Event Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className={`font-semibold ${titleColor} text-lg leading-tight mb-1`}>
                      {event.title}
                    </h3>
                    {timeDisplay && (
                      <div className={`flex items-center gap-1 ${timeColor} text-sm font-medium mb-1`}>
                        <Clock className="h-4 w-4" />
                        <span>{timeDisplay}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Event Type Indicator */}
                  <div className="flex items-center gap-2 ml-4">
                    <div className={`${isUpcomingEvent ? typeInfo.bgColor : 'bg-gray-100'} ${isUpcomingEvent ? typeInfo.color : 'text-gray-600'} px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
                      <TypeIcon className="h-3 w-3" />
                      <span className="hidden sm:inline">{typeInfo.label}</span>
                    </div>
                  </div>
                </div>
                
                {event.description && (
                  <p className={`text-sm ${descColor} mb-2 line-clamp-2`}>
                    {event.description}
                  </p>
                )}
                
                <p className={`text-sm ${dateColor}`}>
                  {formatDate(event.date)}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 ml-2">
              {!isSubscription ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(event)}
                    disabled={!isOnline}
                    className={`${isUpcomingEvent ? 'text-gray-600 hover:text-blue-700 hover:bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'} p-2 h-auto`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(event)}
                    disabled={!isOnline}
                    className={`${isUpcomingEvent ? 'text-gray-600 hover:text-red-700 hover:bg-red-50' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'} p-2 h-auto`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-sm text-muted-foreground font-medium bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full">
                  💳 Subscription
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Reusable Selected Date Events Component
  const SelectedDateEvents: React.FC<{
    isDesktop?: boolean
  }> = ({ isDesktop = false }) => {
    if (!selectedDate) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Click on a date in the calendar to see events</p>
        </div>
      )
    }

    if (selectedDateEvents.length === 0) {
      return (
                 <div className="text-center py-8 text-muted-foreground">
           <CalendarIcon className={`${isDesktop ? 'h-12 w-12' : 'h-8 w-8'} mx-auto mb-3 opacity-50`} />
           <p className="text-sm mb-3">No events on this date</p>
          <Button
            size="sm"
            onClick={handleQuickAdd}
            disabled={!isOnline}
            variant="outline"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Event
          </Button>
        </div>
      )
    }

    return (
      <div className={`space-y-3 ${isDesktop ? 'max-h-96 overflow-y-auto' : ''}`}>
        {selectedDateEvents.map((event) => (
          <EventCard key={event.id} event={event} variant="compact" />
        ))}
      </div>
    )
  }

  const renderListView = () => (
    <div className="space-y-8">
      {events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold mb-2">
            No events yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Add your first event to get started
          </p>
        </div>
      ) : (
        <>
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="list" />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-gray-600" />
                Past Events
              </h3>
              <div className="space-y-3">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="list" />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  // Convert events to calendar features format
  const convertEventsToFeatures = (): Feature[] => {
    return allDisplayEvents.map((event) => {
      const typeInfo = getEventTypeInfo(event)
      
      // Fix timezone issue for calendar display
      // When no time is set, ensure we parse the date in local timezone
      const parseEventDate = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00') // Force local timezone
        return date
      }
      
      const startDate = parseEventDate(event.date)
      const endDate = event.end_datetime ? new Date(event.end_datetime) : startDate
      
      return {
        id: event.id,
        name: event.title,
        startAt: startDate,
        endAt: endDate,
        status: {
          id: event.event_type,
          name: typeInfo.label,
          color: typeInfo.borderColor === 'border-blue-500' ? '#3B82F6' : 
                 typeInfo.borderColor === 'border-green-500' ? '#10B981' : 
                 typeInfo.borderColor === 'border-purple-500' ? '#8B5CF6' : '#6B7280'
        }
      }
    })
  }

  // Get earliest and latest years from events for year picker
  const getYearRange = () => {
    const currentYear = new Date().getFullYear()
    if (allDisplayEvents.length === 0) {
      return { start: currentYear - 1, end: currentYear + 2 }
    }
    
    const eventYears = allDisplayEvents.map(event => new Date(event.date + 'T00:00:00').getFullYear()) // Fix timezone here too
    const minYear = Math.min(...eventYears, currentYear - 1)
    const maxYear = Math.max(...eventYears, currentYear + 2)
    
    return { start: minYear, end: maxYear }
  }

  const { start: startYear, end: endYear } = getYearRange()

  const renderCalendarView = () => (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 min-w-0">
          <div className="bg-card rounded-2xl border-2 overflow-hidden w-full">
            <CalendarProvider className="min-w-0">
              <CalendarDate>
                <CalendarDatePicker>
                  <CalendarMonthPicker className="min-w-0 w-auto" />
                  <CalendarYearPicker start={startYear} end={endYear} className="min-w-0 w-auto" />
                </CalendarDatePicker>
                <CalendarDatePagination />
              </CalendarDate>
              <CalendarHeader />
              <CalendarBody 
                features={convertEventsToFeatures()} 
                onDateSelect={handleDateSelect}
              >
                {({ feature }) => (
                  <div className="text-xs w-full">
                    <CalendarItem feature={feature} className="mb-0.5" />
                  </div>
                )}
              </CalendarBody>
            </CalendarProvider>
          </div>
        </div>

        {/* Selected Date Events - Desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-card rounded-2xl border-2 p-4 h-fit sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {selectedDate ? (
                  <span className="text-primary">
                    {selectedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                ) : (
                  'Select a date'
                )}
              </h3>
              {selectedDate && (
                <Button
                  size="sm"
                  onClick={handleQuickAdd}
                  disabled={!isOnline}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>

            <SelectedDateEvents isDesktop={true} />
          </div>
        </div>
      </div>

      {/* Selected Date Events - Mobile */}
      {selectedDate && (
        <div className="lg:hidden">
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  <span className="text-primary">
                    {selectedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </h3>
                <Button
                  size="sm"
                  onClick={handleQuickAdd}
                  disabled={!isOnline}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <SelectedDateEvents isDesktop={false} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 min-w-0">
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
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted-foreground/10'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  viewMode === 'calendar'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted-foreground/10'
                }`}
              >
                <CalendarIcon className="h-4 w-4" />
              </button>
            </div>
          }
        />
      )}
      
      {!appConfig && (
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold truncate">Events</h2>
          <div className="inline-flex rounded-lg border bg-muted p-1 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted-foreground/10'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                viewMode === 'calendar'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted-foreground/10'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        <div className="inline-flex rounded-lg border bg-muted p-1">
          <button
            onClick={() => setEventFilter('all')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              eventFilter === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted-foreground/10'
            }`}
          >
            All ({allDisplayEvents.length})
          </button>
          <button
            onClick={() => setEventFilter('events')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              eventFilter === 'events'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted-foreground/10'
            }`}
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            Events ({events.length})
          </button>
          <button
            onClick={() => setEventFilter('subscriptions')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              eventFilter === 'subscriptions'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted-foreground/10'
            }`}
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Subscriptions ({subscriptionEvents.length})
          </button>
        </div>
      </div>

      {viewMode === 'list' ? renderListView() : renderCalendarView()}

      <Dialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">Event Title</Label>
            <Input
              id="event-title"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="Birthday Party, Vacation, Utilities Bill, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="event-type">Event Type</Label>
            <Select value={newEventType} onValueChange={(value: 'single' | 'recurring' | 'range') => setNewEventType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Event</SelectItem>
                <SelectItem value="recurring">Recurring Event</SelectItem>
                <SelectItem value="range">Date Range Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date">Start Date</Label>
              <Input
                id="event-date"
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                min={today}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-start-time">Start Time (Optional)</Label>
              <Input
                id="event-start-time"
                type="time"
                value={newEventStartTime}
                onChange={(e) => setNewEventStartTime(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {(newEventType === 'single' || newEventType === 'range') && (
            <div className="space-y-2">
              <Label htmlFor="event-end-time">End Time (Optional)</Label>
              <Input
                id="event-end-time"
                type="time"
                value={newEventEndTime}
                onChange={(e) => setNewEventEndTime(e.target.value)}
                placeholder="Optional"
              />
            </div>
          )}

          {newEventType === 'range' && (
            <div className="space-y-2">
              <Label htmlFor="event-end-date">End Date</Label>
              <Input
                id="event-end-date"
                type="date"
                value={newEventEndDate}
                onChange={(e) => setNewEventEndDate(e.target.value)}
                min={newEventDate || today}
              />
            </div>
          )}

          {newEventType === 'recurring' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurrence-pattern">Repeat</Label>
                  <Select value={recurrencePattern} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => setRecurrencePattern(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurrence-interval">Every</Label>
                  <Input
                    id="recurrence-interval"
                    type="number"
                    min="1"
                    max="12"
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurrence-end-date">Stop Repeating (Optional)</Label>
                <Input
                  id="recurrence-end-date"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  min={newEventDate || today}
                  placeholder="Leave empty for indefinite recurring"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="event-description">Description (Optional)</Label>
            <Textarea
              id="event-description"
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={addEvent} 
              className="flex-1"
              disabled={!newEventTitle.trim() || !newEventDate || isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Event'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog
        open={showEditModal}
        onOpenChange={setShowEditModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-event-title">Event Title</Label>
              <Input
                id="edit-event-title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Birthday Party, Vacation, Utilities Bill, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-event-type">Event Type</Label>
              <Select value={newEventType} onValueChange={(value: 'single' | 'recurring' | 'range') => setNewEventType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Event</SelectItem>
                  <SelectItem value="recurring">Recurring Event</SelectItem>
                  <SelectItem value="range">Date Range Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-event-date">Start Date</Label>
                <Input
                  id="edit-event-date"
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  min={today}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-event-start-time">Start Time (Optional)</Label>
                <Input
                  id="edit-event-start-time"
                  type="time"
                  value={newEventStartTime}
                  onChange={(e) => setNewEventStartTime(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            {(newEventType === 'single' || newEventType === 'range') && (
              <div className="space-y-2">
                <Label htmlFor="edit-event-end-time">End Time (Optional)</Label>
                <Input
                  id="edit-event-end-time"
                  type="time"
                  value={newEventEndTime}
                  onChange={(e) => setNewEventEndTime(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            )}

            {newEventType === 'range' && (
              <div className="space-y-2">
                <Label htmlFor="edit-event-end-date">End Date</Label>
                <Input
                  id="edit-event-end-date"
                  type="date"
                  value={newEventEndDate}
                  onChange={(e) => setNewEventEndDate(e.target.value)}
                  min={newEventDate || today}
                />
              </div>
            )}

            {newEventType === 'recurring' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-recurrence-pattern">Repeat</Label>
                    <Select value={recurrencePattern} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => setRecurrencePattern(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-recurrence-interval">Every</Label>
                    <Input
                      id="edit-recurrence-interval"
                      type="number"
                      min="1"
                      max="12"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-recurrence-end-date">Stop Repeating (Optional)</Label>
                  <Input
                    id="edit-recurrence-end-date"
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={newEventDate || today}
                    placeholder="Leave empty for indefinite recurring"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-event-description">Description (Optional)</Label>
              <Textarea
                id="edit-event-description"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                placeholder="Add any additional details..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={updateEvent} 
                className="flex-1"
                disabled={!newEventTitle.trim() || !newEventDate || isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Event'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Event Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Add Event</DialogTitle>
            <DialogDescription>
              Add a quick event for{' '}
              {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quick-event-title">Event Title</Label>
              <Input
                id="quick-event-title"
                value={quickEventTitle}
                onChange={(e) => setQuickEventTitle(e.target.value)}
                placeholder="Enter event title..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && quickEventTitle.trim()) {
                    addQuickEvent()
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={addQuickEvent} 
                className="flex-1"
                disabled={!quickEventTitle.trim() || isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Event'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuickAdd(false)
                  setQuickEventTitle('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Recurring Event Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Recurring Event</DialogTitle>
            <DialogDescription>
              How would you like to delete "{deletingEvent?.title}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="delete-single"
                  name="deleteOption"
                  value="single"
                  checked={deleteOption === 'single'}
                  onChange={(e) => setDeleteOption(e.target.value as 'single' | 'all' | 'future')}
                  className="text-primary"
                />
                <Label htmlFor="delete-single" className="flex-1 cursor-pointer">
                  <div className="font-medium">This event only</div>
                  <div className="text-sm text-muted-foreground">
                    Delete just this occurrence on {deletingEvent?.date ? formatDate(deletingEvent.date) : ''}
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="delete-future"
                  name="deleteOption"
                  value="future"
                  checked={deleteOption === 'future'}
                  onChange={(e) => setDeleteOption(e.target.value as 'single' | 'all' | 'future')}
                  className="text-primary"
                />
                <Label htmlFor="delete-future" className="flex-1 cursor-pointer">
                  <div className="font-medium">This and future events</div>
                  <div className="text-sm text-muted-foreground">
                    Delete this occurrence and all future occurrences
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="delete-all"
                  name="deleteOption"
                  value="all"
                  checked={deleteOption === 'all'}
                  onChange={(e) => setDeleteOption(e.target.value as 'single' | 'all' | 'future')}
                  className="text-primary"
                />
                <Label htmlFor="delete-all" className="flex-1 cursor-pointer">
                  <div className="font-medium">All events in this series</div>
                  <div className="text-sm text-muted-foreground">
                    Delete the entire recurring event series
                  </div>
                </Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleRecurringEventDelete} 
                variant="destructive"
                className="flex-1"
                disabled={isLoading || !isOnline}
              >
                {isLoading ? 'Deleting...' : 'Delete Event'}
              </Button>
              <Button
                variant="outline"
                onClick={resetDeleteModal}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Range Event Modal */}
      <Dialog open={showDeleteRangeModal} onOpenChange={setShowDeleteRangeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Date Range Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingEvent?.title}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              This will permanently delete the entire date range event from{' '}
              {deletingEvent?.date && formatDate(deletingEvent.date)} to{' '}
              {deletingEvent?.end_datetime && formatDate(new Date(deletingEvent.end_datetime).toISOString().split('T')[0])}.
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleDeleteRangeEvent} 
                variant="destructive"
                className="flex-1"
                disabled={isLoading || !isOnline}
              >
                {isLoading ? 'Deleting...' : 'Delete Event'}
              </Button>
              <Button
                variant="outline"
                onClick={resetDeleteModal}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 