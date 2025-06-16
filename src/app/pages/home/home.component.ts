import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

@Component({
  selector: "app-home",
  imports: [CommonModule, FormsModule],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent {
  constructor(private route: Router) {}

  role!: string;
  tags!: string;

  // Modal state properties
  showValidationModal = false;
  showPermissionModal = false;
  modalTitle = "";
  modalMessage = "";

  // Modal methods
  openModal(title: string, message: string) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.showValidationModal = true;
  }

  closeModal() {
    this.showValidationModal = false;
    this.showPermissionModal = false;
  }

  async startSession() {
    if (!this.role || !this.tags) {
      this.openModal(
        "Missing Information",
        "Please select your role and enter your skills/technologies to continue."
      );
      return;
    }

    try {
      let stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      this.openModal(
        "Camera & Microphone Access Required",
        "Please enable camera and microphone access to participate in video interviews. Check your browser settings and try again."
      );
      return;
    }

    let preparedTags = this.tags.split(",").map((tag) => tag.trim());
    let JSONTags = JSON.stringify(preparedTags);

    sessionStorage.setItem("role", this.role);
    sessionStorage.setItem("tags", JSONTags);

    this.route.navigate(["/room"]);
  }
}
