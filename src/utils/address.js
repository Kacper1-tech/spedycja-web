export const getFirstAddressCity = (addresses) => {
  const adresy =
    typeof addresses === 'string' ? JSON.parse(addresses) : addresses;
  return adresy?.[0]?.miasto || '';
};

export const getFirstAddressPostCode = (addresses) => {
  const adresy =
    typeof addresses === 'string' ? JSON.parse(addresses) : addresses;
  return adresy?.[0]?.kod || '';
};

export const getExportCustomsMiasto = (order) => {
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
