import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  FileText,
  Wallet,
  Settings,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const handleSignOut = async () => {
    'use server';
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    redirect('/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-lg">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h1 className="text-xl font-bold text-white tracking-wide">NEKESCU SL</h1>
        </div>

        <nav className="p-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>

          <Link
            href="/dashboard/inmuebles"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
          >
            <Building2 size={20} />
            <span className="font-medium">Inmuebles</span>
          </Link>

          <div className="pt-4">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Facturación
            </p>
            <Link
              href="/dashboard/facturacion/emitidas"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <FileText size={20} />
              <span className="font-medium">Emitidas</span>
            </Link>
            <Link
              href="/dashboard/facturacion/recibidas"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <FileText size={20} />
              <span className="font-medium">Recibidas</span>
            </Link>
          </div>

          <div className="pt-4">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Tesorería
            </p>
            <Link
              href="/dashboard/tesoreria/cuentas"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <Wallet size={20} />
              <span className="font-medium">Cuentas</span>
            </Link>
            <Link
              href="/dashboard/tesoreria/movimientos"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <Wallet size={20} />
              <span className="font-medium">Movimientos</span>
            </Link>
            <Link
              href="/dashboard/tesoreria/conciliacion"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <Wallet size={20} />
              <span className="font-medium">Conciliación</span>
            </Link>
          </div>

          <Link
            href="/dashboard/configuracion"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
          >
            <Settings size={20} />
            <span className="font-medium">Configuración</span>
          </Link>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">
                {session.user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut size={16} />
              <span className="font-medium">Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Panel de Control</h2>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
