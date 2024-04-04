import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Event } from 'src/app/search_dt';
import { event_data } from 'src/app/event_dt';
import { venue_data } from '../venue_dt';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserAnimationsModule } from  '@angular/platform-browser/animations';
import { UrlMatchResult } from '@angular/router';
import { spotify_data } from '../spotify_dt';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, tap, switchMap, finalize, distinctUntilChanged, filter } from 'rxjs/operators';
import axios from 'axios';
import { Loader } from "@googlemaps/js-api-loader";
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { NgIf } from '@angular/common';
import { ViewEncapsulation } from '@angular/core'
import { MatDialog } from '@angular/material/dialog';




export interface Employee {
  name: string;
}

declare var mapModalWindow: any;

@Injectable({
  providedIn: 'root'
})

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})

export class SearchComponent implements OnInit{

  mapOptions: google.maps.MapOptions = {};

  marker = {
    position: { lat: 0, lng: 0 },
  }

  public data: any;
  public mapModal: any;
  public autodata: any;
  public selectedEventData: any;
  public selectedVenueData: any;
  public selectedVenueLocData: any;
  public favoriteEventData: any;
  public selectedEventSpotifyData: any;
  public spotifySearchArtistData: any;
  showError!: boolean;
  display: any;
  zoom = 4;
  keyword = new FormControl('');

  //events = EVENTS; keep
  events: Event[] = [];
  show_table = false;
  color_heart = false;
  selectedEvent: Event | undefined;
  selectedEventSpotify: Event | undefined;
  showCarousel: boolean | null = null;
  temp_venue: Event | undefined;
  selectedEventVenue: Event | undefined;
  showMore1 = false;
  showMore2 = false;
  showMore3 = false;

  isAutoDetectLocationEnabled = false;

  selectedName: string | undefined;
  selectedID: string | undefined;
  loc_lat!: number ;
  loc_long!: number;

  //selectedEventData_json!: event_data;
  selectedEventDataCard: event_data[] = [];
  selectedVenueDataCard: venue_data[] = [];
  spotifySearchArtistDataCard: spotify_data[] = [];
 
  isSubmitted = false;

  constructor(private http: HttpClient, private fb: FormBuilder) { }
  
  searchForm = this.fb.group({
    keyword: ['', Validators.required],
    distance: [10, Validators.min(0)],
    category: ['Default', Validators.required],
    location: ['', Validators.required],
    auto_location: [false]
  });
  
  inputText!: string;
  suggestions: string[] =[];
  
  ngOnInit() {
    this.searchForm.controls['category'].setValue('Default');
  }

