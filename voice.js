/* wraps an oscillator, environment, and a 'ready' flag */
class Voice {
    constructor() {
        this.env = new p5.Envelope()
        this.osc = new p5.Oscillator()
        this.osc.setType('sine')

        this.lastNoteStartTime = 0
        this.lastDuration = 0
        this.available = true
        this.playedFirstNote = false
        this.currentNote = null

        console.log(`created a voice!`)
    }


    isAvailable() {
        return this.available
    }


    play(note) { /* play a note. flags availability */
        if (!this.playedFirstNote) {
            this.osc.start()
            this.playedFirstNote = true
        }

        if (this.available) {
            this.currentNote = note

            const ATTACK = 0.05
            const DELAY = note.duration/1000.0 /* duration is in ms */
            const SUSTAIN_AMP = 0.1 /* value does not seem to matter */
            const RELEASE = 0.1

            // console.log(`duration: ${note.duration}`)

            this.osc.freq(midiToFreq(note.noteID))
            this.env.setADSR(ATTACK, DELAY, SUSTAIN_AMP, RELEASE)
            this.env.setRange(0.2, 0)
            this.osc.amp(this.env)
            this.env.play()

            /* durations are in ms; note.duration is already in ms */
            this.lastNoteStartTime = millis()
            this.lastDuration = note.duration + (ATTACK+RELEASE)*1000
            this.available = false

        } else {
            console.log(`can't play due to availability`)
        }
    }


    update() { /* if we're done playing our last note, set available=true */
        if (!this.isAvailable()) {
            if (this.lastNoteStartTime + this.lastDuration < millis()) {
                this.available = true
                this.currentNote = null
                // console.log(`I'm available!: ${this.lastNoteStartTime +
                // this.lastDuration} < ${millis()}`)
            }
        }
    }
}