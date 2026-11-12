/*****************************************************
 Site Config
 Everything that changes between barbershops (name,
 contacts, address, socials, map). Edit this file to
 re-brand the website for a new client.
*****************************************************/

export interface SocialLink {
  label:string,
  url:string,
  icon:string // Font Awesome Class (https://fontawesome.com/icons)
}

export interface PaymentMethod {
  label:string,
  image:string // Path Inside `public/`
}

export interface HeroContent {
  eyebrow:string, // Small Label Above The Headline
  title:string, // First Line Of The Headline
  title_accent:string, // Second Line, Shown In Italic Brass
  description:string,
  image:string|null // Background Photo Inside `public/` (e.g. "images/hero.jpg"), Null Uses The Built-In Gradient Backdrop
}

export interface SiteConfig {
  name:string,
  logo:string|null, // Path Inside `public/` (e.g. "images/logo.svg"), Null Shows A Text Wordmark Instead
  tagline:string,
  description:string, // Used For The Meta Description And Social Previews
  language:string,
  hero:HeroContent,

  address:{
    street:string,
    postal_code:string,
    city:string,
    country:string
  },

  contact:{
    email:string,
    phone:string, // E.164 Format For `tel:` Links
    phone_display:string
  },

  socials:SocialLink[],
  payment_methods:PaymentMethod[],
  map_embed_url:string // Google Maps → Share → Embed A Map → `src` Of The Iframe
}

export const SITE_CONFIG:SiteConfig = {
  name: "Barbershop",
  logo: null,
  tagline: "Precízny strih. Poctivé remeslo.",
  description: "Pánske kaderníctvo a barbershop v Bratislave. Strihy, úprava brady a holenie – rezervujte si termín online.",
  language: "sk",

  hero: {
    eyebrow: "Pánsky barbershop · Bratislava",
    title: "Precízny strih.",
    title_accent: "Poctivé remeslo.",
    description: "Klasické aj moderné pánske strihy, úprava brady a holenie britvou. Rezervujte si termín online – zaberie to menej ako minútu.",
    image: null
  },

  address: {
    street: "Mlynské nivy 5/A",
    postal_code: "821 08",
    city: "Bratislava",
    country: "Slovensko"
  },

  contact: {
    email: "behulpatrik@gmail.com",
    phone: "+421940322633",
    phone_display: "+421 940 322 633"
  },

  socials: [
    { label: "Instagram", url: "https://www.instagram.com/", icon: "fa-brands fa-instagram" },
    { label: "Facebook", url: "https://www.facebook.com/", icon: "fa-brands fa-facebook" },
    { label: "TikTok", url: "https://www.tiktok.com/", icon: "fa-brands fa-tiktok" }
  ],

  payment_methods: [
    { label: "Visa", image: "images/visa.png" },
    { label: "Mastercard", image: "images/mastercard.png" },
    { label: "American Express", image: "images/amex.png" },
    { label: "Discover", image: "images/discover.png" },
    { label: "Diners Club", image: "images/diners_club.png" },
    { label: "JCB", image: "images/jcb.png" }
  ],

  map_embed_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d170411.37760859914!2d16.950700206516654!3d48.135737106169756!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476c89360aca6197%3A0x631f9b82fd884368!2sBratislava!5e0!3m2!1sen!2ssk!4v1784274678048!5m2!1sen!2ssk"
}
