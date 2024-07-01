const express = require('express')
const path = require('path')
const app = express()
const port = 5000

const { MongoClient } = require('mongodb')
const url = 'mongodb://localhost:27017' // connection URL
const client = new MongoClient(url) // mongodb client
const dbName = 'mydb' // database name
const collectionName = 'test' // collection name

const turf = require("@turf/helpers")

var impressum_route = require('./router/impressum')
app.use('/impressum', impressum_route)

app.use(express.static(path.join(__dirname, '/public')))

app.get('/', (req, res) => {
  res.set('Content-Type', 'text/html');
  html_home_file = path.join(__dirname, '/public', 'home.html')
  console.log(html_home_file)
  res.sendFile(html_home_file)
})

// https://www.geeksforgeeks.org/how-to-access-post-form-fields-in-express-js/
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// handling post requests, https://www.scaler.com/topics/expressjs-tutorial/handling-form-submission/
app.post('/', (req, res) => {
    console.log('receiving data ...')
    const data = JSON.parse(req.body.input_data)
    save_data_to_db(data)
    //html_home_file = path.join(__dirname, '/public', 'home.html') //Option um das Fenster weiter anzuzeigen
    //res.sendFile(html_home_file)
    console.log('Die Daten wurden zur Datenbank hinzugefügt.')
    res.send('<p>Die Daten wurden erfolgreich hochgeladen.<br>Lade die Seite neu um noch weitere Daten hinzuzufügen.</p>')
})

async function save_data_to_db(data)
{
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

async function get_data_from_db()
{
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
        //console.log(results)

    }

    return results
}


app.listen(port, () => 
{
  console.log(`Example app listening on port ${port}`)
})