const EMI = require('../models/EMI');
const { getNextOccurrence, daysUntil } = require('../services/dueDateService');

const attachNextDue = (emi) => {
  const nextDueDate = getNextOccurrence(emi.dueDate);
  return {
    ...emi.toObject(),
    nextDueDate,
    daysUntilDue: daysUntil(nextDueDate),
  };
};

// POST /api/v1/emis
exports.createEMI = async (req, res) => {
  try {
    const {
      loanName,
      principalAmount,
      emiAmount,
      interestRate,
      startDate,
      endDate,
      numberOfInstallments,
      dueDate,
      accountId,
    } = req.body;

    if (!loanName || !principalAmount || !emiAmount || !dueDate || !accountId || !startDate || !endDate || !numberOfInstallments) {
      return res.status(400).json({
        message:
          'loanName, principalAmount, emiAmount, startDate, endDate, numberOfInstallments, dueDate, and accountId are required',
      });
    }

    const emi = await EMI.create({
      userId: req.user.id,
      loanName,
      principalAmount,
      emiAmount,
      interestRate,
      startDate,
      endDate,
      numberOfInstallments,
      dueDate,
      accountId,
    });

    res.status(201).json({ message: 'EMI added', emi });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add EMI', error: error.message });
  }
};

// GET /api/v1/emis
exports.getEMIs = async (req, res) => {
  try {
    const emis = await EMI.find({ userId: req.user.id, status: 'active' });
    res.status(200).json({ emis: emis.map(attachNextDue) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch EMIs', error: error.message });
  }
};

// PUT /api/v1/emis/:id
exports.updateEMI = async (req, res) => {
  try {
    const { loanName, emiAmount, dueDate, status } = req.body;

    const emi = await EMI.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { loanName, emiAmount, dueDate, status },
      { new: true, runValidators: true }
    );

    if (!emi) {
      return res.status(404).json({ message: 'EMI not found' });
    }

    res.status(200).json({ message: 'EMI updated', emi });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update EMI', error: error.message });
  }
};

// DELETE /api/v1/emis/:id
exports.deleteEMI = async (req, res) => {
  try {
    const emi = await EMI.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!emi) {
      return res.status(404).json({ message: 'EMI not found' });
    }

    res.status(200).json({ message: 'EMI deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete EMI', error: error.message });
  }
};