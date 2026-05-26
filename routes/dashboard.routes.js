const express = require('express');

const router = express.Router();

const verificarToken =
    require('../middleware/auth.middleware');

const {
    obtenerEstadisticas
} = require('../controllers/dashboard.controller');

router.get(
    '/',
    verificarToken,
    obtenerEstadisticas
);

module.exports = router;