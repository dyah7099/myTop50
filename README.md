# MYTop50 creator

This project is forked from spotify's Spotify Accounts Authentication Examples repo (https://github.com/spotify/web-api-auth-examples)

This handles most of the authentication c=neccessary for interacting with the spotify api.

## Installation

These examples run on Node.js. On [its website](http://www.nodejs.org/download/) you can find instructions on how to install it. You can also follow [this gist](https://gist.github.com/isaacs/579814) for a quick and easy way to install Node.js and npm.

Once installed, clone the repository and install its dependencies running:

    $ npm install

## Edit the config file
edit config/default.json
    get the client_id and client_secret from the spotify developer page
    set the host localhost:8888 or the hosted url

## Running the app

    $ cd authorization_code
    $ node app.js

Then, open `http://localhost:8888` in a browser.

### Features

features include displaying top songs and artists, creating a playlist of songs in the current view, loggin and signout.
