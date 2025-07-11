import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { getCurrencySymbol } from "../../utils/currency";

export default function WykazExportLTL() {
  console.log("🔥 Komponent WykazExportLTL się renderuje");
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [allSelected, setAllSelected] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log("🔍 Startuje fetchData...");
      const { data, error } = await supabase
        .from("zlecenia_export")
        .select("*")
        .neq("ldm", "FTL")
        .order("delivery_date_start", { ascending: true });

      console.log("Zlecenia z Supabase:", data);

      if (error) {
        console.error("Błąd ładowania danych:", error);
      } else {
        setRows(data);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.toLocaleDateString("pl-PL", {
      weekday: "long",
    })}, ${date.toLocaleDateString("pl-PL")}`;
  };

  const safeParse = (value) => {
    try {
      return JSON.parse(value || "[]");
    } catch {
      return [];
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedRows([]);
      setAllSelected(false);
    } else {
      const allIds = rows.map((row) => row.id);
      setSelectedRows(allIds);
      setAllSelected(true);
    }
  };

  const handleHideSelected = () => {
    const newRows = rows.filter((row) => !selectedRows.includes(row.id));
    setRows(newRows);
    setSelectedRows([]);
    setAllSelected(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const visibleRows = rows;

  return (
    <div>
      <style>{`
        @media print {
          @page {
            size: A3 landscape;
          }
          body * {
            visibility: hidden;
          }
          #printableTable, #printableTable * {
            visibility: visible;
          }
          #printableTable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <h1 className="text-2xl font-bold mb-4 no-print">Wykaz LTL - Export</h1>

      <div className="no-print mb-4">
        {selectedRows.length > 0 && (
          <button
            className="mr-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={handleHideSelected}
          >
            Ukryj zaznaczone ({selectedRows.length})
          </button>
        )}

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handlePrint}
        >
          Drukuj {selectedRows.length > 0 ? "zaznaczone" : "wszystkie"}
        </button>
      </div>

      <div id="printableTable" className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full text-sm text-left text-gray-800">
          <thead className="bg-gray-100 text-xs uppercase font-semibold tracking-wide">
            <tr>
              <th className="px-4 py-3 text-center no-print">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={allSelected}
                />
              </th>
              <th className="px-4 py-3 text-center">Zleceniodawca</th>
              <th className="px-4 py-3 text-center">Data załadunku</th>
              <th className="px-4 py-3 text-center">Adres załadunku</th>
              <th className="px-4 py-3 text-center">Cło</th>
              <th className="px-4 py-3 text-center">Ilość palet</th>
              <th className="px-4 py-3 text-center">Wymiar</th>
              <th className="px-4 py-3 text-center">LDM</th>
              <th className="px-4 py-3 text-center">Waga</th>
              <th className="px-4 py-3 text-center">Adres rozładunku</th>
              <th className="px-4 py-3 text-center">Data rozładunku</th>
              <th className="px-4 py-3 text-center">Cena</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              console.log(row);
              return (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 border-b border-gray-300"
                >
                  <td className="px-4 py-2 text-center no-print">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                    />
                  </td>
                  <td className="px-4 py-2 text-center">{row.zl_nazwa}</td>
                  <td className="px-4 py-2 text-center">
                    {formatDate(row.pickup_date_start)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {safeParse(row.adresy_odbioru_json)[0]?.miasto ||
                      row.zl_miasto?.trim() || "-"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {row.export_customs_option === "adres"
                      ? safeParse(row.export_customs_adres_json)?.miasto || "-"
                      : row.export_customs_option === "odbior"
                      ? "Na zał"
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-center">{row.palety || "-"}</td>
                  <td className="px-4 py-2 text-center">{row.wymiar || "-"}</td>
                  <td className="px-4 py-2 text-center">{row.ldm || "-"}</td>
                  <td className="px-4 py-2 text-center">{row.waga || "-"}</td>
                  <td className="px-4 py-2 text-center">
                    {safeParse(row.adresy_dostawy_json)[0]?.kod ||
                      row.zl_kod_pocztowy?.trim() || "-"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {formatDate(row.delivery_date_start)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {row.cena} {getCurrencySymbol(row.waluta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}