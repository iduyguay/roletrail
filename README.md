# Roletrail

Roletrail is a job search workspace for saving job listings, understanding how they fit a candidate's skills, and tracking every application from first review to final decision.

## Product direction

The app is designed for people applying to multiple roles at once. It brings saved listings, a clear match breakdown, follow-up dates, and application stages into one focused workspace. The design brief is in [`docs/design-brief.md`](docs/design-brief.md).

The interface will use a restrained editorial style: warm neutral surfaces, deep ink text, one vivid accent color, compact data views, and typography-led hierarchy. Layouts will be designed for desktop, tablet, and mobile rather than scaled down from one screen.

## Core features

- Create an account and sign in with email and password or Google using Firebase Authentication.
- Save a job with its title, company, location, source link, and salary range.
- Update saved role details as an application progresses.
- Compare the saved role description with a personal skill list and inspect the phrase-level overlap.
- Track applications through saved, applied, interview, offer, and closed stages.
- Add private notes and follow-up dates to an application.
- Search and filter saved jobs by application stage.
- View an overview of application activity and upcoming follow-ups.
- See overdue and upcoming follow-ups for the next seven days, then open a role's note and reminder directly from Insights.
- Keep each user's application data private to that account with Firestore rules.
- Try the demo workspace without an account; demo changes stay in the current browser.

## Technology

- React
- Vite
- Firebase Authentication
- Cloud Firestore
- CSS

## Data model

Each signed-in user owns a profile document and a collection of job documents. A job record contains its listing details, saved description, application stage, notes, follow-up date, and timestamps. Skill overlap is derived from the saved description and profile at runtime, so changing skills does not leave old scores behind. Firestore access rules restrict reads and writes to the authenticated owner.

## Match score

The score is transparent phrase overlap, not an AI assessment. Roletrail normalizes case and accents, then checks each saved profile skill as a whole phrase in the role title and description. The score is the percentage of profile skills found in that text; the detail view shows which terms matched and which were not mentioned.

## Local development

1. Install Node.js 24.12 or newer. If you use nvm, run `nvm use`.
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local` and add the Firebase web app configuration. Without these values, the app opens in demo mode.
4. Enable Email/Password and Google providers in Firebase Authentication.
5. Create a Cloud Firestore database and deploy [`firestore.rules`](firestore.rules) with `firebase deploy --only firestore:rules`.
6. Run `npm run dev`.

## Design and project brief

The interface follows the product and visual brief in [`docs/design-brief.md`](docs/design-brief.md). No external Figma file was supplied for this project.

## Deployment

The site is configured for static hosting with Netlify. Deploy with `npm run build` and publish the `dist` directory; Firebase credentials must also be configured in the hosting environment.
