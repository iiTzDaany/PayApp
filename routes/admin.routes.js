const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/auth.middleware');
const verificarAdmin = require('../middleware/admin.middleware');

const {
    obtenerUsuarios,
    obtenerTodasTransacciones,
    asignarSaldo,
    cambiarEstadoUsuario,
    cambiarRolUsuario
} = require('../controllers/admin.controller');

router.get('/usuarios', verificarToken, verificarAdmin, obtenerUsuarios);

router.get('/transacciones', verificarToken, verificarAdmin, obtenerTodasTransacciones);

router.post('/asignar-saldo', verificarToken, verificarAdmin, asignarSaldo);

router.put('/usuario/estado', verificarToken, verificarAdmin, cambiarEstadoUsuario);

router.put('/usuario/rol', verificarToken, verificarAdmin, cambiarRolUsuario);



module.exports = router;