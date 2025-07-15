import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import TransportTab from './pages/TransportTab';
import Plan from './pages/Plan';
import Zlecenia from './pages/Zlecenia';
import Ksiegowosc from './pages/Ksiegowosc';
import Kontrahenci from './pages/Kontrahenci';
import Rejestr from './pages/Rejestr';
import Dokumenty from './pages/Dokumenty';
import Login from './pages/Login';
import DodajZlecenieExport from './pages/Zlecenia/DodajZlecenieExport';
import DodajZlecenieImport from './pages/Zlecenia/DodajZlecenieImport';
import DodajZleceniePozostale from './pages/Zlecenia/DodajZleceniePozostale';
import WszystkieZlecenia from './pages/Zlecenia/WszystkieZlecenia';
import NavigationBar from './components/NavigationBar';
import ListaZlecenExport from './pages/Zlecenia/ListaZlecenExport';
import ListaZlecenImport from './pages/Zlecenia/ListaZlecenImport';
import ListaZlecenPozostale from './pages/Zlecenia/ListaZlecenPozostale';
import DodajFaktureKosztowa from './pages/Ksiegowosc/DodajFaktureKosztowa';
import ListaFakturKosztowych from './pages/Ksiegowosc/ListaFakturKosztowych';
import KontrahenciTab from './pages/Kontrahenci/KontrahenciTab';
import DodajKontrahenta from './pages/Kontrahenci/DodajKontrahenta';
import Wydatki from './pages/Ksiegowosc/Wydatki';
import WykazExportLTL from './pages/Zlecenia/WykazExportLTL';
//import CMRForm from './pages/CMR/CMRForm';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-sans">
        <NavigationBar />

        <main className="py-6">
          <div className="w-[95%] mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/zlecenia" element={<Zlecenia />} />
              <Route
                path="/zlecenia/import/dodaj"
                element={<DodajZlecenieImport />}
              />
              <Route
                path="/zlecenia/import/edytuj/:id"
                element={<DodajZlecenieImport />}
              />
              <Route
                path="/zlecenia/pozostale/dodaj"
                element={<DodajZleceniePozostale />}
              />
              <Route
                path="/zlecenia/wszystkie"
                element={<WszystkieZlecenia />}
              />
              <Route path="/transport" element={<TransportTab />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/kontrahenci" element={<Kontrahenci />} />
              <Route path="/kontrahenci/lista" element={<KontrahenciTab />} />
              <Route path="/kontrahenci/dodaj" element={<DodajKontrahenta />} />
              <Route path="/ksiegowosc" element={<Ksiegowosc />} />
              <Route
                path="/ksiegowosc/faktury/kosztowe/dodaj"
                element={<DodajFaktureKosztowa />}
              />
              <Route
                path="/ksiegowosc/faktury/kosztowe/lista"
                element={<ListaFakturKosztowych />}
              />
              <Route path="/ksiegowosc/wydatki" element={<Wydatki />} />
              <Route path="/rejestr" element={<Rejestr />} />
              <Route path="/dokumenty" element={<Dokumenty />} />
              {/* <Route path="/cmr" element={<CMRForm />} /> */}
              <Route
                path="/zlecenia/export/dodaj"
                element={<DodajZlecenieExport />}
              />
              <Route
                path="/zlecenia/export/edytuj/:id"
                element={<DodajZlecenieExport />}
              />
              <Route
                path="/zlecenia/pozostale/edytuj/:id"
                element={<DodajZleceniePozostale />}
              />
              <Route
                path="/zlecenia/export/lista"
                element={<ListaZlecenExport />}
              />
              <Route
                path="/zlecenia/wykaz-export-ltl"
                element={<WykazExportLTL />}
              />
              <Route
                path="/zlecenia/import/lista"
                element={<ListaZlecenImport />}
              />
              <Route
                path="/zlecenia/pozostale/lista"
                element={<ListaZlecenPozostale />}
              />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
