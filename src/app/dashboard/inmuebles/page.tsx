import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { properties } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { PropertiesListClient } from '@/components/properties/properties-list-client';

export default async function InmueblesPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const companyId = session?.user.user_metadata?.company_id;

  if (!companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inmuebles</h1>
          <p className="text-gray-600 mt-2">Gestiona tus propiedades y activos inmobiliarios</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No se encontró la empresa asociada.</p>
        </div>
      </div>
    );
  }

  const propertiesList = await db
    .select()
    .from(properties)
    .where(eq(properties.companyId, companyId))
    .orderBy(desc(properties.createdAt));

  return <PropertiesListClient properties={propertiesList} />;
}
