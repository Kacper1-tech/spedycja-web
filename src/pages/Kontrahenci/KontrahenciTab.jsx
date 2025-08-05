import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { refreshKontrahenci } from '../../hooks/useKontrahenci';

export default function KontrahenciTab() {
  const [kontrahenci, setKontrahenci] = useState([]);
  const [filter, setFilter] = useState({
    grupa: '',
    nazwa: '',
    adres: '',
    ident: '',
    kontakt: '',
  });
  const [selectedKontrahent, setSelectedKontrahent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editedKontrahent, setEditedKontrahent] = useState(null);

  useEffect(() => {
    if (selectedKontrahent) {
      setEditedKontrahent({ ...selectedKontrahent });
    }
  }, [selectedKontrahent]);

  useEffect(() => {
    fetchKontrahenci();
  }, []);

  const fetchKontrahenci = async () => {
    const { data, error } = await supabase.from('kontrahenci').select('*');
    if (error) console.error(error);
    else setKontrahenci(data);
  };

  const handleShowDetails = (k) => {
    setSelectedKontrahent(k);
    setShowModal(true);
  };

  const handleDeleteKontrahent = async () => {
    if (!selectedKontrahent) return;

    const confirmed = window.confirm(
      'Czy na pewno chcesz usunąć tego kontrahenta?',
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('kontrahenci')
      .delete()
      .eq('id', selectedKontrahent.id);

    if (error) {
      console.error('Błąd usuwania:', error);
      alert('Wystąpił błąd podczas usuwania kontrahenta.');
    } else {
      alert('Kontrahent został usunięty.');
      setShowModal(false);
      fetchKontrahenci(); // odświeżenie listy
    }
  };

  const handleSaveChanges = async () => {
    if (!editedKontrahent) return;

    const { id } = editedKontrahent;

    const fieldsToUpdate = {
      grupa: editedKontrahent.grupa || null,
      nazwa: editedKontrahent.nazwa || null,
      adres_json: editedKontrahent.adres_json || {},
      identyfikatory_json: editedKontrahent.identyfikatory_json || {},
      kontakty_json: editedKontrahent.kontakty_json || [],
    };

    const { error } = await supabase
      .from('kontrahenci')
      .update(fieldsToUpdate)
      .eq('id', id);

    if (error) {
      alert('Błąd podczas zapisu');
      console.error(error);
      return;
    }

    const updateZlecenia = {
      zl_nazwa: fieldsToUpdate.nazwa,
      zl_ulica: fieldsToUpdate.adres_json?.ulica_nr || null,
      zl_kod_pocztowy: fieldsToUpdate.adres_json?.kod_pocztowy || null,
      zl_miasto: fieldsToUpdate.adres_json?.miasto || null,
      zl_panstwo: fieldsToUpdate.adres_json?.panstwo || null,
      zl_vat: fieldsToUpdate.identyfikatory_json?.vat || null,
      zl_nip: fieldsToUpdate.identyfikatory_json?.nip || null,
      zl_regon: fieldsToUpdate.identyfikatory_json?.regon || null,
      zl_eori: fieldsToUpdate.identyfikatory_json?.eori || null,
      zl_pesel: fieldsToUpdate.identyfikatory_json?.pesel || null,
      osoba_kontaktowa:
        fieldsToUpdate.kontakty_json?.[0]?.imie_nazwisko || null,
      telefon_kontaktowy: fieldsToUpdate.kontakty_json?.[0]?.telefon || null,
      email_kontaktowy: fieldsToUpdate.kontakty_json?.[0]?.email || null,
    };

    // 🔁 Zaktualizuj zlecenia eksportowe
    const { error: zlecExportError } = await supabase
      .from('zlecenia_export')
      .update(updateZlecenia)
      .eq('kontrahent_id', id);

    if (zlecExportError) {
      console.error('Błąd aktualizacji zleceń eksportowych:', zlecExportError);
    }

    // 🔁 Zaktualizuj zlecenia importowe
    const { error: zlecImportError } = await supabase
      .from('zlecenia_import')
      .update(updateZlecenia)
      .eq('kontrahent_id', id);

    if (zlecImportError) {
      console.error('Błąd aktualizacji zleceń importowych:', zlecImportError);
    }

    // 🔁 Zaktualizuj zlecenia pozostałe
    const { error: zlecPozostaleError } = await supabase
      .from('zlecenia_pozostale')
      .update(updateZlecenia)
      .eq('kontrahent_id', id);

    if (zlecPozostaleError) {
      console.error(
        'Błąd aktualizacji zleceń pozostałych:',
        zlecPozostaleError,
      );
    }

    alert('Zapisano zmiany');
    await refreshKontrahenci();

    // 🔁 Odśwież eksport i import
    window.dispatchEvent(new Event('refreshZleceniaExport'));
    window.dispatchEvent(new Event('refreshZleceniaImport'));
    window.dispatchEvent(new Event('refreshZleceniaPozostale'));

    setShowModal(false);
  };

  const filteredKontrahenci = kontrahenci.filter((k) => {
    const adres = k.adres_json
      ? `${k.adres_json.ulica_nr || ''}, ${k.adres_json.kod_pocztowy || ''} ${k.adres_json.miasto || ''}, ${k.adres_json.panstwo || ''}`
      : '';

    const ident = k.identyfikatory_json
      ? k.identyfikatory_json.vat ||
        k.identyfikatory_json.nip ||
        k.identyfikatory_json.regon ||
        k.identyfikatory_json.eori ||
        k.identyfikatory_json.pesel ||
        ''
      : '';

    const kontakt = k.kontakty_json?.imie_nazwisko || '';

    return (
      k.grupa?.toLowerCase().includes(filter.grupa.toLowerCase()) &&
      k.nazwa?.toLowerCase().includes(filter.nazwa.toLowerCase()) &&
      adres.toLowerCase().includes(filter.adres.toLowerCase()) &&
      ident.toLowerCase().includes(filter.ident.toLowerCase()) &&
      kontakt.toLowerCase().includes(filter.kontakt.toLowerCase())
    );
  });

  return (
    <div className="p-4 text-xs">
      <h2 className="text-lg font-bold mb-4">Rejestr Kontrahentów</h2>

      <table className="w-full border text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">Grupa</th>
            <th className="text-left p-2 border">Nazwa</th>
            <th className="text-left p-2 border">Adres</th>
            <th className="text-left p-2 border">Identyfikator</th>
            <th className="text-left p-2 border">Osoba kontaktowa</th>
          </tr>
          <tr className="bg-gray-50">
            <th className="p-1 border">
              <input
                type="text"
                value={filter.grupa}
                onChange={(e) =>
                  setFilter({ ...filter, grupa: e.target.value })
                }
                placeholder="Filtruj..."
                className="w-full border p-1"
              />
            </th>
            <th className="p-1 border">
              <input
                type="text"
                value={filter.nazwa}
                onChange={(e) =>
                  setFilter({ ...filter, nazwa: e.target.value })
                }
                placeholder="Filtruj..."
                className="w-full border p-1"
              />
            </th>
            <th className="p-1 border">
              <input
                type="text"
                value={filter.adres}
                onChange={(e) =>
                  setFilter({ ...filter, adres: e.target.value })
                }
                placeholder="Filtruj..."
                className="w-full border p-1"
              />
            </th>
            <th className="p-1 border">
              <input
                type="text"
                value={filter.ident}
                onChange={(e) =>
                  setFilter({ ...filter, ident: e.target.value })
                }
                placeholder="Filtruj..."
                className="w-full border p-1"
              />
            </th>
            <th className="p-1 border">
              <input
                type="text"
                value={filter.kontakt}
                onChange={(e) =>
                  setFilter({ ...filter, kontakt: e.target.value })
                }
                placeholder="Filtruj..."
                className="w-full border p-1"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredKontrahenci.map((k) => {
            const adres = k.adres_json
              ? `${k.adres_json.ulica_nr || ''}, ${k.adres_json.kod_pocztowy || ''} ${k.adres_json.miasto || ''}, ${k.adres_json.panstwo || ''}`
              : '-';

            const ident = k.identyfikatory_json
              ? k.identyfikatory_json.vat ||
                k.identyfikatory_json.nip ||
                k.identyfikatory_json.regon ||
                k.identyfikatory_json.eori ||
                k.identyfikatory_json.pesel ||
                '-'
              : '-';

            const kontakt =
              k.kontakty_json && k.kontakty_json.length > 0
                ? k.kontakty_json[0].imie_nazwisko || '-'
                : '-';

            return (
              <tr
                key={k.id}
                onClick={() => handleShowDetails(k)}
                className="cursor-pointer hover:bg-gray-100"
              >
                <td className="border p-2">{k.grupa || '-'}</td>
                <td className="border p-2">{k.nazwa || '-'}</td>
                <td className="border p-2">{adres}</td>
                <td className="border p-2">{ident}</td>
                <td className="border p-2">{kontakt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {showModal && selectedKontrahent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">Szczegóły kontrahenta</h2>

              <div className="space-y-2 text-sm">
                <div>
                  <label htmlFor="kontrahent-grupa" className="font-semibold">
                    Grupa:
                  </label>
                  <input
                    id="kontrahent-grupa"
                    type="text"
                    value={editedKontrahent?.grupa || ''}
                    onChange={(e) =>
                      setEditedKontrahent({
                        ...editedKontrahent,
                        grupa: e.target.value,
                      })
                    }
                    className="border p-1 w-full"
                  />

                  {/* Nazwa */}
                  <div>
                    <label htmlFor="kontrahent-nazwa" className="font-semibold">
                      Nazwa:
                    </label>
                    <input
                      id="kontrahent-nazwa"
                      type="text"
                      value={editedKontrahent?.nazwa || ''}
                      onChange={(e) =>
                        setEditedKontrahent({
                          ...editedKontrahent,
                          nazwa: e.target.value,
                        })
                      }
                      className="border p-1 w-full"
                    />
                  </div>

                  {/* Adres */}
                  <div>
                    <label htmlFor="adres-ulica" className="font-semibold">
                      Adres:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        id="adres-ulica"
                        type="text"
                        placeholder="Ulica i nr"
                        value={editedKontrahent?.adres_json?.ulica_nr || ''}
                        onChange={(e) => {
                          const updated = {
                            ...editedKontrahent.adres_json,
                            ulica_nr: e.target.value,
                          };
                          setEditedKontrahent({
                            ...editedKontrahent,
                            adres_json: updated,
                          });
                        }}
                        className="border p-1"
                      />

                      <input
                        type="text"
                        placeholder="Kod pocztowy"
                        value={editedKontrahent?.adres_json?.kod_pocztowy || ''}
                        onChange={(e) => {
                          const updated = {
                            ...editedKontrahent.adres_json,
                            kod_pocztowy: e.target.value,
                          };
                          setEditedKontrahent({
                            ...editedKontrahent,
                            adres_json: updated,
                          });
                        }}
                        className="border p-1"
                      />
                      <input
                        type="text"
                        placeholder="Miasto"
                        value={editedKontrahent?.adres_json?.miasto || ''}
                        onChange={(e) => {
                          const updated = {
                            ...editedKontrahent.adres_json,
                            miasto: e.target.value,
                          };
                          setEditedKontrahent({
                            ...editedKontrahent,
                            adres_json: updated,
                          });
                        }}
                        className="border p-1"
                      />
                      <input
                        type="text"
                        placeholder="Państwo"
                        value={editedKontrahent?.adres_json?.panstwo || ''}
                        onChange={(e) => {
                          const updated = {
                            ...editedKontrahent.adres_json,
                            panstwo: e.target.value,
                          };
                          setEditedKontrahent({
                            ...editedKontrahent,
                            adres_json: updated,
                          });
                        }}
                        className="border p-1"
                      />
                    </div>
                  </div>

                  {/* Identyfikatory */}
                  <div>
                    <p className="font-semibold">Identyfikatory:</p>
                    {['vat', 'nip', 'regon', 'eori', 'pesel'].map((key) =>
                      editedKontrahent?.identyfikatory_json?.[key] ? (
                        <div key={key}>
                          <label className="text-sm capitalize">
                            {key.toUpperCase()}:
                          </label>
                          <input
                            type="text"
                            value={editedKontrahent.identyfikatory_json[key]}
                            onChange={(e) => {
                              const updated = {
                                ...editedKontrahent.identyfikatory_json,
                                [key]: e.target.value,
                              };
                              setEditedKontrahent({
                                ...editedKontrahent,
                                identyfikatory_json: updated,
                              });
                            }}
                            className="border p-1 w-full"
                          />
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>

                <h3 className="mt-4 font-bold">Osoby kontaktowe:</h3>
                <div className="space-y-2">
                  {editedKontrahent?.kontakty_json?.length > 0 ? (
                    editedKontrahent.kontakty_json.map((kontakt, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded relative bg-gray-50 space-y-2"
                      >
                        <div className="absolute top-1 right-1">
                          <button
                            className="text-red-500 hover:text-red-700"
                            title="Usuń kontakt"
                            onClick={() => {
                              const updated =
                                editedKontrahent.kontakty_json.filter(
                                  (_, i) => i !== index,
                                );
                              setEditedKontrahent({
                                ...editedKontrahent,
                                kontakty_json: updated,
                              });
                            }}
                          >
                            🗑️
                          </button>
                        </div>

                        <div>
                          <label
                            className="text-sm"
                            htmlFor={`kontakt-imie-${index}`}
                          >
                            Imię i nazwisko:
                          </label>
                          <input
                            id={`kontakt-imie-${index}`}
                            type="text"
                            value={kontakt.imie_nazwisko || ''}
                            onChange={(e) => {
                              const updated = [
                                ...editedKontrahent.kontakty_json,
                              ];
                              updated[index].imie_nazwisko = e.target.value;
                              setEditedKontrahent({
                                ...editedKontrahent,
                                kontakty_json: updated,
                              });
                            }}
                            className="border p-1 w-full"
                          />
                        </div>

                        <div>
                          <label
                            className="text-sm"
                            htmlFor={`kontakt-telefon-${index}`}
                          >
                            Telefon:
                          </label>
                          <input
                            id={`kontakt-telefon-${index}`}
                            type="text"
                            value={kontakt.telefon || ''}
                            onChange={(e) => {
                              const updated = [
                                ...editedKontrahent.kontakty_json,
                              ];
                              updated[index].telefon = e.target.value;
                              setEditedKontrahent({
                                ...editedKontrahent,
                                kontakty_json: updated,
                              });
                            }}
                            className="border p-1 w-full"
                          />
                        </div>

                        <div>
                          <label
                            className="text-sm"
                            htmlFor={`kontakt-email-${index}`}
                          >
                            Email:
                          </label>
                          <input
                            id={`kontakt-email-${index}`}
                            type="email"
                            value={kontakt.email || ''}
                            onChange={(e) => {
                              const updated = [
                                ...editedKontrahent.kontakty_json,
                              ];
                              updated[index].email = e.target.value;
                              setEditedKontrahent({
                                ...editedKontrahent,
                                kontakty_json: updated,
                              });
                            }}
                            className="border p-1 w-full"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-gray-500">Brak kontaktów</p>
                  )}

                  <button
                    className="mt-2 text-sm text-blue-600 hover:underline"
                    onClick={() => {
                      const nowyKontakt = {
                        imie_nazwisko: '',
                        telefon: '',
                        email: '',
                      };
                      const aktualne = editedKontrahent.kontakty_json || [];
                      setEditedKontrahent({
                        ...editedKontrahent,
                        kontakty_json: [...aktualne, nowyKontakt],
                      });
                    }}
                  >
                    ➕ Dodaj kontakt
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-between bg-white">
              <button
                onClick={handleSaveChanges}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Zapisz zmiany
              </button>

              <button
                onClick={handleDeleteKontrahent}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Usuń kontrahenta
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
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
