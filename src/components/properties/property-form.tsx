'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { type Property } from '@/lib/db/schema';
import { createProperty, updateProperty } from '@/app/actions/properties';

const propertySchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  cadastralReference: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  currentValue: z.string().optional(),
  monthlyRent: z.string().optional(),
  notes: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  property?: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PropertyForm({ property, onSuccess, onCancel }: PropertyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: property?.name || '',
      address: property?.address || '',
      cadastralReference: property?.cadastralReference || '',
      purchaseDate: property?.purchaseDate
        ? new Date(property.purchaseDate).toISOString().split('T')[0]
        : '',
      purchasePrice: property?.purchasePrice?.toString() || '',
      currentValue: property?.currentValue?.toString() || '',
      monthlyRent: property?.monthlyRent?.toString() || '',
      notes: property?.notes || '',
    },
  });

  async function onSubmit(values: PropertyFormData) {
    setLoading(true);
    setError('');

    try {
      let result;

      if (property?.id) {
        // Actualizar
        result = await updateProperty(property.id, values);
      } else {
        // Crear
        result = await createProperty(values);
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error guardando inmueble:', err);
      setError(err.message || 'Error al guardar el inmueble');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Inmueble *
          </label>
          <input
            id="name"
            type="text"
            {...form.register('name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Piso Calle Mayor"
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Dirección *
          </label>
          <input
            id="address"
            type="text"
            {...form.register('address')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Calle, número, piso, ciudad"
          />
          {form.formState.errors.address && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.address.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="cadastralReference"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Referencia Catastral
          </label>
          <input
            id="cadastralReference"
            type="text"
            {...form.register('cadastralReference')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1234567AB1234C"
          />
        </div>

        <div>
          <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Compra
          </label>
          <input
            id="purchaseDate"
            type="date"
            {...form.register('purchaseDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
            Precio de Compra (€)
          </label>
          <input
            id="purchasePrice"
            type="number"
            step="0.01"
            {...form.register('purchasePrice')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="250000.00"
          />
        </div>

        <div>
          <label htmlFor="currentValue" className="block text-sm font-medium text-gray-700 mb-1">
            Valor Actual (€)
          </label>
          <input
            id="currentValue"
            type="number"
            step="0.01"
            {...form.register('currentValue')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="280000.00"
          />
        </div>

        <div>
          <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700 mb-1">
            Renta Mensual (€)
          </label>
          <input
            id="monthlyRent"
            type="number"
            step="0.01"
            {...form.register('monthlyRent')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1500.00"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            id="notes"
            rows={3}
            {...form.register('notes')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Información adicional sobre el inmueble..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Guardando...' : property ? 'Actualizar' : 'Crear Inmueble'}
        </button>
      </div>
    </form>
  );
}
