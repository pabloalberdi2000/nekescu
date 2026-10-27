export default function ConciliacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Conciliación Bancaria</h1>
        <p className="text-gray-600 mt-2">
          Relaciona movimientos bancarios con facturas automáticamente
        </p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay conciliaciones pendientes
        </h3>
        <p className="text-gray-600">
          El sistema sugerirá coincidencias automáticamente entre movimientos y facturas
        </p>
      </div>
    </div>
  );
}
