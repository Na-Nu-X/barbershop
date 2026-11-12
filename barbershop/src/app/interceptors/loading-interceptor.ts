import { HttpInterceptorFn } from "@angular/common/http"
import { inject } from "@angular/core"
import { finalize } from "rxjs/operators"
import { Loading } from "../services/loading"

// Shows The Global Preloader For The Lifetime Of Every HTTP Request (Success, Error Or Cancel)
export const loadingInterceptor:HttpInterceptorFn = (req, next) => {
  const LoadingService = inject(Loading)

  LoadingService.show()

  return next(req).pipe(
    finalize(() => LoadingService.hide())
  )
}
