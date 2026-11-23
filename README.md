# Roletrail

Roletrail is a job search workspace for keeping job listings, evaluating how well they match a candidate's profile, and tracking each application from first review to final decision.

## Product direction

The app is designed for people applying to multiple roles at once. It brings saved listings, a clear match breakdown, follow-up dates, and application stages into one focused workspace.

The interface will use a restrained editorial style: warm neutral surfaces, deep ink text, one vivid accent color, compact data views, and typography-led hierarchy. Layouts will be designed for desktop, tablet, and mobile rather than scaled down from one screen.

## Core features

- Create an account and sign in with Firebase Authentication.
- Save a job with its title, company, location, type, source link, description, and salary range.
- Compare a listing with a candidate's skills and show a transparent match score with matched and missing terms.
- Track applications through saved, applied, interview, offer, and closed stages.
- Add notes and follow-up dates to an application.
- Search, filter, and sort saved jobs.
- View an overview of application activity and upcoming follow-ups.
- Keep each user's profile and application data private to that account.

## Technology

- React
- Vite
- Firebase Authentication
- Cloud Firestore
- CSS

## Data model

Each signed-in user owns a profile document and a collection of job documents. A job record contains its listing details, extracted skills, match breakdown, application stage, notes, follow-up date, and timestamps. Firestore access rules will restrict reads and writes to the authenticated owner.

## Local development

1. Install Node.js.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add the Firebase web app configuration.
4. Run `npm run dev`.

## Design and project brief

The interface will be designed specifically for Roletrail. The design file and final technical brief will be linked here when they are prepared.

## Deployment

The production build will be deployed to a static hosting provider after Firebase configuration and the responsive interface are complete.
