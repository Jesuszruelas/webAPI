require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// ==========================================
// Conexión reutilizable a MongoDB Atlas (Serverless-friendly)
// ==========================================
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('La variable de entorno MONGO_URI no está configurada.');
    }

    cachedDb = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Conectado exitosamente a MongoDB Atlas');
    return cachedDb;
}

// ==========================================
// Esquema y Modelo para la colección "Empleados"
// ==========================================
const empleadoSchema = new mongoose.Schema({
    Clave: {
        type: Number,
        required: [true, 'El campo Clave (numérica) es obligatorio'],
        unique: true
    },
    Nombre: {
        type: String,
        required: [true, 'El campo Nombre (texto) es obligatorio'],
        trim: true
    },
    dirección: {
        type: String,
        required: [true, 'El campo dirección (texto) es obligatorio'],
        trim: true,
        alias: 'direccion'
    },
    fechadenacimiento: {
        type: Date,
        required: [true, 'El campo fechadenacimiento (BSON Date) es obligatorio']
    },
    sexo: {
        type: mongoose.Schema.Types.Mixed, // Permite numérico o texto
        required: [true, 'El campo sexo (numérico o texto) es obligatorio']
    },
    tipodesangre: {
        type: String,
        required: [true, 'El campo tipodesangre (texto) es obligatorio'],
        trim: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Forzar el nombre de la colección en MongoDB Atlas como "Empleados"
const Empleado = mongoose.models.Empleado || mongoose.model('Empleado', empleadoSchema, 'Empleados');

// Helper para normalizar el cuerpo de la petición
function normalizarDatosEmpleado(data) {
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
    if (data.fechadenacimiento !== undefined || data.fechaDeNacimiento !== undefined || data.fecha_nacimiento !== undefined) {
        const rawDate = data.fechadenacimiento || data.fechaDeNacimiento || data.fecha_nacimiento;
        normalizado.fechadenacimiento = new Date(rawDate);
    }
    if (data.sexo !== undefined || data.Sexo !== undefined) {
        normalizado.sexo = data.sexo !== undefined ? data.sexo : data.Sexo;
    }
    if (data.tipodesangre !== undefined || data.tipoDeSangre !== undefined || data.tipo_sangre !== undefined) {
        normalizado.tipodesangre = String(data.tipodesangre || data.tipoDeSangre || data.tipo_sangre).trim();
    }

    return normalizado;
}

// ==========================================
// Rutas de Documentación y Estado de la API
// ==========================================
app.get('/', (req, res) => {
    res.status(200).json({
        servicio: 'API REST MongoDB Atlas - Colección Empleados',
        hosting: 'Vercel Serverless Functions',
        estado: 'En línea',
        base_de_datos: {
            motor: 'MongoDB Atlas',
            coleccion: 'Empleados'
        },
        endpoints_disponibles: {
            'GET /api/empleados': 'Consultar todos los empleados',
            'GET /api/empleados/:identificador': 'Consultar un empleado por Clave o _id',
            'POST /api/empleados': 'Registrar un nuevo empleado',
            'PUT /api/empleados/:identificador': 'Actualizar datos de un empleado por Clave o _id',
            'DELETE /api/empleados/:identificador': 'Eliminar un empleado por Clave o _id',
            'GET /api/status': 'Verificar estado de conexión con MongoDB Atlas'
        },
        ejemplo_payload_post: {
            Clave: 101,
            Nombre: "Carlos Mendoza López",
            dirección: "Av. Revolución 123, Col. Centro",
            fechadenacimiento: "1992-05-14",
            sexo: "M",
            tipodesangre: "O+"
        }
    });
});

app.get('/api', (req, res) => {
    res.status(200).json({
        servicio: 'API Empleados MongoDB Atlas',
        version: '1.0.0',
        estado: 'Operativo',
        hosting: 'Vercel'
    });
});

app.get('/api/status', async (req, res) => {
    try {
        await connectToDatabase();
        res.status(200).json({
            estado_api: 'OK',
            mongo_atlas: 'Conectado exitosamente',
            readyState: mongoose.connection.readyState
        });
    } catch (error) {
        res.status(500).json({
            estado_api: 'Parcial',
            mongo_atlas: 'Error de conexión',
            mensaje: error.message,
            sugerencia: 'Asegúrate de tener configurada la IP 0.0.0.0/0 en Network Access de MongoDB Atlas.'
        });
    }
});

// Middleware que asegura la conexión a la base de datos para las rutas de /api/empleados
const requireDB = async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('❌ Error conectando a MongoDB Atlas:', error.message);
        res.status(500).json({
            error: 'Error al conectar con la base de datos MongoDB Atlas',
            detalle: error.message,
            sugerencia: 'Verifica que en MongoDB Atlas -> Network Access esté permitida la IP 0.0.0.0/0 (Acceso desde cualquier lugar).'
        });
    }
};

// ==========================================
// OPERACIONES CRUD (REST) PARA "EMPLEADOS"
// ==========================================

// 1. GET: Obtener todos los empleados
app.get('/api/empleados', requireDB, async (req, res) => {
    try {
        const empleados = await Empleado.find().sort({ Clave: 1 });
        res.status(200).json({
            total: empleados.length,
            datos: empleados
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error al consultar empleados',
            mensaje: error.message
        });
    }
});

// 2. GET: Obtener un empleado por Clave o _id
app.get('/api/empleados/:identificador', requireDB, async (req, res) => {
    try {
        const { identificador } = req.params;
        let filtro = {};

        if (!isNaN(identificador)) {
            filtro = { Clave: Number(identificador) };
        } else if (mongoose.Types.ObjectId.isValid(identificador)) {
            filtro = { _id: identificador };
        } else {
            return res.status(400).json({
                error: 'Identificador no válido. Debe ser la Clave numérica o el ObjectId de MongoDB.'
            });
        }

        const empleado = await Empleado.findOne(filtro);
        if (!empleado) {
            return res.status(404).json({
                error: `Empleado con identificador ${identificador} no fue encontrado.`
            });
        }

        res.status(200).json(empleado);
    } catch (error) {
        res.status(500).json({
            error: 'Error al buscar el empleado',
            mensaje: error.message
        });
    }
});

// 3. POST: Crear / Registrar un nuevo empleado
app.post('/api/empleados', requireDB, async (req, res) => {
    try {
        const datos = normalizarDatosEmpleado(req.body);

        // Validación de campos obligatorios
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
            return res.status(400).json({ error: 'El campo fechadenacimiento es obligatorio y debe ser una fecha válida (ej: "1990-05-20").' });
        }
        if (datos.sexo === undefined || datos.sexo === null || datos.sexo === '') {
            return res.status(400).json({ error: 'El campo sexo es obligatorio (puede ser numérico o texto).' });
        }
        if (!datos.tipodesangre) {
            return res.status(400).json({ error: 'El campo tipodesangre es obligatorio (ej: "O+", "A-").' });
        }

        // Verificar si la Clave ya existe
        const existente = await Empleado.findOne({ Clave: datos.Clave });
        if (existente) {
            return res.status(409).json({
                error: `Ya existe un empleado registrado con la Clave ${datos.Clave}.`
            });
        }

        const nuevoEmpleado = new Empleado(datos);
        const guardado = await nuevoEmpleado.save();

        res.status(201).json({
            mensaje: 'Empleado registrado exitosamente',
            empleado: guardado
        });
    } catch (error) {
        res.status(400).json({
            error: 'Error al crear el empleado',
            mensaje: error.message
        });
    }
});

