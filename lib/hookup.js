var https = require( "https" ),
	url = require( "url" ),
	github = require( "github-request" );
	userAgent = getUA();

function delay( callback ) {
	var args = [].slice.call( arguments, 1 );
	process.nextTick(function() {
		callback.apply( null, args );
	});
}

function extend( a, b ) {
	for ( var p in b ) {
		a[ p ] = b[ p ];
	}

	return a;
}

function getUA() {
	var os = require( "os" ),
		version = require( "../package.json" ).version;
	return os.platform() + "/" + os.release() + " " +
		"node/" + process.versions.node + " " +
		"hookup/" + version;
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

Client.events = {
	push: "Any git push to a Repository.",
	issues: "Any time an Issue is opened or closed.",
	issue_comment: "Any time an Issue is commented on.",
	commit_comment: "Any time a Commit is commented on.",
	create: "Any time a Repository, Branch, or Tag is created.",
	"delete": "Any time a Branch or Tag is deleted.",
	pull_request: "Any time a Pull Request is opened, closed, or synchronized (updated due to a new push in the branch that the pull request is tracking).",
	pull_request_review_comment: "Any time a Commit is commented on while inside a Pull Request review (the Files Changed tab).",
	gollum: "Any time a Wiki page is updated.",
	watch: "Any time a User watches the Repository.",
	release: "Any time a Release is published in the Repository.",
	fork: "Any time a Repository is forked.",
	fork_apply: "Any time a patch is applied to the Repository from the Fork Queue.",
	member: "Any time a User is added as a collaborator to a non-Organization Repository.",
	"public": "Any time a Repository changes from private to public.",
	team_add: "Any time a team is added or modified on a Repository.",
	status: "Any time a Repository has a status update from the API."
};

Client.prototype.request = function( settings, data, callback ) {
	if ( typeof data === "function" ) {
		callback = data;
		data = null;
	}

	settings = extend({
		headers: {
			authorization: this.authHeader,
			"user-agent": userAgent
		}
	}, settings );

	github.request( settings, data, function( error, first, meta ) {
		if ( error ) {
			return callback( error );
		}

		if ( !meta.links || !meta.links.next ) {
			return callback( null, first );
		}

		settings.path = url.parse( meta.links.next ).path;
		this.request( settings, data, function( error, next ) {
			if ( error ) {
				return callback( error );
			}

			callback( null, first.concat( next ) );
		});
	}.bind( this ));
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
		return delay( callback, new Error( "Repository is required." ) );
	}
	if ( !settings.id ) {
		return delay( callback, new Error( "Hook ID is required." ) );
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
		return delay( callback, new Error( "Repository is required." ) );
	}
	if ( !settings.config ) {
		return delay( callback, new Error( "Configuration is required." ) );
	}

	this.request({
		path: "/repos/" + settings.repo + "/hooks",
		method: "POST"
	}, settings, callback );
};



// Provide a simple abstraction for working with hooks by URL

Client.prototype.getHookByUrl = function( settings, callback ) {
	if ( !settings.repo ) {
		return delay( callback, new Error( "Repository is required." ) );
	}
	if ( !settings.url ) {
		return delay( callback, new Error( "URL is required." ) );
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
		return delay( callback, new Error( "Repository is required." ) );
	}
	if ( !settings.events ) {
		return delay( callback, new Error( "Events list is required." ) );
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
