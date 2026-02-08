// Initialize Firebase
//const app = initializeApp(firebaseConfig); //not used yet while working locally
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

//Synthesizer Base
const acidSynth = new Tone.MonoSynth({
  oscillator: {
    type: "fatsawtooth",
    count: 1,
    spread: 0,
  },
  envelope: {
    attack: 0.01,
    decay: 0.4,
    sustain: 0.2,
    release: 0.4,
  },
  filterEnvelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0,
    baseFrequency: 200,
    octaves: 4, //Depth of the filter envelope
  },
});

const feedbackDelay = new Tone.FeedbackDelay({
  delayTime: "4n",
  feedback: 0.4,
  wet: 0.35,
});

const cheby = new Tone.Chebyshev(1);
const dist = new Tone.Distortion(0);
const masterBus = new Tone.Gain(1).toDestination();
const waveform = new Tone.Waveform(512);

masterBus.connect(waveform);
acidSynth.chain(cheby, dist, feedbackDelay, masterBus);

//Reverb
const reverb = new Tone.Reverb({ decay: 3, wet: 1 });
const reverbFilter = new Tone.Filter(2000, "highpass");
const reverbReturn = new Tone.Volume(-Infinity);

//Send Delay output to reverb for parallel processing
feedbackDelay.connect(reverb);
reverb.chain(reverbFilter, reverbReturn, masterBus);

//Click handling for waveform selection
const waveSawBtn = document.getElementById("waveSaw");
const waveSquareBtn = document.getElementById("waveSquare");

waveSawBtn.addEventListener("click", () => {
  acidSynth.oscillator.type = "fatsawtooth";
  waveSawBtn.classList.add("active");
  waveSquareBtn.classList.remove("active");
});

waveSquareBtn.addEventListener("click", () => {
  acidSynth.oscillator.type = "fatsquare";
  waveSquareBtn.classList.add("active");
  waveSawBtn.classList.remove("active");
});

//spread and count expect an Int
document.getElementById("spread").addEventListener("input", (e) => {
  acidSynth.oscillator.spread = parseInt(e.target.value);
});

document.getElementById("voices").addEventListener("input", (e) => {
  acidSynth.oscillator.count = parseInt(e.target.value);
});

document.getElementById("output").addEventListener("input", (e) => {
  // need decibels for volume
  acidSynth.volume.value = Tone.gainToDb(parseFloat(e.target.value));
});

document.getElementById("cutoff").addEventListener("input", (e) => {
  acidSynth.filterEnvelope.baseFrequency = e.target.value;
});

document.getElementById("resonance").addEventListener("input", (e) => {
  acidSynth.filter.Q.value = e.target.value;
});

document.getElementById("filterEnv").addEventListener("input", (e) => {
  acidSynth.filterEnvelope.octaves = e.target.value;
});

document.getElementById("portamento").addEventListener("input", (e) => {
  acidSynth.portamento = e.target.value / 100; //convert to seconds
});

//Handle delay time updates with BPM changes and slider changes
function updateDelayTime() {
  const val = parseFloat(document.getElementById("delayTime").value);
  if (val < 0.25) feedbackDelay.delayTime.value = "16n";
  else if (val < 0.5) feedbackDelay.delayTime.value = "8n";
  else if (val < 0.75) feedbackDelay.delayTime.value = "4n";
  else feedbackDelay.delayTime.value = "2n";
}

document.getElementById("bpm").addEventListener("input", (e) => {
  Tone.Transport.bpm.value = e.target.value;
  updateDelayTime();
});

document.getElementById("waveshaperAmount").addEventListener("input", (e) => {
  cheby.order = parseInt(e.target.value);
});

document.getElementById("distortionAmount").addEventListener("input", (e) => {
  dist.distortion = e.target.value;
});

document.getElementById("ampRelease").addEventListener("input", (e) => {
  acidSynth.envelope.release = parseFloat(e.target.value);
});

