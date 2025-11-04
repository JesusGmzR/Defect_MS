# 📚 API Documentation - Defect Management System

## 🔐 Autenticación

### POST `/api/auth/login`
Iniciar sesión en el sistema.

**Request:**
```json
{
  "username": "admin",
  "password": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "nombre_completo": "Administrador Sistema",
    "rol": "Admin",
    "area": null
  }
}
```

### GET `/api/auth/verify`
Verificar si un token es válido.

**Headers:**
```
Authorization: Bearer <token>
```

### POST `/api/auth/change-password`
Cambiar contraseña del usuario actual.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "currentPassword": "12345",
  "newPassword": "nueva_password_segura"
}
```

### GET `/api/auth/profile`
Obtener perfil del usuario actual.

**Headers:**
```
Authorization: Bearer <token>
```

---

## 🔍 Defectos

### POST `/api/defectos`
Registrar un nuevo defecto.

**Request:**
```json
{
  "linea": "M1",
  "codigo": "EBR874637",
  "defecto": "Rayado en superficie",
  "ubicacion": "Estación 5",
  "area": "SMD",
  "modelo": "LG-MODEL-123",
  "tipo_inspeccion": "Visual",
  "etapa_deteccion": "OQC",
  "registrado_por": "María García"
}
```

**Validaciones:**
- `tipo_inspeccion`: 'ICT', 'FCT', 'Packing', 'Visual'
- `etapa_deteccion`: 'LQC', 'OQC'

### GET `/api/defectos`
Listar defectos con filtros opcionales.

**Query Parameters:**
- `fecha`: Fecha específica (YYYY-MM-DD)
- `fechaInicio`: Fecha inicio (YYYY-MM-DD)
- `fechaFin`: Fecha fin (YYYY-MM-DD)
- `linea`: Línea de producción
- `codigo`: Código del producto (búsqueda parcial)
- `defecto`: Descripción del defecto (búsqueda parcial)
- `ubicacion`: Ubicación (búsqueda parcial)
- `area`: Área responsable
- `status`: Estado del defecto
- `tipo_inspeccion`: Tipo de inspección
- `etapa_deteccion`: Etapa de detección

**Ejemplo:**
```
GET /api/defectos?status=Pendiente_Reparacion&linea=M1&fechaInicio=2025-11-01
```

### GET `/api/defectos/:id`
Obtener un defecto específico.

### PUT `/api/defectos/:id/status`
Actualizar el status de un defecto.

**Request:**
```json
{
  "status": "En_Reparacion"
}
```

**Status válidos:**
- `Pendiente_Reparacion`
- `En_Reparacion`
- `Reparado`
- `Rechazado`
- `Aprobado`

---

## 🔧 Reparaciones

**Requiere autenticación:** Todas las rutas  
**Requiere rol:** Técnico de Reparación o Admin (excepto consultas)

### GET `/api/repairs/pendientes`
Lista de defectos pendientes de reparación.

**Headers:**
```
Authorization: Bearer <token>
```

### GET `/api/repairs/en-proceso`
Lista de productos actualmente en reparación.

### POST `/api/repairs/iniciar`
Iniciar una reparación.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "defect_id": "DEF_1730734567890_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reparación iniciada correctamente",
  "repair_id": "REP_20251104151530"
}
```

### PUT `/api/repairs/:repair_id/progreso`
Actualizar el progreso de una reparación.

**Request:**
```json
{
  "accion_correctiva": "Reemplazo de componente XYZ",
  "materiales_usados": "Componente XYZ, soldadura",
  "observaciones": "Se detectó oxidación adicional"
}
```

### POST `/api/repairs/:repair_id/finalizar`
Finalizar una reparación.

**Request:**
```json
{
  "accion_correctiva": "Reemplazo completo de componente XYZ y limpieza",
  "materiales_usados": "Componente XYZ, soldadura, limpiador",
  "observaciones": "Reparación exitosa, producto listo para QA"
}
```

### GET `/api/repairs/defecto/:defect_id`
Obtener historial de reparaciones de un defecto.

### GET `/api/repairs/estadisticas/tecnicos`
Estadísticas de rendimiento por técnico.

