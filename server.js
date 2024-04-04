const express = require('express');
const path=require('path');
const https = require('https');
const cors = require('cors')
const axios = require('axios');
const geohash = require('ngeohash');
var SpotifyWebApi = require('spotify-web-api-node');

var keyword = "";
var distance = 10;
var category = "default";
var location = "";

const app = express();
const port = process.env.PORT || 3080;

app.use(cors());

app.use(cors({
  //origin: 'https://vkmodi571hw8.wl.r.appspot.com'
  origin: 'http://localhost:4200'
}));

var corsOptions = {
   origin:'*',
   optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

const myPath=path.join(__dirname, 'dist');
app.use('/', express.static(myPath));

app.get('/api/formdata', async (req, res) => {
   keyword = req.query.keyword;
   distance = req.query.distance;
   category = req.query.category;
   location = req.query.location;

   keyword = keyword.trim();
   keyword = keyword.replace(" ", "+");

   var segments = {
      'music': 'KZFzniwnSyZfZ7v7nJ', 
      'sports': 'KZFzniwnSyZfZ7v7nE', 
      'arts': 'KZFzniwnSyZfZ7v7na', 
      'film': 'KZFzniwnSyZfZ7v7nn', 
      'miscellaneous': 'KZFzniwnSyZfZ7v7n1', 
      'default': ''
   }
   segments = {'music': 'KZFzniwnSyZfZ7v7nJ', 'sports': 'KZFzniwnSyZfZ7v7nE', 'arts': 'KZFzniwnSyZfZ7v7na', 'Film': 'KZFzniwnSyZfZ7v7nn', 'miscellaneous': 'KZFzniwnSyZfZ7v7n1', 'default': ''}
   
   if (location == "fEtChFrOmIpAdDrEsS") {
      //console.log("yupp")
      await axios.get("https://ipinfo.io/json?token=c9dddc2021ebf6")
         .then(response => {
            //console.log("response", response.data.city);
            location = response.data.city;
         })
         .catch(error => {
            //console.log("************ *********");
            console.log(error);
            //console.log("************ *********");
         });
   }

   //console.log("1", response.data.city);
   //console.log("2", location);
   console.log(location)
   location = location.trim();
   location = location.replace(" ", "+");
   
   gmaps_url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + location + "&key=AIzaSyCA6wriJyOXWYEXzQ32NLPn8KCaKVNdyJ4"

   axios.get(gmaps_url)
      .then(response => {
         //console.log(response.data.results[0].types[0]);
         if (response.data.status != 'ZERO_RESULTS'){
            var loc_lat = response.data.results[0].geometry.location.lat;
            var loc_long = response.data.results[0].geometry.location.lng;

            ticketmaster_url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword=" + keyword + "&geoPoint=" + geohash.encode(loc_lat, loc_long) + "&radius=" + distance + "&segmentID=" + segments[category] +  "&apikey=uIPETYWEUYFf0YBvvwoTtMcKcvsIL2Ce"

            axios.get(ticketmaster_url)
               .then(tm_response => {
                  //console.log(ticketmaster_url);
                  //console.log(tm_response.data);
                  //console.log(typeof tm_response.data);
                  res.json(tm_response.data);
               })
               .catch(error => {
                  console.log(error);
               });

         }
      })
      .catch(error => {
         console.log(error);
      }); 

});

app.get('/api/selectedeventdata', async (req, res) => {

   try {
      const eventid = req.query.eventid;
      const events_url = "https://app.ticketmaster.com/discovery/v2/events/" + eventid +"?apikey=uIPETYWEUYFf0YBvvwoTtMcKcvsIL2Ce";
      const event_response = await axios.get(events_url);
      res.json(event_response.data);
    } catch (error) {
      console.log(error);
    }
});

app.get('/api/selectedvenuedata', async (req, res) => {

   try {
      const venue = req.query.venue;
      const venueurl = "https://app.ticketmaster.com/discovery/v2/venues/?apikey=uIPETYWEUYFf0YBvvwoTtMcKcvsIL2Ce&keyword=" + venue;
      const venue_response = await axios.get(venueurl);
      res.json(venue_response.data);
    } catch (error) {
      console.log(error);
    }
});

app.get('/api/autocomplete', async (req, res) => {

   try {
      const autokeyword = req.query.autokeyword;
      const autourl = "https://app.ticketmaster.com/discovery/v2/suggest?apikey=uIPETYWEUYFf0YBvvwoTtMcKcvsIL2Ce&keyword=" + autokeyword;
      const auto_response = await axios.get(autourl);
      res.json(auto_response.data);
    } catch (error) {
      console.log(error);
    }
});

app.get('/api/spotifyAPI', async (req, res) => {
   const artist_name = req.query.artistname;
   //console.log(artist_name);

   const spotifyApi = new SpotifyWebApi({
      clientId: "859d391dff0c428d94553dc4b8b3f6e6",
      clientSecret: '80611152c6bd486c9e15482241bfacd1'
   });

   try {
      const data = await spotifyApi.clientCredentialsGrant();
      //console.log('The access token expires in ' + data.body['expires_in']);
      //console.log('The access token is ' + data.body['access_token']);
      //console.log("Data Body", data.body);

      // Save the access token so that it's used in future calls
      spotifyApi.setAccessToken(data.body['access_token']);

      const searchResult = await spotifyApi.searchArtists(artist_name);
      const albumsResult = await spotifyApi.getArtistAlbums(searchResult.body.artists.items[0].id);

      const spotifyResponse = {
         searchResult: searchResult.body,
         albumsResult: albumsResult.body
      }

      res.json(spotifyResponse);
   } catch (error) {
      console.error(error);
      //res.status(500).send('Error retrieving data from Spotify API');
   }
});

app.get('', (req,res) => {
      res.send('App Works !!!!!!');
});

app.listen(port, () => {
      console.log(`Server listening on the port::${port}`);
});

app.get('/api/venuemap', async (req, res) => {
   try {
      venue_name = req.query.venuename;
      const gmaps_url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + venue_name + "&key=AIzaSyCA6wriJyOXWYEXzQ32NLPn8KCaKVNdyJ4";

      //console.log(gmaps_url)
      const response_loc = await axios.get(gmaps_url);
      res.json(response_loc.data);

   }  catch (error) {
      console.log(error);
   }
});