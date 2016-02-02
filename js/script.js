/*********** MODEL ***********/
var locations = ko.observableArray([
    {title: 'The White House', lat: 38.897676, lng:-77.036483},
    {title: 'Washington Monument', lat: 38.889463, lng:-77.035237, },
    {title: 'Lincoln Memorial', lat: 38.889321, lng:-77.050166},
    {title: 'National WWII Memorial', lat: 38.889413, lng:-77.040553},
    {title: 'Cathedral of St. Matthew the Apostle', lat: 38.916988, lng:-77.036499},
    {title: 'International Spy Museum', lat: 38.8969, lng:-77.0234}
]);


/************ VIEWMODEL **********/
function viewModel(map) {
	var self = this;
	var infowindow = new google.maps.InfoWindow();
	var filteredArray = ko.observableArray();

	// marker constructor. Sets properties for individual locations
	var Location = function (map, markertitle, markerlat, markerlng) {
    
	    this.title = ko.observable(markertitle);
	    this.lat  = ko.observable(markerlat);
	    this.lng  = ko.observable(markerlng);
	    
	    this.marker = new google.maps.Marker({
			position: new google.maps.LatLng(markerlat, markerlng),
			animation: google.maps.Animation.DROP,
			map: map
	    });  
	};

	// adds a click event listener to the map instance
	google.maps.event.addListener(map, 'click', function() {
		infowindow.close();
	});

	// marker creation loop
	for (i = 0 ; i < locations().length; i++) {

	    // creates an instance of a marker for each location
	    locations()[i].pin =  new Location (map, locations()[i].title, locations()[i].lat, locations()[i].lng);

	    // heading for the individual marker
		var heading = locations()[i].pin.title();

		// event listener when clicking on the marker
		google.maps.event.addListener(locations()[i].pin.marker, 'click', (function(pin, infowindow, heading) {

				return function() {
					// Call Wiki link and add it to infowindow
					self.ajaxWiki(heading, infowindow);       
					infowindow.open(map, pin.marker);  

					// Animate marker when clicked
					pin.marker.setAnimation(google.maps.Animation.BOUNCE);
					setTimeout(function() {
						pin.marker.setAnimation(null);
					}, 750);
				};
		})(locations()[i].pin, infowindow, heading));
	}

	self.places = ko.observableArray(locations());
	self.visibleLocations = ko.observableArray();
	self.query = ko.observable('');

	// filtering the search bar
	self.search = ko.computed(function() {

		// clear array of visible locations
		self.visibleLocations.removeAll(); 
		var filter = self.query().toLowerCase();

		// Loop through each item in self.places
		ko.utils.arrayFilter(self.places(), function(place) {

			var searchIndex = place.title.toLowerCase().indexOf(filter);

			// Does the place/ title contain the search term?
			if (searchIndex >= 0) {
				// Show marker
				place.pin.marker.setVisible(true);
				// Add this place to the visibleLocations array
				self.visibleLocations.push(place); 
			} else {
				// hide marker
				place.pin.marker.setVisible(false); 
			}
		});
		// Return visibleLocations, since list items around bound to this search function
		return self.visibleLocations(); 
	});

	// called by KO's click handler in the view section
	self.titleListClick = function(item) {
		markerClicked = item.pin.marker;
		google.maps.event.trigger(markerClicked, 'click');
	}

	// MediaWiki Web API
	self.ajaxWiki = function(heading, infowindow) {

		var markersTitle = heading;
		var wikiPlacesInWashingtonUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=' + markersTitle;

		// error handling
		var wikiRequestTimeout = setTimeout(function() {
			infowindow.setContent('<h3>' + heading + '</h3>' + 'Failed to get wikipedia resources');
		}, 8000);

		$.ajax({
			url: wikiPlacesInWashingtonUrl,
			dataType: 'jsonp',
			success: function(data) {
				console.log(data);

				var titleOfLocation = data.query.search[0].title;
				var url = 'http://en.wikipedia.org/wiki/' + titleOfLocation;

				infowindow.setContent('<h3>' + heading + '</h3>' + '<a href="' + url + '">' + 'Wikipedia link to ' + heading + '</a>');

				clearTimeout(wikiRequestTimeout);
			}
		});
	};
}