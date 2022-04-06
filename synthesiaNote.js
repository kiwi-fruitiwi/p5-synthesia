class SynthesiaNote extends Particle{
    constructor(x, y, height, hue) {
        super(x, y)
        this.heightScalingFactor = 200
        this.vel = new p5.Vector(0, 2)

        /* height is affected by the duration! */
        /* width should be 108-21 over canvas.width */
        this.width = width / (108-21)
        this.height = height * this.heightScalingFactor
        this.hue = hue
    }


    update() {
        super.update()

        this.lifetime = 100 /* this particle doesn't disappear */
    }


    show() {
        // stroke(this.hue, 100, 100)
        noStroke()
        fill(this.hue, 100, 100, 70)

        /* TODO add .png texture later */
        rect(this.pos.x, this.pos.y, this.width, -this.height, 2)
    }
}