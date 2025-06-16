/**
 * Factory Pattern para crear objetos de datos
 */
class DataFactory {
    static createUser(data = {}) {
        return {
            id: data.id || '',
            username: data.username || '',
            password_hash: data.password_hash || '',
            role: data.role || 'employee',
            active: data.active !== undefined ? data.active : true,
            profile: {
                firstName: data.profile?.firstName || '',
                lastName: data.profile?.lastName || '',
                email: data.profile?.email || '',
                phone: data.profile?.phone || '',
                avatar: data.profile?.avatar || null
            },
            employment: {
                departmentId: data.employment?.departmentId || '',
                position: data.employment?.position || '',
                employeeCode: data.employment?.employeeCode || '',
                startDate: data.employment?.startDate || new Date().toISOString().split('T')[0],
                salary: data.employment?.salary || 0
            },
            schedule: {
                shiftId: data.schedule?.shiftId || '',
                workDays: data.schedule?.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                startTime: data.schedule?.startTime || '08:00',
                endTime: data.schedule?.endTime || '17:00'
            },
            permissions: data.permissions || {},
            emergency_contact: {
                name: data.emergency_contact?.name || '',
                phone: data.emergency_contact?.phone || '',
                relationship: data.emergency_contact?.relationship || ''
            },
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
            last_login: data.last_login || null
        };
    }
    
    static createAttendance(data = {}) {
        return {
            id: data.id || `att-${Date.now()}`,
            user_id: data.user_id || '',
            date: data.date || new Date().toISOString().split('T')[0],
            clock_in: data.clock_in || null,
            clock_out: data.clock_out || null,
            break_start: data.break_start || null,
            break_end: data.break_end || null,
            status: data.status || 'present',
            type: data.type || 'manual',
            location: data.location || null,
            observations: data.observations || '',
            approved_by: data.approved_by || null,
            approved_at: data.approved_at || null,
            shift_id: data.shift_id || null,
            hours_worked: data.hours_worked || 0,
            overtime_hours: data.overtime_hours || 0,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString()
        };
    }
    
    static createDepartment(data = {}) {
        return {
            id: data.id || `dept-${Date.now()}`,
            name: data.name || '',
            description: data.description || '',
            manager_id: data.manager_id || null,
            budget: data.budget || 0,
            location: data.location || '',
            active: data.active !== undefined ? data.active : true,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString()
        };
    }
    
    static createSystemSetting(data = {}) {
        return {
            id: data.id || `setting-${Date.now()}`,
            setting_key: data.setting_key || '',
            setting_value: data.setting_value || null,
            description: data.description || '',
            category: data.category || 'general',
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString()
        };
    }
}

// Export para uso global
window.DataFactory = DataFactory;
