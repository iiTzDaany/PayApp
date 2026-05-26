const pool = require('../config/db');

const obtenerCuentas = async (req, res) => {

    try {

        const cuentas = await pool.query(
            `
            SELECT * FROM cuenta
            WHERE id_usuario = $1
            `,
            [req.usuario.id_usuario]
        );

        res.json(cuentas.rows);

    } catch (error) {

        res.status(500).json(error.message);

    }
};

module.exports = {
    obtenerCuentas
};