const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createAccountValidator, updateAccountValidator } = require('../validators/accountValidator');
const {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} = require('../controllers/bankAccountController');

// Every route here requires a valid JWT - applied once for the whole router
router.use(authenticate);

router.post('/', createAccountValidator, validate, createAccount);
router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.put('/:id', updateAccountValidator, validate, updateAccount);
router.delete('/:id', deleteAccount);

module.exports = router;