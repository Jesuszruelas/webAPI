# 🚀 Servicio API REST - MongoDB Atlas & Vercel
### Colección: `Empleados` (Base de Datos No Relacional)

API REST desarrollada con **Node.js** y **Express**, conectada a **MongoDB Atlas** y desplegada en la nube a través de **Vercel** como funciones Serverless.

---

## 🌐 Enlaces del Proyecto en Producción

* **Hosting:** Vercel (Serverless Functions)
* **URL Base de Producción:** [https://miapi-pi.vercel.app](https://miapi-pi.vercel.app)
* **Endpoint Principal de Empleados:** [https://miapi-pi.vercel.app/api/empleados](https://miapi-pi.vercel.app/api/empleados)
* **Repositorio en GitHub:** [https://github.com/Jesuszruelas/webAPI](https://github.com/Jesuszruelas/webAPI)

---

## 🗄️ Estructura del Documento ("Empleados")

Colección alojada en MongoDB Atlas: **`Empleados`**

| Campo | Tipo Solicitado | Tipo en MongoDB | Descripción |
| :--- | :--- | :--- | :--- |
| **`Clave`** | Numérica | `Number` | Identificador único del empleado. |
| **`Nombre`** | Texto | `String` | Nombre completo del empleado. |
| **`dirección`** | Texto | `String` | Domicilio o dirección residencial. |
| **`fechadenacimiento`** | BSON Date | `Date` (ISODate) | Fecha de nacimiento almacenada en formato BSON Date. |
| **`sexo`** | Numérico o Texto | `Mixed` (String/Number) | Admite texto (`"M"`, `"F"`, `"Masculino"`) o número (`1`, `2`). |
| **`tipodesangre`** | Texto | `String` | Grupo sanguíneo y factor Rh (`"O+"`, `"A+"`, etc.). |

---

## 📡 Endpoints REST y Pruebas con Postman

| Método | Endpoint | Descripción |
| :---: | :--- | :--- |
| `GET` | `/` | Verifica el estado del servicio y documentación. |
| `GET` | `/api/empleados` | Obtiene la lista de todos los empleados. |
| `GET` | `/api/empleados/:clave` | Obtiene un empleado por su Clave numérica o _id. |
| `POST` | `/api/empleados` | Registra un nuevo empleado en MongoDB Atlas. |
| `PUT` | `/api/empleados/:clave` | Actualiza los datos de un empleado por su Clave. |
| `DELETE` | `/api/empleados/:clave` | Elimina un empleado por su Clave. |

---

## 📝 Ejemplos de RAW JSON para Postman

Header requerido: `Content-Type: application/json`

### 1. POST — Registrar Empleado
* **URL:** `https://miapi-pi.vercel.app/api/empleados`
* **Body (raw JSON):**
```json
{
  "Clave": 101,
  "Nombre": "Carlos Mendoza López",
  "dirección": "Av. Revolución #450, Col. Centro",
  "fechadenacimiento": "1992-05-14",
  "sexo": "M",
  "tipodesangre": "O+"
}
```

### 2. GET — Listar Empleados
* **URL:** `https://miapi-pi.vercel.app/api/empleados`

### 3. GET — Obtener por Clave
* **URL:** `https://miapi-pi.vercel.app/api/empleados/101`

### 4. PUT — Actualizar Empleado
* **URL:** `https://miapi-pi.vercel.app/api/empleados/101`
* **Body (raw JSON):**
```json
{
  "Nombre": "Carlos Mendoza López (Actualizado)",
  "dirección": "Blvd. Paseo de los Héroes #1200, Zona Río",
  "tipodesangre": "O-"
}
```

### 5. DELETE — Eliminar Empleado
* **URL:** `https://miapi-pi.vercel.app/api/empleados/101`

---

## 🛠️ Ejecución Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Jesuszruelas/webAPI.git
   cd webAPI
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   Copiar `.env.example` a `.env` y configurar la cadena de conexión de MongoDB Atlas:
   ```env
   PORT=3000
   MONGO_URI=mongodb+srv://<usuario>:<password>@cluster0.egshq4p.mongodb.net/miBD?retryWrites=true&w=majority
   ```
4. Iniciar el servidor local:
   ```bash
   npm start
   ```
   Servidor disponible en: `http://localhost:3000`

---

## 📄 Archivos Entregables Incluidos

* **`Servicio_API_Empleados_MongoDB_Atlas.pdf`**: Documento formal de entrega con portada institucional, enlaces en la nube, especificación de endpoints y código fuente.
* **`Empleados_API.postman_collection.json`**: Colección preconfigurada para importar directamente en Postman.
