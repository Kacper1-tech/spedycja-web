import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useZaktualizowaniImportowiKontrahenci({ autoRefresh = true } = {}) {
  const [zlecenia, setZlecenia] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('zlecenia_import')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Błąd ładowania zleceń importowych:', error);
    } else {
      setZlecenia(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const handleRefresh = () => {
        fetchData();
      };
      window.addEventListener('refreshZleceniaImport', handleRefresh);

      return () => {
        window.removeEventListener('refreshZleceniaImport', handleRefresh);
      };
    }
  }, [autoRefresh]);

  return { zlecenia, fetchData, loading };
}
