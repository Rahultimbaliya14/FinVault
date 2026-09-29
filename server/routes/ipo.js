const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createIPOValidator } = require('../validators/ipoValidator');
const { createIPO, getIPOs, markAllotted, markNotAllotted, cancelIPO } = require('../controllers/ipoController');

router.use(authenticate);

router.post('/', createIPOValidator, validate, createIPO);
router.get('/', getIPOs);
router.put('/:id/allot', markAllotted);
router.put('/:id/not-allot', markNotAllotted);
router.delete('/:id', cancelIPO);

module.exports = router;