// Use 'change' for reverb decay to avoid performance issues during slide
document.getElementById("reverbDecay").addEventListener("change", (e) => {
  reverb.decay = parseFloat(e.target.value);
});

document.getElementById("reverbMix").addEventListener("input", (e) => {
  const val = parseFloat(e.target.value);
  reverbReturn.volume.value = Tone.gainToDb(val); //volume, convert to decibels
  reverbReturn.mute = val <= 0.001; //mute if slider off
});

document.getElementById("reverbFilter").addEventListener("input", (e) => {
  reverbFilter.frequency.value = parseFloat(e.target.value);
});

document.getElementById("delayTime").addEventListener("input", (e) => {
  updateDelayTime();
});

document.getElementById("delayWet").addEventListener("input", (e) => {
  feedbackDelay.wet.value = e.target.value;
});

document.getElementById("delayFeedback").addEventListener("input", (e) => {
  feedbackDelay.feedback.value = e.target.value;
});

// SEQUENCER
var length = 16; //length of the sequence

document.getElementById("keySelect").addEventListener("input", (e) => {
  //const key = e.target.value;
  updateScale();
});

document.getElementById("scaleSelect").addEventListener("input", (e) => {
  //const scaleType = e.target.value;
  updateScale();
});

document.getElementById("octaveRange").addEventListener("input", (e) => {
  updateScale();
});

//global sequence scale range, contents update to user key selection
let sequenceScale = [];

function updateScale() {
  const key = parseInt(document.getElementById("keySelect").value);
  const scaleType = document.getElementById("scaleSelect").value;
  //const octaves = parseInt(document.getElementById("octaveRange").value);

  let scaleIntervals = scaleType === "major" ? MAJOR_SCALE : MINOR_SCALE;

  sequenceScale = [];
  const rootIndex = 24 + key;
  const octaves = 8;

  //fill sequenceScale with allowed notes from key
  for (let oct = 0; oct < octaves; oct++) {
    for (let i = 0; i < scaleIntervals.length; i++) {
      const noteIndex = rootIndex + oct * 12 + scaleIntervals[i];
      if (noteIndex < MIDI_SHARP_NAMES.length) {
        sequenceScale.push(MIDI_SHARP_NAMES[noteIndex]);
      }
    }
  }
}

