import apiClient from './client';

export interface EventItem {
  id: string;
  title: string;
  date?: string;
  city?: string;
  location?: string;
  rsvp?: boolean;
}

export const fetchEvents = async (): Promise<EventItem[]> => {
  const { data } = await apiClient.get<{ events?: any[] }>('/events');
  const list = data?.events || data;
  return Array.isArray(list) ? list.map(normalizeEvent) : [];
};

export const rsvpEvent = async (eventId: string) => {
  await apiClient.post(`/events/${eventId}/rsvp`, {});
};

export const cancelRsvpEvent = async (eventId: string) => {
  await apiClient.delete(`/events/${eventId}/rsvp`);
};

const normalizeEvent = (raw: any): EventItem => ({
  id: raw?.id || raw?._id || raw?.eventId || 'event',
  title: raw?.title || raw?.name,
  date: raw?.date || raw?.startDate,
  city: raw?.city || raw?.location?.city,
  location: raw?.location?.name,
  rsvp: raw?.rsvp || raw?.attending,
});
