import { Component, inject } from "@angular/core"
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser"
import { Button } from "../shared/button/button"
import { SITE_CONFIG } from "../config/site.config"

const FULL_ADDRESS:string = `${SITE_CONFIG.address.street}, ${SITE_CONFIG.address.postal_code} ${SITE_CONFIG.address.city}, ${SITE_CONFIG.address.country}`

@Component({
  selector: "app-map",
  imports: [Button],
  templateUrl: "./map.html",
  styleUrl: "./map.scss",
})
export class Map {
  protected readonly site = SITE_CONFIG // Business Details

  // The Embed URL Comes From Our Own Config, So It Is Safe To Trust
  protected readonly map_url:SafeResourceUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(SITE_CONFIG.map_embed_url)

  // Opens Turn-By-Turn Directions In Google Maps (App On Phones), Built From The Address
  protected readonly directions_url:string = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(FULL_ADDRESS)}`
}
