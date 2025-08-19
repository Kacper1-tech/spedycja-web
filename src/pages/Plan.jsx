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
  ].sort((a, b) => new Date(a) - new Date(b));

  const handlePrint = (date) => {
    const content = document.getElementById(`date-${date}`);
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
        titleEl.textContent = `Plan rozładunków – ${date}`;
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
      {allDates.map((date) => (
        <div key={date} className="border rounded-xl p-4 shadow bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold capitalize text-blue-700">
              {date}
            </h2>
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
