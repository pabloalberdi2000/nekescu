import { FileText } from 'lucide-react';

export default function FacturasRecibidasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturas Recibidas</h1>
          <p className="text-gray-600 mt-2">Gestiona las facturas de tus proveedores</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Registrar Factura
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <FileText className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay facturas recibidas
        </h3>
        <p className="text-gray-600 mb-4">
          El sistema procesará automáticamente facturas recibidas por email
        </p>
      </div>
    </div>
  );
}
