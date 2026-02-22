# Acid and Trance Line Generator

## Project Overview

This project is a web-based step sequencer and synthesizer designed to generate electronic music bass and lead lines. Built primarily using the **Tone.js** audio framework, the application allows users to generate random melodic patterns based on musical scales, manipulate synthesis parameters in real-time, and export the results as MIDI files.

The core objective of this application is to simulate the workflow of classic hardware bass synthesizers (such as the TB-303) within a browser environment, adding modern conveniences like cloud storage and algorithmic pattern generation.

The project was heavily inspired by Iftah's Sting max for live sequencer. Taking inspiration and wanting to add my personal touch, I added a "trance" line generator in addition to the acid line generator.

## Features

- **Random Sequence Generation:** Algorithms to generate 16-step sequences based on user-defined keys and genres (Acid and Trance).
- **Real Time Synthesis for Direct Sequence Monitoring:** A monosynth engine featuring Sawtooth and Square waveforms with a resonant low-pass filter.
- **Interactive Sequencer:**
  - 16-step visual interface.
  - Click to toggle steps on oroff.
  - Click-and-drag functionality on note labels to manually adjust pitch of each step.
- **Effects Chain:** Effects chain includes Chebyshev Waveshaping, Distortion, Feedback Delay, and Reverb.
- **Real-time Visualization:** An Oscilloscope that visualizes the audio output waveform.
- **User Playability:** Use a computer keyboard to transpose the playing sequence in real-time (powered by AudioKeys).
- **Cloud database:** Integration with Google Firebase to save and load user created sequences.

## Technology Stack

- **HTML5/CSS3:** Frontend structure and styling, utilizing CSS variables and Flexbox/Grid for layout.
- **JavaScript :** Core/backend application logic.
- **Tone.js:** Web Audio API framework used for synthesis, timing, and scheduling.
- **Firebase:** Firestore database used for storing pattern data.
- **@tonejs/midi:** Library used for encoding MIDI files for export.
- **AudioKeys:** Library used to map computer keyboard input to MIDI notes.

## Installation and Setup

To run this project locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/adecandi/AcidProject.git
    ```

2.  **Firebase Configuration:**
    This project requires a Firebase cloud database and a `config.js` file to connect to Firebase, which is not included in the repository for security reasons.
    - Go to https://console.firebase.google.com/ and create a new project.
    - After going through the initial steps, select "add app" and select a web app.
    - The neccessary firebaseConfig will then be presented in Firebase, simply copy only the JSON variable starting with "const firebaseConfig = ..." and have it ready to be pasted in `config.js` as shown below. Protect this to avoid abuse of your database.
    - Create a file named `config.js` in the root directory.
    - Add your Firebase configuration object only (variable must be named `firebaseConfig`):

    ```javascript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT.firebasestorage.app",
      messagingSenderId: "SENDER_ID",
      appId: "APP_ID",
    };
    ```

    - do not copy the other variables or the project won't load correctly. Open a terminal in the working directy and run "npm install firebase"
    - next in your Firebase project console, select Build -> Firestore Database -> Create Database -> Standard -> Test mode -> Create.
    - Your database is now ready to receive saved sequences and recall them. Refresh the webpage after saving a sequence to recall it.

3.  **Running the Server:**
    Using Node.js/http-server:

    Open a terminal in the same directory where you cloned the project and run:

    ```bash
    npx http-server
    ```

    Alternatively use the "Live Preview" extension if using VS Code. In the HTML file, right click and select -> "Show Preview".

4.  **Access the Application:**
    Use the 2nd url generated after running npx http-server or the url shown in live preview render of the HTML file to run the synthesizer.

## Usage Guide

### Transport and General Controls

- **Play/Stop:** Starts and stops the Tone.js transport.
- **Generate:** Creates a new random sequence based on the current settings (BPM, Style, Key, Scale).
- **Save Pattern:** Commits the current sequence and settings to the Firebase database.
- **Export MIDI:** Downloads the current sequence as a `.mid` file for use in DAWs (Digital Audio Workstations).
- **Load Sequence:** A dropdown menu to retrieve previously saved patterns from the database.

### Generation Settings

- **Styles:**
  - Acid: Generates patterns with octave jumps, velocity accents, and variable note density. Loosely based on the Max for Live Sting sequencer. The notes are picked with math.random, and there is a 20% chance of an octave jump or a 30% chance of a rest.
  - Trance: Generates classic Trance lines by generating stricter 7th chord arpeggiated lines with an occasional 9th or 6th interval. Notes are therefore less random, but there is still a probability of a note change for the 2nd and 3rd beats, and occasional rests on the 2nd and 3rd beats.
- **Key & Scale:** Determines the range of notes available for the generator.
- **Octave Shift:** Transposes the entire sequence up or down by octaves. Only available for Acid line generation.

### The Synthesizer

Simple subtractive monosynth to monitor the generated sequence.

- **Waveform:** Inspired by the TB303, choose between a square or sawtooth wave.
- **Cutoff:** Controls the frequency of the low-pass filter.
- **Res (Resonance):** Emphasizes the frequencies around the cutoff point.
- **Env (Filter Envelope Mod):** Determines how much the filter envelope affects the cutoff frequency.
- **Glide:** Adds a portamento effect between notes.

### The Sequencer Interface

The bottom section displays the 16 steps of the sequence.

- **Toggle Step:** Click the step button to mute or unmute a step.
- **Change Note:** Click and drag up/down on the **note text label** below a step to change its pitch chromatically.
- **Live Transposition:** While the sequence is playing, typing on your computer keyboard (rows A-L) will transpose the sequence relative to the root note.

## Technical Implementation Details

Audio Signal Path:

1.  **Sound Source:** `Tone.MonoSynth` with square or sawtooth wave oscillators.
2.  **Effects:**
    - Chebyshev Waveshaper.
    - Distortion.
    - Synched Delay.
    - Reverb (in Parallel).
3.  **Master:** Output to destination and analysis node for the oscilloscope.
