import { NavLink, useLocation } from 'react-router-dom';
import { FaAngleRight } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import { useState } from 'react';

export default function NavigationBar() {
  const location = useLocation();
  const path = location.pathname;
  const isExportActive = path.startsWith('/zlecenia/export');
  const isImportActive = path.startsWith('/zlecenia/import');
  const isOtherActive = path.startsWith('/zlecenia/pozostale');

  const [isZleceniaOpen, setZleceniaOpen] = useState(false);
  const [isKsiegowoscOpen, setKsiegowoscOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isKontrahenciOpen, setKontrahenciOpen] = useState(false);
  //const [isCmrOpen, setCmrOpen] = useState(false);

  return (
    <nav className="bg-gray-900 text-white shadow relative z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Lewa część z zakładkami */}
        <div className="flex items-center space-x-6">
          <NavLink to="/" className="hover:text-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="white"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 21V12h6v9"
              />
            </svg>
          </NavLink>
          {/* Zlecenia */}
          <div
            className="relative"
            onMouseEnter={() => setZleceniaOpen(true)}
            onMouseLeave={() => {
              setZleceniaOpen(false);
              setOpenSubmenu(null);
            }}
          >
            <span className="hover:text-blue-400 cursor-pointer">Zlecenia</span>

            {isZleceniaOpen && (
              <div
                className="absolute left-0 mt-2 bg-white text-black rounded shadow-md z-50"
                style={{ marginTop: '0.5rem', paddingTop: '0.5rem' }}
              >
                <div className="absolute -top-2 left-0 h-2 w-full pointer-events-auto" />

                {/* Exportowe */}
                <div
                  className="relative"
                  onMouseEnter={() => setOpenSubmenu('export')}
                  onMouseLeave={() => setOpenSubmenu(null)}
                >
                  <div
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between min-w-[180px] ${
                      isExportActive ? 'bg-gray-200 font-semibold' : ''
                    }`}
                  >
                    Exportowe <FaAngleRight className="ml-2" />
                  </div>
                  {openSubmenu === 'export' && (
                    <div
                      className="absolute left-full top-0 ml-1 bg-white rounded shadow-md z-50 min-w-[180px]"
                      style={{ paddingLeft: '0.5rem' }}
                    >
                      <div className="absolute -left-2 top-0 w-2 h-full pointer-events-auto" />
                      <NavLink
                        to="/zlecenia/export/dodaj"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Dodaj zlecenie
                      </NavLink>
                      <NavLink
                        to="/zlecenia/export/lista"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Lista zleceń
                      </NavLink>
                      <NavLink
                        to="/zlecenia/wykaz-export-ltl"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Wykaz LTL
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* Importowe */}
                <div
                  className="relative"
                  onMouseEnter={() => setOpenSubmenu('import')}
                  onMouseLeave={() => setOpenSubmenu(null)}
                >
                  <div
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between min-w-[180px] ${
                      isImportActive ? 'bg-gray-200 font-semibold' : ''
                    }`}
                  >
                    Importowe <FaAngleRight className="ml-2" />
                  </div>
                  {openSubmenu === 'import' && (
                    <div
                      className="absolute left-full top-0 ml-1 bg-white rounded shadow-md z-50 min-w-[180px]"
                      style={{ paddingLeft: '0.5rem' }}
                    >
                      <div className="absolute -left-2 top-0 w-2 h-full pointer-events-auto" />
                      <NavLink
                        to="/zlecenia/import/dodaj"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Dodaj zlecenie
                      </NavLink>
                      <NavLink
                        to="/zlecenia/import/lista"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Lista zleceń
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* Pozostałe */}
                <div
                  className="relative"
                  onMouseEnter={() => setOpenSubmenu('pozostale')}
                  onMouseLeave={() => setOpenSubmenu(null)}
                >
                  <div
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between min-w-[180px] ${
                      isOtherActive ? 'bg-gray-200 font-semibold' : ''
                    }`}
                  >
                    Pozostałe <FaAngleRight className="ml-2" />
                  </div>
                  {openSubmenu === 'pozostale' && (
                    <div
                      className="absolute left-full top-0 ml-1 bg-white rounded shadow-md z-50 min-w-[180px]"
                      style={{ paddingLeft: '0.5rem' }}
                    >
                      <div className="absolute -left-2 top-0 w-2 h-full pointer-events-auto" />
                      <NavLink
                        to="/zlecenia/pozostale/dodaj"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Dodaj zlecenie
                      </NavLink>
                      <NavLink
                        to="/zlecenia/pozostale/lista"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Lista zleceń
                      </NavLink>
                    </div>
                  )}
                </div>

                <NavLink
                  to="/zlecenia/wszystkie"
                  className="block px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                >
                  Wszystkie zlecenia
                </NavLink>
              </div>
            )}
          </div>

          {/* Pozostałe zakładki */}
          <NavLink to="/transport" className="hover:text-blue-400">
            Transport
          </NavLink>
          <NavLink to="/plan" className="hover:text-blue-400">
            Plan
          </NavLink>
          {/* CMR */}
          {/*
						<div
						className="relative"
						onMouseEnter={() => setCmrOpen(true)}
						onMouseLeave={() => {
							setCmrOpen(false);
							setOpenSubmenu(null);
						}}
						>
						<span className="hover:text-blue-400 cursor-pointer">CMR</span>

						{isCmrOpen && (
							<div
							className="absolute left-0 mt-2 bg-white text-black rounded shadow-md z-50"
							style={{ marginTop: "0.5rem", paddingTop: "0.5rem" }}
							>
							<div className="absolute -top-2 left-0 h-2 w-full pointer-events-auto" />
							<NavLink
								to="/cmr/dodaj"
								className="block px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
							>
								Dodaj list CMR
							</NavLink>
							</div>
						)}
						</div>
						*/}
          <div
            className="relative"
            onMouseEnter={() => setKontrahenciOpen(true)}
            onMouseLeave={() => {
              setKontrahenciOpen(false);
              setOpenSubmenu(null);
            }}
          >
            <span className="hover:text-blue-400 cursor-pointer">
              Kontrahenci
            </span>

            {isKontrahenciOpen && (
              <div
                className="absolute left-0 mt-2 bg-white text-black rounded shadow-md z-50"
                style={{ marginTop: '0.5rem', paddingTop: '0.5rem' }}
              >
                <div className="absolute -top-2 left-0 h-2 w-full pointer-events-auto" />

                <NavLink
                  to="/kontrahenci/dodaj"
                  className="block px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                >
                  Dodaj Kontrahenta
                </NavLink>
                <NavLink
                  to="/kontrahenci/lista"
                  className="block px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                >
                  Lista Kontrahentów
                </NavLink>
              </div>
            )}
          </div>

          {/* Księgowość */}
          <div
            className="relative"
            onMouseEnter={() => setKsiegowoscOpen(true)}
            onMouseLeave={() => {
              setKsiegowoscOpen(false);
              setOpenSubmenu(null);
            }}
          >
            <span className="hover:text-blue-400 cursor-pointer">
              Księgowość
            </span>

            {isKsiegowoscOpen && (
              <div
                className="absolute left-0 mt-2 bg-white text-black rounded shadow-md z-50"
                style={{ marginTop: '0.5rem', paddingTop: '0.5rem' }}
              >
                <div className="absolute -top-2 left-0 h-2 w-full pointer-events-auto" />

                {/* Faktury */}
                <div
                  className="relative"
                  onMouseEnter={() => setOpenSubmenu('faktury')}
                  onMouseLeave={() => setOpenSubmenu(null)}
                >
                  <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between min-w-[180px]">
                    Faktury <FaAngleRight className="ml-2" />
                  </div>

                  {openSubmenu === 'faktury' && (
                    <div
                      className="absolute left-full top-0 ml-1 bg-white rounded shadow-md z-50 min-w-[180px]"
                      style={{ paddingLeft: '0.5rem' }}
                    >
                      <div className="absolute -left-2 top-0 w-2 h-full pointer-events-auto" />

                      <NavLink
                        to="/ksiegowosc/faktury/kosztowe/dodaj"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Dodaj FV
                      </NavLink>
                      <NavLink
                        to="/ksiegowosc/faktury/kosztowe/lista"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Lista Faktur
                      </NavLink>
                    </div>
                  )}
                  <NavLink
                    to="/ksiegowosc/wydatki"
                    className="block px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                  >
                    Wydatki
                  </NavLink>
                </div>
              </div>
            )}
          </div>

          <NavLink to="/rejestr" className="hover:text-blue-400">
            Rejestr
          </NavLink>
          <NavLink to="/dokumenty" className="hover:text-blue-400">
            Dokumenty
          </NavLink>
        </div>

        {/* Prawa część: przycisk Wyloguj */}
        <button
          onClick={() => supabase.auth.signOut()}
          className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200"
        >
          Wyloguj
        </button>
      </div>
    </nav>
  );
}
