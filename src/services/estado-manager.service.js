/**
 * Estado Manager Service
 *
 * Gestor central de estados que coordina:
 * - API de Laravel
 * - Cache en memoria
 * - Inicialización y refresh de estados
 *
 * Implementación de la Fase 2
 */

import laravelApiService from './laravel-api.service.js';
import stateCache from '../utils/state-cache.js';

class EstadoManagerService {
    constructor() {
        this.initialized = false;
        this.initPromise = null;
        this.categorias = [];
    }

    /**
     * Inicializar: cargar todos los estados en cache desde la API
     * Se ejecuta una sola vez al arrancar el servidor
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            console.log('ℹ️  Estados already initialized');
            return;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                console.log('\n🔄 ============================================');
                console.log('🔄 Inicializando estados desde Laravel API...');
                console.log('🔄 ============================================\n');

                // Primero, verificar conectividad
                const apiHealthy = await laravelApiService.healthCheck();
                if (!apiHealthy) {
                    throw new Error('Laravel API is not accessible. Make sure it\'s running on ' + process.env.LARAVEL_API_URL);
                }

                // Obtener todas las categorías
                const categorias = await laravelApiService.fetchCategorias();
                this.categorias = categorias.map(cat => cat.codigo);

                console.log(`\n📦 Found ${categorias.length} categorias: ${this.categorias.join(', ')}\n`);

                // Cargar estados para cada categoría
                let totalEstados = 0;
                for (const cat of categorias) {
                    try {
                        const estados = await laravelApiService.fetchEstados(cat.codigo);
                        stateCache.set(cat.codigo, estados);
                        totalEstados += estados.length;
                        console.log(`   ✅ ${cat.codigo.padEnd(20)} : ${estados.length} estados`);
                    } catch (error) {
                        console.error(`   ❌ ${cat.codigo.padEnd(20)} : Error - ${error.message}`);
                        throw error;
                    }
                }

                this.initialized = true;
                console.log('\n🎉 ============================================');
                console.log(`🎉 Estados inicializados correctamente!`);
                console.log(`🎉 Total: ${totalEstados} estados en ${categorias.length} categorías`);
                console.log('🎉 ============================================\n');

            } catch (error) {
                console.error('\n❌ ============================================');
                console.error('❌ Error inicializando estados:', error.message);
                console.error('❌ ============================================\n');
                this.initPromise = null;
                throw error;
            }
        })();

        return this.initPromise;
    }

    /**
     * Obtener estados de una categoría (con cache automático)
     * @param {string} categoria - Categoría de estados
     * @returns {Promise<Array>} Array de estados
     */
    async getEstados(categoria) {
        // Intentar obtener del cache primero
        let estados = stateCache.get(categoria);

        if (estados) {
            return estados;
        }

        // Si no está en cache, obtener de API
        try {
            console.log(`🔄 Cache miss for ${categoria}, fetching from API...`);
            estados = await laravelApiService.fetchEstados(categoria);
            stateCache.set(categoria, estados);
            return estados;
        } catch (error) {
            console.error(`❌ Error obteniendo estados de ${categoria}:`, error.message);
            return [];
        }
    }

    /**
     * Obtener un estado por código
     * @param {string} categoria - Categoría del estado
     * @param {string} codigo - Código del estado
     * @returns {Promise<Object|null>} Estado encontrado o null
     */
    async getEstadoPorCodigo(categoria, codigo) {
        const estados = await this.getEstados(categoria);
        return estados.find(e => e.codigo === codigo) || null;
    }

    /**
     * Validar si un código de estado existe
     * @param {string} categoria - Categoría del estado
     * @param {string} codigo - Código del estado
     * @returns {Promise<boolean>}
     */
    async isValidEstado(categoria, codigo) {
        const estado = await this.getEstadoPorCodigo(categoria, codigo);
        return estado !== null;
    }

    /**
     * Obtener todas las categorías
     * @returns {Array} Array de códigos de categorías
     */
    getCategorias() {
        return this.categorias;
    }

