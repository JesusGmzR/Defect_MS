# 📘 GUÍA DE USO DE TYPESCRIPT EN DEFECT_MS

## 🎯 PROPÓSITO

Esta guía te ayudará a trabajar eficientemente con TypeScript en el proyecto Defect Management System.

---

## 🚀 INICIO RÁPIDO

### Comandos Esenciales

```bash
# Desarrollo (recomendado)
npm run dev
# ✅ Recarga automática
# ✅ No necesita compilar
# ✅ Errores en tiempo real

# Compilar proyecto
npm run build
# ✅ Genera dist/ con JavaScript

# Verificar tipos sin compilar
npm run type-check
# ✅ Rápido y útil para CI/CD

# Compilación continua
npm run build:watch
# ✅ Recompila al guardar
```

---

## 📦 ESTRUCTURA DE TIPOS

### Ubicación Principal: `types/index.ts`

Todos los tipos compartidos están aquí. Importa lo que necesites:

```typescript
import { 
  Defecto, 
  Usuario, 
  DefectoStatus,
  CreateDefectoRequest 
} from '../../types';
```

---

## 🎨 PATRONES COMUNES

### 1. **Crear una Nueva Ruta**

```typescript
import express, { Request, Response } from 'express';
import pool from '../database/db';
import { 
  MiInterface,      // Tu interface de request
  MiResponse,       // Tu interface de response
  ErrorResponse 
} from '../../types';

const router = express.Router();

// GET con query params
router.get('/', async (
  req: Request<{}, MiResponse | ErrorResponse, {}, { filtro?: string }>,
  res: Response<MiResponse | ErrorResponse>
) => {
  try {
    const { filtro } = req.query;
    // Tu código aquí
    res.json({ data: resultado });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al procesar', 
      details: (error as Error).message 
    });
  }
});

// POST con body tipado
router.post('/', async (
  req: Request<{}, MiResponse | ErrorResponse, MiInterface>,
  res: Response<MiResponse | ErrorResponse>
) => {
  try {
    const { campo1, campo2 } = req.body;
    // TypeScript sabe qué campos tiene req.body
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error', 
      details: (error as Error).message 
    });
  }
});

export default router;
```

### 2. **Query a Base de Datos**

```typescript
import { Defecto } from '../../types';

// Query tipada
const [rows] = await pool.execute<Defecto[]>(
  'SELECT * FROM defect_data WHERE id = ?',
  [id]
);

// rows es Defecto[], no any[]
const defecto = rows[0]; // Tipo: Defecto | undefined
```

### 3. **Crear Nuevos Tipos**

Agrega en `types/index.ts`:

```typescript
// Tipo literal (valores específicos)
export type MiEstado = 'Activo' | 'Inactivo' | 'Suspendido';

// Interface para objeto
export interface MiObjeto {
  id: number;
  nombre: string;
  estado: MiEstado;
  fecha?: Date;        // Opcional
}

// Request/Response de API
export interface CrearMiObjetoRequest {
  nombre: string;
  estado: MiEstado;
}

export interface CrearMiObjetoResponse {
  success: true;
  id: number;
  message: string;
}
```

### 4. **Middleware Tipado**

```typescript
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';

export const miMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // req.user está tipado como JWTPayload | undefined
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  
  // Verificar algo
  if (req.user.rol !== 'Admin') {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }
  
  next();
};
```

### 5. **Manejar Errores Tipados**

```typescript
try {
  // Código que puede fallar
} catch (error) {
  console.error('Error:', error);
  
  // Cast a Error para acceder a message
  res.status(500).json({ 
    error: 'Error al procesar', 
    details: (error as Error).message 
  });
}
```

---

## 💡 TIPS Y TRUCOS

### 1. **Usar `satisfies` para Validar Objetos**

```typescript
const config = {
  port: 3000,
  host: 'localhost',
  database: 'defect_ms'
} satisfies ServerConfig;
// TypeScript verifica que cumple la interface
// Pero mantiene el tipo literal
```

### 2. **Partial para Updates**

```typescript
interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
}

// Actualizar solo algunos campos
type ActualizarUsuario = Partial<Usuario>;

const update: ActualizarUsuario = {
  nombre: 'Nuevo nombre'
  // email y rol son opcionales
};
```

### 3. **Pick para Subconjuntos**

```typescript
// Solo algunos campos
type UsuarioPublico = Pick<Usuario, 'id' | 'nombre' | 'rol'>;
// Tiene: id, nombre, rol
// No tiene: password_hash, etc.
```

### 4. **Omit para Excluir Campos**

```typescript
// Todos los campos excepto algunos
type UsuarioSinPassword = Omit<Usuario, 'password_hash'>;
```

### 5. **Type Guards**

```typescript
function esDefecto(obj: any): obj is Defecto {
  return obj && typeof obj.id === 'string' && typeof obj.codigo === 'string';
}

if (esDefecto(data)) {
  // TypeScript sabe que data es Defecto
  console.log(data.codigo);
}
```

---

## 🐛 ERRORES COMUNES Y SOLUCIONES

### Error: "Type 'undefined' is not assignable"

```typescript
// ❌ Problema
const user = req.user; // puede ser undefined
const userId = user.id; // ERROR

// ✅ Solución 1: Optional chaining
const userId = req.user?.id;

// ✅ Solución 2: Type guard
if (req.user) {
  const userId = req.user.id; // OK
}

// ✅ Solución 3: Default value
const userId = req.user?.id || 0;
```

### Error: "Property 'xxx' does not exist"

```typescript
// ❌ Problema
const status = defecto.estatus; // Typo

// ✅ Solución: TypeScript te dice el nombre correcto
const status = defecto.status; // OK
```

