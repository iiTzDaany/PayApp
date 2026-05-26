const express = require('express');

const router = express.Router();

const verificarToken =
    require('../middleware/auth.middleware');

const {
    crearTransaccion,
    obtenerTransacciones
} = require('../controllers/transaccion.controller');

/* OBTENER TRANSACCIONES */

router.get(
    '/',
    verificarToken,
    obtenerTransacciones
);

/* CREAR TRANSACCIÓN */

router.post(
    '/',
    verificarToken,
    crearTransaccion
);


module.exports = router;