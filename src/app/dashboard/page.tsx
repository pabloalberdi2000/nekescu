import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { db } from '@/lib/db';
import { properties, invoices } from '@/lib/db/schema';
import { eq, count, and } from 'drizzle-orm';
import { Building2, FileText, Euro, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const companyId = session.user.user_metadata?.company_id;

  // Obtener métricas
  let propertiesCount = 0;
  let pendingInvoices = 0;

  if (companyId) {
    const [propertiesResult] = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.companyId, companyId));

    propertiesCount = propertiesResult?.count || 0;

    const [invoicesResult] = await db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          eq(invoices.status, 'pending')
        )
      );

    pendingInvoices = invoicesResult?.count || 0;
  }

  return (
    <div className="space-y-8">
      {/* Banner de bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">¡Bienvenido a NEKESCU!</h1>
            <p className="text-blue-100 text-lg">
              {session.user.email}
            </p>
            <p className="text-blue-200 mt-2 text-sm">
              Gestiona tu patrimonio inmobiliario de forma profesional
            </p>
          </div>
          <Link
            href="/dashboard/configuracion"
            className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Configurar
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
        <p className="text-gray-600 mt-2">Resumen de tu actividad y métricas principales</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Inmuebles</p>
              <p className="text-4xl font-bold text-gray-900 mt-3">{propertiesCount}</p>
              <p className="text-xs text-gray-500 mt-2">Total de propiedades</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Facturas Pendientes</p>
              <p className="text-4xl font-bold text-gray-900 mt-3">{pendingInvoices}</p>
              <p className="text-xs text-gray-500 mt-2">Por cobrar</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Ingresos del Mes</p>
              <p className="text-4xl font-bold text-gray-900 mt-3">0,00 €</p>
              <p className="text-xs text-gray-500 mt-2">Mes actual</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Euro className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Crecimiento</p>
              <p className="text-4xl font-bold text-gray-900 mt-3">+0%</p>
              <p className="text-xs text-gray-500 mt-2">vs mes anterior</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/inmuebles"
            className="group flex items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
              <Building2 className="text-white" size={24} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">Gestionar Inmuebles</p>
              <p className="text-sm text-gray-600 mt-1">Ver y editar propiedades</p>
            </div>
          </Link>

          <Link
            href="/dashboard/facturacion/emitidas"
            className="group flex items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
              <FileText className="text-white" size={24} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">Nueva Factura</p>
              <p className="text-sm text-gray-600 mt-1">Emitir factura con TicketBAI</p>
            </div>
          </Link>

          <Link
            href="/dashboard/tesoreria/cuentas"
            className="group flex items-center gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
              <Euro className="text-white" size={24} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">Tesorería</p>
              <p className="text-sm text-gray-600 mt-1">Gestionar cuentas bancarias</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
