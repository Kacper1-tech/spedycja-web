import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm flex flex-col items-center"
      >
        <img
          src="/logo.jpg" // <- Ścieżka do pliku w folderze public
          alt="Logo"
          className="mb-6 w-40"
        />

        <h2 className="text-2xl font-bold mb-6 text-center">Logowanie</h2>

        <label
          htmlFor="email"
          className="block mb-2 text-sm font-medium text-gray-700 w-full text-left"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          placeholder="Podaj e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 mb-4 border rounded focus:outline-none focus:ring focus:border-blue-400"
        />

        <label className="block mb-2 text-sm font-medium text-gray-700 w-full text-left">
          Hasło
        </label>
        <input
          type="password"
          placeholder="Podaj hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 mb-6 border rounded focus:outline-none focus:ring focus:border-blue-400"
        />

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition-colors"
        >
          Zaloguj
        </button>
      </form>
    </div>
  );
}