  displayStyle = "none";
  
  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }

  handleInputChange() {
    this.suggestions.length = 0;
    if (this.inputText.length > 0) {
      
      //this.suggestions$ = this.getAutocompleteSuggestions(this.inputText);
      //console.log(this.inputText)
      
      //const auto_url = "http://localhost:3080/api/autocomplete?autokeyword=" + this.inputText;
      const auto_url = "https://vkmodi571hw8.wl.r.appspot.com/api/autocomplete?autokeyword=" + this.inputText;

      this.http.get(auto_url).subscribe((autodata) => {
        this.autodata = JSON.stringify(autodata);
        let autodata_json = JSON.parse(this.autodata);
        for (var a = 0; a < Object.keys(autodata_json._embedded.attractions).length; a++) {
          this.suggestions.push(autodata_json._embedded.attractions[a].name);
        }
      });
      //this.suggestions = ["hey", "hello"]
    }
  }

  fillKeyword(suggestion: string) {
    //console.log(suggestion);
    this.searchForm.controls['keyword'].setValue(suggestion);
    this.suggestions.length = 0;
  }

  emptySuggestion() {
    this.suggestions.length = 0;
  }

  onAutoDetectLocationChange(event: any) {
    this.isAutoDetectLocationEnabled = event.target.checked;
    if (this.isAutoDetectLocationEnabled) {
      this.searchForm.controls['location'].disable();
      this.searchForm.controls['location'].setValue('');
    } else {
      this.searchForm.controls['location'].enable();
    }
  }

  clear() {
    this.searchForm.reset();
    this.show_table = false;
    this.showCarousel = false;
    this.selectedEvent = undefined;
    this.showError = false;
    //this.events.length = 0;
    //this.selectedVenueDataCard.length = 0;
    //this.spotifySearchArtistDataCard.length = 0;
    //this.selectedEventDataCard.length = 0;
    /*this.searchForm.controls['keyword'].disable();
    this.searchForm.controls['keyword'].enable();
    this.searchForm.controls['distance'].disable();
    this.searchForm.controls['distance'].enable();
    this.searchForm.controls['category'].disable();
    this.searchForm.controls['category'].enable();
    this.searchForm.controls['location'].disable();
    this.searchForm.controls['location'].enable();*/
    this.searchForm.controls['keyword'].setValue(null);
    this.searchForm.controls['distance'].setValue(10);
    this.searchForm.controls['category'].setValue(null);
    this.searchForm.controls['location'].setValue(null);
    //console.log(this.events);
  }

  async onSubmit() {
    this.show_table = true;
    this.showError = true;
    var keyword = this.searchForm.value.keyword;
	  var distance = this.searchForm.value.distance;
	  var category = this.searchForm.value.category;
    var location = this.searchForm.value.location;
    this.showCarousel = null;

    //console.log("autolocation", this.searchForm.value.auto_location)

    if (this.searchForm.value.auto_location == true) {
      //location = "fEtChFrOmIpAdDrEsS";
      //this.searchForm.get('location').disable();
      await fetch("https://ipinfo.io/json?token=c9dddc2021ebf6")
        .then(response => response.json())
          .then(jsonResponse => {
            location = jsonResponse.city;
      });
    }
    
    //console.log("autoloc", location);
    //const url = "http://localhost:3080/api/formdata?keyword=" + keyword + "&distance=" + distance + "&category=" + category + "&location=" + location + "&submit=Submit" 
    const url = "https://vkmodi571hw8.wl.r.appspot.com/api/formdata?keyword=" + keyword + "&distance=" + distance + "&category=" + category + "&location=" + location + "&submit=Submit" 
    this.isSubmitted = true;

    this.http.get(url).subscribe((data) => {
      //console.log(data);
      this.data = JSON.stringify(data);
      let data_json = JSON.parse(this.data);

      var table_len = Math.min(20, data_json.page.totalElements);
      
      this.events.length = 0;
      this.selectedVenueDataCard.length = 0;
      this.spotifySearchArtistDataCard.length = 0;
      this.selectedEventDataCard.length = 0;
      

      this.selectedID = undefined;
      this.selectedName = undefined;
      

      for (var i = 0; i < table_len; i++) {
        //console.log(i);
        this.events?.push({
          date: data_json._embedded.events[i].dates.start.localDate,
          time: data_json._embedded.events[i].dates.start.localTime, 
          icon: data_json._embedded.events[i].images[0].url, 
          name: data_json._embedded.events[i].name, 
          genre: data_json._embedded.events[i].classifications[0].segment.name, 
          venue: data_json._embedded.events[i]._embedded.venues[0].name, 
          id: data_json._embedded.events[i].id})
      }
      
      //TO DO order table by asceneding date
      /*try {
        this.events = this.events.sort((a, b) => 
          a.date - b.date || a.time.localeCompare(b.time)
        );
        console.log("sorted")
      } catch (e) {}*/

      try {
        this.events.sort((a: {date: string, time: string}, b: {date: string, time: string}) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
        
          if (dateA.getTime() === dateB.getTime()) {
            return a.time.localeCompare(b.time);
          } else {
            return dateA.getTime() - dateB.getTime();
          }
        });       
      } catch (e) {}
      
      //console.log("sorted", this.events);
      //console.log(typeof this.events[0].time);

    });
    //console.log(keyword)
    if(keyword == undefined) {
      //console.log("zero");
      this.events.length = 0;
    }
    
  }

  onSelectEvent(event: Event) {
    this.color_heart = false;
    this.show_table = false;
    this.selectedEvent = event;
    
    //var eventurl = "http://localhost:3080/api/selectedeventdata?eventid=" + this.selectedEvent.id;
    var eventurl = "https://vkmodi571hw8.wl.r.appspot.com/api/selectedeventdata?eventid=" + this.selectedEvent.id;


    //CHECK IF ID EXISTS IN STORAGE, IF IT DOES, COLOR = RED, ELSE WHITE
    var fav_id = "" + this.selectedEvent.id;
    let fav_value = localStorage.getItem(fav_id);
    
    if (fav_value) {
      //console.log('exists');
      this.color_heart = true;
    }
    else {
      this.color_heart = false;
    }


    var event_name = ""
    var event_genre = ""
    var event_local_date = ""
    var event_local_time = ""
    var event_price_range = ""
    var event_ticket_status = ""
    var event_buy_ticket = ""
    var event_seat_map = ""
    var event_artists = ""
    var event_artists_url = ""
    var event_venues = ""

    var show_event_name = true;
    var show_event_genre = true;
    var show_event_time = true;
    var show_event_price_range = true;
    var show_event_ticket_status = true;
    var show_event_buy_ticket = true;
    var show_event_seat_map = true;
    var show_event_artists = true;
    var show_event_artists_url = true;
    var show_event_venues = true;


    this.http.get(eventurl).subscribe((selectedEventData) => {
      //console.log(selectedEventData);
      this.selectedEventData = JSON.stringify(selectedEventData);
      let selectedEventData_json = JSON.parse(this.selectedEventData);
      //log("event", selectedEventData_json);
      //console.log(typeof selectedEventData_json);
      //console.log(selectedEventData_json.name);
      //json being read correctly

      this.selectedID = selectedEventData_json.id;

      try {
        event_name = selectedEventData_json.name;
        this.selectedName = selectedEventData_json.name;
      } catch (e){}
      if (event_name == ""){
        show_event_name = false;
      } 

      try {
        event_artists_url = selectedEventData_json._embedded.attractions[0].url;
      } catch (e){}
      if (event_artists_url == ""){
        show_event_artists_url = false;
      } 

      try {
        if (selectedEventData_json.dates.start.localDate != "undefined") {
          event_local_date = selectedEventData_json.dates.start.localDate;
        }
      } catch (e){}
      try {
        if (selectedEventData_json.dates.start.localTime != "undefined") {
          event_local_time = selectedEventData_json.dates.start.localTime;
        }
      } catch (e){}
      if (event_local_date == "" && event_local_time == ""){
        show_event_time = false;
      }

      try {
        if (selectedEventData_json.classifications[0].subGenre.name != "NaN" && selectedEventData_json.classifications[0].subGenre.name != "Undefined") {
          event_genre = event_genre + selectedEventData_json.classifications[0].subGenre.name + " | ";
        }
      } catch (e){}
      try {
        if (selectedEventData_json.classifications[0].genre.name != "NaN" && selectedEventData_json.classifications[0].genre.name != "Undefined") {
          event_genre = event_genre + selectedEventData_json.classifications[0].genre.name + " | ";
        }
      } catch (e){}
      try {
        if (selectedEventData_json.classifications[0].segment.name != "NaN" && selectedEventData_json.classifications[0].segment.name != "Undefined") {
          event_genre = event_genre + selectedEventData_json.classifications[0].segment.name + " | ";
        }
      } catch (e){}
      try {
        if (selectedEventData_json.classifications[0].subType.name != "NaN" && selectedEventData_json.classifications[0].subType.name != "Undefined") {
          event_genre = event_genre + selectedEventData_json.classifications[0].subType.name + " | ";
        }
      } catch (e){}
      try {
        if (selectedEventData_json.classifications[0].type.name != "NaN" && selectedEventData_json.classifications[0].type.name != "Undefined") {
          event_genre = event_genre + selectedEventData_json.classifications[0].type.name + " | ";
        }
      }  catch (e){}
      if (event_genre == ""){
        show_event_genre = false;
      } else {
        event_genre = event_genre.substring(0, event_genre.length - 3);
      }

      try {
        event_price_range = selectedEventData_json.priceRanges[0].min + " - " + selectedEventData_json.priceRanges[0].max;
        //console.log(event_price_range)
      } catch (e){}
      if (event_price_range == ""){
        show_event_price_range = false;
      } else {
        try {
          event_price_range = event_price_range + " " + selectedEventData_json.priceRanges[0].currency;
        } catch (e){}
      }

      try {
        event_ticket_status = selectedEventData_json.dates.status.code;
      } catch (e){}
      if (event_ticket_status == ""){
        show_event_ticket_status = false;
      }

      try {
        event_buy_ticket = selectedEventData_json.url;
      } catch (e){}
      if (event_buy_ticket == ""){
        show_event_buy_ticket = false;
      }

      try {
          event_seat_map = selectedEventData_json.seatmap.staticUrl;
      } catch (e){}
      if (event_seat_map == ""){
        show_event_seat_map = false;
      } 

      try {
        for (var j = 0; j < Object.keys(selectedEventData_json._embedded.attractions).length; j++){
          //console.log(i+" "+ j)
          event_artists = event_artists + selectedEventData_json._embedded.attractions[j].name + " | ";
        }
      } catch (e) {}
      if (event_artists == ""){
        show_event_artists = false;
      } else {
        event_artists = event_artists.substring(0, event_artists.length - 3);
      }

      try {
        for (var k = 0; k < Object.keys(selectedEventData_json._embedded.venues).length; k++){
          event_venues = event_venues + selectedEventData_json._embedded.venues[k].name + " | ";
        }
      } catch (e) {}
      if (event_venues == ""){
        show_event_venues = false;
      } else {
        event_venues = event_venues.substring(0, event_venues.length - 3);
      }

      this.selectedEventDataCard.length = 0;
      this.spotifySearchArtistDataCard.length = 0;

      this.selectedEventDataCard?.push({
        name: event_name,
        genre: event_genre,
        local_date: event_local_date,
        local_time: event_local_time,
        price_range: event_price_range,
        ticket_status: event_ticket_status,
        buy_ticket: event_buy_ticket,
        seat_map: event_seat_map,
        artists: event_artists,
        artists_url: event_artists_url, 
        venues: event_venues,
        id: selectedEventData_json.id,
        show_event_name: show_event_name,
        show_event_genre: show_event_genre,
        show_event_time: show_event_time,
        show_event_price_range: show_event_price_range,
        show_event_ticket_status: show_event_ticket_status,
        show_event_buy_ticket: show_event_buy_ticket,
        show_event_seat_map: show_event_seat_map,
        show_event_artists: show_event_artists,
        show_event_artists_url: show_event_artists_url,
        show_event_venues: show_event_venues
      })
    });
    this.onSelectSpotify(event);
  }

  onSelectVenue(event: Event){
    this.temp_venue = event;
    var venue_forurl = this.temp_venue.venue?.replaceAll(" ", "%20");
    
    
    //var venueurl = "http://localhost:3080/api/selectedvenuedata?venue=" + venue_forurl; 
    var venueurl = "https://vkmodi571hw8.wl.r.appspot.com/api/selectedvenuedata?venue=" + venue_forurl; 

    var venue_address = ""
    var venue_city = ""
    var venue_phone = ""
    var venue_hours = ""
    var venue_gen = ""
    var venue_child = ""
    var venue_id = ""
    var venue_name = ""


    var show_venue_address = true
    var show_venue_city = true
    var show_venue_phone = true
    var show_venue_hours = true
    var show_venue_gen = true
    var show_venue_child = true
    var show_venue_id = true
    var show_venue_name = true
    var show_venue = true
 
    this.http.get(venueurl).subscribe((selectedVenueData) => {
      
      this.selectedVenueData = JSON.stringify(selectedVenueData);
      let selectedVenueData_json = JSON.parse(this.selectedVenueData);

      if(selectedVenueData_json.page.totalElements != 0) {
        venue_name = selectedVenueData_json._embedded.venues[0].name;

        this.getLatLong(venue_name);

        if (venue_name == ""){
          show_venue_name = false;
        } 

        try {
          venue_address = venue_address + selectedVenueData_json._embedded.venues[0].address.line1 + ", ";
        } catch (e) {}
    
        try {
          venue_address = venue_address + selectedVenueData_json._embedded.venues[0].city.name + ", "
        } catch (e) {}
        
        try {
          venue_address = venue_address + selectedVenueData_json._embedded.venues[0].state.name;
        } catch (e) {}

        if (venue_address == ""){
          show_venue_address = false;
        } 
    
        //venue_address = venue_address.replaceAll(" ", "+")
        //venue_address = venue_address.replaceAll(",", "%2C+")

        try {
          venue_phone = selectedVenueData_json._embedded.venues[0].boxOfficeInfo.phoneNumberDetail;
        } catch (e) {}
        if (venue_phone == ""){
          show_venue_phone = false;
        } 

        try {
          venue_hours = selectedVenueData_json._embedded.venues[0].boxOfficeInfo.openHoursDetail;
        } catch (e) {}
        if (venue_hours == ""){
          show_venue_hours = false;
        } 

        try {
          venue_gen = selectedVenueData_json._embedded.venues[0].generalInfo.generalRule;
        } catch (e) {}
        if (venue_gen == ""){
          show_venue_gen = false;
        } 

        try {
          venue_child = selectedVenueData_json._embedded.venues[0].generalInfo.childRule;
        } catch (e) {}
        if (venue_child == ""){
          show_venue_child = false;
        } 

        try {
          venue_id = selectedVenueData_json._embedded.venues[0].id;
        } catch (e) {}
        if (venue_id == ""){
          show_venue_id = false;
        } 
    
        //console.log(v_address)
        /*
        if (venue_address != "") {
          venue_address = "https://www.google.com/maps/search/?api=1&query=" + venue_address;
        }*/
        
      } else {
        show_venue = false;
        show_venue_address = false
        show_venue_city = false
        show_venue_phone = false
        show_venue_hours = false
        show_venue_gen = false
        show_venue_child = false
        show_venue_id = false
        show_venue_name = false
        show_venue = false
      }
      
      this.selectedVenueDataCard.length = 0;

      //console.log("location3", String(loc_lat), String(loc_long));

      this.selectedVenueDataCard?.push({
        name: venue_name,
        address: venue_address,
        city: venue_city,
        phone: venue_phone,
        open_hours: venue_hours,
        gen_rule: venue_gen,
        child_rule: venue_child,
        id: venue_id,
        show_venue_name: show_venue_name,
        show_venue_address: show_venue_address,
        show_venue_phone: show_venue_phone,
        show_venue_hours: show_venue_hours,
        show_venue_gen: show_venue_gen,
        show_venue_child: show_venue_child,
        show_venue_id: show_venue_id,
        show_venue: show_venue
      })
  
    });
  }

  onSelectSpotify(event: Event){
    
    this.selectedEventSpotify = event;
    var callSpotify = false;
    
    //var eventurl = "http://localhost:3080/api/selectedeventdata?eventid=" + this.selectedEventSpotify.id;
    var eventurl = "https://vkmodi571hw8.wl.r.appspot.com/api/selectedeventdata?eventid=" + this.selectedEventSpotify.id;
    
    this.http.get(eventurl).subscribe((selectedEventSpotifyData) => {
      
      this.selectedEventSpotifyData = JSON.stringify(selectedEventSpotifyData);
      let selectedEventSpotifyData_json = JSON.parse(this.selectedEventSpotifyData);
      //console.log("spotify", selectedEventSpotifyData_json);

      try {
        for (var i = 0; i < Object.keys(selectedEventSpotifyData_json._embedded.attractions).length; i++){

          callSpotify = false;
          for (var j = 0; j < Object.keys(selectedEventSpotifyData_json._embedded.attractions[i].classifications).length; j++){
            if (selectedEventSpotifyData_json._embedded.attractions[i].classifications[j].segment.name == 'Music') {
              callSpotify = true;
            }
          }

          if (callSpotify == true) {
            //console.log("call spotfy API for", selectedEventSpotifyData_json._embedded.attractions[i].name);

            this.spotifyAPI(selectedEventSpotifyData_json._embedded.attractions[i].name, selectedEventSpotifyData_json.id)
          }
        }
      } catch (e) {}
      
    });
  }

  getLatLong(venue_name: string){
    let venue_name_url = venue_name.trim();
    venue_name_url = venue_name_url.replace(" ", "+");
    
    //var venuenameurl = "http://localhost:3080/api/venuemap?venuename=" + venue_name_url;
    var venuenameurl = "https://vkmodi571hw8.wl.r.appspot.com/api/venuemap?venuename=" + venue_name_url;

    this.http.get(venuenameurl).subscribe((selectedVenueLocData) => {
      this.selectedVenueLocData = JSON.stringify(selectedVenueLocData);
      let selectedVenueLocData_json = JSON.parse(this.selectedVenueLocData);

      //console.log(selectedVenueLocData_json);
      //console.log(selectedVenueLocData_json.results[0]);
      //console.log(selectedVenueLocData_json.results[0].geometry);
      //console.log(selectedVenueLocData_json.results[0].geometry.location);
      try {
        this.loc_lat = selectedVenueLocData_json.results[0].geometry.location.lat;
        this.loc_long = selectedVenueLocData_json.results[0].geometry.location.lng;

        this.mapOptions = {
            center: { lat: this.loc_lat, lng: this.loc_long },
            zoom : 14
        }
        this.marker = {
          position: { lat: this.loc_lat, lng: this.loc_long },
        }
        
      } catch (e) {
        console.log(e)
      }
    });
  }

  spotifyAPI(artist_name: string, spotify_id: string) {
    
    //var spotifyurl = "http://localhost:3080/api/spotifyAPI?artistname=" + artist_name;
    var spotifyurl = "https://vkmodi571hw8.wl.r.appspot.com/api/spotifyAPI?artistname=" + artist_name;

    var spotify_name = ""
    var spotify_followers = ""
    var spotify_popularity: BigInteger;
    var spotify_link = ""
    var spotify_image = ""
    
    this.http.get(spotifyurl).subscribe((spotifySearchArtistData) => {

      //console.log("HI",spotifySearchArtistData);
      this.spotifySearchArtistData = JSON.stringify(spotifySearchArtistData);
      let spotifySearchArtistData_json = JSON.parse(this.spotifySearchArtistData);
      //console.log("spotify", spotifySearchArtistData_json);
      

      try {
        spotify_name = spotifySearchArtistData_json.searchResult.artists.items[0].name;
      } catch (e){}
      if (spotify_name == ""){
        //dontdisplay
      } 

      try {
        spotify_followers = spotifySearchArtistData_json.searchResult.artists.items[0].followers.total.toLocaleString();
      } catch (e){}
      if (spotify_followers == ""){
        //dontdisplay
      } 

      try {
        spotify_popularity = spotifySearchArtistData_json.searchResult.artists.items[0].popularity;
      } catch (e){}
      if (spotify_popularity == null){
        //dontdisplay
      } 

      try {
        spotify_link = spotifySearchArtistData_json.searchResult.artists.items[0].external_urls.spotify;
      } catch (e){}
      if (spotify_link == ""){
        //dontdisplay
      } 

      try {
        spotify_image = spotifySearchArtistData_json.searchResult.artists.items[0].images[0].url;
      } catch (e){}
      if (spotify_image == ""){
        //dontdisplay
      }

      var imagearray = [];
      for (var i = 0; i < Math.min(3, Object.keys(spotifySearchArtistData_json.albumsResult.items).length); i++){
        imagearray.push(spotifySearchArtistData_json.albumsResult.items[i].images[0].url)
      }

      //this.spotifySearchArtistDataCard.length = 0;

      this.spotifySearchArtistDataCard?.push({
        name: spotify_name,
        image: spotify_image,
        followers: spotify_followers,
        popularity: spotify_popularity,
        link: spotify_link,
        id: spotify_id,
        album_images: imagearray
      })
      //this.spotifySearchArtistDataCard = this.spotifySearchArtistDataCard.reverse();
      //console.log("spotify data", this.spotifySearchArtistDataCard);
      this.showCarousel = true;
    });
    

  }

  backIt() {
    this.show_table = true;
    this.selectedEvent = undefined;
  }

  toggleFavorite() {
    var fav_id = ""
    var fav_date = ""
    var fav_event = ""
    var fav_cat = ""
    var fav_venue = ""

    //console.log(this.selectedID)
    fav_id = "" + this.selectedID;
    //console.log("fav id", fav_id);
    //console.log("to fave id", typeof fav_id);

    let fav_value = localStorage.getItem(fav_id);
    //console.log("fav value", fav_value);

    
    if (fav_value) {
      //console.log("remove", fav_id)
      this.color_heart = false;
      localStorage.removeItem(fav_id);
      window.alert('Removed from Favorites!');
    }
    else {
      this.color_heart = true;
      
      //var eventurl = "http://localhost:3080/api/selectedeventdata?eventid=" + this.selectedID;
      var eventurl = "https://vkmodi571hw8.wl.r.appspot.com/api/selectedeventdata?eventid=" + this.selectedID;

      this.http.get(eventurl).subscribe((favoriteEventData) => {
      
        this.favoriteEventData = JSON.stringify(favoriteEventData);
        let favoriteEventData_json = JSON.parse(this.favoriteEventData);

        try {
          fav_event = favoriteEventData_json.name;
          if (fav_event.includes(',')) {
            fav_event = fav_event.replace(new RegExp(',', 'g'), ' -');
          }
        } catch (e){}
        if (fav_event == ""){
          //dontdisplay
        } 

        try {
          fav_date = favoriteEventData_json.dates.start.localDate;
          if (fav_date.includes(',')) {
            fav_date = fav_date.replace(new RegExp(',', 'g'), ' -');
          }
        } catch (e){}
        if (fav_date == ""){
          //dontdisplay
        } 

        try {
          if (favoriteEventData_json.classifications[0].subGenre.name != "NaN" && favoriteEventData_json.classifications[0].subGenre.name != "Undefined") {
            fav_cat = fav_cat + favoriteEventData_json.classifications[0].subGenre.name + " | ";
          }
        } catch (e){}
        try {
          if (favoriteEventData_json.classifications[0].genre.name != "NaN" && favoriteEventData_json.classifications[0].genre.name != "Undefined") {
            fav_cat = fav_cat + favoriteEventData_json.classifications[0].genre.name + " | ";
          }
        } catch (e){}
        try {
          if (favoriteEventData_json.classifications[0].segment.name != "NaN" && favoriteEventData_json.classifications[0].segment.name != "Undefined") {
            fav_cat = fav_cat + favoriteEventData_json.classifications[0].segment.name + " | ";
          }
        } catch (e){}
        try {
          if (favoriteEventData_json.classifications[0].subType.name != "NaN" && favoriteEventData_json.classifications[0].subType.name != "Undefined") {
            fav_cat = fav_cat + favoriteEventData_json.classifications[0].subType.name + " | ";
          }
        } catch (e){}
        try {
          if (favoriteEventData_json.classifications[0].type.name != "NaN" && favoriteEventData_json.classifications[0].type.name != "Undefined") {
            fav_cat = fav_cat + favoriteEventData_json.classifications[0].type.name + " | ";
          }
        }  catch (e){}
        
        if (fav_cat == ""){
          //dont display
        } else {
          if (fav_date.includes(',')) {
            fav_cat = fav_cat.replace(new RegExp(',', 'g'), ' -');
          }
          fav_cat = fav_cat.substring(0, fav_cat.length - 3);
        }

        try {
          for (var k = 0; k < Object.keys(favoriteEventData_json._embedded.venues).length; k++){
            fav_venue = fav_venue + favoriteEventData_json._embedded.venues[k].name + " | ";
          }
        } catch (e) {}
        if (fav_venue == ""){
          //dont display
        } else {
          if (fav_venue.includes(',')) {
            fav_venue = fav_venue.replace(new RegExp(',', 'g'), ' -');
          }
          fav_venue = fav_venue.substring(0, fav_venue.length - 3);
        }

        let fav_data: string[] = [fav_date, fav_event, fav_cat, fav_venue];

        //console.log("fav data", fav_data);
        //console.log("str fav data", JSON.stringify(fav_data));
        //console.log("to fav data", typeof JSON.stringify(fav_data));
        localStorage.setItem(fav_id, JSON.stringify(fav_data));

        window.alert('Event Added to Favorites!');

      });
    }
  }

  allOutput() {
    var value: string | null;
    value = ''
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key != null){
        //console.log(key, " ", localStorage.getItem(key));  
          value = localStorage.getItem(key);
      }
      if (value != null && value != 'honey:core-sdk:*') {
        //console.log(value)
        //console.log(value.slice(1, -1))
        const temp_arr = value.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^"(.+(?="$))"$/, '$1'));
        //console.log(temp_arr[0]);
        //console.log(typeof temp_arr);
      }
      
    }
  }

  delOutput() {
    localStorage.clear();
    //console.log("cleared")
  }
}