    /**
     * Verificar si una categoría es válida
     * @param {string} categoria - Categoría a validar
     * @returns {boolean}
     */
    isValidCategoria(categoria) {
        return this.categorias.includes(categoria);
    }

    /**
     * Refrescar cache de una categoría específica
     * @param {string} categoria - Categoría a refrescar
     * @returns {Promise<Array>} Estados actualizados
     */
    async refreshCategoria(categoria) {
        try {
            console.log(`♻️  Refreshing cache for ${categoria}...`);
            const estados = await laravelApiService.fetchEstados(categoria);
            stateCache.set(categoria, estados);
            console.log(`✅ Cache refreshed for ${categoria}`);
            return estados;
        } catch (error) {
            console.error(`❌ Error refrescando ${categoria}:`, error.message);
            throw error;
        }
    }

    /**
     * Refrescar cache completo
     * @returns {Promise<void>}
     */
    async refreshAll() {
        try {
            console.log('♻️  Refreshing all estado categories...');
            stateCache.clear();

            for (const categoria of this.categorias) {
                const estados = await laravelApiService.fetchEstados(categoria);
                stateCache.set(categoria, estados);
            }

            console.log('✅ All caches refreshed');
        } catch (error) {
            console.error('❌ Error refreshing all caches:', error.message);
            throw error;
        }
    }

    /**
     * Obtener estadísticas del cache
     * @returns {object} Estadísticas detalladas
     */
    getCacheStats() {
        const summary = stateCache.getSummary();
        return {
            initialized: this.initialized,
            cache_summary: summary,
            cache_details: stateCache.getStats(),
            categorias: this.categorias
        };
    }

    /**
     * Obtener información de un estado específico con detalles
     * @param {string} categoria - Categoría del estado
     * @param {string} codigo - Código del estado
     * @returns {Promise<Object|null>} Estado con detalles o null
     */
    async getEstadoDetalles(categoria, codigo) {
        try {
            const estado = await this.getEstadoPorCodigo(categoria, codigo);
            if (!estado) {
                return null;
            }

            // Obtener transiciones disponibles
            let transiciones = [];
            try {
                transiciones = await laravelApiService.fetchTransiciones(categoria, codigo);
            } catch (e) {
                console.warn(`Could not fetch transiciones for ${categoria}/${codigo}`);
            }

            return {
                ...estado,
                transiciones_disponibles: transiciones
            };
        } catch (error) {
            console.error(`Error getting detalles for ${categoria}/${codigo}:`, error.message);
            return null;
        }
    }

    /**
     * Validar una transición entre dos estados
     * @param {string} categoria - Categoría del estado
     * @param {string} codigoOrigen - Código del estado origen
     * @param {string} codigoDestino - Código del estado destino
     * @returns {Promise<boolean>}
     */
    async isValidTransicion(categoria, codigoOrigen, codigoDestino) {
        try {
            const transiciones = await laravelApiService.fetchTransiciones(categoria, codigoOrigen);
            return transiciones.some(t => t.codigo === codigoDestino);
        } catch (error) {
            console.error(`Error validating transition: ${error.message}`);
            return false;
        }
    }

    /**
     * Mapear un estado a otra categoría
     * @param {string} categoriaOrigen - Categoría origen
     * @param {string} codigoOrigen - Código origen
     * @param {string} categoriaDestino - Categoría destino
     * @returns {Promise<Object|null>} Estado mapeado o null
     */
    async mapearEstado(categoriaOrigen, codigoOrigen, categoriaDestino) {
        try {
            const mapeo = await laravelApiService.fetchMapeo(
                categoriaOrigen,
                codigoOrigen,
                categoriaDestino
            );
            return mapeo.destino;
        } catch (error) {
            console.error(`Error mapping estado: ${error.message}`);
            return null;
        }
    }
}

// Crear instancia singleton
export default new EstadoManagerService();
