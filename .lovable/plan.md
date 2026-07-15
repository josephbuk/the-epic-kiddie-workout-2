# Daily Push Reminders (FCM)

Both parent and kid get a browser push notification at a fixed daily time when there's an incomplete workout assignment.

## What you'll get

- A "Reminders" section in the parent dashboard where the parent:
  - Enables push on this device (grants permission, registers a token)
  - Picks a daily reminder time (e.g. 4:00 PM)
  - Enables push for each kid on the kid's own device (via Play mode)
- Every day at the chosen time, anyone with an open assignment gets a push:
  - Parent: "Time for {Kid}'s workout"
  - Kid: "Ready to move, {Name}? Today's workout is waiting"
- Clicking the notification opens the app on the right screen.

## What I need from you (Firebase setup)

FCM (Firebase Cloud Messaging) is Google's free push service. It requires a Firebase project. I'll walk you through:

1. Create a free Firebase project at console.firebase.google.com
2. Add a **Web App**, copy the config (apiKey, projectId, messagingSenderId, appId)
3. Cloud Messaging → generate a **VAPID key pair** (Web Push certificate)
4. Project Settings → Service Accounts → generate a **private key** JSON (server credentials for sending)

You'll paste these into secure secret prompts I'll open. Nothing goes in the code.

## Technical details

**New table** `push_subscriptions`
- owner_kind: 'parent' | 'kid'
- owner_id (parent user_id, or kid_id)
- parent_id (for RLS)
- fcm_token, user_agent, created_at
- RLS: parent manages rows where parent_id = auth.uid()

**New column** on `profiles`: `reminder_time` (time, default 16:00), `reminders_enabled` (bool)

**Client**
- `firebase-messaging-sw.js` service worker in `public/` (messaging only — separate from any app-shell PWA)
- Firebase init in `src/integrations/firebase/client.ts` using VITE_ vars
- "Enable reminders" button in parent dashboard + kid profile: requests permission, gets FCM token, saves via server fn
- Time picker bound to profile

**Server**
- `src/lib/push.functions.ts`: register/unregister token, save reminder time
- `src/routes/api/public/hooks/send-reminders.ts`: cron endpoint that queries incomplete assignments for kids whose parent's `reminder_time` matches "now" (hourly cron, matches on hour+minute window), signs a JWT with the service account, POSTs to FCM HTTP v1 API
- Secrets: FCM_SERVICE_ACCOUNT_JSON, plus VITE_FIREBASE_* config values

**Cron**: pg_cron every 5 min → calls the endpoint with anon key header. Endpoint filters recipients whose local reminder time falls in the current 5-min window.

## Out of scope

- iOS Safari push requires the user to first "Add to Home Screen" (Apple limitation). I'll show a hint but can't work around it.
- No SMS/email fallback.
- No per-assignment custom times (daily fixed only, per your choice).

## Build order

1. Ask for Firebase config + service account (secrets)
2. Migration: `push_subscriptions` + profile columns
3. Firebase client + messaging service worker
4. UI: enable-reminders buttons + time picker
5. Server fns for token registration
6. Cron endpoint + FCM sender
7. Schedule pg_cron
8. Test end-to-end

Ready to start? First step is you creating the Firebase project and grabbing those 4 things — I'll open the secret prompts once you say go.
