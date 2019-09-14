/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var config = require('config');


var client_id = config.get('client_id') // Your client id
var client_secret = config.get('client_secret'); // Your secret
var redirect_uri = 'http://' + config.get('host')+'/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  //requests authorization
  var scope = 'user-top-read user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
      show_dialog: true
    }));
});

app.get('/callback', function(req, res) {

  // requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        // we pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

//call to create a playlist on the user profile
app.get('/create_playlist', function(req, res) {
	console.log('create playlist')

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
		
      var access_token = body.access_token;
      var time_period= req.query.time_period;
      //get top 50 tracks with user specified time range
      var tracks = {
          url: 'https://api.spotify.com/v1/me/top/tracks?time_range='+time_period+'&limit=50',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };
      request.get(tracks, function(error, response, body) {
		//create list of tracks	
        var my_tracks=[];
        for (var i = 0; i < body.items.length; i++) {
			my_tracks.push(body.items[i].uri);
	    }
		//get user id from request	
		var id=req.query.id
		var playlist_name={'short_term': 'month', 'medium_term':'six months', 'long_term':'millenia'}
		//form and request empy playlist
		var empty_playlist = {
          url: 'https://api.spotify.com/v1/users/'+id+'/playlists',
          headers: { 'Authorization': 'Bearer ' + access_token },
          body: JSON.stringify({name: "My Top 50 this "+playlist_name[time_period]}),
          json: true
        };
        request.post(empty_playlist, function(error, response, body) {
			playlist_id=body.id;
			//ADd tracks to playlist
			var add_tracks = {
				url: 'https://api.spotify.com/v1/users/'+id+'/playlists/'+playlist_id+'/tracks',
				headers: { 'Authorization': 'Bearer ' + access_token },
				body: JSON.stringify({uris: my_tracks}),
				json: true,
				'Content-Type': 'application/json'
				};
			request.post(add_tracks, function(error, response, body) {		console.log(body);	});
		});
      });

      //send response
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