**Query Parameters:**
- `dias`: Número de días a consultar (default: 30)

---

## ✅ Validación QA

**Requiere autenticación:** Todas las rutas  
**Requiere rol:** Inspector QA o Admin

### GET `/api/qa/pendientes`
Lista de productos reparados pendientes de validación.

**Headers:**
```
Authorization: Bearer <token>
```

### POST `/api/qa/:repair_id/aprobar`
Aprobar una reparación.

**Request:**
```json
{
  "observaciones_qa": "Reparación correcta, producto aprobado para envío"
}
```

### POST `/api/qa/:repair_id/rechazar`
Rechazar una reparación (regresa a reparación).

**Request:**
```json
{
  "observaciones_qa": "Se detectan residuos de soldadura, requiere limpieza adicional"
}
```

### GET `/api/qa/historial`
Historial de validaciones QA.

**Query Parameters:**
- `dias`: Número de días (default: 30)
- `inspector`: Filtrar por inspector específico

### GET `/api/qa/estadisticas`
Estadísticas de validación QA.

**Query Parameters:**
- `dias`: Número de días (default: 30)

---

## 📦 Modelo

### GET `/api/modelo`
Buscar modelo por código.

**Query Parameters:**
- `codigo`: Código del producto (mínimo 9 caracteres)

**Ejemplo:**
```
GET /api/modelo?codigo=EBR874637
```

---

## 🎭 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Inspector_LQC** | Registrar defectos en línea, consultar defectos |
| **Inspector_OQC** | Registrar defectos finales, consultar defectos |
| **Tecnico_Reparacion** | Iniciar/finalizar reparaciones, actualizar progreso |
| **Inspector_QA** | Aprobar/rechazar reparaciones, ver estadísticas QA |
| **Admin** | Todos los permisos |

---

## 🔄 Flujo de Trabajo Completo

```
1. DETECCIÓN (Inspector LQC/OQC)
   POST /api/defectos
   └─> Status: Pendiente_Reparacion

2. REPARACIÓN (Técnico)
   POST /api/repairs/iniciar
   └─> Status: En_Reparacion
   
   PUT /api/repairs/:id/progreso (opcional)
   
   POST /api/repairs/:id/finalizar
   └─> Status: Reparado

3. VALIDACIÓN QA (Inspector QA)
   POST /api/qa/:repair_id/aprobar
   └─> Status: Aprobado ✅
   
   O
   
   POST /api/qa/:repair_id/rechazar
   └─> Status: Rechazado (vuelve a reparación) ❌
```

---

## 💡 Ejemplos de Uso

### Ejemplo completo con cURL:

**1. Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"12345"}'
```

**2. Registrar defecto:**
```bash
curl -X POST http://localhost:3000/api/defectos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "linea": "M1",
    "codigo": "EBR874637",
    "defecto": "Rayado",
    "ubicacion": "Est 5",
    "area": "SMD",
    "tipo_inspeccion": "Visual",
    "etapa_deteccion": "OQC",
    "registrado_por": "Juan Pérez"
  }'
```

**3. Iniciar reparación:**
```bash
curl -X POST http://localhost:3000/api/repairs/iniciar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"defect_id":"DEF_1730734567890_abc123"}'
```

**4. Finalizar reparación:**
```bash
curl -X POST http://localhost:3000/api/repairs/REP_20251104151530/finalizar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "accion_correctiva": "Reemplazo de componente",
    "materiales_usados": "Componente XYZ",
    "observaciones": "Listo para QA"
  }'
```

**5. Aprobar en QA:**
```bash
curl -X POST http://localhost:3000/api/qa/REP_20251104151530/aprobar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"observaciones_qa":"Aprobado para envío"}'
```

---

## 🔒 Seguridad

- Todos los endpoints de modificación requieren autenticación JWT
- Los tokens expiran después de 24 horas (configurable)
- Las contraseñas se almacenan con bcrypt hash
- Validación de roles en cada endpoint sensible
- Auditoría automática de cambios de status

---

## 📊 Códigos de Estado HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: No autenticado o token inválido
- `403 Forbidden`: Sin permisos suficientes
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor
