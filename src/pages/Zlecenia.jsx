import { Link } from "react-router-dom";

export default function Zlecenia() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-6">📦 Zlecenia</h1>

      <div className="space-y-4">
        <section>
          <h2 className="text-xl font-bold mb-2">Exportowe</h2>
          <ul className="list-disc list-inside">
            <li><Link to="/zlecenia/export/dodaj" className="text-blue-600 hover:underline">Dodaj zlecenie</Link></li>
            <li><Link to="/zlecenia/export/lista" className="text-blue-600 hover:underline">Lista zleceń</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Importowe</h2>
          <ul className="list-disc list-inside">
            <li><Link to="/zlecenia/import/dodaj" className="text-blue-600 hover:underline">Dodaj zlecenie</Link></li>
            <li><Link to="/zlecenia/import/lista" className="text-blue-600 hover:underline">Lista zleceń</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Inne</h2>
          <ul className="list-disc list-inside">
            <li><Link to="/zlecenia/wszystkie" className="text-blue-600 hover:underline">Wszystkie zlecenia</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
