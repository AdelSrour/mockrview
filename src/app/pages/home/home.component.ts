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

  startSession() {
    if (!this.role || !this.tags) {
     alert("Please select role and tags")
    }

    let preparedTags = this.tags.split(",").map(tag => tag.trim());
    let JSONTags = JSON.stringify(preparedTags);
    
    sessionStorage.setItem("role", this.role);
    sessionStorage.setItem("tags", JSONTags);

   this.route.navigate(['/room'])
  }
}
