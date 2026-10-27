'use client';

import { X } from 'lucide-react';
import { type Property } from '@/lib/db/schema';
import { PropertyForm } from './property-form';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property;
}

export function PropertyModal({ isOpen, onClose, property }: PropertyModalProps) {
  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {property ? 'Editar Inmueble' : 'Nuevo Inmueble'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <PropertyForm property={property} onSuccess={handleSuccess} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
