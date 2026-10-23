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
        type: Number,
        required: [true, 'El campo Clave es obligatorio']
    },
    Nombre: {
        type: String,
        required: [true, 'El campo Nombre es obligatorio'],
        trim: true
    },
    dirección: {
        type: String,
        required: [true, 'El campo dirección es obligatorio'],
        trim: true,
        alias: 'direccion'
    },
    fechadenacimiento: {
        type: Date,
        required: [true, 'El campo fechadenacimiento es obligatorio']
    },
    sexo: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'El campo sexo es obligatorio']
    },
    tipodesangre: {
        type: String,
        required: [true, 'El campo tipodesangre es obligatorio'],
        trim: true
    }
}, {
    timestamps: true,
    versionKey: false
});

const Empleado = mongoose.models.Empleado || mongoose.model('Empleado', empleadoSchema, 'Empleados');

function normalizarEmpleado(data) {
    const normalizado = {};
    if (data.Clave !== undefined || data.clave !== undefined) {
        normalizado.Clave = Number(data.Clave !== undefined ? data.Clave : data.clave);
    }
    if (data.Nombre !== undefined || data.nombre !== undefined) {
        normalizado.Nombre = String(data.Nombre !== undefined ? data.Nombre : data.nombre).trim();
    }
    if (data.dirección !== undefined || data.direccion !== undefined) {
        normalizado.dirección = String(data.dirección !== undefined ? data.dirección : data.direccion).trim();
    }
    if (data.fechadenacimiento || data.fechaDeNacimiento || data.fecha_nacimiento) {
        normalizado.fechadenacimiento = new Date(data.fechadenacimiento || data.fechaDeNacimiento || data.fecha_nacimiento);
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
        const filtro = !isNaN(identificador) ? { Clave: Number(identificador) } : { _id: identificador };
        const empleado = await Empleado.findOne(filtro);
        if (!empleado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        res.status(200).json(empleado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/empleados', requireDB, async (req, res) => {
    try {
        const datos = normalizarEmpleado(req.body);

        if (datos.Clave === undefined || isNaN(datos.Clave)) {
            return res.status(400).json({ error: 'El campo Clave es obligatorio y debe ser numérico.' });
        }
        if (!datos.Nombre) {
            return res.status(400).json({ error: 'El campo Nombre es obligatorio.' });
        }
        if (!datos.dirección) {
            return res.status(400).json({ error: 'El campo dirección es obligatorio.' });
        }
        if (!datos.fechadenacimiento || isNaN(datos.fechadenacimiento.getTime())) {
            return res.status(400).json({ error: 'El campo fechadenacimiento es obligatorio y debe ser una fecha válida.' });
        }
        if (datos.sexo === undefined || datos.sexo === null || datos.sexo === '') {
            return res.status(400).json({ error: 'El campo sexo es obligatorio.' });
        }
        if (!datos.tipodesangre) {
            return res.status(400).json({ error: 'El campo tipodesangre es obligatorio.' });
        }

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
        const filtro = !isNaN(identificador) ? { Clave: Number(identificador) } : { _id: identificador };
        const datosActualizados = normalizarEmpleado(req.body);

        const empleadoActualizado = await Empleado.findOneAndUpdate(
            filtro,
            { $set: datosActualizados },
            { returnDocument: 'after', runValidators: true }
        );

        if (!empleadoActualizado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        res.status(200).json(empleadoActualizado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/empleados/:identificador', requireDB, async (req, res) => {
    try {
        const { identificador } = req.params;
        const filtro = !isNaN(identificador) ? { Clave: Number(identificador) } : { _id: identificador };

        const empleadoEliminado = await Empleado.findOneAndDelete(filtro);
        if (!empleadoEliminado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        res.status(200).json({
            mensaje: 'Empleado eliminado',
            empleado: empleadoEliminado
        });
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