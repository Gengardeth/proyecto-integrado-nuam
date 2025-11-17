import React, { useEffect, useRef } from 'react';

// Componente simple que utiliza Chart.js para mostrar distribución Vigentes/Vencidos
// Se carga de forma dinámica para evitar aumentar el bundle inicial.
const StatusChart = ({ vigentes, vencidos, total }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { Chart } = await import('chart.js/auto');
      if (!isMounted || !canvasRef.current) return;

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(canvasRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Vigentes', 'Vencidos'],
          datasets: [
            {
              data: [vigentes, vencidos],
              backgroundColor: ['#4caf50', '#ff9800'],
              borderWidth: 1,
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#555', font: { size: 12 } },
            },
            title: {
              display: true,
              text: `Distribución Estados (${total})`,
              color: '#333',
              font: { size: 14, weight: '600' },
            },
          },
          cutout: '55%',
        },
      });
    })();
    return () => {
      isMounted = false;
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [vigentes, vencidos, total]);

  return (
    <div className="kpi-card chart-card">
      <canvas ref={canvasRef} style={{ width: '100%', height: '160px' }} />
    </div>
  );
};

export default StatusChart;