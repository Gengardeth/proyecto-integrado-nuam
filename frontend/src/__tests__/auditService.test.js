import { describe, it, expect, vi, beforeEach } from 'vitest';
import auditService from '../services/audit';
import api from '../services/httpClient';

// Mock del módulo httpClient
vi.mock('../services/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('debería llamar GET /audit-logs/ sin parámetros', async () => {
      const mockData = { data: { results: [], count: 0 } };
      api.get.mockResolvedValue(mockData);

      await auditService.list();

      expect(api.get).toHaveBeenCalledWith('/audit-logs/', { params: {} });
    });

    it('debería incluir filtros de fecha_desde y fecha_hasta', async () => {
      const mockData = { data: { results: [], count: 0 } };
      const params = { 
        fecha_desde: '2025-01-01', 
        fecha_hasta: '2025-12-31' 
      };
      api.get.mockResolvedValue(mockData);

      await auditService.list(params);

      expect(api.get).toHaveBeenCalledWith('/audit-logs/', { params });
    });

    it('debería incluir parámetros de paginación', async () => {
      const mockData = { data: { results: [], count: 50 } };
      const params = { page: 2, page_size: 20 };
      api.get.mockResolvedValue(mockData);

      await auditService.list(params);

      expect(api.get).toHaveBeenCalledWith('/audit-logs/', { params });
    });

    it('debería filtrar por acción específica', async () => {
      const mockData = { 
        data: { 
          results: [
            { id: 1, accion: 'CREATE', usuario: 'admin' }
          ], 
          count: 1 
        } 
      };
      const params = { accion: 'CREATE' };
      api.get.mockResolvedValue(mockData);

      const result = await auditService.list(params);

      expect(api.get).toHaveBeenCalledWith('/audit-logs/', { params });
      expect(result.data.results[0].accion).toBe('CREATE');
    });
  });

  describe('get', () => {
    it('debería llamar GET /audit-logs/:id/', async () => {
      const mockLog = { 
        data: { 
          id: 1, 
          usuario: 'admin@test.com',
          accion: 'UPDATE',
          modelo: 'TaxRating',
          objeto_id: 10,
          cambios: { rating: 'AAA -> AA' },
          timestamp: '2025-11-17T10:30:00Z'
        } 
      };
      api.get.mockResolvedValue(mockLog);

      const result = await auditService.get(1);

      expect(api.get).toHaveBeenCalledWith('/audit-logs/1/');
      expect(result).toEqual(mockLog);
    });

    it('debería devolver detalles completos del log', async () => {
      const mockLog = { 
        data: { 
          id: 5, 
          usuario: 'user@test.com',
          accion: 'DELETE',
          modelo: 'Issuer',
          cambios: { nombre: 'Deleted Issuer' }
        } 
      };
      api.get.mockResolvedValue(mockLog);

      const result = await auditService.get(5);

      expect(result.data.accion).toBe('DELETE');
      expect(result.data.modelo).toBe('Issuer');
    });
  });

  describe('estadisticas', () => {
    it('debería llamar GET /audit-logs/estadisticas/', async () => {
      const mockStats = { 
        data: { 
          total: 1000,
          por_accion: {
            CREATE: 300,
            UPDATE: 500,
            DELETE: 200
          },
          por_usuario: {
            'admin@test.com': 600,
            'user@test.com': 400
          },
          ultimos_7_dias: 150
        } 
      };
      api.get.mockResolvedValue(mockStats);

      const result = await auditService.estadisticas();

      expect(api.get).toHaveBeenCalledWith('/audit-logs/estadisticas/');
      expect(result).toEqual(mockStats);
    });

    it('debería devolver estadísticas por acción', async () => {
      const mockStats = { 
        data: { 
          total: 500,
          por_accion: {
            CREATE: 200,
            UPDATE: 250,
            DELETE: 50
          }
        } 
      };
      api.get.mockResolvedValue(mockStats);

      const result = await auditService.estadisticas();

      expect(result.data.por_accion.CREATE).toBe(200);
      expect(result.data.por_accion.UPDATE).toBe(250);
      expect(result.data.por_accion.DELETE).toBe(50);
    });

    it('debería manejar respuesta sin datos', async () => {
      const mockStats = { 
        data: { 
          total: 0,
          por_accion: {},
          por_usuario: {}
        } 
      };
      api.get.mockResolvedValue(mockStats);

      const result = await auditService.estadisticas();

      expect(result.data.total).toBe(0);
      expect(Object.keys(result.data.por_accion).length).toBe(0);
    });
  });
});
