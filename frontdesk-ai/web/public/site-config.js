// Front Desk AI site settings. Nothing in this file is secret.
//
// PLACEHOLDERS: replace the four contact values below with your real details.
// Every red PLACEHOLDER tag on the page disappears by itself once its value is replaced.
window.FRONT_DESK_CONFIG = {
  email: "hello@example.com",       // PLACEHOLDER: contact email (Gmail)
  phone: "+27 00 000 0000",         // PLACEHOLDER: contact phone number
  whatsapp: "+27 00 000 0000",      // PLACEHOLDER: WhatsApp number that receives demo requests
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cape+Town%2C+South+Africa", // PLACEHOLDER: your Google Maps link

  // Where the voice demo backend lives. Leave empty when the backend serves this site itself
  // (Docker or "npm start"). On Netlify or Vercel this is filled in at build time from PUBLIC_API_BASE.
  apiBase: "",

  // Google Analytics 4 measurement ID. Analytics only loads once this is a real ID.
  googleAnalyticsId: "G-XXXXXXXXXX" // PLACEHOLDER
};
