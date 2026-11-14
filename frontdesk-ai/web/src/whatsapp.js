// Turns what happened on a call into the WhatsApp messages the owner and the client get.
// Used when building the page (recorded calls) and in the browser (live demo calls).
import { fill } from './i18n.js';

// Recorded calls store raw tool calls; the live demo server sends tidy events. Make them the same.
export function normaliseEvents(events = []) {
  return events.map((e) => {
    if (e.type === 'book_appointment') return e.result && e.result.ok ? { ...e.result, type: 'booking' } : null;
    if (e.type === 'transfer_to_owner') return { type: 'transfer', name: (e.args && e.args.caller_name) || '', reason: (e.args && e.args.reason) || '' };
    if (e.type === 'take_message') return { type: 'message', name: (e.args && e.args.caller_name) || '', number: (e.args && e.args.callback_number) || '', message: (e.args && e.args.message) || '' };
    if (e.type === 'check_availability') return null;
    return e;
  }).filter(Boolean);
}

// "2026-11-18" -> "Wed 18 Nov" (or "Wo 18 Nov" in Afrikaans)
export function shortDay(date, locale = 'en-ZA') {
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  const part = (opts) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts }).format(d).replace(/\.$/, '');
  return `${part({ weekday: 'short' })} ${part({ day: 'numeric' })} ${part({ month: 'short' })}`;
}

// Returns { owner, client } message texts (either can be null).
export function messagesFor(events, { business = '', when = '' } = {}, t, locale) {
  const list = normaliseEvents(events);
  const booking = list.filter((e) => e.type === 'booking').pop();
  const transfer = list.filter((e) => e.type === 'transfer').pop();
  const message = list.filter((e) => e.type === 'message').pop();
  const fallbackName = t('stage.caller');
  let owner = null;
  let client = null;
  if (booking) {
    const day = shortDay(booking.date, locale);
    owner = fill(t('wa.ownerBooking'), { name: booking.name || fallbackName, service: booking.service, day, time: booking.time, with: booking.with, when });
    client = fill(t('wa.clientBooking'), { business, first: String(booking.name || '').split(' ')[0] || fallbackName, day, time: booking.time, with: booking.with });
  } else if (transfer) {
    owner = fill(t('wa.ownerTransfer'), { name: transfer.name || (message && message.name) || fallbackName, reason: transfer.reason });
  } else if (message) {
    owner = fill(t('wa.ownerMessage'), { name: message.name || fallbackName, number: message.number ? ` (${message.number})` : '', message: message.message });
  }
  return { owner, client };
}
