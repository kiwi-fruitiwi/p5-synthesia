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
 *  ☐ setType
 *  ☐ amp ramp up
 *  ☐ add output duration to envelope
 *  ☐ scan ahead for the next note? if very close in time, more oscillators
 *  ☒ probably one oscillator per track but main objective is visualization
 *  ☒ migrate particle system
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
let rhPlaying, lhPlaying
let start /* starting time of sound playback. used as offset */

let DEBUG_TEXT = ``
let DEBUG_T2 = 'hello! press T to start playback'
let rhNotePos = 0 /* current note in the notes list */
let lhNotePos = 0 /* current note in the left-hand notes list */

let particles = [] /* holds note visualizations */


function preload() {
    font = loadFont('data/consola.ttf')
    // midiJSON = loadJSON('midi-json/tone.js/prelude2cminor.json')
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


    rh = createNotes(midiJSON['tracks'][0]['notes'])
    lh = createNotes(midiJSON['tracks'][1]['notes'])

    rhPlaying = false
    lhPlaying = false

    /* track data → console.log(midiJSON['tracks']) */
    console.log(midiJSON['tracks'])
}


function draw() {
    background(234, 34, 24)
    displayDebugCorner()
    stroke(0, 0, 100)
    strokeWeight(1)

    playRightHand()
    playLeftHand()

    for (const p of particles) {
        if (!p.finished()) {
            p.show()
            p.update()
        }
    }
}


/**
 *
 * @param note
 * @param duration
 *
 * in setADSR, attack and decay are both times while sustain is an amplitude
 * from 0 to 1. release is a time to fade out to the second arg of setRange(a,r)
 *
 * if we ever have issues with too many envelopes and oscillators existing:
 *  make list of oscillator wrapper objects that sense if they're done with
 *  playing their current note. isAvailable().
 *  → we can iterate through our list for the next available oscillator to play!
 */
function playNote(note, duration) { /* needs an actual note object */
    let envelope = new p5.Envelope()
    let freq = midiToFreq(note.noteID)

    envelope.setADSR(0.05, duration * 3/4, .5, duration * 1/4)
    envelope.setRange(note.velocity, 0)
    // envelope.setRange(1.2, 0) /* defaults to (1, 0) */

    /* old values → lhEnv.ramp(lhOsc, 0, 1.0, 0); */

    let wave = new p5.Oscillator(freq, 'sine')
    wave.start()
    wave.amp(envelope)

    DEBUG_TEXT = `${freq.toFixed(2)} Hz, ${note.noteID}→${note.name}`
    envelope.play()
}


function playRightHand() {
    if (rhPlaying) {

        /* for rh's set of notes. this comprises the right hand */
        let note = rh[rhNotePos]
        if (millis() > note.timestamp * 1000 + start) {
            playNote(note, note.duration)

            /* draw a dot with x-coordinate corresponding to its midi value */
            let x = map(note.noteID, 21, 108, 0, width)
            fill(201, 96, 83, 100)
            particles.push(new SynthesiaNote(x, 0, note.duration, 190))
            DEBUG_TEXT = `${midiToFreq(note.noteID).toFixed(2)} Hz, ${note.noteID}→${note.name}`
            rhNotePos++

            /* automatically reset if we reach the end of the song */
            if (rhNotePos >= rh.length) {
                DEBUG_TEXT = `press T again to start the music!`
                rhPlaying = false
            }
        }
    }
}


function playLeftHand() {
    if (lhPlaying) {
        /* left-hand notes */
        let note = lh[lhNotePos]
        if (millis() > note.timestamp * 1000 + start) {
            playNote(note, note.duration)

            let x = map(note.noteID, 21, 108, 0, width)
            fill(89, 100, 58, 100)
            particles.push(new SynthesiaNote(x, 0, note.duration, 90))

            console.log(lh[lhNotePos])
            DEBUG_T2 = `${midiToFreq(note.noteID).toFixed(2)} Hz, ${note.noteID}→${note.name}`
            lhNotePos++

            /* automatically reset if we reach the end of the song */
            if (lhNotePos >= lh.length) {
                lhPlaying = false
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

        lhPlaying = true
        rhPlaying = true
        rhNotePos = 0
        lhNotePos = 0
    }
}


/*
function mousePressed() {
    let midiValue = int(map(mouseY, 0, height, 21, 108))
    let n = new Note('variable', midiValue, 16, .6, .13)
    playNote(n, map(mouseX, 0, width, 0, 1.0))
}
*/


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