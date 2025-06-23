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
import { Plus, Calendar as CalendarIcon, Clock, Trash2, Grid, List, Repeat, CalendarDays, FileText } from 'lucide-react'
// Removed date-fns dependency - using native Date methods instead

interface Event {
  id: string
  title: string
  date: string
  end_date?: string
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
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [newEventEndDate, setNewEventEndDate] = useState('')
  const [newEventType, setNewEventType] = useState<'single' | 'recurring' | 'range'>('single')
  const [newEventDescription, setNewEventDescription] = useState('')
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  // Listen for custom events from BottomActions
  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      if (event.detail.type === 'event') {
        setShowCreateModal(true)
      }
    }

    window.addEventListener('openCreateModal', handleOpenModal as EventListener)
    return () => {
      window.removeEventListener('openCreateModal', handleOpenModal as EventListener)
    }
  }, [])

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

      // Add fields based on event type
      if (newEventType === 'range') {
        eventData.end_date = newEventEndDate
      } else if (newEventType === 'recurring') {
        eventData.recurrence_pattern = recurrencePattern
        eventData.recurrence_interval = recurrenceInterval
        eventData.recurrence_end_date = recurrenceEndDate
      }

      const { error } = await supabase
        .from('events')
        .insert([eventData])

      if (error) throw error
      
      // Reset form
      setNewEventTitle('')
      setNewEventDate('')
      setNewEventEndDate('')
      setNewEventType('single')
      setNewEventDescription('')
      setRecurrencePattern('weekly')
      setRecurrenceInterval(1)
      setRecurrenceEndDate('')
      setShowCreateModal(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding event:', error)
    } finally {
      setIsLoading(false)
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
          label: `Until ${formatShortDate(event.end_date!)}`,
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
                {upcomingEvents.map((event) => {
                  const typeInfo = getEventTypeInfo(event)
                  const TypeIcon = typeInfo.icon
                  return (
                    <Card key={event.id} className={`border-l-4 ${typeInfo.borderColor}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className={`${typeInfo.bgColor} ${typeInfo.color} px-2 py-1 rounded-lg text-xs font-medium`}>
                                {formatShortDate(event.date)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{event.title}</h4>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <TypeIcon className="h-3 w-3" />
                                  <span>{typeInfo.label}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEvent(event.id.split('-')[0])} // Use original ID for recurring instances
                            disabled={!isOnline}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
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
                {pastEvents.map((event) => {
                  const typeInfo = getEventTypeInfo(event)
                  const TypeIcon = typeInfo.icon
                  return (
                    <Card key={event.id} className="border-l-4 border-l-gray-300 opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded-lg text-xs font-medium">
                                {formatShortDate(event.date)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-700">{event.title}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <TypeIcon className="h-3 w-3" />
                                  <span>{typeInfo.label}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                              {event.description && (
                                <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEvent(event.id.split('-')[0])} // Use original ID for recurring instances
                            disabled={!isOnline}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
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
        endAt: event.end_date ? new Date(event.end_date) : new Date(event.date),
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
      <div className="bg-card rounded-2xl border-2 overflow-hidden">
        <CalendarProvider>
          <CalendarDate>
            <CalendarDatePicker>
              <CalendarMonthPicker />
              <CalendarYearPicker start={startYear} end={endYear} />
            </CalendarDatePicker>
            <CalendarDatePagination />
          </CalendarDate>
          <CalendarHeader />
          <CalendarBody features={convertEventsToFeatures()}>
            {({ feature }) => (
              <div className="text-xs">
                <CalendarItem feature={feature} className="mb-1" />
              </div>
            )}
          </CalendarBody>
        </CalendarProvider>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Family Events</h2>
        <div className="inline-flex rounded-lg border bg-muted p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              viewMode === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted-foreground/10'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
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
                setNewEventTitle('')
                setNewEventDate('')
                setNewEventEndDate('')
                setNewEventType('single')
                setNewEventDescription('')
                setRecurrencePattern('weekly')
                setRecurrenceInterval(1)
                setRecurrenceEndDate('')
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