import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


export default function ListaFakturKosztowych() {
  const [faktury, setFaktury] = useState([
    {
      id: 1,
      nazwa: "Firma ABC",
      nrFaktury: "FV/001/2025",
      PLN: 1000,
      EUR: 0,
      GBP: 0,
      dataPlatnosci: "2025-07-01",
      selected: false,
      isEditing: false,
    },
    // Dodaj więcej przykładowych
  ]);

	useEffect(() => {
		const fetchFaktury = async () => {
			const { data, error } = await supabase
				.from("faktury_kosztowe")
				.select("*")
				.order("data_platnosci", { ascending: true });

			if (error) {
				console.error("Błąd pobierania faktur:", error);
			} else {
				// Mapowanie nazw pól jeśli różnią się
				const mappedData = data.map(item => ({
					id: item.id,
					nazwa: item.nazwa,
					nrFaktury: item.nr_faktury,
					PLN: item.pln,
					EUR: item.eur,
					GBP: item.gbp,
					dataPlatnosci: item.data_platnosci,
					selected: false,
					isEditing: false,
				}));

				setFaktury(mappedData);
			}
		};

		fetchFaktury();
	}, []);

  const [editValues, setEditValues] = useState({});

  const [filters, setFilters] = useState({
    nazwa: "",
    nrFaktury: "",
    PLN: "",
    EUR: "",
    GBP: "",
    dataPlatnosci: "",
  });

  const handleFilterChange = (e, key) => {
    setFilters({ ...filters, [key]: e.target.value });
  };

  const toggleSelect = (id) => {
    setFaktury(
      faktury.map((f) =>
        f.id === id ? { ...f, selected: !f.selected } : f
      )
    );
  };

	const handleSave = async (id) => {
		// 1) Wyślij dane do Supabase
		const { error } = await supabase
			.from("faktury_kosztowe")
			.update({
				nazwa: editValues.nazwa,
				nr_faktury: editValues.nrFaktury,
				pln: parseFloat(editValues.PLN),
				eur: parseFloat(editValues.EUR),
				gbp: parseFloat(editValues.GBP),
				data_platnosci: editValues.dataPlatnosci,
			})
			.eq("id", id);

		if (error) {
			console.error("Błąd zapisu:", error);
			return;
		}

		// 2) Zaktualizuj lokalny stan
		setFaktury(
			faktury.map((f) =>
				f.id === id
					? { ...f, ...editValues, isEditing: false }
					: f
			)
		);

		// 3) Wyczyść editValues
		setEditValues({});
	};

	const handleDelete = async (ids) => {
		if (ids.length === 0) return;

		// Usuń z Supabase
		const { error } = await supabase
			.from("faktury_kosztowe")
			.delete()
			.in("id", ids);

		if (error) {
			console.error("Błąd usuwania:", error);
			return;
		}

		// Usuń lokalnie
		setFaktury(faktury.filter((f) => !ids.includes(f.id)));
	};

	const handleExportPDF = () => {
		const toPrint = faktury.filter((f) => f.selected);
		const data = toPrint.length ? toPrint : faktury;

		// Utwórz tymczasowy element HTML z tabelą
		const tableHtml = `
			<div id="export-pdf">
				<h2>Lista Faktur</h2>
				<table border="1" cellspacing="0" cellpadding="4">
					<thead>
						<tr>
							<th>Nazwa</th>
							<th>Nr Faktury</th>
							<th>PLN</th>
							<th>EUR</th>
							<th>GBP</th>
							<th>Data Płatności</th>
						</tr>
					</thead>
					<tbody>
						${data.map(f => `
							<tr>
								<td>${f.nazwa}</td>
								<td>${f.nrFaktury}</td>
								<td>${f.PLN}</td>
								<td>${f.EUR}</td>
								<td>${f.GBP}</td>
								<td>${f.dataPlatnosci}</td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			</div>
		`;

		// Dodaj do DOM, żeby html2canvas mogło zrobić zrzut
		const container = document.createElement("div");
		container.innerHTML = tableHtml;
		container.style.position = "fixed";
		container.style.top = "-10000px"; // schowane poza ekranem
		document.body.appendChild(container);

		html2canvas(container).then((canvas) => {
			const imgData = canvas.toDataURL("image/png");
			const pdf = new jsPDF("p", "mm", "a4");
			const imgProps = pdf.getImageProperties(imgData);
			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

			pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
			pdf.save("lista_faktur.pdf");

			document.body.removeChild(container); // wyczyść
		});
	};

	const handlePrint = () => {
		const toPrint = faktury.filter((f) => f.selected);
		const data = toPrint.length ? toPrint : faktury;

		// Budujemy prosty HTML do wydruku
		const html = `
			<html>
				<head>
					<title>Lista Faktur</title>
					<style>
						table { width: 100%; border-collapse: collapse; }
						th, td { border: 1px solid black; padding: 4px; text-align: left; }
						th { background-color: #eee; }
					</style>
				</head>
				<body>
					<h2>Lista Faktur</h2>
					<table>
						<thead>
							<tr>
								<th>Nazwa</th><th>Nr Faktury</th><th>Kwota</th><th>Data Płatności</th>
							</tr>
						</thead>
						<tbody>
							${data.map(f => `
								<tr>
									<td>${f.nazwa}</td>
									<td>${f.nrFaktury}</td>
									<td>${f.PLN}</td>
									<td>${f.EUR}</td>
									<td>${f.GBP}</td>
									<td>${f.dataPlatnosci}</td>
								</tr>
							`).join('')}
						</tbody>
					</table>
				</body>
			</html>
		`;

		// Otwieramy nowe okno i drukujemy
		const printWindow = window.open('', '', 'width=800,height=600');
		printWindow.document.write(html);
		printWindow.document.close();
		printWindow.focus();
		printWindow.print();
		printWindow.close();
	};

  const filteredFaktury = faktury.filter((f) =>
    Object.keys(filters).every((key) =>
      String(f[key]).toLowerCase().includes(filters[key].toLowerCase())
    )
  );
	
	const handleEdit = (id) => {
		const faktura = faktury.find((f) => f.id === id);
		setEditValues(faktura);
		setFaktury(
			faktury.map((f) =>
				f.id === id ? { ...f, isEditing: true } : f
			)
		);
	};

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Lista Faktur</h2>
			<div className="overflow-x-auto">
				<table className="min-w-full border table-fixed">
					<thead>
						<tr className="bg-gray-200">
							<th className="p-2 border"><input type="checkbox" disabled /></th>
							<th className="p-2 border">Nazwa</th>
							<th className="p-2 border">Nr Faktury</th>
							<th className="p-2 border">PLN</th>
							<th className="p-2 border">EUR</th>
							<th className="p-2 border">GBP</th>
							<th className="p-2 border">Data Płatności</th>
							<th className="p-2 border">Akcje</th>
						</tr>
						<tr>
							<td className="p-2 border"></td>
							{["nazwa", "nrFaktury", "PLN", "EUR", "GBP", "dataPlatnosci"].map((key) => (
								<td key={key} className="p-1 border">
									<input
										type="text"
										value={filters[key]}
										onChange={(e) => handleFilterChange(e, key)}
										className="w-full border px-1 py-0.5"
										placeholder="Filtr"
									/>
								</td>
							))}
							<td className="p-2 border"></td>
						</tr>
					</thead>
					<tbody>
						{filteredFaktury.map((f) => (
							<tr key={f.id} className="border-b">
								<td className="p-2 border">
									<input
										type="checkbox"
										checked={f.selected}
										onChange={() => toggleSelect(f.id)}
									/>
								</td>
								<td className="p-2 border">
									{f.isEditing ? (
										<input
											value={editValues.nazwa || ""}
											onChange={(e) =>
												setEditValues({ ...editValues, nazwa: e.target.value })
											}
											className="border px-1 w-full max-w-[120px]"
										/>
									) : (
										f.nazwa
									)}
								</td>

								<td className="p-2 border">
									{f.isEditing ? (
										<input
											value={editValues.nrFaktury || ""}
											onChange={(e) =>
												setEditValues({ ...editValues, nrFaktury: e.target.value })
											}
											className="border px-1 w-full max-w-[120px]"
										/>
									) : (
										f.nrFaktury
									)}
								</td>

								<td className="p-2 border">
									{f.isEditing ? (
										<input
											type="number"
											value={editValues.PLN || ""}
											onChange={(e) =>
												setEditValues({ ...editValues, PLN: e.target.value })
											}
											className="border px-1 w-full max-w-[120px]"
										/>
									) : (
										f.PLN
									)}
								</td>

								<td className="p-2 border">
									{f.isEditing ? (
										<input
											type="number"
											value={editValues.EUR || ""}
											onChange={(e) =>
												setEditValues({ ...editValues, EUR: e.target.value })
											}
											className="border px-1 w-full max-w-[120px]"
										/>
									) : (
										f.EUR
									)}
								</td>

								<td className="p-2 border">
									{f.isEditing ? (
										<input
											type="number"
											value={editValues.GBP || ""}
											onChange={(e) =>
												setEditValues({ ...editValues, GBP: e.target.value })
											}
											className="border px-1 w-full max-w-[120px]"
										/>
									) : (
										f.GBP
									)}
								</td>

								<td className="p-2 border">
									{f.isEditing ? (
										<input
											type="date"
											value={editValues.dataPlatnosci || ""}
											onChange={(e) =>
												setEditValues({ ...editValues, dataPlatnosci: e.target.value })
											}
											className="border px-1 w-full max-w-[120px]"
										/>
									) : (
										f.dataPlatnosci
									)}
								</td>
								<td className="p-2 border space-x-2">
									{f.isEditing ? (
										<button
											className="px-2 py-1 bg-green-500 text-white rounded"
											onClick={() => handleSave(f.id)}
										>
											Zapisz
										</button>
									) : (
										<button
											onClick={() => handleEdit(f.id)}
											className="px-2 py-1 bg-blue-500 text-white rounded"
										>
											Edytuj
										</button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

      <div className="flex space-x-4 mt-4">
        <button
          onClick={() =>
            handleDelete(faktury.filter((f) => f.selected).map((f) => f.id))
          }
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Usuń zaznaczone
        </button>
        <button
					onClick={handleExportPDF}
					className="px-4 py-2 bg-gray-700 text-white rounded"
				>
					Eksportuj PDF
				</button>
				<button
					onClick={handlePrint}
					className="px-4 py-2 bg-blue-700 text-white rounded"
				>
					Drukuj
				</button>
			</div>
    </div>
  );
}
