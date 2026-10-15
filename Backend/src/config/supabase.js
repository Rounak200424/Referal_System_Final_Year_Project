const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not configured.");
}

if (!supabaseSecretKey) {
  throw new Error("SUPABASE_SECRET_KEY is not configured.");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);
const bucketName = process.env.SUPABASE_BUCKET;

module.exports = {
  supabase,
  bucketName,
};
