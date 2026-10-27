'use client';

import { useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { type Property } from '@/lib/db/schema';
import { PropertyCard } from './property-card';
import { PropertyModal } from './property-modal';

interface PropertiesListClientProps {
  properties: Property[];
}

export function PropertiesListClient({ properties }: PropertiesListClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>(undefined);

  const handleCreate = () => {
    setEditingProperty(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProperty(undefined);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inmuebles</h1>
          <p className="text-gray-600 mt-2">Gestiona tus propiedades y activos inmobiliarios</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nuevo Inmueble
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay inmuebles registrados
          </h3>
          <p className="text-gray-600 mb-4">Comienza añadiendo tu primera propiedad</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Nuevo Inmueble
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <PropertyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        property={editingProperty}
      />
    </>
  );
}
