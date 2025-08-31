require('dotenv').config();

const express = require('express');
const {createClient} = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabaseClient = createClient(supabaseUrl, supabaseKey)

const app = express();
const port = process.env.PORT;

app.get('/', (req, res) => {
  res.send("Let's rock!");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});