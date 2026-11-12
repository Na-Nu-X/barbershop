import { environment } from "../../environments/environment"

// Builds A Full Back-End URL From An Endpoint Path (e.g. "get-status/")
export function apiUrl(path:string):string {
  return `${environment.apiBaseUrl}/${path.replace(/^\/+/, "")}`
}
