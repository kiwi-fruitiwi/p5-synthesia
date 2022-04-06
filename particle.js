class Particle {
    constructor(x, y) {
        this.pos = new p5.Vector(x, y)
        this.vel = new p5.Vector()
        this.acc = new p5.Vector()
        this.r = random(2, 5)
        this.maxspeed = 5
        this.maxforce = 1
        // this.hue = random(360)

        this.lifetime = 100
        this.img = loadImage('data/64.png')
    }


    finished() {
        return this.lifetime <= 0
    }


    /** makes vehicles bounce off edges */
    edges() {
        if (this.pos.x > width) {
            this.vel.x *= -1
            this.pos.x = width
        } else if (this.pos.x < 0) {
            this.pos.x = 0
            this.vel.x *= -1
        } else if (this.pos.y > height) {
            this.vel.y *= -1
            this.pos.y = height
        } else if (this.pos.y < 0) {
            this.pos.y = 0
            this.vel.y *= -1
        }
    }


    /** makes vehicles wrap around edges */
    wrap() {

        if (this.pos.x > width) {
            this.pos.x = 1
        } else if (this.pos.x < 0) {
            this.pos.x = width-1
        } else if (this.pos.y > height) {
            this.pos.y = 1
        } else if (this.pos.y < 0) {
            this.pos.y = height-1
        }
    }


    applyForce(force) {
        // F=ma, but we assume m=1, so F=a
        this.acc.add(force)
        this.acc.limit(this.maxforce)
    }


    update() {
        this.pos.add(this.vel)
        this.vel.add(this.acc)
        this.vel.limit(this.maxspeed)
        // this.vel.mult(0.995) // friction
        this.acc.mult(0)

        this.lifetime -= random(0.5, 0.5)
    }


    show() {
        stroke(this.hue, 100, 100)
        fill(this.hue, 100, 100, this.lifetime)

        /* TODO add .png texture later */
        circle(this.pos.x, this.pos.y, this.r*2)
        // fill(0, 0, 100)
    }
}