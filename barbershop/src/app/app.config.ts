import { ApplicationConfig, LOCALE_ID, provideZonelessChangeDetection } from "@angular/core"
import { provideRouter } from "@angular/router"
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from "@angular/common/http"
import { provideClientHydration } from "@angular/platform-browser"
import { routes } from "./app.routes"
import { registerLocaleData } from "@angular/common"
import localeSk from "@angular/common/locales/sk"
import { LoadingInterceptor } from "./interceptors/loading-interceptor"

registerLocaleData(localeSk, "sk-SK")

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes), 
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: LOCALE_ID, useValue: "sk-SK" },

    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ]
}