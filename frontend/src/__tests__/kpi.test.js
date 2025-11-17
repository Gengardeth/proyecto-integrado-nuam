import { describe, it, expect } from 'vitest';

// Función auxiliar similar a la usada en Dashboard para calcular porcentaje
const porcentaje = (parte, total) => {
  if (!total || total === 0) return 0;
  return Number(((parte / total) * 100).toFixed(1));
};

describe('Cálculo de porcentajes KPIs', () => {
  it('retorna 0 cuando total es 0', () => {
    expect(porcentaje(5, 0)).toBe(0);
  });
  it('calcula porcentaje con un decimal', () => {
    expect(porcentaje(2, 5)).toBe(40.0);
  });
  it('maneja números grandes correctamente', () => {
    expect(porcentaje(500, 1000)).toBe(50.0);
  });
  it('redondea correctamente', () => {
    expect(porcentaje(1, 3)).toBe(33.3);
  });
});
