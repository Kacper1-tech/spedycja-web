import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useZaktualizowaniKontrahenci({ autoRefresh = true } = {}) {
  const [zlecenia, setZlecenia] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('zlecenia_export')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Błąd ładowania zleceń eksportowych:', error);
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
      window.addEventListener('refreshZleceniaExport', handleRefresh);

      return () => {
        window.removeEventListener('refreshZleceniaExport', handleRefresh);
      };
    }
  }, [autoRefresh]);

  return { zlecenia, fetchData, loading };
}
