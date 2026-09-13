const SIP = require('../models/SIP');
const { getNextOccurrence, daysUntil } = require('../services/dueDateService');

const attachNextDue = (sip) => {
  const nextDueDate = getNextOccurrence(sip.sipDate);
  return {
    ...sip.toObject(),
    nextDueDate,
    daysUntilDue: daysUntil(nextDueDate),
  };
};

// POST /api/v1/sips
exports.createSIP = async (req, res) => {
  try {
    const { sipName, amount, frequency, sipDate, accountId } = req.body;

    if (!sipName || !amount || !sipDate || !accountId) {
      return res.status(400).json({
        message: 'sipName, amount, sipDate, and accountId are required',
      });
    }

    const sip = await SIP.create({
      userId: req.user.id,
      sipName,
      amount,
      frequency,
      sipDate,
      accountId,
    });

    res.status(201).json({ message: 'SIP added', sip });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add SIP', error: error.message });
  }
};

// GET /api/v1/sips
exports.getSIPs = async (req, res) => {
  try {
    const sips = await SIP.find({ userId: req.user.id, status: 'active' });
    res.status(200).json({ sips: sips.map(attachNextDue) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch SIPs', error: error.message });
  }
};

// PUT /api/v1/sips/:id
exports.updateSIP = async (req, res) => {
  try {
    const { sipName, amount, frequency, sipDate, status } = req.body;

    const sip = await SIP.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { sipName, amount, frequency, sipDate, status },
      { new: true, runValidators: true }
    );

    if (!sip) {
      return res.status(404).json({ message: 'SIP not found' });
    }

    res.status(200).json({ message: 'SIP updated', sip });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update SIP', error: error.message });
  }
};

// DELETE /api/v1/sips/:id
exports.deleteSIP = async (req, res) => {
  try {
    const sip = await SIP.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!sip) {
      return res.status(404).json({ message: 'SIP not found' });
    }

    res.status(200).json({ message: 'SIP deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete SIP', error: error.message });
  }
};