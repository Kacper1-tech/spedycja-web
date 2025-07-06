import { Link, Outlet } from "react-router-dom";

export default function Zlecenia() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">📦 Zlecenia</h1>

      <nav className="space-y-2 mb-6">
        <div>
          <h2 className="font-semibold">Exportowe</h2>
          <ul className="ml-4 list-disc">
            <li><Link to="export/dodaj">Dodaj zlecenie</Link></li>
            <li><Link to="export/lista">Lista zleceń</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">Importowe</h2>
          <ul className="ml-4 list-disc">
            <li><Link to="import/dodaj">Dodaj zlecenie</Link></li>
            <li><Link to="import/lista">Lista zleceń</Link></li>
          </ul>
        </div>
        <div>
          <Link to="wszystkie" className="underline">Wszystkie zlecenia</Link>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
