import { Component, OnInit } from '@angular/core';
import { fav_data } from '../favorite_dt'; 
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})

/*
export class fav_data {
    date: string | undefined;
    event: string | undefined;
    category: string | undefined;
    venue: string | undefined;
    id: string | undefined;
}
*/

export class FavoritesComponent implements OnInit {
  favorites: fav_data[] = [];

  ngOnInit(): void {
    var value: string | null;
    value = ''
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key != null){
        //console.log(key, " ", localStorage.getItem(key));  
          value = localStorage.getItem(key);
      }
      if (value != null && value != 'honey:core-sdk:*' && key != null) {
        //console.log(value)
        //console.log(value.slice(1, -1))
        const temp_arr = value.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^"(.+(?="$))"$/, '$1'));
        this.favorites?.push({
          date: temp_arr[0],
          event: temp_arr[1],
          category: temp_arr[2],
          venue: temp_arr[3],
          id: key,
        })
        //console.log(temp_arr[0]);
        //console.log(typeof temp_arr);
      }
    }
  }

  delete(key_to_delete: string | undefined) {
    console.log(key_to_delete)

    key_to_delete = "" + key_to_delete;

    let value_to_delete = localStorage.getItem(key_to_delete);

    if (value_to_delete) {
      console.log("remove", key_to_delete)
      localStorage.removeItem(key_to_delete);
      window.alert('Removed from Favorites!');
    }

    window.location.reload();
  }
  
}
