import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

let kontrahenciCache = null;
let subscribers = [];

export function useKontrahenci() {
  const [kontrahenci, setKontrahenci] = useState(kontrahenciCache || []);

  useEffect(() => {
    if (!kontrahenciCache) {
      fetchKontrahenci().then((data) => {
        kontrahenciCache = data;
        setKontrahenci(data);
        notifySubscribers();
      });
    } else {
      setKontrahenci(kontrahenciCache);
    }

    const subscriber = (data) => setKontrahenci(data);
    subscribers.push(subscriber);
    return () => {
      subscribers = subscribers.filter((s) => s !== subscriber);
    };
  }, []);

  return kontrahenci;
}

async function fetchKontrahenci() {
  const { data, error } = await supabase.from('kontrahenci').select('*');
  if (error) {
    console.error('Błąd ładowania kontrahentów:', error);
    return [];
  }
  return data;
}

function notifySubscribers() {
  for (const sub of subscribers) {
    sub(kontrahenciCache);
  }
}

export async function refreshKontrahenci() {
  const data = await fetchKontrahenci();
  kontrahenciCache = data;
  notifySubscribers();
}
