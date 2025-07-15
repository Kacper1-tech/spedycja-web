import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const Plan = () => {
  const [weeklyData, setWeeklyData] = useState({});
  const [nowyNumerZlecenia, setNowyNumerZlecenia] = useState('');
  const [noweZlecenie, setNoweZlecenie] = useState(null);

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
  };

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
          <h3 className="font-semibold text-red-700 mb-2">Rozładunki:</h3>
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
                        if (nowyNumerZlecenia.trim() === '') return;

                        const { data, error } = await supabase
                          .from('zlecenia_import')
                          .select('*')
                          .eq('numer_zlecenia', nowyNumerZlecenia)
                          .single();

                        if (error) {
                          console.error(
                            'Nie znaleziono zlecenia:',
                            error.message,
                          );
                          return;
                        }

                        setNoweZlecenie(data);
                      }}
                      className="w-full border px-1"
                    />
                  </td>
                  <td className="border p-2">
                    {noweZlecenie?.kierowca || '—'}
                  </td>
                  <td className="border p-2">
                    {noweZlecenie?.zl_nazwa || '—'}
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
              </tbody>
            </table>
          )}
          <p className="text-sm text-gray-500">Brak rozładunków</p>
          {/* Inne */}
          <h3 className="font-semibold text-gray-700 mt-6 mb-2">Inne:</h3>
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">I</th>
                <th className="border p-2">II</th>
                <th className="border p-2">III</th>
                <th className="border p-2">IV</th>
                <th className="border p-2">V</th>
                <th className="border p-2">VI</th>
                <th className="border p-2">VII</th>
                <th className="border p-2">VIII</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {[...Array(8)].map((_, idx) => (
                  <td key={idx} className="border p-2">
                    <input
                      type="text"
                      className="w-full bg-transparent outline-none text-gray-600"
                      placeholder={`Kolumna ${idx + 1}`}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default Plan;
