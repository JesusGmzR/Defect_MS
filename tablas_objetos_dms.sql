-- ============================================
-- TABLA 1: defect_data
-- Registro de productos defectuosos detectados
-- ============================================

CREATE TABLE defect_data (
    id VARCHAR(50) PRIMARY KEY,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    linea VARCHAR(50) NOT NULL,
    codigo VARCHAR(100) NOT NULL,
    defecto TEXT NOT NULL,
    ubicacion VARCHAR(100) NOT NULL,
    area VARCHAR(50) NOT NULL,
    modelo VARCHAR(100),
    
    -- Nuevos campos para el flujo completo
    tipo_inspeccion ENUM('ICT', 'FCT', 'Packing', 'Visual') NOT NULL,
    etapa_deteccion ENUM('LQC', 'OQC') NOT NULL,
    status ENUM('Pendiente_Reparacion', 'En_Reparacion', 'Reparado', 'Rechazado', 'Aprobado') 
        NOT NULL DEFAULT 'Pendiente_Reparacion',
    
    -- Auditoría
    registrado_por VARCHAR(100) NOT NULL,
    fecha_envio_reparacion DATETIME NULL,
    
    -- Índices para búsquedas rápidas
    INDEX idx_codigo (codigo),
    INDEX idx_status (status),
    INDEX idx_fecha (fecha),
    INDEX idx_linea (linea),
    INDEX idx_tipo_inspeccion (tipo_inspeccion),
    INDEX idx_etapa (etapa_deteccion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TABLA 2: repair_data
-- Historial de reparaciones realizadas
-- ============================================

CREATE TABLE repair_data (
    id VARCHAR(50) PRIMARY KEY,
    defect_id VARCHAR(50) NOT NULL,
    
    -- Fechas del proceso de reparación
    fecha_recepcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATETIME NULL,
    fecha_fin DATETIME NULL,
    
    -- Información del técnico
    tecnico VARCHAR(100) NOT NULL,
    accion_correctiva TEXT NOT NULL,
    materiales_usados TEXT NULL,
    observaciones TEXT NULL,
    
    -- Estados
    status_antes VARCHAR(50) NOT NULL,
    status_despues VARCHAR(50) NOT NULL,
    fecha_retorno_qa DATETIME NULL,
    
    -- Validación QA
    inspeccionado_por_qa BOOLEAN DEFAULT FALSE,
    inspector_qa VARCHAR(100) NULL,
    fecha_inspeccion_qa DATETIME NULL,
    resultado_inspeccion_qa ENUM('Aprobado', 'Rechazado') NULL,
    observaciones_qa TEXT NULL,
    
    -- Relación con defect_data
    FOREIGN KEY (defect_id) REFERENCES defect_data(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_defect_id (defect_id),
    INDEX idx_tecnico (tecnico),
    INDEX idx_fecha_recepcion (fecha_recepcion),
    INDEX idx_resultado_qa (resultado_inspeccion_qa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TABLA 3: usuarios_dms (Control de acceso)
-- ============================================

CREATE TABLE usuarios_dms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    rol ENUM('Inspector_LQC', 'Inspector_OQC', 'Tecnico_Reparacion', 'Inspector_QA', 'Admin') NOT NULL,
    area VARCHAR(50) NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME NULL,
    
    INDEX idx_username (username),
    INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TABLA 4: audit_log_dms (Auditoría de cambios)
-- ============================================

CREATE TABLE audit_log_dms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL,
    registro_id VARCHAR(50) NOT NULL,
    accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    campo_modificado VARCHAR(100) NULL,
    valor_anterior TEXT NULL,
    valor_nuevo TEXT NULL,
    usuario VARCHAR(100) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tabla (tabla),
    INDEX idx_registro_id (registro_id),
    INDEX idx_fecha (fecha),
    INDEX idx_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista completa de defectos con historial de reparación
CREATE VIEW vw_defectos_completos_dms AS
SELECT 
    d.*,
    r.id AS repair_id,
    r.tecnico,
    r.accion_correctiva,
    r.fecha_inicio AS fecha_inicio_reparacion,
    r.fecha_fin AS fecha_fin_reparacion,
    r.resultado_inspeccion_qa,
    r.inspector_qa,
    TIMESTAMPDIFF(HOUR, r.fecha_inicio, r.fecha_fin) AS horas_reparacion
FROM defect_data d
LEFT JOIN repair_data r ON d.id = r.defect_id
ORDER BY d.fecha DESC;


-- Vista de defectos pendientes de reparación
CREATE VIEW vw_pendientes_reparacion_dms AS
SELECT 
    id,
    codigo,
    defecto,
    ubicacion,
    area,
    modelo,
    tipo_inspeccion,
    etapa_deteccion,
    fecha,
    TIMESTAMPDIFF(HOUR, fecha, NOW()) AS horas_pendiente
FROM defect_data
WHERE status = 'Pendiente_Reparacion'
ORDER BY fecha ASC;


-- Vista de productos en reparación
CREATE VIEW vw_en_reparacion_dms AS
SELECT 
    d.id,
    d.codigo,
    d.defecto,
    d.modelo,
    r.tecnico,
    r.fecha_inicio,
    TIMESTAMPDIFF(HOUR, r.fecha_inicio, NOW()) AS horas_en_reparacion,
    r.accion_correctiva
FROM defect_data d
INNER JOIN repair_data r ON d.id = r.defect_id
WHERE d.status = 'En_Reparacion'
ORDER BY r.fecha_inicio ASC;


-- Vista de productos reparados pendientes de validación QA
CREATE VIEW vw_pendientes_validacion_qa_dms AS
SELECT 
    d.id,
    d.codigo,
    d.defecto,
    d.modelo,
    r.id AS repair_id,
    r.tecnico,
    r.fecha_fin AS fecha_reparacion,
    r.accion_correctiva,
    TIMESTAMPDIFF(HOUR, r.fecha_fin, NOW()) AS horas_esperando_qa
FROM defect_data d
INNER JOIN repair_data r ON d.id = r.defect_id
WHERE d.status = 'Reparado' AND r.inspeccionado_por_qa = FALSE
ORDER BY r.fecha_fin ASC;


-- ============================================
-- DATOS INICIALES (Usuarios de ejemplo)
-- ============================================

-- NOTA: Contraseña por defecto: "12345" (deberás cambiarlas después)
-- Hash generado con bcrypt
INSERT INTO usuarios_dms (username, password_hash, nombre_completo, rol, area) VALUES
('inspector_lqc1', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Juan Pérez', 'Inspector_LQC', 'LQC'),
('inspector_oqc1', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'María García', 'Inspector_OQC', 'OQC'),
('tecnico1', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Carlos López', 'Tecnico_Reparacion', 'Reparación'),
('inspector_qa1', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Ana Martínez', 'Inspector_QA', 'QA'),
('admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Administrador Sistema', 'Admin', NULL);


-- ============================================
-- TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- ============================================

-- Trigger para auditar cambios en defect_data
DELIMITER $$

CREATE TRIGGER trg_defect_data_update
AFTER UPDATE ON defect_data
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO audit_log_dms (tabla, registro_id, accion, campo_modificado, valor_anterior, valor_nuevo, usuario)
        VALUES ('defect_data', NEW.id, 'UPDATE', 'status', OLD.status, NEW.status, NEW.registrado_por);
    END IF;
END$$

DELIMITER ;


-- ============================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- ============================================

-- Procedimiento para iniciar reparación
DELIMITER $$

CREATE PROCEDURE sp_iniciar_reparacion(
    IN p_defect_id VARCHAR(50),
    IN p_tecnico VARCHAR(100)
)
BEGIN
    DECLARE v_repair_id VARCHAR(50);
    
    -- Generar ID para la reparación
    SET v_repair_id = CONCAT('REP_', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'));
    
    -- Actualizar status del defecto
    UPDATE defect_data 
    SET status = 'En_Reparacion',
        fecha_envio_reparacion = NOW()
    WHERE id = p_defect_id;
    
    -- Crear registro de reparación
    INSERT INTO repair_data (id, defect_id, tecnico, status_antes, status_despues, fecha_inicio, accion_correctiva)
    VALUES (v_repair_id, p_defect_id, p_tecnico, 'Pendiente_Reparacion', 'En_Reparacion', NOW(), 'En proceso');
    
    SELECT v_repair_id AS repair_id;
END$$

DELIMITER ;


-- Procedimiento para finalizar reparación
DELIMITER $$

CREATE PROCEDURE sp_finalizar_reparacion(
    IN p_repair_id VARCHAR(50),
    IN p_accion_correctiva TEXT,
    IN p_materiales_usados TEXT,
    IN p_observaciones TEXT
)
BEGIN
    DECLARE v_defect_id VARCHAR(50);
    
    -- Obtener defect_id
    SELECT defect_id INTO v_defect_id FROM repair_data WHERE id = p_repair_id;
    
    -- Actualizar repair_data
    UPDATE repair_data 
    SET fecha_fin = NOW(),
        accion_correctiva = p_accion_correctiva,
        materiales_usados = p_materiales_usados,
        observaciones = p_observaciones,
        status_despues = 'Reparado',
        fecha_retorno_qa = NOW()
    WHERE id = p_repair_id;
    
    -- Actualizar status del defecto
    UPDATE defect_data 
    SET status = 'Reparado'
    WHERE id = v_defect_id;
END$$

DELIMITER ;


-- ============================================
-- CONSULTAS ÚTILES PARA REPORTES
-- ============================================

-- Reporte de defectos por tipo de inspección (últimos 30 días)
-- SELECT tipo_inspeccion, COUNT(*) as total, 
--        AVG(TIMESTAMPDIFF(HOUR, fecha, fecha_envio_reparacion)) as promedio_horas_hasta_reparacion
-- FROM defect_data
-- WHERE fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
-- GROUP BY tipo_inspeccion;

-- Top 10 defectos más comunes (últimos 30 días)
-- SELECT defecto, COUNT(*) as frecuencia
-- FROM defect_data
-- WHERE fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
-- GROUP BY defecto
-- ORDER BY frecuencia DESC
-- LIMIT 10;

-- Rendimiento de técnicos (últimos 30 días)
-- SELECT tecnico, 
--        COUNT(*) as reparaciones_realizadas,
--        AVG(TIMESTAMPDIFF(HOUR, fecha_inicio, fecha_fin)) as promedio_horas_reparacion,
--        SUM(CASE WHEN resultado_inspeccion_qa = 'Aprobado' THEN 1 ELSE 0 END) as aprobadas,
--        SUM(CASE WHEN resultado_inspeccion_qa = 'Rechazado' THEN 1 ELSE 0 END) as rechazadas
-- FROM repair_data
-- WHERE fecha_recepcion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
-- GROUP BY tecnico
-- ORDER BY reparaciones_realizadas DESC;