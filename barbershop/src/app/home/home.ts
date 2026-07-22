import { Component } from "@angular/core"
import { Banner } from "../banner/banner"
import { Booking } from "../booking/booking"
import { ContactForm } from "../contact-form/contact-form"
import { Profiles } from "../profiles/profiles"
import { Map } from "../map/map"

@Component({
  selector: "app-home",
  imports: [
    Banner,
    Booking,
    ContactForm,
    Profiles,
    Map
  ],
  templateUrl: "./home.html",
  styleUrl: "./home.scss"
})
export class Home { }