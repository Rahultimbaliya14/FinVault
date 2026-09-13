const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { createSIP, getSIPs, updateSIP, deleteSIP } = require('../controllers/sipController');

router.use(authenticate);

router.post('/', createSIP);
router.get('/', getSIPs);
router.put('/:id', updateSIP);
router.delete('/:id', deleteSIP);

module.exports = router;