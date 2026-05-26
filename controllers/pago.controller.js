const pool = require('../config/db');

const registrarPago = async (req, res) => {
    try {
        const {
            id_servicio,
            referencia,
            monto
        } = req.body;

        if (!id_servicio || !referencia || !monto || Number(monto) <= 0) {
            return res.status(400).json({
                mensaje: 'Datos de pago inválidos'
            });
        }

        const cuenta = await pool.query(
            `
            SELECT *
            FROM cuenta
            WHERE id_usuario = $1
            `,
            [req.usuario.id_usuario]
        );

        if (cuenta.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Cuenta no encontrada'
            });
        }

        const cuentaUsuario = cuenta.rows[0];

        if (Number(cuentaUsuario.saldo) < Number(monto)) {
            return res.status(400).json({
                mensaje: 'Saldo insuficiente'
            });
        }

        await pool.query('BEGIN');

        await pool.query(
            `
            UPDATE cuenta
            SET saldo = saldo - $1
            WHERE id_cuenta = $2
            `,
            [monto, cuentaUsuario.id_cuenta]
        );

        const transaccion = await pool.query(
            `
            INSERT INTO transaccion
            (
                id_cuenta_origen,
                id_cuenta_destino,
                monto,
                descripcion,
                id_tipo,
                id_estado
            )
            VALUES ($1, NULL, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                cuentaUsuario.id_cuenta,
                monto,
                'Pago de servicio',
                2,
                2
            ]
        );

        const pago = await pool.query(
            `
            INSERT INTO pago
            (
                id_transaccion,
                id_servicio,
                referencia
            )
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [
                transaccion.rows[0].id_transaccion,
                id_servicio,
                referencia
            ]
        );

        await pool.query(
            `
            INSERT INTO auditoria
            (id_usuario, accion, tabla_afectada, detalle)
            VALUES ($1, $2, $3, $4)
            `,
            [
                req.usuario.id_usuario,
                'PAGO_SERVICIO',
                'pago',
                `Pago de servicio por ${monto}, referencia ${referencia}`
            ]
        );

        await pool.query('COMMIT');

        res.json({
            mensaje: 'Pago realizado correctamente',
            transaccion: transaccion.rows[0],
            pago: pago.rows[0]
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.log(error);
        res.status(500).json(error.message);
    }
};

const obtenerServicios = async (req, res) => {
    try {
        const servicios = await pool.query(`
            SELECT *
            FROM servicio
            ORDER BY id_servicio
        `);

        res.json(servicios.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message);
    }
};

module.exports = {
    registrarPago,
    obtenerServicios
};