export default function MovimientosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Movimientos Bancarios</h1>
        <p className="text-gray-600 mt-2">Historial de transacciones sincronizadas</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay movimientos registrados
        </h3>
        <p className="text-gray-600">
          Los movimientos aparecerán aquí tras conectar una cuenta bancaria
        </p>
      </div>
    </div>
  );
}
