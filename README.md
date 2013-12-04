# hookup

Easily configure GitHub web hooks.

Support this project by [donating on Gittip](https://www.gittip.com/scottgonzalez/).

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

## Events

The following events are available:

* `push` - Any git push to a Repository.
* `issues` - Any time an Issue is opened or closed.
* `issue_comment` - Any time an Issue is commented on.
* `commit_comment` - Any time a Commit is commented on.
* `create` - Any time a Repository, Branch, or Tag is created.
* `delete` - Any time a Branch or Tag is deleted.
* `pull_request` - Any time a Pull Request is opened, closed, or synchronized (updated due to a new push in the branch that the pull request is tracking).
* `pull_request_review_comment` - Any time a Commit is commented on while inside a Pull Request review (the Files Changed tab).
* `gollum` - Any time a Wiki page is updated.
* `watch` - Any time a User watches the Repository.
* `release` - Any time a Release is published in the Repository.
* `fork` - Any time a Repository is forked.
* `fork_apply` - Any time a patch is applied to the Repository from the Fork Queue.
* `member` - Any time a User is added as a collaborator to a non-Organization Repository.
* `public` - Any time a Repository changes from private to public.
* `team_add` - Any time a team is added or modified on a Repository.
* `status` - Any time a Repository has a status update from the API

Check [the GitHub API docs](http://developer.github.com/v3/repos/hooks/) for up-to-date information.

## License

Copyright 2013 Scott González. Released under the terms of the MIT license.

---

Support this project by [donating on Gittip](https://www.gittip.com/scottgonzalez/).
