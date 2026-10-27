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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">nekescu</h1>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/inmuebles"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Building2 size={20} />
            <span>Inmuebles</span>
          </Link>

          <div className="pt-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Facturación
            </p>
            <Link
              href="/facturacion/emitidas"
              className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <FileText size={20} />
              <span>Emitidas</span>
            </Link>
            <Link
              href="/facturacion/recibidas"
              className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <FileText size={20} />
              <span>Recibidas</span>
            </Link>
          </div>

          <div className="pt-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Tesorería
            </p>
            <Link
              href="/tesoreria/cuentas"
              className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <Wallet size={20} />
              <span>Cuentas</span>
            </Link>
            <Link
              href="/tesoreria/movimientos"
              className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <Wallet size={20} />
              <span>Movimientos</span>
            </Link>
            <Link
              href="/tesoreria/conciliacion"
              className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <Wallet size={20} />
              <span>Conciliación</span>
            </Link>
          </div>

          <Link
            href="/configuracion"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Settings size={20} />
            <span>Configuración</span>
          </Link>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
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
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <h2 className="text-lg font-semibold text-gray-900">Panel de Control</h2>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
