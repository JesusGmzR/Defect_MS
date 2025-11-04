# 📸 Prueba del Sistema de Cámara - Paso a Paso

## ✅ Cambios Realizados

### 1. **Botón Manual de Activación**
- Ahora la cámara NO se inicia automáticamente
- Aparece un botón "Activar Cámara" con icono
- Esto permite que el usuario controle cuándo solicitar permisos

### 2. **Mensajes de Estado Claros**
- Muestra el estado actual de la cámara
- Indicadores visuales de carga
- Mensajes de error específicos según el problema

### 3. **Manejo de Errores Mejorado**
- Detecta permisos denegados
- Detecta si no hay cámaras
- Detecta si la cámara está en uso

---

## 🧪 Pasos para Probar

### PASO 1: Abrir la Aplicación
```
http://localhost:3001
```

### PASO 2: Observar la Columna Derecha
Deberías ver:
- ✓ Mensaje: "Presiona el botón para activar la cámara..."
- ✓ Botón azul: "Activar Cámara" con icono de cámara

### PASO 3: Presionar "Activar Cámara"
Al hacer clic, verás una secuencia de mensajes:
1. "Solicitando acceso a la cámara..."
2. "Detectando cámaras disponibles..."
3. "Activando cámara (X disponibles)..."

### PASO 4: Permitir Acceso
El navegador mostrará un popup pidiendo permiso:
- **Chrome/Edge:** "¿Permitir que localhost:3001 use tu cámara?"
- **Firefox:** "¿Permitir que localhost use tu cámara?"

**IMPORTANTE:** Haz clic en **"Permitir"** o **"Allow"**

### PASO 5: Verificar que Funcione
Deberías ver:
- ✓ Vista previa de la cámara activa
- ✓ Cuadro de escaneo verde en el centro
- ✓ Tu imagen en tiempo real
- ✓ Botón "Switch Camera" (si tienes >1 cámara)
- ✓ Mensaje: "✓ Cámara activada correctamente"

---

## 🔍 Qué Verificar en la Consola (F12)

Abre la consola del navegador (`F12` → pestaña Console) y verifica:

### ✅ Mensajes de Éxito:
```
Aplicación lista. Presiona "Activar Cámara" para comenzar a escanear.
Inicializando escáner QR...
✓ Encontradas 1 cámaras: ["Integrated Camera (05ac:8514)"]
Usando cámara: Integrated Camera (05ac:8514)
✓ Escaneo QR iniciado correctamente
✓ Sistema de escaneo QR listo
```

### ❌ Posibles Errores:

#### Error 1: Permisos Denegados
```
❌ Error al inicializar escáner: NotAllowedError
```
**Solución:** 
- Recargar la página (`Ctrl+R` o `F5`)
- Volver a presionar "Activar Cámara"
- Esta vez permitir el acceso

#### Error 2: No se Encuentra Cámara
```
❌ No se encontraron cámaras en el dispositivo
```
**Solución:**
- Verificar que tu laptop/PC tenga cámara
- Verificar que esté habilitada en el sistema operativo
- Probar en otro navegador

#### Error 3: Cámara en Uso
```
❌ Error: NotReadableError
```
**Solución:**
- Cerrar otras aplicaciones que usen la cámara (Zoom, Teams, etc.)
- Recargar la página

---

## 📱 Flujo Completo de Prueba

```
1. Abrir http://localhost:3001
   ↓
2. Ver botón "Activar Cámara"
   ↓
3. Hacer clic en el botón
   ↓
4. Navegador pide permisos → PERMITIR
   ↓
5. Ver vista de cámara activa
   ↓
6. Apuntar al código QR
   ↓
7. Código detectado automáticamente
   ↓
8. Material ID aplicado al defecto
```

---

## 🎯 Qué Esperar Después

Una vez que la cámara funcione:

1. **Vista Normal:**
   - Cámara mostrando imagen en tiempo real
   - Cuadro de escaneo visible
   - Mensaje: "✓ Cámara activada - Apunta al código QR"

2. **Al Detectar un Código:**
   - Overlay verde con el código
   - Mensaje: "Material ID Detectado: EBR874637"
   - Texto: "✓ Aplicado automáticamente"
   - Defecto seleccionado en la tabla izquierda

3. **Switch Camera (si aplica):**
   - Botón circular arriba a la derecha
   - Al hacer clic, cambia entre cámaras frontal/trasera
   - Vista se actualiza con nueva cámara

---

## 🐛 Debugging

Si ves pantalla negra o no funciona:

### 1. Verificar Permisos
- Chrome: `chrome://settings/content/camera`
- Edge: `edge://settings/content/camera`
- Buscar `localhost:3001` y asegurar que esté en "Permitir"

### 2. Verificar Consola
- Presiona `F12`
- Ve a pestaña "Console"
- Busca mensajes con ❌
- Compártelos para análisis

### 3. Probar en Otro Navegador
- Si usas Chrome, prueba Edge
- Si usas Firefox, prueba Chrome
- Algunos navegadores manejan permisos diferente

### 4. Verificar Hardware
- ¿La cámara funciona en otras apps (Zoom, Teams)?
- ¿Windows/Mac reconoce la cámara?
- ¿Está la cámara habilitada en privacidad del sistema?

---

## 📋 Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] Servidor corriendo en puerto 3001
- [ ] Navegador moderno (Chrome 90+, Edge 90+, Firefox 88+)
- [ ] Permisos de cámara permitidos
- [ ] No hay otras apps usando la cámara
- [ ] Hardware de cámara funcional
- [ ] Consola abierta para ver mensajes
- [ ] Botón "Activar Cámara" presionado

---

## ✨ Estado Actual

**Sistema:**
- ✅ Biblioteca html5-qrcode v2.3.8 cargada
- ✅ Activación manual con botón
- ✅ Mensajes de estado claros
- ✅ Manejo de errores robusto
- ✅ Detección automática de códigos QR
- ✅ Aplicación automática de Material ID
- ✅ Switch entre cámaras

**Lo que deberías ver:**
- Botón "Activar Cámara" al cargar
- Solicitud de permisos al hacer clic
- Vista de cámara después de permitir
- Escaneo automático de QR codes

---

## 🚀 Siguiente Paso

**PRUEBA AHORA:**

1. Abre `http://localhost:3001`
2. Presiona "Activar Cámara"
3. Permite el acceso cuando lo pida
4. Reporta qué ves (con screenshot si es posible)

Si funciona, procederemos a probar con tu código real **EBR874637**.
Si no funciona, comparte el mensaje de error de la consola.
