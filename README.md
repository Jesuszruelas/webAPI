# API REST - Coleccion Empleados

Servicio API REST desarrollado con Node.js y Express, conectado a una base de datos No Relacional en MongoDB Atlas y desplegado en la nube con Vercel.

## Informacion del Hosting

- Hosting: Vercel (Arquitectura Serverless)
- URL Base de Produccion: https://miapi-pi.vercel.app
- Endpoint Principal: https://miapi-pi.vercel.app/api/empleados
- Ruta Alternativa Directa: https://miapi-pi.vercel.app/Empleados
- Repositorio Oficial: https://github.com/Jesuszruelas/webAPI

## Base de Datos y Coleccion

- Motor de Base de Datos: MongoDB Atlas (Cluster Cloud)
- Base de Datos: miBD
- Coleccion: Empleados

## Esquema NoSQL Flexible

Al utilizar una base de datos No Relacional orientada a documentos, el esquema es flexible y los campos son opcionales:

- Clave: Numerica (opcional)
- Nombre: Texto (opcional)
- direccion: Texto (opcional, alias direccion o dirección)
- fechadenacimiento: BSON Date (opcional, formato YYYY-MM-DD)
- sexo: Numerico o Texto (opcional)
- tipodesangre: Texto (opcional)

## Endpoints REST Disponibles

- GET /api/empleados : Listar todos los empleados
- GET /api/empleados/:clave : Consultar un empleado por Clave o _id
- POST /api/empleados : Registrar un nuevo empleado
- PUT /api/empleados/:clave : Actualizar los datos de un empleado
- DELETE /api/empleados/:clave : Eliminar un empleado por su Clave o _id

## Ejemplos para Pruebas en Postman

Header requerido:
Content-Type: application/json

### 1. Registrar Empleado (POST)
URL: https://miapi-pi.vercel.app/api/empleados

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

Respuesta (201 Created):
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

### 2. Consultar Todos los Empleados (GET)
URL: https://miapi-pi.vercel.app/api/empleados

### 3. Consultar Empleado por Clave (GET)
URL: https://miapi-pi.vercel.app/api/empleados/101

### 4. Actualizar Empleado (PUT)
URL: https://miapi-pi.vercel.app/api/empleados/101

Cuerpo (Body raw JSON):
```json
{
  "Nombre": "Carlos Mendoza Lopez (Actualizado)",
  "direccion": "Blvd. Paseo de los Heroes #1200",
  "tipodesangre": "O-"
}
```

### 5. Eliminar Empleado (DELETE)
URL: https://miapi-pi.vercel.app/api/empleados/101

## Ejecucion en Entorno Local

1. Instalar dependencias del proyecto:
```bash
npm install
```

2. Configurar variables de entorno en el archivo .env:
```env
PORT=3000
MONGO_URI=mongodb+srv://<usuario>:<password>@cluster0.egshq4p.mongodb.net/miBD?retryWrites=true&w=majority
```

3. Iniciar el servidor local:
```bash
npm start
```

Servidor en ejecucion: http://localhost:3000

## Archivos de Entrega Incluidos

- Servicio_API_Empleados_MongoDB_Atlas.pdf : Reporte formal con portada, enlaces, arquitectura y codigo fuente.
- Empleados_API.postman_collection.json : Coleccion preconfigurada lista para importar en Postman.
