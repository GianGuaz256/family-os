import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { Calendar } from '../ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Plus, Calendar as CalendarIcon, Clock, Trash2, Grid, List } from 'lucide-react'
// Removed date-fns dependency - using native Date methods instead

interface Event {
  id: string
  title: string
  date: string
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
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState<Date>()

  const addEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate || !isOnline) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('events')
        .insert([{
          group_id: groupId,
          title: newEventTitle,
          date: newEventDate
        }])

      if (error) throw error
      
      setNewEventTitle('')
      setNewEventDate('')
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

  const sortedEvents = events.sort((a, b) => {
    try {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    } catch {
      return 0
    }
  })

  const upcomingEvents = sortedEvents.filter(event => isUpcoming(event.date))
  const pastEvents = sortedEvents.filter(event => !isUpcoming(event.date))

  // Get events for a specific date (for calendar view)
  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateString)
  }

  // Get dates that have events (for calendar highlighting)
  const eventDates = events.map(event => new Date(event.date)).filter(date => !isNaN(date.getTime()))

  // Get minimum date for input (today)
  const today = new Date().toISOString().split('T')[0]

  const renderListView = () => (
    <div className="space-y-8">
      {events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No events yet
          </h3>
          <p className="text-gray-600 mb-4">
            Add your first event to get started
          </p>
        </div>
      ) : (
        <>
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium">
                              {formatShortDate(event.date)}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEvent(event.id)}
                          disabled={!isOnline}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-gray-600" />
                Past Events
              </h3>
              <div className="space-y-3">
                {pastEvents.map((event) => (
                  <Card key={event.id} className="border-l-4 border-l-gray-300 opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded-lg text-xs font-medium">
                              {formatShortDate(event.date)}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700">{event.title}</h4>
                            <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEvent(event.id)}
                          disabled={!isOnline}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderCalendarView = () => (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border-2 p-6">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{
            event: eventDates
          }}
          modifiersStyles={{
            event: {
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              borderRadius: '0.375rem'
            }
          }}
          className="mx-auto"
        />
      </div>
      
      {selectedDate && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Events on {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          <div className="space-y-3">
            {getEventsForDate(selectedDate).length === 0 ? (
              <p className="text-muted-foreground">No events on this date</p>
            ) : (
              getEventsForDate(selectedDate).map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                        disabled={!isOnline}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Family Events</h2>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? renderListView() : renderCalendarView()}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setShowCreateModal(true)}
          disabled={!isOnline}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

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
              placeholder="Birthday Party, Vacation, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-date">Event Date</Label>
            <Input
              id="event-date"
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              min={today}
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