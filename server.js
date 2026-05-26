const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const cuentaRoutes = require('./routes/cuenta.routes');
const transaccionRoutes = require('./routes/transaccion.routes');
const pagoRoutes = require('./routes/pago.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/cuentas', cuentaRoutes);
app.use(
    '/api/transacciones',
    require('./routes/transaccion.routes')
);
app.use(
    '/api/dashboard',
    require('./routes/dashboard.routes')
);
app.use(
    '/api/admin',
    require('./routes/admin.routes')
);
app.use('/api/pagos', pagoRoutes);



const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('API PayApp funcionando correctamente');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});