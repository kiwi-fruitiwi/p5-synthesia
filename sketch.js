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
 */
let font
let instructions

let midiNotes = [60, 64, 67, 72];
let noteIndex = 0;
let midiVal, freq;
let osc
let env


function preload() {
    font = loadFont('data/consola.ttf')
}


function setup() {
    let cnv = createCanvas(600, 300)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 14)

    /* initialize instruction div */
    instructions = select('#ins')
    instructions.html(`<pre>
        [1,2,3,4,5] → no function
        z → freeze sketch</pre>`)

    osc = new p5.TriOsc();
    env = new p5.Envelope();
}


function draw() {
    background(234, 34, 24)


    displayDebugCorner()
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
            LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT)
        text(`freq: ${freq.toFixed(1)}`,
            LEFT_MARGIN, DEBUG_Y_OFFSET)
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