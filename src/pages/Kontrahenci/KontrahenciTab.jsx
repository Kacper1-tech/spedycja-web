import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function KontrahenciTab() {
  const [kontrahenci, setKontrahenci] = useState([]);
  const [filter, setFilter] = useState({
    grupa: "",
    nazwa: "",
    adres: "",
    ident: "",
    kontakt: ""
  });
	const [selectedKontrahent, setSelectedKontrahent] = useState(null);
	const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchKontrahenci();
  }, []);

  const fetchKontrahenci = async () => {
    const { data, error } = await supabase.from("kontrahenci").select("*");
    if (error) console.error(error);
    else setKontrahenci(data);
  };
	
	const handleShowDetails = (k) => {
		setSelectedKontrahent(k);
		setShowModal(true);
	};

  const filteredKontrahenci = kontrahenci.filter((k) => {
    const adres = k.adres_json
      ? `${k.adres_json.ulica_nr || ""}, ${k.adres_json.kod_pocztowy || ""} ${k.adres_json.miasto || ""}, ${k.adres_json.panstwo || ""}`
      : "";

    const ident = k.identyfikatory_json
      ? k.identyfikatory_json.vat || k.identyfikatory_json.nip || k.identyfikatory_json.regon || k.identyfikatory_json.eori || k.identyfikatory_json.pesel || ""
      : "";

    const kontakt = k.kontakty_json?.imie_nazwisko || "";

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
                onChange={(e) => setFilter({ ...filter, grupa: e.target.value })}
                placeholder="Filtruj..."
                className="w-full border p-1"
              />
            </th>
            <th className="p-1 border">
              <input
                type="text"
                value={filter.nazwa}
                onChange={(e) => setFilter({ ...filter, nazwa: e.target.value })}
                placeholder="Filtruj..."
                className="w-full border p-1"
              />
            </th>
            <th className="p-1 border">
              <input
                type="text"
                value={filter.adres}
                onChange={(e) => setFilter({ ...filter, adres: e.target.value })}
                placeholder="Filtruj..."
                className="w-full border p-1"
              />
            </th>
            <th className="p-1 border">
              <input
                type="text"
                value={filter.ident}
                onChange={(e) => setFilter({ ...filter, ident: e.target.value })}
                placeholder="Filtruj..."
                className="w-full border p-1"
              />
            </th>
            <th className="p-1 border">
              <input
                type="text"
                value={filter.kontakt}
                onChange={(e) => setFilter({ ...filter, kontakt: e.target.value })}
                placeholder="Filtruj..."
                className="w-full border p-1"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredKontrahenci.map((k) => {
            const adres = k.adres_json
              ? `${k.adres_json.ulica_nr || ""}, ${k.adres_json.kod_pocztowy || ""} ${k.adres_json.miasto || ""}, ${k.adres_json.panstwo || ""}`
              : "-";

            const ident = k.identyfikatory_json
              ? k.identyfikatory_json.vat || k.identyfikatory_json.nip || k.identyfikatory_json.regon || k.identyfikatory_json.eori || k.identyfikatory_json.pesel || "-"
              : "-";

            const kontakt = k.kontakty_json && k.kontakty_json.length > 0
							? k.kontakty_json[0].imie_nazwisko || "-"
							: "-";

            return (
              <tr key={k.id} onClick={() => handleShowDetails(k)} className="cursor-pointer hover:bg-gray-100">
                <td className="border p-2">{k.grupa || "-"}</td>
                <td className="border p-2">{k.nazwa || "-"}</td>
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
							<p><strong>Grupa:</strong> {selectedKontrahent.grupa}</p>
							<p><strong>Nazwa:</strong> {selectedKontrahent.nazwa}</p>
							<p><strong>Adres:</strong> 
								{selectedKontrahent.adres_json
									? `${selectedKontrahent.adres_json.ulica_nr || ""}, ${selectedKontrahent.adres_json.kod_pocztowy || ""} ${selectedKontrahent.adres_json.miasto || ""}, ${selectedKontrahent.adres_json.panstwo || ""}`
									: "-"}
							</p>
							<p><strong>VAT:</strong> {selectedKontrahent.identyfikatory_json?.vat || "-"}</p>
							<p><strong>NIP:</strong> {selectedKontrahent.identyfikatory_json?.nip || "-"}</p>
							<p><strong>REGON:</strong> {selectedKontrahent.identyfikatory_json?.regon || "-"}</p>
							<p><strong>EORI:</strong> {selectedKontrahent.identyfikatory_json?.eori || "-"}</p>
							<p><strong>PESEL:</strong> {selectedKontrahent.identyfikatory_json?.pesel || "-"}</p>

							<h3 className="mt-4 font-bold">Osoby kontaktowe:</h3>
							<div className="space-y-2">
								{selectedKontrahent.kontakty_json && selectedKontrahent.kontakty_json.length > 0 ? (
									selectedKontrahent.kontakty_json.map((kontakt, i) => (
										<div key={i} className="p-2 border rounded">
											<p><strong>Imię i nazwisko:</strong> {kontakt.imie_nazwisko || "-"}</p>
											<p><strong>Telefon:</strong> {kontakt.telefon || "-"}</p>
											<p><strong>Email:</strong> {kontakt.email || "-"}</p>
										</div>
									))
								) : (
									<p className="italic text-gray-500">Brak kontaktów</p>
								)}
							</div>
						</div>
					</div>

					<div className="p-4 border-t flex justify-end bg-white">
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
