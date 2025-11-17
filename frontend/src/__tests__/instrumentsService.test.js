import { describe, it, expect, vi, beforeEach } from 'vitest';
import instrumentsService from '../services/instruments';
import api from '../services/httpClient';

// Mock del módulo httpClient
vi.mock('../services/httpClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('instrumentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('debería llamar GET /instruments/ sin parámetros', async () => {
      const mockData = { data: { results: [], count: 0 } };
      api.get.mockResolvedValue(mockData);

      await instrumentsService.list();

      expect(api.get).toHaveBeenCalledWith('/instruments/', { params: {} });
    });

    it('debería incluir filtros de búsqueda', async () => {
      const mockData = { data: { results: [], count: 0 } };
      const params = { search: 'BOND', tipo: 'BONO' };
      api.get.mockResolvedValue(mockData);

      await instrumentsService.list(params);

      expect(api.get).toHaveBeenCalledWith('/instruments/', { params });
    });
  });

  describe('get', () => {
    it('debería llamar GET /instruments/:id/', async () => {
      const mockInstrument = { 
        data: { 
          id: 1, 
          codigo: 'BOND001',
          nombre: 'Corporate Bond',
          tipo: 'BONO',
          issuer: 1,
          activo: true
        } 
      };
      api.get.mockResolvedValue(mockInstrument);

      const result = await instrumentsService.get(1);

      expect(api.get).toHaveBeenCalledWith('/instruments/1/');
      expect(result).toEqual(mockInstrument);
    });

    it('debería devolver detalles completos del instrumento', async () => {
      const mockInstrument = { 
        data: { 
          id: 2, 
          codigo: 'STOCK001',
          nombre: 'Common Stock',
          tipo: 'ACCION',
          issuer: 3,
          activo: true
        } 
      };
      api.get.mockResolvedValue(mockInstrument);

      const result = await instrumentsService.get(2);

      expect(result.data.tipo).toBe('ACCION');
      expect(result.data.issuer).toBe(3);
    });
  });

  describe('create', () => {
    it('debería llamar POST /instruments/ con los datos proporcionados', async () => {
      const newInstrument = { 
        codigo: 'FUND001',
        nombre: 'Mutual Fund',
        tipo: 'FONDO_MUTUO',
        issuer: 2,
        activo: true
      };
      const mockResponse = { data: { id: 1, ...newInstrument } };
      api.post.mockResolvedValue(mockResponse);

      const result = await instrumentsService.create(newInstrument);

      expect(api.post).toHaveBeenCalledWith('/instruments/', newInstrument);
      expect(result).toEqual(mockResponse);
    });

    it('debería crear instrumento tipo DERIVADO', async () => {
      const newInstrument = { 
        codigo: 'DRV001',
        nombre: 'Option Contract',
        tipo: 'DERIVADO',
        issuer: 1,
        activo: true
      };
      const mockResponse = { data: { id: 3, ...newInstrument } };
      api.post.mockResolvedValue(mockResponse);

      const result = await instrumentsService.create(newInstrument);

      expect(result.data.tipo).toBe('DERIVADO');
    });
  });

  describe('update', () => {
    it('debería llamar PUT /instruments/:id/ con los datos actualizados', async () => {
      const updatedData = { nombre: 'Updated Bond Name' };
      const mockResponse = { data: { id: 1, ...updatedData } };
      api.put.mockResolvedValue(mockResponse);

      const result = await instrumentsService.update(1, updatedData);

      expect(api.put).toHaveBeenCalledWith('/instruments/1/', updatedData);
      expect(result).toEqual(mockResponse);
    });

    it('debería actualizar estado activo del instrumento', async () => {
      const updatedData = { activo: false };
      const mockResponse = { data: { id: 1, activo: false } };
      api.put.mockResolvedValue(mockResponse);

      const result = await instrumentsService.update(1, updatedData);

      expect(result.data.activo).toBe(false);
    });

    it('debería cambiar tipo de instrumento', async () => {
      const updatedData = { tipo: 'OTRO' };
      const mockResponse = { data: { id: 1, tipo: 'OTRO' } };
      api.put.mockResolvedValue(mockResponse);

      const result = await instrumentsService.update(1, updatedData);

      expect(result.data.tipo).toBe('OTRO');
    });
  });

  describe('remove', () => {
    it('debería llamar DELETE /instruments/:id/', async () => {
      api.delete.mockResolvedValue({ status: 204 });

      await instrumentsService.remove(1);

      expect(api.delete).toHaveBeenCalledWith('/instruments/1/');
    });

    it('debería manejar eliminación exitosa', async () => {
      const mockResponse = { status: 204, data: null };
      api.delete.mockResolvedValue(mockResponse);

      const result = await instrumentsService.remove(10);

      expect(result.status).toBe(204);
    });
  });

  describe('listActive', () => {
    it('debería llamar GET /instruments/?activo=true', async () => {
      const mockData = { 
        data: { 
          results: [
            { id: 1, nombre: 'Active Bond', tipo: 'BONO', activo: true },
            { id: 2, nombre: 'Active Stock', tipo: 'ACCION', activo: true }
          ],
          count: 2
        } 
      };
      api.get.mockResolvedValue(mockData);

      const result = await instrumentsService.listActive();

      expect(api.get).toHaveBeenCalledWith('/instruments/?activo=true');
      expect(result.data.results.length).toBe(2);
      expect(result.data.results.every(inst => inst.activo)).toBe(true);
    });

    it('debería filtrar solo instrumentos activos', async () => {
      const mockData = { 
        data: { 
          results: [
            { id: 5, nombre: 'Active Fund', activo: true }
          ],
          count: 1
        } 
      };
      api.get.mockResolvedValue(mockData);

      const result = await instrumentsService.listActive();

      expect(result.data.results[0].activo).toBe(true);
    });

    it('debería devolver diferentes tipos de instrumentos activos', async () => {
      const mockData = { 
        data: { 
          results: [
            { id: 1, tipo: 'BONO', activo: true },
            { id: 2, tipo: 'ACCION', activo: true },
            { id: 3, tipo: 'FONDO_MUTUO', activo: true }
          ],
          count: 3
        } 
      };
      api.get.mockResolvedValue(mockData);

      const result = await instrumentsService.listActive();

      const tipos = result.data.results.map(i => i.tipo);
      expect(tipos).toContain('BONO');
      expect(tipos).toContain('ACCION');
      expect(tipos).toContain('FONDO_MUTUO');
    });
  });
});
