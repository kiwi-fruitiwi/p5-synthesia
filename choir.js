/* a collection of voices that manages who's available to sing the next note */
class Choir {
    constructor(n) {
        this.voices = []
        for (let i=0; i<n; i++) {
            this.voices.push(new Voice())
        }

        /* this can be based on a formula: f(vel_y, height, piano_top_px) */
        /* does FPS matter though? */
        this.delay = 2000
        this.noteQueue = []
        console.log(`created choir with length ${this.voices.length}`)
    }


    queueNote(note) {
        /* this is pretty messy and probably requires a real data structure */
        /**
         * our noteQueue is a list of notes our choir is planning to sing.
         */
        this.noteQueue.push([note, millis(), false])
    }


    /* uses the next available voice to play a note */
    playNote(note) {
        let voiceFound = false
        for (let i in this.voices) {
            let v = this.voices[i]
            if (v.isAvailable() && !voiceFound) {
                v.play(note)
                voiceFound = true
                // console.log(`note ${note.name}→voice[${i}] of
                // ${this.voices.length-1}`)

                DEBUG_T3 = `${i}`
            }
        }

        if (!voiceFound)
            console.log(`ERROR: no voices available trying to play ${note}`)
    }


    /* asks all choir voices to update their availability */
    update() {
        /* look through noteQueue */
        for (let tuple of this.noteQueue) {
            let note = tuple[0]
            let ms = tuple[1]

            if (tuple[2] === false) { /* hasn't been played yet */
                if (millis() > ms + this.delay) {
                    this.playNote(note)

                    /* we can also try removing this tuple with splice */
                    tuple[2] = true /* set to already played */
                }
            }
        }

        for (let v of this.voices) {
            v.update()
        }
    }
}