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
 *
 *  ☐ piano keyboard visualization subproject
 *  ☐ base music on total time instead of note index? but timestamps ordered
 *  ☐ how do find grand piano sound for midi
 *      → short answer: you play real audio with the visualization :D
 *  ☒ if next 2-5 notes within tiny time window:
 *    play with auxiliary oscillators (are additional envelopes needed?)
 *    can we start one on the spot?
 *      bite-sized iteration piece: detect next note only, spin up new oscillator
 *      make midi of just 2-3 measures of chord progressions: chords.json
 *  ☒ setType
 *  ☒ amp ramp up
 *  ☒ add output duration to envelope
 *  ☒ scan ahead for the next note? if very close in time, more oscillators
 *  ☒ probably one oscillator per track but main objective is visualization
 *  ☒ migrate particle system
 *  ☒ huge refactor
 *  ☒ list of tracks → there are only two
 *  ☒ create list of notes from tracks
 *  ☒ play a few notes using millis and durations * scale
 *      → starting tone due to osc.start() too early
 *  ☒ the playing mechanism probably needs to be an object: choir + voices! :D
 *  ☒ play entire track
 *  ☒ add second track
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
let DEBUG_T2 = ``
let DEBUG_T3 = ``
let rhNotePos = 0 /* current note in the notes list */
let lhNotePos = 0 /* current note in the left-hand notes list */

let particles = [] /* holds note visualizations */
let choir /* collection of oscillators available to play notes */

function preload() {
    font = loadFont('data/consola.ttf')
}


function setup() {
    let cnv = createCanvas(600, 300)
    cnv.parent('#canvas')

    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 12)

    /* initialize instruction div */
    instructions = select('#ins')

    choir = new Choir(2)
    loadSong(`prelude & fugue in c minor`, `prelude`)
}


function draw() {
    background(234, 34, 24)
    displayDebugCorner()
    stroke(0, 0, 100)
    strokeWeight(1)

    playRightHand()
    playLeftHand()

    choir.update()

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
function deprecated_playNote(note) { /* needs an actual note object */
    const envelope = new p5.Envelope()
    const freq = midiToFreq(note.noteID)
    const ATTACK = 0.05
    const DELAY = note.duration
    const SUSTAIN_AMP = 0.25 /* value does not seem to matter */
    const RELEASE = 0.1

    envelope.setADSR(ATTACK, DELAY, SUSTAIN_AMP, RELEASE)

    const wave = new p5.Oscillator(freq, 'sine')
    wave.start()
    wave.amp(envelope)
    envelope.play()
    // DEBUG_TEXT = `${freq.toFixed(2)} Hz, ${note.noteID}→${note.name}`
}

function playRightHand() {
    if (rhPlaying) {

        /* for rh's set of notes. this comprises the right hand */
        let note = rh[rhNotePos]
        if (millis() > note.timestamp + start + 200) {
            choir.queueNote(note, 'r')

            /* draw a dot with x-coordinate corresponding to its midi value */
            let x = map(note.noteID, 21, 108, 0, width)
            fill(201, 96, 83, 100) /* -26.092 */
            particles.push(new SynthesiaNote(x, 0, note.duration, 190))
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
        if (millis() > note.timestamp + start + 200) {
            choir.queueNote(note, 'l')

            let x = map(note.noteID, 21, 108, 0, width)
            fill(89, 100, 58, 100)
            particles.push(new SynthesiaNote(x, 0, note.duration, 90))

            // console.log(lh[lhNotePos])
            // DEBUG_T2 = `${midiToFreq(note.noteID).toFixed(2)} Hz,
            // ${note.noteID}→${note.name}`
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

    /* start a song! */
    if (key === 't') {
        startSong()
    }

    switch(key) {
        case '1':
            loadSong('toccata', 'toccata')
            break
        case '2':
            loadSong('sinfonia no.2 variation', 'sinfonia')
            break
        case '3':
            loadSong('prelude & fugue in c minor', 'prelude')
            break
        case '4':
            loadSong('chords test midi', 'chords')
            break
        case '5':
            loadSong('dragonsong', 'dragonsong')
            break
    }
}


/* loads lists of notes in each instrument. in this case, L/R piano hands */
function populateInstruments() {
    rh = createNotes(midiJSON['tracks'][0]['notes'])
    lh = createNotes(midiJSON['tracks'][1]['notes'])

    rhPlaying = false
    lhPlaying = false
}


/* sets flags for starting a song */
function startSong() {
    start = millis()

    lhPlaying = true
    rhPlaying = true
    rhNotePos = 0
    lhNotePos = 0
}


function loadSong(songName, jsonTitle) {
    /* createNotes should be in a callback passed into loadJSON! */
    midiJSON = loadJSON(`midi-json/tone.js/${jsonTitle}.json`, populateInstruments)
    instructions.html(`<pre>
        → currently loaded: ${songName} 🥝🐳 press T to play!
        [1] toccata
        [2] sinfonia no.2 variation
        [3] prelude & fugue in c minor
        [4] chords test midi
        [5] dragonsong
        z → freeze sketch</pre>`)
}


function mousePressed() {
    let midiValue = int(map(mouseY, 0, height, 21, 108))
    let n = new Note('variable', midiValue, 16, .6, .13)
    // choir.playNote(n)
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


/** 🧹 shows debugging info using text() 🧹 */
function displayDebugCorner() {
    const LEFT_MARGIN = 10
    const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
    const LINE_SPACING = 2
    const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING
    fill(0, 0, 100, 100) /* white */
    strokeWeight(0)

    if (rhPlaying || lhPlaying) {
        text(`right: ${DEBUG_TEXT}`,
            LEFT_MARGIN, DEBUG_Y_OFFSET - 2*LINE_HEIGHT)

        text(` left: ${DEBUG_T2}`,
            LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT)

        text(`voice: ${DEBUG_T3}`,
            LEFT_MARGIN, DEBUG_Y_OFFSET)
    }

    /* → find max width of all lines; display semi-transparent background */
}