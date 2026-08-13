import { Routes, Route } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';
import GuestGuard from './components/GuestGuard';
import RootLayout from './layouts/RootLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MapView from './pages/MapView';
import Reports from './pages/Reports';
import Chat from './pages/Chat';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Public routes (only for guests) */}
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Private routes (authenticated) */}
      <Route element={<AuthGuard />}>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<MapView />} />
          <Route path="reports" element={<Reports />} />
          <Route path="chat" element={<Chat />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
