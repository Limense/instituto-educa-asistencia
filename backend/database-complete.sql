-- =================================================================
-- INSTITUTO EDUCA - SCRIPT COMPLETO DE BASE DE DATOS
-- Sistema de Control de Asistencia v2.0
-- =================================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS instituto_educa_asistencia 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE instituto_educa_asistencia;

-- =================================================================
-- TABLA: users (Usuarios del sistema)
-- =================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('administrator', 'supervisor', 'employee', 'guest') NOT NULL DEFAULT 'employee',
    active BOOLEAN DEFAULT TRUE,
    profile JSON,
    employment JSON,
    schedule JSON,
    permissions JSON,
    emergency_contact JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_active (active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- TABLA: departments (Departamentos)
-- =================================================================
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id VARCHAR(50),
    budget DECIMAL(12,2),
    location VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_manager_id (manager_id),
    INDEX idx_active (active),
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- TABLA: shifts (Turnos de trabajo)
-- =================================================================
CREATE TABLE IF NOT EXISTS shifts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    break_duration INT DEFAULT 0, -- minutos
    tolerance_minutes INT DEFAULT 15,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- TABLA: attendance (Registros de asistencia)
-- =================================================================
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    clock_in TIMESTAMP NULL,
    clock_out TIMESTAMP NULL,
    break_start TIMESTAMP NULL,
    break_end TIMESTAMP NULL,
    status ENUM('present', 'absent', 'late', 'early_leave', 'sick', 'vacation', 'holiday') DEFAULT 'present',
    type ENUM('manual', 'automatic', 'imported') DEFAULT 'manual',
    location JSON,
    observations TEXT,
    approved_by VARCHAR(50),
    approved_at TIMESTAMP NULL,
    shift_id VARCHAR(50),
    hours_worked DECIMAL(4,2),
    overtime_hours DECIMAL(4,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_user_id (user_id),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_shift_id (shift_id),
    INDEX idx_approved_by (approved_by),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- TABLA: holidays (Días festivos)
-- =================================================================
CREATE TABLE IF NOT EXISTS holidays (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type ENUM('national', 'local', 'company') DEFAULT 'national',
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_date (date),
    INDEX idx_type (type),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- TABLA: system_settings (Configuraciones del sistema)
-- =================================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(50) PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSON,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- TABLA: audit_log (Log de auditoría)
-- =================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(50),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- DATOS DE PRUEBA
-- =================================================================

-- Insertar usuarios de prueba (contraseñas hasheadas con bcrypt)
INSERT INTO users (id, username, password_hash, role, active, profile, employment, permissions) VALUES
('admin-001', 'admin', '$2b$10$xJ8EZ9qX7QJ.ZKGZoVZGrOYZJbOqNnFr7Q1yZzVL0K9qX8QJ.ZKGZo', 'administrator', true,
 JSON_OBJECT(
    'firstName', 'Administrador',
    'lastName', 'Sistema',
    'email', 'admin@institutoeduca.pe',
    'phone', '+51-999-999-999',
    'avatar', null
 ),
 JSON_OBJECT(
    'departmentId', 'dept-admin',
    'position', 'Administrador del Sistema',
    'employeeCode', 'ADM001',
    'startDate', '2025-01-01',
    'salary', 5000.00
 ),
 JSON_OBJECT(
    'canManageUsers', true,
    'canManageAttendance', true,
    'canViewReports', true,
    'canManageSystem', true
 )),

('super-001', 'supervisor', '$2b$10$xJ8EZ9qX7QJ.ZKGZoVZGrOYZJbOqNnFr7Q1yZzVL0K9qX8QJ.ZKGZo', 'supervisor', true,
 JSON_OBJECT(
    'firstName', 'María',
    'lastName', 'González',
    'email', 'maria.gonzalez@institutoeduca.pe',
    'phone', '+51-998-765-432',
    'avatar', null
 ),
 JSON_OBJECT(
    'departmentId', 'dept-admin',
    'position', 'Supervisora de Recursos Humanos',
    'employeeCode', 'SUP001',
    'startDate', '2025-01-15',
    'salary', 3500.00
 ),
 JSON_OBJECT(
    'canManageUsers', false,
    'canManageAttendance', true,
    'canViewReports', true,
    'canManageSystem', false
 )),

('emp-001', 'juan.perez', '$2b$10$xJ8EZ9qX7QJ.ZKGZoVZGrOYZJbOqNnFr7Q1yZzVL0K9qX8QJ.ZKGZo', 'employee', true,
 JSON_OBJECT(
    'firstName', 'Juan',
    'lastName', 'Pérez',
    'email', 'juan.perez@institutoeduca.pe',
    'phone', '+51-987-654-321',
    'avatar', null
 ),
 JSON_OBJECT(
    'departmentId', 'dept-education',
    'position', 'Docente de Matemáticas',
    'employeeCode', 'DOC001',
    'startDate', '2025-02-01',
    'salary', 2800.00
 ),
 JSON_OBJECT(
    'canManageUsers', false,
    'canManageAttendance', false,
    'canViewReports', false,
    'canManageSystem', false
 )),

('emp-002', 'ana.rodriguez', '$2b$10$xJ8EZ9qX7QJ.ZKGZoVZGrOYZJbOqNnFr7Q1yZzVL0K9qX8QJ.ZKGZo', 'employee', true,
 JSON_OBJECT(
    'firstName', 'Ana',
    'lastName', 'Rodríguez',
    'email', 'ana.rodriguez@institutoeduca.pe',
    'phone', '+51-976-543-210',
    'avatar', null
 ),
 JSON_OBJECT(
    'departmentId', 'dept-education',
    'position', 'Docente de Ciencias',
    'employeeCode', 'DOC002',
    'startDate', '2025-02-01',
    'salary', 2800.00
 ),
 JSON_OBJECT(
    'canManageUsers', false,
    'canManageAttendance', false,
    'canViewReports', false,
    'canManageSystem', false
 ));

-- Insertar departamentos
INSERT INTO departments (id, name, description, manager_id, location, active) VALUES
('dept-admin', 'Administración', 'Departamento administrativo y recursos humanos', 'admin-001', 'Oficina Principal - Piso 1', true),
('dept-education', 'Educación', 'Departamento académico y docentes', 'super-001', 'Aulas - Piso 2', true),
('dept-maintenance', 'Mantenimiento', 'Departamento de mantenimiento y servicios generales', null, 'Almacén - Sótano', true);

-- Insertar turnos de trabajo
INSERT INTO shifts (id, name, start_time, end_time, break_start, break_end, break_duration, tolerance_minutes, active) VALUES
('shift-morning', 'Turno Mañana', '08:00:00', '16:00:00', '12:00:00', '13:00:00', 60, 15, true),
('shift-afternoon', 'Turno Tarde', '14:00:00', '22:00:00', '18:00:00', '19:00:00', 60, 15, true),
('shift-full', 'Turno Completo', '08:00:00', '17:00:00', '12:00:00', '13:00:00', 60, 15, true);

-- Insertar registros de asistencia de ejemplo (últimos 7 días)
INSERT INTO attendance (id, user_id, date, clock_in, clock_out, status, shift_id, hours_worked) VALUES
('att-001', 'emp-001', '2025-06-09', '2025-06-09 08:05:00', '2025-06-09 16:10:00', 'present', 'shift-morning', 8.0),
('att-002', 'emp-002', '2025-06-09', '2025-06-09 08:10:00', '2025-06-09 16:05:00', 'late', 'shift-morning', 8.0),
('att-003', 'emp-001', '2025-06-10', '2025-06-10 08:00:00', '2025-06-10 16:00:00', 'present', 'shift-morning', 8.0),
('att-004', 'emp-002', '2025-06-10', null, null, 'absent', 'shift-morning', 0.0),
('att-005', 'emp-001', '2025-06-11', '2025-06-11 08:03:00', '2025-06-11 16:15:00', 'present', 'shift-morning', 8.2),
('att-006', 'emp-002', '2025-06-11', '2025-06-11 08:00:00', '2025-06-11 16:00:00', 'present', 'shift-morning', 8.0);

-- Insertar días festivos
INSERT INTO holidays (id, name, date, type, description, active) VALUES
('holiday-001', 'Año Nuevo', '2025-01-01', 'national', 'Celebración de año nuevo', true),
('holiday-002', 'Día del Trabajo', '2025-05-01', 'national', 'Día internacional del trabajador', true),
('holiday-003', 'Independencia del Perú', '2025-07-28', 'national', 'Día de la independencia nacional', true),
('holiday-004', 'Fiestas Patrias', '2025-07-29', 'national', 'Segundo día de fiestas patrias', true),
('holiday-005', 'Aniversario Instituto', '2025-09-15', 'company', 'Aniversario de fundación del instituto', true);

-- Insertar configuraciones del sistema
INSERT INTO system_settings (id, setting_key, setting_value, description, category) VALUES
('set-001', 'system.name', '"Instituto Educa - Control de Asistencia"', 'Nombre del sistema', 'general'),
('set-002', 'attendance.tolerance_minutes', '15', 'Minutos de tolerancia para entrada', 'attendance'),
('set-003', 'attendance.auto_break', 'true', 'Activar descanso automático', 'attendance'),
('set-004', 'reports.default_format', '"pdf"', 'Formato por defecto para reportes', 'reports'),
('set-005', 'notifications.email_enabled', 'false', 'Habilitar notificaciones por email', 'notifications'),
('set-006', 'security.session_timeout', '1440', 'Tiempo de sesión en minutos (24 horas)', 'security'),
('set-007', 'system.version', '"2.0.0"', 'Versión del sistema', 'general'),
('set-008', 'working_hours.standard', '8', 'Horas de trabajo estándar por día', 'attendance');

-- =================================================================
-- VISTAS ÚTILES
-- =================================================================

-- Vista para resumen de usuarios activos
CREATE OR REPLACE VIEW active_users_summary AS
SELECT 
    u.id,
    u.username,
    u.role,
    JSON_UNQUOTE(JSON_EXTRACT(u.profile, '$.firstName')) AS first_name,
    JSON_UNQUOTE(JSON_EXTRACT(u.profile, '$.lastName')) AS last_name,
    JSON_UNQUOTE(JSON_EXTRACT(u.employment, '$.position')) AS position,
    d.name AS department_name,
    u.last_login,
    u.created_at
FROM users u
LEFT JOIN departments d ON JSON_UNQUOTE(JSON_EXTRACT(u.employment, '$.departmentId')) = d.id
WHERE u.active = true;

-- Vista para resumen de asistencia diaria
CREATE OR REPLACE VIEW daily_attendance_summary AS
SELECT 
    DATE(a.date) as attendance_date,
    COUNT(*) as total_records,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
    SUM(a.hours_worked) as total_hours_worked,
    AVG(a.hours_worked) as avg_hours_worked
FROM attendance a
WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(a.date)
ORDER BY attendance_date DESC;

-- =================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- =================================================================

DELIMITER //

-- Procedimiento para obtener estadísticas del sistema
CREATE PROCEDURE GetSystemStats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM users WHERE active = true) as active_users,
        (SELECT COUNT(*) FROM departments WHERE active = true) as active_departments,
        (SELECT COUNT(*) FROM attendance WHERE date = CURDATE()) as today_attendance,
        (SELECT COUNT(*) FROM attendance WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as week_attendance,
        (SELECT COUNT(*) FROM shifts WHERE active = true) as active_shifts,
        (SELECT COUNT(*) FROM holidays WHERE date >= CURDATE()) as upcoming_holidays;
END //

-- Procedimiento para marcar entrada
CREATE PROCEDURE ClockIn(IN p_user_id VARCHAR(50), IN p_shift_id VARCHAR(50))
BEGIN
    DECLARE v_attendance_id VARCHAR(50);
    DECLARE v_today DATE DEFAULT CURDATE();
    
    SET v_attendance_id = CONCAT('att-', UNIX_TIMESTAMP(), '-', SUBSTRING(p_user_id, -3));
    
    INSERT INTO attendance (id, user_id, date, clock_in, shift_id, status, type, created_at)
    VALUES (v_attendance_id, p_user_id, v_today, NOW(), p_shift_id, 'present', 'manual', NOW())
    ON DUPLICATE KEY UPDATE
        clock_in = NOW(),
        status = 'present',
        updated_at = NOW();
        
    SELECT v_attendance_id as attendance_id, 'Entrada registrada exitosamente' as message;
END //

-- Procedimiento para marcar salida
CREATE PROCEDURE ClockOut(IN p_user_id VARCHAR(50))
BEGIN
    DECLARE v_clock_in TIMESTAMP;
    DECLARE v_hours_worked DECIMAL(4,2);
    
    SELECT clock_in INTO v_clock_in 
    FROM attendance 
    WHERE user_id = p_user_id AND date = CURDATE();
    
    IF v_clock_in IS NOT NULL THEN
        SET v_hours_worked = TIMESTAMPDIFF(MINUTE, v_clock_in, NOW()) / 60.0;
        
        UPDATE attendance 
        SET clock_out = NOW(),
            hours_worked = v_hours_worked,
            updated_at = NOW()
        WHERE user_id = p_user_id AND date = CURDATE();
        
        SELECT 'Salida registrada exitosamente' as message, v_hours_worked as hours_worked;
    ELSE
        SELECT 'Error: No se encontró registro de entrada para hoy' as message, 0 as hours_worked;
    END IF;
END //

DELIMITER ;

-- =================================================================
-- TRIGGERS PARA AUDITORÍA
-- =================================================================

DELIMITER //

-- Trigger para auditar cambios en usuarios
CREATE TRIGGER users_audit_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (id, user_id, action, table_name, record_id, old_values, new_values, created_at)
    VALUES (
        CONCAT('audit-', UNIX_TIMESTAMP(), '-', CONNECTION_ID()),
        NEW.id,
        'UPDATE',
        'users',
        NEW.id,
        JSON_OBJECT(
            'username', OLD.username,
            'role', OLD.role,
            'active', OLD.active,
            'last_login', OLD.last_login
        ),
        JSON_OBJECT(
            'username', NEW.username,
            'role', NEW.role,
            'active', NEW.active,
            'last_login', NEW.last_login
        ),
        NOW()
    );
END //

-- Trigger para auditar inserciones en asistencia
CREATE TRIGGER attendance_audit_insert
AFTER INSERT ON attendance
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (id, user_id, action, table_name, record_id, new_values, created_at)
    VALUES (
        CONCAT('audit-', UNIX_TIMESTAMP(), '-', CONNECTION_ID()),
        NEW.user_id,
        'INSERT',
        'attendance',
        NEW.id,
        JSON_OBJECT(
            'date', NEW.date,
            'clock_in', NEW.clock_in,
            'clock_out', NEW.clock_out,
            'status', NEW.status,
            'hours_worked', NEW.hours_worked
        ),
        NOW()
    );
END //

DELIMITER ;

-- =================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =================================================================

-- Índices compuestos para consultas comunes
CREATE INDEX idx_attendance_user_date_status ON attendance(user_id, date, status);
CREATE INDEX idx_attendance_date_status ON attendance(date, status);
CREATE INDEX idx_users_role_active ON users(role, active);

-- =================================================================
-- INFORMACIÓN FINAL
-- =================================================================

SELECT 
    'Base de datos Instituto Educa creada exitosamente' as message,
    DATABASE() as database_name,
    NOW() as created_at,
    '2.0.0' as version;

-- Mostrar estadísticas iniciales
CALL GetSystemStats();

-- Mostrar usuarios creados
SELECT 
    username,
    role,
    JSON_UNQUOTE(JSON_EXTRACT(profile, '$.firstName')) as nombre,
    JSON_UNQUOTE(JSON_EXTRACT(profile, '$.lastName')) as apellido,
    'admin123' as password_demo
FROM users 
WHERE username IN ('admin', 'supervisor', 'juan.perez', 'ana.rodriguez');
