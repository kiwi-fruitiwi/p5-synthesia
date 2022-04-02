/**
 *  @author Kiwi
 *  @date 2022.03.19
 *
 *  The goal is to replicate musescore's music visualization feature so we
 *  can display notes raining down on a set of 88 piano keys, similar to
 *  'synthesia'.
 *
 *  we need to be able to tell time and note information from a MIDI file. our
 *  sketch being able to convert notes to real audio is irrelevant as we can
 *  layer the actual audio the MIDI file was extracted from over the
 *  visualization.
 *
 *  to convert midi to json, see
 *     https://colxi.info/midi-parser-js/test/test-es6-import.html
 *
 *
 */

/**
 *  notes on file format in MIDI
 *
 *  mido.py's printing of a MIDI message; each .mid file is full of these
 *   Message('note_on', channel=0, note=66, velocity=80, time=13),
 *
 *  The tone.js midi→js translator ends up with output like this:
 *  {
 *    "name": "G4",
 *    "midi": 67,
 *    "time": 1.37931,
 *    "velocity": 0.6299212598425197,
 *    "duration": 0.13045973750000006
 *  },
 *
 *  colxi's midi-parser-js's JSON message. the 'data' element is [note, vel]
 *   {
 *     "deltaTime": 13,
 *     "type": 9,
 *     "channel": 0,
 *     "data": [
 *       56,
 *       80
 *     ]
 *   },
 *
 *   it looks like 'type' is 'note_on'; there's a table for that
 */
let font
let instructions


let midiJSON /* json file containing translated midi msgs from tone.js */
let tracks = []
let track0_notes = [] /* track 0's notes */
let notes = [] /* list of note objects created from track 0's JSON notes */
let start /* starting time of sound playback. used as offset */
let started = false

let midiNotes = []
let noteIndex = 0
let midiVal, freq
let osc
let env

let DEBUG_TEXT = 'hello! press T to start playback'
let notePos = 0 /* current note in the notes list */


function preload() {
    font = loadFont('data/consola.ttf')
    midiJSON = loadJSON('midi-json/tone.js/toccata.json')
}


function setup() {
    let cnv = createCanvas(600, 300)
    cnv.parent('#canvas')

    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 12)


    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        [1,2,3,4,5] → no function 🐳
        s → cycle through MIDI sounds
        t → iterate through midi notes and play them
        z → freeze sketch</pre>`)


    setupOscillator()
    notes = createNotes(midiJSON['tracks'][0]['notes'])
    console.log(notes)

    /* track data → console.log(midiJSON['tracks']) */
}


function draw() {
    background(234, 34, 24)
    displayDebugCorner()

    /* if we've started:
        check notes[0]
        if notes[i].time * 1000 > offset + millis():
            use oscillator to play that note
            index++
     */
    if (started) {
        if (millis() > notes[notePos].timestamp * 1000 + start) {
            midiVal = notes[notePos].noteID;
            freq = midiToFreq(midiVal);
            console.log(freq)
            osc.freq(freq);
            env.ramp(osc, 0, 1.0, 0);

            DEBUG_TEXT = `ID: ${notes[notePos].name}, freq: ${freq.toFixed(2)} Hz`
            notePos++

            /* automatically reset if we reach the end of the song */
            if (notePos >= notes.length) {
                started = false
                DEBUG_TEXT = `press T again to start the music!`
                notePos = 0 /* reset our position */
            }
        }
    }
}


function keyPressed() {
    /* stop sketch */
    if (key === 'z') {
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    if (key === 's') {
        startSound()
    }

    if (key === 't') {
        start = millis()
        started = true
        osc.start()
    }
}


/* iterates through arr and plays notes! */
function playNotes(arr) {
    osc.start()

    for (let note in arr) {
        freq = midiToFreq(midiVal)
        osc.freq(freq)
        env.ramp(osc, 0, 1.0, 0)
    }
}


/* convert notes in tone.js midi translation into objects */
function createNotes(notesList) {
    let result = []
    for (const note of notesList) {
        /* name, noteID, timestamp, velocity, duration */
        result.push(new Note(
            note['name'],
            note['midi'],
            note['time'],
            note['velocity'],
            note['duration']
        ))
    }

    return result
}


function logTrackKeys() {
    for (let key in midiJSON['tracks'][0])
        console.log(key)
}


function setupOscillator() {
    /* set up oscillator to produce sounds */
    osc = new p5.TriOsc();
    env = new p5.Envelope();

    for (let i=40; i<80; i++) {
        midiNotes.push(i)
    }
}


function startSound() {
    /* see also: userStartAudio */
    osc.start()

    midiVal = midiNotes[noteIndex % midiNotes.length];
    freq = midiToFreq(midiVal);
    osc.freq(freq);
    env.ramp(osc, 0, 1.0, 0);
    noteIndex++;
}


/** 🧹 shows debugging info using text() 🧹 */
function displayDebugCorner() {
    const LEFT_MARGIN = 10
    const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
    const LINE_SPACING = 2
    const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING
    fill(0, 0, 100, 100) /* white */
    strokeWeight(0)

    if (midiVal) {
        text(`MIDI: ${midiVal}`,
            LEFT_MARGIN, DEBUG_Y_OFFSET - 2*LINE_HEIGHT)
        text(`freq: ${freq.toFixed(1)} Hz`,
            LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT)
    }

    text(`debug: ${DEBUG_TEXT}`,
        LEFT_MARGIN, DEBUG_Y_OFFSET)
}