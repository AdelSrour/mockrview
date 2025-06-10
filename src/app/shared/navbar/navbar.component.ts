import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent {
  isDarkMode = false;

  constructor() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("theme");
    this.isDarkMode =
      savedTheme === "dark" ||
      (!savedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    this.applyTheme();
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem("theme", this.isDarkMode ? "dark" : "light");
  }

  private applyTheme() {
    if (this.isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
}
