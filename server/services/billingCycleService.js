const BillingCycle = require('../models/BillingCycle');

// Clamps a day number to a valid date in a given month/year.
// Handles cards with billingDate=31 falling in a 30-day or Feb month.
const safeDate = (year, monthIndex, day) => {
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDayOfMonth));
};

// Given a purchase date and the card's billingDate, figure out which
// statement period (cycle) the purchase belongs to.
//
// Rule: a cycle runs from (billingDate + 1) of one month to
// billingDate of the next month.
//
// Example: billingDate = 15
//   Purchase on 20th Sept -> falls AFTER this month's billing date,
//   so it belongs to the cycle: 16 Sept -> 15 Oct
//   Purchase on 10th Sept -> falls BEFORE this month's billing date,
//   so it belongs to the cycle: 16 Aug -> 15 Sept
const calculateCycleForDate = (purchaseDate, billingDate, dueDate) => {
  const day = purchaseDate.getDate();
  const year = purchaseDate.getFullYear();
  const month = purchaseDate.getMonth(); // 0-indexed

  let periodEnd;
  let periodStartMonth;
  let periodStartYear;

  if (day > billingDate) {
    // Belongs to the cycle ending NEXT month
    periodEnd = safeDate(year, month + 1, billingDate);
    periodStartMonth = month;
    periodStartYear = year;
  } else {
    // Belongs to the cycle ending THIS month
    periodEnd = safeDate(year, month, billingDate);
    periodStartMonth = month - 1;
    periodStartYear = year;
  }

  // periodStart is always the day after the PREVIOUS billing date
  const prevBillingDate = safeDate(periodStartYear, periodStartMonth, billingDate);
  const periodStart = new Date(prevBillingDate);
  periodStart.setDate(periodStart.getDate() + 1);

  // Due date is always in the month AFTER the statement (periodEnd) is generated
  const dueDateMonth = periodEnd.getMonth() + 1;
  const dueDateValue = safeDate(periodEnd.getFullYear(), dueDateMonth, dueDate);

  return { periodStart, periodEnd, dueDate: dueDateValue };
};

// Finds an existing billing cycle for this purchase date, or creates one.
// This is what a controller should call - it never needs to know the
// date math above, just "give me the right cycle for this purchase".
const getOrCreateBillingCycle = async (card, purchaseDate) => {
  const { periodStart, periodEnd, dueDate } = calculateCycleForDate(
    purchaseDate,
    card.billingDate,
    card.dueDate
  );

  let cycle = await BillingCycle.findOne({
    cardId: card._id,
    periodStart,
    periodEnd,
  });

  if (!cycle) {
    cycle = await BillingCycle.create({
      userId: card.userId,
      cardId: card._id,
      periodStart,
      periodEnd,
      dueDate,
      statementAmount: 0,
      status: 'open',
    });
  }

  return cycle;
};

module.exports = { calculateCycleForDate, getOrCreateBillingCycle };