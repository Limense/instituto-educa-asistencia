const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class DatabaseManager {
    constructor() {
        this.supabase = null;
        this.initSupabase();
    }

    initSupabase() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('⚠️  Credenciales de Supabase requeridas: SUPABASE_URL y SUPABASE_SERVICE_KEY');
        }
        
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('🟢 Conectado a Supabase PostgreSQL');
    }

    async connect() {
        try {
            const { data, error } = await this.supabase.from('empleados').select('count').limit(1);
            if (error) throw error;
            console.log('✅ Conexión a Supabase verificada');
            return true;
        } catch (error) {
            console.error('Error conectando a Supabase:', error.message);
            throw error;
        }
    }

    // Métodos para empleados
    async getEmpleados() {
        const { data, error } = await this.supabase
            .from('empleados')
            .select('*')
            .eq('activo', true);
        
        if (error) throw error;
        return data;
    }

    async getEmpleadoByEmail(email) {
        const { data, error } = await this.supabase
            .from('empleados')
            .select('*')
            .eq('email', email)
            .eq('activo', true)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async crearEmpleado(empleado) {
        const { data, error } = await this.supabase
            .from('empleados')
            .insert([empleado])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async actualizarEmpleado(id, empleado) {
        const { data, error } = await this.supabase
            .from('empleados')
            .update(empleado)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async eliminarEmpleado(id) {
        const { data, error } = await this.supabase
            .from('empleados')
            .update({ activo: false })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // Métodos para asistencias
    async getAsistencias(filtros = {}) {
        let queryBuilder = this.supabase
            .from('asistencias')
            .select(`
                *,
                empleados (
                    nombre,
                    email,
                    departamento
                )
            `);
        
        if (filtros.empleado_id) {
            queryBuilder = queryBuilder.eq('empleado_id', filtros.empleado_id);
        }
        
        if (filtros.fecha_inicio) {
            queryBuilder = queryBuilder.gte('fecha', filtros.fecha_inicio);
        }
        
        if (filtros.fecha_fin) {
            queryBuilder = queryBuilder.lte('fecha', filtros.fecha_fin);
        }
        
        const { data, error } = await queryBuilder.order('fecha', { ascending: false });
        
        if (error) throw error;
        
        return data.map(asistencia => ({
            ...asistencia,
            nombre: asistencia.empleados?.nombre || 'N/A',
            email: asistencia.empleados?.email || 'N/A',
            departamento: asistencia.empleados?.departamento || 'N/A'
        }));
    }

    async marcarAsistencia(empleadoId, tipo) {
        const hoy = new Date().toISOString().split('T')[0];
        const ahora = new Date().toTimeString().split(' ')[0];
        
        const { data: asistenciaExistente } = await this.supabase
            .from('asistencias')
            .select('*')
            .eq('empleado_id', empleadoId)
            .eq('fecha', hoy)
            .single();
        
        if (tipo === 'entrada') {
            if (asistenciaExistente) {
                throw new Error('Ya se marcó la entrada para hoy');
            }
            
            const { data, error } = await this.supabase
                .from('asistencias')
                .insert([{
                    empleado_id: empleadoId,
                    fecha: hoy,
                    hora_entrada: ahora
                }])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } else {
            if (!asistenciaExistente) {
                throw new Error('Debe marcar entrada primero');
            }
            
            if (asistenciaExistente.hora_salida) {
                throw new Error('Ya se marcó la salida para hoy');
            }
            
            const { data, error } = await this.supabase
                .from('asistencias')
                .update({ hora_salida: ahora })
                .eq('id', asistenciaExistente.id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        }
    }

    async initTables() {
        console.log('📋 Usando tablas de Supabase');
        return true;
    }

    async close() {
        return Promise.resolve();
    }

    getDatabase() {
        return this.supabase;
    }
}

const databaseManager = new DatabaseManager();
module.exports = databaseManager;
