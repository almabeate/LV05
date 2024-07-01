var express = require('express');
var router = express.Router();
const path = require('path')


// define the map page route
router.get('/', function(req, res) 
{

  html_map_file = "impressum.html" 
  res.sendFile(html_map_file, {root: "./public"})

})

module.exports = router;