const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3006;

app.use(cors());
app.use(express.json());

// Endpoint de prueba simple
app.get('/api/test', (req, res) => {
    console.log('✅ Request recibido');
    res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

app.get('/api/reportes/dashboard', (req, res) => {
    console.log('📊 Dashboard llamado');
    res.json({ mensaje: 'Dashboard sin DB' });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor de prueba corriendo en puerto ${PORT}`);
});
