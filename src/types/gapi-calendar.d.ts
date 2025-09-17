declare interface Window {
  gapi: {
    load(name: string, callback: () => void): void;
    auth2: {
      getAuthInstance(): {
        isSignedIn: {
          get(): boolean;
          listen(callback: (isSignedIn: boolean) => void): void;
        };
        signIn(): Promise<any>;
        signOut(): Promise<void>;
        currentUser: {
          get(): {
            getBasicProfile(): {
              getName(): string;
              getEmail(): string;
            };
          };
        };
      };
    };
    client: {
      init(params: {
        apiKey: string;
        clientId: string;
        discoveryDocs: string[];
        scope: string;
      }): Promise<void>;
      calendar: {
        events: {
          list(params: {
            calendarId: string;
            timeMin?: string;
            maxResults?: number;
            singleEvents?: boolean;
            orderBy?: string;
          }): Promise<{
            result: {
              items: Array<{
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
              }>;
            };
          }>;
        };
      };
    };
  };
}