$(document).on( "pagecontainershow", function( event, ui ) {
	pageid=ui.toPage[0].id;
	console.log(ui);
	allowedpages=['page_signin'];
	if (!localStorage.signedin) {
		if (!allowedpages.includes(pageid)) {
			console.log("Not on allowed page presignin");
			$.mobile.navigate('signin.html');
			localStorage.sightings=JSON.stringify([]);
			return false;
		};
	} else {
		$('.operator_name').html("Operator:"+JSON.parse(localStorage.operator)['id']);
		if (pageid=="page_index") {
			console.log("Signed in, Redirecting to app page");
			$.mobile.navigate('app.html');
			return false;
		};
		if (pageid=="page_newsighting") {
			getlocation();
		};
	};

});



var launchkey_interval;
var launchkey_checking=false;

function signin() {
	email=$('#signin_email').val();
	launchkey=$('#signin_launchkey').val();
	password=$('#signin_password').val();

	launchkey_checking=false;
	
	$.mobile.loading( "show", {
	  text: "Signing in",
	  textVisible: true,
	  theme: "a"
	});

	$.post( "https://project792.okonetwork.org.uk/api/gatekeeper/signin", { email: email, launchkey: launchkey, password: password }).done(function( data ) {
		console.log(data);
		if (data.status) {
			$.mobile.loading( "show", {
			  text: "Signing in. Waiting for Launchkey verification. Sign in code:"+data.contextcode,
			  textVisible: true,
			  theme: "a"
			});
			launchkey_interval=setInterval(function(){
				if (!launchkey_checking) {
					console.log("Checking launchkey");
					launchkey_checking=true;
					$.get( "https://project792.okonetwork.org.uk/api/gatekeeper/signin/launchkey/validate").done(function( data ) {
						console.log(data);
						if (data.status) {
							if (data.complete) {
								console.log("Sign in complete");
								clearInterval(launchkey_interval);
								localStorage.signedin=true;
								localStorage.operator=JSON.stringify(data.operator);
								localStorage.jwt=data.jwt;
								$.mobile.navigate('index.html');
							} else {
								launchkey_checking=false;
								console.log("Sign in still in progress");
							};
						} else {
							clearInterval(launchkey_interval);
							$.mobile.loading("hide");
							alert("Either launchkey was denied, an invalid launchkey user was provided or you need to setup your Gatekeeper account on the dashboard first.");
						};
					}).error(function(error) {
						clearInterval(launchkey_interval);
						$.mobile.loading("hide");
						alert("Error communicating with server. Please check network connection.");
					});
				} else {
					console.log("Pausing launchkey check");
				};
			}, 1000);
		} else {
			$.mobile.loading("hide");
			alert("Error signing in. Check credentials, you need to use your Gatekeeper operator credentials.");
		};
	}).error(function(error) {
		console.log(error);
		$.mobile.loading("hide");
		alert("Error communicating with server. Please check network connection.");
	});

};

function signout() {
	console.log("Signing out");
	localStorage.clear();
	$.mobile.navigate('index.html');
};














//photo stuff
function takephoto(sightingtype,source) {
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
	console.log(imageURI);
	$('#newsighting_photourl').val(imageURI);
};








//geolocation stuff

var geoloconSuccess = function(position) {
	console.log(position);
	$('.input-latitude').val(position.coords.latitude);
	$('.input-longitude').val(position.coords.longitude);
	$('.input-accuracy').val(position.coords.accuracy);
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




function newsighting_submit() {
	sighting={};

	sighting.lat=$('#newsighting_lat').val();
	sighting.lon=$('#newsighting_lon').val();
	sighting.accuracy=$('#newsighting_accuracy').val();
	sighting.reg=$('#newsighting_reg').val();
	sighting.notes=$('#newsighting_notes').val();
	sighting.photourl=$('#newsighting_photourl').val();
	sighting.timestamp=Math.floor(Date.now()/1000);

	console.log(sighting);
	sightings=JSON.parse(localStorage.sightings);
	sightings.push(sighting);
	localStorage.sightings=JSON.stringify(sightings);
	$.mobile.navigate('index.html');
	alert("Sighting saved locally. Perform sync to save to server.");
};














function file_fail(e) {
    console.log("FileSystem Error");
    console.dir(e);
	alert("error");
}

var imagedata;
var sighting;

function gotFile(fileEntry) {

    fileEntry.file(function(file) {
        var reader = new FileReader();
	        reader.onloadend = function(e) {
		imagedata=this.result;
		syncsend();
        }
	reader.readAsDataURL(file);
    });

}


function loadimage(imageurl) {
	window.resolveLocalFileSystemURL(imageurl, gotFile, file_fail);
};



function sync() {
	imagedata="";
	console.log("Syncing");
	$.mobile.loading( "show", {
	  text: "Syncing sightings",
	  textVisible: true,
	  theme: "a"
	});
	
	if (JSON.parse(localStorage.sightings).length == 0) {
		console.log("Nothing to sync");
		synccomplete();
	} else {
		sighting=JSON.parse(localStorage.sightings)[0];
		console.log(sighting);	
		if (sighting.photourl) {
			loadimage(sighting.photourl);
		} else {
			console.log("Posting now");
			syncsend();
		};
	};
};


function syncsend() {
	console.log("Sending sighting");


	$.post( "https://project792.okonetwork.org.uk/api/poinfo/sightingsubmit", { jwt: localStorage.jwt, sighting: JSON.stringify(JSON.parse(localStorage.sightings)[0]), imagedata: imagedata }).done(function(data) {
		try {
			data=JSON.parse(data);
		} finally {
			console.log("Checking data result");
		};

		console.log(data);
		if (!data.result) {
			console.log(data);
			$.mobile.loading("hide");
			alert("Error communicating with server. Received unexpected response. Please check network connection.");		
		} else {
			sightings=JSON.parse(localStorage.sightings);
			sightings.splice(0, 1);
			localStorage.sightings=JSON.stringify(sightings);
			sync();
		};
	}).error(function(error) {
		console.log(error);
		$.mobile.loading("hide");
		alert("Error communicating with server. Please check network connection.");
	});
};

function synccomplete() {
	$.mobile.loading("hide");
	alert("Sync complete");
};
