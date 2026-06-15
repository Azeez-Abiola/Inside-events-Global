function getSupabaseUrl() {
  return process.env.SUPABASE_URL || "https://behwdpsrczmqsyaysidv.supabase.co";
}
function getSupabaseAnonKey() {
  return process.env.SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlaHdkcHNyY3ptcXN5YXlzaWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjA5NzEsImV4cCI6MjA5NjkzNjk3MX0.B70g-3zCf2eUn0a__3MLyiR6f9c3SaZyEPgsrcVGlms";
}
function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}
export {
  getSupabaseServiceRoleKey as a,
  getSupabaseUrl as b,
  getSupabaseAnonKey as g
};
