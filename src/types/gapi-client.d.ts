declare namespace gapi.auth2 {
  interface GoogleUser {
    getBasicProfile(): {
      getId(): string;
      getName(): string;
      getGivenName(): string;
      getFamilyName(): string;
      getImageUrl(): string;
      getEmail(): string;
    };
    getAuthResponse(includeAuthorizationData?: boolean): {
      access_token: string;
      id_token: string;
      scope: string;
      expires_in: number;
      first_issued_at: number;
      expires_at: number;
    };
  }

  interface GoogleAuth {
    isSignedIn: {
      get(): boolean;
      listen(listener: (isSignedIn: boolean) => void): void;
    };
    currentUser: {
      get(): GoogleUser;
      listen(listener: (user: GoogleUser) => void): void;
    };
    signIn(): Promise<GoogleUser>;
    signOut(): Promise<void>;
    disconnect(): void;
  }

  interface AuthResponse {
    access_token: string;
    id_token: string;
    scope: string;
    expires_in: number;
    first_issued_at: number;
    expires_at: number;
  }
}

declare namespace gapi.client {
  interface HttpRequest {
    execute(callback: (response: any, raw: any) => void): void;
  }

  interface HttpRequestPromise extends Promise<any> {
    execute(callback: (response: any, raw: any) => void): void;
  }

  interface HttpBatch {
    execute(callback: (responseMap: { [id: string]: any }, raw: string) => void): void;
  }

  interface Calendar {
    events: {
      list(params: {
        calendarId: string;
        timeMin?: string;
        timeMax?: string;
        maxResults?: number;
        orderBy?: string;
        singleEvents?: boolean;
      }): HttpRequestPromise;
    };
  }
}

interface Window {
  gapi: typeof gapi;
}