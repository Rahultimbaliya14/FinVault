const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createSIPValidator, updateSIPValidator } = require('../validators/sipValidator');
const { createSIP, getSIPs, updateSIP, deleteSIP } = require('../controllers/sipController');

router.use(authenticate);

router.post('/', createSIPValidator, validate, createSIP);
router.get('/', getSIPs);
router.put('/:id', updateSIPValidator, validate, updateSIP);
router.delete('/:id', deleteSIP);

module.exports = router;