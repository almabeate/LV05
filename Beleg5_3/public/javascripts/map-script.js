"use strict";

// tile layers: https://leaflet-extras.github.io/leaflet-providers/preview/
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
var osmHotUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
var osmTopoUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'

var osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'

var osmLayer = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib }) 
var osmHotLayer  = L.tileLayer(osmHotUrl, { maxZoom: 18, attribution: osmAttrib }) 
var osmTopoLayer  = L.tileLayer(osmTopoUrl, { maxZoom: 18, attribution: osmAttrib })

var googleUrl = 'http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}'
var googleAttrib = 'google'
var googleLayer =  L.tileLayer(googleUrl, {attribution: googleAttrib })

var map = new L.Map('my_map', { center: new L.LatLng(51.05, 13.76), zoom: 3 })
//osmLayer.addTo(map) // add a base map, after the map has been created

var baseMaps = {"OpenStreetMap": osmLayer.addTo(map), "OpenStreetMap.HOT": osmHotLayer, "OpenStreetMap.TOPO": osmTopoLayer, "Google": googleLayer }

var displayMarkers = L.layerGroup().addTo(map) 

var overlayMap = {"Städte": displayMarkers}

var layerControl = L.control.layers(baseMaps, overlayMap).addTo(map)



add_data_to_map()


async function add_data_to_map()
{
    
    const dataUrl = "http://localhost:5000/data"

    try {
        const response = await fetch(dataUrl)
        const data = await response.json()
        console.log("///", data)
        L.geoJSON(data).addTo(displayMarkers);


    } catch (error) {
        console.error('Error fetching data:', error)
    }
}

/**/