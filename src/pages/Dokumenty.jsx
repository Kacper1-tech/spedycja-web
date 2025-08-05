import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Dokumenty() {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserAndDocuments = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setUser(userData.user);
      }
      fetchDocuments(); // <-- ZAWSZE
    };
    fetchUserAndDocuments();
  }, []);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false });
    if (!error) setDocuments(data);
    else console.error('Błąd:', error);
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from('documents').insert([
      {
        user_id: user.id,
        filename: file.name,
        description: description || null,
        file_url: urlData.publicUrl,
      },
    ]);

    if (!insertError) {
      setFile(null);
      setDescription('');
      fetchDocuments();
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Usunąć plik ${doc.filename}?`)) return;

    const filePath = `${doc.user_id}/${doc.file_url.split('/').pop()}`;
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Błąd usuwania pliku:', storageError);
      return;
    }

    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id);

    if (!deleteError) fetchDocuments();
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return '📄';
    if (['jpg', 'jpeg', 'png'].includes(ext)) return '📷';
    if (['zip', 'rar'].includes(ext)) return '📁';
    return '📎';
  };

  const handleDownload = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-3 mb-8">
        📁 <span>Dokumenty</span>
      </h1>

      {/* Formularz */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="border border-gray-300 p-2 rounded-md shadow-sm w-full"
        />
        <input
          type="text"
          placeholder="Opis dokumentu"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-300 p-2 rounded-md shadow-sm w-full"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 w-full"
        >
          📤 Wgraj
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto w-full">
        <table className="w-full table-auto border border-gray-200 text-sm shadow-sm rounded-md overflow-hidden">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-3 text-left">Nazwa pliku</th>
              <th className="p-3 text-left">Opis</th>
              <th className="p-3 text-left">Data</th>
              <th className="p-3 text-left">Akcja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="p-3 flex items-center gap-2">
                  <span>{getFileIcon(doc.filename)}</span>
                  <span>{doc.filename}</span>
                </td>
                <td className="p-3">{doc.description || '-'}</td>
                <td className="p-3 whitespace-nowrap text-gray-600">
                  {new Date(doc.uploaded_at).toLocaleString('pl-PL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => handleDownload(doc.file_url)}
                    className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                  >
                    📥 Pobierz
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    🗑️ Usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
