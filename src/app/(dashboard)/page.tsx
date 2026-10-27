import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { invoices, properties, bankTransactions } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { Building2, FileText, Euro, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const companyId = session?.user.user_metadata?.company_id;

  if (!companyId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          No se ha configurado una empresa para tu usuario.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Contacta con el administrador del sistema.
        </p>
      </div>
    );
  }

  // Obtener métricas
  const [totalPropertiesResult, pendingInvoicesResult, monthlyRevenueResult] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(properties)
        .where(eq(properties.companyId, companyId)),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoices)
        .where(
          and(
            eq(invoices.companyId, companyId),
            eq(invoices.status, 'pending')
          )
        ),

      db
        .select({ sum: sql<number>`coalesce(sum(total), 0)::numeric` })
        .from(invoices)
        .where(
          and(
            eq(invoices.companyId, companyId),
            eq(invoices.type, 'issued'),
            gte(
              invoices.issueDate,
              new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            )
          )
        ),
    ]);

  const totalProperties = totalPropertiesResult[0]?.count || 0;
  const pendingInvoices = pendingInvoicesResult[0]?.count || 0;
  const monthlyRevenue = monthlyRevenueResult[0]?.sum || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Resumen de tu actividad y métricas principales
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inmuebles</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalProperties}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Facturas Pendientes
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {pendingInvoices}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FileText className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Ingresos del Mes
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(Number(monthlyRevenue))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Euro className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Crecimiento</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">+12%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Próximas funcionalidades */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Bienvenido a nekescu
        </h2>
        <p className="text-gray-600 mb-4">
          Tu ERP patrimonial está listo para empezar. Comienza por:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">1.</span>
            <span className="text-gray-700">
              Configurar los datos de tu empresa en Configuración
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span className="text-gray-700">
              Añadir tus inmuebles en la sección Inmuebles
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">3.</span>
            <span className="text-gray-700">
              Crear tus primeras facturas en Facturación
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
