# SmritiNER (স্মৃতিNER)
## AI-Powered Cognitive Therapeutics & Memory Assistance Platform for Age-Related Cognitive Disorders (North Eastern Region)

---

## 🌟 Overview & Clinical Context
The **North Eastern Region (NER)** of India (Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, and Sikkim) faces unique healthcare challenges:
- Rising prevalence of age-related cognitive disorders including Mild Cognitive Impairment (MCI) and dementia.
- Geographic fragmentation and limited access to specialized neurological care across remote tea garden estates, riverine islands, and hilly districts.
- Scarcity of culturally inclusive, regional language-adapted digital therapeutic tools for elderly individuals.

**SmritiNER** is an **offline-capable, adaptively personalized Progressive Web App (PWA)** that combines culturally familiar cognitive stimulation games, explainable on-device Dynamic Difficulty Adjustment (DDA), daily routine and medication reminders, reminiscence therapy, and field-support tools for community health workers.

---

## 🧠 Key Modules & Platform Capabilities

### 1. 5 Culturally Tailored Cognitive Stimulation Modules
- **Majuli Memory Cards**: Visual short-term memory pairing featuring North Eastern cultural icons (Kaziranga One-Horned Rhino, Bihu Dhol drum, Great Hornbill, Muga Golden Silk, Majuli Mask, Assam Tea leaves, Phulam Gamosa, Bamboo crafts). Includes 5 difficulty tiers ($2\times2$ to $4\times4$).
- **Chai Garden Harvest**: High-speed sustained attention and motor focus game set in an Assam tea estate with combo scoring and rapid distractors.
- **Daily Life Sequence**: Executive function & chronological recall module ordering daily routines (Morning walk $\to$ Lal Saah $\to$ Memory medication $\to$ Namghar prayer $\to$ Vitals check $\to$ Wholesome lunch).
- **Weave the Pattern**: Visuospatial pattern recognition completing traditional handloom textile motifs (Assamese Gamosa, Manipuri Phanek, Naga warrior shawls, Mizo Puan, Bodo Dokhona).
- **Reminiscence Photo & Sound Lane**: Digital memory recall with personal family photos, verbal audio clues, and relaxing regional ambient soundscapes.

### 2. On-Device AI Dynamic Difficulty Adjustment (DDA) & Clinical Metrics
- **Real-Time Latency & Hesitation Tracking**: Automatically detects hesitation (>4.0s) and offers subtle glowing visual cues.
- **5 Granular Difficulty Tiers**: Auto-calibrates or manually scales challenge levels from Level 1 (Gentle MCI Baseline) to Level 5 (High Cognitive Stimulation).
- **MoCA / MMSE Aligned Domain Indices**:
  - Memory Retention Index
  - Sustained Attention Index
  - Executive Function Score
  - Motor Reaction Consistency
  - **Early Warning Cognitive Decline Detection**: Statistically flags 7-day downward trajectories for timely medical review.

### 3. Dual-Mode Interface & ASHA Field Screening
- **Elder / Patient Mode**: Ultra-high contrast, large tactile touch targets (min 60px), zero clutter, ambient Brahmaputra river soundscape, and one-tap emergency SOS contact.
- **Caregiver & Neurologist Portal (PIN: 1234)**:
  - Longitudinal Cognitive Progression charts (Recharts).
  - Medication & Hydration scheduler with compliance tracking.
  - Custom Reminiscence Photo manager.
  - **One-Click Clinical PDF Report Generation** for Neurologists.
- **ASHA / Anganwadi Health Worker Mode**: 5-minute rural field cognitive screening tool with automated risk triage and decentralized health registry storage.

### 4. Offline-Ready Architecture
- The application shell and game assets are cached after the first online visit.
- Patient activity, reminders, hydration, preferences, and game sessions remain on-device in **IndexedDB (Dexie.js)**.
- This hackathon prototype does **not** claim a remote cloud sync backend; the interface reports local/offline storage honestly.
- Web Audio API sound synthesis has zero external audio dependencies. Voice navigation is future work.

---

## 🎤 Five-Minute SIH Demo Flow

1. Open the elder home and switch between English, Hindi, and Assamese.
2. Launch **Majuli Memory Match** and point out the accessible touch controls.
3. Complete a round to show the explainable next-level recommendation based on recent accuracy and hesitation.
4. Open **Daily Routine**, mark an item complete, update hydration, and show the family SOS action.
5. Reload after taking the browser offline to demonstrate the cached app shell and locally persisted data.
6. Open **Caregiver access** with demo PIN `1234` and show progress, reminders, and the local-data privacy notice.

SmritiNER is a cognitive-engagement and caregiver-support prototype. It is not a diagnostic tool or a substitute for clinical care.

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+)

### Quick Launch on Windows
Double-click `launch_smriti_ner.bat` or run:
```cmd
launch_smriti_ner.bat
```

### Manual Start
```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Building for Production
```bash
npm run build
```
