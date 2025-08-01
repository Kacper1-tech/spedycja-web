import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const Plan = () => {
  const [weeklyData, setWeeklyData] = useState({});
  const [noweZlecenia, setNoweZlecenia] = useState({}); // { [iso]: { numer_zlecenia: '...', dane: {...} } }
  const [zaladowaneZlecenia] = useState({}); // struktura: { [iso]: { [idx]: daneZlecenia } }
  const [dodatkoweRozladunki, setDodatkoweRozladunki] = useState({});
  const [wybranyRozladunekIndex, setWybranyRozladunekIndex] = useState(null);
  const [innePozycje, setInnePozycje] = useState({});
  const [wybranaInnaIndex, setWybranaInnaIndex] = useState(null);
  const [selectedDate] = useState(new Date());
  const selectedDateISO = selectedDate?.toISOString().split('T')[0];
  const aktualnieEdytowanaInnaIdRef = useRef(null);
  const isEditingInne = useRef(false);
  const [, setEdycja] = useState(null);
  const zapisWLokuRef = useRef(false);

  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        zapiszPlanDoSupabase();
      }, 1000),
    [],
  );

  const handlePrint = (iso) => {
    const content = document.getElementById(`print-${iso}`);
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    // Poczekaj aż nowe okno w pełni się otworzy (ma <head> i <body>)
    printWindow.addEventListener(
      'load',
      () => {
        const doc = printWindow.document;

        // Wyczyść startową zawartość
        if (doc.head) doc.head.innerHTML = '';
        if (doc.body) doc.body.innerHTML = '';

        // <title>
        const titleEl = doc.createElement('title');
        titleEl.textContent = `Plan rozładunków – ${iso}`;
        doc.head.appendChild(titleEl);

        // <style>
        const styleEl = doc.createElement('style');
        styleEl.textContent = `
      body { font-family: Arial, sans-serif; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #000; padding: 6px; text-align: left; }
      h3 { color: #000; margin-top: 24px; }
    `;
        doc.head.appendChild(styleEl);

        // Treść do wydruku (klonujemy HTML z bieżącej strony)
        const wrapper = doc.createElement('div');
        wrapper.innerHTML = content.innerHTML;
        doc.body.appendChild(wrapper);

        // Drukuj
        printWindow.focus();
        printWindow.print();
      },
      { once: true },
    );
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

  const dodajPustyRozladunek = async (data) => {
    const noweRozladunki = {
      id: uuidv4(),
      data: data, // np. "2025-07-25"
      zl_nazwa: '',
      miasto_rozladunku: '',
      kierowca: '',
      uwagi: '',
      // dodaj tu inne pola jeśli masz w tabeli Supabase
    };

    const { data: insertedData, error } = await supabase
      .from('plan_rozladunki')
      .insert([noweRozladunki]);

    if (error) {
      console.error('❌ Błąd przy dodawaniu rozładunku:', error.message);
    } else {
      console.log('✅ Rozładunek dodany:', insertedData);
    }
  };

  const parseMiasto = (json) => {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      return parsed?.[0]?.miasto || '';
    } catch {
      return '';
    }
  };

  // ───────────────────────────────────────────────────────────────────────────────
  // Pomocnicze: sprawdzenie czy jest co zapisać
  const hasSomethingToSave = () => {
    const aktywneInne = Object.values(innePozycje).some(
      (lista) =>
        Array.isArray(lista) && lista.some((item) => item?.opis?.trim() !== ''),
    );
    const aktywneRozladunki = Object.values(dodatkoweRozladunki).some(
      (lista) => Array.isArray(lista) && lista.length > 0,
    );
    const aktywneNowe = Object.keys(noweZlecenia).length > 0;

    return aktywneInne || aktywneRozladunki || aktywneNowe;
  };

  // ───────────────────────────────────────────────────────────────────────────────
  // Pomocnicze: upsert po (numer_zlecenia, data)
  const upsertPlanRozladunek = async (rekord) => {
    return await supabase
      .from('plan_rozladunki')
      .upsert(rekord, { onConflict: 'numer_zlecenia,data' });
  };

  // Pomocnicze: update po id
  const updatePlanRozladunekById = async (id, payload) => {
    return await supabase.from('plan_rozladunki').update(payload).eq('id', id);
  };

  // ───────────────────────────────────────────────────────────────────────────────
  // ── helpers dla sekcji INNE ───────────────────────────────────────────────────
  const shouldSkipInneItem = (item) => !item?.opis?.trim?.();

  const insertInne = async (iso, idx, item) => {
    const nowyRekord = { data: iso, opis: item.opis };
    const { data, error } = await supabase
      .from('plan_inne')
      .insert([nowyRekord])
      .select();

    if (error) {
      console.error('❌ Błąd INSERT (inne):', error.message, nowyRekord);
      return;
    }

    const newId = data?.[0]?.id;
    if (!newId) return;

    setInnePozycje((prev) => {
      const kopiaDnia = Array.isArray(prev[iso]) ? [...prev[iso]] : [];
      kopiaDnia[idx] = { id: newId, opis: item.opis };
      return { ...prev, [iso]: kopiaDnia };
    });
  };

  const updateInne = async (item) => {
    const { error } = await supabase
      .from('plan_inne')
      .update({ opis: item.opis })
      .eq('id', item.id);

    if (error) {
      console.error('❌ Błąd UPDATE (inne):', error.message, item);
    } else {
      console.log('✅ UPDATE wykonany (inne):', item);
    }
  };

  const processInneItem = async (iso, item, idx) => {
    if (shouldSkipInneItem(item)) return;
    if (!item.id || item.tymczasowy) {
      await insertInne(iso, idx, item);
      return;
    }
    await updateInne(item);
  };

  const saveInneForDay = async (iso, lista) => {
    const inneDnia = Array.isArray(lista) ? lista : [];
    for (let idx = 0; idx < inneDnia.length; idx++) {
      await processInneItem(iso, inneDnia[idx], idx);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────────
  // Zapis sekcji INNE (plan_inne) – wersja odchudzona
  const saveInne = async () => {
    const entries = Object.entries(innePozycje);
    for (const [iso, lista] of entries) {
      await saveInneForDay(iso, lista);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────────
  // ── helpers dla dodatkowych rozładunków ───────────────────────────────────────
  const isReadyRozladunek = (item) => item?.zaladowane !== false;

  const buildRozladunekPayload = (iso, item) => ({
    data: iso,
    numer_zlecenia: item?.numer_zlecenia ?? '',
    kierowca: item?.kierowca ?? '',
    zl_nazwa: item?.zl_nazwa ?? '',
    odprawa_importowa: item?.odprawa_importowa ?? '',
    miasto_rozladunku: item?.miasto_rozladunku ?? '',
    uwagi: item?.uwagi ?? '',
    pojazd: item?.pojazd ?? '',
    kierowca_rozladunek: item?.kierowca_rozladunek ?? '',
  });

  const insertRozladunekAndPatchState = async (iso, idx, payload) => {
    const { data, error } = await supabase
      .from('plan_rozladunki')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('❌ Błąd INSERT (rozładunki):', error.message);
      return;
    }
    const newId = data?.id;
    if (!newId) return;

    setDodatkoweRozladunki((prev) => {
      const arr = [...(prev[iso] || [])];
      arr[idx] = { ...arr[idx], id: newId };
      return { ...prev, [iso]: arr };
    });
  };

  const updateRozladunekById = async (id, payload) => {
    const { error } = await updatePlanRozladunekById(id, payload);
    if (error) console.error('❌ Błąd UPDATE (rozładunki):', error.message);
  };

  const processRozladunekItem = async (iso, item, idx) => {
    if (!isReadyRozladunek(item)) return; // wczesne wyjście
    const payload = buildRozladunekPayload(iso, item);
    if (item?.id) {
      await updateRozladunekById(item.id, payload);
      return;
    }
    await insertRozladunekAndPatchState(iso, idx, payload);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // Odchudzona funkcja główna
  const saveDodatkoweRozladunki = async () => {
    const entries = Object.entries(dodatkoweRozladunki).filter(
      ([, lista]) => Array.isArray(lista) && lista.length > 0,
    ); // filtr poza pętlą

    for (const [iso, lista] of entries) {
      // sekwencyjnie, aby utrzymać poprawny idx względem stanu
      for (let idx = 0; idx < lista.length; idx++) {
        await processRozladunekItem(iso, lista[idx], idx);
      }
    }
  };

  // ───────────────────────────────────────────────────────────────────────────────
  // Zapis głównych wierszy (noweZlecenia)
  const saveMainRows = async () => {
    for (const [iso, zlecenie] of Object.entries(noweZlecenia)) {
      if (!zlecenie || zlecenie?.zaladowane === false) continue;

      const dane = zlecenie?.dane || {};
      const warunekNumer = !!zlecenie?.numer_zlecenia?.trim();
      const warunekNazwa = !!dane?.zl_nazwa?.trim();
      const warunekAdresJson = !!dane?.adresy_dostawy_json;
      const warunekJsonNiePuste =
        JSON.stringify(dane.adresy_dostawy_json || {}) !== '{}';
      const warunekMiasto = !!parseMiasto(dane.adresy_dostawy_json);

      if (
        !warunekNumer ||
        !warunekNazwa ||
        !warunekAdresJson ||
        !warunekJsonNiePuste ||
        !warunekMiasto
      ) {
        continue;
      }

      const rekord = {
        data: iso,
        numer_zlecenia: zlecenie.numer_zlecenia.trim(),
        kierowca: dane.kierowca || '',
        zl_nazwa: dane.zl_nazwa || '',
        miasto_rozladunku: parseMiasto(dane.adresy_dostawy_json),
        uwagi: dane.uwagi || '',
        pojazd: dane.pojazd || '',
        kierowca_rozladunek: dane.kierowca_rozladunek || '',
      };

      console.log('⏺ zapisPlanDoSupabase (mainRow):', rekord);

      const { error } = await upsertPlanRozladunek(rekord);
      if (error) {
        console.error(
          '❌ Błąd zapisu głównego rozładunku:',
          error.message,
          rekord,
        );
        continue;
      }

      // po udanym zapisie czyścimy lokalny szkic, by nie dublował wiersza z bazy
      setNoweZlecenia((prev) => ({
        ...prev,
        [iso]: {
          ...prev[iso],
          zaladowane: true, // oznacz jako zapisane
        },
      }));
    }
  };

  // ───────────────────────────────────────────────────────────────────────────────
  // GŁÓWNA FUNKCJA – po refaktoryzacji
  const zapiszPlanDoSupabase = async () => {
    if (!hasSomethingToSave()) return;

    await saveInne();
    await saveDodatkoweRozladunki();
    await saveMainRows();

    // odśwież tylko raz na koniec
    await fetchPlanForDay();
  };

  const zapiszPojedynczeZlecenieDoSupabase = async (iso, zlecenie) => {
    if (!zlecenie?.numer_zlecenia?.trim()) {
      return;
    }

    const dane = zlecenie?.dane || {};

    const warunekNazwa = !!dane?.zl_nazwa?.trim();
    const warunekAdres = !!dane?.adresy_dostawy_json;
    const warunekAdresNiePusty =
      JSON.stringify(dane.adresy_dostawy_json || {}) !== '{}';
    const warunekMiasto = !!parseMiasto(dane.adresy_dostawy_json);

    if (
      !warunekNazwa ||
      !warunekAdres ||
      !warunekAdresNiePusty ||
      !warunekMiasto
    ) {
      return;
    }

    const rekord = {
      data: iso,
      numer_zlecenia: zlecenie.numer_zlecenia.trim(),
      kierowca: dane.kierowca || '',
      zl_nazwa: dane.zl_nazwa || '',
      miasto_rozladunku: parseMiasto(dane.adresy_dostawy_json),
      uwagi: dane.uwagi || '',
      pojazd: dane.pojazd || '',
      kierowca_rozladunek: dane.kierowca_rozladunek || '',
      odprawa_importowa:
        dane.odprawa_importowa ||
        (() => {
          try {
            const raw = dane.import_customs_adres_json;
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            const obj = Array.isArray(parsed) ? parsed[0] : parsed;
            const nazwa = (obj?.nazwa || '').trim();
            const miasto = (obj?.miasto || '').trim();
            if (nazwa && miasto) return `${nazwa}, ${miasto}`;
            return miasto || nazwa || '';
          } catch {
            return '';
          }
        })(),
    };

    console.log('⏺ zapisPojedynczeZlecenie:', rekord);

    try {
      const { error } = await supabase
        .from('plan_rozladunki')
        .upsert(rekord, { onConflict: 'numer_zlecenia,data' });

      if (error) {
        console.error(
          '❌ Błąd zapisu pojedynczego zlecenia:',
          error.message,
          rekord,
        );
      } else {
        console.log('✅ Zapisano pojedynczy rozładunek – rekord:', rekord);

        // Odśwież z małym opóźnieniem (aby zdążyło się zaktualizować)
        setTimeout(() => {
          fetchPlanForDay(iso); // PRZEKAZUJEMY iso jawnie
        }, 200); // lekko zwiększony delay
      }
    } catch (e) {
      console.error(
        '❌ Wyjątek podczas zapisu pojedynczego zlecenia:',
        e,
        rekord,
      );
    }
  };

  const fetchData = async () => {
    // 🛑 Przerwij automatyczne odświeżenie jeśli trwa edycja
    if (
      aktualnieEdytowanaInnaIdRef.current !== null ||
      isEditingInne.current === true
    ) {
      return;
    }
    const exportRes = await supabase.from('zlecenia_export').select('*');
    const importRes = await supabase.from('zlecenia_import').select('*');

    const zaladunkiOrders = exportRes.data || [];
    const rozladunkiOrders = importRes.data || [];

    const allDatesSet = new Set();

    // zbierz wszystkie unikalne daty załadunku i rozładunku
    zaladunkiOrders.forEach((order) => {
      if (order.pickup_date_start) {
        allDatesSet.add(order.pickup_date_start);
      }
    });
    rozladunkiOrders.forEach((order) => {
      if (order.delivery_date_end) {
        allDatesSet.add(order.delivery_date_end);
      }
    });

    const allDates = Array.from(allDatesSet).sort((a, b) => a.localeCompare(b));
    const dataByDay = {};
    allDates.forEach((iso) => {
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

    // 🔄 Pobierz rozładunki z plan_rozladunki
    const planRes = await supabase.from('plan_rozladunki').select('*');
    const planData = planRes.data || [];

    const noweRozladunki = {};
    planData.forEach((row) => {
      const iso = dayjs(row.data).format('YYYY-MM-DD');
      if (!noweRozladunki[iso]) noweRozladunki[iso] = [];
      noweRozladunki[iso].push(row);
    });

    setDodatkoweRozladunki(noweRozladunki);

    // 🆕 Pobierz INNE z plan_inne
    const inneRes = await supabase.from('plan_inne').select('*');
    const noweInne = {};

    inneRes.data?.forEach((row) => {
      if (!noweInne[row.data]) noweInne[row.data] = [];
      noweInne[row.data].push({
        id: row.id,
        opis: row.opis,
      });
    });

    setInnePozycje((prev) => {
      const merged = { ...prev };
      for (const iso of Object.keys(noweInne)) {
        merged[iso] = noweInne[iso];
      }
      return merged;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(); // automatycznie pobiera dane co X sekund
    }, 5000); // co 10 000 ms = 10 sekund (możesz zmienić na np. 5000 dla 5 sek.)

    return () => clearInterval(interval); // wyczyść po odmontowaniu
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const weekDates = Object.keys(weeklyData)
    .sort((a, b) => a.localeCompare(b)) // ⬅️ dodany compare
    .map((iso) => ({
      iso,
      label: new Date(iso).toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
      }),
    }));

  const fetchPlanForDay = async (data = selectedDateISO) => {
    if (!selectedDateISO) return;

    // 🎯 Rzutowanie na czystą datę bez godziny
    const tylkoData = dayjs(data).format('YYYY-MM-DD');

    const { data: dataRozladunki, error: errorRozladunki } = await supabase
      .from('plan_rozladunki')
      .select('*')
      .eq('data', tylkoData);

    console.log('🎯 dane z Supabase (plan_rozladunki)', dataRozladunki);

    if (errorRozladunki) {
      console.error('❌ Błąd pobierania rozładunków:', errorRozladunki.message);
      return;
    }

    const rozladunki = dataRozladunki || [];

    setDodatkoweRozladunki((prev) => ({
      ...prev,
      [tylkoData]: rozladunki,
    }));

    // INNE
    const { data: dataInne, error: errorInne } = await supabase
      .from('plan_inne')
      .select('*')
      .eq('data', tylkoData);

    if (errorInne) {
      console.error('❌ Błąd pobierania INNE:', errorInne.message);
      return;
    }

    const inne = (dataInne || []).map((item) => ({
      id: item.id,
      opis: item.opis,
    }));

    setInnePozycje((prev) => {
      const aktualne = prev[tylkoData] || [];
      const noweDane = [...aktualne];

      for (const nowyItem of inne) {
        const index = noweDane.findIndex((x) => x.id === nowyItem.id);
        if (nowyItem.id !== aktualnieEdytowanaInnaIdRef.current) {
          if (index !== -1) {
            noweDane[index] = nowyItem;
          } else {
            noweDane.push(nowyItem);
          }
        }
      }

      return {
        ...prev,
        [tylkoData]: noweDane,
      };
    });
  };

  useEffect(() => {
    if (!selectedDateISO) return;
    fetchPlanForDay(); // teraz globalna funkcja
  }, [selectedDateISO]);

  useEffect(() => {
    const datyZRozladunkami = Object.entries(dodatkoweRozladunki)
      .filter(([, lista]) => Array.isArray(lista) && lista.length > 0)
      .map(([data]) => data);

    const datyZInnymi = Object.entries(innePozycje)
      .filter(
        ([, lista]) =>
          Array.isArray(lista) &&
          lista.some((p) => p.opis && p.opis.trim() !== ''),
      )
      .map(([data]) => data);

    const aktywneDaty = [...new Set([...datyZRozladunkami, ...datyZInnymi])];

    if (aktywneDaty.length === 0) return; // ⛔ nie uruchamiaj debouncedSave, jeśli nie ma nic do zapisania

    debouncedSave(); // 🟢 zapis, jeśli są realne dane
  }, [dodatkoweRozladunki, innePozycje]);

  return (
    <div className="p-4 space-y-8">
      {weekDates.map(({ iso, label }) => (
        <div key={iso} className="border rounded-xl p-4 shadow bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold capitalize text-blue-700">
              {label}
            </h2>
            <button
              onClick={() => handlePrint(iso)}
              className="no-print px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              🖨️ Drukuj
            </button>
          </div>
          <div id={`print-${iso}`}>
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
                      // sonarjs-disable-next-line javascript:S6479
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
                            defaultValue=""
                            onBlur={async (e) => {
                              const { error } = await supabase
                                .from('zlecenia_export')
                                .update({ uwagi: e.target.value })
                                .eq('id', z.id);
                              if (error)
                                console.error(
                                  'Błąd zapisu uwag:',
                                  error.message,
                                );
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
                  className="no-print px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  ➕ Dodaj rozładunek
                </button>
                <button
                  onClick={async () => {
                    setDodatkoweRozladunki(async (prev) => {
                      const aktualne = prev[iso] || [];

                      // Jeżeli coś jest wybrane do usunięcia
                      if (
                        wybranyRozladunekIndex !== null &&
                        wybranyRozladunekIndex >= 0
                      ) {
                        const rozladunek = aktualne[wybranyRozladunekIndex];

                        // 🔹 Jeśli ma id → usuń z bazy
                        if (rozladunek?.id) {
                          const { error } = await supabase
                            .from('plan_rozladunki')
                            .delete()
                            .eq('id', rozladunek.id);

                          if (error) {
                            console.error(
                              '❌ Błąd DELETE (rozładunki):',
                              error.message,
                            );
                            return prev; // jeśli się nie udało, nic nie zmieniaj lokalnie
                          }
                        }

                        // 🔹 Usuń lokalnie
                        const nowe = aktualne.filter(
                          (_, i) => i !== wybranyRozladunekIndex,
                        );
                        setWybranyRozladunekIndex(null);
                        return { ...prev, [iso]: nowe };
                      }

                      // Jeśli nic nie jest wybrane → usuń ostatni wiersz
                      const ostatni = aktualne[aktualne.length - 1];

                      // 🔹 Jeśli ostatni ma id → usuń z bazy
                      if (ostatni?.id) {
                        const { error } = await supabase
                          .from('plan_rozladunki')
                          .delete()
                          .eq('id', ostatni.id);

                        if (error) {
                          console.error(
                            '❌ Błąd DELETE (rozładunki):',
                            error.message,
                          );
                          return prev;
                        }
                      }

                      // 🔹 Usuń lokalnie ostatni wiersz
                      return { ...prev, [iso]: aktualne.slice(0, -1) };
                    });
                  }}
                  className="no-print px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
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
                  {(!dodatkoweRozladunki[iso] ||
                    dodatkoweRozladunki[iso].length === 0) && (
                    <tr>
                      {/* Nr zlecenia - w głównym wierszu */}
                      <td className="border p-2">
                        <input
                          type="text"
                          value={
                            noweZlecenia[iso]?.numer_zlecenia ??
                            dodatkoweRozladunki[iso]?.[0]?.numer_zlecenia ??
                            ''
                          }
                          onChange={(e) => {
                            const numer = e.target.value;
                            setNoweZlecenia((prev) => ({
                              ...prev,
                              [iso]: {
                                ...(prev[iso] || {}),
                                numer_zlecenia: numer,
                              },
                            }));
                          }}
                          onBlur={async () => {
                            const wpisanyNumer =
                              noweZlecenia[iso]?.numer_zlecenia?.trim();
                            if (!wpisanyNumer) return;

                            if (zapisWLokuRef.current) return;
                            zapisWLokuRef.current = true;

                            const { data: daneZlecenia, error } = await supabase
                              .from('zlecenia_import')
                              .select('*')
                              .eq('numer_zlecenia', wpisanyNumer)
                              .maybeSingle();

                            if (error || !daneZlecenia) {
                              console.error(
                                '❌ Nie znaleziono zlecenia:',
                                error?.message,
                              );
                              zapisWLokuRef.current = false;
                              return;
                            }

                            const aktualne = {
                              numer_zlecenia: wpisanyNumer,
                              dane: {
                                kierowca: daneZlecenia.kierowca || '',
                                zl_nazwa: daneZlecenia.zl_nazwa || '',
                                uwagi: daneZlecenia.uwagi || '',
                                pojazd: daneZlecenia.pojazd || '',
                                kierowca_rozladunek:
                                  daneZlecenia.kierowca_rozladunek || '',
                                import_customs_adres_json:
                                  daneZlecenia.import_customs_adres_json || '',
                                adresy_dostawy_json:
                                  daneZlecenia.adresy_dostawy_json || '',
                                odprawa_importowa:
                                  daneZlecenia.odprawa_importowa ||
                                  (() => {
                                    try {
                                      const raw =
                                        daneZlecenia.import_customs_adres_json;
                                      const parsed =
                                        typeof raw === 'string'
                                          ? JSON.parse(raw)
                                          : raw;
                                      const obj = Array.isArray(parsed)
                                        ? parsed[0]
                                        : parsed;
                                      const nazwa = (obj?.nazwa || '').trim();
                                      const miasto = (obj?.miasto || '').trim();
                                      return nazwa && miasto
                                        ? `${nazwa}, ${miasto}`
                                        : miasto || nazwa || '';
                                    } catch {
                                      return '';
                                    }
                                  })(),
                              },
                            };

                            setNoweZlecenia((prev) => ({
                              ...prev,
                              [iso]: aktualne,
                            }));

                            console.log('✅ noweZlecenia po onBlur:', aktualne);

                            await zapiszPojedynczeZlecenieDoSupabase(
                              iso,
                              aktualne,
                            );

                            zapisWLokuRef.current = false;
                          }}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>

                      {/* Kierowca - w głównym wierszu */}
                      <td className="border p-2">
                        <input
                          type="text"
                          value={
                            noweZlecenia[iso]?.dane?.kierowca ??
                            dodatkoweRozladunki[iso]?.[0]?.dane?.kierowca ??
                            ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setNoweZlecenia((prev) => ({
                              ...prev,
                              [iso]: {
                                ...(prev[iso] || {}),
                                dane: {
                                  ...(prev[iso]?.dane || {}),
                                  kierowca: val,
                                },
                              },
                            }));
                          }}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>

                      {/* Zleceniodawca - w głównym wierszu */}
                      <td className="border p-2">
                        <input
                          type="text"
                          value={
                            noweZlecenia[iso]?.dane?.zl_nazwa ??
                            dodatkoweRozladunki[iso]?.[0]?.zl_nazwa ??
                            ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setNoweZlecenia((prev) => ({
                              ...prev,
                              [iso]: {
                                ...(prev[iso] || {}),
                                dane: {
                                  ...(prev[iso]?.dane || {}),
                                  zl_nazwa: val, // aktualizujemy tylko zl_nazwa
                                },
                              },
                            }));
                          }}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>

                      {/* Odprawa importowa - w głównym wierszu */}
                      <td className="border p-2">
                        {(() => {
                          try {
                            const json =
                              noweZlecenia[iso]?.dane
                                ?.import_customs_adres_json ??
                              dodatkoweRozladunki[iso]?.[0]
                                ?.import_customs_adres_json;

                            if (!json) return '—';

                            const parsed =
                              typeof json === 'string'
                                ? JSON.parse(json)
                                : json;

                            const miasto =
                              parsed?.miasto ||
                              (Array.isArray(parsed)
                                ? parsed[0]?.miasto
                                : undefined);

                            return miasto || '—';
                          } catch {
                            return '—';
                          }
                        })()}
                      </td>

                      {/* Miasto rozładunku - w głównym wierszu */}
                      <td className="border p-2">
                        {(() => {
                          try {
                            const json =
                              noweZlecenia[iso]?.dane?.adresy_dostawy_json ??
                              dodatkoweRozladunki[iso]?.[0]
                                ?.adresy_dostawy_json;

                            if (!json) return '—';

                            const parsed =
                              typeof json === 'string'
                                ? JSON.parse(json)
                                : json;

                            return Array.isArray(parsed)
                              ? parsed[0]?.miasto || '—'
                              : parsed?.miasto || '—';
                          } catch {
                            return '—';
                          }
                        })()}
                      </td>

                      {/* Uwagi - w głównym wierszu */}
                      <td className="border p-2">
                        <input
                          type="text"
                          value={
                            noweZlecenia[iso]?.dane?.uwagi ??
                            dodatkoweRozladunki[iso]?.[0]?.uwagi ??
                            ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setNoweZlecenia((prev) => ({
                              ...prev,
                              [iso]: {
                                ...(prev[iso] || {}),
                                numer_zlecenia: prev[iso]?.numer_zlecenia || '', // upewniamy się, że numer zostaje
                                dane: {
                                  ...(prev[iso]?.dane || {}),
                                  uwagi: val,
                                },
                              },
                            }));
                          }}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>

                      {/* Pojazd - w głównym wierszu */}
                      <td className="border p-2">
                        <input
                          type="text"
                          value={
                            noweZlecenia[iso]?.dane?.pojazd ??
                            dodatkoweRozladunki[iso]?.[0]?.pojazd ??
                            ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setNoweZlecenia((prev) => ({
                              ...prev,
                              [iso]: {
                                ...(prev[iso] || {}),
                                numer_zlecenia: prev[iso]?.numer_zlecenia || '',
                                dane: {
                                  ...(prev[iso]?.dane || {}),
                                  pojazd: val,
                                },
                              },
                            }));
                          }}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>

                      {/* Kierowca (rozładunek) - w głównym wierszu */}
                      <td className="border p-2">
                        <input
                          type="text"
                          value={
                            noweZlecenia[iso]?.dane?.kierowca_rozladunek ??
                            dodatkoweRozladunki[iso]?.[0]
                              ?.kierowca_rozladunek ??
                            ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setNoweZlecenia((prev) => ({
                              ...prev,
                              [iso]: {
                                ...(prev[iso] || {}),
                                numer_zlecenia: prev[iso]?.numer_zlecenia || '',
                                dane: {
                                  ...(prev[iso]?.dane || {}),
                                  kierowca_rozladunek: val,
                                },
                              },
                            }));
                          }}
                          className="w-full bg-transparent outline-none"
                        />
                      </td>
                    </tr>
                  )}
                  {/* WIERSZE DODATKOWYCH ROZŁADUNKÓW W TABELI ROZŁADUNKI */}
                  {Object.entries(dodatkoweRozladunki)
                    .filter(([key]) => key === iso)
                    .flatMap(([, rozladunkiLista]) =>
                      (rozladunkiLista ?? []).map((z, idx) => (
                        <React.Fragment key={`${iso}-${z.id ?? idx}`}>
                          <tr
                            onClick={() => setWybranyRozladunekIndex(idx)}
                            className={
                              wybranyRozladunekIndex === idx
                                ? 'bg-yellow-100 cursor-pointer'
                                : 'hover:bg-gray-50 cursor-pointer'
                            }
                          >
                            {/* Nr zlecenia - w dodatkowym wierszu rozładunków */}
                            <td className="border p-2">
                              <input
                                type="text"
                                value={z.numer_zlecenia || ''}
                                onChange={(e) => {
                                  const val = e.target.value;

                                  setDodatkoweRozladunki((prev) => {
                                    const nowe = [...(prev[iso] || [])];
                                    nowe[idx] = {
                                      ...nowe[idx],
                                      numer_zlecenia: val,
                                      zaladowane: false,
                                    };
                                    return { ...prev, [iso]: nowe };
                                  });

                                  // ❌ usuwamy debouncedSave tutaj – zapis będzie w onBlur
                                }}
                                onBlur={async () => {
                                  const wpisanyNumer = z.numer_zlecenia?.trim();
                                  if (!wpisanyNumer) return;

                                  const { data: daneZlecenia, error } =
                                    await supabase
                                      .from('zlecenia_import')
                                      .select('*')
                                      .eq('numer_zlecenia', wpisanyNumer)
                                      .maybeSingle();

                                  if (error || !daneZlecenia) {
                                    console.error(
                                      '❌ Nie znaleziono zlecenia:',
                                      error?.message,
                                    );
                                    return;
                                  }

                                  setDodatkoweRozladunki((prev) => {
                                    const nowe = [...(prev[iso] || [])];
                                    nowe[idx] = {
                                      ...nowe[idx],
                                      numer_zlecenia: wpisanyNumer,
                                      kierowca: daneZlecenia.kierowca || '',
                                      zl_nazwa: daneZlecenia.zl_nazwa || '',
                                      uwagi: daneZlecenia.uwagi || '',
                                      pojazd: daneZlecenia.pojazd || '',
                                      kierowca_rozladunek:
                                        daneZlecenia.kierowca_rozladunek || '',
                                      miasto_rozladunku: parseMiasto(
                                        daneZlecenia.adresy_dostawy_json,
                                      ),
                                      zaladowane: true, // ✅ tu dodajesz zaladowane: true
                                    };
                                    return { ...prev, [iso]: nowe };
                                  });

                                  // ✅ teraz dopiero zapisuj dane
                                  debouncedSave();
                                }}
                                className="w-full bg-transparent outline-none"
                              />
                            </td>

                            {/* Kierowca - w dodatkowym wierszu rozładunków */}
                            <td className="border p-2">
                              <input
                                type="text"
                                value={z.kierowca}
                                onChange={(e) => {
                                  const val = e.target.value;

                                  setDodatkoweRozladunki((prev) => {
                                    const nowe = prev[iso].map((item, i) =>
                                      i === idx
                                        ? { ...item, kierowca: val }
                                        : item,
                                    );
                                    return { ...prev, [iso]: nowe };
                                  });

                                  // zapis do bazy odbędzie się później w zapiszPlanDoSupabase przez debouncedSave()
                                  debouncedSave();
                                }}
                                className="w-full bg-transparent outline-none"
                              />
                            </td>

                            {/* Zleceniodawca - w dodatkowym wierszu rozładunków */}
                            <td className="border p-2">
                              <input
                                type="text"
                                value={
                                  z.zl_nazwa ||
                                  zaladowaneZlecenia[iso]?.[idx]?.zl_nazwa ||
                                  ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;

                                  setDodatkoweRozladunki((prev) => {
                                    const nowe = prev[iso].map((item, i) =>
                                      i === idx
                                        ? { ...item, zl_nazwa: val }
                                        : item,
                                    );
                                    return { ...prev, [iso]: nowe };
                                  });

                                  // Zapis tylko przez debouncedSave
                                  debouncedSave();
                                }}
                                className="w-full bg-transparent outline-none"
                              />
                            </td>
                            {/* Odprawa importowa - w głównym wierszu */}
                            <td className="border p-2">
                              {(() => {
                                try {
                                  const json =
                                    noweZlecenia[iso]?.dane
                                      ?.import_customs_adres_json;
                                  if (!json) return '—';
                                  const parsed =
                                    typeof json === 'string'
                                      ? JSON.parse(json)
                                      : json;
                                  return parsed?.miasto || '—';
                                } catch {
                                  return '—';
                                }
                              })()}
                            </td>

                            {/* Miasto rozładunku - w głównym wierszu */}
                            <td className="border p-2">
                              {(() => {
                                try {
                                  const json =
                                    noweZlecenia[iso]?.dane
                                      ?.adresy_dostawy_json;
                                  if (!json) return '—';
                                  const parsed =
                                    typeof json === 'string'
                                      ? JSON.parse(json)
                                      : json;
                                  return Array.isArray(parsed)
                                    ? parsed[0]?.miasto || '—'
                                    : parsed?.miasto || '—';
                                } catch {
                                  return '—';
                                }
                              })()}
                            </td>

                            {/* Uwagi - w dodatkowym wierszu rozładunków */}
                            <td className="border p-2">
                              <input
                                type="text"
                                value={z.uwagi || ''}
                                onChange={(e) => {
                                  const val = e.target.value;

                                  setDodatkoweRozladunki((prev) => {
                                    const nowe = prev[iso].map((item, i) =>
                                      i === idx
                                        ? { ...item, uwagi: val }
                                        : item,
                                    );
                                    return { ...prev, [iso]: nowe };
                                  });

                                  // Zapis tylko przez debounce
                                  debouncedSave();
                                }}
                                className="w-full bg-transparent outline-none"
                              />
                            </td>

                            {/* Pojazd - w dodatkowym wierszu rozładunków */}
                            <td className="border p-2">
                              <input
                                type="text"
                                value={z.pojazd || ''}
                                onChange={(e) => {
                                  const val = e.target.value;

                                  setDodatkoweRozladunki((prev) => {
                                    const nowe = prev[iso].map((item, i) =>
                                      i === idx
                                        ? { ...item, pojazd: val }
                                        : item,
                                    );
                                    return { ...prev, [iso]: nowe };
                                  });

                                  // Zapis tylko przez debounce
                                  debouncedSave();
                                }}
                                className="w-full bg-transparent outline-none"
                              />
                            </td>

                            {/* Kierowca(rozładunek) - w dodatkowym wierszu rozładunków */}
                            <td className="border p-2">
                              <input
                                type="text"
                                value={z.kierowca_rozladunek || ''}
                                onChange={(e) => {
                                  const val = e.target.value;

                                  setDodatkoweRozladunki((prev) => {
                                    const nowe = prev[iso].map((item, i) =>
                                      i === idx
                                        ? { ...item, kierowca_rozladunek: val }
                                        : item,
                                    );
                                    return { ...prev, [iso]: nowe };
                                  });

                                  // zapis tylko przez debounce
                                  debouncedSave();
                                }}
                                className="w-full bg-transparent outline-none"
                              />
                            </td>
                          </tr>
                        </React.Fragment>
                      )),
                    )}
                </tbody>
              </table>
            )}
            {/* Inne */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">Inne:</h3>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const { data, error } = await supabase
                        .from('plan_inne')
                        .insert([{ data: iso, opis: '' }])
                        .select();

                      if (error) {
                        console.error(
                          '❌ Błąd przy dodawaniu nowej pozycji:',
                          error.message,
                        );
                        return;
                      }

                      if (data?.[0]?.id) {
                        setInnePozycje((prev) => ({
                          ...prev,
                          [iso]: [
                            ...(prev[iso] || []),
                            { id: data[0].id, opis: '' },
                          ],
                        }));
                      }
                    }}
                  >
                    ➕ Dodaj pozycję
                  </button>
                  <button
                    onClick={async () => {
                      setInnePozycje((prev) => {
                        const aktualne = prev[iso] || [];
                        return { ...prev, [iso]: aktualne }; // żeby zapewnić dostęp do `aktualne` później
                      });

                      const aktualne = innePozycje[iso] || [];

                      if (
                        wybranaInnaIndex !== null &&
                        wybranaInnaIndex >= 0 &&
                        aktualne[wybranaInnaIndex]
                      ) {
                        const item = aktualne[wybranaInnaIndex];

                        // Jeśli ma `id`, to usuń z Supabase
                        if (item.id) {
                          const { error } = await supabase
                            .from('plan_inne')
                            .delete()
                            .eq('id', item.id);

                          if (error) {
                            console.error(
                              '❌ Błąd usuwania z Supabase:',
                              error.message,
                            );
                            return;
                          }
                        }

                        // Usuń lokalnie po udanym DELETE
                        setInnePozycje((prev) => {
                          const aktualne = prev[iso] || [];
                          const nowe = aktualne.filter(
                            (_, i) => i !== wybranaInnaIndex,
                          );
                          return { ...prev, [iso]: nowe };
                        });
                        setWybranaInnaIndex(null);
                      } else {
                        // Usuń ostatnią pozycję jeśli nic nie zaznaczono
                        const ostatnia = aktualne[aktualne.length - 1];
                        if (ostatnia?.id) {
                          const { error } = await supabase
                            .from('plan_inne')
                            .delete()
                            .eq('id', ostatnia.id);
                          if (error) {
                            console.error(
                              '❌ Błąd usuwania ostatniego wpisu:',
                              error.message,
                            );
                            return;
                          }
                        }

                        setInnePozycje((prev) => {
                          const aktualne = prev[iso] || [];
                          return { ...prev, [iso]: aktualne.slice(0, -1) };
                        });
                      }
                    }}
                    className="no-print px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
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
                        {p && (
                          <input
                            type="text"
                            value={p.opis || ''}
                            placeholder="Uwagi / Notatki / Inne informacje"
                            onFocus={() => {
                              isEditingInne.current = true;
                              setEdycja(p.id);
                            }}
                            onBlur={() => {
                              isEditingInne.current = false;
                              setEdycja(null);
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              setInnePozycje((prev) => {
                                const aktualne = Array.isArray(prev[iso])
                                  ? [...prev[iso]]
                                  : [];

                                const index = aktualne.findIndex(
                                  (x) => x.id === p.id,
                                );
                                if (index !== -1) {
                                  aktualne[index] = {
                                    ...aktualne[index],
                                    opis: val,
                                  };
                                }

                                return { ...prev, [iso]: aktualne };
                              });
                            }}
                            className="w-full bg-transparent outline-none text-gray-600"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Plan;
