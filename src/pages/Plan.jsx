import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const Plan = () => {
  const [weeklyData, setWeeklyData] = useState({});
  const [nowyNumerZlecenia, setNowyNumerZlecenia] = useState('');
  const [noweZlecenie, setNoweZlecenie] = useState(null);
  const [dodatkoweRozladunki, setDodatkoweRozladunki] = useState({});
  const [wybranyRozladunekIndex, setWybranyRozladunekIndex] = useState(null);
  const [innePozycje, setInnePozycje] = useState({});
  const [wybranaInnaIndex, setWybranaInnaIndex] = useState(null);

  const getWeekDates = () => {
    const today = new Date();
    const monday = new Date(
      today.setDate(today.getDate() - today.getDay() + 1),
    );
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push({
        iso: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('pl-PL', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
        }),
      });
    }
    return dates;
  };

  const getFirstAddressCity = (adresyJson) => {
    try {
      const adresy =
        typeof adresyJson === 'string' ? JSON.parse(adresyJson) : adresyJson;
      return adresy?.[0]?.miasto || '';
    } catch {
      return '';
    }
  };

  const getFirstAddressKod = (adresyJson) => {
    try {
      const adresy =
        typeof adresyJson === 'string' ? JSON.parse(adresyJson) : adresyJson;
      return adresy?.[0]?.kod || '';
    } catch {
      return '';
    }
  };

  const getExportCustomsMiasto = (order) => {
    try {
      const json =
        typeof order.export_customs_adres_json === 'string'
          ? JSON.parse(order.export_customs_adres_json)
          : order.export_customs_adres_json;

      if (json?.miasto) return json.miasto;
    } catch (err) {
      console.error('Błąd parsowania export_customs_adres_json:', err);
    }
    return 'Na zał';
  };

  const clearNoweZlecenie = () => {
    setNoweZlecenie(null);
    setNowyNumerZlecenia('');
  };

  const dodajPustyRozladunek = (iso) => {
    setDodatkoweRozladunki((prev) => {
      const aktualne = prev[iso] || [];
      return {
        ...prev,
        [iso]: [
          ...aktualne,
          {
            id: Date.now(), // tymczasowy unikalny identyfikator
            numer_zlecenia: '',
            kierowca: '',
            zl_nazwa: '',
            import_customs_adres_json: '',
            adresy_dostawy_json: '',
            uwagi: '',
            pojazd: '',
            kierowca_rozladunek: '',
            nowy: true, // flaga pomocnicza
          },
        ],
      };
    });
  };

  const zapiszPlanDoSupabase = async () => {
    for (const iso of Object.keys(dodatkoweRozladunki)) {
      const rozladunkiDnia = dodatkoweRozladunki[iso] || [];
      const inneDnia = innePozycje[iso] || [];

      const payload = {
        data: iso,
        pozycje_inne: inneDnia.map((p) => p.tresc),
      };

      // Jeśli jest chociaż jeden rozładunek – weź pierwszy i dołącz dane
      if (rozladunkiDnia.length > 0) {
        const z = rozladunkiDnia[0]; // tylko pierwszy, możesz rozbudować logikę
        Object.assign(payload, {
          numer_zlecenia: z.numer_zlecenia,
          kierowca: z.kierowca,
          zl_nazwa: z.zl_nazwa,
          import_customs_adres_json: z.import_customs_adres_json || {},
          adresy_dostawy_json: z.adresy_dostawy_json || {},
          uwagi: z.uwagi,
          pojazd: z.pojazd,
          kierowca_rozladunek: z.kierowca_rozladunek,
        });
      }

      // Sprawdź, czy rekord dla tej daty już istnieje
      const { data: istnieje, error: checkError } = await supabase
        .from('plan_rozladunki')
        .select('id')
        .eq('data', iso)
        .maybeSingle();

      if (checkError) {
        console.error('Błąd sprawdzania istnienia rekordu:', checkError);
        continue;
      }

      if (istnieje) {
        // aktualizuj
        const { error: updateError } = await supabase
          .from('plan_rozladunki')
          .update(payload)
          .eq('id', istnieje.id);

        if (updateError) {
          console.error('Błąd aktualizacji planu:', updateError);
        }
      } else {
        // wstaw nowy
        const { error: insertError } = await supabase
          .from('plan_rozladunki')
          .insert([payload]);

        if (insertError) {
          console.error('Błąd dodawania planu:', insertError);
        }
      }
    }
  };

  const fetchData = async () => {
    const exportRes = await supabase.from('zlecenia_export').select('*');
    const importRes = await supabase.from('zlecenia_import').select('*');

    const zaladunkiOrders = exportRes.data || [];
    const rozladunkiOrders = importRes.data || [];

    const dataByDay = {};
    const dates = getWeekDates();

    dates.forEach(({ iso }) => {
      dataByDay[iso] = { zaladunki: [], rozladunki: [] };
    });

    zaladunkiOrders.forEach((order) => {
      const zaladunek = order.pickup_date_start;
      if (dataByDay[zaladunek]) dataByDay[zaladunek].zaladunki.push(order);
    });

    rozladunkiOrders.forEach((order) => {
      const rozladunek = order.delivery_date_end;
      if (dataByDay[rozladunek]) dataByDay[rozladunek].rozladunki.push(order);
    });

    setWeeklyData(dataByDay);

    const planRes = await supabase.from('plan_rozladunki').select('*');
    const planData = planRes.data || [];

    const noweRozladunki = {};
    const noweInne = {};

    planData.forEach((row) => {
      if (row.typ === 'rozladunek') {
        if (!noweRozladunki[row.data]) noweRozladunki[row.data] = [];
        noweRozladunki[row.data].push(row);
      }
      if (row.typ === 'inne') {
        if (!noweInne[row.data]) noweInne[row.data] = [];
        noweInne[row.data].push(row);
      }
    });

    setDodatkoweRozladunki(noweRozladunki);
    setInnePozycje(noweInne);
  };

  useEffect(() => {
    zapiszPlanDoSupabase();
  }, [dodatkoweRozladunki, innePozycje]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(); // automatycznie pobiera dane co X sekund
    }, 5000); // co 10 000 ms = 10 sekund (możesz zmienić na np. 5000 dla 5 sek.)

    return () => clearInterval(interval); // wyczyść po odmontowaniu
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const weekDates = getWeekDates();

  return (
    <div className="p-4 space-y-8">
      {weekDates.map(({ iso, label }) => (
        <div key={iso} className="border rounded-xl p-4 shadow bg-white">
          <h2 className="text-lg font-bold capitalize text-blue-700 mb-4 text-center">
            {label}
          </h2>
          {/* Załadunki */}
          <h3 className="font-semibold text-green-700 mb-2">Załadunki:</h3>
          {weeklyData[iso]?.zaladunki.length > 0 ? (
            <table className="w-full border border-gray-300 mb-6 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th style={{ width: '10%' }} className="border p-2">
                    Nr zlecenia
                  </th>
                  <th style={{ width: '10%' }} className="border p-2">
                    Zleceniodawca
                  </th>
                  <th style={{ width: '10%' }} className="border p-2">
                    Miasto załadunku
                  </th>
                  <th style={{ width: '5%' }} className="border p-2">
                    Kod rozładunku
                  </th>
                  <th style={{ width: '5%' }} className="border p-2">
                    Odprawa celna
                  </th>
                  <th style={{ width: '20%' }} className="border p-2">
                    Uwagi
                  </th>
                  <th style={{ width: '20%' }} className="border p-2">
                    Pojazd
                  </th>
                  <th style={{ width: '20%' }} className="border p-2">
                    Kierowca
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* FTL zlecenia */}
                {weeklyData[iso].zaladunki
                  .filter((z) => (z.ldm || '').toUpperCase() === 'FTL')
                  .map((z, i) => (
                    <tr key={`ftl-${i}`}>
                      <td style={{ width: '10%' }} className="border p-2">
                        {z.numer_zlecenia}
                      </td>
                      <td style={{ width: '10%' }} className="border p-2">
                        {z.zl_nazwa}
                      </td>
                      <td style={{ width: '10%' }} className="border p-2">
                        {getFirstAddressCity(z.adresy_odbioru_json)}
                      </td>
                      <td style={{ width: '5%' }} className="border p-2">
                        {getFirstAddressKod(z.adresy_dostawy_json)}
                      </td>
                      <td style={{ width: '5%' }} className="border p-2">
                        {getExportCustomsMiasto(z)}
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          defaultValue=""
                          className="w-full bg-transparent outline-none text-gray-600"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          defaultValue={z.pojazd}
                          onBlur={async (e) => {
                            const { error } = await supabase
                              .from('zlecenia_export')
                              .update({ pojazd: e.target.value })
                              .eq('id', z.id);
                            if (error)
                              console.error(
                                'Błąd zapisu pojazdu:',
                                error.message,
                              );
                          }}
                          className="w-full bg-transparent outline-none text-gray-600"
                        />
                      </td>

                      <td className="border p-2">
                        <input
                          type="text"
                          defaultValue={z.kierowca}
                          onBlur={async (e) => {
                            const { error } = await supabase
                              .from('zlecenia_export')
                              .update({ kierowca: e.target.value })
                              .eq('id', z.id);
                            if (error)
                              console.error(
                                'Błąd zapisu kierowcy:',
                                error.message,
                              );
                          }}
                          className="w-full bg-transparent outline-none text-gray-600"
                        />
                      </td>
                    </tr>
                  ))}

                {/* separator między FTL a resztą */}
                {weeklyData[iso].zaladunki.some(
                  (z) => (z.ldm || '').toUpperCase() !== 'FTL',
                ) && (
                  <tr>
                    <td
                      colSpan={8}
                      className="bg-yellow-100 text-center font-semibold py-2 border-t border-b"
                    >
                      Doładunki
                    </td>
                  </tr>
                )}

                {/* pozostałe zlecenia */}
                {weeklyData[iso].zaladunki
                  .filter((z) => (z.ldm || '').toUpperCase() !== 'FTL')
                  .map((z, i) => (
                    <tr key={`other-${i}`}>
                      <td style={{ width: '10%' }} className="border p-2">
                        {z.numer_zlecenia}
                      </td>
                      <td style={{ width: '10%' }} className="border p-2">
                        {z.zl_nazwa}
                      </td>
                      <td style={{ width: '10%' }} className="border p-2">
                        {getFirstAddressCity(z.adresy_odbioru_json)}
                      </td>
                      <td style={{ width: '5%' }} className="border p-2">
                        {getFirstAddressKod(z.adresy_dostawy_json)}
                      </td>
                      <td style={{ width: '5%' }} className="border p-2">
                        {getExportCustomsMiasto(z)}
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          defaultValue={z.uwagi}
                          onBlur={async (e) => {
                            const { error } = await supabase
                              .from('zlecenia_export')
                              .update({ uwagi: e.target.value })
                              .eq('id', z.id);
                            if (error)
                              console.error('Błąd zapisu uwag:', error.message);
                          }}
                          className="w-full bg-transparent outline-none text-gray-600"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          defaultValue={z.pojazd}
                          onBlur={async (e) => {
                            const { error } = await supabase
                              .from('zlecenia_export')
                              .update({ pojazd: e.target.value })
                              .eq('id', z.id);
                            if (error)
                              console.error(
                                'Błąd zapisu pojazdu:',
                                error.message,
                              );
                          }}
                          className="w-full bg-transparent outline-none text-gray-600"
                        />
                      </td>

                      <td className="border p-2">
                        <input
                          type="text"
                          defaultValue={z.kierowca}
                          onBlur={async (e) => {
                            const { error } = await supabase
                              .from('zlecenia_export')
                              .update({ kierowca: e.target.value })
                              .eq('id', z.id);
                            if (error)
                              console.error(
                                'Błąd zapisu kierowcy:',
                                error.message,
                              );
                          }}
                          className="w-full bg-transparent outline-none text-gray-600"
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500 mb-6">Brak załadunków</p>
          )}
          {/* Rozładunki */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-red-700">Rozładunki:</h3>
            <div className="flex gap-2">
              <button
                onClick={() => dodajPustyRozladunek(iso)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                ➕ Dodaj rozładunek
              </button>
              <button
                onClick={() => {
                  setDodatkoweRozladunki((prev) => {
                    const aktualne = prev[iso] || [];

                    if (
                      wybranyRozladunekIndex !== null &&
                      wybranyRozladunekIndex >= 0
                    ) {
                      const nowe = aktualne.filter(
                        (_, i) => i !== wybranyRozladunekIndex,
                      );
                      setWybranyRozladunekIndex(null);
                      return { ...prev, [iso]: nowe };
                    }

                    return { ...prev, [iso]: aktualne.slice(0, -1) };
                  });
                }}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                🗑️ Usuń rozładunek
              </button>
            </div>
          </div>
          {weeklyData[iso] && (
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
                <tr>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={nowyNumerZlecenia}
                      onChange={(e) => setNowyNumerZlecenia(e.target.value)}
                      onBlur={async () => {
                        if (nowyNumerZlecenia.trim() === '') {
                          clearNoweZlecenie();
                          return;
                        }

                        const { data, error } = await supabase
                          .from('zlecenia_import')
                          .select('*')
                          .eq('numer_zlecenia', nowyNumerZlecenia)
                          .single();

                        if (error || !data) {
                          console.error(
                            'Nie znaleziono zlecenia:',
                            error?.message,
                          );
                          clearNoweZlecenie(); // 🔸 czyszczenie danych
                          return;
                        }

                        setNoweZlecenie(data);
                      }}
                      className="w-full bg-transparent outline-none"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      defaultValue={noweZlecenie?.kierowca || ''}
                      onBlur={async (e) => {
                        const updatedValue = e.target.value;
                        setNoweZlecenie((prev) => ({
                          ...prev,
                          kierowca: updatedValue,
                        }));

                        if (noweZlecenie?.id) {
                          const { error } = await supabase
                            .from('zlecenia_import')
                            .update({ kierowca: updatedValue })
                            .eq('id', noweZlecenie.id);
                          if (error) {
                            console.error(
                              'Błąd zapisu kierowcy:',
                              error.message,
                            );
                          }
                        }
                      }}
                      className="w-full bg-transparent outline-none"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={noweZlecenie?.zl_nazwa || ''}
                      onChange={(e) => {
                        setNoweZlecenie((prev) => ({
                          ...prev,
                          zl_nazwa: e.target.value,
                        }));
                      }}
                      onBlur={async (e) => {
                        const inputNazwa = e.target.value.trim();

                        if (inputNazwa === '') {
                          setNoweZlecenie(null);
                          setNowyNumerZlecenia('');
                          return;
                        }

                        const { data, error } = await supabase
                          .from('zlecenia_import')
                          .select('*')
                          .ilike('zl_nazwa', `%${inputNazwa}%`)
                          .limit(1)
                          .single();

                        if (error || !data) {
                          console.error(
                            'Nie znaleziono zlecenia po nazwie:',
                            error?.message,
                          );
                          setNoweZlecenie(null);
                          setNowyNumerZlecenia('');
                          return;
                        }

                        setNoweZlecenie(data);
                        setNowyNumerZlecenia(data.numer_zlecenia || '');
                      }}
                      className="w-full bg-transparent outline-none"
                    />
                  </td>
                  <td className="border p-2">
                    {(() => {
                      try {
                        const json =
                          typeof noweZlecenie?.import_customs_adres_json ===
                          'string'
                            ? JSON.parse(noweZlecenie.import_customs_adres_json)
                            : noweZlecenie.import_customs_adres_json;
                        return json?.miasto || '—';
                      } catch {
                        return '—';
                      }
                    })()}
                  </td>
                  <td className="border p-2">
                    {(() => {
                      try {
                        const json =
                          typeof noweZlecenie?.adresy_dostawy_json === 'string'
                            ? JSON.parse(noweZlecenie.adresy_dostawy_json)
                            : noweZlecenie.adresy_dostawy_json;
                        return json?.[0]?.miasto || '—';
                      } catch {
                        return '—';
                      }
                    })()}
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      defaultValue=""
                      onBlur={(e) =>
                        setNoweZlecenie((prev) => ({
                          ...prev,
                          uwagi: e.target.value,
                        }))
                      }
                      className="w-full bg-transparent outline-none"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      defaultValue=""
                      onBlur={(e) =>
                        setNoweZlecenie((prev) => ({
                          ...prev,
                          pojazd: e.target.value,
                        }))
                      }
                      className="w-full bg-transparent outline-none"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      defaultValue=""
                      onBlur={(e) =>
                        setNoweZlecenie((prev) => ({
                          ...prev,
                          kierowca_rozladunek: e.target.value,
                        }))
                      }
                      className="w-full bg-transparent outline-none"
                    />
                  </td>
                </tr>
                {(dodatkoweRozladunki[iso] || []).map((z, idx) => (
                  <tr
                    key={`extra-${z.id}`}
                    onClick={() => setWybranyRozladunekIndex(idx)}
                    className={
                      wybranyRozladunekIndex === idx
                        ? 'bg-yellow-100 cursor-pointer'
                        : 'hover:bg-gray-50 cursor-pointer'
                    }
                  >
                    <td className="border p-2">
                      <input
                        type="text"
                        value={z.numer_zlecenia}
                        onChange={(e) =>
                          setDodatkoweRozladunki((prev) => ({
                            ...prev,
                            [iso]: prev[iso].map((item, i) =>
                              i === idx
                                ? { ...item, numer_zlecenia: e.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={z.kierowca}
                        onChange={(e) =>
                          setDodatkoweRozladunki((prev) => ({
                            ...prev,
                            [iso]: prev[iso].map((item, i) =>
                              i === idx
                                ? { ...item, kierowca: e.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={z.zl_nazwa}
                        onChange={(e) =>
                          setDodatkoweRozladunki((prev) => ({
                            ...prev,
                            [iso]: prev[iso].map((item, i) =>
                              i === idx
                                ? { ...item, zl_nazwa: e.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                    <td className="border p-2">—</td>
                    <td className="border p-2">—</td>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={z.uwagi}
                        onChange={(e) =>
                          setDodatkoweRozladunki((prev) => ({
                            ...prev,
                            [iso]: prev[iso].map((item, i) =>
                              i === idx
                                ? { ...item, uwagi: e.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={z.pojazd}
                        onChange={(e) =>
                          setDodatkoweRozladunki((prev) => ({
                            ...prev,
                            [iso]: prev[iso].map((item, i) =>
                              i === idx
                                ? { ...item, pojazd: e.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                    <td className="border p-2">
                      <input
                        type="text"
                        value={z.kierowca_rozladunek}
                        onChange={(e) =>
                          setDodatkoweRozladunki((prev) => ({
                            ...prev,
                            [iso]: prev[iso].map((item, i) =>
                              i === idx
                                ? {
                                    ...item,
                                    kierowca_rozladunek: e.target.value,
                                  }
                                : item,
                            ),
                          }))
                        }
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-sm text-gray-500">Brak rozładunków</p>
          {/* Inne */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Inne:</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setInnePozycje((prev) => {
                      const aktualne = prev[iso] || [];
                      return {
                        ...prev,
                        [iso]: [
                          ...aktualne,
                          {
                            id: crypto.randomUUID(),
                            tresc: '',
                          },
                        ],
                      };
                    });
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  ➕ Dodaj pozycję
                </button>
                <button
                  onClick={() => {
                    setInnePozycje((prev) => {
                      const aktualne = prev[iso] || [];

                      if (wybranaInnaIndex !== null && wybranaInnaIndex >= 0) {
                        const nowe = aktualne.filter(
                          (_, i) => i !== wybranaInnaIndex,
                        );
                        setWybranaInnaIndex(null);
                        return { ...prev, [iso]: nowe };
                      }

                      return { ...prev, [iso]: aktualne.slice(0, -1) };
                    });
                  }}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  🗑️ Usuń pozycję
                </button>
              </div>
            </div>

            <table className="w-full border border-gray-300 text-sm">
              <tbody>
                {(innePozycje[iso] || []).map((p, idx) => (
                  <tr
                    key={p.id}
                    onClick={() => setWybranaInnaIndex(idx)}
                    className={
                      wybranaInnaIndex === idx
                        ? 'bg-yellow-100 cursor-pointer'
                        : 'hover:bg-gray-50 cursor-pointer'
                    }
                  >
                    <td className="border p-2">
                      <input
                        type="text"
                        value={p.tresc}
                        placeholder="Uwagi / Notatki / Inne informacje"
                        onChange={(e) =>
                          setInnePozycje((prev) => ({
                            ...prev,
                            [iso]: prev[iso].map((item, i) =>
                              i === idx
                                ? { ...item, tresc: e.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="w-full bg-transparent outline-none text-gray-600"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Plan;
