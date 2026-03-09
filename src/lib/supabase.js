import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://iojoritxhpijprgkjfre.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvam9yaXR4aHBpanByZ2tqZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUxMDg0NzMsImV4cCI6MjA0MDY4NDQ3M30.6ZRhreN9fEwLN8vRBcd1uDgkyy_Cjm6U5wxeBNoYyKM'

export const supabase = createClient(SUPABASE_URL, ANON_KEY)
