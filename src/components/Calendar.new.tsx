import React, { useState, useEffect, useCallback } from 'react';
import './Calendar.css';

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  eventType: 'event' | 'task' | 'reminder';
  status?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

interface CalendarDay {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Store configuration in state to avoid re-renders
  const [config] = useState({
    calendarId: process.env.REACT_APP_GOOGLE_CALENDAR_ID || '',
    apiKey: process.env.REACT_APP_GOOGLE_API_KEY || '',
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || ''
  });

  const loadCalendarEvents = useCallback(async () => {
    try {
      if (!window.gapi?.client?.calendar) {
        throw new Error('Google Calendar API not initialized');
      }

      const now = new Date();
      const response = await window.gapi.client.calendar.events.list({
        calendarId: config.calendarId,
        timeMin: now.toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      });

      if (!response.result?.items) {
        throw new Error('No events returned from calendar API');
      }

      const calendarEvents = response.result.items.map(item => ({
        id: item.id,
        summary: item.summary || 'Untitled Event',
        start: {
          dateTime: item.start?.dateTime || item.start?.date || now.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: item.end?.dateTime || item.end?.date || now.toISOString(),
          timeZone: 'UTC'
        },
        location: item.location,
        eventType: 'event' as const,
        status: item.status,
        reminders: item.reminders
      }));

      setEvents(calendarEvents);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load calendar events:', err);
      setError('Unable to load calendar events: ' + (err.message || 'Unknown error'));
    }
  }, [config.calendarId]);

  const initializeGoogleAPI = useCallback(async () => {
    try {
      // Validate configuration
      if (!config.apiKey) throw new Error('API key is missing');
      if (!config.clientId) throw new Error('Client ID is missing');
      if (!config.calendarId) throw new Error('Calendar ID is missing');

      // Load the Google API client library
      if (!window.gapi) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // Load client and auth2 libraries
      await new Promise<void>((resolve) => {
        window.gapi.load('client:auth2', resolve);
      });

      // Initialize the GAPI client
      await window.gapi.client.init({
        apiKey: config.apiKey,
        clientId: config.clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar.readonly'
      });

      // Handle authentication
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }

      // Load initial calendar events
      await loadCalendarEvents();
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to initialize Google API:', err);
      setError('Failed to initialize calendar: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  }, [config, loadCalendarEvents]);

  useEffect(() => {
    initializeGoogleAPI();
  }, [initializeGoogleAPI]);

  useEffect(() => {
    if (!loading && !error) {
      const interval = setInterval(loadCalendarEvents, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [loading, error, loadCalendarEvents]);

  const generateCalendarDays = useCallback((): CalendarDay[] => {
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const firstDayToDisplay = new Date(firstDayOfMonth);
    firstDayToDisplay.setDate(firstDayToDisplay.getDate() - firstDayToDisplay.getDay());

    const days: CalendarDay[] = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(firstDayToDisplay);
      date.setDate(date.getDate() + i);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start.dateTime);
        return eventDate.getDate() === date.getDate() &&
               eventDate.getMonth() === date.getMonth() &&
               eventDate.getFullYear() === date.getFullYear();
      });

      days.push({
        date,
        events: dayEvents,
        isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
        isToday: date.getDate() === currentDate.getDate() &&
                 date.getMonth() === currentDate.getMonth() &&
                 date.getFullYear() === currentDate.getFullYear()
      });
    }

    return days;
  }, [currentMonth, events]);

  const getCurrentWeekEvents = useCallback((): CalendarEvent[] => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
  }, [events]);

  const formatDateTime = (dateTimeStr: string): string => {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  if (loading) {
    return <div className="calendar-loading">Loading calendar events...</div>;
  }

  if (error) {
    return (
      <div className="calendar-error">
        <div>{error}</div>
        <button 
          onClick={() => {
            setLoading(true);
            setError(null);
            initializeGoogleAPI();
          }}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
        >
          Retry
        </button>
      </div>
    );
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = generateCalendarDays();
  const currentWeekEvents = getCurrentWeekEvents();

  return (
    <div className="calendar">
      <div className="calendar-grid-container">
        <div className="month-navigation">
          <button className="month-nav-button" onClick={prevMonth}>&lt;</button>
          <div className="current-month">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button className="month-nav-button" onClick={nextMonth}>&gt;</button>
        </div>
        <div className="calendar-grid">
          {weekDays.map(day => (
            <div key={day} className="weekday-header">{day}</div>
          ))}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} 
                         ${day.isToday ? 'today' : ''} 
                         ${day.events.length > 0 ? 'has-events' : ''}`}
            >
              <div className="day-number">{day.date.getDate()}</div>
              {day.events.length > 0 && (
                <div className="event-dots">
                  {day.events.map((event) => (
                    <div 
                      key={event.id} 
                      className="event-dot" 
                      data-type={event.eventType}
                      data-status={event.status}
                      title={`${event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}: ${formatDateTime(event.start.dateTime)}`}
                    >
                      {event.summary}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="events-sidebar">
        <div className="calendar-header">This Week's Events</div>
        <div className="events-container">
          {currentWeekEvents.length > 0 ? (
            currentWeekEvents.map((event) => (
              <div key={event.id} className="calendar-event">
                <div className="event-summary">{event.summary}</div>
                <div className="event-time">
                  {formatDateTime(event.start.dateTime)}
                </div>
                {event.location && (
                  <div className="event-location">{event.location}</div>
                )}
              </div>
            ))
          ) : (
            <div className="no-events">No events this week</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;