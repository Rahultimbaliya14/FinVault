const { getDashboardData } = require('../services/dashboardService');
const { generateInsights } = require('../services/insightsService');

// GET /api/v1/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const dashboardData = await getDashboardData(req.user.id);
    const insights = generateInsights(dashboardData);

    res.status(200).json({ ...dashboardData, insights });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dashboard', error: error.message });
  }
};