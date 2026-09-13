const CreditCard = require('../models/CreditCard');
const CardTransaction = require('../models/CardTransaction');
const BillingCycle = require('../models/BillingCycle');
const { getOrCreateBillingCycle } = require('../services/billingCycleService');

// POST /api/v1/cards
exports.createCard = async (req, res) => {
  try {
    const { cardName, creditLimit, billingDate, dueDate } = req.body;

    if (!cardName || !creditLimit || !billingDate || !dueDate) {
      return res.status(400).json({
        message: 'cardName, creditLimit, billingDate, and dueDate are required',
      });
    }

    const card = await CreditCard.create({
      userId: req.user.id,
      cardName,
      creditLimit,
      billingDate,
      dueDate,
    });

    res.status(201).json({ message: 'Card added', card });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add card', error: error.message });
  }
};

// GET /api/v1/cards - includes outstanding & available limit for each card
exports.getCards = async (req, res) => {
  try {
    const cards = await CreditCard.find({ userId: req.user.id });

    const cardsWithOutstanding = await Promise.all(
      cards.map(async (card) => {
        // Outstanding = sum of all unpaid cycles' statement amounts
        const unpaidCycles = await BillingCycle.find({
          cardId: card._id,
          status: { $ne: 'paid' },
        });
        const outstanding = unpaidCycles.reduce((sum, c) => sum + c.statementAmount, 0);

        return {
          ...card.toObject(),
          outstanding,
          availableLimit: card.creditLimit - outstanding,
        };
      })
    );

    res.status(200).json({ cards: cardsWithOutstanding });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cards', error: error.message });
  }
};

// POST /api/v1/cards/:id/purchases - record a purchase against a card
exports.recordPurchase = async (req, res) => {
  try {
    const { amount, date, category, description } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'amount is required' });
    }

    const card = await CreditCard.findOne({ _id: req.params.id, userId: req.user.id });
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const purchaseDate = date ? new Date(date) : new Date();

    // This is the key step: figure out which billing cycle this
    // purchase belongs to (creating it if it doesn't exist yet)
    const cycle = await getOrCreateBillingCycle(card, purchaseDate);

    const cardTransaction = await CardTransaction.create({
      userId: req.user.id,
      cardId: card._id,
      billingCycleId: cycle._id,
      amount,
      date: purchaseDate,
      category,
      description,
    });

    // Keep the cycle's running statement total up to date
    cycle.statementAmount += amount;
    await cycle.save();

    res.status(201).json({
      message: 'Purchase recorded',
      cardTransaction,
      billingCycle: cycle,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record purchase', error: error.message });
  }
};

// GET /api/v1/cards/:id/cycles - view all billing cycles for a card
exports.getBillingCycles = async (req, res) => {
  try {
    const card = await CreditCard.findOne({ _id: req.params.id, userId: req.user.id });
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const cycles = await BillingCycle.find({ cardId: card._id }).sort({ periodStart: -1 });

    res.status(200).json({ cycles });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch billing cycles', error: error.message });
  }
};

// PUT /api/v1/cards/:cardId/cycles/:cycleId/pay - mark a cycle as paid
exports.payBillingCycle = async (req, res) => {
  try {
    const cycle = await BillingCycle.findOneAndUpdate(
      { _id: req.params.cycleId, cardId: req.params.cardId, userId: req.user.id },
      { status: 'paid' },
      { new: true }
    );

    if (!cycle) {
      return res.status(404).json({ message: 'Billing cycle not found' });
    }

    res.status(200).json({ message: 'Cycle marked as paid', cycle });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update cycle', error: error.message });
  }
};