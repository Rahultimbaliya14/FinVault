const { getAllUpcomingDues } = require('../services/duesService');

// GET /api/v1/dues?month=10&year=2026
// month is 1-indexed here (10 = October) since that's how humans and
// frontend dropdowns naturally think about months - converted to
// JS's 0-indexed convention right before calling the service.
exports.getDues = async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetYear = year ? Number(year) : undefined;
    const targetMonth = month ? Number(month) - 1 : undefined;

    const dues = await getAllUpcomingDues(req.user.id, targetYear, targetMonth);
    const totalDue = dues.reduce((sum, d) => sum + d.amount, 0);

    res.status(200).json({ count: dues.length, totalDue, dues });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dues', error: error.message });
  }
};