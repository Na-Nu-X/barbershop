import { Component } from "@angular/core"
import { SITE_CONFIG } from "../config/site.config"

@Component({
  selector: "app-footer",
  imports: [],
  templateUrl: "./footer.html",
  styleUrl: "./footer.scss"
})
export class Footer {
  protected readonly site = SITE_CONFIG // Business Details
  protected readonly year:number = new Date().getFullYear() // Current Year For The Copyright
}
