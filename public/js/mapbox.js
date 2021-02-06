const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

var mapboxgl = 'https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.js'
mapboxgl.accessToken = 'pk.eyJ1IjoidmlrYXNoMTk5OCIsImEiOiJja2h0M2czcjUxd2ZlMnVrNjl6cDJ3MGZuIn0.qRzGAI_ASwyiCSScB2Zo2g';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11'
});

