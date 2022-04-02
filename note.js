/**
 * The tone.js midi→js translator ends up with output like this:
 * {
 *   "name": "G4",
 *   "midi": 67,
 *   "time": 1.37931,
 *   "velocity": 0.6299212598425197,
 *   "duration": 0.13045973750000006
 * },
 */
class Note {
    constructor(name, noteID, timestamp, velocity, duration) {
        this.name = name
        this.noteID = noteID
        this.timestamp = timestamp
        this.velocity = velocity
        this.duration = duration
    }
}