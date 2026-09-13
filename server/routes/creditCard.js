const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createCardValidator, purchaseValidator } = require('../validators/creditCardValidator');
const {
  createCard,
  getCards,
  recordPurchase,
  getBillingCycles,
  payBillingCycle,
} = require('../controllers/creditCardController');

router.use(authenticate);

router.post('/', createCardValidator, validate, createCard);
router.get('/', getCards);
router.post('/:id/purchases', purchaseValidator, validate, recordPurchase);
router.get('/:id/cycles', getBillingCycles);
router.put('/:cardId/cycles/:cycleId/pay', payBillingCycle);

module.exports = router;