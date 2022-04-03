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
 *  🌟 if next 2-5 notes within tiny time window:
 *    play with auxiliary oscillators (are additional envelopes needed?)
 *    can we start one on the spot?
 *  bite-sized iteration piece: detect next note only, spin up new oscillator
 *  make midi of just 2-3 measures of chord progressions
 *
 *
 *  ☐ add output duration to envelope
 *  ☐ scan ahead for the next note? if very close in time, more oscillators
 *  ☒ probably one oscillator per track but main objective is visualization
 *  ☐ migrate particle system
 *  ☒ huge refactor
 *  ☐ base music on total time instead of note index
 *  ☒ list of tracks → there are only two
 *  ☒ create list of notes from tracks
 *  ☒ play a few notes using millis and durations * scale
 *      → starting tone due to osc.start() too early
 *  ☐ the playing mechanism probably needs to be an object
 *  ☒ play entire track
 *  ☒ add second track
 *  ☐ how do find grand piano sound for midi
 *      → short answer: you play real audio with the visualization :D
 *  ☒ add basic visualization drawing dots for midiValue → x coordinate
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
let rh, lh /* list of note objects created from tracks 0 & 1 of JSON notes */
let start /* starting time of sound playback. used as offset */
let started = false
let lhStarted = false

let midiValue, freq
let lhMidiValue, lhFreq
let osc, env
let lhOsc, lhEnv

/* flags used to prevent oscillator from playing immediately */
let firstNotePlayedRH = false
let firstNotePlayedLH = false

let DEBUG_TEXT = ``
let DEBUG_T2 = 'hello! press T to start playback'
let notePos = 0 /* current note in the notes list */
let lhNotePos = 0 /* current note in the left-hand notes list */


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
        [1,2,3,4,5] → no function 🥝🐳
        z → freeze sketch</pre>`)


    osc = new p5.TriOsc();
    env = new p5.Envelope();

    lhOsc = new p5.TriOsc();
    lhEnv = new p5.Envelope();

    rh = createNotes(midiJSON['tracks'][0]['notes'])
    lh = createNotes(midiJSON['tracks'][1]['notes'])

    /* track data → console.log(midiJSON['tracks']) */
    console.log(midiJSON['tracks'])
}


function draw() {
    background(234, 34, 24)
    displayDebugCorner()
    stroke(0, 0, 100)
    strokeWeight(2)

    /* if we've started:
        check notes[0]
        if notes[i].time * 1000 > offset + millis():
            use oscillator to play that note
            index++
     */

    playRightHand()
    playLeftHand()
}


function playRightHand() {
    if (started) {
        /* for rh's set of notes. this comprises the right hand */
        if (millis() > rh[notePos].timestamp * 1000 + start) {

            if (!(firstNotePlayedRH)) {
                firstNotePlayedRH = true
                osc.start()
            }

            midiValue = rh[notePos].noteID;
            freq = midiToFreq(midiValue);
            osc.freq(freq);
            env.ramp(osc, 0, 1.0, 0);

            /* draw a dot with x-coordinate corresponding to its midi value */
            let x = map(midiValue, 30, 90, 0, width)
            fill(201, 96, 83, 100)
            circle(x, height/2, map(rh[notePos].duration, 0, 1, 20, 50))

            DEBUG_TEXT = `${freq.toFixed(2)} Hz, ${midiValue}→${rh[notePos].name}`
            notePos++

            /* automatically reset if we reach the end of the song */
            if (notePos >= rh.length) {
                started = false
                DEBUG_TEXT = `press T again to start the music!`
                notePos = 0 /* reset our position */
                firstNotePlayedRH = false
            }
        }
    }
}


function playLeftHand() {
    if (lhStarted) {
        /* left-hand notes */
        if (millis() > lh[lhNotePos].timestamp * 1000 + start) {

            if (!(firstNotePlayedLH)) {
                firstNotePlayedLH = true
                lhOsc.start()
            }

            lhMidiValue = lh[lhNotePos].noteID;
            lhFreq = midiToFreq(lhMidiValue);
            lhOsc.freq(lhFreq);
            lhEnv.ramp(lhOsc, 0, 1.0, 0);

            let x = map(lhMidiValue, 30, 90, 0, width)
            fill(89, 100, 58, 100)
            circle(x, height/2, map(lh[lhNotePos].duration, 0, 1, 20, 50))

            console.log(lh[lhNotePos])
            DEBUG_T2 = `${lhFreq.toFixed(2)} Hz, ${lhMidiValue}→${lh[lhNotePos].name}`
            lhNotePos++

            /* automatically reset if we reach the end of the song */
            if (lhNotePos >= lh.length) {
                lhNotePos = 0 /* reset our position */
                lhStarted = false
                firstNotePlayedLH = false
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

    if (key === 't') {
        start = millis()
        started = true
        lhStarted = true
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


/** 🧹 shows debugging info using text() 🧹 */
function displayDebugCorner() {
    const LEFT_MARGIN = 10
    const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
    const LINE_SPACING = 2
    const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING
    fill(0, 0, 100, 100) /* white */
    strokeWeight(0)

    text(`RH: ${DEBUG_TEXT}`,
        LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT)

    text(`LH: ${DEBUG_T2}`,
        LEFT_MARGIN, DEBUG_Y_OFFSET)
}