import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { supabase } from '../../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { CURRENCIES, getCurrencySymbol } from '../../utils/currency';

export default function DodajZleceniePozostale() {
  const [pickupAddresses, setPickupAddresses] = useState([{}]);
  const [deliveryAddresses, setDeliveryAddresses] = useState([{}]);
  const [extraNotesVisible, setExtraNotesVisible] = useState(false);
  const [vat, setVat] = useState('');
  const [showOtherIds, setShowOtherIds] = useState(false);
  const [showPickupRange, setShowPickupRange] = useState(false);
  const [pickupRange, setPickupRange] = useState([null, null]);
  const [showDeliveryRange, setShowDeliveryRange] = useState(false);
  const [deliveryRange, setDeliveryRange] = useState([null, null]);
  const [pickupDate, setPickupDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [exportCustomsOption, setExportCustomsOption] = useState(''); // "odbior" lub "adres"
  const [importCustomsOption, setImportCustomsOption] = useState(''); // "odbior" lub "adres"
  const [currency, setCurrency] = useState('EUR');
  const [customCurrency, setCustomCurrency] = useState('');
  const [exportCustomsAddress, setExportCustomsAddress] = useState({});
  const [importCustomsAddress, setImportCustomsAddress] = useState({});
  const [palety, setPalety] = useState('');
  const [waga, setWaga] = useState('');
  const [wymiar, setWymiar] = useState('');
  const [ldm, setLdm] = useState('');
  const [cena, setCena] = useState('');
  const [uwagi, setUwagi] = useState('');
  const [numerZlecenia, setNumerZlecenia] = useState('');
  const [osobaKontaktowa, setOsobaKontaktowa] = useState('');
  const [telefonKontaktowy, setTelefonKontaktowy] = useState('');
  const [emailKontaktowy, setEmailKontaktowy] = useState('');
  const [zlNazwa, setZlNazwa] = useState('');
  const [zlUlica, setZlUlica] = useState('');
  const [zlMiasto, setZlMiasto] = useState('');
  const [zlKodPocztowy, setZlKodPocztowy] = useState('');
  const [zlPanstwo, setZlPanstwo] = useState('');
  const [zlNip, setZlNip] = useState('');
  const [zlRegon, setZlRegon] = useState('');
  const [zlEori, setZlEori] = useState('');
  const [zlPesel, setZlPesel] = useState('');
  const [pickupTime, setPickupTime] = useState(''); // np. "08:00"
  const [pickupTimeRange, setPickupTimeRange] = useState(['', '']); // np. ["08:00", "10:00"]
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryTimeRange, setDeliveryTimeRange] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExportCustoms, setShowExportCustoms] = useState(false);
  const [showImportCustoms, setShowImportCustoms] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [kontrahenciSugestie, setKontrahenciSugestie] = useState([]);
  const [exportCustomsSuggestions, setExportCustomsSuggestions] = useState([]);
  const [importCustomsSuggestions, setImportCustomsSuggestions] = useState([]);
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [pickupSuggestions, setPickupSuggestions] = useState([[]]);
  const [deliverySuggestions, setDeliverySuggestions] = useState([[]]);

  useEffect(() => {
    if (id) {
      const fetchZlecenie = async () => {
        const { data, error } = await supabase
          .from('zlecenia_pozostale')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Błąd pobierania:', error);
        } else {
          // UZUPEŁNIJ WSZYSTKIE STANY TAK SAMO JAK W IMPORT
          setNumerZlecenia(data.numer_zlecenia || '');
          setOsobaKontaktowa(data.osoba_kontaktowa || '');
          setTelefonKontaktowy(data.telefon_kontaktowy || '');
          setEmailKontaktowy(data.email_kontaktowy || '');
          setZlNazwa(data.zl_nazwa || '');
          setZlUlica(data.zl_ulica || '');
          setZlMiasto(data.zl_miasto || '');
          setZlKodPocztowy(data.zl_kod_pocztowy || '');
          setZlPanstwo(data.zl_panstwo || '');
          setVat(data.zl_vat || '');
          setZlNip(data.zl_nip || '');
          setZlRegon(data.zl_regon || '');
          setZlEori(data.zl_eori || '');
          setZlPesel(data.zl_pesel || '');

          setPickupDate(
            data.pickup_date_start
              ? new Date(data.pickup_date_start)
              : new Date(),
          );
          setPickupRange([
            data.pickup_date_start ? new Date(data.pickup_date_start) : null,
            data.pickup_date_end ? new Date(data.pickup_date_end) : null,
          ]);
          setShowPickupRange(!!data.pickup_date_end);

          setDeliveryDate(
            data.delivery_date_start
              ? new Date(data.delivery_date_start)
              : new Date(),
          );
          setDeliveryRange([
            data.delivery_date_start
              ? new Date(data.delivery_date_start)
              : null,
            data.delivery_date_end ? new Date(data.delivery_date_end) : null,
          ]);
          setShowDeliveryRange(!!data.delivery_date_end);

          // 👉 Godzina załadunku
          if (data.pickup_time_start && data.pickup_time_end) {
            setShowPickupRange(true);
            setPickupTimeRange([data.pickup_time_start, data.pickup_time_end]);
          } else {
            setShowPickupRange(false);
            setPickupTime(data.pickup_time || '');
          }

          // 👉 Godzina rozładunku
          if (data.delivery_time_start && data.delivery_time_end) {
            setShowDeliveryRange(true);
            setDeliveryTimeRange([
              data.delivery_time_start,
              data.delivery_time_end,
            ]);
          } else {
            setShowDeliveryRange(false);
            setDeliveryTime(data.delivery_time || '');
          }

          setPickupAddresses(JSON.parse(data.adresy_odbioru_json || '[{}]'));
          setDeliveryAddresses(JSON.parse(data.adresy_dostawy_json || '[{}]'));

          setExportCustomsOption(data.export_customs_option || '');
          setImportCustomsOption(data.import_customs_option || '');
          setExportCustomsAddress(
            JSON.parse(data.export_customs_adres_json || '{}'),
          );
          setImportCustomsAddress(
            JSON.parse(data.import_customs_adres_json || '{}'),
          );

          setPalety(data.palety || '');
          setWaga(data.waga || '');
          setWymiar(data.wymiar || '');
          setLdm(data.ldm || '');
          setCena(data.cena || '');
          setCurrency(data.waluta || 'EUR');
          setCustomCurrency(data.custom_currency || '');
          setUwagi(data.uwagi || '');

          // Jeśli chcesz pokazać sekcje celne na starcie
          setShowExportCustoms(!!data.export_customs_option);
          setShowImportCustoms(!!data.import_customs_option);
        }
      };
      fetchZlecenie();
    }
  }, [id]);

  const formatDate = (date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date); // ⬅️ ważne!
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let kontrahentIdNowy;

    // 1️⃣ Najpierw kontrahent
    let kontrahentQuery = supabase
      .from('kontrahenci')
      .select('id, kontakty_json');

    if (vat) {
      kontrahentQuery = kontrahentQuery.eq('identyfikatory_json->>vat', vat);
    } else if (zlNip) {
      kontrahentQuery = kontrahentQuery.eq('identyfikatory_json->>nip', zlNip);
    } else {
      kontrahentQuery = kontrahentQuery.eq('nazwa', zlNazwa);
    }

    const { data: existingKontrahent } = await kontrahentQuery.maybeSingle();

    if (!existingKontrahent) {
      const kontrahentPayload = {
        grupa: 'Zleceniodawca',
        nazwa: zlNazwa,
        adres_json: {
          ulica_nr: zlUlica,
          miasto: zlMiasto,
          kod_pocztowy: zlKodPocztowy,
          panstwo: zlPanstwo,
        },
        identyfikatory_json: {
          vat: vat || null,
          nip: zlNip || null,
          regon: zlRegon || null,
          eori: zlEori || null,
          pesel: zlPesel || null,
        },
        kontakty_json: [
          {
            imie_nazwisko: osobaKontaktowa || null,
            email: emailKontaktowy || null,
            telefon: telefonKontaktowy || null,
          },
        ],
      };

      const { data: insertedKontrahent, error: kontrahentError } =
        await supabase
          .from('kontrahenci')
          .insert([kontrahentPayload])
          .select()
          .single();

      if (kontrahentError) {
        console.error('Błąd zapisu kontrahenta:', kontrahentError.message);
      } else {
        kontrahentIdNowy = insertedKontrahent.id;
      }
    } else {
      kontrahentIdNowy = existingKontrahent.id;

      const oldContacts = existingKontrahent.kontakty_json || [];
      const newContact = {
        imie_nazwisko: osobaKontaktowa || null,
        email: emailKontaktowy || null,
        telefon: telefonKontaktowy || null,
      };

      // ✅ Deduplication — NIE DODAJE jeśli jest identyczny kontakt
      const isDuplicate = oldContacts.some(
        (c) =>
          c.imie_nazwisko === newContact.imie_nazwisko &&
          c.email === newContact.email &&
          c.telefon === newContact.telefon,
      );

      const updatedContacts = isDuplicate
        ? oldContacts
        : [...oldContacts, newContact];

      const kontrahentPayload = {
        nazwa: zlNazwa,
        adres_json: {
          ulica_nr: zlUlica,
          miasto: zlMiasto,
          kod_pocztowy: zlKodPocztowy,
          panstwo: zlPanstwo,
        },
        identyfikatory_json: {
          vat: vat || null,
          nip: zlNip || null,
          regon: zlRegon || null,
          eori: zlEori || null,
          pesel: zlPesel || null,
        },
        kontakty_json: updatedContacts,
      };

      const { error: updateError } = await supabase
        .from('kontrahenci')
        .update(kontrahentPayload)
        .eq('id', kontrahentIdNowy);

      if (updateError) {
        console.error('Błąd aktualizacji kontaktów:', updateError.message);
      }
    }

    // 👉 ZAPISZ AGENCJĘ CELNĄ (EKSPORTOWĄ)
    if (exportCustomsOption === 'adres' && exportCustomsAddress.company) {
      const { data: existingExportAgency } = await supabase
        .from('agencje_celne')
        .select('*')
        .eq('nazwa', exportCustomsAddress.company.trim())
        .single();

      if (!existingExportAgency) {
        await supabase.from('agencje_celne').insert({
          nazwa: exportCustomsAddress.company.trim(),
          ulica: exportCustomsAddress.street,
          miasto: exportCustomsAddress.city,
          kod: exportCustomsAddress.zip,
          panstwo: exportCustomsAddress.country,
        });
      }
    }

    // 👉 ZAPISZ AGENCJĘ CELNĄ (IMPORTOWĄ)
    if (importCustomsOption === 'adres' && importCustomsAddress.company) {
      const { data: existingImportAgency } = await supabase
        .from('agencje_celne')
        .select('*')
        .eq('nazwa', importCustomsAddress.company.trim())
        .single();

      if (!existingImportAgency) {
        await supabase.from('agencje_celne').insert({
          nazwa: importCustomsAddress.company.trim(),
          ulica: importCustomsAddress.street,
          miasto: importCustomsAddress.city,
          kod: importCustomsAddress.zip,
          panstwo: importCustomsAddress.country,
        });
      }
    }

    // 2️⃣ Payload z ID
    const payload = {
      numer_zlecenia: numerZlecenia,
      osoba_kontaktowa: osobaKontaktowa,
      telefon_kontaktowy: telefonKontaktowy,
      email_kontaktowy: emailKontaktowy,
      zl_nazwa: zlNazwa,
      zl_ulica: zlUlica,
      zl_miasto: zlMiasto,
      zl_kod_pocztowy: zlKodPocztowy,
      zl_panstwo: zlPanstwo,
      zl_vat: vat || null,
      zl_nip: zlNip || null,
      zl_regon: zlRegon || null,
      zl_eori: zlEori || null,
      zl_pesel: zlPesel || null,
      pickup_date_start: !showPickupRange
        ? formatDate(pickupDate)
        : formatDate(pickupRange[0]),
      pickup_date_end: !showPickupRange
        ? formatDate(pickupDate)
        : formatDate(pickupRange[1]),
      delivery_date_start: !showDeliveryRange
        ? formatDate(deliveryDate)
        : formatDate(deliveryRange[0]),
      delivery_date_end: !showDeliveryRange
        ? formatDate(deliveryDate)
        : formatDate(deliveryRange[1]),
      export_customs_option: exportCustomsOption,
      export_customs_adres_json:
        exportCustomsOption === 'adres'
          ? JSON.stringify(exportCustomsAddress)
          : null,
      import_customs_option: importCustomsOption,
      import_customs_adres_json:
        importCustomsOption === 'adres'
          ? JSON.stringify(importCustomsAddress)
          : null,
      waluta: currency,
      custom_currency: customCurrency || null,
      adresy_odbioru_json: JSON.stringify(pickupAddresses),
      adresy_dostawy_json: JSON.stringify(deliveryAddresses),
      palety: palety || null,
      waga: waga || null,
      wymiar: wymiar || null,
      ldm: ldm || null,
      cena: cena || null,
      uwagi: uwagi || null,
      pickup_time: !showPickupRange ? pickupTime : null,
      pickup_time_start: showPickupRange ? pickupTimeRange[0] : null,
      pickup_time_end: showPickupRange ? pickupTimeRange[1] : null,
      delivery_time: !showDeliveryRange ? deliveryTime : null,
      delivery_time_start: showDeliveryRange ? deliveryTimeRange[0] : null,
      delivery_time_end: showDeliveryRange ? deliveryTimeRange[1] : null,
      kontrahent_id: kontrahentIdNowy,
    };

    // 3️⃣ INSERT lub UPDATE
    let result;

    if (id) {
      result = await supabase
        .from('zlecenia_pozostale')
        .update(payload)
        .eq('id', id);
    } else {
      result = await supabase.from('zlecenia_pozostale').insert([payload]);
    }

    const { error } = result;

    if (error) {
      console.error('Błąd zapisu:', error.message);
      alert('Błąd zapisu:\n' + error.message);
      setIsSubmitting(false);
      return;
    }

    alert(id ? 'Zlecenie zaktualizowane!' : 'Zlecenie zapisane!');
    navigate('/zlecenia/pozostale/lista');
    if (!id) resetForm();
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setPickupAddresses([{}]);
    setDeliveryAddresses([{}]);
    setExtraNotesVisible(false);
    setVat('');
    setShowOtherIds(false);
    setShowPickupRange(false);
    setPickupRange([null, null]);
    setShowDeliveryRange(false);
    setDeliveryRange([null, null]);
    setPickupDate(new Date());
    setDeliveryDate(new Date());
    setExportCustomsOption('');
    setImportCustomsOption('');
    setCurrency('EUR');
    setCustomCurrency('');
    setExportCustomsAddress({});
    setImportCustomsAddress({});
    setPalety('');
    setWaga('');
    setWymiar('');
    setLdm('');
    setCena('');
    setUwagi('');
    setNumerZlecenia('');
    setOsobaKontaktowa('');
    setTelefonKontaktowy('');
    setEmailKontaktowy('');
    setZlNazwa('');
    setZlUlica('');
    setZlMiasto('');
    setZlKodPocztowy('');
    setZlPanstwo('');
    setZlNip('');
    setZlRegon('');
    setZlEori('');
    setZlPesel('');
    setPickupTime('');
    setPickupTimeRange(['', '']);
    setDeliveryTime('');
    setDeliveryTimeRange(['', '']);
  };

  const addPickupAddress = () => {
    if (pickupAddresses.length < 10) {
      setPickupAddresses([...pickupAddresses, {}]);
    }
  };

  const addDeliveryAddress = () => {
    if (deliveryAddresses.length < 10) {
      setDeliveryAddresses([...deliveryAddresses, {}]);
    }
  };

  const removeLastPickupAddress = () => {
    if (pickupAddresses.length > 1) {
      setPickupAddresses(pickupAddresses.slice(0, -1));
    }
  };

  const removeLastDeliveryAddress = () => {
    if (deliveryAddresses.length > 1) {
      setDeliveryAddresses(deliveryAddresses.slice(0, -1));
    }
  };

  const handleExportCustomsNameChange = async (e) => {
    const value = e.target.value;
    setExportCustomsAddress({ ...exportCustomsAddress, company: value });

    if (value.length >= 2) {
      const { data, error } = await supabase
        .from('agencje_celne')
        .select('*')
        .ilike('nazwa', `${value}%`)
        .limit(5);

      if (!error) setExportCustomsSuggestions(data);
    } else {
      setExportCustomsSuggestions([]);
    }
  };

  const handleExportCustomsSelect = (agency) => {
    setExportCustomsAddress({
      company: agency.nazwa,
      street: agency.ulica_nr,
      city: agency.miasto,
      zip: agency.kod_pocztowy,
      country: agency.panstwo,
    });
    setExportCustomsSuggestions([]);
  };

  const handleImportCustomsNameChange = async (e) => {
    const value = e.target.value;
    setImportCustomsAddress({ ...importCustomsAddress, company: value });

    if (value.length >= 2) {
      const { data, error } = await supabase
        .from('agencje_celne')
        .select('*')
        .ilike('nazwa', `${value}%`)
        .limit(5);

      if (!error) setImportCustomsSuggestions(data);
    } else {
      setImportCustomsSuggestions([]);
    }
  };

  const handleImportCustomsSelect = (agency) => {
    setImportCustomsAddress({
      company: agency.nazwa,
      street: agency.ulica_nr,
      city: agency.miasto,
      zip: agency.kod_pocztowy,
      country: agency.panstwo,
    });
    setImportCustomsSuggestions([]);
  };

  const handleZlNazwaChange = async (e) => {
    const value = e.target.value;
    setZlNazwa(value);

    if (value.length >= 2) {
      const { data, error } = await supabase
        .from('kontrahenci')
        .select('*')
        .ilike('nazwa', `${value}%`)
        .limit(5);

      if (!error) setKontrahenciSugestie(data);
    } else {
      setKontrahenciSugestie([]);
    }
  };

  const handleKontrahentSelect = (kontrahent) => {
    setZlNazwa(kontrahent.nazwa);
    setKontrahenciSugestie([]);

    setZlUlica(kontrahent.adres_json?.ulica_nr || '');
    setZlMiasto(kontrahent.adres_json?.miasto || '');
    setZlKodPocztowy(kontrahent.adres_json?.kod_pocztowy || '');
    setZlPanstwo(kontrahent.adres_json?.panstwo || '');

    setVat(kontrahent.identyfikatory_json?.vat || '');
    setZlNip(kontrahent.identyfikatory_json?.nip || '');
    setZlRegon(kontrahent.identyfikatory_json?.regon || '');
    setZlEori(kontrahent.identyfikatory_json?.eori || '');
    setZlPesel(kontrahent.identyfikatory_json?.pesel || '');

    setOsobaKontaktowa(kontrahent.kontakt_json?.imie_nazwisko || '');
    setTelefonKontaktowy(kontrahent.kontakt_json?.telefon || '');
    setEmailKontaktowy(kontrahent.kontakt_json?.email || '');
  };

  const handlePickupAddressNameChange = async (e, index) => {
    const value = e.target.value;
    const updated = [...pickupAddresses];
    updated[index] = { ...updated[index], nazwa: value };
    setPickupAddresses(updated);

    console.log('🔵 [handlePickupAddressNameChange] value:', value);

    if (value.length >= 2) {
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .ilike('name', `${value}%`)
        .limit(5);

      console.log('🟢 [handlePickupAddressNameChange] data:', data);
      console.log('🔴 [handlePickupAddressNameChange] error:', error);

      const updatedSuggestions = [...pickupSuggestions];
      updatedSuggestions[index] = data || [];
      setPickupSuggestions(updatedSuggestions);
    } else {
      const updatedSuggestions = [...pickupSuggestions];
      updatedSuggestions[index] = [];
      setPickupSuggestions(updatedSuggestions);
    }
  };

  const selectPickupSuggestion = (addr, index) => {
    console.log('✅ SELECTED PICKUP:', addr);
    const updated = [...pickupAddresses];
    updated[index] = {
      ...updated[index],
      nazwa: addr.name,
      ulica: addr.street,
      kod: addr.postal_code,
      miasto: addr.city,
      panstwo: addr.country,
    };
    setPickupAddresses(updated);

    const updatedSuggestions = [...pickupSuggestions];
    updatedSuggestions[index] = [];
    setPickupSuggestions(updatedSuggestions);
  };

  const handleDeliveryAddressNameChange = async (e, index) => {
    const value = e.target.value;

    const updated = [...deliveryAddresses];
    updated[index] = { ...updated[index], nazwa: value };
    setDeliveryAddresses(updated);

    console.log('🔵 [handleDeliveryAddressNameChange] value:', value);

    if (value.length >= 2) {
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .ilike('name', `${value}%`)
        .limit(5);

      console.log('🟢 [handleDeliveryAddressNameChange] data:', data);
      console.log('🔴 [handleDeliveryAddressNameChange] error:', error);

      const updatedDelivery = [...deliverySuggestions];
      updatedDelivery[index] = data || [];
      setDeliverySuggestions(updatedDelivery);
    } else {
      const updatedDelivery = [...deliverySuggestions];
      updatedDelivery[index] = [];
      setDeliverySuggestions(updatedDelivery);
    }
  };

  const selectDeliverySuggestion = (addr, index) => {
    console.log('✅ SELECTED DELIVERY:', addr);
    const updated = [...deliveryAddresses];
    updated[index] = {
      ...updated[index],
      nazwa: addr.name,
      ulica: addr.street,
      kod: addr.postal_code,
      miasto: addr.city,
      panstwo: addr.country,
    };
    setDeliveryAddresses(updated);

    const updatedSuggestions = [...deliverySuggestions];
    updatedSuggestions[index] = [];
    setDeliverySuggestions(updatedSuggestions);
  };

  const handleContactNameChange = async (e) => {
    const value = e.target.value;
    setOsobaKontaktowa(value);

    if (value.length >= 2) {
      const { data, error } = await supabase
        .from('kontrahenci')
        .select('id, kontakty_json')
        .not('kontakty_json', 'is', null);

      if (error) {
        console.error('❌ Supabase error:', error);
        return;
      }

      // Rozpakuj wszystkie kontakty
      let allContacts = [];
      data.forEach((k) => {
        if (Array.isArray(k.kontakty_json)) {
          allContacts.push(...k.kontakty_json);
        }
      });

      // Filtrowanie po imieniu
      const suggestions = allContacts.filter((contact) =>
        contact.imie_nazwisko?.toLowerCase().startsWith(value.toLowerCase()),
      );
      console.log('💡 Wszystkie kontakty:', allContacts);
      console.log('💡 Wpisane:', value);
      console.log('💡 Dopasowane:', suggestions);
      console.log('✅ CONTACT SUGGESTIONS:', suggestions);

      setContactSuggestions(suggestions);
    } else {
      setContactSuggestions([]);
    }
  };

  const selectContactSuggestion = (contact) => {
    console.log('✅ SELECTED CONTACT:', contact);

    setOsobaKontaktowa(contact.imie_nazwisko);
    setTelefonKontaktowy(contact.telefon);
    setEmailKontaktowy(contact.email);

    setContactSuggestions([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Dodaj zlecenie</h1>

      <div className="flex gap-8 mt-6 items-center justify-center">
        {/* Numer zlecenia */}
        <div className="flex-1 flex flex-col items-center">
          <label className="mb-2 font-medium text-center">
            Numer zlecenia transportowego
          </label>
          <input
            type="text"
            className="w-full px-3 py-1 border rounded"
            value={numerZlecenia}
            onChange={(e) => setNumerZlecenia(e.target.value)}
          />
        </div>

        {/* Osoba kontaktowa */}
        <div className="flex-1 flex flex-col items-center">
          <label className="mb-2 font-medium text-center">
            Osoba kontaktowa zleceniodawcy
          </label>
          <div className="w-full space-y-2 relative">
            <input
              type="text"
              placeholder="Imię i nazwisko"
              className="w-full px-3 py-1 border rounded"
              value={osobaKontaktowa}
              onChange={handleContactNameChange}
            />
            {contactSuggestions.length > 0 && (
              <ul className="absolute bg-white border w-full z-50">
                {contactSuggestions.map((sug) => (
                  <li
                    key={`${sug.imie_nazwisko}-${sug.telefon}`}
                    className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => selectContactSuggestion(sug)}
                  >
                    {sug.imie_nazwisko}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-4">
              <input
                type="tel"
                placeholder="Telefon"
                className="w-1/2 px-3 py-1 border rounded"
                value={telefonKontaktowy}
                onChange={(e) => setTelefonKontaktowy(e.target.value)}
              />
              <input
                type="email"
                placeholder="E-mail"
                className="w-1/2 px-3 py-1 border rounded"
                value={emailKontaktowy}
                onChange={(e) => setEmailKontaktowy(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Zleceniodawca */}
      <div className="border-t border-b py-4">
        <h2 className="text-center font-bold mb-4">ZLECENIODAWCA</h2>
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Nazwa"
              className="w-full px-3 py-1 border rounded"
              value={zlNazwa}
              onChange={handleZlNazwaChange}
            />

            {kontrahenciSugestie.length > 0 && (
              <ul className="absolute z-50 bg-white border w-full">
                {kontrahenciSugestie.map((k) => (
                  <li
                    key={k.id}
                    className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => handleKontrahentSelect(k)}
                  >
                    {k.nazwa}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="text"
            placeholder="Ulica i nr budynku"
            className="w-full px-3 py-1 border rounded"
            value={zlUlica}
            onChange={(e) => setZlUlica(e.target.value)}
          />
          <input
            type="text"
            placeholder="Miejscowość"
            className="w-full px-3 py-1 border rounded"
            value={zlMiasto}
            onChange={(e) => setZlMiasto(e.target.value)}
          />
          <input
            type="text"
            placeholder="Kod pocztowy"
            className="w-full px-3 py-1 border rounded"
            value={zlKodPocztowy}
            onChange={(e) => setZlKodPocztowy(e.target.value)}
          />
          <input
            type="text"
            placeholder="Państwo"
            className="w-full px-3 py-1 border rounded"
            value={zlPanstwo}
            onChange={(e) => setZlPanstwo(e.target.value)}
          />

          {!showOtherIds ? (
            <>
              <input
                type="text"
                placeholder="VAT"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                className="w-full px-3 py-1 border rounded"
              />
              <button
                type="button"
                onClick={() => setShowOtherIds(true)}
                className="text-blue-600 underline text-sm"
              >
                Nie masz VAT? Dodaj inny numer
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="NIP"
                className="w-full px-3 py-1 border rounded"
                value={zlNip}
                onChange={(e) => setZlNip(e.target.value)}
              />
              <input
                type="text"
                placeholder="REGON"
                className="w-full px-3 py-1 border rounded"
                value={zlRegon}
                onChange={(e) => setZlRegon(e.target.value)}
              />
              <input
                type="text"
                placeholder="EORI"
                className="w-full px-3 py-1 border rounded"
                value={zlEori}
                onChange={(e) => setZlEori(e.target.value)}
              />
              <input
                type="text"
                placeholder="PESEL"
                className="w-full px-3 py-1 border rounded"
                value={zlPesel}
                onChange={(e) => setZlPesel(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Daty */}
      <div className="flex gap-8">
        <div className="flex-1">
          <h2 className="font-semibold mb-2 text-center">Data załadunku</h2>
          <div className="flex flex-col items-center">
            <div className="mb-2">
              {!showPickupRange ? (
                <DatePicker
                  selected={pickupDate}
                  onChange={(date) => setPickupDate(date)}
                  dateFormat="dd/MM/yyyy"
                  inline
                />
              ) : (
                <DatePicker
                  selectsRange
                  startDate={pickupRange[0]}
                  endDate={pickupRange[1]}
                  onChange={(update) => setPickupRange(update)}
                  dateFormat="dd/MM/yyyy"
                  inline
                />
              )}
            </div>
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={showPickupRange}
                onChange={() => setShowPickupRange(!showPickupRange)}
              />
              Przedział dat
            </label>
            <div className="mt-2">
              {!showPickupRange ? (
                <>
                  <label className="block text-xs mb-1 text-center">
                    Godzina załadunku
                  </label>
                  <input
                    type="time"
                    className="px-3 py-1 border rounded"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <label className="block text-xs mb-1 text-center">
                    Przedział godzin załadunku
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      className="px-3 py-1 border rounded"
                      value={pickupTimeRange[0]}
                      onChange={(e) =>
                        setPickupTimeRange([e.target.value, pickupTimeRange[1]])
                      }
                    />
                    <span className="self-center">–</span>
                    <input
                      type="time"
                      className="px-3 py-1 border rounded"
                      value={pickupTimeRange[1]}
                      onChange={(e) =>
                        setPickupTimeRange([pickupTimeRange[0], e.target.value])
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="font-semibold mb-2 text-center">Data rozładunku</h2>
          <div className="flex flex-col items-center">
            <div className="mb-2">
              {!showDeliveryRange ? (
                <DatePicker
                  selected={deliveryDate}
                  onChange={(date) => setDeliveryDate(date)}
                  dateFormat="dd/MM/yyyy"
                  inline
                />
              ) : (
                <DatePicker
                  selectsRange
                  startDate={deliveryRange[0]}
                  endDate={deliveryRange[1]}
                  onChange={(update) => setDeliveryRange(update)}
                  dateFormat="dd/MM/yyyy"
                  inline
                />
              )}
            </div>
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={showDeliveryRange}
                onChange={() => setShowDeliveryRange(!showDeliveryRange)}
              />
              Przedział dat
            </label>
            <div className="mt-2">
              {!showDeliveryRange ? (
                <>
                  <label className="block text-xs mb-1 text-center">
                    Godzina rozładunku
                  </label>
                  <input
                    type="time"
                    className="px-3 py-1 border rounded"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <label className="block text-xs mb-1 text-center">
                    Przedział godzin rozładunku
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      className="px-3 py-1 border rounded"
                      value={deliveryTimeRange[0]}
                      onChange={(e) =>
                        setDeliveryTimeRange([
                          e.target.value,
                          deliveryTimeRange[1],
                        ])
                      }
                    />
                    <span className="self-center">–</span>
                    <input
                      type="time"
                      className="px-3 py-1 border rounded"
                      value={deliveryTimeRange[1]}
                      onChange={(e) =>
                        setDeliveryTimeRange([
                          deliveryTimeRange[0],
                          e.target.value,
                        ])
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Adresy odbioru i dostawy */}
      <div className="flex gap-8">
        <div className="flex-1">
          <h2 className="font-semibold text-center mb-2">
            Adres odbioru towaru
          </h2>
          <div className="space-y-4">
            {pickupAddresses.map((address, index) => (
              <div
                key={index}
                className="relative flex flex-col items-center space-y-2 border-b pb-2"
              >
                <input
                  type="text"
                  placeholder="Nazwa firmy"
                  className="w-full px-3 py-1 border rounded"
                  value={address.nazwa || ''}
                  onChange={(e) => handlePickupAddressNameChange(e, index)}
                />
                {pickupSuggestions[index]?.length > 0 && (
                  <ul className="absolute bg-white border w-full z-50">
                    {pickupSuggestions[index].map((sug) => (
                      <li
                        key={`${sug.name}-${sug.postal_code}`}
                        className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                        onClick={() => selectPickupSuggestion(sug, index)}
                      >
                        {sug.name}
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  type="text"
                  placeholder="Ulica i nr budynku"
                  className="w-full px-3 py-1 border rounded"
                  value={address.ulica || ''}
                  onChange={(e) => {
                    const updated = [...pickupAddresses];
                    updated[index] = {
                      ...updated[index],
                      ulica: e.target.value,
                    };
                    setPickupAddresses(updated);
                  }}
                />
                <input
                  type="text"
                  placeholder="Miejscowość"
                  className="w-full px-3 py-1 border rounded"
                  value={address.miasto || ''}
                  onChange={(e) => {
                    const updated = [...pickupAddresses];
                    updated[index] = {
                      ...updated[index],
                      miasto: e.target.value,
                    };
                    setPickupAddresses(updated);
                  }}
                />
                <input
                  type="text"
                  placeholder="Kod pocztowy"
                  className="w-full px-3 py-1 border rounded"
                  value={address.kod || ''}
                  onChange={(e) => {
                    const updated = [...pickupAddresses];
                    updated[index] = { ...updated[index], kod: e.target.value };
                    setPickupAddresses(updated);
                  }}
                />
                <input
                  type="text"
                  placeholder="Państwo"
                  className="w-full px-3 py-1 border rounded"
                  value={address.panstwo || ''}
                  onChange={(e) => {
                    const updated = [...pickupAddresses];
                    updated[index] = {
                      ...updated[index],
                      panstwo: e.target.value,
                    };
                    setPickupAddresses(updated);
                  }}
                />
              </div>
            ))}

            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={addPickupAddress}
                className="text-blue-600 underline text-sm"
              >
                Dodaj kolejne miejsce
              </button>
              {pickupAddresses.length > 1 && (
                <button
                  type="button"
                  onClick={removeLastPickupAddress}
                  className="text-red-600 underline text-sm"
                >
                  Cofnij ostatnie
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="font-semibold text-center mb-2">
            Adres dostawy towaru
          </h2>
          <div className="space-y-4">
            {deliveryAddresses.map((address, index) => (
              <div
                key={index}
                className="relative flex flex-col items-center space-y-2 border-b pb-2"
              >
                <input
                  type="text"
                  placeholder="Nazwa firmy"
                  className="w-full px-3 py-1 border rounded"
                  value={address.nazwa || ''}
                  onChange={(e) => handleDeliveryAddressNameChange(e, index)}
                />
                {deliverySuggestions[index]?.length > 0 && (
                  <ul className="absolute bg-white border w-full z-50">
                    {deliverySuggestions[index].map((sug) => (
                      <li
                        key={`${sug.name}-${sug.postal_code}`}
                        className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                        onClick={() => selectDeliverySuggestion(sug, index)}
                      >
                        {sug.name}
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  type="text"
                  placeholder="Ulica i nr budynku"
                  className="w-full px-3 py-1 border rounded"
                  value={address.ulica || ''}
                  onChange={(e) => {
                    const updated = [...deliveryAddresses];
                    updated[index] = {
                      ...updated[index],
                      ulica: e.target.value,
                    };
                    setDeliveryAddresses(updated);
                  }}
                />
                <input
                  type="text"
                  placeholder="Miejscowość"
                  className="w-full px-3 py-1 border rounded"
                  value={address.miasto || ''}
                  onChange={(e) => {
                    const updated = [...deliveryAddresses];
                    updated[index] = {
                      ...updated[index],
                      miasto: e.target.value,
                    };
                    setDeliveryAddresses(updated);
                  }}
                />
                <input
                  type="text"
                  placeholder="Kod pocztowy"
                  className="w-full px-3 py-1 border rounded"
                  value={address.kod || ''}
                  onChange={(e) => {
                    const updated = [...deliveryAddresses];
                    updated[index] = { ...updated[index], kod: e.target.value };
                    setDeliveryAddresses(updated);
                  }}
                />
                <input
                  type="text"
                  placeholder="Państwo"
                  className="w-full px-3 py-1 border rounded"
                  value={address.panstwo || ''}
                  onChange={(e) => {
                    const updated = [...deliveryAddresses];
                    updated[index] = {
                      ...updated[index],
                      panstwo: e.target.value,
                    };
                    setDeliveryAddresses(updated);
                  }}
                />
              </div>
            ))}

            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={addDeliveryAddress}
                className="text-blue-600 underline text-sm"
              >
                Dodaj kolejne miejsce
              </button>
              {deliveryAddresses.length > 1 && (
                <button
                  type="button"
                  onClick={removeLastDeliveryAddress}
                  className="text-red-600 underline text-sm"
                >
                  Cofnij ostatnie
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Towar */}
      <div>
        <h2 className="font-semibold">Towar</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Ilość palet"
            className="px-3 py-1 border rounded"
            value={palety}
            onChange={(e) => setPalety(e.target.value)}
          />
          <input
            type="text"
            placeholder="Waga (kg)"
            className="px-3 py-1 border rounded"
            value={waga}
            onChange={(e) => setWaga(e.target.value)}
          />
          <input
            type="text"
            placeholder="Wymiar palet"
            className="px-3 py-1 border rounded"
            value={wymiar}
            onChange={(e) => setWymiar(e.target.value)}
          />
          <input
            type="text"
            placeholder="LDM"
            className="px-3 py-1 border rounded"
            value={ldm}
            onChange={(e) => setLdm(e.target.value)}
          />
        </div>
      </div>

      {/* Odprawa celna: eksport / import */}
      <div className="flex gap-8">
        {/* Eksportowa */}
        <div className="flex-1">
          <h2 className="font-semibold text-center mb-2">
            Odprawa celna eksportowa
          </h2>
          <div className="flex flex-col items-start space-y-2">
            <label>
              <input
                type="checkbox"
                checked={showExportCustoms}
                onChange={() => {
                  setShowExportCustoms(!showExportCustoms);
                  setExportCustomsOption(''); // reset
                }}
              />
              <span className="ml-2">
                Czy towar podlega procedurze celnej eksportowej?
              </span>
            </label>

            {showExportCustoms && (
              <div className="ml-4 flex flex-col items-start space-y-2">
                <label>
                  <input
                    type="radio"
                    name="exportCustoms"
                    value="odbior"
                    checked={exportCustomsOption === 'odbior'}
                    onChange={() => setExportCustomsOption('odbior')}
                  />
                  <span className="ml-2">W miejscu odbioru towaru</span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="exportCustoms"
                    value="adres"
                    checked={exportCustomsOption === 'adres'}
                    onChange={() => setExportCustomsOption('adres')}
                  />
                  <span className="ml-2">Podaj adres</span>
                </label>

                {exportCustomsOption === 'adres' && (
                  <div className="w-full space-y-2 border-t pt-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nazwa firmy"
                        className="w-full px-3 py-1 border rounded"
                        value={exportCustomsAddress.company || ''}
                        onChange={handleExportCustomsNameChange}
                      />
                      {exportCustomsSuggestions.length > 0 && (
                        <ul className="absolute z-50 bg-white border w-full">
                          {exportCustomsSuggestions.map((agency) => (
                            <li
                              key={agency.id}
                              className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                              onClick={() => handleExportCustomsSelect(agency)}
                            >
                              {agency.nazwa}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Ulica i nr budynku"
                      className="w-full px-3 py-1 border rounded"
                      value={exportCustomsAddress.street || ''}
                      onChange={(e) =>
                        setExportCustomsAddress({
                          ...exportCustomsAddress,
                          street: e.target.value,
                        })
                      }
                    />

                    <input
                      type="text"
                      placeholder="Miejscowość"
                      className="w-full px-3 py-1 border rounded"
                      value={exportCustomsAddress.city || ''}
                      onChange={(e) =>
                        setExportCustomsAddress({
                          ...exportCustomsAddress,
                          city: e.target.value,
                        })
                      }
                    />

                    <input
                      type="text"
                      placeholder="Kod pocztowy"
                      className="w-full px-3 py-1 border rounded"
                      value={exportCustomsAddress.zip || ''}
                      onChange={(e) =>
                        setExportCustomsAddress({
                          ...exportCustomsAddress,
                          zip: e.target.value,
                        })
                      }
                    />

                    <input
                      type="text"
                      placeholder="Państwo"
                      className="w-full px-3 py-1 border rounded"
                      value={exportCustomsAddress.country || ''}
                      onChange={(e) =>
                        setExportCustomsAddress({
                          ...exportCustomsAddress,
                          country: e.target.value,
                        })
                      }
                    />

                    <textarea
                      placeholder="Uwagi"
                      className="w-full px-3 py-1 border rounded"
                      value={exportCustomsAddress.notes || ''}
                      onChange={(e) =>
                        setExportCustomsAddress({
                          ...exportCustomsAddress,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Importowa */}
        <div className="flex-1">
          <h2 className="font-semibold text-center mb-2">
            Odprawa celna importowa
          </h2>
          <div className="flex flex-col items-start space-y-2">
            <label>
              <input
                type="checkbox"
                checked={showImportCustoms}
                onChange={() => {
                  setShowImportCustoms(!showImportCustoms);
                  setImportCustomsOption(''); // reset
                }}
              />
              <span className="ml-2">
                Czy towar podlega procedurze celnej importowej?
              </span>
            </label>

            {showImportCustoms && (
              <div className="ml-4 flex flex-col items-start space-y-2">
                <label>
                  <input
                    type="radio"
                    name="importCustoms"
                    value="dostawa"
                    checked={importCustomsOption === 'dostawa'}
                    onChange={() => setImportCustomsOption('dostawa')}
                  />
                  <span className="ml-2">W miejscu dostawy towaru</span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="importCustoms"
                    value="adres"
                    checked={importCustomsOption === 'adres'}
                    onChange={() => setImportCustomsOption('adres')}
                  />
                  <span className="ml-2">Podaj adres</span>
                </label>

                {importCustomsOption === 'adres' && (
                  <div className="w-full space-y-2 border-t pt-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nazwa firmy"
                        className="w-full px-3 py-1 border rounded"
                        value={importCustomsAddress.company || ''}
                        onChange={handleImportCustomsNameChange}
                      />
                      {importCustomsSuggestions.length > 0 && (
                        <ul className="absolute z-50 bg-white border w-full">
                          {importCustomsSuggestions.map((agency) => (
                            <li
                              key={agency.id}
                              className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                              onClick={() => handleImportCustomsSelect(agency)}
                            >
                              {agency.nazwa}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Ulica i nr budynku"
                      className="w-full px-3 py-1 border rounded"
                      value={importCustomsAddress.street || ''}
                      onChange={(e) =>
                        setImportCustomsAddress({
                          ...importCustomsAddress,
                          street: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Miejscowość"
                      className="w-full px-3 py-1 border rounded"
                      value={importCustomsAddress.city || ''}
                      onChange={(e) =>
                        setImportCustomsAddress({
                          ...importCustomsAddress,
                          city: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Kod pocztowy"
                      className="w-full px-3 py-1 border rounded"
                      value={importCustomsAddress.zip || ''}
                      onChange={(e) =>
                        setImportCustomsAddress({
                          ...importCustomsAddress,
                          zip: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Państwo"
                      className="w-full px-3 py-1 border rounded"
                      value={importCustomsAddress.country || ''}
                      onChange={(e) =>
                        setImportCustomsAddress({
                          ...importCustomsAddress,
                          country: e.target.value,
                        })
                      }
                    />
                    <textarea
                      placeholder="Uwagi"
                      className="w-full px-3 py-1 border rounded"
                      value={importCustomsAddress.notes || ''}
                      onChange={(e) =>
                        setImportCustomsAddress({
                          ...importCustomsAddress,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fracht + Termin płatności */}
      <div className="border-t pt-6">
        <div className="flex justify-center">
          {/* Fracht */}
          <div className="w-full max-w-xs flex flex-col items-center">
            <h2 className="font-semibold text-center mb-4">Fracht</h2>

            {/* Cena + Waluta w jednym rzędzie */}
            <div className="flex items-end gap-4">
              {/* Cena */}
              <div className="flex flex-col items-center">
                <label className="text-sm mb-1 text-center">Cena</label>
                <input
                  type="text"
                  placeholder="Wpisz cenę"
                  className="px-3 py-1 border rounded text-center w-32"
                  value={cena}
                  onChange={(e) => setCena(e.target.value)}
                />
              </div>

              {/* Waluta */}
              <div className="flex flex-col items-center">
                <label className="text-sm mb-1 text-center">Waluta</label>
                <select
                  className="px-3 py-1 border rounded w-20"
                  style={{ textAlignLast: 'center' }}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {getCurrencySymbol(code)}
                    </option>
                  ))}
                  <option value="inna">Inna</option>
                </select>
              </div>
            </div>

            {/* Inna waluta */}
            {currency === 'inna' && (
              <div className="flex flex-col items-center mt-2">
                <label className="text-sm mb-1 text-center">Podaj walutę</label>
                <input
                  type="text"
                  placeholder="np. USD"
                  className="px-3 py-1 border rounded text-center w-32"
                  value={customCurrency}
                  onChange={(e) => setCustomCurrency(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dodatkowe uwagi */}
      <div>
        <button
          onClick={() => setExtraNotesVisible(!extraNotesVisible)}
          className="text-blue-600 underline text-sm"
        >
          {extraNotesVisible ? 'Ukryj dodatkowe uwagi' : 'Dodatkowe uwagi'}
        </button>
        {extraNotesVisible && (
          <textarea
            placeholder="Uwagi dodatkowe"
            className="w-full px-3 py-1 border rounded mt-2"
            value={uwagi}
            onChange={(e) => setUwagi(e.target.value)}
          />
        )}
      </div>
      <button
        onClick={handleSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Zapisywanie...' : 'Zapisz zlecenie'}
      </button>
    </div>
  );
}
