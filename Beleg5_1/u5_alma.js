"use strict"
//Variablen
let cities = null;

// Karte erstellen
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, Tiles style by <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> '
});

var WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: '© Esri'
});

var overlayMaps = {}

var map = L.map('my_map', {
    center: [51.05, 13.75],
    zoom: 4,
    layers: [osm]
});
var baseMaps = {
    "OpenStreetMap": osm,
    "OpenStreetMap.HOT": osmHOT,
    "Esri.WorldImagery": WorldImagery
};

var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

function file2text() {
    let file = document.getElementById("json").files[0]; //File aufrufen
    let ftype = type(file); //Typ von der Datei mit der Funktion ermitteln

    if (ftype == "json" || ftype == "geojson") {
        let testFehlermeldung = document.getElementById('jsonErr')         // Check ob aktuell die Fehlermeldung angezeigt wird:
        if (testFehlermeldung.classList.contains != "d-none") { //Falls jsonErr nicht die Klasse d-none enthält wird sie hinzugefügt, damit der Fehler nicht mehr angezeigt wird
            document.getElementById("jsonErr").classList.add('d-none')
        }
        if (overlayMaps != {}) { //Alle Marker entfernen
            map.removeControl(layerControl) // Alte Layer entfernen
            overlayMaps = {};
            layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
        }

        console.log('Der Dateityp ist ' + ftype + '. Und somit kann die Datei verwendet werden werden.')
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function () {
            cities = JSON.parse(reader.result);
            console.log("Stadt-Liste: " + cities)
        };

        reader.onerror = function () {
            console.error(reader.error); // Wenn es nicht funktioniert, gibt es eine Fehlermeldung
        };
    } else {
        console.log("Die Datei ist entspricht nicht dem richtigen Format.");
        document.getElementById("jsonErr").classList.remove('d-none')
    }
}

document.getElementById("json").addEventListener("change", file2text); //somit haben wir die ausgelesene Datei der Variable cities zugeordnet

//Verarbeitung der hochgeladenen Daten und Werte:
document.getElementById('inputForm').addEventListener('submit', async function (e) { //Wird beim klick auf submit aktibiert
    e.preventDefault();

    //API-key
    const apiKey = '934842e4e91b6a8fd12dc24981d40b92'; // mein eigener API-Key

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

    //Temperatur
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
            console.log(text)
            return { "temp": temperature, "weather": description }
        } catch (error) {
            console.error('Error fetching data:', error)
        }
    }
    //fetchTemperatureInformation("Moskau")

    var markers = [];

    // Marker mit Wetter, müssen in ne Asynchrone Funktion eingebunden werden
    async function addMarkerWithWeather() {
        //Eingegebene Stadt
        var marker = L.marker([0, 0]); //Default
        markers.push(marker);
        // Marker für alle Städte hinzufügen
        for (let i = 0; i < cities.features.length; i++) {
            var marker = L.marker([cities.features[i].geometry.coordinates[1], cities.features[i].geometry.coordinates[0]]);
            var iName = cities.features[i].properties.cityname;
            var iLand = cities.features[i].properties.country;
            var iEinw = cities.features[i].properties.population;
            var iWeb = cities.features[i].properties.picture;
            var iWT = await fetchTemperatureInformation(iName);
            if (iWeb !== undefined && iWeb !== "") {
                marker.bindPopup(`<h4>${iName}</h4><p>Land: ${iLand}<br>Einwohnerzahl: ${iEinw}<br>Temperatur: ${iWT.temp}°C<br>Wetter: ${iWT.weather}</p><a href="${iWeb}" target="_blank"><img src="${iWeb}" alt="Popup Image" style="width:150px;height:auto;"></a>`);
            } else {
                marker.bindPopup(`<h4>${iName}</h4><p>Land: ${iLand}<br>Einwohnerzahl: ${iEinw}<br>Temperatur: ${iWT.temp}°C<br>Wetter: ${iWT.weather}</p>`);
            }
            markers.push(marker);
        }
    }

    await addMarkerWithWeather();
    map.removeControl(layerControl) // Alte Layer entfernen

    // Layer mit den Markern
    var markerLayer = L.layerGroup(markers); //overlay
    overlayMaps = {
        "Städte": markerLayer
    };
    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

})
