import { ApplicationConfig, LOCALE_ID, provideZonelessChangeDetection } from "@angular/core"
import { provideRouter } from "@angular/router"
import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http"
import { provideClientHydration } from "@angular/platform-browser"
import { routes } from "./app.routes"
import { registerLocaleData } from "@angular/common"
import localeSk from "@angular/common/locales/sk"
import { loadingInterceptor } from "./interceptors/loading-interceptor"

registerLocaleData(localeSk, "sk-SK")

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([loadingInterceptor])),
    { provide: LOCALE_ID, useValue: "sk-SK" }
  ]
}