//GENERATORS
function generateRandomSequence(length) {
  const sequence = [];
  const genre = document.getElementById("genreSelect").value;
  const octaveRange = parseInt(document.getElementById("octaveRange").value);
  const maxIndex = octaveRange * 7;
  const getRandomNote = () => {
    const tempNoteIndex = Math.floor(Math.random() * maxIndex);
    return sequenceScale[Math.min(tempNoteIndex, sequenceScale.length - 1)];
  };

  //ACID: Random notes from scale, with occasional octave jumps and velocity variations, and some rests
  if (genre === "acid") {
    for (let i = 0; i < length; i++) {
      //const randomNote = sequenceScale[Math.floor(Math.random() * sequenceScale.length)];
      let randomNote = getRandomNote(); //needs to be let for it to be recast in the octave jump section

      //add octave jumps for acid style (20% chance)
      if (Math.random() > 0.8 && sequenceScale.length > 12) {
        //if index of an octave shift is too large, take the index of the highest allowed note
        const octaveIndex = Math.min(
          sequenceScale.length - 1,
          sequenceScale.indexOf(randomNote) + 12,
        );
        randomNote = sequenceScale[octaveIndex]; // redefine randomNote to be one octave higher
      }

      //Random velocity: 20% chance of high velocity (1), else normal velocity (0.7)
      const velocity = Math.random() > 0.8 ? 1 : 0.7;

      //30% chance of rest
      const note = Math.random() > 0.7 ? null : randomNote;

      sequence.push({ note: note, velocity: velocity });
    }
    // } else if (genre === "techno") {
    //   //create a hypnotic pattern
    //   const technoPattern = [];
    //   for (let i = 0; i < 4; i++) {
    //     //ignore octave and keep it low
    //     const limit = Math.min(5, sequenceScale.length); //limit to first octave
    //     const note = sequenceScale[Math.floor(Math.random() * limit)];
    //     technoPattern.push({ note: note, velocity: 0.7 });
    //   }

    //   for (let i = 0; i < length; i++) {
    //     // Use modulo operator % to loop through the 4 motif steps
    //     sequence.push({ ...technoPattern[i % 4] });
    //   }
  } else if (genre === "trance") {
    //TRANCE
    let baseIndex = 14;

    // Safety check: if scale is too small, drop down an octave
    if (baseIndex + 10 >= sequenceScale.length) baseIndex = 7;

    for (let i = 0; i < length; i++) {
      //Split steps into groups of 4
      const stepInBar = i % 4;
      let intervalOffset = 0;

      if (stepInBar === 0) {
        intervalOffset = 0; //root
      } else if (stepInBar === 1) {
        intervalOffset = Math.random() > 0.5 ? 12 : 9; //high 6th or High 3rd
      } else if (stepInBar === 2) {
        intervalOffset = Math.random() > 0.5 ? 7 : 8; //Octave or 9th
      } else if (stepInBar === 3) {
        intervalOffset = Math.random() > 0.5 ? 8 : 6; //2nd or 7th
      }

      //random swaps
      if (i >= 12 && Math.random() > 0.5) {
        if (stepInBar === 1) intervalOffset = 7; // Swap 5th for Octave
        if (stepInBar === 2) intervalOffset = 4; // Swap Octave for 5th
      }

      //use baseIndex (root) + intervalOffset to get scale degree for step
      let noteIndex = baseIndex + intervalOffset;
      //clamp to scale length to prevent crashes
      if (noteIndex >= sequenceScale.length)
        noteIndex = sequenceScale.length - 1;

      const note = sequenceScale[noteIndex];

      //velocity variation
      let velocity = 0.7;
      if (stepInBar === 0) {
        velocity = 1.0; //full velocity on downbeats
      } else {
        //randomize velocity
        velocity = 0.6 + Math.random() * 0.2;
      }

      let finalNote = note;

      //25% chance of rest on 3rd beats
      if (stepInBar === 2 && Math.random() > 0.4) {
        finalNote = null;
      } else if (stepInBar === 1 && Math.random() > 0.7) {
        finalNote = null;
      }

      sequence.push({ note: finalNote, velocity: velocity });
    }
  }

  return sequence;
}

updateScale();
let acidSequence = generateRandomSequence(length);

//Render sequence to screen
function renderSequence() {
  const seqContainer = document.getElementById("sequencer");
  seqContainer.innerHTML = "";

  acidSequence.forEach((step, index) => {
    //wrapper for step button and note label
    const wrapper = document.createElement("div");
    wrapper.classList.add("step-wrapper");

    const stepButton = document.createElement("div");
    stepButton.classList.add("step");
    stepButton.id = "step_" + index;
    if (step.note) {
      stepButton.classList.add("active");
    }

    //Note label
    const label = document.createElement("div");
    label.classList.add("note-label");
    label.textContent = step.note || "-";

    stepButton.addEventListener("click", () => {
      if (step.note) {
        stepButton.dataset.prevNote = step.note; //Store current note for potential restoration
        step.note = null;
        stepButton.classList.remove("active");
        label.innerText = "-";
      } else {
        const randomNote =
          sequenceScale[Math.floor(Math.random() * sequenceScale.length)];
        if (stepButton.dataset.prevNote) {
          step.note = stepButton.dataset.prevNote;
        } else {
          step.note = randomNote;
        }
        step.velocity = 0.7; //default velocity
        stepButton.classList.add("active");
        label.innerText = step.note;
      }
    });

    //Drag logic to change note
    label.addEventListener("mousedown", (e) => {
      if (!step.note) return; //Only allow adjustment if the step is active

      const startY = e.clientY;
      //Find current index in the scale, default to middle if not found
      let startIndex = sequenceScale.indexOf(step.note);
      if (startIndex === -1) startIndex = Math.floor(sequenceScale.length / 2);

      const onMouseMove = (moveEvent) => {
        const deltaY = startY - moveEvent.clientY;
        const steps = Math.floor(deltaY / 10); //10px drag per semitone/step
        let newIndex = startIndex + steps;

        //Clamp index to scale bounds
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= sequenceScale.length)
          newIndex = sequenceScale.length - 1;

        const newNote = sequenceScale[newIndex];
        if (newNote !== step.note) {
          step.note = newNote;
          label.innerText = newNote;
        }
      };

      //cleanup on mouse up
      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });

    wrapper.appendChild(stepButton);
    wrapper.appendChild(label);
    seqContainer.appendChild(wrapper);
  });
}

