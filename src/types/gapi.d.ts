interface Window {
    gapi: any; // You can make this more specific if needed
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
    [key: string]: any;
}

declare namespace gapi {
    namespace client {
        namespace calendar {
            namespace events {
                function list(params: {
                    calendarId: string;
                    timeMin: string;
                    maxResults: number;
                    [key: string]: any;
                }): Promise<{
                    result: {
                        items: GoogleApiEvent[];
                    };
                }>;
            }
        }
        function init(params: {
            apiKey: string;
            discoveryDocs: string[];
        }): Promise<void>;
    }
    function load(api: string, callback: { callback: () => void }): void;
}