var map;
var markerLayer = L.layerGroup();
var waypoints = [];
var userLocationMarker; // Holds the user's location marker

document.addEventListener('DOMContentLoaded', function() {
	
    map = L.map('map', {
        minZoom: 2,
        maxZoom: 18
    }).setView([52.22977, 21.01178], 7);

		// Define both base layers
	const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	  attribution: '&copy; OpenStreetMap contributors'
	});

	const esriImageryLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar, and others',
	  maxZoom: 18
	});

	// Add one by default
	esriImageryLayer.addTo(map);

	// Add base layers to control
	const baseLayers = {
	  "Satellite": esriImageryLayer,
	  "OpenStreetMap": osmLayer
	};

	L.control.layers(baseLayers).addTo(map);

    markerLayer.addTo(map);

    //map.locate({setView: true, maxZoom: 18, watch: true}); // Continuously watch for changes in position

    map.on('click', function(e) {
        updateCoordinates(e.latlng);
        addClickLocationMarker(e.latlng); // Add marker on map where user clicks
    });
    map.on('locationfound', function(e) {
        updateCoordinates(e.latlng, e.accuracy);
        updateUserLocationMarker(e.latlng);
    });

    map.addControl(new customControl());
});

function convertToEGSA87(lat, lng) {
    const [x, y] = proj4("EPSG:4326", "EPSG:2100", [lng, lat]); // Note: [lng, lat] order
    document.getElementById('egsa_x').value = x.toFixed(2);
    document.getElementById('egsa_y').value = y.toFixed(2);
}

function updateCoordinates(latlng, accuracy = null) {
    document.getElementById('latitude').value = latlng.lat.toFixed(5);
    document.getElementById('longitude').value = latlng.lng.toFixed(5);
    if (accuracy !== null) {
        document.getElementById('accuracy').value = accuracy.toFixed(2);
    }
    fetchElevation(latlng.lat, latlng.lng);
	
}


function fetchElevation(lat, lng) {
    fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`)
        .then(response => response.json())
        .then(data => {
            const elevation = data.results[0].elevation;
            document.getElementById('elevation').value = elevation.toFixed(2);
        })
        .catch(error => {
            console.error('Error fetching elevation:', error);
        });
}
function convertToEGSA87(lat, lng) {
    const [x, y] = proj4("EPSG:4326", "EPSG:2100", [lng, lat]); // Note: [lng, lat] order
    document.getElementById('egsa_x').value = x.toFixed(2);
    document.getElementById('egsa_y').value = y.toFixed(2);
}
function updateUserLocationMarker(latlng) {
    if (userLocationMarker) {
        map.removeLayer(userLocationMarker); // Remove the previous marker if it exists
    }
    userLocationMarker = L.circle(latlng, {
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.5,
        radius: 2
    }).addTo(map);
}

function addClickLocationMarker(latlng) {
    var marker = L.marker([latlng.lat, latlng.lng]).addTo(markerLayer);
    marker.bindPopup("Coordinates: " + latlng.lat.toFixed(5) + ", " + latlng.lng.toFixed(5)).openPopup();
}

function addWaypoint() {
    var lat = document.getElementById('latitude').value;
    var lng = document.getElementById('longitude').value;
    var elevation = document.getElementById('elevation').value;
	var description = document.getElementById('description').value;

    if (!lat || !lng || !description) {
        alert('Please ensure all fields are filled and a location is selected on the map.');
        return;
    }

    var marker = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(markerLayer);
    marker.bindPopup(description).openPopup();
    waypoints.push({ latitude: lat, longitude: lng, elevation:elevation, description: description });
    document.getElementById('description').value = ''; // Clear the textarea after submitting
}

function downloadWaypoints() {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(waypoints));
    var dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "waypoints.json");
    dlAnchorElem.click();
}

function uploadWaypoints() {
    var fileInput = document.getElementById('uploadJson');
    var file = fileInput.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function (event) {
            try {
                var uploadedWaypoints = JSON.parse(event.target.result);
                uploadedWaypoints.forEach(function(wp) {
                    addWaypointFromData(wp.latitude, wp.longitude, wp.elevation, wp.description);
                });
            } catch (e) {
                alert('Error parsing JSON!');
            }
        };
        reader.readAsText(file);
    } else {
        alert('Please select a file to upload.');
    }
}

function addWaypointFromData(lat, lng, description) {
    var marker = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(markerLayer);
    marker.bindPopup(description).openPopup();
    waypoints.push({ latitude: lat, longitude: lng, elevation: elevation, description: description });
}

function getCurrentPosition() {
    map.locate({setView: true, maxZoom: 18});
}


// Sidebar functionality

const menuItems = document.querySelectorAll(".menu-item");
const sidebar = document.querySelector(".sidebar");
const buttonClose = document.querySelector(".close-button");

menuItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    const target = e.target;

    if (
      target.classList.contains("active-item") ||
      !document.querySelector(".active-sidebar")
    ) {
      document.body.classList.toggle("active-sidebar");
    }

    // show content
    showContent(target.dataset.item);
    // add active class to menu item
    addRemoveActiveItem(target, "active-item");
  });
});

// close sidebar when click on close button
buttonClose.addEventListener("click", () => {
  closeSidebar();
});

// remove active class from menu item and content
function addRemoveActiveItem(target, className) {
  const element = document.querySelector(`.${className}`);
  target.classList.add(className);
  if (!element) return;
  element.classList.remove(className);
}

// show specific content
function showContent(dataContent) {
  const idItem = document.querySelector(`#${dataContent}`);
  addRemoveActiveItem(idItem, "active-content");
}