// 4. PUT: Actualizar un empleado existente por Clave o _id
app.put('/api/empleados/:identificador', requireDB, async (req, res) => {
    try {
        const { identificador } = req.params;
        let filtro = {};

        if (!isNaN(identificador)) {
            filtro = { Clave: Number(identificador) };
        } else if (mongoose.Types.ObjectId.isValid(identificador)) {
            filtro = { _id: identificador };
        } else {
            return res.status(400).json({
                error: 'Identificador no válido. Debe ser la Clave numérica o el ObjectId de MongoDB.'
            });
        }

        const datosActualizados = normalizarDatosEmpleado(req.body);

        // Si se intenta modificar la Clave, validar que no choque con otra existente
        if (datosActualizados.Clave !== undefined) {
            const choque = await Empleado.findOne({
                Clave: datosActualizados.Clave,
                ...((filtro._id) ? { _id: { $ne: filtro._id } } : { Clave: { $ne: filtro.Clave } })
            });
            if (choque) {
                return res.status(409).json({
                    error: `La Clave ${datosActualizados.Clave} ya está asignada a otro empleado.`
                });
            }
        }

        const empleadoActualizado = await Empleado.findOneAndUpdate(
            filtro,
            { $set: datosActualizados },
            { returnDocument: 'after', runValidators: true }
        );

        if (!empleadoActualizado) {
            return res.status(404).json({
                error: `No se encontró ningún empleado con identificador ${identificador} para actualizar.`
            });
        }

        res.status(200).json({
            mensaje: 'Empleado actualizado exitosamente',
            empleado: empleadoActualizado
        });
    } catch (error) {
        res.status(400).json({
            error: 'Error al actualizar el empleado',
            mensaje: error.message
        });
    }
});

// 5. DELETE: Eliminar un empleado por Clave o _id
app.delete('/api/empleados/:identificador', requireDB, async (req, res) => {
    try {
        const { identificador } = req.params;
        let filtro = {};

        if (!isNaN(identificador)) {
            filtro = { Clave: Number(identificador) };
        } else if (mongoose.Types.ObjectId.isValid(identificador)) {
            filtro = { _id: identificador };
        } else {
            return res.status(400).json({
                error: 'Identificador no válido. Debe ser la Clave numérica o el ObjectId de MongoDB.'
            });
        }

        const empleadoEliminado = await Empleado.findOneAndDelete(filtro);

        if (!empleadoEliminado) {
            return res.status(404).json({
                error: `No se encontró ningún empleado con identificador ${identificador} para eliminar.`
            });
        }

        res.status(200).json({
            mensaje: 'Empleado eliminado exitosamente de la colección Empleados',
            empleado: empleadoEliminado
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error al eliminar el empleado',
            mensaje: error.message
        });
    }
});

// ==========================================
// Iniciar servidor local o exportar para Vercel Serverless
// ==========================================
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production' || require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo localmente en http://localhost:${PORT}`);
    });
}

module.exports = app;