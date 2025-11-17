import { describe, it, expect, vi, beforeEach } from 'vitest';
import bulkUploadsService from '../services/bulkUploads';
import api from '../services/httpClient';

// Mock del módulo httpClient
vi.mock('../services/httpClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('bulkUploadsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('debería llamar GET /bulk-uploads/ sin parámetros', async () => {
      const mockData = { data: { results: [], count: 0 } };
      api.get.mockResolvedValue(mockData);

      await bulkUploadsService.list();

      expect(api.get).toHaveBeenCalledWith('/bulk-uploads/', { params: {} });
    });

    it('debería incluir parámetros de paginación', async () => {
      const mockData = { data: { results: [], count: 0 } };
      const params = { page: 2, page_size: 25 };
      api.get.mockResolvedValue(mockData);

      await bulkUploadsService.list(params);

      expect(api.get).toHaveBeenCalledWith('/bulk-uploads/', { params });
    });
  });

  describe('get', () => {
    it('debería llamar GET /bulk-uploads/:id/', async () => {
      const mockUpload = { 
        data: { 
          id: 1, 
          archivo: 'test.csv', 
          estado: 'PENDING',
          total_registros: 100 
        } 
      };
      api.get.mockResolvedValue(mockUpload);

      const result = await bulkUploadsService.get(1);

      expect(api.get).toHaveBeenCalledWith('/bulk-uploads/1/');
      expect(result).toEqual(mockUpload);
    });
  });

  describe('upload', () => {
    it('debería llamar POST /bulk-uploads/ con multipart/form-data', async () => {
      const formData = new FormData();
      formData.append('archivo', new Blob(['test'], { type: 'text/csv' }));
      const mockResponse = { data: { id: 1, archivo: 'test.csv' } };
      api.post.mockResolvedValue(mockResponse);

      await bulkUploadsService.upload(formData);

      expect(api.post).toHaveBeenCalledWith(
        '/bulk-uploads/',
        formData,
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: expect.any(Function)
        })
      );
    });

    it('debería llamar callback onProgress durante la carga', async () => {
      const formData = new FormData();
      const onProgress = vi.fn();
      const mockResponse = { data: { id: 1 } };
      
      // Capturar la función onUploadProgress
      let uploadProgressFn;
      api.post.mockImplementation((url, data, config) => {
        uploadProgressFn = config.onUploadProgress;
        return Promise.resolve(mockResponse);
      });

      await bulkUploadsService.upload(formData, onProgress);

      // Simular progreso de carga
      uploadProgressFn({ loaded: 50, total: 100 });
      
      expect(onProgress).toHaveBeenCalledWith(50);
    });

    it('debería manejar progreso al 100% correctamente', async () => {
      const formData = new FormData();
      const onProgress = vi.fn();
      const mockResponse = { data: { id: 1 } };
      
      let uploadProgressFn;
      api.post.mockImplementation((url, data, config) => {
        uploadProgressFn = config.onUploadProgress;
        return Promise.resolve(mockResponse);
      });

      await bulkUploadsService.upload(formData, onProgress);
      uploadProgressFn({ loaded: 100, total: 100 });
      
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it('no debería fallar si onProgress no se proporciona', async () => {
      const formData = new FormData();
      const mockResponse = { data: { id: 1 } };
      
      let uploadProgressFn;
      api.post.mockImplementation((url, data, config) => {
        uploadProgressFn = config.onUploadProgress;
        return Promise.resolve(mockResponse);
      });

      await bulkUploadsService.upload(formData);
      
      // No debería lanzar error al llamar sin onProgress
      expect(() => uploadProgressFn({ loaded: 50, total: 100 })).not.toThrow();
    });
  });

  describe('items', () => {
    it('debería llamar GET /bulk-uploads/:id/items/ sin filtro de estado', async () => {
      const mockItems = { data: [] };
      api.get.mockResolvedValue(mockItems);

      await bulkUploadsService.items(1);

      expect(api.get).toHaveBeenCalledWith('/bulk-uploads/1/items/', { params: {} });
    });

    it('debería incluir filtro de estado cuando se proporciona', async () => {
      const mockItems = { data: [] };
      api.get.mockResolvedValue(mockItems);

      await bulkUploadsService.items(1, 'SUCCESS');

      expect(api.get).toHaveBeenCalledWith('/bulk-uploads/1/items/', { 
        params: { estado: 'SUCCESS' } 
      });
    });

    it('debería filtrar por estado ERROR', async () => {
      const mockItems = { 
        data: [
          { id: 1, estado: 'ERROR', mensaje_error: 'Invalid data' }
        ] 
      };
      api.get.mockResolvedValue(mockItems);

      const result = await bulkUploadsService.items(1, 'ERROR');

      expect(api.get).toHaveBeenCalledWith('/bulk-uploads/1/items/', { 
        params: { estado: 'ERROR' } 
      });
      expect(result.data.length).toBe(1);
    });
  });

  describe('procesar', () => {
    it('debería llamar POST /bulk-uploads/:id/procesar/', async () => {
      const mockResponse = { 
        data: { 
          message: 'Procesamiento iniciado',
          task_id: 'abc123' 
        } 
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await bulkUploadsService.procesar(1);

      expect(api.post).toHaveBeenCalledWith('/bulk-uploads/1/procesar/');
      expect(result).toEqual(mockResponse);
    });

    it('debería manejar respuesta de procesamiento exitoso', async () => {
      const mockResponse = { 
        data: { 
          message: 'Procesamiento completado',
          procesados: 100,
          errores: 0
        } 
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await bulkUploadsService.procesar(1);

      expect(result.data.procesados).toBe(100);
      expect(result.data.errores).toBe(0);
    });
  });

  describe('resumenPropio', () => {
    it('debería llamar GET /bulk-uploads/resumen/', async () => {
      const mockResumen = { 
        data: { 
          total: 10,
          pendientes: 2,
          procesados: 5,
          con_errores: 3
        } 
      };
      api.get.mockResolvedValue(mockResumen);

      const result = await bulkUploadsService.resumenPropio();

      expect(api.get).toHaveBeenCalledWith('/bulk-uploads/resumen/');
      expect(result).toEqual(mockResumen);
    });

    it('debería devolver resumen con todos los estados', async () => {
      const mockResumen = { 
        data: { 
          total: 15,
          pendientes: 3,
          procesados: 8,
          con_errores: 4
        } 
      };
      api.get.mockResolvedValue(mockResumen);

      const result = await bulkUploadsService.resumenPropio();

      expect(result.data.total).toBe(15);
      expect(result.data.pendientes + result.data.procesados + result.data.con_errores).toBe(15);
    });
  });
});
