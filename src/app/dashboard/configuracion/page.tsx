export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-2">Datos de tu empresa y configuración de TicketBAI</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Datos de la Empresa</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Mi Sociedad Patrimonial S.L."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="B12345678"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Configuración TicketBAI
        </h2>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            La configuración TicketBAI requiere un certificado digital válido
          </p>
        </div>
      </div>
    </div>
  );
}
