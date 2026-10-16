# DESIGN A COMPLETE SPRINT 1 UI/UX — ILLUMINE ENGLISH LEARNING MANAGEMENT SYSTEM

Design a complete, modern, responsive web-based English Learning Management System (ELMS) for **Illumine English Institute, Sri Lanka**.

This is a **university software engineering/project management project**, and the UI must be designed according to the Sprint 1 requirements below.

The design should look like a **real production-ready English learning platform**, not a generic student dashboard or template.

---

## 1. PROJECT CONTEXT

Illumine English Institute provides English education for students from **Grade 1–11**, together with special English courses such as:

* Grammar Galaxy
* Brave Voice
* Tini Voice

The current institute processes rely heavily on:

* WhatsApp
* Phone calls
* Excel sheets
* Facebook
* Manual student records
* Manual payment/order tracking

The proposed system centralizes these activities into one web-based platform.

The UI should make the complete process simple:

**Register → Browse Courses → Enroll → View Classes → Join Online Class → Read Announcements → Browse Books → Place Order → Track Order → Make Payment → View Payment Status**

---

# 2. SPRINT 1 SCOPE

Design UI screens for ALL 12 Sprint 1 user stories.

There are 4 epics, with 3 user stories from each epic.

### EP01 — Student Registration & Course Enrollment

**US01 – Create Student Account**

**US02 – View Available Courses**

**US03 – Enroll in a Selected Course**

### EP02 — Class Schedule & Communication Management

**US06 – View Class Schedule**

**US07 – Access Online Class Links**

**US09 – Publish Announcements**

### EP03 — Book Order Management

**US11 – View Available Books**

**US12 – Place a Book Order**

**US13 – View Order Status**

### EP04 — Payment Management

**US16 – Initiate a Payment**

**US17 – View Payment Status**

**US19 – View Payment Records**

Every one of these user stories must have a corresponding UI.

---

# 3. DESIGN STYLE

Create a:

* Modern
* Premium
* Clean
* Friendly
* Professional
* Education-focused
* Slightly playful but mature
* Responsive
* Accessible

visual style.

The system should feel like a combination of a modern education platform and a professional institute management system.

Avoid:

* Generic Bootstrap-style dashboards
* Old-fashioned school websites
* Excessive gradients
* Neon colours
* Excessive glassmorphism
* Overly complicated layouts
* Huge unnecessary illustrations
* Too many decorative elements

Use:

* Clean white/light backgrounds
* Rounded cards
* Soft shadows
* Good spacing
* Modern typography
* Clear hierarchy
* Professional icons
* Subtle gradients only where appropriate
* Small micro-interactions
* Smooth transitions
* Attractive empty states
* Friendly illustrations where useful

---

# 4. BRANDING

Use the **actual Illumine English Institute logo** provided by the user.

Do NOT create a replacement logo.

Preserve the logo's:

* Original proportions
* Shape
* Typography
* Identity

Use the logo colours as the main inspiration for the UI colour system.

Create reusable design tokens:

### Primary

Derived from Illumine logo.

### Secondary

A complementary colour derived from the logo.

### Accent

Used for buttons, highlights and important actions.

### Neutral

Use professional whites, light greys, dark text and subtle borders.

The final design should visually feel like one consistent Illumine brand.

---

# 5. DESIGN SYSTEM

Create a reusable Figma design system.

Include:

### Typography

Use a modern readable font such as:

* Inter
* Poppins
* Manrope

Use clear typography hierarchy:

* Display
* H1
* H2
* H3
* Body
* Small
* Caption

### Components

Create reusable components for:

* Primary button
* Secondary button
* Outline button
* Danger button
* Icon button
* Input field
* Password field
* Search field
* Dropdown
* Date picker
* Checkbox
* Radio button
* Toggle
* Tabs
* Badges
* Status pills
* Course cards
* Book cards
* Announcement cards
* Schedule cards
* Payment cards
* Order cards
* Modal
* Confirmation dialog
* Toast notification
* Sidebar
* Navbar
* Footer
* Pagination
* Empty state
* Loading skeleton
* Error state

