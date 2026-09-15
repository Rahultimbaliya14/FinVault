// Given a day-of-month (e.g. 10 = "10th of every month"), returns the
// NEXT occurrence of that date from today. If today is past that day
// this month, it rolls over to next month. Used by SIP, EMI, and later
// the unified Dues aggregator - keeping it in one place means every
// "upcoming payment" feature behaves consistently.
const safeDate = (year, monthIndex, day) => {
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDayOfMonth));
};

const getNextOccurrence = (dayOfMonth, fromDate = new Date()) => {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth();
  const today = fromDate.getDate();

  if (today <= dayOfMonth) {
    return safeDate(year, month, dayOfMonth);
  }
  return safeDate(year, month + 1, dayOfMonth);
};

// Days remaining until a given date (used for "due in X days" insights)
const daysUntil = (date, fromDate = new Date()) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const to = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((to - from) / msPerDay);
};

// Gives the concrete date for a day-of-month within a SPECIFIC month/year,
// rather than searching for the next occurrence from today. Used when
// browsing dues for a month other than the current one.
const getDateInMonth = (dayOfMonth, year, monthIndex) => safeDate(year, monthIndex, dayOfMonth);

module.exports = { getNextOccurrence, daysUntil, getDateInMonth };