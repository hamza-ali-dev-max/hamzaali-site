// In-memory demo calendar. It is sample data only: nothing is stored and no real booking is ever made.
// Every demo session gets its own copy, so one visitor's test booking never shows up for another.
import { PRACTICE } from './agent.js';

const TZ = 'Africa/Johannesburg';
const dayKey = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date); // YYYY-MM-DD
const weekdayOf = (key) => new Intl.DateTimeFormat('en-ZA', { timeZone: 'UTC', weekday: 'long' }).format(new Date(`${key}T12:00:00Z`));
const niceDate = (key) => new Intl.DateTimeFormat('en-ZA', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${key}T12:00:00Z`));

// Small deterministic hash so the same day always shows the same sample bookings.
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function slotsFor(key) {
  const weekday = weekdayOf(key);
  if (weekday === 'Sunday') return [];
  const last = weekday === 'Saturday' ? 11.5 : 16.5;
  const slots = [];
  for (let t = 8; t <= last; t += 0.5) {
    const time = `${String(Math.floor(t)).padStart(2, '0')}:${t % 1 ? '30' : '00'}`;
    if (hash(`${key} ${time}`) % 5 < 3) continue; // already taken in the sample data
    slots.push({ time, dentist: PRACTICE.dentists[hash(`${key}${time}d`) % PRACTICE.dentists.length] });
  }
  return slots;
}

export function createCalendar(now = () => new Date()) {
  const booked = new Map(); // "date time" -> booking

  const open = (key) => slotsFor(key).filter((slot) => !booked.has(`${key} ${slot.time}`));
  const validDay = (key) => /^\d{4}-\d{2}-\d{2}$/.test(String(key)) && !Number.isNaN(Date.parse(`${key}T12:00:00Z`));

  function checkAvailability({ date, part_of_day: part = 'any' } = {}) {
    if (!validDay(date)) return { ok: false, error: 'Use a date in the form YYYY-MM-DD.' };
    const today = dayKey(now());
    if (date < today) return { ok: false, error: 'That day has passed. Ask for a day from today onwards.', today };
    const limit = dayKey(new Date(now().getTime() + 30 * 86400000));
    if (date > limit) return { ok: false, error: 'The demo calendar only goes 30 days ahead.' };
    let slots = open(date);
    if (date === today) {
      const nowTime = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(now());
      slots = slots.filter((slot) => slot.time > nowTime);
    }
    if (part === 'morning') slots = slots.filter((slot) => slot.time < '12:00');
    if (part === 'afternoon') slots = slots.filter((slot) => slot.time >= '12:00');
    const weekday = weekdayOf(date);
    if (weekday === 'Sunday') return { ok: true, date, day: niceDate(date), closed: true, slots: [], note: 'The practice is closed on Sundays.' };
    return { ok: true, date, day: niceDate(date), closed: false, slots: slots.slice(0, 6), more_available: slots.length > 6 };
  }

  function bookAppointment({ date, time, service, patient_name: name } = {}) {
    if (!validDay(date) || !/^\d{2}:\d{2}$/.test(String(time))) return { ok: false, error: 'Give the date as YYYY-MM-DD and the time as HH:MM.' };
    if (!String(name || '').trim()) return { ok: false, error: 'Ask for the caller\'s name first.' };
    const slot = open(date).find((s) => s.time === time);
    if (!slot) {
      return { ok: false, error: 'That time is not open.', alternatives: checkAvailability({ date }).slots || [] };
    }
    const reference = `DEMO-${String(hash(`${date}${time}${name}`) % 9000 + 1000)}`;
    const booking = { reference, date, day: niceDate(date), time, dentist: slot.dentist, service: String(service || 'visit').slice(0, 60), patient_name: String(name).slice(0, 60) };
    booked.set(`${date} ${time}`, booking);
    return { ok: true, status: 'confirmed', ...booking, note: 'Demo booking only. Nothing is saved and no real appointment exists.' };
  }

  return {
    checkAvailability,
    bookAppointment,
    bookings: () => [...booked.values()],
    run(name, args) {
      if (name === 'check_availability') return checkAvailability(args || {});
      if (name === 'book_appointment') return bookAppointment(args || {});
      return { ok: false, error: `Unknown tool: ${name}` };
    },
  };
}
