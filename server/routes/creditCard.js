const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const {
  createCard,
  getCards,
  recordPurchase,
  getBillingCycles,
  payBillingCycle,
} = require('../controllers/creditCardController');

router.use(authenticate);

router.post('/', createCard);
router.get('/', getCards);
router.post('/:id/purchases', recordPurchase);
router.get('/:id/cycles', getBillingCycles);
router.put('/:cardId/cycles/:cycleId/pay', payBillingCycle);

module.exports = router;