import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL || 'http://localhost:5000'}/api/calendar/oauth-callback` // Removed Replit-specific URL
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export async function getAuthUrl() {
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

export async function handleOAuthCallback(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

export async function addEventToCalendar(event: {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
}) {
  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC'
        }
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    throw error;
  }
}

export async function updateEventInCalendar(
  googleEventId: string,
  event: {
    summary: string;
    description: string;
    startTime: Date;
    endTime: Date;
  }
) {
  try {
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC'
        }
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error updating event in Google Calendar:', error);
    throw error;
  }
}

export async function deleteEventFromCalendar(googleEventId: string) {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId
    });
  } catch (error) {
    console.error('Error deleting event from Google Calendar:', error);
    throw error;
  }
}