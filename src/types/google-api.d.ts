interface GoogleApiEvent {
  id: string;
  summary?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
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

interface Window {
  gapi: {
    load: (api: string, options: {
      callback: () => void;
      onerror: (error: Error) => void;
    }) => void;
    auth2: {
      init: (params: {
        client_id: string;
        scope: string;
      }) => Promise<void>;
      getAuthInstance: () => {
        isSignedIn: {
          get: () => boolean;
          listen: (callback: (isSignedIn: boolean) => void) => void;
        };
        signIn: () => Promise<void>;
        signOut: () => Promise<void>;
        currentUser: {
          get: () => {
            getBasicProfile: () => {
              getName: () => string;
              getEmail: () => string;
            };
          };
        };
      };
    };
    client: {
      init: (options: {
        apiKey: string;
        clientId: string;
        discoveryDocs: string[];
        scope: string;
      }) => Promise<void>;
      calendar: {
        events: {
          list: (options: {
            calendarId: string;
            timeMin: string;
            maxResults: number;
            singleEvents: boolean;
            orderBy: string;
            showDeleted?: boolean;
            showTasks?: boolean;
            fields?: string;
          }) => Promise<{
            result: {
              items: GoogleApiEvent[];
            };
          }>;
        };
        calendarList: {
          list: () => Promise<{
            result: {
              items: Array<{
                id: string;
                summary: string;
              }>;
            };
          }>;
        };
      };
    };
  };
}