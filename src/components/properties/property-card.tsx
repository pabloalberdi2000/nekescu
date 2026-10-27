'use client';

import { useState } from 'react';
import { Building2, Edit, Trash2, Calendar, Euro } from 'lucide-react';
import { type Property } from '@/lib/db/schema';
import { deleteProperty } from '@/app/actions/properties';
import { useRouter } from 'next/navigation';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
}

export function PropertyCard({ property, onEdit }: PropertyCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este inmueble?')) return;

    setDeleting(true);
    try {
      const result = await deleteProperty(property.id);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    } catch (error) {
      console.error('Error eliminando inmueble:', error);
      alert('Error al eliminar el inmueble');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{property.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{property.address}</p>
          </div>
        </div>
      </div>

      {property.cadastralReference && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">Ref. Catastral</p>
          <p className="text-sm font-mono text-gray-700">{property.cadastralReference}</p>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {property.monthlyRent && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <Euro size={14} />
              Renta mensual
            </span>
            <span className="font-semibold text-gray-900">
              {Number(property.monthlyRent).toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
              })}
            </span>
          </div>
        )}

        {property.currentValue && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Valor actual</span>
            <span className="font-semibold text-gray-900">
              {Number(property.currentValue).toLocaleString('es-ES', {
                style: 'currency',
                currency: 'EUR',
              })}
            </span>
          </div>
        )}

        {property.purchaseDate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <Calendar size={14} />
              Compra
            </span>
            <span className="text-gray-700">
              {new Date(property.purchaseDate).toLocaleDateString('es-ES')}
            </span>
          </div>
        )}
      </div>

      {property.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600 line-clamp-2">{property.notes}</p>
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onEdit(property)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Edit size={16} />
          Editar
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? '...' : <Trash2 size={16} />}
        </button>
      </div>
    </div>
  );
}
