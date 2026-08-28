require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_AZURE_URI;

mongoose.connect(uri, { dbName: 'fielsparcelsdb' }).then(async () => {
  const db = mongoose.connection.db;
  console.log(`Yhdistetty tietokantaan: ${db.databaseName}`);
  const count = await db.collection('cropTypes').countDocuments();
  console.log(`Dokumentteja nyt: ${count}`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});