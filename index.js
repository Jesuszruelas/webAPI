require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.set('json spaces', 2);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    if (req.url.endsWith(':')) {
        req.url = req.url.slice(0, -1);
    }
    const lowerUrl = req.url.toLowerCase();
    if (lowerUrl.startsWith('/empleados')) {
        req.url = '/api' + lowerUrl;
    } else if (lowerUrl.startsWith('/api/empleados')) {
        req.url = lowerUrl;
    }
    next();
});

let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI no configurado.');
    }
    cachedDb = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    return cachedDb;
}

const empleadoSchema = new mongoose.Schema({
    Clave: {
        type: Number
    },
    Nombre: {
        type: String,
        trim: true
    },
    dirección: {
        type: String,
        trim: true,
        alias: 'direccion'
    },
    fechadenacimiento: {
        type: Date
    },
    sexo: {
        type: mongoose.Schema.Types.Mixed
    },
    tipodesangre: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    versionKey: false,
    strict: false
});

const Empleado = mongoose.models.Empleado || mongoose.model('Empleado', empleadoSchema, 'Empleados');

function normalizarEmpleado(data) {
    const normalizado = { ...data };
    if (data.Clave !== undefined || data.clave !== undefined) {
        const c = data.Clave !== undefined ? data.Clave : data.clave;
        normalizado.Clave = !isNaN(c) ? Number(c) : c;
    }
    if (data.Nombre !== undefined || data.nombre !== undefined) {
        normalizado.Nombre = String(data.Nombre !== undefined ? data.Nombre : data.nombre).trim();
    }
    if (data.dirección !== undefined || data.direccion !== undefined) {
        normalizado.dirección = String(data.dirección !== undefined ? data.dirección : data.direccion).trim();
    }
    if (data.fechadenacimiento || data.fechaDeNacimiento || data.fecha_nacimiento) {
        const rawDate = data.fechadenacimiento || data.fechaDeNacimiento || data.fecha_nacimiento;
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
            normalizado.fechadenacimiento = parsed;
        }
    }
    if (data.sexo !== undefined || data.Sexo !== undefined) {
        normalizado.sexo = data.sexo !== undefined ? data.sexo : data.Sexo;
    }
    if (data.tipodesangre || data.tipoDeSangre || data.tipo_sangre) {
        normalizado.tipodesangre = String(data.tipodesangre || data.tipoDeSangre || data.tipo_sangre).trim();
    }
    return normalizado;
}

const requireDB = async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        res.status(500).json({
            error: 'Error de conexión con MongoDB Atlas',
            detalle: error.message
        });
    }
};

app.get('/', (req, res) => {
    res.json({
        servicio: 'API REST MongoDB Atlas - Empleados',
        estado: 'En línea',
        coleccion: 'Empleados',
        endpoints: [
            'GET /api/empleados',
            'GET /api/empleados/:clave',
            'POST /api/empleados',
            'PUT /api/empleados/:clave',
            'DELETE /api/empleados/:clave'
        ]
    });
});

app.get('/api/empleados', requireDB, async (req, res) => {
    try {
        const empleados = await Empleado.find().sort({ Clave: 1 });
        res.status(200).json(empleados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/empleados/:identificador', requireDB, async (req, res) => {
    try {
        const { identificador } = req.params;
        const esClave = !isNaN(identificador);

        if (esClave) {
            const empleados = await Empleado.find({ Clave: Number(identificador) });
            if (!empleados || empleados.length === 0) {
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }
            return res.status(200).json(empleados);
        } else {
            if (!mongoose.Types.ObjectId.isValid(identificador)) {
                return res.status(400).json({ error: 'Identificador no válido (debe ser Clave numérica o _id)' });
            }
            const empleado = await Empleado.findById(identificador);
            if (!empleado) {
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }
            return res.status(200).json(empleado);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/empleados', requireDB, async (req, res) => {
    try {
        const datos = normalizarEmpleado(req.body);
        const nuevoEmpleado = new Empleado(datos);
        const guardado = await nuevoEmpleado.save();
        res.status(201).json(guardado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/empleados/:identificador', requireDB, async (req, res) => {
    try {
        const { identificador } = req.params;
        const esClave = !isNaN(identificador);
        const datosActualizados = normalizarEmpleado(req.body);

        if (esClave) {
            const resultado = await Empleado.updateMany(
                { Clave: Number(identificador) },
                { $set: datosActualizados }
            );

            if (resultado.matchedCount === 0) {
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }

            const empleadosActualizados = await Empleado.find({ Clave: Number(identificador) });
            return res.status(200).json(empleadosActualizados);
        } else {
            if (!mongoose.Types.ObjectId.isValid(identificador)) {
                return res.status(400).json({ error: 'Identificador no válido (debe ser Clave numérica o _id)' });
            }
            const empleadoActualizado = await Empleado.findByIdAndUpdate(
                identificador,
                { $set: datosActualizados },
                { returnDocument: 'after', runValidators: true }
            );

            if (!empleadoActualizado) {
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }

            return res.status(200).json(empleadoActualizado);
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/empleados/:identificador', requireDB, async (req, res) => {
    try {
        const { identificador } = req.params;
        const esClave = !isNaN(identificador);

        if (esClave) {
            const empleadosAEliminar = await Empleado.find({ Clave: Number(identificador) });
            if (!empleadosAEliminar || empleadosAEliminar.length === 0) {
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }

            await Empleado.deleteMany({ Clave: Number(identificador) });
            return res.status(200).json({
                mensaje: `Se eliminaron ${empleadosAEliminar.length} empleado(s) con Clave ${identificador}`,
                empleados: empleadosAEliminar
            });
        } else {
            if (!mongoose.Types.ObjectId.isValid(identificador)) {
                return res.status(400).json({ error: 'Identificador no válido (debe ser Clave numérica o _id)' });
            }
            const empleadoEliminado = await Empleado.findByIdAndDelete(identificador);
            if (!empleadoEliminado) {
                return res.status(404).json({ error: 'Empleado no encontrado' });
            }

            return res.status(200).json({
                mensaje: 'Empleado eliminado',
                empleado: empleadoEliminado
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' || require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor en http://localhost:${PORT}`);
    });
}

module.exports = app;