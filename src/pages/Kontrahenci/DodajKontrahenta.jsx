import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function DodajKontrahenta() {
  const [grupa, setGrupa] = useState("");
  const [nazwa, setNazwa] = useState("");
  const [ulicaNr, setUlicaNr] = useState("");
  const [miasto, setMiasto] = useState("");
  const [kodPocztowy, setKodPocztowy] = useState("");
  const [panstwo, setPanstwo] = useState("");
  const [vat, setVat] = useState("");
  const [nip, setNip] = useState("");
  const [regon, setRegon] = useState("");
  const [eori, setEori] = useState("");
  const [pesel, setPesel] = useState("");
  const [imieNazwisko, setImieNazwisko] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");

  const handleAddKontrahent = async () => {
    const { error } = await supabase.from("kontrahenci").insert({
      grupa,
      nazwa,
      adres_json: {
        ulica_nr: ulicaNr,
        miasto,
        kod_pocztowy: kodPocztowy,
        panstwo
      },
      identyfikatory_json: {
        vat,
        nip,
        regon,
        eori,
        pesel
      },
      kontakty_json: {
        imie_nazwisko: imieNazwisko,
        email,
        telefon
      }
    });

    if (error) {
      console.error(error);
    } else {
      // Czyść formularz
      setGrupa("");
      setNazwa("");
      setUlicaNr("");
      setMiasto("");
      setKodPocztowy("");
      setPanstwo("");
      setVat("");
      setNip("");
      setRegon("");
      setEori("");
      setPesel("");
      setImieNazwisko("");
      setEmail("");
      setTelefon("");
      alert("Kontrahent dodany!");
    }
  };

  return (
    <div className="p-4 text-xs">
      <h2 className="text-lg font-bold mb-4">Dodaj Kontrahenta</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <span className="font-bold">Grupa</span>
          <input
            placeholder="Grupa"
            value={grupa}
            onChange={(e) => setGrupa(e.target.value)}
            className="border p-2"
          />

          <span className="font-bold">Nazwa</span>
          <input
            placeholder="Nazwa firmy"
            value={nazwa}
            onChange={(e) => setNazwa(e.target.value)}
            className="border p-2"
          />

          <span className="font-bold">Ulica i nr</span>
          <input
            placeholder="Ulica i nr budynku"
            value={ulicaNr}
            onChange={(e) => setUlicaNr(e.target.value)}
            className="border p-2"
          />

          <span className="font-bold">Miasto</span>
          <input
            placeholder="Miejscowość"
            value={miasto}
            onChange={(e) => setMiasto(e.target.value)}
            className="border p-2"
          />

          <span className="font-bold">Kod pocztowy</span>
          <input
            placeholder="Kod pocztowy"
            value={kodPocztowy}
            onChange={(e) => setKodPocztowy(e.target.value)}
            className="border p-2"
          />

          <span className="font-bold">Państwo</span>
          <input
            placeholder="Państwo"
            value={panstwo}
            onChange={(e) => setPanstwo(e.target.value)}
            className="border p-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-bold">VAT</span>
          <input
            placeholder="VAT"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            className="border p-2"
          />

          <span className="font-bold">NIP</span>
          <input
            placeholder="NIP"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            className="border p-2"
          />

          <span className="font-bold">REGON</span>
          <input
            placeholder="REGON"
            value={regon}
            onChange={(e) => setRegon(e.target.value)}
            className="border p-2"
          />

          <span className="font-bold">EORI</span>
          <input
            placeholder="EORI"
            value={eori}
            onChange={(e) => setEori(e.target.value)}
            className="border p-2"
          />

          <span className="font-bold">PESEL</span>
          <input
            placeholder="PESEL"
            value={pesel}
            onChange={(e) => setPesel(e.target.value)}
            className="border p-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-bold">Osoba kontaktowa</span>
          <input
            placeholder="Imię i nazwisko"
            value={imieNazwisko}
            onChange={(e) => setImieNazwisko(e.target.value)}
            className="border p-2"
          />

          <span className="font-bold">Email</span>
          <input
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2"
          />

          <span className="font-bold">Telefon</span>
          <input
            placeholder="Nr telefonu"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            className="border p-2"
          />

          <button
            onClick={handleAddKontrahent}
            className="bg-green-600 text-white px-4 py-2 rounded mt-4"
          >
            Dodaj kontrahenta
          </button>
        </div>
      </div>
    </div>
  );
}
