import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import React from 'react';
import { getCurrencySymbol } from '../utils/currency';

const safeParse = (val) => {
  try {
    return JSON.parse(val || '[]');
  } catch {
    return [];
  }
};

export default function TransportTab() {
  const [planRows, setPlanRows] = useState([]); // lewa tabela
  const [orders, setOrders] = useState([]); // prawa tabela

  const [driverName, setDriverName] = useState('');
  const [dateSeparator, setDateSeparator] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);

  const [newImport, setNewImport] = useState('');
  const [note, setNote] = useState('');
  const [newExportData, setNewExportData] = useState('');
  const [newImportData, setNewImportData] = useState('');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedExportIndex, setSelectedExportIndex] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    index: null,
  });
  const [selectedImportIndex, setSelectedImportIndex] = useState(null);
  const [draggedRowId, setDraggedRowId] = useState(null);
  const [showPlanPanel, setShowPlanPanel] = useState(false);
  const [exportOrders, setExportOrders] = useState([]);
  const [importOrders, setImportOrders] = useState([]);
  const [pozostaleOrders, setPozostaleOrders] = useState([]);
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [hiddenOrders, setHiddenOrders] = useState([]);
  const [filterZleceniodawca, setFilterZleceniodawca] = useState('');

  useEffect(() => {
    fetchPlan();
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleClick = () =>
      setContextMenu({ show: false, x: 0, y: 0, index: null });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const fetchPlan = async () => {
    const { data, error } = await supabase
      .from('transport_plan')
      .select('*')
      .order('kolejnosc'); // <-- TU!
    if (error) console.error(error);
    else setPlanRows(data);
  };

  const sortByDeliveryThenPickup = (a, b) => {
    const deliveryA = a.delivery_date_start
      ? new Date(a.delivery_date_start)
      : new Date('2100-12-31');
    const deliveryB = b.delivery_date_start
      ? new Date(b.delivery_date_start)
      : new Date('2100-12-31');

    if (deliveryA.getTime() !== deliveryB.getTime()) {
      return deliveryA - deliveryB;
    }

    const pickupA = a.pickup_date_start
      ? new Date(a.pickup_date_start)
      : new Date('2100-12-31');
    const pickupB = b.pickup_date_start
      ? new Date(b.pickup_date_start)
      : new Date('2100-12-31');

    return pickupA - pickupB;
  };

  const fetchOrders = async () => {
    const { data: exportData } = await supabase
      .from('zlecenia_export')
      .select('*')
      .eq('hidden_in_transport', false);

    const { data: importData } = await supabase
      .from('zlecenia_import')
      .select('*')
      .eq('hidden_in_transport', false);

    const { data: pozostaleData } = await supabase
      .from('zlecenia_pozostale')
      .select('*')
      .eq('hidden_in_transport', false);

    const sortByPickupDate = (a, b) =>
      new Date(a.pickup_date_start || '2100-12-31') -
      new Date(b.pickup_date_start || '2100-12-31');

    setExportOrders((exportData || []).slice().sort(sortByDeliveryThenPickup));
    setImportOrders((importData || []).slice().sort(sortByPickupDate));
    setPozostaleOrders((pozostaleData || []).slice().sort(sortByPickupDate));

    setOrders([
      ...(exportData || []),
      ...(importData || []),
      ...(pozostaleData || []),
    ]);
  };

  const fetchHiddenOrders = async () => {
    const { data: exportHidden } = await supabase
      .from('zlecenia_export')
      .select('*')
      .eq('hidden_in_transport', true);

    const { data: importHidden } = await supabase
      .from('zlecenia_import')
      .select('*')
      .eq('hidden_in_transport', true);

    const { data: pozostaleHidden } = await supabase
      .from('zlecenia_pozostale')
      .select('*')
      .eq('hidden_in_transport', true);

    setHiddenOrders([
      ...(exportHidden || []).map((o) => ({ ...o, typ: 'Export' })),
      ...(importHidden || []).map((o) => ({ ...o, typ: 'Import' })),
      ...(pozostaleHidden || []).map((o) => ({ ...o, typ: 'Pozostałe' })),
    ]);
  };

  const handleUnhideOrder = async (order) => {
    let tableName = '';

    if (order.typ === 'Export') {
      tableName = 'zlecenia_export';
    } else if (order.typ === 'Import') {
      tableName = 'zlecenia_import';
    } else {
      tableName = 'zlecenia_pozostale';
    }

    const { error } = await supabase
      .from(tableName)
      .update({ hidden_in_transport: false })
      .eq('id', order.id);

    if (error) {
      console.error(error);
      alert('Błąd podczas przywracania zlecenia.');
      return;
    }

    // Użyj istniejącego obiektu + nowa flaga
    const restored = { ...order, hidden_in_transport: false };

    // Usuń z modala
    setHiddenOrders((prev) => prev.filter((o) => o.id !== order.id));

    // Dodaj do listy
    if (order.typ === 'Export') {
      setExportOrders((prev) => [...prev, restored]);
    } else if (order.typ === 'Import') {
      setImportOrders((prev) => [...prev, restored]);
    } else {
      setPozostaleOrders((prev) => [...prev, restored]);
    }

    alert('Zlecenie pokazane w liście!');
  };

  const handleAddDriver = async () => {
    // Zwiększ istniejących
    for (let row of planRows) {
      await supabase
        .from('transport_plan')
        .update({ kolejnosc: (row.kolejnosc || 0) + 1 })
        .eq('id', row.id);
    }

    // Dodaj nowego z kolejnosc = 0
    await supabase.from('transport_plan').insert({
      kierowca: driverName,
      export: [],
      import: [],
      uwagi: '',
      kolejnosc: 0,
    });

    fetchPlan();
    setDriverName('');
  };

  const handleEditDriver = async () => {
    if (!selectedRow) return;
    await supabase
      .from('transport_plan')
      .update({ kierowca: driverName })
      .eq('id', selectedRow.id);
    fetchPlan();
    setDriverName('');
    setSelectedRow(null);
  };

  const handleAddSeparator = async () => {
    // Zwiększ kolejnosc wszystkim istniejącym wierszom o 1
    for (let row of planRows) {
      await supabase
        .from('transport_plan')
        .update({ kolejnosc: (row.kolejnosc || 0) + 1 })
        .eq('id', row.id);
    }

    // Dodaj nowy separator na górę z kolejnosc = 0
    await supabase.from('transport_plan').insert({
      kierowca: `--- ${dateSeparator} ---`,
      export: [],
      import: [],
      uwagi: '',
      kolejnosc: 0,
    });

    fetchPlan();
    setDateSeparator('');
  };

  const handleEditSeparator = async () => {
    if (!selectedRow) return;
    if (!selectedRow.kierowca.startsWith('---')) return; // Tylko separator
    await supabase
      .from('transport_plan')
      .update({ kierowca: `--- ${dateSeparator} ---` })
      .eq('id', selectedRow.id);
    fetchPlan();
    setDateSeparator('');
    setSelectedRow(null);
  };

  const handleDeleteRow = async (id) => {
    await supabase.from('transport_plan').delete().eq('id', id);
    fetchPlan();
  };

  const handleHideOrder = async (order) => {
    let tableName = '';

    if (exportOrders.find((e) => e.id === order.id)) {
      tableName = 'zlecenia_export';
    } else if (importOrders.find((i) => i.id === order.id)) {
      tableName = 'zlecenia_import';
    } else if (pozostaleOrders.find((p) => p.id === order.id)) {
      tableName = 'zlecenia_pozostale';
    } else {
      alert('Nie można rozpoznać typu zlecenia.');
      return;
    }

    const { error } = await supabase
      .from(tableName)
      .update({ hidden_in_transport: true })
      .eq('id', order.id);

    if (error) {
      console.error(error);
      alert('Błąd podczas ukrywania zlecenia.');
    } else {
      alert('Zlecenie ukryte.');
      fetchOrders();
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedRow) return;
    await supabase
      .from('transport_plan')
      .update({ uwagi: note })
      .eq('id', selectedRow.id);
    fetchPlan();
    setNote('');
  };

  const handleDeleteNote = async () => {
    if (!selectedRow) return;
    await supabase
      .from('transport_plan')
      .update({ uwagi: '' })
      .eq('id', selectedRow.id);
    fetchPlan();
    setNote('');
  };

  const handleAddExport = async () => {
    if (!selectedRow) return;
    if (!selectedOrderNumber) return;

    const newEntry = {
      numer: selectedOrderNumber,
      dane: newExportData,
    };
    const updated = [...(selectedRow.export || []), newEntry];

    await supabase
      .from('transport_plan')
      .update({ export: updated })
      .eq('id', selectedRow.id);
    fetchPlan();
    setSelectedOrderNumber('');
    setNewExportData('');
  };

  const handleEditExport = async () => {
    if (!selectedRow) return;
    if (selectedExportIndex === null) return;

    const updated = [...(selectedRow.export || [])];
    updated[selectedExportIndex] = {
      numer: selectedOrderNumber,
      dane: newExportData,
    };

    await supabase
      .from('transport_plan')
      .update({ export: updated })
      .eq('id', selectedRow.id);
    fetchPlan();
    setSelectedExportIndex(null);
    setNewExportData('');
    setSelectedOrderNumber('');
  };

  const handleDeleteExport = async () => {
    if (!selectedRow) return;
    if (selectedExportIndex === null) return;

    const updated = [...(selectedRow.export || [])];
    updated.splice(selectedExportIndex, 1);

    await supabase
      .from('transport_plan')
      .update({ export: updated })
      .eq('id', selectedRow.id);
    fetchPlan();
    setSelectedExportIndex(null);
    setNewExportData('');
    setSelectedOrderNumber('');
  };

  const handleAddImport = async () => {
    if (!selectedRow) return;

    const newEntry = {
      numer: newImport,
      dane: String(newImportData),
    };
    const updated = [...(selectedRow.import || []), newEntry];

    console.log('DODAJĘ IMPORT:', newImportData);

    await supabase
      .from('transport_plan')
      .update({ import: updated })
      .eq('id', selectedRow.id);
    fetchPlan();
    setNewImport('');
    setNewImportData('');
  };

  const handleEditImport = async () => {
    if (!selectedRow) return;
    if (selectedImportIndex === null) return;

    const updated = [...(selectedRow.import || [])];
    updated[selectedImportIndex] = {
      numer: newImport,
      dane: String(newImportData),
    };

    await supabase
      .from('transport_plan')
      .update({ import: updated })
      .eq('id', selectedRow.id);
    fetchPlan();
    setSelectedImportIndex(null);
    setNewImport('');
    setNewImportData('');
  };

  const handleDeleteImport = async () => {
    if (!selectedRow) return;
    if (selectedImportIndex === null) return;

    const updated = [...(selectedRow.import || [])];
    updated.splice(selectedImportIndex, 1);

    await supabase
      .from('transport_plan')
      .update({ import: updated })
      .eq('id', selectedRow.id);
    fetchPlan();
    setSelectedImportIndex(null);
    setNewImport('');
    setNewImportData('');
  };

  const handleFilterDriver = (e) => {
    setFilterDriver(e.target.value.toLowerCase());
  };

  const filteredPlanRows = planRows.filter((r) =>
    r.kierowca.toLowerCase().includes(filterDriver),
  );

  const handleDropZone = async (toIndex) => {
    if (draggedRowId === null) return;

    const fromIndex = planRows.findIndex((r) => r.id === draggedRowId);
    if (fromIndex === -1) return;

    const updated = [...planRows];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    for (let i = 0; i < updated.length; i++) {
      await supabase
        .from('transport_plan')
        .update({ kolejnosc: i })
        .eq('id', updated[i].id);
    }

    fetchPlan();
    setDraggedRowId(null);
  };

  function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date)) return '-';

    const days = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${dayName} ${day}.${month}`;
  }

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPlan();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="flex gap-8 text-xs">
      {/* LEWA TABELA */}
      <div className="w-1/2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-base font-bold">
            Plan Transportu
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-full text-xs shadow"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v6h6M20 20v-6h-6M4 20l4-4M20 4l-4 4"
                />
              </svg>
              Odśwież
            </button>
          </div>
          <button
            onClick={() => setShowPlanPanel(!showPlanPanel)}
            className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
          >
            {showPlanPanel ? 'Ukryj panel' : 'Pokaż panel'}
          </button>
        </div>

        {showPlanPanel && (
          <>
            {/* PANEL */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
              {/* KIEROWCA */}
              <div className="flex flex-col border p-2">
                <span className="font-bold">Kierowca</span>
                <input
                  placeholder="Imię i nazwisko"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="border p-1 mb-1"
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleAddDriver}
                    className="bg-green-500 px-2 py-1 text-white rounded"
                  >
                    Dodaj
                  </button>
                  <button
                    onClick={handleEditDriver}
                    className="bg-blue-500 px-2 py-1 text-white rounded"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() =>
                      selectedRow && handleDeleteRow(selectedRow.id)
                    }
                    className="bg-red-500 px-2 py-1 text-white rounded"
                  >
                    Usuń
                  </button>
                </div>
              </div>

              {/* EXPORT */}
              <div className="flex flex-col border p-2">
                <span className="font-bold">Export</span>

                <input
                  placeholder="Nr zlecenia"
                  value={selectedOrderNumber}
                  onChange={(e) => setSelectedOrderNumber(e.target.value)}
                  className="border p-1 mb-1"
                />

                {/* Lista widoczna TYLKO gdy coś wpiszesz */}
                {selectedOrderNumber.trim() !== '' && (
                  <div className="border bg-white max-h-32 overflow-y-auto">
                    {orders
                      .filter((o) =>
                        o.numer_zlecenia
                          .toLowerCase()
                          .includes(selectedOrderNumber.toLowerCase()),
                      )
                      .map((o) => (
                        <div
                          key={o.id}
                          onClick={() => {
                            setSelectedOrderNumber(o.numer_zlecenia);
                          }}
                          className="p-1 hover:bg-gray-200 cursor-pointer"
                        >
                          {o.numer_zlecenia}
                        </div>
                      ))}
                  </div>
                )}

                <input
                  placeholder="Dane"
                  value={newExportData}
                  onChange={(e) => setNewExportData(e.target.value)}
                  className="border p-1 mb-1"
                />

                <div className="flex gap-1">
                  <button
                    onClick={handleAddExport}
                    className="bg-green-500 px-2 py-1 text-white rounded"
                  >
                    Dodaj
                  </button>
                  <button
                    onClick={handleEditExport}
                    className="bg-blue-500 px-2 py-1 text-white rounded"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={handleDeleteExport}
                    className="bg-red-500 px-2 py-1 text-white rounded"
                  >
                    Usuń
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('✅');
                    }}
                    className="bg-green-500 px-2 py-1 text-white rounded"
                  >
                    ✅
                  </button>
                </div>
              </div>

              {/* IMPORT */}
              <div className="flex flex-col border p-2">
                <span className="font-bold">Import</span>

                <input
                  placeholder="Nr zlecenia"
                  value={newImport}
                  onChange={(e) => setNewImport(e.target.value)}
                  className="border p-1 mb-1"
                />

                {/* Lista widoczna TYLKO gdy coś wpiszesz */}
                {newImport.trim() !== '' && (
                  <div className="border bg-white max-h-32 overflow-y-auto">
                    {orders
                      .filter((o) =>
                        o.numer_zlecenia
                          .toLowerCase()
                          .includes(newImport.toLowerCase()),
                      )
                      .map((o) => (
                        <div
                          key={o.id}
                          onClick={() => {
                            setNewImport(o.numer_zlecenia);
                          }}
                          className="p-1 hover:bg-gray-200 cursor-pointer"
                        >
                          {o.numer_zlecenia}
                        </div>
                      ))}
                  </div>
                )}

                <input
                  placeholder="Dane"
                  value={newImportData}
                  onChange={(e) => setNewImportData(e.target.value)}
                  className="border p-1 mb-1"
                />

                <div className="flex gap-1">
                  <button
                    onClick={handleAddImport}
                    className="bg-green-500 px-2 py-1 text-white rounded"
                  >
                    Dodaj
                  </button>
                  <button
                    onClick={handleEditImport}
                    className="bg-blue-500 px-2 py-1 text-white rounded"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={handleDeleteImport}
                    className="bg-red-500 px-2 py-1 text-white rounded"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            </div>

            {/* UWAGI + SEPARATOR W JEDNYM WIERSZU */}
            <div className="flex flex-wrap justify-between mb-4 text-xs">
              {/* Blok Uwagi */}
              <div className="flex flex-col gap-2">
                <input
                  placeholder="Uwagi"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="border p-1"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateNote}
                    className="bg-gray-500 px-2 py-1 text-white rounded"
                  >
                    Dodaj Uwagi
                  </button>
                  <button
                    onClick={handleUpdateNote}
                    className="bg-blue-500 px-2 py-1 text-white rounded"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={handleDeleteNote}
                    className="bg-red-500 px-2 py-1 text-white rounded"
                  >
                    Usuń
                  </button>
                </div>
              </div>

              {/* Blok Separator */}
              <div className="flex flex-col gap-2">
                <input
                  placeholder="Data (separator)"
                  value={dateSeparator}
                  onChange={(e) => setDateSeparator(e.target.value)}
                  className="border p-1"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSeparator}
                    className="bg-green-500 px-2 py-1 text-white rounded"
                  >
                    Dodaj Datę
                  </button>
                  <button
                    onClick={handleEditSeparator}
                    className="bg-blue-500 px-2 py-1 text-white rounded"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() =>
                      selectedRow && handleDeleteRow(selectedRow.id)
                    }
                    className="bg-red-500 px-2 py-1 text-white rounded"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* FILTR */}
        <div className="mb-2">
          <input
            placeholder="Filtr Kierowców"
            value={filterDriver}
            onChange={handleFilterDriver}
            className="border p-1 text-xs w-1/2"
          />
        </div>

        <table className="w-full border text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="w-[22%]">Kierowca</th>
              <th className="w-[32%]">Export</th>
              <th className="w-[32%]">Import</th>
              <th className="w-[14%]">Uwagi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlanRows.map((row, index) => {
              const isSeparator = row.kierowca.startsWith('---');

              return (
                <React.Fragment key={row.id}>
                  {/* DROP-ZONE PRZED KAŻDYM WIERSZEM */}
                  <tr
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      console.log('✅ DROP-ZONE PRZED index:', index);
                      handleDropZone(index);
                    }}
                  >
                    <td colSpan="4" className="h-2 bg-green-100"></td>
                  </tr>

                  {isSeparator ? (
                    <tr
                      draggable
                      onDragStart={(e) => {
                        console.log('✅ DRAG START:', row.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedRowId(row.id);
                      }}
                      onClick={() => {
                        setSelectedRow(row);
                        setDateSeparator(
                          row.kierowca.replace(/---/g, '').trim(),
                        );
                      }}
                      className="cursor-pointer bg-gray-300 text-center font-bold"
                    >
                      <td colSpan="4" className="p-2">
                        {row.kierowca}
                      </td>
                    </tr>
                  ) : (
                    <tr
                      draggable
                      onDragStart={(e) => {
                        console.log('✅ DRAG START:', row.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedRowId(row.id);
                      }}
                      className={`cursor-pointer ${selectedRow?.id === row.id ? 'bg-blue-100' : ''}`}
                      onClick={() => {
                        setSelectedRow(row);
                        setDriverName(row.kierowca);
                        setNote(row.uwagi || '');
                        setNewExportData('');
                        setSelectedExportIndex(null);
                      }}
                    >
                      <td className="border p-2">{row.kierowca}</td>
                      <td className="border p-2">
                        {(row.export || []).map((ex, idx) => (
                          <span
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setContextMenu({
                                show: true,
                                x: e.pageX,
                                y: e.pageY,
                                index: idx,
                                type: 'export',
                              });
                              setSelectedRow(row);
                              setSelectedExportIndex(idx);
                              setNewExportData(ex.dane);
                              setSelectedOrderNumber(ex.numer);
                            }}
                            className="underline cursor-pointer text-blue-600 hover:text-blue-800 mr-1"
                          >
                            {ex.dane}
                          </span>
                        ))}
                      </td>
                      <td className="border p-2">
                        {(row.import || []).map((imp, idx) => (
                          <span
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🟡 Kliknięto IMPORT:', imp);
                              setSelectedRow(row); // ✅ KLUCZOWA LINIA!
                              setContextMenu({
                                show: true,
                                x: e.pageX,
                                y: e.pageY,
                                index: idx,
                                type: 'import',
                              });
                              setSelectedImportIndex(idx);
                              setNewImportData(
                                typeof imp.dane === 'object'
                                  ? JSON.stringify(imp.dane)
                                  : String(imp.dane),
                              );
                              setNewImport(imp.numer);
                            }}
                            className="underline cursor-pointer text-pink-600 hover:text-pink-800 mr-1"
                          >
                            {imp.dane}
                          </span>
                        ))}
                      </td>
                      <td className="border p-2">{row.uwagi}</td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* DROP-ZONE NA KOŃCU */}
            <tr
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                console.log('✅ DROP-ZONE KONIEC');
                handleDropZone(filteredPlanRows.length);
              }}
            >
              <td colSpan="4" className="h-2 bg-green-100"></td>
            </tr>
          </tbody>
        </table>

        {contextMenu.show && (
          <div
            className="absolute bg-white border shadow p-2 text-xs rounded z-50"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="block w-full text-left hover:bg-gray-100 px-2 py-1"
              onClick={async () => {
                console.log('📄 Kliknięto „Pokaż szczegóły”');
                console.log('📄 selectedRow:', selectedRow);
                console.log('📄 contextMenu:', contextMenu);
                if (!selectedRow) return;
                if (
                  contextMenu.index === null ||
                  contextMenu.index === undefined
                )
                  return;

                let numer = '';

                if (contextMenu.type === 'export') {
                  const ex = selectedRow.export?.[contextMenu.index];
                  if (!ex) return;
                  numer = ex.numer;
                } else if (contextMenu.type === 'import') {
                  const imp = selectedRow.import?.[contextMenu.index];
                  if (!imp) return;
                  numer = imp.numer;
                }

                console.log('➡️ Szukam szczegółów dla numeru:', numer);
                console.log('➡️ Typ:', contextMenu.type);

                const { data: foundExport } = await supabase
                  .from('zlecenia_export')
                  .select('*')
                  .eq('numer_zlecenia', numer)
                  .maybeSingle();
                console.log('🔍 Wynik export:', foundExport);

                const { data: foundImport } = await supabase
                  .from('zlecenia_import')
                  .select('*')
                  .eq('numer_zlecenia', numer)
                  .maybeSingle();
                console.log('🔍 Wynik import:', foundImport);

                const { data: foundPozostale } = await supabase
                  .from('zlecenia_pozostale')
                  .select('*')
                  .eq('numer_zlecenia', numer)
                  .maybeSingle();
                console.log('🔍 Wynik pozostale:', foundPozostale);

                const found = foundExport || foundImport || foundPozostale;

                if (!found) {
                  alert('Nie znaleziono zlecenia w żadnej tabeli.');
                  return;
                }

                setSelectedOrder(found);
                setShowModal(true);
                console.log('✅ Pokazuję modal:', found);

                setContextMenu({
                  show: false,
                  x: 0,
                  y: 0,
                  index: null,
                  type: null,
                });
              }}
            >
              📄 Pokaż szczegóły
            </button>
            <button
              className="block w-full text-left hover:bg-gray-100 px-2 py-1"
              onClick={() => {
                if (!selectedRow) return;
                if (contextMenu.index === null) return;

                if (contextMenu.type === 'export') {
                  const ex = selectedRow.export?.[contextMenu.index];
                  if (!ex) return;

                  setSelectedOrderNumber(ex.numer);
                  setNewExportData(ex.dane);
                } else if (contextMenu.type === 'import') {
                  const imp = selectedRow.import?.[contextMenu.index];
                  if (!imp) return;

                  setNewImport(imp.numer);
                  setNewImportData(
                    typeof imp.dane === 'object'
                      ? JSON.stringify(imp.dane)
                      : String(imp.dane),
                  );
                }

                setContextMenu({
                  show: false,
                  x: 0,
                  y: 0,
                  index: null,
                  type: null,
                });
              }}
            >
              ✏️ Edytuj dane
            </button>
          </div>
        )}
      </div>

      {/* PRAWA TABELA */}
      <div className="w-1/2 overflow-x-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="mb-2 flex flex-col">
            <span className="text-base font-bold mb-1">Lista Zleceń</span>
            <input
              type="text"
              placeholder="Filtruj zleceniodawcę"
              value={filterZleceniodawca}
              onChange={(e) => setFilterZleceniodawca(e.target.value)}
              className="border px-2 py-1 text-xs rounded w-64"
            />
          </div>
          <button
            onClick={() => {
              fetchHiddenOrders();
              setShowHiddenModal(true);
            }}
            className="px-2 py-1 bg-gray-300 hover:bg-gray-400 rounded text-xs"
          >
            Pokaż ukryte
          </button>
        </div>
        <table className="w-full border text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-center">Nr zlec.</th>
              <th className="text-center">D.zał</th>
              <th className="text-center">Zleceniodawca</th>
              <th className="text-center">LDM</th>
              <th className="text-center">Waga</th>
              <th className="text-center">M.zał</th>
              <th className="text-center">M.rozł</th>
              <th className="text-center">D.rozł</th>
              <th className="text-center">Cena</th>
              <th className="text-center">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {/* EXPORTY — na samej górze, bez separatora */}
            {exportOrders
              .filter((o) =>
                o.zl_nazwa
                  ?.toLowerCase()
                  .includes(filterZleceniodawca.toLowerCase()),
              )
              .map((o) => (
                <tr key={o.id}>
                  <td className="border p-2">{o.numer_zlecenia}</td>
                  <td className="border p-2 text-center">
                    {formatDateShort(o.pickup_date_start)}
                  </td>
                  <td className="border p-2">{o.zl_nazwa}</td>
                  <td className="border p-2 text-center">{o.ldm}</td>
                  <td className="border p-2 text-center">{o.waga}</td>
                  <td className="border p-2 text-center">
                    {safeParse(o.adresy_odbioru_json)[0]?.kod ||
                      o.zl_kod_pocztowy?.trim() ||
                      '-'}
                  </td>
                  <td className="border p-2 text-center">
                    {safeParse(o.adresy_dostawy_json)[0]?.kod ||
                      o.zl_kod_rozladunku?.trim() ||
                      '-'}
                  </td>
                  <td className="border p-2 text-center">
                    {formatDateShort(o.delivery_date_start)}
                  </td>
                  <td className="border p-2 text-center">
                    {o.cena} {getCurrencySymbol(o.waluta)}
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleHideOrder(o)}
                      className="bg-yellow-500 px-2 py-1 rounded text-white text-xs"
                    >
                      Ukryj
                    </button>
                  </td>
                </tr>
              ))}
            {/* SEPARATOR IMPORTY */}
            {importOrders.length > 0 && (
              <tr className="bg-gray-200 text-center font-bold">
                <td colSpan="9" className="p-2">
                  IMPORTY
                </td>
              </tr>
            )}

            {/* IMPORTY */}
            {importOrders
              .filter((o) =>
                o.zl_nazwa
                  ?.toLowerCase()
                  .includes(filterZleceniodawca.toLowerCase()),
              )
              .map((o) => (
                <tr key={o.id}>
                  <td className="border p-2">{o.numer_zlecenia}</td>
                  <td className="border p-2 text-center">
                    {formatDateShort(o.pickup_date_start)}
                  </td>
                  <td className="border p-2">{o.zl_nazwa}</td>
                  <td className="border p-2 text-center">{o.ldm}</td>
                  <td className="border p-2 text-center">{o.waga}</td>
                  <td className="border p-2 text-center">
                    {safeParse(o.adresy_odbioru_json)[0]?.kod ||
                      o.zl_kod_pocztowy?.trim() ||
                      '-'}
                  </td>
                  <td className="border p-2 text-center">
                    {safeParse(o.adresy_dostawy_json)[0]?.kod ||
                      o.zl_kod_pocztowy?.trim() ||
                      '-'}
                  </td>
                  <td className="border p-2 text-center">
                    {formatDateShort(o.delivery_date_start)}
                  </td>
                  <td className="border p-2 text-center">
                    {o.cena} {getCurrencySymbol(o.waluta)}
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleHideOrder(o)}
                      className="bg-yellow-500 px-2 py-1 rounded text-white text-xs"
                    >
                      Ukryj
                    </button>
                  </td>
                </tr>
              ))}

            {/* SEPARATOR POZOSTAŁE */}
            {pozostaleOrders.length > 0 && (
              <tr className="bg-gray-200 text-center font-bold">
                <td colSpan="9" className="p-2">
                  POZOSTAŁE
                </td>
              </tr>
            )}

            {/* POZOSTAŁE */}
            {pozostaleOrders
              .filter((o) =>
                o.zl_nazwa
                  ?.toLowerCase()
                  .includes(filterZleceniodawca.toLowerCase()),
              )
              .map((o) => (
                <tr key={o.id}>
                  <td className="border p-2">{o.numer_zlecenia}</td>
                  <td className="border p-2 text-center">
                    {formatDateShort(o.pickup_date_start)}
                  </td>
                  <td className="border p-2">{o.zl_nazwa}</td>
                  <td className="border p-2 text-center">{o.ldm}</td>
                  <td className="border p-2 text-center">{o.waga}</td>
                  <td className="border p-2 text-center">
                    {safeParse(o.adresy_odbioru_json)[0]?.kod ||
                      o.zl_kod_pocztowy?.trim() ||
                      '-'}
                  </td>
                  <td className="border p-2 text-center">
                    {safeParse(o.adresy_dostawy_json)[0]?.kod ||
                      o.zl_kod_pocztowy?.trim() ||
                      '-'}
                  </td>
                  <td className="border p-2 text-center">
                    {formatDateShort(o.delivery_date_start)}
                  </td>
                  <td className="border p-2 text-center">
                    {o.cena} {getCurrencySymbol(o.waluta)}
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleHideOrder(o)}
                      className="bg-yellow-500 px-2 py-1 rounded text-white text-xs"
                    >
                      Ukryj
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full overflow-y-auto max-h-[85vh]">
            <h2 className="text-2xl font-bold mb-4">Szczegóły zlecenia</h2>

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Informacje podstawowe
                </h3>
                <p>
                  <strong>Nr zlecenia:</strong> {selectedOrder.numer_zlecenia}
                </p>
                <p>
                  <strong>Osoba kontaktowa:</strong>{' '}
                  {selectedOrder.osoba_kontaktowa}
                </p>
                <p>
                  <strong>Telefon:</strong> {selectedOrder.telefon_kontaktowy}
                </p>
                <p>
                  <strong>Email:</strong> {selectedOrder.email_kontaktowy}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Zleceniodawca</h3>
                <p>
                  <strong>Nazwa:</strong> {selectedOrder.zl_nazwa}
                </p>
                <p>
                  <strong>Adres:</strong> {selectedOrder.zl_ulica},{' '}
                  {selectedOrder.zl_kod_pocztowy} {selectedOrder.zl_miasto},{' '}
                  {selectedOrder.zl_panstwo}
                </p>
                <p>
                  <strong>VAT:</strong> {selectedOrder.zl_vat}
                </p>
                <p>
                  <strong>NIP:</strong> {selectedOrder.zl_nip}
                </p>
                <p>
                  <strong>REGON:</strong> {selectedOrder.zl_regon}
                </p>
                <p>
                  <strong>EORI:</strong> {selectedOrder.zl_eori}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Załadunek</h3>
                <p>
                  <strong>Data:</strong> {selectedOrder.pickup_date_start} –{' '}
                  {selectedOrder.pickup_date_end}
                </p>
                <p>
                  <strong>Adresy odbioru:</strong>
                </p>
                <ul className="list-disc pl-5">
                  {safeParse(selectedOrder.adresy_odbioru_json).map((a, i) => (
                    <li key={i}>
                      {a.nazwa}, {a.ulica}, {a.kod} {a.miasto}, {a.panstwo}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Rozładunek</h3>
                <p>
                  <strong>Data:</strong> {selectedOrder.delivery_date_start} –{' '}
                  {selectedOrder.delivery_date_end}
                </p>
                <p>
                  <strong>Adresy dostawy:</strong>
                </p>
                <ul className="list-disc pl-5">
                  {safeParse(selectedOrder.adresy_dostawy_json).map((a, i) => (
                    <li key={i}>
                      {a.nazwa}, {a.ulica}, {a.kod} {a.miasto}, {a.panstwo}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Towar</h3>
                <p>
                  <strong>Palety:</strong> {selectedOrder.palety}
                </p>
                <p>
                  <strong>Waga:</strong> {selectedOrder.waga}
                </p>
                <p>
                  <strong>Wymiar:</strong> {selectedOrder.wymiar}
                </p>
                <p>
                  <strong>LDM:</strong> {selectedOrder.ldm}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Fracht</h3>
                <p>
                  <strong>Cena:</strong> {selectedOrder.cena}{' '}
                  {selectedOrder.waluta}
                </p>
                <p>
                  <strong>Termin płatności:</strong> {selectedOrder.termin_dni}{' '}
                  dni
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">Uwagi</h3>
                <p>{selectedOrder.uwagi || '-'}</p>
              </div>
            </div>

            <div className="text-right mt-4 flex justify-end gap-2">
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
      {showHiddenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full overflow-y-auto max-h-[85vh]">
            <h2 className="text-xl font-bold mb-4">Ukryte Zlecenia</h2>

            <table className="w-full border text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Nr zlec.</th>
                  <th className="text-left p-2">Zleceniodawca</th>
                  <th className="text-left p-2">Typ</th>
                  <th className="text-left p-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {hiddenOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="border p-2">{o.numer_zlecenia}</td>
                    <td className="border p-2">{o.zl_nazwa || '-'}</td>
                    <td className="border p-2">{o.typ || '-'}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => handleUnhideOrder(o)}
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                      >
                        Pokaż w liście
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right mt-4">
              <button
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                onClick={() => setShowHiddenModal(false)}
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
