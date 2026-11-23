# Roletrail design brief

## Product

Roletrail helps a job seeker keep a thoughtful record of opportunities, conversations, and next steps. It is intended for an individual managing a search, rather than a recruiting team or job marketplace.

## Main flow

1. Open the overview and scan active applications, interviews, and upcoming follow-ups.
2. Save a listing with a role, company, location, salary range, and source link.
3. Move the role through Saved, Applied, Interview, Offer, or Closed.
4. Search or filter the list when the pipeline grows.
5. Keep a private note on a role so a follow-up or preparation detail is not lost.
6. Compare the saved role text with a personal skill list and review the terms behind the match score.

## Visual direction

The product should feel calm and personal, like a well-kept field notebook. Use warm paper tones, ink-like text, a restrained coral accent, and a serif display face against a practical sans-serif interface. Small monospaced labels provide structure for counts and dates.

Avoid large gradients, excessive rounded cards, generic charts, and decorative imagery. Use company lettermarks and small, quiet status colors. Keep the dashboard dense enough to be useful while giving the role list room to breathe.

## Responsive behavior

- Desktop: persistent navigation rail, overview metrics, and a compact role table.
- Tablet: narrow navigation rail and a two-column metric layout.
- Mobile: hide the navigation rail, keep the add action reachable, and reduce each role to its essential details and stage.

## Interface states

- Demo workspace with sample records and browser-local changes.
- Sign-in and account creation when Firebase is configured.
- Empty pipeline, filtered empty state, and validation errors.
- Loading and Firebase error states.
- Add-role and note dialogs.
