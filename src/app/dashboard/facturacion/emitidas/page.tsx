export default function FacturasEmitidasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Facturas Emitidas</h1>
        <p className="text-gray-600 mt-2">Gestiona las facturas que emites a tus clientes</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay facturas emitidas
        </h3>
        <p className="text-gray-600">
          Crea tu primera factura con TicketBAI integrado
        </p>
      </div>
    </div>
  );
}
