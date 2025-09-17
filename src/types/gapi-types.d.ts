declare namespace gapi {
  function load(
    apiName: string,
    callback: () => void
  ): void;

  namespace auth2 {
    function getAuthInstance(): GoogleAuth;
    function init(params: {
      client_id: string;
      scope: string;
    }): Promise<void>;

    interface GoogleAuth {
      isSignedIn: {
        get(): boolean;
        listen(listener: (signedIn: boolean) => void): void;
      };
      currentUser: {
        get(): GoogleUser;
      };
      signIn(): Promise<GoogleUser>;
      signOut(): Promise<void>;
    }

    interface GoogleUser {
      getBasicProfile(): {
        getName(): string;
        getEmail(): string;
      };
    }
  }

  namespace client {
    function init(params: {
      apiKey: string;
      clientId: string;
      discoveryDocs: string[];
      scope: string;
    }): Promise<void>;

    namespace calendar {
      namespace events {
        function list(params: {
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
      }
    }
  }
}

interface Window {
  gapi: typeof gapi;
}