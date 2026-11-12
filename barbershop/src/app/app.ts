import { Component, OnInit, inject } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { NavigationBar } from "./navigation-bar/navigation-bar"
import { Footer } from "./footer/footer"
import { Toasts } from "./shared/toasts/toasts"
import { Loading } from "./services/loading"
import { SiteMeta } from "./services/site-meta"

@Component({
  selector: "app-root",
  imports: [RouterOutlet, NavigationBar, Footer, Toasts],
  templateUrl: "./app.html",
  styleUrl: "./app.scss"
})
export class App implements OnInit {
  protected readonly LoadingService = inject(Loading)

  constructor() {
    inject(SiteMeta).apply() // Sets The Title, Language And Meta Tags
  }

  // Method Which Executes In Beginning
  ngOnInit():void {
    console.log("%cWebsite by Patrik Behul - behulpatrik@gmail.com", "color: rgb(170, 255, 50); background-color: rgb(0, 0, 0)") // Secret Message
  }
}
