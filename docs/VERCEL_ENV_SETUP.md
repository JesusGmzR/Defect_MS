# Configuración de Variables de Entorno en Vercel

## 🚨 IMPORTANTE: Configura TODAS estas variables en Vercel

### Pasos:
1. Ve a tu proyecto en Vercel Dashboard
2. Clic en **Settings** → **Environment Variables**
3. Agrega cada una de las siguientes variables
4. **Marca las 3 opciones**: Production, Preview, Development
5. Después de agregar todas, haz **Redeploy** del proyecto

---

## 📋 Variables a Configurar:

### Configuración de la Base de Datos MySQL (SeeNode)

```
DB_HOST=up-de-fra1-mysql-1.db.run-on-seenode.com
DB_PORT=11550
DB_USER=db_rrpq0erbdujn
DB_PASSWORD=5fUNbSRcPP3LN9K2I33Pr0ge
DB_NAME=db_rrpq0erbdujn
```

**Nota:** El usuario y el nombre de la base de datos son iguales.

### Configuración JWT

```
JWT_SECRET=defect_ms_jwt_secret_key_2025_change_in_production
JWT_EXPIRES_IN=24h
```

### Configuración del Servidor

```
NODE_ENV=production
PORT=3000
```

---

## ✅ Verificación

Después de configurar las variables:

1. **Redeploy**: Ve a Deployments → último deployment → ⋯ → Redeploy
2. **Espera** a que termine el deployment (1-2 minutos)
3. **Prueba el login** con:
   - Usuario: `admin`
   - Contraseña: `admin123`

---

## 🔍 Ver logs en tiempo real

Para debugging, ejecuta en tu terminal local:

```bash
npm install -g vercel
vercel login
vercel logs --follow
```

---

## 📊 Estado Actual de Variables

Según los logs, actualmente Vercel está usando:
- ❌ DB_HOST: ✅ correcto
- ❌ DB_PORT: ✅ correcto  
- ❌ DB_USER: **INCORRECTO** (muestra el DB_NAME en su lugar)
- ❌ DB_PASSWORD: No visible en logs
- ❌ DB_NAME: No visible en logs

**Esto indica que las variables de entorno NO están configuradas correctamente en Vercel.**

---

## 🆘 Si sigue fallando

1. Verifica que las variables estén marcadas para **Production**
2. Borra todas las variables y agrégalas de nuevo
3. Haz un **Redeploy completo** (no solo rebuild)
4. Contacta al soporte de Vercel si persiste el error
