# 🎵 SoundSteps: Digital Hearing Rehabilitation Platform

> **⚠️ AI AGENT INSTRUCTIONS:** Before writing code, you MUST read `docs/CONTRIBUTING.md` and the **Developer Handoff** section at the bottom of this README.

## 📐 Development Standards
This project follows strict development and design standards to ensure consistency and prevent regressions.

### Required Reading
- 📘 [Style Guide](docs/STYLE_GUIDE.md) - UI/UX standards and component patterns
- 🛠️ [Contributing Guide](docs/CONTRIBUTING.md) - Engineering protocols and safety standards

---

**SoundSteps** is a scientifically-backed, gamified auditory training application designed for **Cochlear Implant (CI) recipients** and individuals with hearing loss. It focuses on the hierarchy of auditory skills: Detection, Discrimination, Identification, and Comprehension.

## 🚀 Project Status: Smart Coach Foundation (Phase 6 Complete)

We have successfully migrated the prototype to a modern **React + TypeScript + Vite** architecture and built a cloud-native backend on **Supabase**. The foundation for the "Smart Coach" analytics engine is now in place.

### Key Features
*   **☁️ Cloud-Native Backend:** All content and user data managed via **Supabase** (Database + Storage).
*   **🧠 Smart Coach Analytics:** `user_progress` table captures detailed clinical metadata for every interaction.
*   **🕒 Active Engagement Timer:** Accurately tracks "Time on Task", ignoring idle time.
*   **🔐 Authentication:** Full login/signup flow using Supabase Auth.
*   **🎧 Robust Audio Engine:** Custom hooks for seamless audio playback.
*   **🎚️ Soundscape Scenarios:** Dynamically generated dialogue mixed with ambient background noise (e.g., Cafe).
*   **🗣️ 4-Voice System:** Switch globally between David, Marcus (Male) and Sarah, Emma (Female).
*   **⚡ Rapid Fire (Minimal Pairs):** High-repetition discrimination training using **ElevenLabs Turbo v2.5**.
*   **📖 Interactive Stories:** Narrative comprehension with "Karaoke Mode" real-time highlighting.

## 🛠️ Tech Stack

*   **Frontend:** React 18, TypeScript, Vite
*   **Backend:** Supabase (PostgreSQL, Storage, Auth)
*   **Styling:** Tailwind CSS (v3), Lucide React (Icons)
*   **State Management:** React Context (`UserContext`, `VoiceContext`)
*   **Routing:** React Router v6
*   **Audio Generation:** ElevenLabs API (TTS, Sound Effects, Timestamps)
*   **Audio Processing:** FFmpeg (via Python scripts)

## ⚡ Quick Start

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Up Environment:**
    Copy `.env.example` to `.env` and fill in your `SUPABASE_` and `ELEVENLABS_API_KEY` credentials.

3.  **Run Local Development Server:**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

## 🚀 Developer Handoff & Session Continuity

**Best Practice:** At the end of a development session, update `docs/SESSION_LOG_CLOUD_MIGRATION.md` with a summary of changes.

To begin a new session and get the AI agent up to speed quickly, use the following prompt:

---
```
Hello, please get up to speed on our project, "SoundSteps". Your primary goal is to continue building out the "Smart Coach" and premium content features.

To do this, read the following files in order to understand the project's mission, current architecture, and recent progress:

1.  **`GEMINI.md`**: This file contains the original project mission and clinical voice configurations. Note that some tech stack details (like the frontend) are outdated.
2.  **`docs/SESSION_LOG_CLOUD_MIGRATION.md`**: This is the most critical file. It documents the massive migration to a cloud-native architecture and the implementation of the "Smart Coach" foundation. This file describes the *current* state of the project.
3.  **`package.json`**: Review this to confirm the current frontend stack (React, Vite, TypeScript).
4.  **`sql_migrations/` directory**: Briefly review the filenames in this directory to understand the database schema evolution.

After reading these files, please summarize the current architecture of the app (backend, frontend, audio pipeline) and the main goal of the "Smart Coach" feature.
```
---

## 🗺️ Roadmap & Progress

| Phase | Objective | Status | Notes |
|-------|-----------|--------|-------|
| **1-5** | **React Migration** | ✅ Done | Migrated to React/Vite, built core UI. |
| **6** | **Cloud & Smart Coach** | ✅ Done | Migrated to Supabase, implemented tracking. |
| **7** | **UI Polish & Hard Mode** | 📅 Next | Add animations, improved typography, and "Hard Mode" for word pairs. |
| **8** | **Clinical Reporting** | 🔮 Future | Build a dedicated page to visualize `user_progress` data, including a phoneme confusion matrix and export-to-PDF functionality. |
| **9** | **Tier Locking** | 🔮 Future | Implement UI controls to lock "Standard" and "Premium" content for non-subscribed users. |