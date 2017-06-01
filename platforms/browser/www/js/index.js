$(document).on( "pagecontainershow", function( event, ui ) {
	pageid=ui.toPage[0].id;
	allowedpages=['page_signin'];
	if (!localStorage.signedin) {
		if (!allowedpages.includes(pageid)) {
			console.log("Not on allowed page presignin");
			$.mobile.navigate('signin.html');
			return false;
		};
	} else {
		$('.operator_name').html("Operator:"+JSON.parse(localStorage.operator)['id']);
		if (pageid="page_index") {
			console.log("Signed in, Redirecting to app page");
			$.mobile.navigate('app.html');
			return false;
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
