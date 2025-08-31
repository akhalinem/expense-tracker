require('dotenv').config();

const express = require('express');
const {createClient} = require('@supabase/supabase-js');

const supabaseUrl = '';
const supabaseKey = '';
const supabaseClient = createClient(supabaseUrl, supabaseKey)

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send("Let's rock!");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});