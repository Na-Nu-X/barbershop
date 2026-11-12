import { ChangeDetectorRef, Component, inject } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { Message } from "../services/message"
import { Toast } from "../services/toast"
import { Button } from "../shared/button/button"
import { SectionHeading } from "../shared/section-heading/section-heading"

export interface ContactMessage {
  first_name:string,
  last_name:string,
  email_address:string,
  message:string
}

@Component({
  selector: 'app-contact-form',
  imports: [FormsModule, Button, SectionHeading],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss',
})
export class ContactForm {
  private readonly ToastService = inject(Toast)

  // Stores The Contact Form Data
  contact_form:ContactMessage = {
    first_name: "",
    last_name: "",
    email_address: "",
    message: ""
  }

  constructor(private MessageService:Message, private cdr:ChangeDetectorRef) {}
  
  // Method For Send The Message
  sendMessage(): void {
    // If The Contact Form Isn't Filled
    if (
      !this.contact_form.first_name.trim() ||
      !this.contact_form.last_name.trim() ||
      !this.contact_form.email_address.trim() ||
      !this.contact_form.message.trim()
    ) {
      this.ToastService.error("Prosím, vyplňte všetky povinné kontaktné údaje pre odoslanie správy.") // Shows The Error Toast
      return
    }

    // Sends The Message
    this.MessageService.sendMessage(this.contact_form).subscribe({
      next:(response) => {
        if(response && response.success) {
          this.ToastService.success(response.message) // Shows The Success Toast

          // Clears The Form
          this.contact_form = { 
            first_name: "", 
            last_name: "", 
            email_address: "",
            message: "" 
          }

          this.cdr.detectChanges() // Rerenders The HTML
        }
        
        else {
          this.ToastService.error(response.message) // Shows The Error Toast
        }
      },

      error:(error) => {
        console.error(error) // Shows The Error
        this.ToastService.error("Pri odosielaní správy došlo k chybe.") // Shows The Error Toast
      }
    })
  }
}