renderSequence();

const seq = new Tone.Sequence(
  (time, index) => {
    const step = acidSequence[index];
    if (step.note) {
      let originalIndex = sequenceScale.indexOf(step.note);
      //Fallback: Quantize to nearest note if exact match is missing (after scale change)
      if (originalIndex === -1) {
        //Parse the missing note to get its MIDI number (e.g. "C#3" -> 49)
        const targetMidi = Tone.Frequency(step.note).toMidi();

        let closestIndex = 0;
        let minDistance = Infinity;

        //Loop through current scale to find the closest match
        for (let i = 0; i < sequenceScale.length; i++) {
          const scaleMidi = Tone.Frequency(sequenceScale[i]).toMidi();
          const distance = Math.abs(targetMidi - scaleMidi);

          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
          }
        }
        originalIndex = closestIndex;
      }
      let newIndex = originalIndex + transposeOffset + octaveShift * 7; //7 notes per octave in scale

      //Clamp to scale bounds
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= sequenceScale.length) newIndex = sequenceScale.length - 1;

      const finaleNote = sequenceScale[newIndex];
      // const transposedNote = Tone.Frequency(step.note).transpose(
      //   octaveShift * 12,
      // ); //Handle octave transpositions
      acidSynth.triggerAttackRelease(finaleNote, "16n", time, step.velocity);
    }
    Tone.Draw.schedule(() => {
      //Highlight current step
      const prev = document.querySelector(".step.current");
      if (prev) prev.classList.remove("current");
      const current = document.getElementById("step_" + index);
      if (current) current.classList.add("current");
    }, time);
  },
  //acidSequence,
  [...Array(length).keys()],
  "16n",
);

function updateSynthSettings(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = value;
    element.dispatchEvent(new Event("input")); // Trigger input event to apply change
    element.dispatchEvent(new Event("change")); // Trigger change event for settings that listen to it
  }
}

function applyGenreSettings(genre) {
  switch (genre) {
    case "acid":
      updateSynthSettings("cutoff", 600);
      updateSynthSettings("resonance", 15);
      updateSynthSettings("filterEnv", 4);
      // updateSynthSettings("ampRelease", 0.4);
      // updateSynthSettings("distortionAmount", 0.2);
      // updateSynthSettings("delayWet", 0.3);
      // updateSynthSettings("reverbMix", 0.1);
      // updateSynthSettings("bpm", 135);
      // updateSynthSettings("output", 0.4);
      // updateSynthSettings("distortionAmount", 0.2);
      break;

    case "trance":
      updateSynthSettings("cutoff", 6000);
      updateSynthSettings("resonance", 1);
      updateSynthSettings("filterEnv", 0);
      updateSynthSettings("voices", 3);
      updateSynthSettings("spread", 12);
      // updateSynthSettings("ampRelease", 0.4);
      // updateSynthSettings("distortionAmount", 0.05);
      // updateSynthSettings("delayTime", 0.35);
      // updateSynthSettings("delayFeedback", 0.35);
      // updateSynthSettings("delayWet", 0.3);
      // // updateSynthSettings("reverbMix", 0.3);
      // // updateSynthSettings("reverbDecay", 8.0);
      // updateSynthSettings("output", 0.25);
      // updateSynthSettings("distortionAmount", 0.15);
      // updateSynthSettings("bpm", 140);
      break;
  }
}

