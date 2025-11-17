import { describe, it, expect } from 'vitest';
import { groupAuditLogsByDate, topAcciones } from '../utils/audit';

describe('groupAuditLogsByDate', () => {
  it('agrupa por fecha y ordena desc', () => {
    const logs = [
      { id: 1, creado_en: '2025-11-16T10:00:00Z', accion: 'CREATE' },
      { id: 2, creado_en: '2025-11-16T12:00:00Z', accion: 'UPDATE' },
      { id: 3, creado_en: '2025-11-15T09:00:00Z', accion: 'DELETE' },
      { id: 4, creado_en: '2025-11-17T08:30:00Z', accion: 'LOGIN' }
    ];
    const grouped = groupAuditLogsByDate(logs);
    expect(grouped.length).toBe(3);
    expect(grouped[0].fecha).toBe('2025-11-17');
    expect(grouped[1].fecha).toBe('2025-11-16');
    expect(grouped[2].fecha).toBe('2025-11-15');
    expect(grouped[1].items.length).toBe(2);
  });
});

describe('topAcciones', () => {
  it('retorna acciones más frecuentes', () => {
    const logs = [
      { accion: 'CREATE' },
      { accion: 'CREATE' },
      { accion: 'UPDATE' },
      { accion: 'LOGIN' },
      { accion: 'CREATE' },
      { accion: 'DELETE' }
    ];
    const top = topAcciones(logs, 2);
    expect(top[0].accion).toBe('CREATE');
    expect(top[0].count).toBe(3);
    expect(top[1].accion).toBe('UPDATE');
  });
});
