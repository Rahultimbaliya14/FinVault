const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createEMIValidator, updateEMIValidator } = require('../validators/emiValidator');
const { createEMI, getEMIs, updateEMI, deleteEMI } = require('../controllers/emiController');

router.use(authenticate);

router.post('/', createEMIValidator, validate, createEMI);
router.get('/', getEMIs);
router.put('/:id', updateEMIValidator, validate, updateEMI);
router.delete('/:id', deleteEMI);

module.exports = router;