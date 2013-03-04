#!/usr/bin/env node

var hookup = require( "../lib/hookup.js" );
var optimist = require( "optimist" );

var argv = optimist
	.usage( "Easily configure GitHub web hooks." )
	.options( "l", {
		alias: "login",
		demand: true,
		describe: "GitHub username"
	})
	.options( "p", {
		alias: "password",
		demand: true,
		describe: "GitHub password"
	})
	.options( "r", {
		alias: "repo",
		demand: true,
		describe: "GitHub repository (user/repo)"
	})
	.options( "u", {
		alias: "url",
		demand: true,
		describe: "WebHook URL"
	})
	.options( "e", {
		alias: "events",
		demand: true,
		describe: "List of events, comma or space delimited"
	})
	.argv;

hookup.createClient({
	username: argv.l,
	password: argv.p
}).addWebHook({
	repo: argv.r,
	url: argv.u,
	events: argv.e.split( /[\s,]/g )
}, function( error, hook ) {
	if ( error ) {
		console.log( "Failed to configure hook: " + error.message );
		return;
	}

	console.log( "Configured hook " + hook.id );
	console.log( "  URL: " + hook.config.url );
	console.log( "  Events: " + hook.events );
});
