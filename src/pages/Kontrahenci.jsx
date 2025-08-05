import React from 'react';
import { Link } from 'react-router-dom';

export default function Kontrahenci() {
  const tiles = [
    { label: 'Lista kontrahentów', to: '/kontrahenci/lista' },
    { label: 'Dodaj kontrahenta', to: '/kontrahenci/dodaj' },
  ];

  return (
    <div className="p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold mb-8 flex items-center gap-2">
        🧾 Kontrahenci
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full max-w-5xl">
        {tiles.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="flex items-center justify-center h-32 border border-gray-300 rounded-lg shadow hover:shadow-lg hover:bg-blue-50 text-center font-medium text-lg transition"
          >
            {tile.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
