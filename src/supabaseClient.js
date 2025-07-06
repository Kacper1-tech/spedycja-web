import { createClient } from '@supabase/supabase-js';

// ⛔️ ZAMIEŃ TE DANE NA SWOJE Z SUPABASE
const supabaseUrl = 'https://gbgzpvdipqypovugvpgz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZ3pwdmRpcHF5cG92dWd2cGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODE5NzMsImV4cCI6MjA2NjI1Nzk3M30.VwqDM3URtguQjKcQfgX6LR_mfKamfsrz98VbQqnnGy0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
