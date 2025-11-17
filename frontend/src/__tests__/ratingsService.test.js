import { describe, it, expect, vi, beforeEach } from 'vitest';
import ratingsService from '../services/ratings';
import api from '../services/httpClient';

// Mock del módulo httpClient
vi.mock('../services/httpClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ratingsService', () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada test
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('debería llamar GET /tax-ratings/ sin parámetros', async () => {
      const mockData = { data: [] };
      api.get.mockResolvedValue(mockData);

      await ratingsService.list();

      expect(api.get).toHaveBeenCalledWith('/tax-ratings/', { params: {} });
    });

    it('debería llamar GET /tax-ratings/ con parámetros de filtro', async () => {
      const mockData = { data: [] };
      const params = { page: 2, page_size: 20 };
      api.get.mockResolvedValue(mockData);

      await ratingsService.list(params);

      expect(api.get).toHaveBeenCalledWith('/tax-ratings/', { params });
    });
  });

  describe('get', () => {
    it('debería llamar GET /tax-ratings/:id/', async () => {
      const mockRating = { data: { id: 1, issuer: 'ABC', rating: 'AAA' } };
      api.get.mockResolvedValue(mockRating);

      const result = await ratingsService.get(1);

      expect(api.get).toHaveBeenCalledWith('/tax-ratings/1/');
      expect(result).toEqual(mockRating);
    });
  });

  describe('create', () => {
    it('debería llamar POST /tax-ratings/ con los datos proporcionados', async () => {
      const newRating = { issuer: 1, rating: 'AAA', fecha: '2025-11-17' };
      const mockResponse = { data: { id: 1, ...newRating } };
      api.post.mockResolvedValue(mockResponse);

      const result = await ratingsService.create(newRating);

      expect(api.post).toHaveBeenCalledWith('/tax-ratings/', newRating);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('debería llamar PUT /tax-ratings/:id/ con los datos actualizados', async () => {
      const updatedData = { rating: 'AA' };
      const mockResponse = { data: { id: 1, ...updatedData } };
      api.put.mockResolvedValue(mockResponse);

      const result = await ratingsService.update(1, updatedData);

      expect(api.put).toHaveBeenCalledWith('/tax-ratings/1/', updatedData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('remove', () => {
    it('debería llamar DELETE /tax-ratings/:id/', async () => {
      api.delete.mockResolvedValue({ status: 204 });

      await ratingsService.remove(1);

      expect(api.delete).toHaveBeenCalledWith('/tax-ratings/1/');
    });
  });

  describe('ultimas', () => {
    it('debería llamar GET /tax-ratings/ultimas/ con límite predeterminado de 10', async () => {
      const mockData = { data: [] };
      api.get.mockResolvedValue(mockData);

      await ratingsService.ultimas();

      expect(api.get).toHaveBeenCalledWith('/tax-ratings/ultimas/', { params: { limit: 10 } });
    });

    it('debería llamar GET /tax-ratings/ultimas/ con límite personalizado', async () => {
      const mockData = { data: [] };
      api.get.mockResolvedValue(mockData);

      await ratingsService.ultimas(5);

      expect(api.get).toHaveBeenCalledWith('/tax-ratings/ultimas/', { params: { limit: 5 } });
    });
  });

  describe('porIssuer', () => {
    it('debería llamar GET /tax-ratings/por_issuer/ con issuer_id', async () => {
      const mockData = { data: [] };
      api.get.mockResolvedValue(mockData);

      await ratingsService.porIssuer(10);

      expect(api.get).toHaveBeenCalledWith('/tax-ratings/por_issuer/', { 
        params: { issuer_id: 10 } 
      });
    });

    it('debería combinar issuer_id con parámetros adicionales', async () => {
      const mockData = { data: [] };
      const extraParams = { fecha_desde: '2025-01-01' };
      api.get.mockResolvedValue(mockData);

      await ratingsService.porIssuer(10, extraParams);

      expect(api.get).toHaveBeenCalledWith('/tax-ratings/por_issuer/', { 
        params: { issuer_id: 10, fecha_desde: '2025-01-01' } 
      });
    });
  });

  describe('porRangoFecha', () => {
    it('debería llamar GET /tax-ratings/por_rango_fecha/ con rango de fechas', async () => {
      const mockData = { data: [] };
      api.get.mockResolvedValue(mockData);

      await ratingsService.porRangoFecha('2025-01-01', '2025-12-31');

      expect(api.get).toHaveBeenCalledWith('/tax-ratings/por_rango_fecha/', { 
        params: { fecha_desde: '2025-01-01', fecha_hasta: '2025-12-31' } 
      });
    });

    it('debería incluir parámetros extras en el query', async () => {
      const mockData = { data: [] };
      const extra = { issuer: 5 };
      api.get.mockResolvedValue(mockData);

      await ratingsService.porRangoFecha('2025-01-01', '2025-12-31', extra);

      expect(api.get).toHaveBeenCalledWith('/tax-ratings/por_rango_fecha/', { 
        params: { fecha_desde: '2025-01-01', fecha_hasta: '2025-12-31', issuer: 5 } 
      });
    });
  });

  describe('estadisticas', () => {
    it('debería llamar GET /tax-ratings/estadisticas/', async () => {
      const mockStats = { 
        data: { 
          total: 100, 
          por_rating: { AAA: 20, AA: 30, A: 50 } 
        } 
      };
      api.get.mockResolvedValue(mockStats);

      const result = await ratingsService.estadisticas();

      expect(api.get).toHaveBeenCalledWith('/tax-ratings/estadisticas/');
      expect(result).toEqual(mockStats);
    });
  });

  describe('cambiarEstado', () => {
    it('debería llamar PATCH /tax-ratings/:id/cambiar_estado/ con el nuevo estado', async () => {
      const mockResponse = { data: { id: 1, status: 'APPROVED' } };
      api.patch.mockResolvedValue(mockResponse);

      const result = await ratingsService.cambiarEstado(1, 'APPROVED');

      expect(api.patch).toHaveBeenCalledWith('/tax-ratings/1/cambiar_estado/', { 
        status: 'APPROVED' 
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