### Error: "Type 'X' is not assignable to type 'Y'"

```typescript
// ❌ Problema
const status: DefectoStatus = req.body.status; // string
// ERROR: string no es DefectoStatus

// ✅ Solución: Validar antes
const validStatus: DefectoStatus[] = [
  'Pendiente_Reparacion', 
  'En_Reparacion', 
  'Reparado'
];

if (!validStatus.includes(req.body.status as DefectoStatus)) {
  res.status(400).json({ error: 'Status inválido' });
  return;
}

const status = req.body.status as DefectoStatus; // OK
```

### Error: "Argument of type 'X' is not assignable"

```typescript
// ❌ Problema
await pool.execute(query, [param1, param2, undefined]);
// ERROR: undefined puede causar problemas

// ✅ Solución: Usar null o filtrar
await pool.execute(query, [param1, param2, param3 || null]);
```

---

## 🎓 MEJORES PRÁCTICAS

### 1. **Siempre Tipar Parámetros de Funciones**

```typescript
// ❌ Mal
function procesar(data) { ... }

// ✅ Bien
function procesar(data: MiInterface): MiResponse { ... }
```

### 2. **Usar Interfaces para Objetos**

```typescript
// ✅ Bien
interface Usuario {
  id: number;
  nombre: string;
}

// También OK para tipos simples
type UserId = number;
```

### 3. **Evitar `any`**

```typescript
// ❌ Mal
const data: any = await fetch();

// ✅ Bien
const data: MiInterface = await fetch();

// ✅ O si no conoces el tipo
const data: unknown = await fetch();
// Luego validar antes de usar
```

### 4. **Usar `readonly` para Datos Inmutables**

```typescript
interface Config {
  readonly apiUrl: string;
  readonly version: string;
}

const config: Config = {
  apiUrl: 'http://api.com',
  version: '1.0.0'
};

config.apiUrl = 'otra'; // ❌ ERROR: readonly
```

### 5. **Documentar Tipos Complejos**

```typescript
/**
 * Representa un defecto detectado en el proceso de manufactura
 */
interface Defecto {
  /** ID único del defecto */
  id: string;
  /** Código del producto afectado */
  codigo: string;
  /** Descripción del defecto encontrado */
  defecto: string;
}
```

---

## 🔍 DEBUGGING CON TYPESCRIPT

### 1. **Ver Tipo de una Variable**

Hover sobre la variable en VS Code para ver su tipo.

```typescript
const defecto = rows[0];
// Hover muestra: const defecto: Defecto | undefined
```

### 2. **Forzar Verificación de Tipos**

```typescript
// Forzar error para ver tipo
const x: never = miVariable;
// Error muestra el tipo real de miVariable
```

### 3. **Usar Console para Depurar Tipos**

```typescript
type DebugType = typeof miVariable;
// Luego hover sobre DebugType
```

---

## 📚 RECURSOS ADICIONALES

### Documentación Oficial
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Playground](https://www.typescriptlang.org/play)

### Nuestros Documentos
- `TYPESCRIPT_MIGRATION.md` - Historia de la migración
- `MIGRATION_SUMMARY.md` - Resumen y beneficios
- `POST_MIGRATION_CHECKLIST.md` - Verificación post-migración

### VS Code Extensions
- ESLint - Linting
- Prettier - Formateo
- Error Lens - Errores inline
- TypeScript Hero - Imports automáticos

---

## 🎯 EJERCICIOS PRÁCTICOS

### Ejercicio 1: Crear Nueva Interface

Crea una interface para "Producto" en `types/index.ts`:

```typescript
export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  modelo: string;
  linea: string;
  fecha_fabricacion: Date;
}
```

### Ejercicio 2: Crear Ruta Tipada

Crea una ruta para obtener productos:

```typescript
// server/routes/productos.ts
import express, { Request, Response } from 'express';
import { Producto, ErrorResponse } from '../../types';

const router = express.Router();

router.get('/', async (
  _req: Request,
  res: Response<Producto[] | ErrorResponse>
) => {
  try {
    const [rows] = await pool.execute<Producto[]>(
      'SELECT * FROM productos'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error', 
      details: (error as Error).message 
    });
  }
});

export default router;
```

### Ejercicio 3: Añadir Validación

Valida un enum antes de usar:

```typescript
const validAreas: Area[] = ['SMD', 'IMD', 'Ensamble', 'Mantenimiento', 'Micom'];

if (!validAreas.includes(req.body.area as Area)) {
  res.status(400).json({ 
    error: 'Área inválida',
    valid: validAreas 
  });
  return;
}

const area = req.body.area as Area; // Seguro
```

---

## ✅ CHECKLIST DE DESARROLLO

Cuando agregues nuevo código TypeScript:

- ☐ Todas las funciones tienen tipos en parámetros y return
- ☐ No uso `any` (o lo justifico con comentario)
- ☐ Interfaces están en `types/index.ts`
- ☐ Valido enums antes de usar
- ☐ Manejo errores con type casting: `(error as Error)`
- ☐ Uso optional chaining `?.` cuando algo puede ser undefined
- ☐ Compila sin errores: `npm run type-check`

---

## 🎉 ¡ÉXITO!

Ahora sabes cómo trabajar con TypeScript en el proyecto. Recuerda:

1. **Los tipos son tus amigos** - Te ayudan a evitar bugs
2. **Usa el autocompletado** - Te ahorra tiempo
3. **Lee los errores** - TypeScript te dice qué está mal
4. **Consulta esta guía** - Siempre que tengas dudas

**¡Happy TypeScripting!** 🚀

---

**Última actualización:** 12 de Noviembre de 2025  
**Proyecto:** Defect Management System  
**Versión TypeScript:** 5.x
