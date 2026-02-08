# Acid Line Generator

## 1. Project Overview

This project is a web-based step sequencer and synthesizer designed to generate electronic music bass and lead lines. Built primarily using the **Tone.js** audio framework, the application allows users to generate random melodic patterns based on musical scales, manipulate synthesis parameters in real-time, and export the results as MIDI files.

The core objective of this application is to simulate the workflow of classic hardware bass synthesizers (such as the TB-303) within a browser environment, adding modern conveniences like cloud storage and algorithmic pattern generation.

The project was heavily inspired by Iftah's Sting max for live sequencer. Taking inspiration and wanting to add my personal touch, I added a "trance" generator in addition to the acid line generator.

## 2. Features

- **Random Sequence Generation:** Algorithms to generate 16-step sequences based on user-defined keys, scales, and genres (Acid and Trance).
- **Real Time Synthesis for Direct Sequence Monitoring:** A monosynth engine featuring Sawtooth and Square waveforms with a resonant low-pass filter.
- **Interactive Sequencer:**
  - 16-step visual interface.
  - Click to toggle steps on oroff.
  - Click-and-drag functionality on note labels to manually adjust pitch of each step.
- **Effects Chain:** Effects chain includes Chebyshev Waveshaping, Distortion, Feedback Delay, and Reverb.
- **Real-time Visualization:** An HTML5 Canvas oscilloscope that visualizes the audio output waveform.
- **User Playability:** Use a computer keyboard to transpose the playing sequence in real-time (powered by AudioKeys).
- **Cloud database:** Integration with Google Firebase to save and load user created sequences.

## 3. Technology Stack

- **HTML5/CSS3:** Frontend structure and styling, utilizing CSS variables and Flexbox/Grid for layout.
- **JavaScript (ES6):** Core application logic.
- **Tone.js:** Web Audio API framework used for synthesis, timing, and scheduling.
- **Firebase:** Firestore database used for storing pattern data.
- **@tonejs/midi:** Library used for encoding MIDI files for export.
- **AudioKeys:** Library used to map computer keyboard input to MIDI notes.

## 4. Installation and Setup

To run this project locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/yourusername/acid-line-generator.git](https://github.com/yourusername/acid-line-generator.git)
    ```

2.  **Firebase Configuration:**
    This project requires a `config.js` file to connect to Firebase, which is not included in the repository for security reasons.
    - Create a file named `config.js` in the root directory.
    - Add your Firebase configuration object (variable must be named `firebaseConfig`):

    ```javascript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT.appspot.com",
      messagingSenderId: "SENDER_ID",
      appId: "APP_ID",
    };
    ```

3.  **Running the Server:**
    Using Node.js/http-server:

    ```bash
    npx http-server
    ```

4.  **Access the Application:**
    Navigate to `http://localhost:8000` (or the port specified by your server) in a modern web browser.

## 5. Usage Guide

### Transport and General Controls

- **Play/Stop:** Starts and stops the Tone.js transport.
- **Generate:** Creates a new random sequence based on the current settings (BPM, Style, Key, Scale).
- **Save Pattern:** Commits the current sequence and settings to the Firebase database.
- **Export MIDI:** Downloads the current sequence as a `.mid` file for use in DAWs (Digital Audio Workstations).
- **Load Sequence:** A dropdown menu to retrieve previously saved patterns from the database.

### Generation Settings

- **Style:**
  - _Acid:_ Generates patterns with octave jumps, velocity accents, and variable note density.
  - _Trance:_ Generates arpeggiated patterns relying heavily on 7th and 9th chord intervals.
- **Key & Scale:** Determines the range of notes available for the generator.
- **Octave Shift:** Transposes the entire sequence up or down by octaves.

### The Synthesizer

The synthesis engine is modeled after subtractive hardware synths.

- **Waveform:** Toggle between Sawtooth (aggressive, buzzy) and Square (hollow, woody).
- **Cutoff:** Controls the frequency of the low-pass filter.
- **Res (Resonance):** Emphasizes the frequencies around the cutoff point.
- **Env (Envelope Mod):** Determines how much the filter envelope affects the cutoff frequency.
- **Glide:** Adds a portamento effect between overlapping notes.

### The Sequencer Interface

The bottom section displays the 16 steps of the sequence.

- **Toggle Step:** Click the step buttonto mute or unmute a step.
- **Change Note:** Click and drag up/down on the **note text label** below a step to change its pitch chromatically.
- **Live Transposition:** While the sequence is playing, typing on your computer keyboard (rows A-L) will transpose the sequence relative to the root note.

## 6. Technical Implementation Details

The audio signal path is constructed as follows:

1.  **Source:** `Tone.MonoSynth` with variable oscillator type.
2.  **Insert Effects:**
    - Chebyshev Waveshaper (adds odd harmonics).
    - Distortion (hard clipping).
    - Feedback Delay (synchronized to BPM).
3.  **Send Effects:** A high-passed Reverb for spatial depth.
4.  **Master:** Output to destination and analysis node for the oscilloscope.

The sequencer uses a probabilistic approach. In "Acid" mode, the generator iterates through the 16 steps, assigning notes from the selected scale with a 20% probability of octave jumping and a 30% probability of resting, ensuring that no two generated lines are exactly the same.
