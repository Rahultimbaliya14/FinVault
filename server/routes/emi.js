const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { createEMI, getEMIs, updateEMI, deleteEMI } = require('../controllers/emiController');

router.use(authenticate);

router.post('/', createEMI);
router.get('/', getEMIs);
router.put('/:id', updateEMI);
router.delete('/:id', deleteEMI);

module.exports = router;