// close when click esc
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeSidebar();
  }
});

// close sidebar when click outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".sidebar")) {
    closeSidebar();
  }
});

// close sidebar
function closeSidebar() {
  document.body.classList.remove("active-sidebar");
  const element = document.querySelector(".active-item");
  const activeContent = document.querySelector(".active-content");
  if (!element) return;
  element.classList.remove("active-item");
  activeContent.classList.remove("active-content");
}

// Custom Locate Button functionality

const customControl = L.Control.extend({
  options: {
    position: "topleft",
    className: "locate-button leaflet-bar",
    html: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>',
    style:
      "margin-top: 0; left: 0; display: flex; cursor: pointer; justify-content: center; font-size: 2rem;",
  },
  onAdd: function (map) {
    this._map = map;
    const button = L.DomUtil.create("div");
    L.DomEvent.disableClickPropagation(button);

    button.title = "locate";
    button.innerHTML = this.options.html;
    button.className = this.options.className;
    button.setAttribute("style", this.options.style);

    L.DomEvent.on(button, "click", this._clicked, this);

    return button;
  },
  _clicked: function (e) {
    L.DomEvent.stopPropagation(e);
    this._checkLocate();
    return;
  },
  _checkLocate: function () {
    return this._locateMap();
  },
  _locateMap: function () {
    const locateActive = document.querySelector(".locate-button");
    const locate = locateActive.classList.contains("locate-active");
    locateActive.classList[locate ? "remove" : "add"]("locate-active");

    if (locate) {
      this.removeLocate();
      this._map.stopLocate();
      return;
    }

    this._map.on("locationfound", this.onLocationFound, this);
    this._map.on("locationerror", this.onLocationError, this);

    this._map.locate({ setView: true, enableHighAccuracy: true });
  },
  onLocationFound: function (e) {
    this.addCircle(e).addTo(this.featureGroup()).addTo(map);
    this.addMarker(e).addTo(this.featureGroup()).addTo(map);
  },
  onLocationError: function (e) {
    this.addLegend("Location access denied.");
  },
  featureGroup: function () {
    return new L.FeatureGroup();
  },
  addLegend: function (text) {
    const checkIfDescriotnExist = document.querySelector(".description");

    if (checkIfDescriotnExist) {
      checkIfDescriotnExist.textContent = text;
      return;
    }

    const legend = L.control({ position: "bottomleft" });

    legend.onAdd = function () {
      let div = L.DomUtil.create("div", "description");
      L.DomEvent.disableClickPropagation(div);
      const textInfo = text;
      div.insertAdjacentHTML("beforeend", textInfo);
      return div;
    };
    legend.addTo(this._map);
  },
  addCircle: function ({ accuracy, latitude, longitude }) {
    return L.circle([latitude, longitude], accuracy / 2, {
      className: "circle-test",
      weight: 2,
      stroke: false,
      fillColor: "#136aec",
      fillOpacity: 0.15,
    });
  },
  addMarker: function ({ latitude, longitude }) {
    return L.marker([latitude, longitude], {
      icon: L.divIcon({
        className: "located-animation",
        iconSize: L.point(17, 17),
        popupAnchor: [0, -15],
      }),
    }).bindPopup("You are here :)");
  },
  removeLocate: function () {
    this._map.eachLayer(function (layer) {
      if (layer instanceof L.Marker) {
        const { icon } = layer.options;
        if (icon?.options.className === "located-animation") {
          map.removeLayer(layer);
        }
      }
      if (layer instanceof L.Circle) {
        if (layer.options.className === "circle-test") {
          map.removeLayer(layer);
        }
      }
    });
  },
});

map.addControl(new customControl());