Create component variants where appropriate.

---

# 6. USER ROLES

Design interfaces for these roles:

### STUDENT

Main student user.

### ADMIN

Institute management/admin staff.

### TEACHER

Teacher/class-related interface where needed.

The Sprint 1 presentation should mainly demonstrate the **Student and Admin flows**.

---

# 7. PUBLIC WEBSITE

Create a beautiful public landing page.

### Header

Include:

* Illumine logo
* Home
* Courses
* About
* Books
* Announcements
* Login
* Register

Primary CTA:

**Start Learning**

### Hero Section

Use the message:

**Learn English. Build Confidence. Grow with Illumine.**

Supporting text should communicate that students can learn English, manage courses, classes, books and payments through one platform.

Include:

* Attractive education-related visual
* Student/learning illustration
* CTA buttons
* Subtle animation concept

Buttons:

**Explore Courses**

**Create Account**

### Courses Preview

Show several realistic courses.

Example:

* Grade 5 English
* Grade 8 English
* Grade 10 English
* Grammar Galaxy
* Brave Voice
* Tini Voice

### Why Choose Illumine?

Cards for:

* Experienced Teachers
* Interactive Learning
* Online Classes
* Learning Resources
* Easy Course Management
* Student Support

### How It Works

Show:

1. Create Account
2. Choose Course
3. Enroll
4. Join Classes
5. Learn & Grow

### Books Section

Show learning books/materials available for students.

### Announcements Preview

Show latest institute announcements.

### Footer

Include:

* Illumine logo
* Quick links
* Courses
* Contact
* Social media placeholders
* Copyright

---

# 8. AUTHENTICATION UI

Create:

## Login Page

Fields:

* Email
* Password

Actions:

**Login**

**Forgot Password?**

**Create Account**

Include a visually attractive education-related side panel.

---

## Registration Page — US01

Create a complete student registration form.

Fields:

* Full Name
* Email
* Phone Number
* Password
* Confirm Password
* Date of Birth
* Grade
* Guardian Name
* Guardian Phone
* Address
* Profile Image

Include:

* Field validation states
* Required field indicators
* Password strength indicator
* Error messages
* Success state

CTA:

**Create Account**

After successful registration show:

**Account created successfully**

---

# 9. STUDENT DASHBOARD

Create a modern student dashboard.

Header:

* Illumine logo
* Search
* Notifications
* Student profile/avatar

Sidebar:

* Dashboard
* My Profile
* Courses
* My Enrollments
* Class Schedule
* Announcements
* Books
* My Orders
* Payments
* Logout

Dashboard content:

### Welcome Card

Example:

**Welcome back, Ayesha!**

**Ready to continue your English learning journey?**

### Statistics

Cards:

* Enrolled Courses
* Upcoming Classes
* Pending Orders
* Pending Payments

### Upcoming Class

Show:

* Course
* Teacher
* Date
* Time
* Mode
* Join button

### Latest Announcements

Show recent announcements.

### Recent Orders

Show latest book orders.

### Quick Actions

* Browse Courses
* View Schedule
* Browse Books
* Make Payment

---

# 10. US02 — AVAILABLE COURSES

Create a complete course catalogue.

Page title:

**Explore Courses**

Include:

* Search
* Grade filter
* Course category filter
* Class type filter
* Price sorting
* Availability filter

Course cards should show:

* Course image
* Course name
* Grade
* Teacher
* Duration
* Class type
* Schedule
* Monthly fee
* Available seats
* Status

Use **Sri Lankan Rupees (LKR)**.

Examples:

**Rs. 3,500 / month**

**Rs. 4,000 / month**

Do not use USD.

Buttons:

**View Details**

**Enroll Now**

---

# 11. COURSE DETAILS

Create a detailed course page.

Include:

* Course image
* Course title
* Description
* Grade
* Teacher
* Duration
* Schedule
* Online/Physical mode
* Monthly fee
* Available seats
* What students will learn
* Course information
* Teacher information

CTA:

**Enroll Now**

---

