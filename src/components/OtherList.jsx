import { useState } from 'react';

function OtherList({ data, onRemoveOther, onAddOther, onFieldChange }) {
  const [newOther, setNewOther] = useState(data.length === 0 ? [] : null);
  const [selected, setSelected] = useState(null);

  const handleAddNew = () => {
    if (!newOther) {
      setNewOther([]);
    }
  };

  const handleAddOther = (e) => {
    onAddOther(e);
    setNewOther(null);
  };

  const handleRemoveOther = () => {
    onRemoveOther(selected);
    setSelected(null);
  };

  const handleSelectField = (id) => {
    setSelected(id);
  };
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-700">Inne:</h3>
        <div className="flex gap-2">
          <button
            className={
              'no-print disabled:text-gray-300 disabled:pointer-events-none'
            }
            disabled={!!newOther}
            onClick={handleAddNew}
          >
            ➕ Dodaj pozycję
          </button>
          <button
            onClick={handleRemoveOther}
            className="no-print px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            🗑️ Usuń pozycję
          </button>
        </div>
      </div>

      <table className="w-full border border-gray-300 text-sm">
        <tbody>
          {data.map((p) => (
            <tr
              key={p.id}
              onClick={() => handleSelectField(p.id)}
              className={
                selected === p.id
                  ? 'bg-yellow-100 cursor-pointer'
                  : 'hover:bg-gray-50 cursor-pointer'
              }
            >
              <td className="border p-2">
                {p && (
                  <input
                    type="text"
                    name="opis"
                    value={p.opis || ''}
                    placeholder="Uwagi / Notatki / Inne informacje"
                    onBlur={(e) => onFieldChange(e, p.id)}
                    className="w-full bg-transparent outline-none text-gray-600"
                  />
                )}
              </td>
            </tr>
          ))}
          {newOther && (
            <tr className={'hover:bg-gray-50 cursor-pointer'}>
              <td className="border p-2">
                <input
                  type="text"
                  placeholder="Uwagi / Notatki / Inne informacje"
                  onBlur={handleAddOther}
                  className="w-full bg-transparent outline-none text-gray-600"
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OtherList;