//Handle Generate Button clicks
document.getElementById("generateButton").addEventListener("click", () => {
  const genre = document.getElementById("genreSelect").value;
  acidSequence = generateRandomSequence(length);
  //applyGenreSettings(genre);
  renderSequence();
  console.log("New Pattern: ", acidSequence);
});

//reset synth settings for selected genre
document.getElementById("resetSynthButton").addEventListener("click", () => {
  const genre = document.getElementById("genreSelect").value;
  applyGenreSettings(genre);
  console.log("Synth Settings Reset to " + genre + " defaults");
});

//Save info to variable for Firebase
document.getElementById("SaveButton").addEventListener("click", () => {
  const patternData = {
    sequence: acidSequence,
    bpm: Tone.Transport.bpm.value,
    genre: document.getElementById("genreSelect").value,
    timestamp: Date.now(),
  };

  const customId = "pattern_" + Date.now();

  //Save to Firebase
  db.collection("patterns")
    .doc(customId)
    .set(patternData)
    .then(() => {
      console.log("Pattern saved. ID: ", customId);
    })
    .catch((error) => {
      console.error("Error saving pattern:", error);
    });
});

//Download Midi logic
document.getElementById("ExportButton").addEventListener("click", () => {
  const midi = new Midi();
  const track = midi.addTrack();

  acidSequence.forEach((step, index) => {
    if (step.note) {
      track.addNote({
        midi: Tone.Frequency(step.note).toMidi(),
        time: index * 0.25, //16th notes
        duration: 0.25,
        velocity: step.velocity,
      });
    }
  });

  //trigger download midi and create blob
  const sequence_name = "acid_sequence_" + Date.now() + ".mid";
  const midiData = midi.toArray();
  const blob = new Blob([midiData], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = sequence_name;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("stopButton").addEventListener("click", () => {
  Tone.Transport.stop();
  seq.stop();
});

document.getElementById("playButton").addEventListener("click", async () => {
  await Tone.start();
  //if (Tone.Transport.state !== "started") {
  Tone.Transport.start();
  seq.start(0);
  //status?
  //}
});

//Octave Shifts
let octaveShift = 0;
let transposeOffset = 0;

function renderTransposedSequencer() {
  const stepLabels = document.querySelectorAll(".note-label");

  acidSequence.forEach((step, index) => {
    if (!stepLabels[index] || !step.note) return;

    const label = stepLabels[index];

    //Find original index
    let originalIndex = sequenceScale.indexOf(step.note);

    //Fallback if note not in scale (Quantize)
    if (originalIndex === -1) {
      const targetMidi = Tone.Frequency(step.note).toMidi();
      let closestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < sequenceScale.length; i++) {
        const scaleMidi = Tone.Frequency(sequenceScale[i]).toMidi();
        const distance = Math.abs(targetMidi - scaleMidi);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }
      originalIndex = closestIndex;
    }

    //Calculate new index
    let newIndex = originalIndex + transposeOffset + octaveShift * 7;

    //Clamp to scale bounds
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= sequenceScale.length) newIndex = sequenceScale.length - 1;

    //Update text
    label.innerText = sequenceScale[newIndex];
  });
}

function updateOctaveDisplay() {
  const display = document.getElementById("octaveDisplay");
  if (display) {
    //add + sign for positive shifts
    display.innerText = (octaveShift > 0 ? "+" : "") + octaveShift;
  }
}

document.getElementById("octaveDown").addEventListener("click", () => {
  if (octaveShift > -3) {
    octaveShift--;
    updateOctaveDisplay();
  }
});

document.getElementById("octaveUp").addEventListener("click", () => {
  if (octaveShift < 3) {
    octaveShift++;
    updateOctaveDisplay();
  }
});

//Init keyboard
const keys = new AudioKeys({
  polyphony: 1, //only allow monophonic input for sequence shift
  rows: 1,
  priority: "last", //handle keyboard mash :)
});

// Map MIDI notes (relative to C) to SCALE DEGREES
const midiToScaleStep = {
  0: 0, //root
  2: 1, //2nd
  4: 2, //3rd
  5: 3, //4th
  7: 4, //5th
  9: 5, //6th
  11: 6, //7th
  12: 7, //8ve
};

//Keydown handler
keys.down(function (note) {
  // AudioKeys defaults 'A' to MIDI 60. We normalize this to 0.
  const relPitch = note.note - 60;

  // Calculate Octave and Note Class
  const octave = Math.floor(relPitch / 12);
  // Handle negative modulo correctly for JS
  const pitchClass = ((relPitch % 12) + 12) % 12;

  if (midiToScaleStep.hasOwnProperty(pitchClass)) {
    // Calculate total scale steps
    transposeOffset = midiToScaleStep[pitchClass] + octave * 7;

    console.log(`Transpose: ${transposeOffset} steps`);
    renderTransposedSequencer();
  }
});

//oscilloscope drawing
function drawOscilloscope() {
  const canvas = document.getElementById("oscilloscope");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  //Get waveform data
  const buffer = waveform.getValue();

  //Clear background
  ctx.fillStyle = "rgba(26, 26, 26, 1)";
  ctx.fillRect(0, 0, width, height);

  //Setup Line Style
  const primaryColor = getComputedStyle(document.body)
    .getPropertyValue("--primary-color")
    .trim();
  ctx.strokeStyle = primaryColor || "#f0a500";
  ctx.lineWidth = 2; // Thicker line for better visibility
  ctx.beginPath(); // Start a new line path

  //SETTINGS
  const visualGain = 3; //Scale factor

  //Draw the Line
  for (let i = 0; i < buffer.length; i++) {
    // Apply visual gain
    let val = buffer[i] * visualGain;

    // Optional: Clamp the value so it doesn't fly off the screen if it gets too loud
    if (val > 1) val = 1;
    if (val < -1) val = -1;

    // Map -1..1 to canvas height
    const v = (val + 1) / 2;
    const y = height - v * height; // Invert Y because canvas 0 is at top
    const x = (i / buffer.length) * width;

    if (i === 0) {
      ctx.moveTo(x, y); // Start point
    } else {
      ctx.lineTo(x, y); // Connect to next point
    }
  }

  ctx.stroke(); // Actually draw the line
  requestAnimationFrame(drawOscilloscope);
}

// Start animation
drawOscilloscope();

//Load saved sequences from Firebase
const loadSelect = document.getElementById("loadSequenceSelect");

//Fetch patterns from Firebase and populate dropdown function
function fetchSequences() {
  db.collection("patterns")
    .orderBy("timestamp", "desc")
    .get()
    .then((querySnapshot) => {
      loadSelect.innerHTML = '<option value="">Load Sequence</option>';
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;

        //make it readable with genre and date
        const date = new Date(data.timestamp);
        const dateString = date.toLocaleDateString();
        const timeString = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        option.text = `${data.genre || "Sequence"} - ${dateString} ${timeString}`;
        loadSelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error fetching sequences:", error);
    });
}

//Handle the loading of a selected sequence
loadSelect.addEventListener("change", (e) => {
  const selectedId = e.target.value;
  if (!selectedId) return;

  db.collection("patterns")
    .doc(selectedId)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        acidSequence = data.sequence;

        //update bpm
        if (data.bpm) {
          Tone.Transport.bpm.value = data.bpm;
          document.getElementById("bpm").value = data.bpm;
          updateDelayTime();
        }

        //update genre selection
        if (data.genre) {
          document.getElementById("genreSelect").value = data.genre;
          updateScale(); // Regenerate scale based on genre (if it affects scale)
        }

        //update sequence display
        renderSequence();

        //reset dropdown to default
        e.target.value = "";
        console.log("Loaded sequence:", selectedId);
      } else {
        console.error("No such sequence!");
      }
    })
    .catch((error) => {
      console.error("Error loading sequence:", error);
    });
});

fetchSequences();