# 12. US03 — COURSE ENROLLMENT

Create enrollment confirmation UI.

When the student clicks Enroll:

Show confirmation modal/page.

Display:

* Student name
* Course
* Teacher
* Schedule
* Monthly fee
* Enrollment information

CTA:

**Confirm Enrollment**

After success:

Show:

**Enrollment Successful!**

Generate reference:

**ENR-2026-0001**

Provide buttons:

**View My Courses**

**View Schedule**

Prevent duplicate enrollment.

---

# 13. US06 — CLASS SCHEDULE

Create a beautiful schedule page.

Page title:

**My Class Schedule**

Provide:

* Calendar view
* List view
* Upcoming classes
* Previous classes

Each class card should show:

* Course
* Teacher
* Date
* Day
* Start time
* End time
* Mode
* Class status

Example:

**Grade 10 English**

Teacher: Ms. Nadeesha Perera

Saturday

4:00 PM – 5:30 PM

Online

Status:

**Upcoming**

---

# 14. US07 — ONLINE CLASS LINKS

For online classes show a clear:

**Join Online Class**

button.

Show:

* Course
* Teacher
* Date
* Time
* Online platform
* Join link
* Class status

Use realistic examples such as:

* Google Meet
* Zoom

The UI should clearly communicate that the student is joining an online class.

Do not design a fake embedded video meeting.

---

# 15. US09 — ANNOUNCEMENTS

### Student Announcement Page

Create:

**Announcements**

Show announcement cards containing:

* Title
* Description
* Category
* Date
* Priority
* Target audience
* Read/unread state

Categories:

* General
* Class
* Exam
* Payment
* Course
* Holiday

Example announcement:

**Grade 10 English Revision Class**

"An additional revision session will be conducted this Saturday."

---

# 16. ADMIN DASHBOARD

Create a professional admin dashboard.

Sidebar:

* Dashboard
* Students
* Courses
* Classes
* Announcements
* Books
* Orders
* Payments
* Reports
* Settings
* Logout

Dashboard statistics:

* Total Students
* Active Courses
* Upcoming Classes
* Pending Orders
* Pending Payments
* Total Revenue

Use charts where appropriate.

Charts should be simple and readable.

Examples:

* Enrollment overview
* Payment overview
* Orders overview

---

# 17. ADMIN — PUBLISH ANNOUNCEMENT — US09

Create an admin announcement management page.

Button:

**Create Announcement**

Form:

* Announcement Title
* Description
* Category
* Target Audience
* Publish Date
* Expiry Date
* Priority
* Status

Target audience:

* All Students
* Grade 1–5
* Grade 6–9
* Grade 10–11
* Specific Course

Buttons:

**Save Draft**

**Publish Announcement**

Show success notification:

**Announcement published successfully**

---

# 18. US11 — BOOK CATALOGUE

Create:

**Learning Books & Materials**

Show book cards.

Each book should contain:

* Book cover
* Title
* Author/Publisher
* Grade
* Category
* Description
* Price
* Stock
* Availability

Use LKR.

Example:

**Rs. 2,500**

Buttons:

**View Details**

**Add to Cart**

Include:

* Search
* Grade filter
* Category filter
* Price sorting
* Availability filter

---

# 19. BOOK DETAILS

Create detailed book page.

Include:

* Large book cover
* Title
* Author
* Publisher
* Grade
* Description
* Price
* Stock availability
* Quantity selector

CTA:

**Add to Cart**

---

# 20. US12 — PLACE BOOK ORDER

Create the complete ordering flow.

### Step 1 — Cart

Show:

* Book
* Quantity
* Unit price
* Subtotal
* Remove button

### Step 2 — Delivery / Collection

Fields:

* Student name
* Phone number
* Address
* Delivery or Collection

Options:

**Home Delivery**

**Institute Collection**

### Step 3 — Order Summary

Show:

* Items
* Subtotal
* Delivery fee
* Total

Use LKR.

Example:

Subtotal: Rs. 5,000

Delivery: Rs. 350

Total: Rs. 5,350

### Step 4 — Confirm Order

