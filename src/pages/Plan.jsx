import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import LoadList from '../components/LoadList.jsx';
import UnloadList from '../components/UnloadList.jsx';
import OtherList from '../components/OtherList.jsx';

const Plan = () => {
  const [unloadList, setUnloadList] = useState(null);
  const [loadList, setLoadList] = useState(null);
  const [otherList, setOtherList] = useState(null);

  const groupedOtherList = useMemo(() => {
    if (!otherList) return null;
    return otherList.reduce((acc, item) => {
      const date = item.data;
      if (date) {
        acc[date] = acc[date] || [];
        acc[date].push(item);
      }
      return acc;
    }, {});
  }, [otherList]);

  // --- multi-print state & helpers ---
  const [selectedDates, setSelectedDates] = useState(new Set());

  const toggleDate = (date) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const clearSelection = () => setSelectedDates(new Set());

  // Klon z przeniesieniem wartości input/textarea/select
  const cloneWithFormValues = (sourceEl) => {
    const clone = sourceEl.cloneNode(true);
    const srcInputs = sourceEl.querySelectorAll('input, textarea, select');
    const dstInputs = clone.querySelectorAll('input, textarea, select');
    dstInputs.forEach((el, idx) => {
      const src = srcInputs[idx];
      if (!src) return;
      if (el.tagName === 'SELECT') {
        Array.from(el.options).forEach((opt) => {
          opt.selected = opt.value === src.value;
        });
      } else if (el.tagName === 'TEXTAREA') {
        el.textContent = src.value ?? '';
      } else {
        el.setAttribute('value', src.value ?? '');
      }
    });
    return clone;
  };

  const groupedUnloadList = useMemo(() => {
    if (!unloadList) return null;
    return unloadList.reduce((acc, item) => {
      const date = item.data;
      if (date) {
        acc[date] = acc[date] || [];
        acc[date].push(item);
      }
      return acc;
    }, {});
  }, [unloadList]);

  const groupedLoadList = useMemo(() => {
    if (!loadList) return null;
    return loadList?.reduce((acc, item) => {
      const date = item.pickup_date_start;
      if (date) {
        acc[date] = acc[date] || [];
        acc[date].push(item);
      }
      return acc;
    }, {});
  }, [loadList]);

  const loadDates = Object.keys(groupedLoadList ?? {});
  const unloadDates = Object.keys(groupedUnloadList ?? {});
  const otherDates = Object.keys(groupedOtherList ?? {});
  const allDates = [
    ...new Set([...loadDates, ...unloadDates, ...otherDates]),
  ].sort((a, b) => new Date(b) - new Date(a));

  const handlePrint = (date) => {
    const sourceEl = document.getElementById(`date-${date}`);
    if (!sourceEl) return;

    // Klonujemy sekcję do wydruku i przenosimy wartości pól formularza
    const clone = sourceEl.cloneNode(true);
    const srcInputs = sourceEl.querySelectorAll('input, textarea, select');
    const dstInputs = clone.querySelectorAll('input, textarea, select');

    dstInputs.forEach((el, idx) => {
      const src = srcInputs[idx];
      if (!src) return;
      if (el.tagName === 'SELECT') {
        Array.from(el.options).forEach((opt) => {
          opt.selected = opt.value === src.value;
        });
      } else if (el.tagName === 'TEXTAREA') {
        el.textContent = src.value ?? '';
      } else {
        el.setAttribute('value', src.value ?? '');
      }
    });

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Plan rozładunków – ${date}</title>
  <style>
    @media print { .no-print { display: none; } }
    html, body { margin: 0; padding: 16px; font-family: Arial, sans-serif; font-size: 12px; }
    h2, h3 { margin: 12px 0 8px; color: #000; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; }
    input, textarea, select { border: none; outline: none; }
  </style>
</head>
<body>
  ${clone.innerHTML}
  <script>
    window.onafterprint = () => window.close();
  <\/script>
</body>
</html>`.trim();

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return; // jeśli zablokowano pop-upy

    w.document.open();
    w.document.write(html);
    w.document.close();

    // Po zrenderowaniu treści inicjuj druk
    w.onload = () => {
      try {
        w.focus();
        w.print();
      } catch (_) {}
    };

    // Fallback dla przeglądarek, które nie wywołują onload po document.write
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch (_) {}
    }, 300);
  };

  const handlePrintSelected = () => {
    if (selectedDates.size === 0) return;

    const sections = [];
    [...selectedDates]
      .sort((a, b) => new Date(b) - new Date(a)) // np. od najnowszej
      .forEach((date) => {
        const container = document.getElementById(`date-${date}`);
        if (!container) return;
        const cloned = cloneWithFormValues(container);
        // Usuń elementy, których nie chcesz na wydruku
        cloned
          .querySelectorAll('.no-print,[data-print="hide"]')
          .forEach((el) => el.remove());

        sections.push(`<h2 style="margin:16px 0 8px;">${date}</h2>`);
        sections.push(cloned.innerHTML);
        sections.push(
          '<hr style="margin:24px 0;border:none;border-top:1px solid #000;" />',
        );
      });

    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Plan – druk zbiorczy</title>
<style>
  @media print { .no-print { display: none; } }
  html, body { margin: 0; padding: 16px; font-family: Arial, sans-serif; font-size: 12px; }
  h2, h3 { color: #000; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; }
  input, textarea, select { border: none; outline: none; }
</style>
</head>
<body>
  ${sections.join('\n')}
  <script>window.onafterprint = () => window.close();<\/script>
</body>
</html>`.trim();

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      try {
        w.focus();
        w.print();
      } catch (_) {}
    };
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch (_) {}
    }, 300);
  };

  const parseMiasto = (json) => {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      return parsed?.[0]?.miasto || '';
    } catch {
      return '';
    }
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
      id: uuidv4(),
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

    try {
      const { error } = await supabase
        .from('plan_rozladunki')
        .upsert(rekord, { onConflict: 'numer_zlecenia' })
        .select();

      if (error) {
        console.error(
          '❌ Błąd zapisu pojedynczego zlecenia:',
          error.message,
          rekord,
        );
      } else {
        console.log('✅ Zapisano pojedynczy rozładunek – rekord:', rekord);
        await getUnloadList();
      }
    } catch (e) {
      console.error(
        '❌ Wyjątek podczas zapisu pojedynczego zlecenia:',
        e,
        rekord,
      );
    }
  };

  const getLoadsList = async () => {
    const exportRes = await supabase.from('zlecenia_export').select('*');
    if (exportRes.error) {
      throw Error('Bład podczas pobierania zleceń export');
    }

    setLoadList(exportRes.data);
  };

  const getUnloadList = async () => {
    const exportRes = await supabase.from('plan_rozladunki').select('*');
    if (exportRes.error) {
      throw Error('Bład podczas pobierania zleceń import');
    }

    setUnloadList(exportRes.data);
  };

  const getOtherList = async () => {
    const res = await supabase.from('plan_inne').select('*');
    if (res.error) {
      throw Error('Bład podczas pobierania innych');
    }

    setOtherList(res.data);
  };

  useEffect(() => {
    getLoadsList();
    getUnloadList();
    getOtherList();
  }, []);

  const handleFieldChange = async (e, id) => {
    const { error, data } = await supabase
      .from('zlecenia_export')
      .update({ [e.target.name]: e.target.value })
      .eq('id', id)
      .select()
      .single();
    if (error) console.error('Błąd zapisu pojazdu:', error.message);

    setLoadList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item)),
    );
  };

  const handleUnloadFieldChange = async (e, id) => {
    console.log(e.target.name, id);
    const { error, data } = await supabase
      .from('plan_rozladunki')
      .update({ [e.target.name]: e.target.value })
      .eq('id', id)
      .select()
      .single();
    if (error) console.error('Błąd zapisu pojazdu:', error.message);

    setUnloadList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item)),
    );
  };

  const handleAddNewUnload = async (e, date) => {
    const { data: daneZlecenia, error } = await supabase
      .from('zlecenia_import')
      .select('*')
      .eq('numer_zlecenia', e.target.value)
      .maybeSingle();

    if (error || !daneZlecenia) {
      console.error('❌ Nie znaleziono zlecenia:', error?.message);
      return;
    }

    const aktualne = {
      numer_zlecenia: e.target.value,
      dane: {
        kierowca: daneZlecenia.kierowca || '',
        zl_nazwa: daneZlecenia.zl_nazwa || '',
        uwagi: daneZlecenia.uwagi || '',
        pojazd: daneZlecenia.pojazd || '',
        kierowca_rozladunek: daneZlecenia.kierowca_rozladunek || '',
        import_customs_adres_json: daneZlecenia.import_customs_adres_json || '',
        adresy_dostawy_json: daneZlecenia.adresy_dostawy_json || '',
        odprawa_importowa:
          daneZlecenia.odprawa_importowa ||
          (() => {
            try {
              const raw = daneZlecenia.import_customs_adres_json;
              const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
              const obj = Array.isArray(parsed) ? parsed[0] : parsed;
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
    await zapiszPojedynczeZlecenieDoSupabase(date, aktualne);
  };

  const handleRemoveUnload = async (id) => {
    const { error } = await supabase
      .from('plan_rozladunki')
      .delete()
      .eq('id', id);
    if (!error) {
      setUnloadList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleOtherFieldChange = async (e, id) => {
    console.log(e.target.name, id);
    const { error, data } = await supabase
      .from('plan_inne')
      .update({ [e.target.name]: e.target.value })
      .eq('id', id)
      .select()
      .single();
    if (error) console.error('Błąd zapisu pojazdu:', error.message);

    setOtherList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item)),
    );
  };

  const handleAddNewOther = async (e, date) => {
    if (e.target.value.trim() === '') {
      console.error('❌ Błąd zapisu pojedynczego zlecenia:');
      return;
    }
    const rekord = {
      id: uuidv4(),
      data: date,
      opis: e.target.value,
    };

    const { error, data } = await supabase
      .from('plan_inne')
      .upsert(rekord)
      .select()
      .single();

    if (error) {
      console.error(
        '❌ Błąd zapisu pojedynczego zlecenia:',
        error.message,
        rekord,
      );
    } else {
      setOtherList((prev) => [...prev, data]);
    }
  };

  const handleRemoveOther = async (id) => {
    const { error } = await supabase.from('plan_inne').delete().eq('id', id);
    if (!error) {
      setOtherList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="p-4 space-y-8">
      <div className="no-print flex items-center justify-end gap-2 mb-4">
        <button
          onClick={handlePrintSelected}
          disabled={selectedDates.size === 0}
          className="px-3 py-1 text-sm rounded bg-green-600 text-white disabled:bg-gray-300"
        >
          🖨️ Drukuj zaznaczone ({selectedDates.size})
        </button>
        {selectedDates.size > 0 && (
          <button
            onClick={clearSelection}
            className="px-3 py-1 text-sm rounded bg-gray-200"
          >
            Wyczyść zaznaczenie
          </button>
        )}
      </div>
      {allDates.map((date) => (
        <div key={date} className="border rounded-xl p-4 shadow bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="no-print w-4 h-4"
                checked={selectedDates.has(date)}
                onChange={() => toggleDate(date)}
                aria-label={`Zaznacz datę ${date} do druku`}
              />
              <h2 className="text-lg font-bold capitalize text-blue-700">
                {date}
              </h2>
            </div>
            <button
              onClick={() => handlePrint(date)}
              className="no-print px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              🖨️ Drukuj
            </button>
          </div>
          <div id={`date-${date}`}>
            <LoadList
              data={groupedLoadList?.[date] ?? []}
              onFieldChange={handleFieldChange}
            />
            <UnloadList
              data={groupedUnloadList?.[date] ?? []}
              onFieldChange={handleUnloadFieldChange}
              onAddUnload={(e) => handleAddNewUnload(e, date)}
              onRemoveUnload={handleRemoveUnload}
            />
            <OtherList
              data={groupedOtherList?.[date] ?? []}
              onFieldChange={handleOtherFieldChange}
              onAddOther={(e) => handleAddNewOther(e, date)}
              onRemoveOther={handleRemoveOther}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Plan;
