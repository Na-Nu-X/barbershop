import { ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core"
import { Booking as BookingService } from "../services/booking"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"

import type { Service } from "../services/booking"

export interface Customer {
  first_name:string,
  last_name:string,
  phone_number:string
}

@Component({
  selector: "app-booking",
  imports: [CommonModule, FormsModule],
  templateUrl: "./booking.html",
  styleUrl: "./booking.scss",
})
export class Booking {
  services:Service[] = [] // Stores All Available Services
  service_id:number = 1 // Stores The Service ID
  selected_service:string = "" // Stores The Selected Service
  is_services_select_menu_open:boolean = false // Stores The Information If The Services Select Menu Is Open

  slots_data:{
    slot:string,
    is_available:boolean
  }[] = [] // Stores The Available Slots

  selected_slot:string|null = null // Stores The Selected Slot
  selected_date:string = "" // Stores The Selected Date

  // Stores The Customer's Data
  customer:Customer = {
    first_name: "",
    last_name: "",
    phone_number: ""
  }

  min_date: string = "" // Stores The Minimum Date
  max_date: string = "" // Stores The Maximum Date

  // Method Which Executes In Beginning
  ngOnInit():void {
    const today:Date = new Date() // Gets The Today's Date
    const _3_months_later:Date = new Date() // Stores The 3 Months Later Date

    this.min_date = this.formatDate(today) // Sets The Minimum Date

    _3_months_later.setMonth(today.getMonth() + 3) // Gets The 3 Months Later Date
    this.max_date = this.formatDate(_3_months_later) // Sets The Maximum Date

    // Gets The Available Services
    this.BookingService.getAvailableServices().subscribe({
      next:(response) => {
        if(response && response.success) {
          this.services = response.services // Sets The Services
          this.cdr.detectChanges() // Rerenders The HTML
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

  // Function For Format The Date
  private formatDate(date:Date):string {
    const year:number = date.getFullYear() // Gets The Year
    const month:string = String(date.getMonth() + 1).padStart(2, "0") // Gets The Month
    const day:string = String(date.getDate()).padStart(2, "0") // Gets The Day

    return `${year}-${month}-${day}` // Returns The Formatted Date
  }

  constructor(private BookingService:BookingService, private cdr:ChangeDetectorRef) { }

  // Method For Toggle Show / Hide Services Select Menu
  toggleShowServicesSelectMenu():void {
    this.is_services_select_menu_open = !this.is_services_select_menu_open // Shows Or Hides The Services Select Menu
  }

  @ViewChild("selected_service_label", { static: false }) selected_service_label!:ElementRef<HTMLSpanElement> // Gets The Selected Service Label

  // Method For Select The Service
  selectService(id:number, title:string):void {
    this.service_id = id // Sets The Selected Service ID
    this.selected_service_label.nativeElement.textContent = title // Shows The Selected Service Title
    this.toggleShowServicesSelectMenu() // Hides The Services Select Menu
  }

  // Method For Select The Date
  selectDate(event:Event):void {
    const value:string = (event.target as HTMLInputElement).value // Gets The Selected Value

    if(!value) {
      this.slots_data = [] // Removes The Slots Data
      this.selected_slot = null // Removes The Selected Slot
      this.selected_date = "" // Removes The Selected Date
      return
    }

    const formatted_date = value.includes("T") ? value.split("T")[0] : value // Formats The Date

    if(this.slots_data.length > 0 && this.selected_date === formatted_date) return

    this.slots_data = [] // Removes The Slots Data
    this.selected_slot = null // Removes The Selected Slot
    this.selected_date = formatted_date // Sets The Selected Date

    // Gets The Available Slots
    this.BookingService.getAvailableSlots(this.selected_date).subscribe({
      next:(response) => {
        if(response && response.success && response.slots_data) {
          this.slots_data = [...response.slots_data] // Sets The Slots Data
          this.cdr.detectChanges() // Rerenders The HTML
        }
        
        else {
          console.error(response.message) // Shows The Error Message
        }
      },

      error:(error) => {
        console.error(error) // Shows The Error
        alert(error.error?.message || "Pri hľadaní voľných termínov došlo k chybe.") // Shows The Alert
      }
    })
  }

  // Method For Select The Slot
  selectSlot(slot:string):void {
    this.selected_slot = slot // Sets The Selected Slot
  }

  // Method For Confirm The Booking
  confirmBooking():void {
    if(!this.customer.first_name || !this.customer.last_name || !this.customer.phone_number) {
      alert("Prosím, vyplňte všetky kontaktné údaje.") // Shows The Alert
      return
    }

    if(this.selected_slot && this.selected_date !== "") {
      // Creates The Appointment
      this.BookingService.createAppointment(this.customer, this.service_id, this.selected_slot, this.selected_date).subscribe({
        next:(response) => {
          if(response.success) {
            alert(response.message) // Shows The Alert

            this.selected_slot = null // Removes The Selected Slot

            this.customer.first_name = "" // Removes The Customer's First Name
            this.customer.last_name = "" // Removes The Customer's Last Name
            this.customer.phone_number = "" // Removes The Customer's Phone Number
            
            this.reloadSlots() // Reloads The Slots
          }
          
          else {
            console.error(response.message) // Shows The Error Message
          }
        },
  
        error:(error) => {
          console.error(error) // Shows The Error
          alert(error.error?.message || "Pri vytváraní rezervácie nastala chyba.") // Shows The Alert
        }
      })
    }
  }

  // Method For Reload The Slots
  private reloadSlots():void {
    if(this.selected_date) {
      // Gets The Available Slots
      this.BookingService.getAvailableSlots(this.selected_date).subscribe({
        next:(response) => {
          if(response.success) {
            if(response && response.success && response.slots_data) {
              this.slots_data = [...response.slots_data] // Sets The Slots Data
              this.cdr.detectChanges() // Rerenders The HTML
            }
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
  }
}