CTA:

**Place Order**

After success:

**Order placed successfully**

Generate:

**ORD-2026-0001**

---

# 21. US13 — ORDER STATUS

Create:

**My Orders**

Show order cards/table.

Display:

* Order number
* Order date
* Items
* Total
* Delivery/collection method
* Current status

Status lifecycle:

1. Pending
2. Confirmed
3. Preparing
4. Ready for Collection
5. Out for Delivery
6. Delivered
7. Cancelled

Create a visual order tracking timeline.

Example:

**ORD-2026-0001**

✓ Order Placed

✓ Confirmed

✓ Preparing

○ Out for Delivery

○ Delivered

Use status badges and clear visual hierarchy.

---

# 22. US16 — INITIATE PAYMENT

Create payment UI.

The system must support payment records using a safe payment workflow/simulation for Sprint 1.

Do NOT design or claim a real bank/payment gateway integration unless one is actually available.

Payment screen should show:

### Payment For

* Course enrollment OR
* Book order

Display:

* Reference number
* Description
* Amount
* Payment date
* Payment method

Payment methods:

* Bank Transfer
* Card
* Online Payment
* Cash

CTA:

**Proceed with Payment**

Then show a confirmation/payment processing state.

---

# 23. US17 — PAYMENT STATUS

Create:

**Payment Status**

Show payment card:

Payment reference:

**PAY-2026-0001**

Amount:

**Rs. 3,500**

Related to:

**Grade 10 English**

Status:

**Paid**

Possible statuses:

* Pending
* Processing
* Paid
* Failed
* Refunded

Use clear status badges.

Create different UI states for:

* Pending
* Processing
* Success
* Failed
* Refunded

---

# 24. US19 — PAYMENT RECORDS

Create:

**My Payments**

Show payment history.

Columns/cards:

* Payment reference
* Date
* Description
* Amount
* Payment method
* Status

Include:

* Search
* Filter by status
* Filter by date
* Filter by payment method

Admin should also have:

**Payment Records**

with:

* Student
* Reference
* Related order/course
* Amount
* Method
* Date
* Status

Admin filters:

* Status
* Date
* Payment method
* Student

Show summary cards:

* Total Payments
* Pending
* Paid
* Failed
* Total Revenue

---

# 25. STUDENT PROFILE

Create:

**My Profile**

Sections:

### Personal Information

* Full Name
* Email
* Phone
* Date of Birth
* Grade
* Address

### Guardian Information

* Guardian Name
* Guardian Phone

Buttons:

**Edit Profile**

**Save Changes**

---

# 26. RESPONSIVE DESIGN

Design all important screens for:

### Desktop

1440px

### Tablet

768px

### Mobile

390px

Make the layouts responsive.

Desktop:

* Sidebar
* Large content area

Mobile:

* Bottom navigation or collapsible menu
* Stacked cards
* Mobile-friendly forms
* Touch-friendly buttons

---

# 27. UI STATES

Do not design only the successful state.

Include:

### Loading

Skeleton loaders.

### Empty

Examples:

**No upcoming classes**

**You haven't enrolled in any courses yet.**

**No orders found**

**No payment records available**

### Error

Examples:

**Something went wrong. Please try again.**

### Success

Examples:

**Enrollment successful!**

**Order placed successfully!**

**Payment submitted successfully!**

**Announcement published successfully!**

### Confirmation

Use clean confirmation modals before:

* Enrollment
* Order placement
* Payment submission
* Cancel actions

---

# 28. NOTIFICATIONS

Create notification UI.

Examples:

* New announcement
* Enrollment successful
* Class reminder
* Order confirmed
* Payment successful
* Payment failed

Use a notification bell in the navbar.

---

# 29. REALISTIC SRI LANKAN DATA

Use realistic Sri Lankan context.

Use:

* Sri Lankan student names
* Sri Lankan teacher names
* Sri Lankan phone number formats
* LKR currency
* Rs. formatting
* Asia/Colombo timezone
* Grade 1–11

Example names:

