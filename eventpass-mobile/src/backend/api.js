import { API_BASE_URL } from './config';
import { getSession, saveSession, clearSession } from './session';

async function request(path, options = {}) {
  const session = await getSession();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'The server took too long to respond' : 'Could not reach the server';
    throw new Error(
      `${reason}. Check that eventpass-web is running and ` +
        'API_BASE_URL in src/backend/config.js matches this platform.'
    );
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    await clearSession();
    const err = new Error('Your session has expired. Please log in again.');
    err.code = 'SESSION_EXPIRED';
    throw err;
  }
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

export async function login(email, password) {
  const data = await request('/api/mobile/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await saveSession({ token: data.token, user: data.user });
  return data.user;
}

export async function logout() {
  await clearSession();
}

export async function getEvents() {
  const data = await request('/api/mobile/events');
  return data.events;
}

export async function createEvent({ name, date, location, capacity }) {
  const data = await request('/api/mobile/events', {
    method: 'POST',
    body: JSON.stringify({ name, date, location, capacity }),
  });
  return data.event;
}

export async function deleteEvent(eventId) {
  await request(`/api/mobile/events/${eventId}`, { method: 'DELETE' });
}

export async function getGuests(eventId) {
  const data = await request(`/api/mobile/events/${eventId}/guests`);
  return data.guests;
}

export async function addGuest(eventId, name) {
  const data = await request(`/api/mobile/events/${eventId}/guests`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return data.guest;
}

export async function checkIn(qrToken, eventId) {
  return request('/api/mobile/checkin', {
    method: 'POST',
    body: JSON.stringify({ qrToken, eventId }),
  });
}
