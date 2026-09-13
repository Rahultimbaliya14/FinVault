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

const daysUntil = (date, fromDate = new Date()) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const to = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((to - from) / msPerDay);
};

module.exports = { getNextOccurrence, daysUntil };