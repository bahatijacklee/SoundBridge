You are a world-class full-stack product builder, creative director, and UI/UX designer.

Build a premium modern dental clinic website with a real booking system and a secure admin dashboard.

The final result should feel like it was designed by a top-tier healthcare design agency and built as a real production-ready product.

Do not create a generic template.
Do not create a basic admin panel.
Do not make small visual improvements.
Create a complete, polished, premium dental clinic experience from the first version.

Tech stack:
- React
- TypeScript
- Vite
- Supabase for database, backend, and auth

================================================
SUPABASE CONNECTION
================================================

Use these Supabase credentials:

VITE_SUPABASE_URL=PASTE_YOUR_SUPABASE_URL_HERE
VITE_SUPABASE_ANON_KEY=PASTE_YOUR_PUBLISHABLE_KEY_HERE

Rules:
- Use these values as environment variables
- Do not hardcode them inside components
- Create the Supabase client in src/lib/supabase.ts
- Use import.meta.env.VITE_SUPABASE_URL and import.meta.env.VITE_SUPABASE_ANON_KEY

================================================
DATABASE SCHEMA
================================================

Use this exact schema. Do not rename fields or invent new ones.

services:
- id
- name
- description
- duration_minutes
- price
- is_active
- created_at

appointments:
- id
- full_name
- email
- phone
- service_id
- appointment_date
- start_time
- end_time
- status
- notes
- created_at

business_hours:
- id
- weekday
- is_open
- start_time
- end_time

blocked_dates:
- id
- blocked_date
- reason
- created_at

clinic_settings:
- id
- clinic_name
- clinic_email
- clinic_phone
- clinic_address
- slot_interval_minutes
- booking_notice_hours
- created_at

admin_users:
- id
- user_id
- created_at

Important:
- Use clinic_settings for clinic business information.
- Use clinic_name, clinic_email, clinic_phone, and clinic_address.
- Do not use dental_settings.
- Do not use salon_settings.
- Do not use barbershop_settings.
- Do not use spa_settings.
- Do not use trainer_settings.
- Do not use coaching_settings.
- Use admin_users.user_id to check admin access.
- Do not check admin access by email.
- Do not use fake local authentication.
- Do not use fake local data.
- Do not rename any table or field.

================================================
PROJECT GOAL
================================================

Create a complete dental clinic booking website where visitors can:
- view dental services
- select a service
- select a date
- see available time slots
- enter their details
- submit a real appointment request
- see a success confirmation

Create a secure admin dashboard where the clinic owner or dental office manager can manage:
- appointments
- services
- business hours
- blocked dates
- clinic settings

Everything in the dashboard should be useful and editable, not just displayed.

================================================
CREATIVE DIRECTION
================================================

This project must look premium from the first version.

Think like a world-class healthcare creative director.

The public website should feel:
- premium
- modern
- clean
- bright
- calm
- trustworthy
- refined
- professional
- patient-friendly
- polished
- realistic for a premium local dental clinic

The dashboard should feel:
- premium
- clean
- modern
- product-like
- organized
- smooth
- easy for a dental office manager to use
- visually polished, not basic

Design quality expectations:
- Avoid generic or template-like design
- Avoid flat and empty layouts
- Avoid boring sections
- Avoid weak spacing
- Avoid basic AI-generated landing page patterns
- Do not make the public website look like a simple template
- Do not make the admin dashboard look like a basic starter dashboard
- Keep the design medical and professional, but still visually impressive
- Do not make it look like a fashion website, spa website, or generic SaaS landing page

================================================
VISUAL DESIGN SYSTEM
================================================

Use a premium dental clinic visual style:

- clean white, soft off-white, and pale blue backgrounds
- refined teal, aqua, mint, blue, soft green, and blue-gray accents
- deep navy or charcoal text
- clean healthcare-inspired contrast
- polished medical cards
- refined borders
- soft shadows
- layered visuals
- subtle gradients
- soft lighting effects
- calm depth
- premium buttons
- clean icons
- high-quality dental clinic imagery

Use depth, gradients, lighting, and layered visuals where appropriate.
Avoid flat backgrounds.
Create clear contrast and strong hierarchy.
Make the interface feel intentionally designed, not assembled from default components.

Typography:
- improve hierarchy and readability
- make headings strong, premium, and trustworthy
- use modern, elegant, readable typography
- avoid overly decorative fonts
- dashboard should stay clean, readable, and product-like

Layout:
- improve spacing and composition
- use modern section layouts
- introduce tasteful asymmetry where appropriate
- avoid rigid boring sections
- every section should feel intentionally designed

Interactions:
- add smooth animations and micro-interactions
- enhance hover effects and transitions
- make the experience feel polished and alive
- keep interactions calm and professional, not distracting

================================================
IMAGE AND VISUAL STORYTELLING REQUIREMENTS
================================================

The public website must use strong, high-quality, niche-specific dental imagery from the first version.

Do not create a premium layout with no images.
Do not rely only on icons, gradients, or abstract shapes.
Use real, relevant imagery in the right places to make the site feel complete, trustworthy, clean, and premium.

