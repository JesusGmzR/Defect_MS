// ============================================
// TIPOS COMPARTIDOS PARA DEFECT MANAGEMENT SYSTEM
// ============================================

import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ============================================
// ENUMS Y TIPOS LITERALES
// ============================================

export type UserRole = 
  | 'Inspector_LQC' 
  | 'Inspector_OQC' 
  | 'Tecnico_Reparacion'
  | 'Inspector_QA' 
  | 'Admin_Calidad'
  | 'Admin_Reparacion'
  | 'Admin';

export type DefectoStatus = 
  | 'Pendiente_Reparacion' 
  | 'En_Reparacion' 
  | 'Reparado' 
  | 'Rechazado' 
  | 'Aprobado';

export type TipoInspeccion = 'ICT' | 'FCT' | 'Packing' | 'Visual';

export type EtapaDeteccion = 'LQC' | 'OQC';

export type Area = 'SMD' | 'IMD' | 'Ensamble' | 'Mantenimiento' | 'Micom';

export type Linea = 'M1' | 'M2' | 'M3' | 'M4' | 'DP1' | 'DP2' | 'DP3' | 'Harness';

export type ResultadoInspeccionQA = 'Aprobado' | 'Rechazado';

// ============================================
// INTERFACES DE BASE DE DATOS
// ============================================

/**
 * Defecto registrado en el sistema
 */
export interface Defecto extends RowDataPacket {
  id: string;
  fecha: Date;
  linea: string;
  codigo: string;
  defecto: string;
  ubicacion: string;
  area: Area;
  modelo?: string;
  tipo_inspeccion: TipoInspeccion;
  etapa_deteccion: EtapaDeteccion;
  status: DefectoStatus;
  registrado_por: string;
  fecha_envio_reparacion?: Date;
}

/**
 * Registro de reparación
 */
export interface Reparacion extends RowDataPacket {
  id: string;
  defect_id: string;
  fecha_recepcion: Date;
  fecha_inicio?: Date;
  fecha_fin?: Date;
  tecnico: string;
  accion_correctiva: string;
  materiales_usados?: string;
  observaciones?: string;
  status_antes: string;
  status_despues: string;
  fecha_retorno_qa?: Date;
  inspeccionado_por_qa: boolean;
  inspector_qa?: string;
  fecha_inspeccion_qa?: Date;
  resultado_inspeccion_qa?: ResultadoInspeccionQA;
  observaciones_qa?: string;
}

/**
 * Usuario del sistema
 */
export interface Usuario extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  nombre_completo: string;
  rol: UserRole;
  area?: string;
  activo: boolean;
  fecha_creacion: Date;
  ultimo_acceso?: Date;
}

/**
 * Registro de auditoría
 */
export interface AuditLog extends RowDataPacket {
  id: number;
  tabla: string;
  registro_id: string;
  accion: 'INSERT' | 'UPDATE' | 'DELETE';
  campo_modificado?: string;
  valor_anterior?: string;
  valor_nuevo?: string;
  usuario: string;
  fecha: Date;
}

// ============================================
// INTERFACES DE REQUEST/RESPONSE (API)
// ============================================

/**
 * Payload para crear un nuevo defecto
 */
export interface CreateDefectoRequest {
  fecha?: string;
  linea: string;
  codigo: string;
  defecto: string;
  ubicacion: string;
  area: Area;
  modelo?: string;
  tipo_inspeccion: TipoInspeccion;
  etapa_deteccion: EtapaDeteccion;
  registrado_por: string;
}

/**
 * Respuesta al crear un defecto
 */
export interface CreateDefectoResponse {
  success: true;
  id: string;
  message: string;
}

/**
 * Payload para login
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Respuesta de login exitoso
 */
export interface LoginResponse {
  success: true;
  token: string;
  user: UsuarioPublico;
}

/**
 * Datos públicos del usuario (sin password)
 */
export interface UsuarioPublico {
  id: number;
  username: string;
  nombre_completo: string;
  rol: UserRole;
  area?: string;
}

/**
 * Payload para cambiar contraseña
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Payload JWT decodificado
 */
export interface JWTPayload {
  id: number;
  username: string;
  nombre_completo?: string;
  rol: UserRole;
  area?: string;
  iat?: number;
  exp?: number;
}

/**
 * Payload para iniciar reparación
 */
export interface IniciarReparacionRequest {
  defect_id: string;
}

/**
 * Respuesta al iniciar reparación
 */
export interface IniciarReparacionResponse {
  success: true;
  message: string;
  repair_id: string;
}

/**
 * Payload para actualizar progreso de reparación
 */
export interface ActualizarProgresoRequest {
  accion_correctiva?: string;
  materiales_usados?: string;
  observaciones?: string;
}

/**
 * Payload para finalizar reparación
 */
export interface FinalizarReparacionRequest {
  accion_correctiva: string;
  materiales_usados?: string;
  observaciones?: string;
}

/**
 * Payload para aprobar/rechazar en QA
 */
export interface ValidacionQARequest {
  observaciones_qa?: string;
}

/**
 * Respuesta genérica de éxito
 */
export interface SuccessResponse {
  success: true;
  message: string;
}

/**
 * Respuesta genérica de error
 */
export interface ErrorResponse {
  error: string;
  details?: string;
}

// ============================================
// INTERFACES DE FILTROS Y CONSULTAS
// ============================================

/**
 * Filtros para consultar defectos
 */
export interface DefectosFilters {
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
  linea?: string;
  codigo?: string;
  defecto?: string;
  ubicacion?: string;
  area?: Area;
  status?: DefectoStatus;
  tipo_inspeccion?: TipoInspeccion;
  etapa_deteccion?: EtapaDeteccion;
}

/**
 * Parámetros para estadísticas
 */
export interface EstadisticasParams {
  dias?: number;
  inspector?: string;
}

// ============================================
// TIPOS EXTENDIDOS DE EXPRESS
// ============================================

import { Request } from 'express';

/**
 * Request extendido con usuario autenticado
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// ============================================
// TIPOS DE RESULTADO DE BASE DE DATOS
// ============================================

/**
 * Resultado de INSERT/UPDATE/DELETE
 */
export interface DBResult extends ResultSetHeader {
  affectedRows: number;
  insertId: number;
}

/**
 * Módulo del dashboard
 */
export interface DashboardModule {
  icon: string;
  iconClass: string;
  title: string;
  description: string;
  url: string;
}

/**
 * Mapeo de módulos por rol
 */
export type ModulesByRole = Record<UserRole, DashboardModule[]>;

// ============================================
// TIPOS DE CONFIGURACIÓN
// ============================================

/**
 * Variables de entorno del servidor
 */
export interface ServerConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Hace todas las propiedades opcionales excepto las especificadas
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Hace todas las propiedades requeridas excepto las especificadas
 */
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>;

/**
 * Omite propiedades de una interfaz
 */
export type Without<T, K extends keyof T> = Omit<T, K>;

/**
 * Extrae solo las propiedades que son strings
 */
export type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];
