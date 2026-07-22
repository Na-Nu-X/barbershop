import { 
  Component, 
  HostListener, 
  afterNextRender, 
  ChangeDetectorRef
} from "@angular/core"

import { 
  AsyncPipe, 
  CurrencyPipe,
  CommonModule
} from "@angular/common"

import { FormsModule } from "@angular/forms"
import { Observable } from "rxjs"

@Component({
  selector: "app-navigation-bar",
  imports: [AsyncPipe, CurrencyPipe, CommonModule, FormsModule],
  templateUrl: "./navigation-bar.html",
  styleUrl: "./navigation-bar.scss",
})

export class NavigationBar {
  is_open:boolean = false // Stores The Information If The Menu Is Open
  is_scrolled:boolean = false  // Stores The Information If The Page Is Scrolled
  cart_amount$!:Observable<number>
  current_index:number = 0 // Stores The Current Index Of The Active Item
  
  constructor(private cdr:ChangeDetectorRef) {
    afterNextRender(() => {
      this.checkWindowWidth(window.innerWidth)
      this.onWindowScroll()
    })
  }

  // Method For Toggle The Menu
  toggleMenu():void {
    this.is_open = !this.is_open // Shows / Hides The Menu
  }

  // Window Scroll Functionality
  @HostListener("window:scroll", [])
  onWindowScroll():void {
    if(typeof window !== "undefined") {
      this.is_scrolled = window.scrollY > 50 // Updates The Information If The Page Is Scrolled
    }
  }

  // Window Resize Functionality
  @HostListener("window:resize", ["$event"])
  onResize(event:any):void {
    this.checkWindowWidth(event.target.innerWidth)
  }

  // Method For Check The Window Width
  private checkWindowWidth(width:number):void {
    if(width > 600) {
      this.is_open = false // Hides The Menu
    }
  }

  scrollTo(selector:string):void {
    if(typeof document !== "undefined") {
      const element:HTMLElement|null = document.querySelector(selector) as HTMLElement || null // Gets The Element

      if(element) {
        let offset:number = 60 // Stores The Offset
        
        if(element.classList.contains("booking_container")) offset = 60 + 20 + 10 // Sets The Offset (Navigation Bar + Padding)
        if(element.classList.contains("contact_form")) offset = 60 + 20 + 10 // Sets The Offset (Navigation Bar + Padding)

        const element_position:number = element.getBoundingClientRect().top + window.scrollY // Gets The Element's Position

        window.scrollTo({ top: element_position - offset, behavior: "smooth" }) // Starts The Scroll Animation
      }
    }
  }
}