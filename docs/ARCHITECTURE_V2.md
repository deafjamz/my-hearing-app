# SoundSteps Architecture: "Production Ready"

## 🏗️ The Pivot: From "Prototype" to "Platform"
You have shifted the goalpost from a "Web App" to a **"Multi-Platform Application" (iOS, Android, Web)**.
This requires a fundamental architectural shift. We cannot store 5,000 audio files in the Git repository or the App Bundle.

### 🛑 The Problem with the Current Path
1.  **Binary Size:** If we add 1,000 MP3s + Videos to the `public/` folder, your app download size will exceed **500MB**. Users will uninstall it.
2.  **State Sync:** `UserContext` (Local Storage) works for one device. If a user logs in on their iPad, their iPhone progress is lost.
3.  **Content Updates:** To fix a typo in a Story, you currently have to *re-deploy the code*.

---

## 🚀 The "Premier" Architecture (Supabase + Capacitor)

We will adopt a **"Headless Content"** strategy. The app is a lightweight shell; the content lives in the cloud.

### 1. The Backend Stack (Supabase)
We will use **Supabase** (Open Source Firebase alternative) to handle the heavy lifting.
*   **Database (PostgreSQL):** Stores User Profiles, Progress, Subscriptions, and Content Metadata (the JSON data).
*   **Storage (S3-compatible):** Stores the actual Audio (`.mp3`) and Video files.
*   **Auth:** Handles Email/Password, Google Login, and Subscription Tiers.

### 2. The Content Pipeline (Updated)
We keep Google Sheets for *editing*, but the pipeline changes destination.

*   **Input:** Google Sheets (Clinicians write text).
*   **Processor:** `generate_assets.py` (Local Python Script).
    *   Generates Audio (ElevenLabs).
    *   **NEW:** Uploads MP3 to **Supabase Storage**.
    *   **NEW:** Uploads Metadata to **Supabase Database**.
*   **Output:** The App fetches content via API, not local import.

### 3. The App Framework (Capacitor)
We stick with **React + Vite** but add **Capacitor**.
*   **Capacitor:** Wraps your web app into a native iOS/Android binary.
*   **Offline Mode:** We implement a "Download for Offline" feature that saves the Supabase MP3s to the device's native filesystem.

---

## 🛠️ Revised Roadmap

### Phase 1: Infrastructure (The Backend)
*   [ ] **Init Supabase:** Create project, set up Tables (`profiles`, `content`, `subscriptions`) and Storage Buckets (`audio`, `video`).
*   [ ] **Pipeline Upgrade:** Modify `generate_assets.py` to upload to Cloud instead of `public/`.
*   [ ] **Data Migration:** Move `wordPairs.ts` data into the Database.

### Phase 2: The Native Shell
*   [ ] **Install Capacitor:** `npm install @capacitor/core @capacitor/cli`.
*   [ ] **Configure Platforms:** `npx cap add ios`, `npx cap add android`.
*   [ ] **Touch ID / Face ID:** Implement native auth.

### Phase 3: "High-Fidelity" Content
*   [ ] **Execute the Content Plan:** Generate the 1,000+ assets using the new Cloud Pipeline.
*   [ ] **Video Integration:** Add video player support for lip-reading exercises.

---

## 💡 Why This Wins
*   **Scalability:** You can have 100,000 files; the app size stays small (~15MB).
*   **Agility:** You can publish a new Story in Google Sheets $\to$ Run Script $\to$ It appears on user devices *instantly* without an App Store update.
*   **Monetization:** Server-side checks prevent hacking premium content.

**Shall we proceed with initializing this "Cloud-First" architecture?** I can help you set up the Supabase structure and the new generation script.