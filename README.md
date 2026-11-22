# AHSANIME 2.0 starter

This is a deployable starter, not a finished commercial streaming service. Configure Firebase, create an admin custom claim, and set up the AI provider before production.

## 1. Firebase setup
1. In Firebase Console, select project `ahsanime`.
2. Register a Web App and copy its config into `public/app.js`.
3. Enable Authentication > Email/Password.
4. Create Firestore database and enable Storage.
5. Ensure Firebase Hosting, Functions, Firestore and Storage are enabled. Functions/Storage may require Blaze billing.
6. Install Node.js 20 and Firebase CLI: `npm install -g firebase-tools`.
7. From this folder run `npm install`, `cd functions && npm install && cd ..`, `firebase login`, `firebase use ahsanime`.

## 2. Create your admin
Create `hardikbhuriya41@gmail.com` in Firebase Authentication > Users.
Use a trusted local service-account credential (never commit it), then:
- `npm install firebase-admin`
- set `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json`
- `node scripts/set-admin.js hardikbhuriya41@gmail.com`
Sign out and sign back in. Admin is controlled by a custom claim, not by a hard-coded email check.

## 3. Deploy
`firebase deploy`
Set the OpenAI secret before deploying Functions:
`firebase functions:secrets:set OPENAI_API_KEY`
Paste the secret when prompted, then `firebase deploy --only functions`.

## 4. AI subtitle workflow
The current function expects an uploaded source audio/video object in Storage and a `sourceStoragePath` field on the anime document. It generates timed Japanese transcription and English, Devanagari Hindi, and Roman Hindi subtitle VTT files, saves them to Storage, and writes URLs into `anime.subtitles`.
This starter intentionally limits the source file to 24 MB. A full anime episode needs a production pipeline: extract audio, split into supported chunks, handle timestamps/overlap, retries, queues, progress reporting and cost controls. Do not upload copyrighted anime unless you have distribution and processing rights.

Before invoking subtitle generation, wire an admin-only button in the Admin UI to call the `generateSubtitles` callable function with `{animeId}`. It is not exposed as a public client action by default.

## 5. AdSense
Replace `ca-pub-REPLACE_WITH_YOUR_PUBLISHER_ID` and `REPLACE_WITH_AD_SLOT_ID` in `public/index.html` only after AdSense approves the site. Add the publisher's `ads.txt` file exactly as AdSense instructs. Never click your own ads or encourage invalid traffic. Approval and earnings are not guaranteed.

## Important production work still needed
- The admin form uploads poster, video, and a Japanese audio source file. The audio source object path is saved as `sourceStoragePath`. Save the anime first, edit/select it, then use the Generate / reuse AI subtitles button.
- Signed subtitle URLs in this starter have a long expiry; for a high-security deployment, serve subtitle files through an authenticated callable/HTTPS endpoint or use public-read rules with non-guessable paths.
- Add video transcoding/HLS, CDN, upload limits, malware validation, moderation, abuse protection, App Check, rate limits, monitoring, backups, privacy policy, terms and copyright takedown process before public launch.
- User watchlist/history are private per-user Firestore docs. Add pagination and stronger profile validation for scale.
- Ad placement is a placeholder. AdSense requires site review, policy compliance and sufficient original content.

## Data model
`anime/{animeId}`: title, description, categories[], audioLanguage, posterUrl, videoUrl, sourceStoragePath, published, subtitles{en,hi,hinglish}.
`users/{uid}`: email and profile metadata.
`users/{uid}/watchlist/items` and `users/{uid}/history/items`: ids[].
