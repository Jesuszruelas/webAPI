# API REST - Coleccion Empleados

Servicio API REST desarrollado con Node.js y Express, conectado a una base de datos No Relacional en MongoDB Atlas y desplegado en Vercel.

## Informacion del Hosting

- Hosting: Vercel (Serverless)
- URL de Produccion: https://miapi-pi.vercel.app
- Endpoint Principal: https://miapi-pi.vercel.app/api/empleados
- Repositorio: https://github.com/Jesuszruelas/webAPI

## Esquema de la Coleccion (Empleados)

Al utilizar una base de datos NoSQL (MongoDB Atlas), el esquema es flexible y los campos no son estrictamente obligatorios:

- Clave: Numerica (opcional)
- Nombre: Texto (opcional)
- direccion: Texto (opcional)
- fechadenacimiento: BSON Date (opcional, formato YYYY-MM-DD)
- sexo: Numerico o Texto (opcional)
- tipodesangre: Texto (opcional)

## Endpoints Disponibles

- GET /api/empleados : Obtener todos los empleados
- GET /api/empleados/:clave : Obtener un empleado por su Clave o _id
- POST /api/empleados : Registrar un nuevo empleado
- PUT /api/empleados/:clave : Actualizar los datos de un empleado
- DELETE /api/empleados/:clave : Eliminar un empleado

## Ejemplo de Uso (Postman)

### Peticion POST a /api/empleados

Header:
`Content-Type: application/json`

Cuerpo (Body raw JSON):
```json
{
  "Clave": 101,
  "Nombre": "Carlos Mendoza Lopez",
  "direccion": "Av. Revolucion 123, Col. Centro",
  "fechadenacimiento": "1992-05-14",
  "sexo": "M",
  "tipodesangre": "O+"
}
```

### Respuesta esperada (201 Created)
```json
{
  "_id": "6adaadd6af9d40e140a41468",
  "Clave": 101,
  "Nombre": "Carlos Mendoza Lopez",
  "direccion": "Av. Revolucion 123, Col. Centro",
  "fechadenacimiento": "1992-05-14T00:00:00.000Z",
  "sexo": "M",
  "tipodesangre": "O+",
  "createdAt": "2026-10-23T00:44:06.600Z",
  "updatedAt": "2026-10-23T00:44:06.600Z"
}
```

## Ejecucion Local

1. Instalar dependencias:
```bash
npm install
```

2. Configurar la conexion en el archivo .env:
```env
PORT=3000
MONGO_URI=mongodb+srv://<usuario>:<password>@cluster0.egshq4p.mongodb.net/miBD?retryWrites=true&w=majority
```

3. Iniciar el servicio:
```bash
npm start
```

Servidor corriendo en: http://localhost:3000
