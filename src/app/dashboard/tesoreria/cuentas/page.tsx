export default function CuentasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cuentas Bancarias</h1>
        <p className="text-gray-600 mt-2">Conecta tus cuentas con Open Banking</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay cuentas conectadas
        </h3>
        <p className="text-gray-600">
          Conecta tu cuenta bancaria para sincronizar movimientos automáticamente
        </p>
      </div>
    </div>
  );
}
