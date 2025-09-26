import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { supabase } from '../../supabaseClient';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CURRENCIES, getCurrencySymbol } from '../../utils/currency';

export default function DodajZlecenieExport() {
  const { id } = useParams();
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
  const navigate = useNavigate();
  const [kontrahenciSugestie, setKontrahenciSugestie] = useState([]);
  const [kontrahentId, setKontrahentId] = useState(null);
  const [exportCustomsSuggestions, setExportCustomsSuggestions] = useState([]);
  const [pickupTimeIsRange, setPickupTimeIsRange] = useState(false);
  const [deliveryTimeIsRange, setDeliveryTimeIsRange] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([[]]);
  const [deliverySuggestions, setDeliverySuggestions] = useState([[]]);
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [originalZlecenie, setOriginalZlecenie] = useState({});

  // ⬇️ TUTAJ WKLEJ
  useEffect(() => {
    const fetchZlecenie = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('zlecenia_export')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Błąd podczas pobierania zlecenia:', error.message);
        alert('Nie udało się załadować zlecenia.');
        return;
      }

      setOriginalZlecenie(data);

      // --- proste pola tekstowe ---
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

      // --- DATY: zawsze Date lub null ---
      const toDate = (v) => (v ? new Date(v) : null);

      setPickupDate(toDate(data.pickup_date_start));
      setPickupRange([
        toDate(data.pickup_date_start),
        toDate(data.pickup_date_end),
      ]);
      setShowPickupRange(
        Boolean(data.pickup_date_end) &&
          data.pickup_date_start !== data.pickup_date_end,
      );

      setDeliveryDate(toDate(data.delivery_date_start));
      setDeliveryRange([
        toDate(data.delivery_date_start),
        toDate(data.delivery_date_end),
      ]);
      setShowDeliveryRange(
        Boolean(data.delivery_date_end) &&
          data.delivery_date_start !== data.delivery_date_end,
      );

      // --- GODZINY (zostaw jako stringi, jeśli tak masz w inputach) ---
      setPickupTime(data.pickup_time || '');
      setPickupTimeRange([
        data.pickup_time_start || '',
        data.pickup_time_end || '',
      ]);
      setDeliveryTime(data.delivery_time || '');
      setDeliveryTimeRange([
        data.delivery_time_start || '',
        data.delivery_time_end || '',
      ]);

      // --- JSON: zawsze try/catch + poprawny domyślny typ ---
      const safeParse = (str, fallback) => {
        try {
          return JSON.parse(str ?? '');
        } catch {
          return fallback;
        }
      };

      setExportCustomsOption(data.export_customs_option || '');
      setExportCustomsAddress(
        // to OBIEKT, nie tablica:
        safeParse(data.export_customs_adres_json, {}),
      );

      setImportCustomsOption(data.import_customs_option || '');
      setImportCustomsAddress(
        // to OBIEKT, nie tablica:
        safeParse(data.import_customs_adres_json, {}),
      );

      // adresy odbioru/dostawy to LISTY:
      setPickupAddresses(safeParse(data.adresy_odbioru_json, []));
      setDeliveryAddresses(safeParse(data.adresy_dostawy_json, []));

      // --- waluta: solidna wartość domyślna ---
      setCurrency(data.waluta || 'EUR');
      setCustomCurrency(data.custom_currency || '');

      // --- kontrahent ---
      setKontrahentId(data.kontrahent_id || null);

      // --- reszta ---
      setPalety(data.palety || '');
      setWaga(data.waga || '');
      setWymiar(data.wymiar || '');
      setLdm(data.ldm || '');
      setCena(data.cena || '');
      setUwagi(data.uwagi || '');
    };

    fetchZlecenie();
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

    // 🔑 1️⃣ Najpierw znajdź lub stwórz kontrahenta
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
      // NOWY kontrahent
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

      const oldContacts = Array.isArray(existingKontrahent.kontakty_json)
        ? existingKontrahent.kontakty_json
        : [];
      const newContact = {
        imie_nazwisko: osobaKontaktowa || null,
        email: emailKontaktowy || null,
        telefon: telefonKontaktowy || null,
      };

      // ✅ DEDUPLIKACJA — sprawdź, czy taki kontakt już istnieje
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
        .eq('id', existingKontrahent.id);

      if (updateError) {
        console.error('Błąd aktualizacji kontrahenta:', updateError.message);
      }
    }

    // 👉 ZAPISZ AGENCJĘ CELNĄ (EKSPORTOWĄ)
    if (exportCustomsOption === 'adres' && exportCustomsAddress.nazwa) {
      const { data: existingExportAgency } = await supabase
        .from('agencje_celne')
        .select('*')
        .eq('nazwa', exportCustomsAddress.nazwa.trim())
        .single();

      if (!existingExportAgency) {
        await supabase.from('agencje_celne').insert({
          nazwa: exportCustomsAddress.nazwa.trim(),
          ulica: exportCustomsAddress.ulica,
          miasto: exportCustomsAddress.miasto,
          kod: exportCustomsAddress.kod,
          panstwo: exportCustomsAddress.panstwo,
        });
      }
    }

    // 👉 ZAPISZ AGENCJĘ CELNĄ (IMPORTOWĄ)
    if (importCustomsOption === 'adres' && importCustomsAddress.nazwa) {
      const { data: existingImportAgency } = await supabase
        .from('agencje_celne')
        .select('*')
        .eq('nazwa', importCustomsAddress.nazwa.trim())
        .single();

      if (!existingImportAgency) {
        await supabase.from('agencje_celne').insert({
          nazwa: importCustomsAddress.nazwa.trim(),
          ulica: importCustomsAddress.ulica,
          miasto: importCustomsAddress.miasto,
          kod: importCustomsAddress.kod,
          panstwo: importCustomsAddress.panstwo,
        });
      }
    }

    // 🔑 2️⃣ Dopiero teraz budujesz payload — z kontrahent_id
    const payload = {
      numer_zlecenia: numerZlecenia || originalZlecenie.numer_zlecenia,
      osoba_kontaktowa: osobaKontaktowa || originalZlecenie.osoba_kontaktowa,
      telefon_kontaktowy:
        telefonKontaktowy || originalZlecenie.telefon_kontaktowy,
      email_kontaktowy: emailKontaktowy || originalZlecenie.email_kontaktowy,

      zl_nazwa: zlNazwa || originalZlecenie.zl_nazwa,
      zl_ulica: zlUlica || originalZlecenie.zl_ulica,
      zl_miasto: zlMiasto || originalZlecenie.zl_miasto,
      zl_kod_pocztowy: zlKodPocztowy || originalZlecenie.zl_kod_pocztowy,
      zl_panstwo: zlPanstwo || originalZlecenie.zl_panstwo,
      zl_vat: vat || originalZlecenie.zl_vat,
      zl_nip: zlNip || originalZlecenie.zl_nip,
      zl_regon: zlRegon || originalZlecenie.zl_regon,
      zl_eori: zlEori || originalZlecenie.zl_eori,
      zl_pesel: zlPesel || originalZlecenie.zl_pesel,

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

      export_customs_option:
        exportCustomsOption || originalZlecenie.export_customs_option,
      export_customs_adres_json:
        exportCustomsOption === 'adres'
          ? JSON.stringify(exportCustomsAddress)
          : originalZlecenie.export_customs_adres_json,

      import_customs_option:
        importCustomsOption || originalZlecenie.import_customs_option,
      import_customs_adres_json:
        importCustomsOption === 'adres'
          ? JSON.stringify(importCustomsAddress)
          : originalZlecenie.import_customs_adres_json,

      waluta: currency || originalZlecenie.waluta,
      custom_currency: customCurrency || originalZlecenie.custom_currency,

      adresy_odbioru_json: pickupAddresses?.some(
        (a) =>
          a.nazwa?.trim() ||
          a.kod?.trim() ||
          a.ulica?.trim() ||
          a.miasto?.trim(),
      )
        ? JSON.stringify(pickupAddresses)
        : originalZlecenie.adresy_odbioru_json,

      adresy_dostawy_json: deliveryAddresses?.some(
        (a) =>
          a.nazwa?.trim() ||
          a.kod?.trim() ||
          a.ulica?.trim() ||
          a.miasto?.trim(),
      )
        ? JSON.stringify(deliveryAddresses)
        : originalZlecenie.adresy_dostawy_json,

      palety: palety || originalZlecenie.palety,
      waga: waga || originalZlecenie.waga,
      wymiar: wymiar || originalZlecenie.wymiar,
      ldm: ldm || originalZlecenie.ldm,
      cena: cena || originalZlecenie.cena,
      uwagi: uwagi || originalZlecenie.uwagi,

      pickup_time: !pickupTimeIsRange ? pickupTime : null,
      pickup_time_start: pickupTimeIsRange ? pickupTimeRange[0] : null,
      pickup_time_end: pickupTimeIsRange ? pickupTimeRange[1] : null,

      delivery_time: !deliveryTimeIsRange ? deliveryTime : null,
      delivery_time_start: deliveryTimeIsRange ? deliveryTimeRange[0] : null,
      delivery_time_end: deliveryTimeIsRange ? deliveryTimeRange[1] : null,

      kontrahent_id: kontrahentIdNowy || kontrahentId,
    };

    // 🔑 3️⃣ INSERT lub UPDATE
    if (id) {
      const { error: updateError } = await supabase
        .from('zlecenia_export')
        .update(payload)
        .eq('id', id);

      if (updateError) {
        console.error('Błąd zapisu:', updateError.message);
        alert('Wystąpił błąd:\n' + updateError.message);
        setIsSubmitting(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('zlecenia_export')
        .insert([payload]);

      if (insertError) {
        console.error('Błąd zapisu:', insertError.message);
        alert('Wystąpił błąd:\n' + insertError.message);
        setIsSubmitting(false);
        return;
      }
    }

    // ➜ ZAPISZ adresy i kontakty (krok 2)
    for (const addr of pickupAddresses) {
      if (addr.nazwa) {
        await supabase.from('saved_addresses').upsert(
          {
            name: addr.nazwa,
            street: addr.ulica,
            postal_code: addr.kod,
            city: addr.miasto,
            country: addr.panstwo,
          },
          { onConflict: ['name', 'street', 'postal_code'] },
        );
      }
    }

    for (const addr of deliveryAddresses) {
      if (addr.nazwa) {
        await supabase.from('saved_addresses').upsert(
          {
            name: addr.nazwa,
            street: addr.ulica,
            postal_code: addr.kod,
            city: addr.miasto,
            country: addr.panstwo,
          },
          { onConflict: ['name', 'street', 'postal_code'] },
        );
      }
    }

    if (osobaKontaktowa) {
      await supabase.from('saved_contacts').upsert(
        {
          name: osobaKontaktowa,
          phone: telefonKontaktowy,
          email: emailKontaktowy,
        },
        { onConflict: ['name', 'phone'] },
      );
    }

    // Jeśli LDM to nie FTL — kopiujemy do wykaz_ltl
    if (ldm.trim().toUpperCase() !== 'FTL') {
      const ltlPayload = { ...payload };

      // Możesz dodać znacznik, że to LTL:
      ltlPayload.typ = 'LTL';

      const { error: ltlError } = await supabase
        .from('wykaz_ltl')
        .insert([ltlPayload]);

      if (ltlError) {
        console.error('Błąd zapisu do wykaz_ltl:', ltlError.message);
      }
    }

    alert(id ? 'Zlecenie zaktualizowane.' : 'Zlecenie dodane.');
    navigate('/zlecenia/export/lista');
    setIsSubmitting(false);
  };

  const addPickupAddress = () => {
    if (pickupAddresses.length < 10) {
      setPickupAddresses([...pickupAddresses, {}]);
    }
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
    setExportCustomsAddress({ ...exportCustomsAddress, nazwa: value });

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
      nazwa: agency.nazwa,
      ulica: agency.ulica_nr,
      miasto: agency.miasto,
      kod: agency.kod_pocztowy,
      panstwo: agency.panstwo,
    });
    setExportCustomsSuggestions([]);
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
    // nazwa i zamknięcie podpowiedzi
    setZlNazwa(kontrahent.nazwa);
    setKontrahenciSugestie([]);

    // (opcjonalnie) pamiętaj id kontrahenta do zapisu w payloadzie
    if (typeof setKontrahentId === 'function' && kontrahent.id) {
      setKontrahentId(kontrahent.id);
    }

    // adres zleceniodawcy
    setZlUlica(
      kontrahent.adres_json?.ulica_nr || kontrahent.adres_json?.ulica || '',
    );
    setZlMiasto(kontrahent.adres_json?.miasto || '');
    setZlKodPocztowy(
      kontrahent.adres_json?.kod_pocztowy || kontrahent.adres_json?.kod || '',
    );
    setZlPanstwo(kontrahent.adres_json?.panstwo || '');

    // identyfikatory
    setVat(kontrahent.identyfikatory_json?.vat || '');
    setZlNip(kontrahent.identyfikatory_json?.nip || '');
    setZlRegon(kontrahent.identyfikatory_json?.regon || '');
    setZlEori(kontrahent.identyfikatory_json?.eori || '');
    setZlPesel(kontrahent.identyfikatory_json?.pesel || '');

    // ------- KONTAKT: uzupełnij TYLKO gdy pole jest puste --------
    // preferuj kontakty_json (tablica), wstecznie obsłuż kontakt_json (obiekt)
    const firstContact =
      (Array.isArray(kontrahent.kontakty_json) &&
        kontrahent.kontakty_json[0]) ||
      kontrahent.kontakt_json || // fallback: stare pole
      null;

    if (firstContact) {
      setOsobaKontaktowa((prev) => prev || firstContact.imie_nazwisko || '');
      setTelefonKontaktowy((prev) => prev || firstContact.telefon || '');
      setEmailKontaktowy((prev) => prev || firstContact.email || '');
    }
    // --------------------------------------------------------------
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Dodaj zlecenie eksportowe
      </h1>

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
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={pickupTimeIsRange}
                onChange={() => setPickupTimeIsRange(!pickupTimeIsRange)}
              />
              Przedział godzin
            </label>
            <div className="mt-2">
              {!pickupTimeIsRange ? (
                <input
                  type="time"
                  className="px-3 py-1 border rounded"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              ) : (
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
            <label className="text-sm flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={deliveryTimeIsRange}
                onChange={() => setDeliveryTimeIsRange(!deliveryTimeIsRange)}
              />
              Przedział godzin
            </label>
            <div className="mt-2">
              {!deliveryTimeIsRange ? (
                <input
                  type="time"
                  className="px-3 py-1 border rounded"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                />
              ) : (
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
            Miejsce odprawy celnej eksportowej
          </h2>
          <div className="flex flex-col items-center space-y-2">
            <label>
              <input
                type="radio"
                name="exportCustoms"
                value="odbior"
                checked={exportCustomsOption === 'odbior'}
                onChange={() => setExportCustomsOption('odbior')}
              />
              <span className="ml-2">Tak, w miejscu odbioru towaru</span>
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
                    value={exportCustomsAddress.nazwa || ''}
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
                  value={exportCustomsAddress.ulica || ''}
                  onChange={(e) =>
                    setExportCustomsAddress({
                      ...exportCustomsAddress,
                      ulica: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Miejscowość"
                  className="w-full px-3 py-1 border rounded"
                  value={exportCustomsAddress.miasto || ''}
                  onChange={(e) =>
                    setExportCustomsAddress({
                      ...exportCustomsAddress,
                      miasto: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Kod pocztowy"
                  className="w-full px-3 py-1 border rounded"
                  value={exportCustomsAddress.kod || ''}
                  onChange={(e) =>
                    setExportCustomsAddress({
                      ...exportCustomsAddress,
                      kod: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Państwo"
                  className="w-full px-3 py-1 border rounded"
                  value={exportCustomsAddress.panstwo || ''}
                  onChange={(e) =>
                    setExportCustomsAddress({
                      ...exportCustomsAddress,
                      panstwo: e.target.value,
                    })
                  }
                />
                <textarea
                  placeholder="Uwagi"
                  className="w-full px-3 py-1 border rounded"
                  value={exportCustomsAddress.uwagi || ''}
                  onChange={(e) =>
                    setExportCustomsAddress({
                      ...exportCustomsAddress,
                      uwagi: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Importowa */}
        <div className="flex-1">
          <h2 className="font-semibold text-center mb-2">
            Miejsce odprawy celnej importowej
          </h2>
          <div className="flex flex-col items-center space-y-2">
            <label>
              <input
                type="radio"
                name="importCustoms"
                value="odbior"
                checked={importCustomsOption === 'odbior'}
                onChange={() => setImportCustomsOption('odbior')}
              />
              <span className="ml-2">System GVMS</span>
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
                <input
                  type="text"
                  placeholder="Nazwa firmy"
                  className="w-full px-3 py-1 border rounded"
                  value={importCustomsAddress.nazwa || ''}
                  onChange={(e) =>
                    setImportCustomsAddress({
                      ...importCustomsAddress,
                      nazwa: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Ulica i nr budynku"
                  className="w-full px-3 py-1 border rounded"
                  value={importCustomsAddress.ulica || ''}
                  onChange={(e) =>
                    setImportCustomsAddress({
                      ...importCustomsAddress,
                      ulica: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Miejscowość"
                  className="w-full px-3 py-1 border rounded"
                  value={importCustomsAddress.miasto || ''}
                  onChange={(e) =>
                    setImportCustomsAddress({
                      ...importCustomsAddress,
                      miasto: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Kod pocztowy"
                  className="w-full px-3 py-1 border rounded"
                  value={importCustomsAddress.kod || ''}
                  onChange={(e) =>
                    setImportCustomsAddress({
                      ...importCustomsAddress,
                      kod: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Państwo"
                  className="w-full px-3 py-1 border rounded"
                  value={importCustomsAddress.panstwo || ''}
                  onChange={(e) =>
                    setImportCustomsAddress({
                      ...importCustomsAddress,
                      panstwo: e.target.value,
                    })
                  }
                />
                <textarea
                  placeholder="Uwagi"
                  className="w-full px-3 py-1 border rounded"
                  value={importCustomsAddress.uwagi || ''}
                  onChange={(e) =>
                    setImportCustomsAddress({
                      ...importCustomsAddress,
                      uwagi: e.target.value,
                    })
                  }
                />
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
