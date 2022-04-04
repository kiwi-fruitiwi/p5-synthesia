/**
 * I think an Emitter keeps track of particles it spits out and manages
 * their lifespans.
 */
class Emitter {
    constructor(x, y, type) {
        this.pos = new p5.Vector(x, y)

        /* an emitter manages a list of particles */
        this.particles = []
        this.emissionRate = 3
        this.type = type /* a key string for different particle types */
    }


    show() {
        for (const p of this.particles) {
            p.show()
        }
    }


    /**
     * applies a force to all the particles in this emitter
     * @param force: p5.Vector
     */
    applyForce(force) {
        for (const p of this.particles) {
            p.applyForce(force)
        }
    }


    /** emits the correct type of particle */
    emit() {
        // if (frameCount % 5 === 0)
            for (let i=0; i<this.emissionRate; i++) {

                if (this.type === 'particle')
                    this.particles.push(new Particle(this.pos.x, this.pos.y))
                // else if (this.type === 'confetti')
                //    this.particles.push(new Confetti(this.pos.x, this.pos.y))
            }
    }


    /** shows particles and removes particles past their lifetime */
    update() {
        this.pos.x = mouseX
        this.pos.y = mouseY

        this.emit(this.emissionRate)

        // this.#cullExpiredParticles()
        this.#cullExpiredParticlesInPlace()
    }


    /** removes expired particles by creating a new particle list */
    #cullExpiredParticles() {
        let newEmitterParticles = []
        for (const p of this.particles) {
            p.update()
            p.edges()
            if (p.finished()) {
                p.show()
            } else {
                newEmitterParticles.push(p)
            }
        }

        this.particles = newEmitterParticles
    }


    /** uses splice to remove expired particles while iterating */
    #cullExpiredParticlesInPlace() {
        for (let i=this.particles.length-1; i>=0; i--) {
            let p = this.particles[i]
            p.update()
            p.edges()

            if (p.finished()) {
                p.show()
                this.particles.splice(i, 1);
            }
        }
    }
}