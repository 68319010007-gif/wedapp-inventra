import { Outlet } from 'react-router-dom';
import Sidebar, { MobileNav } from '../components/Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-8 lg:pb-8">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
