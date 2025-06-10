import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-home',
  imports: [CommonModule,FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  constructor(private route: Router){}

  role!: string;
  tags!: string;

  async startSession() {
    if (!this.role || !this.tags) {
      alert("Please select role and tags")
      return;
    }

    try {
      let stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      alert("You need to enable camera and mic")
    }

    let preparedTags = this.tags.split(",").map(tag => tag.trim());
    let JSONTags = JSON.stringify(preparedTags);
    
    sessionStorage.setItem("role", this.role);
    sessionStorage.setItem("tags", JSONTags);

   this.route.navigate(['/room'])
  }
}
