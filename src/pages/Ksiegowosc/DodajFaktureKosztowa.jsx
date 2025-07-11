import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function DodajFaktureKosztowa() {
  const [sellerName, setSellerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("PLN");
  const [paymentDate, setPaymentDate] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Zamień cenę na liczbę
		const priceNum = parseFloat(price);

		// Przygotuj obiekt do zapisu - dostosuj klucze do tabeli Supabase
		const newInvoice = {
			nazwa: sellerName,
			nr_faktury: invoiceNumber,
			pln: currency === "PLN" ? priceNum : 0,
			eur: currency === "EUR" ? priceNum : 0,
			gbp: currency === "GBP" ? priceNum : 0,
			data_platnosci: paymentDate,
		};

		// Wyślij do Supabase
		const { error } = await supabase
			.from("faktury_kosztowe")
			.insert([newInvoice]);

		if (error) {
			alert("Błąd podczas zapisywania faktury: " + error.message);
			return;
		}

		alert("Faktura została dodana!");

		// Opcjonalnie: wyczyść formularz
		setSellerName("");
		setInvoiceNumber("");
		setPrice("");
		setCurrency("PLN");
		setPaymentDate("");
	};


  return (
    <div className="max-w-xl mx-auto bg-white shadow p-6 rounded">
      <h1 className="text-2xl font-bold mb-4">Dodaj Fakturę Kosztową</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Nazwa sprzedawcy */}
        <div>
          <label className="block mb-1 font-semibold">Nazwa sprzedawcy</label>
          <input
            type="text"
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Wpisz nazwę sprzedawcy"
            required
          />
        </div>

        {/* Nr faktury */}
        <div>
          <label className="block mb-1 font-semibold">Nr faktury</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Wpisz numer faktury"
            required
          />
        </div>

        {/* Cena + waluta */}
        <div>
          <label className="block mb-1 font-semibold">Cena</label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Kwota"
              required
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="PLN">PLN</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        {/* Data płatności */}
        <div>
          <label className="block mb-1 font-semibold">Data płatności</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        {/* Przycisk Zapisz */}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Zapisz fakturę
        </button>
      </form>
    </div>
  );
}
