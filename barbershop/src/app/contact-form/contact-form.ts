import { Component, inject, signal } from "@angular/core"
import { toSignal } from "@angular/core/rxjs-interop"
import { HttpErrorResponse } from "@angular/common/http"
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import { Message } from "../services/message"
import { Toast } from "../services/toast"
import { Button } from "../shared/button/button"
import { SectionHeading } from "../shared/section-heading/section-heading"
import { SITE_CONFIG } from "../config/site.config"

export const MESSAGE_MAX_LENGTH:number = 250 // Same Limit As The Back-End

type FieldName = "first_name" | "last_name" | "email_address" | "message"

@Component({
  selector: "app-contact-form",
  imports: [ReactiveFormsModule, Button, SectionHeading],
  templateUrl: "./contact-form.html",
  styleUrl: "./contact-form.scss",
})
export class ContactForm {
  private readonly MessageService = inject(Message)
  private readonly ToastService = inject(Toast)

  protected readonly site = SITE_CONFIG
  protected readonly message_max_length:number = MESSAGE_MAX_LENGTH

  protected readonly is_sending = signal<boolean>(false)
  protected readonly submitted = signal<boolean>(false) // Errors Show After The First Submit Attempt (Or Once A Field Is Left)

  protected readonly form = new FormGroup({
    first_name: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.maxLength(20)] }),
    last_name: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] }),
    email_address: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(50)] }),
    message: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.maxLength(MESSAGE_MAX_LENGTH)] })
  })

  protected readonly message_length = toSignal(this.form.controls.message.valueChanges, { initialValue: "" })

  // Method For Get The Error Message Of A Field, Or Null
  protected error(field:FieldName):string|null {
    const control = this.form.controls[field]

    if(control.valid || !(control.touched || this.submitted())) return null
    if(control.hasError("required")) return "Toto pole je povinné."
    if(control.hasError("email")) return "Zadajte platnú e-mailovú adresu."
    if(control.hasError("maxlength")) return `Najviac ${control.getError("maxlength").requiredLength} znakov.`

    return null
  }

  // Method For Send The Message
  submit():void {
    this.submitted.set(true)

    if(this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    if(this.is_sending()) return

    const value = this.form.getRawValue()
    this.is_sending.set(true)

    this.MessageService.sendMessage({
      first_name: value.first_name.trim(),
      last_name: value.last_name.trim(),
      email_address: value.email_address.trim(),
      message: value.message.trim()
    }).subscribe({
      next:(response) => {
        this.is_sending.set(false)

        if(response.success) {
          this.ToastService.success(response.message)
          this.form.reset()
          this.submitted.set(false)
        }

        else {
          this.ToastService.error(response.message)
        }
      },

      error:(error:HttpErrorResponse) => {
        this.is_sending.set(false)
        this.ToastService.error(error.error?.message || "Pri odosielaní správy došlo k chybe.")
      }
    })
  }
}
