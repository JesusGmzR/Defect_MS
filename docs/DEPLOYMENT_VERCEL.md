# Guía de Deployment en Vercel

## Problema Resuelto
El error "No se pudo conectar con el servidor" ocurría porque el frontend intentaba conectarse a `http://localhost:3000/api` en lugar de la URL de producción de Vercel.

## Cambios Realizados

### 1. URL Dinámica en login.js
```javascript
// Antes:
const API_BASE_URL = 'http://localhost:3000/api';

// Ahora:
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : `${window.location.origin}/api`;
```

### 2. Configuración de Vercel (vercel.json)
Se creó `vercel.json` para configurar el routing entre frontend y backend:
- El backend (Node.js) se despliega como serverless function
- Todas las rutas `/api/*` se enrutan al backend
- Los archivos estáticos (HTML, CSS, JS) se sirven desde `/public`

### 3. URLs Relativas en Otros Archivos
Los archivos `capture-app.js` y `app.js` ya usaban URLs relativas (`/api/defectos`), por lo que funcionan correctamente.

## Pasos para Deployment en Vercel

### 1. Configurar Variables de Entorno en Vercel
Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

```
DB_HOST=up-de-fra1-mysql-1.db.run-on-seenode.com
DB_PORT=11550
DB_USER=db_rrpq0erbdujn
DB_PASSWORD=5fUNbSRcPP3LN9K2I33Pr0ge
DB_NAME=db_rrpq0erbdujn
JWT_SECRET=defect_ms_jwt_secret_key_2025_change_in_production
PORT=3000
NODE_ENV=production
```

**IMPORTANTE**: Asegúrate de agregar estas variables para **Production**, **Preview** y **Development**.

### 2. Commit y Push de los Cambios
```bash
git add vercel.json public/js/login.js
git commit -m "fix: configurar URLs dinámicas para Vercel"
git push origin main
```

### 3. Vercel Redesplegará Automáticamente
Vercel detectará los cambios en tu repositorio y redesplegará automáticamente.

### 4. Verificar el Deployment
Una vez completado:
1. Abre tu app en el móvil: `https://defect-ms.vercel.app`
2. Intenta hacer login con las credenciales de prueba:
   - Usuario: `admin`
   - Contraseña: `admin123`

## Estructura de Archivos Importantes

```
Defect_MS/
├── vercel.json              # Configuración de routing para Vercel
├── server/
│   └── server.js           # Backend (se convierte en serverless function)
├── public/
│   ├── index.html          # Login/Hub
│   ├── capture.html        # Captura de defectos
│   └── js/
│       ├── login.js        # ✅ Actualizado con URL dinámica
│       ├── capture-app.js  # ✅ Ya usa URLs relativas
│       └── app.js          # ✅ Ya usa URLs relativas
```

## Cómo Funciona

### En Localhost (desarrollo):
- Frontend: `http://localhost:5500` (Live Server)
- Backend: `http://localhost:3000/api`
- `login.js` detecta `hostname === 'localhost'` y usa `http://localhost:3000/api`

### En Vercel (producción):
- Frontend y Backend: `https://defect-ms.vercel.app`
- Backend serverless: `https://defect-ms.vercel.app/api`
- `login.js` detecta que NO es localhost y usa `${window.location.origin}/api`

## Troubleshooting

### Si sigue sin funcionar:
1. Verifica que las variables de entorno estén configuradas en Vercel
2. Revisa los logs en Vercel Dashboard → Deployment → Functions
3. Abre la consola del navegador móvil para ver errores específicos
4. Verifica que la base de datos MySQL esté accesible desde Vercel

### Para ver logs en tiempo real:
```bash
vercel logs --follow
```

### Para desplegar manualmente desde CLI:
```bash
npm install -g vercel
vercel --prod
```

## Usuarios de Prueba

Una vez desplegado, puedes hacer login con cualquiera de estos usuarios:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Admin |
| inspector_lqc | test123 | Inspector_LQC |
| inspector_oqc | test123 | Inspector_OQC |
| tecnico | test123 | Tecnico_Reparacion |
| inspector_qa | test123 | Inspector_QA |

## Próximos Pasos

1. ✅ Configurar variables de entorno en Vercel
2. ✅ Push de cambios a GitHub
3. ✅ Verificar deployment automático
4. ✅ Probar login desde móvil
5. ⏳ Agregar dominio personalizado (opcional)
6. ⏳ Configurar SSL/HTTPS (Vercel lo hace automáticamente)
