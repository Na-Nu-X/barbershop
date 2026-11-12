import { Component } from "@angular/core"
import { Barber } from "../services/barber"
import { CommonModule } from "@angular/common"
import { SectionHeading } from "../shared/section-heading/section-heading"

import type { BarberData } from "../services/barber"

@Component({
  selector: "app-profiles",
  imports: [CommonModule, SectionHeading],
  templateUrl: "./profiles.html",
  styleUrl: "./profiles.scss",
})
export class Profiles {
  barbers:BarberData[] = [] // Stores The Barbers

  // Method Which Executes In Beginning
  ngOnInit():void {
    // Gets The Barbers
    this.BarberService.getBarbers().subscribe({
      next:(response) => {
        if(response && response.success && response.barbers) {
          this.barbers = response.barbers // Stores The Barbers
        }
        
        else {
          console.error(response.message) // Shows The Error Message
        }
      },

      error:(error) => {
        console.error(error) // Shows The Error
      }
    })
  }

  constructor(private BarberService:Barber) { }
}