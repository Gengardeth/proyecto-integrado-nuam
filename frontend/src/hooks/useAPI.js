import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para llamadas a la API
 * @param {Function} apiFunction - Función que realiza la llamada a la API
 * @param {boolean} immediate - Ejecutar inmediatamente al montar (default: true)
 */
export const useAPI = (apiFunction, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { data, loading, error, execute, refetch: execute };
};

/**
 * Hook para paginación
 */
export const usePagination = (initialPage = 1, initialPageSize = 10) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const nextPage = () => setPage(prev => prev + 1);
  const prevPage = () => setPage(prev => Math.max(1, prev - 1));
  const goToPage = (pageNumber) => setPage(pageNumber);
  const changePageSize = (size) => {
    setPageSize(size);
    setPage(1);
  };

  return {
    page,
    pageSize,
    nextPage,
    prevPage,
    goToPage,
    changePageSize,
    offset: (page - 1) * pageSize,
  };
};

export default useAPI;
