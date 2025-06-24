import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
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
import { Plus, Calendar as CalendarIcon, Clock, Trash2, Grid, List, Repeat, CalendarDays, FileText, Edit, MapPin } from 'lucide-react'
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

interface EventsTabProps {
  events: Event[]
  groupId: string
  onUpdate: () => void
  isOnline: boolean
}

export const EventsTab: React.FC<EventsTabProps> = ({
  events,
  groupId,
  onUpdate,
  isOnline
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

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('family-os-events-view-mode', viewMode)
    }
  }, [viewMode])

  // Listen for custom events from BottomActions
  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      if (event.detail.type === 'event') {
        // Pre-fill date if one is selected
        if (selectedDate) {
          setNewEventDate(selectedDate.toISOString().split('T')[0])
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

  const openEditModal = (event: Event) => {
    setEditingEvent(event)
    setNewEventTitle(event.title)
    setNewEventDate(event.date)
    
    // Parse datetime fields to separate date and time
    if (event.start_datetime) {
      const startDate = new Date(event.start_datetime)
      setNewEventDate(startDate.toISOString().split('T')[0])
      setNewEventStartTime(startDate.toTimeString().slice(0, 5))
    }
    
    if (event.end_datetime) {
      const endDate = new Date(event.end_datetime)
      if (event.event_type === 'range') {
        setNewEventEndDate(endDate.toISOString().split('T')[0])
      }
      setNewEventEndTime(endDate.toTimeString().slice(0, 5))
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
        eventData.end_date = newEventEndDate
        if (newEventEndTime) {
          eventData.end_datetime = buildDateTimeString(newEventEndDate, newEventEndTime)
        }
      } else if (newEventType === 'recurring') {
        eventData.recurrence_pattern = recurrencePattern
        eventData.recurrence_interval = recurrenceInterval
        eventData.recurrence_end_date = recurrenceEndDate
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
        eventData.end_date = newEventEndDate
        if (newEventEndTime) {
          eventData.end_datetime = buildDateTimeString(newEventEndDate, newEventEndTime)
        }
      } else if (newEventType === 'recurring') {
        eventData.recurrence_pattern = recurrencePattern
        eventData.recurrence_interval = recurrenceInterval
        eventData.recurrence_end_date = recurrenceEndDate
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
        date: selectedDate.toISOString().split('T')[0],
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

  const deleteEvent = async (eventId: string) => {
    if (!isOnline || !confirm('Are you sure you want to delete this event?')) return

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

  // Expand all events to include recurring instances
  const expandedEvents = events.flatMap(event => generateRecurringInstances(event))

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
  const getEventTypeInfo = (event: Event) => {
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
      const eventDate = new Date(dateString)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= today
    } catch {
      return false
    }
  }

  const sortedEvents = expandedEvents.sort((a, b) => {
    try {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    } catch {
      return 0
    }
  })

  const upcomingEvents = sortedEvents.filter(event => isUpcoming(event.date))
  const pastEvents = sortedEvents.filter(event => !isUpcoming(event.date))

  // Get minimum date for input (today)
  const today = new Date().toISOString().split('T')[0]

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return expandedEvents.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.getFullYear() === date.getFullYear() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getDate() === date.getDate()
    })
  }

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  // Reusable Event Card Component
  const EventCard: React.FC<{
    event: Event & { isInstance?: boolean }
    variant?: 'list' | 'compact'
    showDate?: boolean
  }> = ({ event, variant = 'list', showDate = false }) => {
    const typeInfo = getEventTypeInfo(event)
    const TypeIcon = typeInfo.icon
    const timeDisplay = getEventTimeDisplay(event)
    const isUpcomingEvent = isUpcoming(event.date)
    
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
                  onClick={() => deleteEvent(event.id.split('-')[0])}
                  disabled={!isOnline}
                  className="text-gray-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
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
                onClick={() => deleteEvent(event.id.split('-')[0])}
                disabled={!isOnline}
                className={`${isUpcomingEvent ? 'text-gray-600 hover:text-red-700 hover:bg-red-50' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'} p-2 h-auto`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
    return expandedEvents.map((event) => {
      const typeInfo = getEventTypeInfo(event)
      return {
        id: event.id,
        name: event.title,
        startAt: new Date(event.date),
        endAt: event.end_datetime ? new Date(event.end_datetime) : new Date(event.date),
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
    if (expandedEvents.length === 0) {
      return { start: currentYear - 1, end: currentYear + 2 }
    }
    
    const eventYears = expandedEvents.map(event => new Date(event.date).getFullYear())
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
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold truncate">Family Events</h2>
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
                min={new Date().toISOString().split('T')[0]}
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
                min={newEventDate || new Date().toISOString().split('T')[0]}
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
                  min={new Date().toISOString().split('T')[0]}
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
                  min={newEventDate || new Date().toISOString().split('T')[0]}
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
                    min={newEventDate || new Date().toISOString().split('T')[0]}
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
    </div>
  )
} 