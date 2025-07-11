import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { getCurrencySymbol } from "../../utils/currency";
import { useNavigate } from "react-router-dom";

export default function WszystkieZlecenia() {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [filters, setFilters] = useState({});
	const [selectedZlecenie, setSelectedZlecenie] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const exports = await supabase.from("zlecenia_export").select("*");
      const imports = await supabase.from("zlecenia_import").select("*");
      const pozostale = await supabase.from("zlecenia_pozostale").select("*");

      const all = [
        ...(exports.data || []).map((z) => ({ ...z, typ: "Export" })),
        ...(imports.data || []).map((z) => ({ ...z, typ: "Import" })),
        ...(pozostale.data || []).map((z) => ({ ...z, typ: "Pozostałe" })),
      ];

      setRows(all);
      setFilteredRows(all);
    };

    fetchData();
  }, []);
	
	const openModal = (zlecenie) => {
		setSelectedZlecenie(zlecenie);
		setShowModal(true);
	};

  const formatDateRange = (start, end) => {
    if (!start) return "-";
    const dStart = new Date(start);
    const dEnd = end ? new Date(end) : null;

    const fmt = (d) =>
      `${String(d.getDate()).padStart(2, "0")}.${String(
        d.getMonth() + 1
      ).padStart(2, "0")}.${d.getFullYear()}`;
    const fmtShort = (d) =>
      `${String(d.getDate()).padStart(2, "0")}.${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

    if (!dEnd || fmt(dStart) === fmt(dEnd)) return fmt(dStart);

    return `${fmtShort(dStart)} – ${fmt(dEnd)}`;
  };

  const handleFilterChange = (column, value) => {
    const newFilters = { ...filters, [column]: value.toLowerCase() };
    setFilters(newFilters);
    setFilteredRows(
      rows.filter((row) => {
        return Object.entries(newFilters).every(([key, val]) => {
          let cell = "";
          if (key === "pickup_date") {
            cell = formatDateRange(row.pickup_date_start, row.pickup_date_end);
          } else if (key === "delivery_date") {
            cell = formatDateRange(row.delivery_date_start, row.delivery_date_end);
          } else if (key === "pickup_address") {
            const a = safeParseArray(row.adresy_odbioru_json)[0];
            cell = a ? `${a.kod || "-"} ${a.miasto || "-"}` : "-";
          } else if (key === "delivery_address") {
            const a = safeParseArray(row.adresy_dostawy_json)[0];
            cell = a ? `${a.kod || "-"} ${a.miasto || "-"}` : "-";
          } else if (key === "identyfikator") {
            cell =
              row.zl_vat ||
              row.zl_nip ||
              row.zl_regon ||
              row.zl_eori ||
              row.zl_pesel ||
              "-";
          } else {
            cell = row[key] || "";
          }
          return cell.toString().toLowerCase().includes(val);
        });
      })
    );
  };

  function safeParseArray(value) {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Wszystkie Zlecenia</h1>
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full text-sm text-left text-gray-800">
          <thead className="bg-gray-100 text-xs uppercase font-semibold tracking-wide">
            <tr>
              <th className="px-4 py-3">Typ</th>
              <th className="px-4 py-3">Nr zlecenia</th>
              <th className="px-4 py-3">Zleceniodawca</th>
              <th className="px-4 py-3">Identyfikator</th>
              <th className="px-4 py-3">Data załadunku</th>
              <th className="px-4 py-3">Data rozładunku</th>
              <th className="px-4 py-3">Adres załadunku</th>
              <th className="px-4 py-3">Adres rozładunku</th>
              <th className="px-4 py-3">LDM</th>
              <th className="px-4 py-3">Cena</th>
            </tr>
            <tr className="bg-gray-50">
              {[
                { key: "typ" },
                { key: "numer_zlecenia" },
                { key: "zl_nazwa" },
                { key: "identyfikator" },
                { key: "pickup_date" },
                { key: "delivery_date" },
                { key: "pickup_address" },
                { key: "delivery_address" },
                { key: "ldm" },
                { key: "cena" },
              ].map(({ key }) => (
                <td key={key} className="px-4 py-2">
                  <input
                    type="text"
                    className="w-full text-xs p-1 border rounded"
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr   key={`${row.typ}-${row.id}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => openModal(row)}>
                <td className="px-4 py-2">{row.typ}</td>
                <td className="px-4 py-2">{row.numer_zlecenia}</td>
                <td className="px-4 py-2">{row.zl_nazwa}</td>
                <td className="px-4 py-2">
                  {row.zl_vat ||
                    row.zl_nip ||
                    row.zl_regon ||
                    row.zl_eori ||
                    row.zl_pesel ||
                    "-"}
                </td>
                <td className="px-4 py-2">
                  {formatDateRange(row.pickup_date_start, row.pickup_date_end)}
                </td>
                <td className="px-4 py-2">
                  {formatDateRange(row.delivery_date_start, row.delivery_date_end)}
                </td>
                <td className="px-4 py-2">
                  {(() => {
                    const a = safeParseArray(row.adresy_odbioru_json)[0];
                    return a ? `${a.kod || "-"} ${a.miasto || "-"}` : "-";
                  })()}
                </td>
                <td className="px-4 py-2">
                  {(() => {
                    const a = safeParseArray(row.adresy_dostawy_json)[0];
                    return a ? `${a.kod || "-"} ${a.miasto || "-"}` : "-";
                  })()}
                </td>
                <td className="px-4 py-2">{row.ldm}</td>
                <td className="px-4 py-2">
                  {row.cena} {getCurrencySymbol(row.waluta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
			
			{showModal && selectedZlecenie && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="bg-white p-6 rounded-lg max-w-4xl w-full overflow-y-auto max-h-[85vh]">
						<h2 className="text-2xl font-bold mb-4">Szczegóły zlecenia</h2>

						<div className="space-y-4 text-sm">
							<div>
								<h3 className="font-semibold text-lg mb-1">Informacje podstawowe</h3>
								<p><strong>Nr zlecenia:</strong> {selectedZlecenie.numer_zlecenia}</p>
								<p><strong>Osoba kontaktowa:</strong> {selectedZlecenie.osoba_kontaktowa}</p>
								<p><strong>Telefon:</strong> {selectedZlecenie.telefon_kontaktowy}</p>
								<p><strong>Email:</strong> {selectedZlecenie.email_kontaktowy}</p>
							</div>

							<div>
								<h3 className="font-semibold text-lg mb-1">Zleceniodawca</h3>
								<p><strong>Nazwa:</strong> {selectedZlecenie.zl_nazwa}</p>
								<p><strong>Adres:</strong> {selectedZlecenie.zl_ulica}, {selectedZlecenie.zl_kod_pocztowy} {selectedZlecenie.zl_miasto}, {selectedZlecenie.zl_panstwo}</p>
								<p><strong>VAT:</strong> {selectedZlecenie.zl_vat}</p>
								<p><strong>NIP:</strong> {selectedZlecenie.zl_nip}</p>
								<p><strong>REGON:</strong> {selectedZlecenie.zl_regon}</p>
								<p><strong>EORI:</strong> {selectedZlecenie.zl_eori}</p>
								<p><strong>PESEL:</strong> {selectedZlecenie.zl_pesel}</p>
							</div>

							<div>
								<h3 className="font-semibold text-lg mb-1">Załadunek</h3>
								<p><strong>Data:</strong> {formatDateRange(selectedZlecenie.pickup_date_start, selectedZlecenie.pickup_date_end)}</p>
								<p><strong>Godzina:</strong> {selectedZlecenie.pickup_time || `${selectedZlecenie.pickup_time_start || ""} – ${selectedZlecenie.pickup_time_end || ""}`}</p>
								<p><strong>Adresy odbioru:</strong></p>
								<ul className="list-disc pl-5">
									{safeParseArray(selectedZlecenie.adresy_odbioru_json).map((a, i) => (
										<li key={i}>{a.nazwa}, {a.ulica}, {a.kod} {a.miasto}, {a.panstwo}</li>
									))}
								</ul>
							</div>

							<div>
								<h3 className="font-semibold text-lg mb-1">Rozładunek</h3>
								<p><strong>Data:</strong> {formatDateRange(selectedZlecenie.delivery_date_start, selectedZlecenie.delivery_date_end)}</p>
								<p><strong>Godzina:</strong> {selectedZlecenie.delivery_time || `${selectedZlecenie.delivery_time_start || ""} – ${selectedZlecenie.delivery_time_end || ""}`}</p>
								<p><strong>Adresy dostawy:</strong></p>
								<ul className="list-disc pl-5">
									{safeParseArray(selectedZlecenie.adresy_dostawy_json).map((a, i) => (
										<li key={i}>{a.nazwa}, {a.ulica}, {a.kod} {a.miasto}, {a.panstwo}</li>
									))}
								</ul>
							</div>

							<div>
								<h3 className="font-semibold text-lg mb-1">Towar</h3>
								<p><strong>Ilość palet:</strong> {selectedZlecenie.palety}</p>
								<p><strong>Waga:</strong> {selectedZlecenie.waga}</p>
								<p><strong>Wymiar:</strong> {selectedZlecenie.wymiar}</p>
								<p><strong>LDM:</strong> {selectedZlecenie.ldm}</p>
							</div>

							<div>
								<h3 className="font-semibold text-lg mb-1">Fracht i płatność</h3>
								<p><strong>Cena:</strong> {selectedZlecenie.cena} {getCurrencySymbol(selectedZlecenie.waluta)}</p>
								<p><strong>Termin płatności:</strong> {selectedZlecenie.termin_dni} dni</p>
								<p><strong>Wysłać e-mailem:</strong> {selectedZlecenie.wyslac_email ? "Tak" : "Nie"}</p>
								<p><strong>Wysłać pocztą:</strong> {selectedZlecenie.wyslac_poczta ? "Tak" : "Nie"}</p>
							</div>

							<div>
								<h3 className="font-semibold text-lg mb-1">Uwagi</h3>
								<p>{selectedZlecenie.uwagi || "-"}</p>
							</div>
						</div>

						<div className="text-right mt-4 flex justify-end">
							<button
								className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
								onClick={() => {
									setShowModal(false);
									if (selectedZlecenie.typ === "Export") {
										navigate(`/zlecenia/export/edytuj/${selectedZlecenie.id}`);
									} else if (selectedZlecenie.typ === "Import") {
										navigate(`/zlecenia/import/edytuj/${selectedZlecenie.id}`);
									} else {
										navigate(`/zlecenia/pozostale/edytuj/${selectedZlecenie.id}`);
									}
								}}
							>
								Edytuj
							</button>
							<button
								className="ml-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
								onClick={() => setShowModal(false)}
							>
								Zamknij
							</button>
						</div>
					</div>
				</div>
			)}	
    </div>
  );
}
