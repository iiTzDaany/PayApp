const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/auth.middleware');

const {
    registrarPago,
    obtenerServicios
} = require('../controllers/pago.controller');

router.get('/servicios', verificarToken, obtenerServicios);

router.post('/', verificarToken, registrarPago);

module.exports = router;