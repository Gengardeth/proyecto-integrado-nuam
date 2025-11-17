import { describe, it, expect, vi, beforeEach } from 'vitest';
import issuersService from '../services/issuers';
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

describe('issuersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('debería llamar GET /issuers/ sin parámetros', async () => {
      const mockData = { data: { results: [], count: 0 } };
      api.get.mockResolvedValue(mockData);

      await issuersService.list();

      expect(api.get).toHaveBeenCalledWith('/issuers/', { params: {} });
    });

    it('debería incluir parámetros de búsqueda', async () => {
      const mockData = { data: { results: [], count: 0 } };
      const params = { search: 'ABC Corp', page: 1 };
      api.get.mockResolvedValue(mockData);

      await issuersService.list(params);

      expect(api.get).toHaveBeenCalledWith('/issuers/', { params });
    });
  });

  describe('get', () => {
    it('debería llamar GET /issuers/:id/', async () => {
      const mockIssuer = { 
        data: { 
          id: 1, 
          codigo: 'ABC',
          nombre: 'ABC Corporation',
          rut: '12345678-9',
          pais: 'Chile',
          activo: true
        } 
      };
      api.get.mockResolvedValue(mockIssuer);

      const result = await issuersService.get(1);

      expect(api.get).toHaveBeenCalledWith('/issuers/1/');
      expect(result).toEqual(mockIssuer);
    });
  });

  describe('create', () => {
    it('debería llamar POST /issuers/ con los datos proporcionados', async () => {
      const newIssuer = { 
        codigo: 'XYZ',
        nombre: 'XYZ Company',
        rut: '98765432-1',
        pais: 'Argentina',
        activo: true
      };
      const mockResponse = { data: { id: 1, ...newIssuer } };
      api.post.mockResolvedValue(mockResponse);

      const result = await issuersService.create(newIssuer);

      expect(api.post).toHaveBeenCalledWith('/issuers/', newIssuer);
      expect(result).toEqual(mockResponse);
    });

    it('debería manejar issuer con activo=false', async () => {
      const newIssuer = { 
        codigo: 'DEF',
        nombre: 'DEF Inc',
        activo: false
      };
      const mockResponse = { data: { id: 2, ...newIssuer } };
      api.post.mockResolvedValue(mockResponse);

      const result = await issuersService.create(newIssuer);

      expect(result.data.activo).toBe(false);
    });
  });

  describe('update', () => {
    it('debería llamar PUT /issuers/:id/ con los datos actualizados', async () => {
      const updatedData = { nombre: 'Updated Name' };
      const mockResponse = { data: { id: 1, ...updatedData } };
      api.put.mockResolvedValue(mockResponse);

      const result = await issuersService.update(1, updatedData);

      expect(api.put).toHaveBeenCalledWith('/issuers/1/', updatedData);
      expect(result).toEqual(mockResponse);
    });

    it('debería actualizar múltiples campos', async () => {
      const updatedData = { 
        nombre: 'New Name',
        pais: 'Peru',
        activo: false
      };
      const mockResponse = { data: { id: 1, ...updatedData } };
      api.put.mockResolvedValue(mockResponse);

      const result = await issuersService.update(1, updatedData);

      expect(result.data.nombre).toBe('New Name');
      expect(result.data.pais).toBe('Peru');
      expect(result.data.activo).toBe(false);
    });
  });

  describe('remove', () => {
    it('debería llamar DELETE /issuers/:id/', async () => {
      api.delete.mockResolvedValue({ status: 204 });

      await issuersService.remove(1);

      expect(api.delete).toHaveBeenCalledWith('/issuers/1/');
    });

    it('debería manejar eliminación exitosa', async () => {
      const mockResponse = { status: 204, data: null };
      api.delete.mockResolvedValue(mockResponse);

      const result = await issuersService.remove(5);

      expect(result.status).toBe(204);
    });
  });

  describe('listActive', () => {
    it('debería llamar GET /issuers/?activo=true', async () => {
      const mockData = { 
        data: { 
          results: [
            { id: 1, nombre: 'Active Issuer 1', activo: true },
            { id: 2, nombre: 'Active Issuer 2', activo: true }
          ],
          count: 2
        } 
      };
      api.get.mockResolvedValue(mockData);

      const result = await issuersService.listActive();

      expect(api.get).toHaveBeenCalledWith('/issuers/?activo=true');
      expect(result.data.results.length).toBe(2);
      expect(result.data.results.every(issuer => issuer.activo)).toBe(true);
    });

    it('debería devolver solo issuers activos', async () => {
      const mockData = { 
        data: { 
          results: [
            { id: 1, nombre: 'Active Corp', activo: true }
          ],
          count: 1
        } 
      };
      api.get.mockResolvedValue(mockData);

      const result = await issuersService.listActive();

      expect(result.data.results[0].activo).toBe(true);
    });
  });
});
