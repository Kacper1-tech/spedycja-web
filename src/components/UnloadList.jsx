import React, { useState } from 'react';

function UnloadList({ data, onFieldChange, onAddUnload, onRemoveUnload }) {
  const [newUnload, setNewUnload] = useState(data.length === 0 ? [] : null);
  const [selected, setSelected] = useState(null);

  const handleAddNew = () => {
    if (!newUnload) {
      setNewUnload([]);
    }
  };

  const handleAddUnload = (e) => {
    onAddUnload(e);
    setNewUnload(null);
  };

  const handleRemoveUnload = () => {
    onRemoveUnload(selected);
    setSelected(null);
  };

  const handleSelectField = (id) => {
    setSelected(id);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-red-700">Rozładunki:</h3>
        <div className="flex gap-2">
          <button
            disabled={newUnload}
            onClick={handleAddNew}
            className="no-print px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300"
          >
            ➕ Dodaj rozładunek
          </button>
          <button
            onClick={handleRemoveUnload}
            className="no-print px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            🗑️ Usuń rozładunek
          </button>
        </div>
      </div>
      <table className="w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Nr zlecenia</th>
            <th className="border p-2">Kierowca</th>
            <th className="border p-2">Zleceniodawca</th>
            <th className="border p-2">Odprawa importowa</th>
            <th className="border p-2">Miasto rozładunku</th>
            <th className="border p-2">Uwagi</th>
            <th className="border p-2">Pojazd</th>
            <th className="border p-2">Kierowca (rozładunek)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <UnloadListItem
              data={item}
              key={item.id}
              selected={selected === item.id}
              onSelect={handleSelectField}
              onFieldChange={onFieldChange}
            />
          ))}

          {newUnload && <NewUnloadItem onAddUnload={handleAddUnload} />}
        </tbody>
      </table>
    </>
  );
}

function UnloadListItem({ data, onFieldChange, selected, onSelect }) {
  const handleFieldChange = (e) => {
    if (e.target.value === data[e.target.name]) return;
    onFieldChange && onFieldChange(e, data.id);
  };

  return (
    <tr
      onClick={() => onSelect(data.id)}
      className={
        selected
          ? 'bg-yellow-100 cursor-pointer'
          : 'hover:bg-gray-50 cursor-pointer'
      }
    >
      <td className="border p-2">{data.numer_zlecenia}</td>

      {/* Kierowca - w głównym wierszu */}
      <td className="border p-2">
        <input
          type="text"
          defaultValue={data.kierowca}
          name="kierowca"
          onBlur={handleFieldChange}
          className="w-full bg-transparent outline-none"
        />
      </td>

      {/* Zleceniodawca - w głównym wierszu */}
      <td className="border p-2">
        <input
          type="text"
          defaultValue={data.zl_nazwa}
          name="zl_nazwa"
          onBlur={handleFieldChange}
          className="w-full bg-transparent outline-none"
        />
      </td>

      {/* Odprawa importowa - w głównym wierszu */}
      <td className="border p-2">{data.odprawa_importowa}</td>

      {/* Miasto rozładunku - w głównym wierszu */}
      <td className="border p-2">{data.miasto_rozladunku}</td>

      {/* Uwagi - w głównym wierszu */}
      <td className="border p-2">
        <input
          type="text"
          defaultValue={data.uwagi}
          name="uwagi"
          onBlur={handleFieldChange}
          className="w-full bg-transparent outline-none"
        />
      </td>

      {/* Pojazd - w głównym wierszu */}
      <td className="border p-2">
        <input
          type="text"
          defaultValue={data.pojazd}
          name="pojazd"
          onBlur={handleFieldChange}
          className="w-full bg-transparent outline-none"
        />
      </td>

      {/* Kierowca (rozładunek) - w głównym wierszu */}
      <td className="border p-2">
        <input
          type="text"
          defaultValue={data.kierowca_rozladunek}
          name="kierowca_rozladunek"
          onBlur={handleFieldChange}
          className="w-full bg-transparent outline-none"
        />
      </td>
    </tr>
  );
}

function NewUnloadItem({ onAddUnload }) {
  return (
    <tr>
      <td className="border p-2">
        <input
          type="text"
          onBlur={
            onAddUnload

            // const { data: daneZlecenia, error } = await supabase
            //   .from('zlecenia_import')
            //   .select('*')
            //   .eq('numer_zlecenia', e.target.value)
            //   .maybeSingle();
            //
            // if (error || !daneZlecenia) {
            //   console.error(
            //     '❌ Nie znaleziono zlecenia:',
            //     error?.message,
            //   );
            //   zapisWLokuRef.current = false;
            //   return;
            // }
            //
            // const aktualne = {
            //   numer_zlecenia: wpisanyNumer,
            //   dane: {
            //     kierowca: daneZlecenia.kierowca || '',
            //     zl_nazwa: daneZlecenia.zl_nazwa || '',
            //     uwagi: daneZlecenia.uwagi || '',
            //     pojazd: daneZlecenia.pojazd || '',
            //     kierowca_rozladunek:
            //       daneZlecenia.kierowca_rozladunek || '',
            //     import_customs_adres_json:
            //       daneZlecenia.import_customs_adres_json || '',
            //     adresy_dostawy_json:
            //       daneZlecenia.adresy_dostawy_json || '',
            //     odprawa_importowa:
            //       daneZlecenia.odprawa_importowa ||
            //       (() => {
            //         try {
            //           const raw =
            //             daneZlecenia.import_customs_adres_json;
            //           const parsed =
            //             typeof raw === 'string'
            //               ? JSON.parse(raw)
            //               : raw;
            //           const obj = Array.isArray(parsed)
            //             ? parsed[0]
            //             : parsed;
            //           const nazwa = (obj?.nazwa || '').trim();
            //           const miasto = (obj?.miasto || '').trim();
            //           return nazwa && miasto
            //             ? `${nazwa}, ${miasto}`
            //             : miasto || nazwa || '';
            //         } catch {
            //           return '';
            //         }
            //       })(),
            //   },
            // };
            //
            // setNoweZlecenia((prev) => ({
            //   ...prev,
            //   [iso]: aktualne,
            // }));
            //
            // console.log('✅ noweZlecenia po onBlur:', aktualne);
            //
            // await zapiszPojedynczeZlecenieDoSupabase(
            //   iso,
            //   aktualne,
            // );
            //
            // zapisWLokuRef.current = false;
          }
          className="w-full bg-transparent outline-none"
        />
      </td>
      <td className="border p-2"></td>
      <td className="border p-2"></td>
      <td className="border p-2"></td>
      <td className="border p-2"></td>
      <td className="border p-2"></td>
      <td className="border p-2"></td>
      <td className="border p-2"></td>
    </tr>
  );
}

export default UnloadList;
