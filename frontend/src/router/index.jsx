import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { ErrorBoundaryPage } from '../components/ErrorBoundaryPage';
import { NotFoundPage } from '../components/NotFoundPage';
import Login from '../pages/Login';
import Layout from '../components/Layout/Layout';
import Dashboard from '../pages/Dashboard';
import CalificacionesList from '../pages/Calificaciones/CalificacionesList';
import CalificacionForm from '../pages/Calificaciones/CalificacionForm';
import CalificacionDetail from '../pages/Calificaciones/CalificacionDetail';
import IssuersList from '../pages/Issuers/IssuersList';
import IssuerForm from '../pages/Issuers/IssuerForm';
import InstrumentsList from '../pages/Instruments/InstrumentsList';
import InstrumentForm from '../pages/Instruments/InstrumentForm';
import CargaMasiva from '../pages/CargaMasiva';
import Reportes from '../pages/Reportes';
import Auditoria from '../pages/Auditoria';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorBoundaryPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundaryPage />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'calificaciones',
        element: <CalificacionesList />,
      },
      {
        path: 'calificaciones/nueva',
        element: <CalificacionForm />,
      },
      {
        path: 'calificaciones/:id/editar',
        element: <CalificacionForm />,
      },
      {
        path: 'calificaciones/:id',
        element: <CalificacionDetail />,
      },
      {
        path: 'emisores',
        element: <IssuersList />,
      },
      {
        path: 'emisores/nuevo',
        element: <IssuerForm />,
      },
      {
        path: 'emisores/:id/editar',
        element: <IssuerForm />,
      },
      {
        path: 'instrumentos',
        element: <InstrumentsList />,
      },
      {
        path: 'instrumentos/nuevo',
        element: <InstrumentForm />,
      },
      {
        path: 'instrumentos/:id/editar',
        element: <InstrumentForm />,
      },
      {
        path: 'carga-masiva',
        element: <CargaMasiva />,
      },
      {
        path: 'reportes',
        element: <Reportes />,
      },
      {
        path: 'auditoria',
        element: <Auditoria />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

export default router;