* Ayesha Fernando
* Mohamed Rishad
* Nadeesha Perera
* Fathima Ameen
* Kavindu Silva

Do not use unrealistic American-only examples.

---

# 30. IMPORTANT REFERENCE NUMBER FORMAT

Use these examples throughout the UI:

Enrollment:

**ENR-2026-0001**

Order:

**ORD-2026-0001**

Payment:

**PAY-2026-0001**

These should visually connect the different modules.

---

# 31. COMPLETE SYSTEM FLOW

The Figma prototype should allow the presentation to follow this sequence:

### STUDENT FLOW

Landing Page

↓

Register

↓

Login

↓

Student Dashboard

↓

Browse Courses

↓

Course Details

↓

Enroll

↓

Enrollment Confirmation

↓

My Courses

↓

Class Schedule

↓

Join Online Class

↓

Announcements

↓

Books

↓

Book Details

↓

Cart

↓

Order Confirmation

↓

Order Status

↓

Payment

↓

Payment Status

↓

Payment Records

↓

Logout

---

### ADMIN FLOW

Admin Login

↓

Admin Dashboard

↓

View Students

↓

Manage Courses

↓

Manage Classes

↓

Publish Announcement

↓

Manage Books

↓

View Orders

↓

View Payment Records

↓

Dashboard Reports

---

# 32. FIGMA PROTOTYPING

Connect the major screens with prototype interactions.

Examples:

Register button → Registration

Login → Dashboard

Explore Courses → Course Catalogue

View Details → Course Details

Enroll Now → Enrollment Confirmation

Confirm Enrollment → Success

View Schedule → Schedule

Join Online Class → External-link style confirmation

Books → Book Catalogue

Add to Cart → Cart

Place Order → Order Success

My Orders → Order Status

Payment → Payment Screen

Payment → Payment Success/Status

Admin Login → Admin Dashboard

Create Announcement → Announcement Form

Publish → Success State

---

# 33. ANIMATION / MICRO-INTERACTION DIRECTION

Design the UI so it can later be animated.

Use subtle:

* Card hover effects
* Button hover effects
* Page transitions
* Modal transitions
* Dropdown animations
* Toast notifications
* Skeleton loading
* Progress animations
* Order tracking transitions
* Payment processing animation
* Success animation

Keep animations professional and smooth.

Do NOT make the interface distracting.

---

# 34. ACCESSIBILITY

Ensure:

* Good text contrast
* Clear button labels
* Readable typography
* Logical hierarchy
* Clear error messages
* Form labels
* Large enough touch targets
* Consistent status indicators
* Do not rely only on colour to communicate status

---

# 35. FIGMA FILE ORGANIZATION

Organize the Figma file into pages:

### 01 — Design System

Colours, typography, spacing, icons and components.

### 02 — Public Website

Landing page, courses preview, announcements, books.

### 03 — Authentication

Login, registration, validation and success states.

### 04 — Student

Dashboard, profile, courses, enrollment, schedule, classes, announcements, books, orders, payments.

### 05 — Admin

Admin dashboard, students, courses, classes, announcements, books, orders, payments.

### 06 — Responsive

Mobile and tablet versions.

### 07 — Prototype Flow

Connected presentation flow.

---

# 36. FINAL DESIGN REQUIREMENT

The final Figma design must look like a **complete real ELMS product**, not just individual unrelated screens.

The modules must visually connect:

**Student → Course → Enrollment → Class → Announcement → Book → Order → Payment**

The same student, course, order and reference numbers should appear consistently across relevant screens.

For example:

Student:

**Ayesha Fernando**

Course:

**Grade 10 English**

Enrollment:

**ENR-2026-0001**

Order:

**ORD-2026-0001**

Payment:

**PAY-2026-0001**

This creates a realistic end-to-end system flow for the Sprint 1 demonstration.

Prioritize:

**Beautiful UI + usability + consistency + realistic data + complete Sprint 1 coverage + professional presentation.**

Do not omit any of the 12 Sprint 1 user stories.

Do not create only dashboard mockups.

Create the actual screens required to demonstrate every Sprint 1 user story.
