import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Transport from "./pages/Transport";
import Plan from "./pages/Plan";
import Zlecenia from "./pages/Zlecenia";
import Kontrahenci from "./pages/Kontrahenci";
import Ksiegowosc from "./pages/Ksiegowosc";
import Rejestr from "./pages/Rejestr";
import Dokumenty from "./pages/Dokumenty";

export default function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Zlecenia</Link>
        <Link to="/transport">Transport</Link>
        <Link to="/plan">Plan</Link>
        <Link to="/kontrahenci">Kontrahenci</Link>
        <Link to="/ksiegowosc">Księgowość</Link>
        <Link to="/rejestr">Rejestr</Link>
        <Link to="/dokumenty">Dokumenty</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Zlecenia />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/kontrahenci" element={<Kontrahenci />} />
          <Route path="/ksiegowosc" element={<Ksiegowosc />} />
          <Route path="/rejestr" element={<Rejestr />} />
          <Route path="/dokumenty" element={<Dokumenty />} />
        </Routes>
      </main>
    </Router>
  );
}
