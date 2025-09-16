import React, { useState, useEffect } from 'react';
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
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calendarId = process.env.REACT_APP_GOOGLE_CALENDAR_ID;
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

  useEffect(() => {
    if (!calendarId || !apiKey) {
      console.error('Missing configuration:', { calendarId, apiKey });
      setError('Missing calendar configuration');
      setLoading(false);
      return;
    }

    const loadGoogleAPI = async () => {
      try {
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

        console.log('Initializing Google API client...');
        // Initialize the Google API client
        await new Promise<void>((resolve, reject) => {
          if (!window.gapi) {
            reject(new Error('Google API not available'));
            return;
          }
          window.gapi.load('client', {
            callback: () => {
              console.log('Google API client loaded');
              resolve();
            },
            onerror: (err: Error) => {
              console.error('Error loading Google API client:', err);
              reject(err);
            }
          });
        });

        console.log('Initializing Calendar API...');
        // Initialize the Calendar API
        await window.gapi.client.init({
          apiKey,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        });

        console.log('Fetching calendar events...');
        // Get events from the calendar
        const now = new Date();
        const response = await window.gapi.client.calendar.events.list({
          calendarId,
          timeMin: now.toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime'
        });

        console.log('Received calendar response:', response);
        const calendarEvents: CalendarEvent[] = response.result.items.map(item => ({
          id: item.id,
          summary: item.summary || 'Untitled Event',
          start: {
            dateTime: item.start.dateTime || item.start.date || new Date().toISOString(),
            timeZone: item.start.timeZone || 'UTC'
          },
          end: {
            dateTime: item.end.dateTime || item.end.date || new Date().toISOString(),
            timeZone: item.end.timeZone || 'UTC'
          },
          location: item.location
        }));
        
        setEvents(calendarEvents);
        console.log('Calendar events loaded successfully');
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading calendar events:', err);
        let errorMessage = 'Unable to load calendar events';
        
        // Check for specific Google API errors
        if (err.result && err.result.error) {
          const apiError = err.result.error;
          errorMessage = `Calendar error: ${apiError.message}`;
          console.error('Google API Error:', {
            code: apiError.code,
            message: apiError.message,
            status: apiError.status
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
  }, [apiKey, calendarId]);

  if (loading) {
    return <div className="calendar-loading">Loading calendar events...</div>;
  }

  if (error) {
    return <div className="calendar-error">{error}</div>;
  }

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

  return (
    <div className="calendar">
      <div className="calendar-header">Upcoming Events</div>
      <div className="events-container">
        {events.map((event) => (
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
        {events.length === 0 && (
          <div className="no-events">No upcoming events</div>
        )}
      </div>
    </div>
  );
};

export default Calendar;