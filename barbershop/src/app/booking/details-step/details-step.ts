import { Component, inject, signal } from "@angular/core"
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import { BookingStore } from "../booking-store"
import { BookingSummary } from "../booking-summary/booking-summary"
import { Button } from "../../shared/button/button"

export const PHONE_NUMBER_PATTERN:RegExp = /^\+?[0-9][0-9 ()/-]{5,18}$/ // Same Rule As The Back-End

type FieldName = "first_name" | "last_name" | "phone_number"

// Step 3: Contact Details And Final Confirmation
@Component({
  selector: "app-details-step",
  imports: [ReactiveFormsModule, BookingSummary, Button],
  templateUrl: "./details-step.html",
  styleUrl: "./details-step.scss"
})
export class DetailsStep {
  protected readonly store = inject(BookingStore)

  protected readonly submitted = signal<boolean>(false) // Errors Show After The First Submit Attempt (Or Once A Field Is Left)

  protected readonly form = new FormGroup({
    first_name: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.maxLength(20)] }),
    last_name: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] }),
    phone_number: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.pattern(PHONE_NUMBER_PATTERN)] })
  })

  // Method For Get The Error Message Of A Field, Or Null
  protected error(field:FieldName):string|null {
    const control = this.form.controls[field]

    if(control.valid || !(control.touched || this.submitted())) return null
    if(control.hasError("required")) return "Toto pole je povinné."
    if(control.hasError("maxlength")) return `Najviac ${control.getError("maxlength").requiredLength} znakov.`
    if(control.hasError("pattern")) return "Zadajte platné telefónne číslo, napr. +421 900 123 456."

    return null
  }

  protected submit():void {
    this.submitted.set(true)

    if(this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    const { first_name, last_name, phone_number } = this.form.getRawValue()
    this.store.submit({ first_name: first_name.trim(), last_name: last_name.trim(), phone_number: phone_number.trim() })
  }
}
