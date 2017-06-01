//photo stuff

function takephoto(source) {
	// Retrieve image file location from specified source
	navigator.camera.getPicture(onPhotoURISuccess, photoonFail, { quality: 100, 
		destinationType: Camera.DestinationType.FILE_URI,
		sourceType: source
	});
};

function photoonFail(message) {
	console.log(message);
	alert('Failed because: ' + message);
};

function onPhotoURISuccess(imageURI) {
	alert("success");

	// Uncomment to view the image file URI 
	console.log(imageURI);

	// Get image handle
	//
	var largeImage = document.getElementById('largeimage');

      
	// Unhide image elements
	//
	largeImage.style.display = 'block';
	
	// Show the captured photo
	// The inline CSS rules are used to resize the image
	//
	largeImage.src = imageURI;
};








//geolocation stuff

var geoloconSuccess = function(position) {
	console.log(position.coords);
    alert('Latitude: '          + position.coords.latitude          + '\n' +
          'Longitude: '         + position.coords.longitude         + '\n' +
          'Accuracy: '          + position.coords.accuracy          + '\n' +
          'Timestamp: '         + new Date(position.timestamp)      + '\n');
};

// geoloconError Callback receives a PositionError object
//
function geoloconError(error) {
	console.log(error);
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
};

function getlocation() {
	navigator.geolocation.getCurrentPosition(geoloconSuccess, geoloconError);
};
