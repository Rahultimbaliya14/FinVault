const { getMonthlyReport } = require('../services/reportService');

// GET /api/v1/reports?month=9&year=2026
exports.getReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'month and year are required query parameters' });
    }

    const monthIndex = Number(month) - 1;
    const targetYear = Number(year);

    if (monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ message: 'month must be between 1 and 12' });
    }

    const report = await getMonthlyReport(req.user.id, targetYear, monthIndex);
    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
};