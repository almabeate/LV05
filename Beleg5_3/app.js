var createError = require('http-errors');
var path = require('path');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const fileUpload = require('express-fileupload');
const app = express()
const turf = require("@turf/helpers")
const port = 5000

//Create the Database
const { MongoClient } = require('mongodb')
const url = 'mongodb://localhost:27017' // connection URL
const client = new MongoClient(url) // mongodb client
const dbName = 'mydb' // database name
const collectionName = 'alma5_3' // collection name

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(fileUpload());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Router erstellen
var impRoute = require('./routes/impressum')
app.use('/impressum', impRoute)
var chartRoute = require('./routes/chart')
app.use('/chart', chartRoute)
var mapRoute = require('./routes/map')
app.use('/map', mapRoute)

//Home-Verzeichnis
app.get('/', function(req, res) { 
  res.render('home'); // No need for .pug extension
});

app.post('/', (req, res) => {
  console.log('receiving data ...')

  const input = req.files.input_data

  const dataString = input.data.toString()
  const dataJson = JSON.parse(dataString)
  console.log(typeof (dataJson), typeof (dataString))
  save_data_to_db(dataJson)
  console.log("Input: ", dataJson)
  console.log('Die Daten wurden zur Datenbank hinzugefügt.')
  res.send('<h3>Die Daten wurden erfolgreich hochgeladen.</h3><p>Hier klicken um die <a href="/map">Karte</a> zu sehen. Hier um <a href="/">neue Daten</a> hinzuzufügen</p>')
})

async function save_data_to_db(data) {
  console.log("Saving to database...")
  console.log(data)

  await client.connect()
  console.log('Connected successfully to server')

  const db = client.db(dbName)

  const collection = db.collection(collectionName)

  // this option prevents additional documents from being inserted if one fails
  const options = { ordered: true }
  const result = await collection.insertMany(data.features, options)
  console.log(`${result.insertedCount} documents were inserted in the collection`)
}

app.get('/data', async (req, res) => {
  const result = await get_data_from_db()
  const result_as_fc = turf.featureCollection(result);
  res.json(result_as_fc);
})

async function get_data_from_db() {
  await client.connect()
  console.log('Connected successfully to server')

  const db = client.db(dbName)
  const collection = db.collection(collectionName)
  const cursor = collection.find({})
  const results = await cursor.toArray()

  if (results.length == 0) {
    console.log("No documents found!")
  }
  else {
    console.log(`Found ${results.length} documents in the collection...`);
  }
  return results
}

app.listen(port, () => {
  console.log(`Beleg 5.3 listening on port ${port}`)
})

// catch 404 and forward to error handler 
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;