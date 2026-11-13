// In-memory demo diary. Sample data only: nothing is stored and no real booking is made.
// Every demo session gets its own copy, so one visitor's test booking never shows for another.
// It also records messages and transfers, so the page can show the WhatsApp the owner would get.
import { BUSINESSES, businessKey } from './agent.js';

const TZ = 'Africa/Johannesburg';
const dayKey = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date); // YYYY-MM-DD
const weekdayOf = (key) => new Intl.DateTimeFormat('en-ZA', { timeZone: 'UTC', weekday: 'long' }).format(new Date(`${key}T12:00:00Z`));
const niceDate = (key) => new Intl.DateTimeFormat('en-ZA', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${key}T12:00:00Z`));
const clean = (value, max = 80) => String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);

// Small deterministic hash so the same day always shows the same sample bookings.
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const hhmm = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

export function createCalendar({ business, now = () => new Date() } = {}) {
  const key = businessKey(business);
  const b = BUSINESSES[key];
  const booked = new Map(); // "date time" -> booking
  const events = [];        // everything the owner would get on WhatsApp

  function slotsFor(day) {
    const hours = b.schedule[weekdayOf(day)];
    if (!hours) return [];
    const slots = [];
    for (let t = minutes(hours[0]); t <= minutes(hours[1]); t += 30) {
      const time = hhmm(t);
      if (hash(`${key} ${day} ${time}`) % 5 < 3) continue; // already taken in the sample data
      slots.push({ time, with: b.staff[hash(`${key}${day}${time}s`) % b.staff.length] });
    }
    return slots;
  }
  const open = (day) => slotsFor(day).filter((slot) => !booked.has(`${day} ${slot.time}`));
  const validDay = (day) => /^\d{4}-\d{2}-\d{2}$/.test(String(day)) && !Number.isNaN(Date.parse(`${day}T12:00:00Z`));

  function checkAvailability({ date, part_of_day: part = 'any' } = {}) {
    if (!validDay(date)) return { ok: false, error: 'Use a date in the form YYYY-MM-DD.' };
    const today = dayKey(now());
    if (date < today) return { ok: false, error: 'That day has passed. Ask for a day from today onwards.', today };
    if (date > dayKey(new Date(now().getTime() + 30 * 86400000))) return { ok: false, error: 'The diary only goes 30 days ahead.' };
    if (!b.schedule[weekdayOf(date)]) return { ok: true, date, day: niceDate(date), closed: true, slots: [], note: `${b.name} is closed on ${weekdayOf(date)}s.` };
    let slots = open(date);
    if (date === today) {
      const nowTime = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(now());
      slots = slots.filter((slot) => slot.time > nowTime);
    }
    if (part === 'morning') slots = slots.filter((slot) => slot.time < '12:00');
    if (part === 'afternoon') slots = slots.filter((slot) => slot.time >= '12:00');
    return { ok: true, date, day: niceDate(date), closed: false, slots: slots.slice(0, 6), more_available: slots.length > 6 };
  }

  function bookAppointment({ date, time, service, patient_name: name } = {}) {
    if (!validDay(date) || !/^\d{2}:\d{2}$/.test(String(time))) return { ok: false, error: 'Give the date as YYYY-MM-DD and the time as HH:MM.' };
    if (!clean(name)) return { ok: false, error: 'Ask for the caller\'s name first.' };
    const slot = open(date).find((s) => s.time === time);
    if (!slot) return { ok: false, error: 'That time is not open.', alternatives: checkAvailability({ date }).slots || [] };
    const booking = {
      type: 'booking',
      reference: `DEMO-${String((hash(`${date}${time}${name}`) % 9000) + 1000)}`,
      date, day: niceDate(date), time, with: slot.with,
      service: clean(service || b.service, 60), name: clean(name, 60),
    };
    booked.set(`${date} ${time}`, booking);
    events.push(booking);
    return { ok: true, status: 'confirmed', ...booking, note: 'Demo only. Nothing is saved. In real use the caller now gets a WhatsApp confirmation.' };
  }

  function takeMessage({ caller_name: name, callback_number: number, message } = {}) {
    if (!clean(message)) return { ok: false, error: 'Ask what the message is.' };
    const item = { type: 'message', name: clean(name, 60) || 'Caller', number: clean(number, 30), message: clean(message, 200) };
    events.push(item);
    return { ok: true, status: 'sent', note: `Demo only. In real use ${b.owner} gets this on WhatsApp straight away.` };
  }

  function transferToOwner({ reason, caller_name: name } = {}) {
    const item = { type: 'transfer', name: clean(name, 60) || 'Caller', reason: clean(reason, 120) || 'asked for a person' };
    events.push(item);
    return {
      ok: true,
      status: 'demo_no_transfer',
      note: `This is a demo, so nobody is on the other line. Tell the caller that in real use you would put them through to ${b.owner} now, and that you have sent ${b.owner} a WhatsApp with their details.`,
    };
  }

  return {
    business: key,
    bookings: () => events.filter((e) => e.type === 'booking'),
    events: () => events.slice(),
    run(name, args) {
      if (name === 'check_availability') return checkAvailability(args || {});
      if (name === 'book_appointment') return bookAppointment(args || {});
      if (name === 'take_message') return takeMessage(args || {});
      if (name === 'transfer_to_owner') return transferToOwner(args || {});
      return { ok: false, error: `Unknown tool: ${name}` };
    },
  };
}
