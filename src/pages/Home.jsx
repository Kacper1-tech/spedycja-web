import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const tiles = [
    { label: "Zlecenia", to: "/zlecenia" },
    { label: "Transport", to: "/transport" },
    { label: "Plan", to: "/plan" },
    { label: "Kontrahenci", to: "/kontrahenci" },
    { label: "Księgowość", to: "/ksiegowosc" },
    { label: "Rejestr", to: "/rejestr" },
    { label: "Dokumenty", to: "/dokumenty" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <img
        src="/logo.jpg"
        alt="Logo firmy"
        className="w-64 h-auto rounded-lg shadow-md mb-10"
      />

      {/* KAFELKI */}
      <div className="max-w-7xl w-full mb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
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

      {/* STOPKA */}
      <footer className="mt-auto mb-6 text-gray-500 text-sm">
        &copy; 2025 | Kacper C
      </footer>
    </div>
  );
}
