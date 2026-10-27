'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { properties } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createServerClient } from '@/lib/supabase/server';

export async function createProperty(data: {
  name: string;
  address: string;
  cadastralReference?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  currentValue?: string;
  monthlyRent?: string;
  notes?: string;
}) {
  try {
    const supabase = await createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { error: 'No autenticado' };
    }

    const companyId = session.user.user_metadata?.company_id;

    if (!companyId) {
      return { error: 'No se encontró la empresa asociada' };
    }

    await db.insert(properties).values({
      companyId,
      name: data.name,
      address: data.address,
      cadastralReference: data.cadastralReference || null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      purchasePrice: data.purchasePrice || null,
      currentValue: data.currentValue || null,
      monthlyRent: data.monthlyRent || null,
      notes: data.notes || null,
    });

    revalidatePath('/inmuebles');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating property:', error);
    return { error: error.message || 'Error al crear el inmueble' };
  }
}

export async function updateProperty(
  id: string,
  data: {
    name: string;
    address: string;
    cadastralReference?: string;
    purchaseDate?: string;
    purchasePrice?: string;
    currentValue?: string;
    monthlyRent?: string;
    notes?: string;
  }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { error: 'No autenticado' };
    }

    await db
      .update(properties)
      .set({
        name: data.name,
        address: data.address,
        cadastralReference: data.cadastralReference || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchasePrice: data.purchasePrice || null,
        currentValue: data.currentValue || null,
        monthlyRent: data.monthlyRent || null,
        notes: data.notes || null,
      })
      .where(eq(properties.id, id));

    revalidatePath('/inmuebles');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating property:', error);
    return { error: error.message || 'Error al actualizar el inmueble' };
  }
}

export async function deleteProperty(id: string) {
  try {
    const supabase = await createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { error: 'No autenticado' };
    }

    await db.delete(properties).where(eq(properties.id, id));

    revalidatePath('/inmuebles');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting property:', error);
    return { error: error.message || 'Error al eliminar el inmueble' };
  }
}
