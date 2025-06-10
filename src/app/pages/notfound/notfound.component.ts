import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-notfound",
  imports: [CommonModule],
  templateUrl: "./notfound.component.html",
  styleUrl: "./notfound.component.scss",
})
export class NotfoundComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(["/"]);
  }

  goBack() {
    window.history.back();
  }
}
