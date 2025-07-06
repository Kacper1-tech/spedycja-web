import React from "react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
      <img
        src="/logo.jpg"
        alt="Logo firmy"
        className="w-48 h-auto rounded-lg shadow-md"
      />
      <h1 className="text-3xl font-bold text-gray-800">
        Witaj w Zaawansowanym Panelu Logistycznym!
      </h1>

      <div className="max-w-xl text-gray-600 space-y-1">
        <p>
          Tutaj znajdziesz najważniejsze informacje, linki i szybki dostęp do Twoich funkcji.
        </p>
        <p>Created by Kacperek :)</p>
        <p className="mt-4">
          P.S. Pamiętaj, że jest to wersja demonstracyjna, więc wszelkie usprawnienia są mile widziane
        </p>
      </div>
    </div>
  );
}
