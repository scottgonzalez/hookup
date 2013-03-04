# hookup

Easily configure GitHub web hooks.

## About

GitHub doesn't provide a UI for configuring which events a web hook listens to.
Hookup provides a simple way to manage the events for web hooks.

## Command line tool

### Installation

```sh
npm install -g hookup
```

### Usage

```sh
hookup -l username -p password -r user/repo -u http://example.com/hook -e push,status
```

## Node module

### Installation

```sh
npm install hookup
```

### Usage

```js
var hookup = require( "hookup" );
var client = hookup.createClient({
	username: username,
	password: password
});
client.addWebHook({
	repo: "user/repo",
	events: [ "push", "status" ]
});
```

The node module contains lower-level methods for interacting with hooks and the
GitHub API in general.

## License

Copyright 2013 Scott González. Released under the terms of the MIT license.
