import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from "../../supabaseClient";
import { getCurrencySymbol } from "../../utils/currency";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const MONTHS = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];
const CATEGORIES = ["Placowi", "Biurowi", "Inne"];
const CURRENCIES = [
  { code: "PLN", symbol: "zł" },
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
  { code: "CZK", symbol: "Kč" },
];

export default function Wydatki() {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [wydatki, setWydatki] = useState([]);

  const initialFormState = {
    data: new Date(),
    opis: "",
    kwota: "",
    waluta: "PLN",
    id: null,
  };

  const [forms, setForms] = useState({
    Placowi: { ...initialFormState },
    Biurowi: { ...initialFormState },
    Inne: { ...initialFormState },
  });

  useEffect(() => {
    const fetchWydatki = async () => {
      if (!selectedYear || !selectedMonth) return;

      const { data, error } = await supabase
        .from("wydatki")
        .select("*")
        .eq("rok", selectedYear)
        .eq("miesiac", selectedMonth);

      if (error) {
        console.error("Błąd pobierania:", error.message);
      } else {
        setWydatki(data);
      }
    };

    fetchWydatki();
  }, [selectedYear, selectedMonth]);

  const getWydatkiFor = (category) =>
    wydatki.filter((w) => w.kategoria === category);

  const handleAddOrUpdate = async (category) => {
    const form = forms[category];
    const payload = {
      rok: selectedYear,
      miesiac: selectedMonth,
      kategoria: category,
      data: form.data.toISOString().split("T")[0],
      opis: form.opis,
      kwota: parseFloat(form.kwota),
      waluta: form.waluta || "PLN",
    };

    if (form.id) {
      await supabase.from("wydatki").update(payload).eq("id", form.id);
    } else {
      await supabase.from("wydatki").insert([payload]);
    }

    setForms((prev) => ({
      ...prev,
      [category]: { ...initialFormState },
    }));

    const { data } = await supabase
      .from("wydatki")
      .select("*")
      .eq("rok", selectedYear)
      .eq("miesiac", selectedMonth);

    setWydatki(data);
  };

  const handleDelete = async (category) => {
    const form = forms[category];
    if (form.id) {
      await supabase.from("wydatki").delete().eq("id", form.id);

      setForms((prev) => ({
        ...prev,
        [category]: { ...initialFormState },
      }));

      const { data } = await supabase
        .from("wydatki")
        .select("*")
        .eq("rok", selectedYear)
        .eq("miesiac", selectedMonth);

      setWydatki(data);
    }
  };

  const handleExportPDF = () => {
    const input = document.getElementById("to-export");
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth() - 40; // marginesy
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 20, 20, pdfWidth, pdfHeight);
      pdf.save(`Wydatki_${selectedYear}_${selectedMonth}.pdf`);
    });
  };

  const handlePrint = () => {
    const html = document.getElementById("to-export").outerHTML;
    const printWindow = window.open("", "", "width=1024,height=768");
    printWindow.document.write(`
      <html>
        <head>
          <title>Wydatki ${selectedYear} - ${selectedMonth}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #333; padding: 8px 12px; text-align: left; }
            th { background-color: #f0f0f0; }
            tr:nth-child(even) { background-color: #fafafa; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-6">Wydatki</h1>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {YEARS.map((year) => (
          <button
            key={year}
            onClick={() => {
              setSelectedYear(year);
              setSelectedMonth(null);
              setWydatki([]);
            }}
            className={`px-4 py-2 rounded ${
              selectedYear === year
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {selectedYear && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {MONTHS.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-3 py-1 rounded ${
                selectedMonth === month
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      )}

      {selectedYear && selectedMonth && (
        <>
          {/* FORMULARZ - POZA PDF */}
          <div className="space-y-4 text-left mb-6">
            {CATEGORIES.map((category) => {
              const form = forms[category];
              return (
                <div key={category}>
                  <h3 className="text-xl font-bold mb-2 text-center">{category}</h3>
                  <div className="flex items-center flex-wrap justify-center gap-0.5 mb-0">
										<DatePicker
											selected={form.data}
											onChange={(date) =>
												setForms((prev) => ({
													...prev,
													[category]: { ...form, data: date },
												}))
											}
											dateFormat="yyyy-MM-dd"
											className="border px-2 py-0.5 rounded text-sm"
										/>
										<input
											type="text"
											placeholder="Opis"
											value={form.opis}
											onChange={(e) =>
												setForms((prev) => ({
													...prev,
													[category]: { ...form, opis: e.target.value },
												}))
											}
											className="border px-2 py-0.5 rounded text-sm"
										/>
										<input
											type="number"
											placeholder="Kwota"
											value={form.kwota}
											onChange={(e) =>
												setForms((prev) => ({
													...prev,
													[category]: { ...form, kwota: e.target.value },
												}))
											}
											className="border px-2 py-0.5 rounded text-sm"
										/>
										<select
											value={form.waluta}
											onChange={(e) =>
												setForms((prev) => ({
													...prev,
													[category]: { ...form, waluta: e.target.value },
												}))
											}
											className="border px-2 py-0.5 rounded text-sm"
										>
											{CURRENCIES.map((curr) => (
												<option key={curr.code} value={curr.code}>
													{curr.symbol}
												</option>
											))}
										</select>
										<button
											onClick={() => handleAddOrUpdate(category)}
											className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
										>
											{form.id ? "Zapisz" : "Dodaj"}
										</button>
										{form.id && (
											<button
												onClick={() => handleDelete(category)}
												className="bg-red-600 text-white px-3 py-1 rounded text-sm"
											>
												Usuń
											</button>
										)}
									</div>
                </div>
              );
            })}
          </div>

          {/* PDF */}
          <div id="to-export" style={{ background: "white", padding: "40px" }}>
            <h2 className="text-2xl mb-4">
              Wydatki {selectedYear} - {selectedMonth}
            </h2>

            <div className="space-y-10 text-left">
              {CATEGORIES.map((category) => {
                const categoryWydatki = getWydatkiFor(category);
                const suma = categoryWydatki.reduce(
                  (acc, curr) => acc + (curr.kwota || 0),
                  0
                );
                return (
                  <div key={category}>
                    <h3 className="text-xl font-bold mb-2 text-center">{category}</h3>
                    <table className="w-full border text-sm mb-2">
                      <thead className="bg-gray-100">
                        <tr>
													<th className="border p-2 text-left w-[20%]">Data</th>
													<th className="border p-2 text-left w-[50%]">Opis</th>
													<th className="border p-2 text-left w-[20%]">Kwota</th>
													<th className="border p-2 text-left w-[10%]">Waluta</th>
                        </tr>
                      </thead>
                      <tbody>
												{categoryWydatki.length === 0 ? (
													<tr>
														<td colSpan="4" className="border p-2 text-center text-gray-500">
															Brak wydatków.
														</td>
													</tr>
												) : 
													categoryWydatki.map((w) => (
														<tr
															key={w.id}
															onClick={() =>
																setForms((prev) => ({
																	...prev,
																	[category]: {
																		id: w.id,
																		data: new Date(w.data),
																		opis: w.opis,
																		kwota: w.kwota,
																		waluta: w.waluta || "PLN",
																	},
																}))
															}
															className={`cursor-pointer ${forms[category].id === w.id ? "bg-yellow-100" : ""}`}
														>
															<td className="border p-2">{w.data}</td>
															<td className="border p-2">{w.opis}</td>
															<td className="border p-2">{w.kwota}</td>
															<td className="border p-2">{getCurrencySymbol(w.waluta)}</td>
														</tr>
													))
												}
											</tbody>
                      {categoryWydatki.length > 0 && (
                        <tfoot>
                          <tr className="font-bold bg-gray-100">
                            <td colSpan="2" className="border p-2 text-right">
                              Suma:
                            </td>
                            <td className="border p-2">{suma.toFixed(2)}</td>
                            <td className="border p-2">–</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handleExportPDF}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
            >
              Eksportuj PDF
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
            >
              Drukuj
            </button>
          </div>
        </>
      )}
    </div>
  );
}
