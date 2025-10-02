import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { getCurrencySymbol } from '../../utils/currency';
import { useZaktualizowaniImportowiKontrahenci } from '../../hooks/useZaktualizowaniImportowiKontrahenci';

export default function ListaZlecenImport() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedZlecenie, setSelectedZlecenie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [allSelected, setAllSelected] = useState(false);
  const { zlecenia } = useZaktualizowaniImportowiKontrahenci();

  useEffect(() => {
    const base = zlecenia || [];
    setRows(base); // baza do filtrowania
    setFilteredRows(base); // to, co wyświetlasz
  }, [zlecenia]);

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedRows([]);
      setAllSelected(false);
    } else {
      const allIds = filteredRows.map((row) => row.id);
      setSelectedRows(allIds);
      setAllSelected(true);
    }
  };

  const openModal = (zlecenie) => {
    setSelectedZlecenie(zlecenie);
    setShowModal(true);
  };

  const formatDateRange = (start, end) => {
    if (!start) return '-';
    const dStart = new Date(start);
    const dEnd = end ? new Date(end) : null;

    const fmt = (d) =>
      `${String(d.getDate()).padStart(2, '0')}.${String(
        d.getMonth() + 1,
      ).padStart(2, '0')}.${d.getFullYear()}`;
    const fmtShort = (d) =>
      `${String(d.getDate()).padStart(2, '0')}.${String(
        d.getMonth() + 1,
      ).padStart(2, '0')}`;

    if (!dEnd || fmt(dStart) === fmt(dEnd)) return fmt(dStart);

    const sameYear = dStart.getFullYear() === dEnd.getFullYear();
    return sameYear
      ? `${fmtShort(dStart)} – ${fmt(dEnd)}`
      : `${fmt(dStart)} – ${fmt(dEnd)}`;
  };

  const handleFilterChange = (column, value) => {
    const v = (value ?? '').toString().toLowerCase().trim();

    // gdy pusto – zdejmij filtr dla tej kolumny
    const newFilters = { ...filters };
    if (v === '') {
      delete newFilters[column];
    } else {
      newFilters[column] = v;
    }
    setFilters(newFilters);

    setFilteredRows(
      (rows || []).filter((row) => {
        return Object.entries(newFilters).every(([key, val]) => {
          let cell = '';

          if (key === 'pickup_date') {
            cell = formatDateRange(row.pickup_date_start, row.pickup_date_end);
          } else if (key === 'delivery_date') {
            cell = formatDateRange(
              row.delivery_date_start,
              row.delivery_date_end,
            );
          } else if (key === 'pickup_address') {
            const a = safeParseArray(row.adresy_odbioru_json)[0];
            cell = a ? `${a.kod || ''} ${a.miasto || ''}`.trim() : '';
          } else if (key === 'delivery_address') {
            const a = safeParseArray(row.adresy_dostawy_json)[0];
            cell = a ? `${a.kod || ''} ${a.miasto || ''}`.trim() : '';
          } else if (key === 'identyfikator') {
            cell =
              row.zl_vat ||
              row.zl_nip ||
              row.zl_regon ||
              row.zl_eori ||
              row.zl_pesel ||
              '';
          } else {
            cell = row[key] ?? '';
          }

          return String(cell).toLowerCase().includes(val);
        });
      }),
    );
  };

  const handleDeleteSelected = async () => {
    if (
      !window.confirm(`Na pewno chcesz usunąć ${selectedRows.length} zleceń?`)
    )
      return;

    const { error } = await supabase
      .from('zlecenia_import')
      .delete()
      .in('id', selectedRows);

    if (error) {
      console.error('Błąd usuwania:', error);
    } else {
      const newRows = rows.filter((row) => !selectedRows.includes(row.id));
      setRows(newRows);
      setFilteredRows(newRows);
      setSelectedRows([]);
      setAllSelected(false);
    }
  };

  function safeParseArray(value) {
    if (value == null) return [];
    if (Array.isArray(value)) return value; // gdy z DB przychodzi już tablica (jsonb)
    if (typeof value === 'object') return []; // obiekt ≠ lista adresów
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  const exportAddr =
    selectedZlecenie?.export_customs_adres_json &&
    typeof selectedZlecenie.export_customs_adres_json === 'string'
      ? JSON.parse(selectedZlecenie.export_customs_adres_json)
      : selectedZlecenie?.export_customs_adres_json;

  const importAddr =
    selectedZlecenie?.import_customs_adres_json &&
    typeof selectedZlecenie.import_customs_adres_json === 'string'
      ? JSON.parse(selectedZlecenie.import_customs_adres_json)
      : selectedZlecenie?.import_customs_adres_json;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lista zleceń importowych</h1>
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full text-sm text-left text-gray-800">
          <thead className="bg-gray-100 text-xs uppercase font-semibold tracking-wide">
            <tr>
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={allSelected}
                />
              </th>
              <th className="px-4 py-3 w-48">Nr zlecenia</th>
              <th className="px-4 py-3 w-48">Zleceniodawca</th>
              <th className="px-4 py-3 w-48">Identyfikator</th>
              <th className="px-4 py-3 w-52">Data załadunku</th>
              <th className="px-4 py-3 w-52">Godzina załadunku</th>
              <th className="px-4 py-3 w-52">Data rozładunku</th>
              <th className="px-4 py-3 w-52">Godzina rozładunku</th>
              <th className="px-4 py-3 w-56">Adres załadunku</th>
              <th className="px-4 py-3 w-56">Adres rozładunku</th>
              <th className="px-4 py-3 w-28">LDM</th>
              <th className="px-4 py-3 w-28">Cena</th>
              <th className="px-4 py-3 w-72">Uwagi</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50">
              <td className="px-4 py-2"></td>
              {[
                { key: 'numer_zlecenia' },
                { key: 'zl_nazwa' },
                { key: 'identyfikator' },
                { key: 'pickup_date' },
                { key: 'pickup_time' },
                { key: 'delivery_date' },
                { key: 'delivery_time' },
                { key: 'pickup_address' },
                { key: 'delivery_address' },
                { key: 'ldm' },
                { key: 'cena' },
                { key: 'uwagi' },
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
            {filteredRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => openModal(row)}
                className="hover:bg-gray-50 cursor-pointer divide-y divide-gray-200"
              >
                <td className="px-4 py-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => handleSelectRow(row.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {row.numer_zlecenia}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{row.zl_nazwa}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {row.zl_vat ||
                    row.zl_nip ||
                    row.zl_regon ||
                    row.zl_eori ||
                    row.zl_pesel ||
                    '-'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatDateRange(row.pickup_date_start, row.pickup_date_end)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {row.pickup_time ||
                    (row.pickup_time_start &&
                      `${row.pickup_time_start} – ${row.pickup_time_end}`) ||
                    '-'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatDateRange(
                    row.delivery_date_start,
                    row.delivery_date_end,
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {row.delivery_time ||
                    (row.delivery_time_start &&
                      `${row.delivery_time_start} – ${row.delivery_time_end}`) ||
                    '-'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {(() => {
                    const a = safeParseArray(row.adresy_odbioru_json)[0];
                    return a ? `${a.kod || '-'} ${a.miasto || '-'}` : '-';
                  })()}
                </td>

                <td className="px-4 py-2 whitespace-nowrap">
                  {(() => {
                    const a = safeParseArray(row.adresy_dostawy_json)[0];
                    return a ? `${a.kod || '-'} ${a.miasto || '-'}` : '-';
                  })()}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{row.ldm}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {row.cena} {getCurrencySymbol(row.waluta)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{row.uwagi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRows.length > 0 && (
        <button
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={handleDeleteSelected}
        >
          Usuń zaznaczone ({selectedRows.length})
        </button>
      )}

      {showModal && selectedZlecenie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full overflow-y-auto max-h-[85vh]">
            <h2 className="text-2xl font-bold mb-4">Szczegóły zlecenia</h2>

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Informacje podstawowe
                </h3>
                <p>
                  <strong>Nr zlecenia:</strong>{' '}
                  {selectedZlecenie.numer_zlecenia}
                </p>
                <p>
                  <strong>Osoba kontaktowa:</strong>{' '}
                  {selectedZlecenie.osoba_kontaktowa}
                </p>
                <p>
                  <strong>Telefon:</strong>{' '}
                  {selectedZlecenie.telefon_kontaktowy}
                </p>
                <p>
                  <strong>Email:</strong> {selectedZlecenie.email_kontaktowy}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Zleceniodawca</h3>
                <p>
                  <strong>Nazwa:</strong> {selectedZlecenie.zl_nazwa}
                </p>
                <p>
                  <strong>Adres:</strong> {selectedZlecenie.zl_ulica},{' '}
                  {selectedZlecenie.zl_kod_pocztowy}{' '}
                  {selectedZlecenie.zl_miasto}, {selectedZlecenie.zl_panstwo}
                </p>
                <p>
                  <strong>VAT:</strong> {selectedZlecenie.zl_vat}
                </p>
                <p>
                  <strong>NIP:</strong> {selectedZlecenie.zl_nip}
                </p>
                <p>
                  <strong>REGON:</strong> {selectedZlecenie.zl_regon}
                </p>
                <p>
                  <strong>EORI:</strong> {selectedZlecenie.zl_eori}
                </p>
                <p>
                  <strong>PESEL:</strong> {selectedZlecenie.zl_pesel}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Załadunek</h3>
                <p>
                  <strong>Data:</strong>{' '}
                  {formatDateRange(
                    selectedZlecenie.pickup_date_start,
                    selectedZlecenie.pickup_date_end,
                  )}
                </p>
                <p>
                  <strong>Godzina:</strong>{' '}
                  {selectedZlecenie.pickup_time ||
                    `${selectedZlecenie.pickup_time_start || ''} – ${selectedZlecenie.pickup_time_end || ''}`}
                </p>
                <p>
                  <strong>Adresy odbioru:</strong>
                </p>
                <ul className="list-disc pl-5">
                  {safeParseArray(selectedZlecenie.adresy_odbioru_json).map(
                    (a, i) => (
                      <li key={i}>
                        {a.nazwa}, {a.ulica}, {a.kod} {a.miasto}, {a.panstwo}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Rozładunek</h3>
                <p>
                  <strong>Data:</strong>{' '}
                  {formatDateRange(
                    selectedZlecenie.delivery_date_start,
                    selectedZlecenie.delivery_date_end,
                  )}
                </p>
                <p>
                  <strong>Godzina:</strong>{' '}
                  {selectedZlecenie.delivery_time ||
                    `${selectedZlecenie.delivery_time_start || ''} – ${selectedZlecenie.delivery_time_end || ''}`}
                </p>
                <p>
                  <strong>Adresy dostawy:</strong>
                </p>
                <ul className="list-disc pl-5">
                  {safeParseArray(selectedZlecenie.adresy_dostawy_json).map(
                    (a, i) => (
                      <li key={i}>
                        {a.nazwa}, {a.ulica}, {a.kod} {a.miasto}, {a.panstwo}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Towar</h3>
                <p>
                  <strong>Ilość palet:</strong> {selectedZlecenie.palety}
                </p>
                <p>
                  <strong>Waga:</strong> {selectedZlecenie.waga}
                </p>
                <p>
                  <strong>Wymiar:</strong> {selectedZlecenie.wymiar}
                </p>
                <p>
                  <strong>LDM:</strong> {selectedZlecenie.ldm}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Cło</h3>
                <p>
                  <strong>Odprawa celna exportowa:</strong>{' '}
                  {selectedZlecenie.export_customs_option}
                </p>
                <p>
                  <strong>Adres export:</strong>
                </p>
                {(() => {
                  const option = selectedZlecenie.export_customs_option;

                  if (option === 'adres' && exportAddr) {
                    return (
                      <div className="text-sm leading-tight ml-5">
                        <p>{exportAddr.nazwa}</p>
                        <p>{exportAddr.ulica}</p>
                        <p>
                          {exportAddr.kod} {exportAddr.miasto}
                        </p>
                        <p>{exportAddr.panstwo}</p>
                        {exportAddr.uwagi && (
                          <p className="italic">({exportAddr.uwagi})</p>
                        )}
                      </div>
                    );
                  }

                  if (option === 'sevington') {
                    return (
                      <p className="text-sm italic text-gray-500 ml-5">
                        Sevington IBF
                      </p>
                    );
                  }

                  if (option === 'smartborder') {
                    return (
                      <p className="text-sm italic text-gray-500 ml-5">
                        Smart Border
                      </p>
                    );
                  }

                  return (
                    <p className="text-sm italic text-gray-500 ml-5">
                      W miejscu odbioru towaru
                    </p>
                  );
                })()}

                <p>
                  <strong>Odprawa celna importowa:</strong>{' '}
                  {selectedZlecenie.import_customs_option}
                </p>
                <p>
                  <strong>Adres import:</strong>
                </p>
                {selectedZlecenie.import_customs_option === 'adres' &&
                importAddr ? (
                  <div className="text-sm leading-tight ml-5">
                    <p>{importAddr.nazwa}</p>
                    <p>{importAddr.ulica}</p>
                    <p>
                      {importAddr.kod} {importAddr.miasto}
                    </p>
                    <p>{importAddr.panstwo}</p>
                    {importAddr.uwagi && (
                      <p className="italic">({importAddr.uwagi})</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm italic text-gray-500 ml-5">
                    W miejscu dostawy towaru
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Fracht i płatność
                </h3>
                <p>
                  <strong>Cena:</strong> {selectedZlecenie.cena}{' '}
                  {getCurrencySymbol(selectedZlecenie.waluta)}
                </p>
                <p>
                  <strong>Termin płatności:</strong>{' '}
                  {selectedZlecenie.termin_dni} dni
                </p>
                <p>
                  <strong>Wysłać e-mailem:</strong>{' '}
                  {selectedZlecenie.wyslac_email ? 'Tak' : 'Nie'}
                </p>
                <p>
                  <strong>Wysłać pocztą:</strong>{' '}
                  {selectedZlecenie.wyslac_poczta ? 'Tak' : 'Nie'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Uwagi</h3>
                <p>{selectedZlecenie.uwagi || '-'}</p>
              </div>
            </div>

            <div className="text-right mt-4 flex justify-end gsap-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
                onClick={() => {
                  setShowModal(false);
                  navigate(`/zlecenia/import/edytuj/${selectedZlecenie.id}`);
                }}
              >
                Edytuj
              </button>

              <button
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
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
