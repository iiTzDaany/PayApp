const pool = require('../config/db');

const obtenerEstadisticas = async (req, res) => {

    try {

        const id_usuario =
            req.usuario.id_usuario;

        // OBTENER CUENTA

        const cuenta = await pool.query(
            `
            SELECT *
            FROM cuenta
            WHERE id_usuario = $1
            `,
            [id_usuario]
        );

        const id_cuenta =
            cuenta.rows[0].id_cuenta;

        // INGRESOS

        const ingresos = await pool.query(
            `
            SELECT COALESCE(SUM(monto),0)
            AS total
            FROM transaccion
            WHERE id_cuenta_destino = $1
            `,
            [id_cuenta]
        );

        // GASTOS

        const gastos = await pool.query(
            `
            SELECT COALESCE(SUM(monto),0)
            AS total
            FROM transaccion
            WHERE id_cuenta_origen = $1
            `,
            [id_cuenta]
        );

        // MOVIMIENTOS

        const movimientos = await pool.query(
            `
            SELECT
                DATE(fecha) as fecha,
                SUM(monto) as total
            FROM transaccion
            WHERE
                id_cuenta_origen = $1
                OR id_cuenta_destino = $1
            GROUP BY DATE(fecha)
            ORDER BY DATE(fecha)
            `,
            [id_cuenta]
        );

        res.json({

            ingresos:
                ingresos.rows[0].total,

            gastos:
                gastos.rows[0].total,

            movimientos:
                movimientos.rows

        });

    } catch (error) {

        console.log(error);

        res.status(500).json(error.message);

    }

};

module.exports = {
    obtenerEstadisticas
};