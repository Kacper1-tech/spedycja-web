import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './CMRForm.css';

const initialFormState = {
  sender: '',
  consignee: '',
  deliveryPlace: '',
  documents: '',
  marks: '',
  quantity: '',
  packaging: '',
  goods: '',
  statNumber: '',
  grossWeight: '',
  volume: '',
  instructions: '',
  conditions: '',
  paymentDue: '',
  paymentMethod: '',
  carrier: '',
  additionalCarrier: '',
  carrierNote: '',
  issuedPlace: '',
  senderSign: '',
  carrierSign: '',
  receiverSign: '',
};

export default function CMRForm() {
  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('cmr_forms').insert([formData]);
    if (error) alert('Błąd zapisu: ' + error.message);
    else alert('Zapisano formularz CMR do Supabase');
  };

  return (
    <div className="cmr-container">
      <h2 className="cmr-title">
        MIĘDZYNARODOWY SAMOCHODOWY LIST PRZEWOZOWY (CMR)
      </h2>
      <form onSubmit={handleSubmit} className="cmr-form">
        <table className="cmr-table">
          <tbody>
            <tr>
              <td colSpan="2">
                <label>
                  1. Nadawca:
                  <input
                    name="sender"
                    value={formData.sender}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td colSpan="2">
                <label>
                  16. Przewoźnik:
                  <input
                    name="carrier"
                    value={formData.carrier}
                    onChange={handleChange}
                  />
                </label>
              </td>
            </tr>
            <tr>
              <td colSpan="2">
                <label>
                  2. Odbiorca:
                  <input
                    name="consignee"
                    value={formData.consignee}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td colSpan="2">
                <label>
                  17. Kolejny przewoźnik:
                  <input
                    name="additionalCarrier"
                    value={formData.additionalCarrier}
                    onChange={handleChange}
                  />
                </label>
              </td>
            </tr>
            <tr>
              <td colSpan="2">
                <label>
                  3. Miejsce przeznaczenia:
                  <input
                    name="deliveryPlace"
                    value={formData.deliveryPlace}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td colSpan="2">
                <label>
                  18. Zastrzeżenia przewoźnika:
                  <input
                    name="carrierNote"
                    value={formData.carrierNote}
                    onChange={handleChange}
                  />
                </label>
              </td>
            </tr>
            <tr>
              <td colSpan="2">
                <label>
                  4. Miejsce i data załadunku:
                  <input
                    name="loadingPlace"
                    value={formData.loadingPlace}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td colSpan="2">
                <label>
                  5. Załączone dokumenty:
                  <input
                    name="documents"
                    value={formData.documents}
                    onChange={handleChange}
                  />
                </label>
              </td>
            </tr>
            <tr>
              <td>
                <label>
                  6. Cechy i numery:
                  <input
                    name="marks"
                    value={formData.marks}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td>
                <label>
                  7. Ilość sztuk:
                  <input
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td>
                <label>
                  8. Sposób opakowania:
                  <input
                    name="packaging"
                    value={formData.packaging}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td>
                <label>
                  9. Rodzaj towaru:
                  <input
                    name="goods"
                    value={formData.goods}
                    onChange={handleChange}
                  />
                </label>
              </td>
            </tr>
            <tr>
              <td>
                <label>
                  10. Nr statystyczny:
                  <input
                    name="statNumber"
                    value={formData.statNumber}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td>
                <label>
                  11. Waga brutto:
                  <input
                    name="grossWeight"
                    value={formData.grossWeight}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td>
                <label>
                  12. Objętość:
                  <input
                    name="volume"
                    value={formData.volume}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td></td>
            </tr>
            <tr>
              <td colSpan="2">
                <label>
                  13. Instrukcje nadawcy:
                  <input
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td colSpan="2">
                <label>
                  14. Postanowienia przewozowe:
                  <input
                    name="conditions"
                    value={formData.conditions}
                    onChange={handleChange}
                  />
                </label>
              </td>
            </tr>
            <tr>
              <td colSpan="2">
                <label>
                  20. Do zapłacenia:
                  <input
                    name="paymentDue"
                    value={formData.paymentDue}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td>
                <label>
                  15. Zapłata:
                  <input
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td>
                <label>
                  21. Wystawiono w:
                  <input
                    name="issuedPlace"
                    value={formData.issuedPlace}
                    onChange={handleChange}
                  />
                </label>
              </td>
            </tr>
            <tr>
              <td>
                <label>
                  22. Podpis nadawcy:
                  <input
                    name="senderSign"
                    value={formData.senderSign}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td>
                <label>
                  23. Podpis przewoźnika:
                  <input
                    name="carrierSign"
                    value={formData.carrierSign}
                    onChange={handleChange}
                  />
                </label>
              </td>
              <td colSpan="2">
                <label>
                  24. Podpis odbiorcy:
                  <input
                    name="receiverSign"
                    value={formData.receiverSign}
                    onChange={handleChange}
                  />
                </label>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="cmr-buttons">
          <button type="submit">Zapisz</button>
          <button type="button" onClick={() => window.print()}>
            Drukuj
          </button>
        </div>
      </form>
    </div>
  );
}