Image style:
- premium dental clinic photography
- clean modern healthcare environment
- bright natural or clinical lighting
- calm professional mood
- modern treatment room
- friendly dentist consultation
- patient-friendly atmosphere
- reception area
- clean dental tools shown tastefully
- refined and realistic
- good cropping
- consistent visual style across the website

Good image subjects:
- modern dental clinic interior
- dentist consulting with patient
- dental professional in a clean treatment room
- patient smiling naturally
- dental chair and modern clinic environment
- clean dental tools, not graphic
- reception or waiting area
- friendly dental team
- calm consultation moment

Do not use:
- graphic dental procedure imagery
- scary dental imagery
- blood, injury, pain, or uncomfortable visuals
- overly clinical hospital imagery
- spa imagery
- barbershop imagery
- hair salon imagery
- restaurant imagery
- fitness imagery
- low-resolution images
- awkward stock photos
- broken image links
- random model portraits unrelated to dental care

Implementation:
- Use reliable external image URLs if needed.
- Prefer high-quality Unsplash-style imagery or other stable image sources.
- Make sure image links actually load.
- Use descriptive alt text.
- Use object-fit: cover and intentional cropping.
- Keep the layout responsive.
- If an image fails, the layout should still look good.
- Keep images easy to replace later by storing image URLs in a clear data structure, config object, or component-level constants.

Every image should support the dental clinic brand, improve trust, and make the section feel more premium.

================================================
BRAND DIRECTION
================================================

Use dental and healthcare-specific language:
- Dental Clinic
- Dentist
- Dental Care
- Patient
- Appointment
- Service
- Checkup
- Cleaning
- Whitening
- Filling
- Consultation
- Oral Health
- Smile Care
- Book your appointment
- Schedule your visit

Do not use:
- coaching
- trainer
- workout
- spa
- massage
- barbershop
- barber
- haircut
- restaurant
- reservation
- table
- salon
- stylist

Avoid unrealistic medical claims.
Do not promise guaranteed results.
Do not use fear-based dental messaging.
Do not use scary dental language.
Focus on trust, comfort, clarity, prevention, smile confidence, cleanliness, and professional care.

================================================
PUBLIC WEBSITE
================================================

Create:
- Navbar
- Hero section
- Services section
- About section
- Booking section
- Success confirmation screen
- Footer

Public website requirements:
- Load real services from the services table.
- Only show active services on the public website.
- Use clinic_settings for clinic name, email, phone, and address when available.
- Make the booking section polished and easy to follow.
- Use strong dental-specific imagery throughout the public website.
- The site should look like a real premium dental clinic website, not a simple template.

================================================
PUBLIC WEBSITE QUALITY EXPECTATIONS
================================================

Navbar:
- refined and premium
- clean dental brand presence
- elegant spacing
- polished booking CTA

Hero:
- visually striking and premium
- must include a strong, relevant dental clinic visual
- use imagery such as modern clinic interior, dentist consultation, clean treatment room, or friendly dental care setting
- use image overlays, gradients, lighting, or layered composition for depth
- maintain strong text readability
- strong headline hierarchy
- calm and trustworthy supporting text
- polished CTA buttons
- not generic
- not flat
- not basic

Services:
- should not look like a plain list
- make services feel premium, clean, and visually engaging
- use strong layout, refined typography, beautiful spacing, and polished cards or premium list design
- include relevant visual treatment for services
- service cards should include niche-relevant images or image areas where appropriate
- show service name, description, duration, price, and booking affordance
- services should be dynamic from Supabase

Suggested image direction for services:
- Dental Checkup: dentist consultation or clean exam room
- Teeth Cleaning: clean dental tools or calm dental care visual
- Teeth Whitening: bright smile care visual, not exaggerated
- Tooth Filling: professional dental care environment, not graphic
- Emergency Consultation: calm consultation or clinic reception
- Cosmetic Consultation: smile consultation or modern clinic detail

Keep service images consistent in crop, quality, and style.
Do not use scary or graphic dental images.

About:
- calm, professional, and intentional
- visually balanced
- should reinforce trust, comfort, experience, cleanliness, and care
- include a strong dental-related image or layered visual
- avoid awkward empty layouts

Booking:
- polished and product-like
- easy to follow
- clear steps
- strong selected states
- premium time slot UI
- clean patient details form
- clear appointment summary
- elegant success state
- may include subtle supporting imagery or visual accents, but do not make the booking form harder to use

Footer:
- refined
- premium
- consistent with the brand
- use clinic settings where relevant

================================================
BOOKING FLOW
================================================

Step 1:
Select a dental service

Step 2:
Select a date and available time

Step 3:
Enter:
- full name
- email
- phone
- optional notes

Step 4:
Show a success confirmation with appointment summary

Booking UI should include:
- clear step indicator
- nice selected states
- clean date selection
- polished time slots
- appointment summary
- strong CTA buttons

================================================
AVAILABILITY LOGIC
================================================

Available time slots must be generated using:

- business_hours
- services.duration_minutes
- clinic_settings.slot_interval_minutes
- clinic_settings.booking_notice_hours
- blocked_dates
- existing appointments

