const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/auth.middleware');

const {
    obtenerCuentas
} = require('../controllers/cuenta.controller');

router.get('/', verificarToken, obtenerCuentas);

module.exports = router;