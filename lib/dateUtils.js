// Format a Date as a local YYYY-MM-DD string. Never use `date.toISOString().slice(0, 10)`
// for "today" or scheduling logic - it converts to UTC first, which silently rolls the
// date forward or back a day depending on the user's timezone and time of day.
export function toLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
