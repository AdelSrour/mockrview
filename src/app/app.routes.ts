import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: "", loadComponent: () => import("./pages/home/home.component").then(p => p.HomeComponent) },
    {path:"room", loadComponent: ()=> import("./pages/room/room.component").then(p => p.RoomComponent)},
    {path:"**", loadComponent: ()=> import("./pages/notfound/notfound.component").then(p => p.NotfoundComponent)}
];
