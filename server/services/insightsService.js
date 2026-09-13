    // Turns raw dashboard numbers into plain-English sentences, per the
// spec's "Financial Insights" feature. Kept as simple template rules
// for now - no AI call needed, and it's fully predictable/testable.
// Each rule is independent, so add/remove/reorder freely later.
const generateInsights = (dashboardData) => {
  const {
    totalMonthlyIncome,
    totalPlannedCommitments,
    availableFunds,
    categoryWiseExpenses,
    upcomingDues,
  } = dashboardData;

  const insights = [];

  // Highest spending category this month
  const categories = Object.entries(categoryWiseExpenses);
  if (categories.length > 0) {
    const [topCategory, topAmount] = categories.sort((a, b) => b[1] - a[1])[0];
    insights.push(`You have spent ₹${topAmount.toLocaleString('en-IN')} on ${topCategory} this month.`);
  }

  // Total commitments
  if (totalPlannedCommitments > 0) {
    insights.push(`Your total upcoming commitments are ₹${totalPlannedCommitments.toLocaleString('en-IN')}.`);
  }

  // Percentage of income committed (only meaningful if income was recorded)
  if (totalMonthlyIncome > 0) {
    const percentCommitted = Math.round((totalPlannedCommitments / totalMonthlyIncome) * 100);
    insights.push(
      `₹${totalPlannedCommitments.toLocaleString('en-IN')} (${percentCommitted}%) of your monthly income is already committed.`
    );
  }

  // Anything due very soon (within 3 days) gets called out individually
  const dueSoon = upcomingDues.filter((d) => d.daysUntilDue !== null && d.daysUntilDue <= 3 && d.daysUntilDue >= 0);
  dueSoon.forEach((due) => {
    const dayWord = due.daysUntilDue === 0 ? 'today' : due.daysUntilDue === 1 ? 'tomorrow' : `in ${due.daysUntilDue} days`;
    insights.push(`Your ${due.label} of ₹${due.amount.toLocaleString('en-IN')} is due ${dayWord}.`);
  });

  // Anything already overdue
  const overdue = upcomingDues.filter((d) => d.daysUntilDue !== null && d.daysUntilDue < 0);
  overdue.forEach((due) => {
    insights.push(`Your ${due.label} of ₹${due.amount.toLocaleString('en-IN')} is overdue by ${Math.abs(due.daysUntilDue)} days.`);
  });

  // Available funds summary
  insights.push(
    `You currently have ₹${availableFunds.toLocaleString('en-IN')} available after considering upcoming commitments.`
  );

  return insights;
};

module.exports = { generateInsights };