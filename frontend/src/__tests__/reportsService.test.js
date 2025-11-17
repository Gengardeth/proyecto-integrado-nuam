import { describe, it, expect, vi, beforeEach } from 'vitest';
import reportsService from '../services/reports';
import api from '../services/httpClient';

// Mock del módulo httpClient
vi.mock('../services/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('reportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('estadisticas', () => {
    it('debería llamar GET /reports/estadisticas/ sin parámetros', async () => {
      const mockStats = { 
        data: { 
          total_calificaciones: 150,
          por_rating: { AAA: 50, AA: 40, A: 30, BBB: 20, BB: 10 },
          promedio_mensual: 12.5
        } 
      };
      api.get.mockResolvedValue(mockStats);

      const result = await reportsService.estadisticas();

      expect(api.get).toHaveBeenCalledWith('/reports/estadisticas/', { params: {} });
      expect(result).toEqual(mockStats);
    });

    it('debería llamar GET /reports/estadisticas/ con parámetros de filtro', async () => {
      const mockStats = { data: { total_calificaciones: 50 } };
      const params = { fecha_desde: '2025-01-01', fecha_hasta: '2025-12-31' };
      api.get.mockResolvedValue(mockStats);

      const result = await reportsService.estadisticas(params);

      expect(api.get).toHaveBeenCalledWith('/reports/estadisticas/', { params });
      expect(result).toEqual(mockStats);
    });

    it('debería manejar respuesta vacía correctamente', async () => {
      const mockStats = { data: { total_calificaciones: 0, por_rating: {} } };
      api.get.mockResolvedValue(mockStats);

      const result = await reportsService.estadisticas();

      expect(result.data.total_calificaciones).toBe(0);
      expect(result.data.por_rating).toEqual({});
    });
  });

  describe('exportCSV', () => {
    it('debería llamar GET /reports/exportar_csv/ con responseType blob', async () => {
      const mockBlob = new Blob(['data'], { type: 'text/csv' });
      const mockResponse = { data: mockBlob };
      api.get.mockResolvedValue(mockResponse);

      const result = await reportsService.exportCSV();

      expect(api.get).toHaveBeenCalledWith('/reports/exportar_csv/', { 
        params: {}, 
        responseType: 'blob' 
      });
      expect(result.data).toBeInstanceOf(Blob);
    });

    it('debería incluir parámetros de filtro en la exportación CSV', async () => {
      const mockBlob = new Blob(['data'], { type: 'text/csv' });
      const mockResponse = { data: mockBlob };
      const params = { 
        fecha_desde: '2025-01-01', 
        fecha_hasta: '2025-12-31',
        issuer: 5 
      };
      api.get.mockResolvedValue(mockResponse);

      await reportsService.exportCSV(params);

      expect(api.get).toHaveBeenCalledWith('/reports/exportar_csv/', { 
        params, 
        responseType: 'blob' 
      });
    });

    it('debería manejar blob vacío correctamente', async () => {
      const mockBlob = new Blob([], { type: 'text/csv' });
      const mockResponse = { data: mockBlob };
      api.get.mockResolvedValue(mockResponse);

      const result = await reportsService.exportCSV();

      expect(result.data.size).toBe(0);
      expect(result.data.type).toBe('text/csv');
    });
  });

  describe('exportPDF', () => {
    it('debería llamar GET /reports/exportar_pdf/ con responseType blob', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      const mockResponse = { data: mockBlob };
      api.get.mockResolvedValue(mockResponse);

      const result = await reportsService.exportPDF();

      expect(api.get).toHaveBeenCalledWith('/reports/exportar_pdf/', { 
        params: {}, 
        responseType: 'blob' 
      });
      expect(result.data).toBeInstanceOf(Blob);
    });

    it('debería incluir parámetros de filtro en la exportación PDF', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      const mockResponse = { data: mockBlob };
      const params = { 
        fecha_desde: '2025-01-01', 
        rating: 'AAA' 
      };
      api.get.mockResolvedValue(mockResponse);

      await reportsService.exportPDF(params);

      expect(api.get).toHaveBeenCalledWith('/reports/exportar_pdf/', { 
        params, 
        responseType: 'blob' 
      });
    });

    it('debería validar tipo MIME del blob PDF', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      const mockResponse = { data: mockBlob };
      api.get.mockResolvedValue(mockResponse);

      const result = await reportsService.exportPDF();

      expect(result.data.type).toBe('application/pdf');
    });
  });
});
