import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useZaktualizowaniKontrahenciPozostale({ autoRefresh = true } = {}) {
  const [zlecenia, setZlecenia] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('zlecenia_pozostale')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Błąd ładowania zleceń pozostalych:', error);
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
      window.addEventListener('refreshZleceniaPozostale', handleRefresh);

      return () => {
        window.removeEventListener('refreshZleceniaPozostale', handleRefresh);
      };
    }
  }, [autoRefresh]);

  return { zlecenia, fetchData, loading };
}
