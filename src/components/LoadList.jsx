import React from 'react';
import {
  getExportCustomsMiasto,
  getFirstAddressCity,
  getFirstAddressPostCode,
} from '../utils/address.js';

function LoadList({ data, onFieldChange }) {
  const ftlList = data.filter(
    (item) => (item.ldm || '').toUpperCase() === 'FTL',
  );

  const otherList = data.filter(
    (item) => (item.ldm || '').toUpperCase() !== 'FTL',
  );

  return (
    <>
      <h3 className="font-semibold text-green-700 mb-2">Załadunki:</h3>
      {data.length > 0 ? (
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
            {ftlList.map((item) => (
              <LoadListItem
                data={item}
                key={item.id}
                onFieldChange={onFieldChange}
              />
            ))}
            {!!otherList.length && (
              <tr>
                <td
                  colSpan={8}
                  className="bg-yellow-100 text-center font-semibold py-2 border-t border-b"
                >
                  Doładunki
                </td>
              </tr>
            )}
            {otherList.map((item) => (
              <LoadListItem
                data={item}
                key={item.id}
                onFieldChange={onFieldChange}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-gray-500 mb-6">Brak załadunków</p>
      )}
    </>
  );
}

function LoadListItem({ data, onFieldChange }) {
  const handleFieldChange = (e) => {
    onFieldChange && onFieldChange(e, data.id);
  };

  return (
    <tr>
      <td style={{ width: '10%' }} className="border p-2">
        {data.numer_zlecenia}
      </td>
      <td style={{ width: '10%' }} className="border p-2">
        {data.zl_nazwa}
      </td>
      <td style={{ width: '10%' }} className="border p-2">
        {getFirstAddressCity(data.adresy_odbioru_json)}
      </td>
      <td style={{ width: '5%' }} className="border p-2">
        {getFirstAddressPostCode(data.adresy_dostawy_json)}
      </td>
      <td style={{ width: '5%' }} className="border p-2">
        {getExportCustomsMiasto(data)}
      </td>
      <td className="border p-2">
        <input
          type="text"
          defaultValue={data.uwagi}
          onBlur={handleFieldChange}
          name="uwagi"
          className="w-full bg-transparent outline-none text-gray-600"
        />
      </td>
      <td className="border p-2">
        <input
          type="text"
          name="pojazd"
          defaultValue={data.pojazd}
          onBlur={handleFieldChange}
          className="w-full bg-transparent outline-none text-gray-600"
        />
      </td>

      <td className="border p-2">
        <input
          type="text"
          name="kierowca"
          defaultValue={data.kierowca}
          onBlur={handleFieldChange}
          className="w-full bg-transparent outline-none text-gray-600"
        />
      </td>
    </tr>
  );
}

export default LoadList;
