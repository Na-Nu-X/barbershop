import { Component, inject } from "@angular/core"
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser"
import { SITE_CONFIG } from "../config/site.config"

@Component({
  selector: "app-map",
  imports: [],
  templateUrl: "./map.html",
  styleUrl: "./map.scss",
})
export class Map {
  protected readonly site = SITE_CONFIG // Business Details

  // The Embed URL Comes From Our Own Config, So It Is Safe To Trust
  protected readonly map_url:SafeResourceUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(SITE_CONFIG.map_embed_url)
}
