"use strict"
const apiKey = '934842e4e91b6a8fd12dc24981d40b92'; // mein eigener API-Key
let dbCities = {}; // Initialisierung von dbCities
let tempSorted = []; // Deklaration außerhalb der Funktion
let nameSorted = []; // Deklaration außerhalb der Funktion

//Temperatur
async function geoCode(city_name) {
    const apiUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${city_name}&limit=5&appid=${apiKey}`;
    try {
        const response = await fetch(apiUrl)
        const data = await response.json()
        const lat = data[0].lat
        const lon = data[0].lon
        const name = data[0].name
        //console.log(`Ort: ${name}, Breitengrad: ${lat}; Längengrad: ${lon}`)
        return { "place": name, "latitude": lat, "longitude": lon }
    } catch (error) {
        console.error('Error fetching data:', error)
    }
}

async function fetchTemperatureInformation(city_name) {
    let city_coordinates = await geoCode(city_name)
    let lat = city_coordinates.latitude
    let lon = city_coordinates.longitude
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=de`
    try {
        const response = await fetch(apiUrl)
        const data = await response.json()
        const temperature = data.main.temp
        const description = data.weather[0].description
        const location = data.name
        const text = `Temperatur in ${location}: ${temperature}°C; Wetter: ${description}`
        //console.log(text)
        return { "temp": temperature, "weather": description }
    } catch (error) {
        console.error('Error fetching data:', error)
    }
}

fetchTemperatureInformation("Moskau") //Beispiel

//Daten aus Mongo
async function db_cities() {
    const dataUrl = "http://localhost:5000/data"
    try {
        const response = await fetch(dataUrl)
        dbCities = await response.json()
        console.log("Die Städte aus der Datenbank: \n", dbCities)
    } catch (error) {
        console.error('Error fetching data:', error)
    }
}

//Temperatur bekommen und Sortieren
async function cityTempSorted() {
    console.log("cityTempSorted started")
    await db_cities()
    const num_elem = dbCities.features.length
    var temp = []                       //Default Werte
    var wTemp = []                       //Default Werte
    for (let i = 0; i < num_elem; i++) {
        wTemp[i] = await fetchTemperatureInformation(dbCities.features[i].properties.cityname)
        temp[i] = wTemp[i].temp //damit nur die Temperaturinformationen überliefert werden
        }
    var indexTemp = [...temp.keys()] //Dist wird von klein nach groß sortiert, dabei merke ich mir hier die neue Reihnfolge der alten Indizes
    indexTemp.sort((a, b) => temp[a] - temp[b]);
    tempSorted = temp.sort((a, b) => a - b) //Neue Variable mit der sortierten Distanz
    console.log("Temperatur sortiert: ", tempSorted)
    for (let i = 0; i < num_elem; i++) {
        nameSorted[i] = dbCities.features[indexTemp[i]].properties.cityname //Die Stadtnamen werden passend zu der nun sortierten Distanz zugeordnet
    }
    console.log("Städte, nach Temperatur sortiert: ", nameSorted)
}

async function makeChart() {
    await cityTempSorted()
    console.log("Namen, außerhalb der asynchronen Funktion: "+nameSorted)
    const cTemp = tempSorted//[20, 30, 15]
    const cName = nameSorted//["A", "B", "C"]
    
    // Diagramm
    document.getElementById("chart").textContent = (""); //Der Text aus der HTML-Datei wird überschriebe
    
    let my_data = {
        labels: cName, //Wert der dargestellt werden soll
        datasets: [{
            label: ('Die Temperaturen sortiert von niedrig zu hoch [°C]'),
            data: cTemp, //Wert der dargestellt werden soll
            borderWidth: 1
        }]
    }
    
    // clear the canvas:
    let chartStatus = Chart.getChart("myChart"); // canvas-id
    if (chartStatus != undefined) {
        chartStatus.destroy();
    }
    
    // specify config information
    const config = {
        type: 'bar',
        data: my_data, // enthält Werte und Label
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    }
    
    var my_chart = new Chart(document.getElementById('myChart'), config) // Ein neues Balkendiagram wird erzeugt  
}

makeChart()
