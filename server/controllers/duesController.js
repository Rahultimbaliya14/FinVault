const { getAllUpcomingDues } = require('../services/duesService');
// GET /api/v1/dues
exports.getDues = async (req, res) => {
  try {
    console.log('Fetching dues for user:', req.user.id);
    console.log(getAllUpcomingDues());
    const dues = await getAllUpcomingDues(req.user.id);
    const totalDue = dues.reduce((sum, d) => sum + d.amount, 0);

    res.status(200).json({ count: dues.length, totalDue, dues });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dues', error: error.message });
  }
};