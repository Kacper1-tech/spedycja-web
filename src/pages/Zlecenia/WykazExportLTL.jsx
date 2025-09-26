import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { getCurrencySymbol } from '../../utils/currency';

export default function WykazExportLTL() {
  console.log('🔥 Komponent WykazExportLTL się renderuje');
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [allSelectedByWeek, setAllSelectedByWeek] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      console.log('🔍 Startuje fetchData...');
      const { data, error } = await supabase
        .from('zlecenia_export')
        .select('*')
        .neq('ldm', 'FTL')
        .order('delivery_date_start', { ascending: false })
        .order('pickup_date_start', { ascending: false })
        // ewentualnie nazwa na końcu rosnąco, ale to już drugorzędne
        .order('zl_nazwa', { ascending: true });

      console.log('Zlecenia z Supabase:', data);

      if (error) {
        console.error('Błąd ładowania danych:', error);
      } else {
        setRows(data);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pl-PL', {
      weekday: 'long',
    })}, ${date.toLocaleDateString('pl-PL')}`;
  };

  const safeParse = (value) => {
    try {
      return JSON.parse(value || '[]');
    } catch {
      return [];
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const handleSelectAllForWeek = (weekNumber, rowsInWeek) => {
    const allSelected = allSelectedByWeek[weekNumber] || false;

    if (allSelected) {
      // Odznacz tylko w tym tygodniu
      const remaining = selectedRows.filter(
        (id) => !rowsInWeek.some((row) => row.id === id),
      );
      setSelectedRows(remaining);
    } else {
      // Zaznacz tylko w tym tygodniu
      const newIds = rowsInWeek.map((row) => row.id);
      const unique = Array.from(new Set([...selectedRows, ...newIds]));
      setSelectedRows(unique);
    }

    setAllSelectedByWeek({
      ...allSelectedByWeek,
      [weekNumber]: !allSelected,
    });
  };

  const handleHideSelected = () => {
    const newRows = rows.filter((row) => !selectedRows.includes(row.id));
    setRows(newRows);
    setSelectedRows([]);
  };

  function getWeekNumber(dateString) {
    const date = new Date(dateString);
    // Ustaw poniedziałek jako pierwszy dzień tygodnia
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((date.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7,
      )
    );
  }

  const groupedRows = rows.reduce((acc, row) => {
    const week = getWeekNumber(row.pickup_date_start) || 0;
    (acc[week] ||= []).push(row);
    return acc;
  }, {});

  const sortedWeeks = Object.keys(groupedRows)
    .map(Number)
    .sort((a, b) => {
      if (a === 0) return 1; // 0 na dół
      if (b === 0) return -1;
      return b - a; // malejąco: 52, 51, 50...
    });

  const handlePrintForWeek = (weekNumber) => {
    const rowsInWeek = groupedRows[weekNumber];
    const selectedRowsInWeek = rowsInWeek.filter((row) =>
      selectedRows.includes(row.id),
    );

    if (selectedRowsInWeek.length === 0) {
      alert('Nie zaznaczono żadnych wierszy do druku.');
      return;
    }

    const formatCustoms = (row) => {
      if (row.export_customs_option === 'adres') {
        return safeParse(row.export_customs_adres_json)?.miasto || '-';
      }
      if (row.export_customs_option === 'odbior') {
        return 'Na zał';
      }
      return '-';
    };

    const rowsHTML = selectedRowsInWeek
      .map((row) => {
        const odbiorMiasto =
          safeParse(row.adresy_odbioru_json)[0]?.miasto || row.zl_miasto || '-';
        const dostawaKod =
          safeParse(row.adresy_dostawy_json)[0]?.kod ||
          row.zl_kod_pocztowy ||
          '-';

        return `
        <tr>
          <td>${row.zl_nazwa}</td>
          <td>${formatDate(row.pickup_date_start)}</td>
          <td>${odbiorMiasto}</td>
          <td>${formatCustoms(row)}</td>
          <td>${row.palety || '-'}</td>
          <td>${row.wymiar || '-'}</td>
          <td>${row.ldm || '-'}</td>
          <td>${row.waga || '-'}</td>
          <td>${dostawaKod}</td>
          <td>${formatDate(row.delivery_date_start)}</td>
          <td>${row.cena} ${getCurrencySymbol(row.waluta)}</td>
        </tr>
      `;
      })
      .join('');

    // Tworzenie całego HTML
    const doc = document.implementation.createHTMLDocument(
      `Wykaz LTL - Tydzień ${weekNumber}`,
    );

    // Tworzenie style
    const style = doc.createElement('style');
    style.textContent = `
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12pt;
    }
    th, td {
      border: 1px solid #333;
      padding: 8px 12px;
      text-align: center;
    }
    th {
      background-color: #f0f0f0;
    }
    tr:nth-child(even) {
      background-color: #fafafa;
    }
  `;

    const body = doc.body;
    body.innerHTML = `
    <h1>Wykaz LTL - Tydzień ${weekNumber}</h1>
    <table>
      <thead>
        <tr>
          <th>Zleceniodawca</th>
          <th>Data załadunku</th>
          <th>Adres załadunku</th>
          <th>Cło</th>
          <th>Ilość palet</th>
          <th>Wymiar</th>
          <th>LDM</th>
          <th>Waga</th>
          <th>Adres rozładunku</th>
          <th>Data rozładunku</th>
          <th>Cena</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHTML}
      </tbody>
    </table>
  `;

    doc.head.appendChild(style);

    const printWindow = window.open('', '', 'width=1024,height=768');
    if (printWindow) {
      printWindow.document.documentElement.innerHTML =
        doc.documentElement.innerHTML;
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <div>
      <style>{`
          @page {
            size: A3 landscape;
      `}</style>

      <h1 className="text-2xl font-bold mb-4 no-print">Wykaz LTL - Export</h1>

      {sortedWeeks.map((weekNumber) => {
        const rowsInWeek = groupedRows[weekNumber];

        return (
          <div key={weekNumber} className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Tydzień {weekNumber}</h2>

              <div className="no-print flex gap-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => handlePrintForWeek(weekNumber)}
                >
                  Drukuj tydzień {weekNumber}
                </button>

                {selectedRows.length > 0 && (
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={handleHideSelected}
                  >
                    Ukryj zaznaczone ({selectedRows.length})
                  </button>
                )}
              </div>
            </div>

            {/* 🔵 Unikalny ID dla tego tygodnia */}
            <div
              id={`printableTable-${weekNumber}`}
              className="overflow-x-auto rounded-lg shadow border border-gray-200"
            >
              <table className="min-w-full text-sm text-left text-gray-800">
                <thead className="bg-gray-100 text-xs uppercase font-semibold tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        className="no-print"
                        onChange={() =>
                          handleSelectAllForWeek(weekNumber, rowsInWeek)
                        }
                        checked={allSelectedByWeek[weekNumber] || false}
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
                  {rowsInWeek.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 border-b border-gray-300 ${
                        selectedRows.includes(row.id) ? 'selected' : ''
                      }`}
                    >
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          className="no-print"
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
                          row.zl_miasto?.trim() ||
                          '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {(() => {
                          if (row.export_customs_option === 'adres') {
                            return (
                              safeParse(row.export_customs_adres_json)
                                ?.miasto || '-'
                            );
                          }
                          if (row.export_customs_option === 'odbior') {
                            return 'Na zał';
                          }
                          return '-';
                        })()}
                      </td>

                      <td className="px-4 py-2 text-center">
                        {row.palety || '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.wymiar || '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.ldm || '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.waga || '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {safeParse(row.adresy_dostawy_json)[0]?.kod ||
                          row.zl_kod_pocztowy?.trim() ||
                          '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {formatDate(row.delivery_date_start)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.cena} {getCurrencySymbol(row.waluta)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
