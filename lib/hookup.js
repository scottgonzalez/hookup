var https = require( "https" );

function extend( a, b ) {
	for ( var p in b ) {
		a[ p ] = b[ p ];
	}

	return a;
}

function Client( settings ) {
	if ( !settings.username ) {
		throw new Error( "Username is required." );
	}
	if ( !settings.password ) {
		throw new Error( "Password is required." );
	}

	extend( this, settings );
	this.authHeader = "Basic " +
		new Buffer( this.username + ":" + this.password ).toString( "base64" );
}

Client.hookFields = [
	"name",
	"config",
	"events",
	"add_events",
	"remove_events",
	"active"
];

Client.prototype.request = function( settings, data, callback ) {
	if ( typeof data === "function" ) {
		callback = data;
		data = null;
	} else {
		data = JSON.stringify( data );
	}
	callback = callback || function() {};

	var req = https.request( extend({
		host: "api.github.com",
		port: 443,
		method: "GET",
		headers: {
			authorization: this.authHeader,
			"content-length": typeof data === "string" ? data.length : 0
		}
	}, settings ), function( res ) {
		var response = "";
		res.setEncoding( "utf8" );
		res.on( "data", function( chunk ) {
			response += chunk;
		});
		res.on( "end", function() {
			if ( res.statusCode >= 400 ) {
				var message;
				if ( res.headers[ "content-type" ].indexOf( "json" ) !== -1 ) {
					message = JSON.parse( response ).message;
				} else {
					message = response;
				}
				if ( !message && res.statusCode === 403 ) {
					message = "Forbidden";
				}
				callback( new Error( message ) );
			} else {
				callback( null, JSON.parse( response ) );
			}
		});
	});

	if ( data ) {
		req.write( data );
	}

	req.end();
};

// Provide a utility for getting all repos for an account so users can
// easily add a hook to all of their repos
Client.prototype.getRepos = function( user, callback ) {
	this.request({
		path: "/users/" + user + "/repos"
	}, callback );
};

Client.prototype.getHooks = function( repo, callback ) {
	this.request({
		path: "/repos/" + repo + "/hooks"
	}, callback );
};

Client.prototype.editHook = function( settings, callback ) {
	if ( !settings.repo ) {
		throw new Error( "Repository is required." );
	}
	if ( !settings.id ) {
		throw new Error( "Hook ID is required." );
	}

	var data = {};
	Client.hookFields.forEach(function( field ) {
		if ( settings.hasOwnProperty( field ) ) {
			data[ field ] = settings[ field ];
		}
	});

	this.request({
		path: "/repos/" + settings.repo + "/hooks/" + settings.id,
		method: "PATCH"
	}, data, callback );
};

Client.prototype.createHook = function( settings, callback ) {
	if ( !settings.repo ) {
		throw new Error( "Repository is required." );
	}
	if ( !settings.config ) {
		throw new Error( "Configuration is required." );
	}

	this.request({
		path: "/repos/" + settings.repo + "/hooks",
		method: "POST"
	}, settings, callback );
};



// Provide a simple abstraction for working with hooks by URL

Client.prototype.getHookByUrl = function( settings, callback ) {
	if ( !settings.repo ) {
		throw new Error( "Repository is required." );
	}
	if ( !settings.url ) {
		throw new Error( "URL is required." );
	}

	this.getHooks( settings.repo, function( error, hooks ) {
		if ( error ) {
			return callback( error );
		}

		var hook = hooks.filter(function( hook ) {
			return hook.config.url === settings.url;
		});

		callback( null, hook[ 0 ] );
	});
};

Client.prototype.addWebHook = function( settings, callback ) {
	if ( !settings.repo ) {
		throw new Error( "Repository is required." );
	}
	if ( !settings.events ) {
		throw new Error( "Events list is required." );
	}

	this.getHookByUrl( settings, function( error, hook ) {
		if ( error ) {
			return callback( error );
		}

		if ( hook ) {
			this.editHook({
				repo: settings.repo,
				id: hook.id,
				events: settings.events
			}, callback );
		} else {
			this.createHook({
				repo: settings.repo,
				name: "web",
				config: {
					url: settings.url,
					content_type: "form"
				},
				events: settings.events
			}, callback );
		}
	}.bind( this ) );
};



exports.Client = Client;
exports.createClient = function( settings ) {
	return new Client( settings );
};
