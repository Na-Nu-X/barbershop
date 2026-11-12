import { Injectable, DOCUMENT, inject } from "@angular/core"
import { Meta, Title } from "@angular/platform-browser"
import { SITE_CONFIG } from "../config/site.config"

// Applies The Page Title, Language And Social Meta Tags From The Site Config (Runs During Prerendering Too)
@Injectable({
  providedIn: "root"
})
export class SiteMeta {
  private title = inject(Title)
  private meta = inject(Meta)
  private document = inject(DOCUMENT)

  apply():void {
    const page_title:string = `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`

    this.document.documentElement.lang = SITE_CONFIG.language // Sets The Page Language
    this.title.setTitle(page_title) // Sets The Page Title

    this.meta.updateTag({ name: "description", content: SITE_CONFIG.description })
    this.meta.updateTag({ property: "og:type", content: "website" })
    this.meta.updateTag({ property: "og:site_name", content: SITE_CONFIG.name })
    this.meta.updateTag({ property: "og:title", content: page_title })
    this.meta.updateTag({ property: "og:description", content: SITE_CONFIG.description })
    this.meta.updateTag({ property: "og:locale", content: `${SITE_CONFIG.language}_${SITE_CONFIG.language.toUpperCase()}` })
  }
}
