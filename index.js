require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Formateo estético automático para todas las respuestas JSON (2 espacios de indentación)
app.set('json spaces', 2);

// Middlewares globales
app.use(cors());
app.use(express.json());

// Normalizar URLs (elimina dos puntos ':' accidentales al final de la URL si se pegan desde la documentación)
app.use((req, res, next) => {
    if (req.url.endsWith(':')) {
        req.url = req.url.slice(0, -1);
    }
    next();
});

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
// Plantilla HTML Estilizada para el Navegador
// ==========================================
function generarDashboardHTML(datos) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API REST MongoDB Atlas • Empleados</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #0a0f1d;
            --bg-card: rgba(17, 24, 39, 0.75);
            --border-color: rgba(255, 255, 255, 0.08);
            --accent-blue: #38bdf8;
            --accent-cyan: #06b6d4;
            --accent-green: #10b981;
            --accent-purple: #818cf8;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-main);
            min-height: 100vh;
            padding: 2.5rem 1.5rem;
            background-image: 
                radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.12) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(129, 140, 248, 0.12) 0px, transparent 50%);
            background-attachment: fixed;
        }

        .container {
            max-width: 960px;
            margin: 0 auto;
        }

        /* Header */
        header {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 2rem;
        }

        .badge-status {
            align-self: flex-start;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(16, 185, 129, 0.12);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 0.4rem 1rem;
            border-radius: 9999px;
            font-size: 0.825rem;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .pulse-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #34d399;
            box-shadow: 0 0 10px #34d399;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.85); }
        }

        h1 {
            font-size: 2.25rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #38bdf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1.2;
        }

        .subtitle {
            color: var(--text-muted);
            font-size: 1.05rem;
            line-height: 1.6;
        }

        /* Tech Pills */
        .tech-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }

        .tech-pill {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border-color);
            padding: 0.25rem 0.75rem;
            border-radius: 6px;
            font-size: 0.8rem;
            color: #e2e8f0;
            font-weight: 500;
        }

        /* Cards */
        .card {
            background: var(--bg-card);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-color);
            border-radius: 14px;
            padding: 1.5rem;
            margin-bottom: 1.75rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }

        .card-title {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 1.25rem;
            color: #ffffff;
        }

        .card-title span {
            font-size: 1.3rem;
        }

        /* Info Grid */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .info-box {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 8px;
            padding: 0.85rem 1rem;
        }

        .info-label {
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-bottom: 0.25rem;
        }

        .info-val {
            font-size: 0.95rem;
            font-weight: 600;
            color: #f1f5f9;
        }

        /* Endpoints Table */
        .endpoint-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 8px;
            padding: 0.85rem 1rem;
            margin-bottom: 0.65rem;
            transition: all 0.2s ease;
        }

        .endpoint-row:hover {
            border-color: rgba(56, 189, 248, 0.3);
            background: rgba(56, 189, 248, 0.04);
        }

        .endpoint-left {
            display: flex;
            align-items: center;
            gap: 0.85rem;
            overflow: hidden;
        }

        .method-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.25rem 0.6rem;
            border-radius: 4px;
            text-align: center;
            min-width: 62px;
        }

        .badge-get { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-post { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
        .badge-put { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-delete { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

        .endpoint-path {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9rem;
            color: #f1f5f9;
            font-weight: 500;
        }

        .endpoint-desc {
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-left: 0.5rem;
        }

        .btn-try {
            background: rgba(56, 189, 248, 0.15);
            color: #38bdf8;
            border: 1px solid rgba(56, 189, 248, 0.3);
            padding: 0.35rem 0.85rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        .btn-try:hover {
            background: #38bdf8;
            color: #0f172a;
        }

        /* Schema Table */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }

        th {
            text-align: left;
            padding: 0.75rem 1rem;
            color: var(--text-muted);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid var(--border-color);
        }

        td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            color: #cbd5e1;
        }

        tr:last-child td {
            border-bottom: none;
        }

        .type-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8rem;
            background: rgba(255, 255, 255, 0.05);
            padding: 0.15rem 0.5rem;
            border-radius: 4px;
            color: #38bdf8;
        }

        /* Code Block */
        .code-wrapper {
            position: relative;
            margin-top: 0.5rem;
        }

        pre {
            background: #050811;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 1.25rem;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            color: #a5f3fc;
            overflow-x: auto;
            line-height: 1.5;
        }

        .btn-copy {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #f1f5f9;
            padding: 0.35rem 0.75rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-copy:hover {
            background: rgba(255, 255, 255, 0.18);
        }

        /* Actions Bar */
        .actions-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-top: 1.5rem;
        }

        .action-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid var(--border-color);
            color: #ffffff;
            padding: 0.65rem 1.25rem;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
        }

        .action-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.25);
            transform: translateY(-1px);
        }

        .action-btn.primary {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            border-color: #38bdf8;
            color: #ffffff;
        }

        .action-btn.primary:hover {
            background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
        }

        footer {
            text-align: center;
            color: var(--text-muted);
            font-size: 0.85rem;
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border-color);
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="badge-status">
                <div class="pulse-dot"></div>
                SERVICIO ACTIVO EN VERCEL
            </div>
            <div>
                <h1>API REST MongoDB Atlas</h1>
                <p class="subtitle">Colección No Relacional <strong>"Empleados"</strong> con soporte CRUD completo (POST, GET, PUT, DELETE).</p>
            </div>
            <div class="tech-tags">
                <span class="tech-pill">⚡ Node.js 22</span>
                <span class="tech-pill">🚀 Express</span>
                <span class="tech-pill">🍃 MongoDB Atlas</span>
                <span class="tech-pill">▲ Vercel Serverless</span>
                <span class="tech-pill">📦 Mongoose ODM</span>
            </div>
        </header>

        <!-- General Info -->
        <div class="card">
            <div class="card-title">
                <span>🌐</span> Información de la Infraestructura
            </div>
            <div class="info-grid">
                <div class="info-box">
                    <div class="info-label">Proveedor Cloud</div>
                    <div class="info-val">Vercel Serverless</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Base de Datos</div>
                    <div class="info-val">MongoDB Atlas (miBD)</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Colección</div>
                    <div class="info-val">Empleados</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Desarrollador</div>
                    <div class="info-val">Jesús Zamora</div>
                </div>
            </div>

            <div class="actions-bar">
                <a href="/api/empleados" class="action-btn primary">
                    <span>📡</span> Consultar Empleados (JSON)
                </a>
                <a href="/?format=json" class="action-btn">
                    <span>📋</span> Ver Respuesta en Raw JSON
                </a>
                <a href="https://github.com/Jesuszruelas/webAPI" target="_blank" class="action-btn">
                    <span>🐙</span> Ver en GitHub
                </a>
            </div>
        </div>

        <!-- Endpoints List -->
        <div class="card">
            <div class="card-title">
                <span>📡</span> Catálogo de Endpoints REST
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method-badge badge-get">GET</span>
                    <span class="endpoint-path">/api/empleados</span>
                    <span class="endpoint-desc">Listar todos los empleados registrados</span>
                </div>
                <a href="/api/empleados" class="btn-try" target="_blank">Ejecutar ↗</a>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method-badge badge-get">GET</span>
                    <span class="endpoint-path">/api/empleados/:clave</span>
                    <span class="endpoint-desc">Buscar empleado por Clave numérica o _id</span>
                </div>
                <a href="/api/empleados/101" class="btn-try" target="_blank">Ejecutar ↗</a>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method-badge badge-post">POST</span>
                    <span class="endpoint-path">/api/empleados</span>
                    <span class="endpoint-desc">Insertar nuevo empleado en MongoDB Atlas</span>
                </div>
                <span class="endpoint-desc" style="color: #64748b; font-size: 0.75rem;">Vía Postman</span>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method-badge badge-put">PUT</span>
                    <span class="endpoint-path">/api/empleados/:clave</span>
                    <span class="endpoint-desc">Actualizar información de un empleado</span>
                </div>
                <span class="endpoint-desc" style="color: #64748b; font-size: 0.75rem;">Vía Postman</span>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method-badge badge-delete">DELETE</span>
                    <span class="endpoint-path">/api/empleados/:clave</span>
                    <span class="endpoint-desc">Eliminar empleado permanentemente</span>
                </div>
                <span class="endpoint-desc" style="color: #64748b; font-size: 0.75rem;">Vía Postman</span>
            </div>

            <div class="endpoint-row">
                <div class="endpoint-left">
                    <span class="method-badge badge-get">GET</span>
                    <span class="endpoint-path">/api/status</span>
                    <span class="endpoint-desc">Verificar conexión activa con MongoDB Atlas</span>
                </div>
                <a href="/api/status" class="btn-try" target="_blank">Ejecutar ↗</a>
            </div>
        </div>

        <!-- Schema Spec -->
        <div class="card">
            <div class="card-title">
                <span>🗄️</span> Esquema de la Colección "Empleados"
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Campo</th>
                        <th>Tipo Requerido</th>
                        <th>Tipo BSON / MongoDB</th>
                        <th>Regla</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Clave</strong></td>
                        <td>Numérica</td>
                        <td><span class="type-badge">Number</span></td>
                        <td>Obligatoria y Única</td>
                    </tr>
                    <tr>
                        <td><strong>Nombre</strong></td>
                        <td>Texto</td>
                        <td><span class="type-badge">String</span></td>
                        <td>Obligatorio</td>
                    </tr>
                    <tr>
                        <td><strong>dirección</strong></td>
                        <td>Texto</td>
                        <td><span class="type-badge">String</span></td>
                        <td>Obligatorio (alias <code>direccion</code>)</td>
                    </tr>
                    <tr>
                        <td><strong>fechadenacimiento</strong></td>
                        <td>BSON Date</td>
                        <td><span class="type-badge">Date (ISODate)</span></td>
                        <td>Obligatorio (BSON Date nativo)</td>
                    </tr>
                    <tr>
                        <td><strong>sexo</strong></td>
                        <td>Numérico o Texto</td>
                        <td><span class="type-badge">Mixed (String/Number)</span></td>
                        <td>Admite "M", "F" o 1, 2</td>
                    </tr>
                    <tr>
                        <td><strong>tipodesangre</strong></td>
                        <td>Texto</td>
                        <td><span class="type-badge">String</span></td>
                        <td>Obligatorio (ej: "O+", "A+")</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Postman Payload Example -->
        <div class="card">
            <div class="card-title">
                <span>📬</span> Payload de Ejemplo RAW JSON para POSTMAN
            </div>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.75rem;">
                Copia este payload y pégalo en Postman seleccionando método <strong>POST</strong> hacia <code>https://miapi-pi.vercel.app/api/empleados</code> con Header <code>Content-Type: application/json</code>:
            </p>
            <div class="code-wrapper">
                <button class="btn-copy" onclick="copiarPayload()">Copiar JSON</button>
                <pre id="jsonPayload">{
  "Clave": 101,
  "Nombre": "Carlos Mendoza López",
  "dirección": "Av. Revolución #450, Col. Centro",
  "fechadenacimiento": "1992-05-14",
  "sexo": "M",
  "tipodesangre": "O+"
}</pre>
            </div>
        </div>

        <footer>
            <p>Servicio Web API para MongoDB Atlas • Hospedado en Vercel Cloud • 2026</p>
        </footer>
    </div>

    <script>
        function copiarPayload() {
            const codigo = document.getElementById('jsonPayload').innerText;
            navigator.clipboard.writeText(codigo).then(() => {
                const btn = document.querySelector('.btn-copy');
                btn.innerText = '¡Copiado! ✓';
                btn.style.background = '#10b981';
                setTimeout(() => {
                    btn.innerText = 'Copiar JSON';
                    btn.style.background = '';
                }, 2000);
            });
        }
    </script>
</body>
</html>`;
}

// ==========================================
// Rutas de Documentación y Estado de la API
// ==========================================
app.get('/', (req, res) => {
    const payload = {
        servicio: 'API REST MongoDB Atlas - Colección Empleados',
        hosting: 'Vercel Serverless Functions',
        estado: 'En línea',
        base_de_datos: {
            motor: 'MongoDB Atlas',
            coleccion: 'Empleados'
        },
        repositorio_github: 'https://github.com/Jesuszruelas/webAPI',
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
    };

    // Si la petición viene explícitamente pidiendo JSON o desde herramientas como Postman/curl
    if (req.query.format === 'json' || (!req.accepts('html') && req.accepts('json'))) {
        return res.status(200).json(payload);
    }

    // Para el navegador web, renderizar el portal interactivo estilizado
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(generarDashboardHTML(payload));
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