import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchComponent} from './search/search.component';
import { FavoritesComponent} from './favorites/favorites.component';

const routes: Routes = [
  { path: '', component: SearchComponent},
  { path: 'search', component: SearchComponent},
  { path: 'favorites', component: FavoritesComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
