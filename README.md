# Document Eye Tracking

A web application that verifies whether a person has read a document by tracking their eye movements in real-time using a standard webcam. No special hardware required.

## How It Works

1. **Calibrate** -- A 13-point calibration process trains an eye tracking model to your eyes using your webcam. A head position guide ensures you're properly positioned before calibration begins.

2. **Read** -- Upload a PDF and read it naturally. The system tracks your gaze in real-time, highlighting text as your eyes move across it. Text transitions from unread to partially read (orange) to fully read (green) based on dwell time.

3. **Verify** -- When you're done, a verification report shows your reading coverage percentage, average fixation duration, time spent, and a final verdict: Verified Read, Partial Read, Skimmed, or Insufficient Data.

## Technical Overview

### Eye Tracking Pipeline

- **WebGazer.js** captures raw gaze coordinates from the webcam at 30-60Hz
- A **1-Euro filter** adaptively smooths the gaze signal (heavy smoothing when still, light smoothing during saccades)
- An **outlier rejector** drops gaze points that fall more than 3 standard deviations from the recent mean
- A **fixation detector** clusters nearby gaze points and identifies when the eyes have paused on a region for 100ms+
- `document.elementFromPoint()` maps each fixation to a text span in the PDF's text layer
- A **read tracker** accumulates dwell time per span, marking it as "read" once it exceeds 250ms

### Calibration

- 13-point grid with 8 clicks per point (104 training samples)
- Edge points placed at 15% from screen edges for better webcam accuracy
- Head position check with face detection before calibration starts
- 4-point validation with quality grading (excellent/good/fair/poor)
- Adaptive fixation radius scaled to 65% of measured calibration error
- Continuous calibration during reading (WebGazer learns from every click)

### Drift Detection

During reading, the system monitors for calibration drift:
- Warns if the face is lost for 3+ seconds
- Warns if 40%+ of recent gaze points fall off-screen
- Offers quick re-calibration from the reading view

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **WebGazer.js** -- browser-based eye tracking via webcam
- **react-pdf-viewer** -- PDF rendering with text layer for gaze mapping
- **Zustand** -- lightweight state management for real-time gaze data
- **Tailwind CSS** -- styling

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) and click "Calibrate" to begin.

## Project Structure

```
src/
  app/                  # Next.js pages (home, calibrate, read, report)
  components/           # React components
    CalibrationScreen   # 13-point calibration flow
    CalibrationValidator # Post-calibration accuracy check
    HeadPositionGuide   # Webcam face positioning guide
    DocumentUploader    # PDF drag-and-drop upload
    DocumentViewer      # PDF viewer with gaze overlay
    VerificationReport  # Reading verification results
  lib/
    gaze-engine         # WebGazer wrapper, 1-Euro filter integration
    one-euro-filter     # Adaptive signal smoothing
    outlier-rejector    # Statistical outlier detection
    fixation-detector   # Gaze clustering and fixation identification
    text-mapper         # PDF text layer span registration
    read-tracker        # Per-span dwell time accumulation
    drift-detector      # Calibration drift monitoring
    verification        # Read score computation
  stores/               # Zustand stores (gaze, document, calibration)
  types/                # TypeScript interfaces
```

## Tips for Best Results

- Sit at arm's length from your screen
- Ensure even lighting on your face with no backlighting
- Keep your head still during calibration -- move only your eyes
- Click precisely on the center of each calibration dot
- Avoid glasses with strong reflections if possible
