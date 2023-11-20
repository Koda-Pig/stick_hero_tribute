class Game {
  constructor(
    canvas,
    scoreElement,
    restartButton,
    introductionElement,
    perfectElement
  ) {
    this.canvas = canvas
    this.scoreElement = scoreElement
    this.restartButton = restartButton
    this.introductionElement = introductionElement
    this.perfectElement = perfectElement

    // Getting the drawing context
    this.ctx = this.canvas.getContext("2d")

    // Game state
    this.phase = "waiting" // waiting | stretching | turning | walking | transitioning | falling
    this.lastTimestamp // The timestamp of the previous animation cycle
    this.heroX // Changes when moving forward
    this.heroY // Only changes when falling
    this.sceneOffset // Moves the whole game
    this.platforms = []
    // this.sticks = []
    this.sticks = [{ x: 100, length: 50, rotation: 60 }] // CHANGE THIS BACK TO EMPTY ARRAY
    this.score = 0

    // Constants
    this.platformHeight = 100
    this.heroDistanceFromEdge = 10 // While waiting
    this.paddingX = 100 // Waiting position of hero
    this.perfectAreaSize = 10
    this.stretchingSpeed = 4 // Milliseconds it takes to draw a pixel
    this.turningSpeed = 4 // Milliseconds it takes to turn a degree
    this.walkingSpeed = 4
    this.transitioningSpeed = 2
    this.fallingSpeed = 2 // The background moves slower than the hero
    this.backgroundSpeedMultiplier = 0.2
    this.hill1BaseHeight = 100
    this.hill1Amplitude = 10
    this.hill1Stretch = 1
    this.hill2BaseHeight = 70
    this.hill2Amplitude = 20
    this.hill2Stretch = 0.5
    this.heroWidth = 17 // 24
    this.heroHeight = 30 // 40
  }

  init = () => {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  last = array => {
    return array[array.length - 1]
  }

  sinus = degree => {
    return Math.sin((degree / 180) * Math.PI)
  }

  draw = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Save the current drawing state
    this.ctx.save()

    // Shift view
    this.ctx.translate(-this.sceneOffset, 0)

    // Draw scene
    this.drawPlatforms()
    this.drawHero()
    this.drawSticks()

    // Restore the previous drawing state
    this.ctx.restore()
  }

  drawPlatforms = () => {
    this.platforms.forEach(({ x, w }) => {
      this.ctx.fillStyle = "black"
      this.ctx.fillRect(
        x,
        this.canvas.height - this.platformHeight,
        w,
        this.platformHeight
      )
    })
  }

  drawHero = () => {
    this.heroWidth = 20
    this.heroHeight = 30

    this.ctx.fillStyle = "red"
    this.ctx.fillRect(
      this.heroX,
      this.heroY + this.canvas.height - this.platformHeight - this.heroHeight,
      this.heroWidth,
      this.heroHeight
    )
  }

  drawSticks = () => {
    this.sticks.forEach(stick => {
      this.ctx.save()

      // Move the anchor point to the start of the stick and rotate
      this.ctx.translate(stick.x, this.canvas.height - this.platformHeight)
      this.ctx.rotate((Math.PI / 180) * stick.rotation)

      // Draw stick
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.moveTo(0, 0)
      this.ctx.lineTo(0, -stick.length)
      this.ctx.stroke()

      // Restore transformations
      this.ctx.restore()
    })
  }

  animate = timestamp => {
    if (!this.lastTimestamp) {
      // First cycle
      this.lastTimestamp = timestamp
      window.requestAnimationFrame(this.animate)
      return
    }

    let timePassed = timestamp - this.lastTimestamp
    const lastStick = this.sticks[this.sticks.length - 1]

    switch (this.phase) {
      case "waiting":
        return // Stop the loop
      case "stretching": {
        lastStick.length += timePassed / this.stretchingSpeed
        break
      }
      case "turning": {
        lastStick.rotation += timePassed / this.turningSpeed

        if (lastStick.rotation >= 90) {
          lastStick.rotation = 90

          const nextPlatform = this.thePlatformTheStickHits()
          if (nextPlatform) {
            this.score++
            this.scoreElement.innerText = this.score

            this.generatePlatform()
          }

          this.phase = "walking"
        }
        break
      }
      case "walking": {
        this.heroX += timePassed / this.walkingSpeed

        const nextPlatform = this.thePlatformTheStickHits()
        if (nextPlatform) {
          // If the hero will reach another platform then limit its position at its edge
          const maxHeroX = nextPlatform.x + nextPlatform.w - 30
          if (this.heroX > maxHeroX) {
            this.heroX = maxHeroX
            this.phase = "transitioning"
          }
        } else {
          // If the hero won't reach another platform then limit its position at the end of the pole
          const maxHeroX =
            this.sticks[this.sticks.length - 1].x +
            this.sticks[this.sticks.length - 1].length
          if (this.heroX > maxHeroX) {
            this.heroX = maxHeroX
            this.phase = "falling"
          }
        }
        break
      }
      case "transitioning": {
        this.sceneOffset += timePassed / this.transitioningSpeed
        const nextPlatform = this.thePlatformTheStickHits()
        if (nextPlatform.x + nextPlatform.w - this.sceneOffset < 100) {
          this.sticks.push({
            x: nextPlatform.x + nextPlatform.w,
            length: 0,
            rotation: 0,
          })
          this.phase = "waiting"
        }
        break
      }
      case "falling": {
        this.heroY += timePassed / this.fallingSpeed
        if (this.sticks[this.sticks.length - 1].rotation < 180) {
          this.sticks[this.sticks.length - 1].rotation +=
            timePassed / this.turningSpeed
        }

        const maxHeroY = this.platformHeight + 100
        if (this.heroY > maxHeroY) {
          this.restartButton.style.display = "block"
          return
        }
        break
      }
    }

    this.draw()
    this.lastTimestamp = timestamp

    window.requestAnimationFrame(this.animate)
  }

  thePlatformTheStickHits = () => {
    const lastStick = this.sticks[this.sticks.length - 1]
    const stickFarX = lastStick.x + lastStick.length

    const platformTheStickHits = this.platforms.find(
      platform => platform.x < stickFarX && stickFarX < platform.x + platform.w
    )

    return platformTheStickHits
  }

  // Generates a new platform
  generatePlatform = () => {
    this.minimumGap = 40
    this.maximumGap = 200
    this.minimumWidth = 20
    this.maximumWidth = 100

    // X coordinate of the right edge of the furthest platform
    const lastPlatform = this.platforms[this.platforms.length - 1]
    let furthestX = lastPlatform.x + lastPlatform.w

    const x =
      furthestX +
      this.minimumGap +
      Math.floor(Math.random() * (this.maximumGap - this.minimumGap))
    const w =
      this.minimumWidth +
      Math.floor(Math.random() * (this.maximumWidth - this.minimumWidth))

    this.platforms.push({ x, w })
  }

  // Generates a new tree
  generateTree = () => {
    const minimumGap = 30
    const maximumGap = 150

    // X coordinate of the right edge of the furthest tree
    const lastTree = this.trees[this.trees.length - 1]
    let furthestX = lastTree ? lastTree.x : 0

    const x =
      furthestX +
      minimumGap +
      Math.floor(Math.random() * (maximumGap - minimumGap))

    const treeColors = ["#6D8821", "#8FAC34", "#98B333"]
    const color = treeColors[Math.floor(Math.random() * 3)]

    this.trees.push({ x, color })
  }

  // Resets game state and layout
  resetGame = () => {
    // Reset game state
    this.phase = "waiting"
    this.lastTimestamp = undefined
    this.sceneOffset = 0
    this.score = 0

    this.introductionElement.style.opacity = 1
    this.perfectElement.style.opacity = 0
    this.restartButton.style.display = "none"
    this.scoreElement.innerText = this.score

    // The first platform is always the same
    this.platforms = [{ x: 50, w: 50 }]
    this.generatePlatform()
    this.generatePlatform()
    this.generatePlatform()
    this.generatePlatform()

    // There's always a stick, even if it appears to be invisible (length: 0)
    this.sticks = [
      { x: this.platforms[0].x + this.platforms[0].w, length: 0, rotation: 0 },
    ]

    this.trees = []
    this.generateTree()
    this.generateTree()
    this.generateTree()
    this.generateTree()
    this.generateTree()
    this.generateTree()
    this.generateTree()
    this.generateTree()
    this.generateTree()

    // Initialize hero position
    this.heroX =
      this.platforms[0].x + this.platforms[0].w - this.heroDistanceFromEdge
    this.heroY = 0

    this.draw()
  }

  // handle mouse down/ touch start
  handleClick = e => {
    e.preventDefault()
    if (this.phase == "waiting") {
      this.lastTimestamp = undefined
      this.introductionElement.style.opacity = 0
      this.phase = "stretching"
      window.requestAnimationFrame(this.animate)
    }
  }

  // handle mouse up/ touch end
  handleRelease = () => {
    if (this.phase == "stretching") {
      this.phase = "turning"
    }
  }

  handleResize = () => {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  // handle restart button click
  handleRestart = (e, type) => {
    if (type === "click") {
      this.resetGame()
      this.restartButton.style.display = "none"
    } else if (type === "keydown" && e.key === " ") {
      e.preventDefault()
      this.resetGame()
      return
    }
  }

  addEventListeners = () => {
    this.canvas.addEventListener("mousedown", e => this.handleClick(e))
    this.canvas.addEventListener("touchstart", e => this.handleClick(e))
    this.canvas.addEventListener("mouseup", this.handleRelease)
    this.canvas.addEventListener("touchend", this.handleRelease)
    this.restartButton.addEventListener("click", e =>
      this.handleRestart(e, "click")
    )
    window.addEventListener("keydown", e => this.handleRestart(e, "keydown"))
  }
}

export default Game
