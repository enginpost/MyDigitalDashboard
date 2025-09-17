import React, { useState, useEffect } from 'react';
import './Calendar.css';
import '../types/gapi-calendar.d.ts';
import '../types/google-event.d.ts';

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

interface CalendarConfig {
  calendarId: string;
  apiKey: string;
  clientId: string;
}

interface GoogleApiEvent {
  id: string;
  summary?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  status?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [config] = useState<CalendarConfig>({
    calendarId: process.env.REACT_APP_GOOGLE_CALENDAR_ID || '',
    apiKey: process.env.REACT_APP_GOOGLE_API_KEY || '',
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || ''
  });

  if (!config.clientId) {
    throw new Error('REACT_APP_GOOGLE_CLIENT_ID is required');
  }

  const generateCalendarDays = () => {
    // Get the first day of the month
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    // Get the first day to display (including days from previous month)
    const firstDayToDisplay = new Date(firstDayOfMonth);
    firstDayToDisplay.setDate(firstDayToDisplay.getDate() - firstDayToDisplay.getDay());

    // Generate 6 weeks of days
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
  };

  const getCurrentWeekEvents = () => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
  };

  useEffect(() => {
    // Store config values in local scope to avoid re-accessing state
    const { apiKey, calendarId, clientId } = config;
    
    // Check environment variables
    console.log('Checking API configuration...');
    if (!apiKey) {
      console.error('REACT_APP_GOOGLE_API_KEY is not set in environment variables');
    }
    if (!calendarId) {
      console.error('REACT_APP_GOOGLE_CALENDAR_ID is not set in environment variables');
    }
    
    if (!calendarId || !apiKey) {
      console.error('Missing configuration:', { 
        calendarId: calendarId ? 'Set' : 'Missing',
        apiKey: apiKey ? 'Set' : 'Missing'
      });
      setError('Missing calendar configuration. Please check your .env file for REACT_APP_GOOGLE_API_KEY and REACT_APP_GOOGLE_CALENDAR_ID');
      setLoading(false);
      return;
    }

    const loadGoogleAPI = async () => {
      try {
        // Validate configuration
        if (!config.apiKey || config.apiKey.trim() === '') {
          throw new Error('API key is missing or empty');
        }
        if (!config.clientId || config.clientId.trim() === '') {
          throw new Error('Client ID is missing or empty');
        }
        if (!config.calendarId || config.calendarId.trim() === '') {
          throw new Error('Calendar ID is missing or empty');
        }

        console.log('Configuration validation passed:', {
          apiKeyLength: config.apiKey.length,
          clientIdLength: config.clientId.length,
          calendarId: config.calendarId
        });

        console.log('Loading Google API...');
        // Load the Google API client library
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = () => {
            console.log('Google API script loaded');
            resolve(null);
          };
          script.onerror = (e) => {
            console.error('Failed to load Google API script:', e);
            reject(e);
          };
          document.body.appendChild(script);
        });

        // Load both client and auth2 libraries together
        await new Promise<void>((resolve) => {
          window.gapi.load('client:auth2', resolve);
        });

        console.log('Initializing Calendar API...');
        
        // Log API configuration status
        console.log('API Configuration Status:', {
          apiKey: config.apiKey ? 'Present' : 'Missing',
          calendarId: config.calendarId ? 'Present' : 'Missing',
          gapi: window.gapi ? 'Loaded' : 'Not loaded',
          gapiClient: window.gapi?.client ? 'Initialized' : 'Not initialized',
          gapiCalendar: window.gapi?.client?.calendar ? 'Available' : 'Not available'
        });

        // Initialize the GAPI client with OAuth credentials
        console.log('Initializing GAPI client...');
        await window.gapi.client.init({
          apiKey,
          clientId,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          scope: 'https://www.googleapis.com/auth/calendar.readonly'
        });
        console.log('GAPI client initialized');

        // Verify the Calendar API is loaded
        if (!window.gapi.client.calendar) {
          throw new Error('Calendar API failed to load');
        }

        // Handle authentication
        console.log('Getting auth instance...');
        const authInstance = window.gapi.auth2.getAuthInstance();
        
        if (!authInstance) {
          throw new Error('Auth instance not initialized');
        }

        if (!authInstance.isSignedIn.get()) {
          console.log('User not signed in, requesting sign in...');
          try {
            await authInstance.signIn();
            console.log('Successfully signed in');
          } catch (signInError: any) {
            console.error('Sign in error details:', {
              error: signInError,
              message: signInError.message,
              details: signInError.details
            });
            throw new Error('Failed to sign in to Google Calendar');
          }
        }

        const user = authInstance.currentUser.get();
        const profile = user.getBasicProfile();
        console.log('Signed in as:', profile.getName());

        console.log('Fetching calendar events...');
        
        // Verify calendar API is loaded
        if (!window.gapi.client.calendar) {
          throw new Error('Calendar API not loaded. Make sure discoveryDocs is correct.');
        }
        
        // Get events from the calendar
        const now = new Date();
        
        console.log('Calendar API request parameters:', {
          calendarId: config.calendarId,
          timeMin: now.toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime'
        });
        
        try {
          const eventsResponse = await window.gapi.client.calendar.events.list({
            calendarId: config.calendarId,
            timeMin: now.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime'
          });
          
          console.log('Calendar API response:', eventsResponse);
          
          if (!eventsResponse.result) {
            throw new Error('No result in calendar events response');
          }

          // Tasks feature temporarily disabled to debug main calendar functionality
          const taskEvents: GoogleApiEvent[] = [];

          // Process regular events
          const regularEvents = eventsResponse.result.items.map((item: GoogleApiEvent) => ({
            id: item.id,
            summary: item.summary || 'Untitled Event',
            start: {
              dateTime: item.start?.dateTime || item.start?.date || new Date().toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: item.end?.dateTime || item.end?.date || new Date().toISOString(),
              timeZone: 'UTC'
            },
            location: item.location,
            eventType: 'event' as const,
            status: item.status,
            reminders: item.reminders
          }));

          // Process task events
          const processedTaskEvents = taskEvents.map((item: GoogleApiEvent) => ({
            id: item.id,
            summary: item.summary || 'Untitled Task',
            start: {
              dateTime: item.start?.dateTime || item.start?.date || new Date().toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: item.end?.dateTime || item.end?.date || new Date().toISOString(),
              timeZone: 'UTC'
            },
            location: item.location,
            eventType: 'task' as const,
            status: item.status,
            reminders: item.reminders
          }));

          // Combine all events
          const calendarEvents: CalendarEvent[] = [...regularEvents, ...processedTaskEvents];
          
          setEvents(calendarEvents);
          console.log('Calendar events loaded successfully');
          setLoading(false);
        } catch (fetchError) {
          console.error('Error fetching calendar events:', fetchError);
          throw fetchError;
        }
      } catch (err: any) {
        console.error('Error loading calendar events:', {
          error: err,
          message: err.message,
          stack: err.stack,
          result: err.result,
          details: err.details,
          status: err.status
        });
        console.log('API Configuration Debug:', {
          calendarId: config.calendarId,
          apiKeyPresent: !!config.apiKey,
          clientIdPresent: !!config.clientId,
          gapiLoaded: !!window.gapi,
          gapiClientLoaded: !!window.gapi?.client,
          gapiAuth2Loaded: !!window.gapi?.auth2,
          errorType: err.constructor.name
        });
        
        let errorMessage = 'Unable to load calendar events';
        
        if (err.result && err.result.error) {
          const apiError = err.result.error;
          errorMessage = `Calendar error: ${apiError.message} (Code: ${apiError.code})`;
          console.error('Google API Error:', {
            code: apiError.code,
            message: apiError.message,
            status: apiError.status,
            details: apiError.details || 'No additional details'
          });
        } else if (err.message) {
          errorMessage = `Calendar error: ${err.message}`;
          console.error('Error details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          });
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadGoogleAPI();

    // Refresh calendar events every 5 minutes
    const interval = setInterval(() => {
      loadGoogleAPI();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [config]);

  // Helper function to format date and time
  const formatDateTime = (dateTimeStr: string) => {
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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = generateCalendarDays();
  const currentWeekEvents = getCurrentWeekEvents();

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
    return <div className="calendar-error">{error}</div>;
  }

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
                  {day.events.map((event, i) => (
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
          {currentWeekEvents.map((event) => (
            <div key={event.id} className="calendar-event">
              <div className="event-summary">{event.summary}</div>
              <div className="event-time">
                {formatDateTime(event.start.dateTime)}
              </div>
              {event.location && (
                <div className="event-location">{event.location}</div>
              )}
            </div>
          ))}
          {currentWeekEvents.length === 0 && (
            <div className="no-events">No events this week</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;