Rules:
- Only show slots inside working hours
- Skip blocked dates
- Skip overlapping appointments
- Ignore cancelled appointments
- Respect booking notice time
- Use the selected service duration to calculate end_time
- New active services added from the dashboard must work in the booking flow

Overlap rule:
new_start < existing_end AND new_end > existing_start

All slots should be normalized as:

{
  start: Date,
  end: Date,
  label: string
}

Time safety:
- Only format real Date objects
- Never pass invalid strings to format()
- Never use strings like "yyyy-MM-ddT10:30:00"
- Always combine the selected date and time correctly
- Save appointment_date as a Supabase-compatible date
- Save start_time and end_time as Supabase-compatible time values

================================================
ADMIN AUTH
================================================

Create a real admin login using Supabase Auth.

Admin login flow:
1. Admin enters email and password.
2. Sign in with supabase.auth.signInWithPassword().
3. If login fails, show a clear error message.
4. After successful sign in, get the authenticated user.
5. Use the authenticated user's id.
6. Check if user.id exists in admin_users.user_id.
7. If the user exists in admin_users, allow access to dashboard.
8. If the user is authenticated but not found in admin_users, show:
   "You are signed in, but you are not authorized as an admin."
9. Add a loading state while checking session and admin access.
10. Do not redirect back to login before the admin check finishes.

Rules:
- Protect all admin routes.
- Public website should stay accessible without login.
- Do not check admin access by email.
- Do not use fake local authentication.
- Do not rely only on hiding buttons.
- Do not use clinic_settings for admin authentication.
- Do not use services or appointments for admin authentication.
- Admin access is only controlled by admin_users.user_id.

Important:
- The admin_users table contains user_id values from Supabase Auth.
- The login email and password belong to a Supabase Auth user.
- After login, always compare auth.user.id with admin_users.user_id.
- Do not compare user.email with anything in admin_users.

================================================
ADMIN DASHBOARD
================================================

Create a complete dashboard with these pages:

1. Overview
2. Appointments
3. Services
4. Business Hours
5. Blocked Dates
6. Clinic Settings

The dashboard must feel like a polished premium product dashboard, not a basic admin template.

Dashboard visual requirements:
- refined sidebar
- polished page headers
- beautiful cards
- clean tables
- premium forms
- clear modals or drawers
- elegant buttons
- refined badges
- smooth hover states
- good empty states
- strong spacing and hierarchy
- consistent design system

1. Overview:
- show useful stats
- upcoming appointments
- pending appointments
- completed appointments
- active services
- use polished metric cards and useful layout

2. Appointments:
- show all appointments from Supabase
- show patient name, service, date, time, phone, email, status, and notes
- allow filtering by status
- allow updating status:
  - pending
  - confirmed
  - cancelled
  - completed
- make appointment tables/cards clean, readable, and premium

3. Services:
This page must be fully manageable, not read-only.

The admin must be able to:
- add new services
- edit existing services
- activate services
- deactivate services

Each service row should have clear actions.

Service fields:
- name
- description
- duration_minutes
- price
- is_active

Important:
- Existing services must have an Edit action.
- Editing should open a polished pre-filled form, modal, drawer, or panel.
- Saving should update the service in Supabase.
- Inactive services should stay visible in the admin dashboard.
- Inactive services should not appear on the public booking page.
- Prefer deactivate instead of hard delete because appointments can reference services.
- New or updated active services must appear automatically in the booking flow.

4. Business Hours:
- allow editing each weekday
- allow open/closed days
- allow editing start_time and end_time
- changes must affect available booking slots
- make the editor clear and easy to use

5. Blocked Dates:
- allow adding blocked dates
- allow removing blocked dates
- show reason
- blocked dates must prevent bookings
- make the interface simple and polished

6. Clinic Settings:
Allow editing:
- clinic_name
- clinic_email
- clinic_phone
- clinic_address
- slot_interval_minutes
- booking_notice_hours

Updated clinic settings should appear on the public website where relevant.

================================================
QUALITY REQUIREMENTS
================================================

- Full working app
- Clean code structure
- Supabase fully connected
- Booking flow working
- Admin login working
- Protected dashboard working
- Services management fully working
- Appointments management working
- Business hours editing working
- Blocked dates working
- Clinic settings editing working
- Public website uses high-quality dental-specific imagery
- Hero section includes a strong relevant dental visual
- Services section includes relevant niche-specific visual treatment or images
- About section includes authentic dental clinic imagery or visual storytelling
- Images are properly cropped, responsive, and not broken
- Image URLs are easy to replace later
- No placeholder fake data
- No disconnected dashboard pages
- No read-only admin pages where editing is expected
- Premium dental clinic visual direction from the start
- Public website should feel top-tier, not template-like
- Dashboard should feel like a polished premium product
- Admin auth must work using Supabase Auth user.id and admin_users.user_id
- Keep functionality and visual quality strong from the first version

FINAL RESULT:
Create a complete, working, premium dental clinic booking platform with a high-end public website, strong niche-specific imagery, working admin login, and a polished admin dashboard.
