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
    this.ctx.save()
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.drawBackground()

    // Center main canvas area to the middle of the screen
    // need to fix the pillars not being drawn full height
    this.ctx.translate(
      (window.innerWidth - this.canvas.width) / 2 - this.sceneOffset,
      (window.innerHeight - this.canvas.width) / 2
    )

    // Draw scene
    this.drawPlatforms()
    this.drawHero()
    this.drawSticks()

    // Restore the previous drawing state
    this.ctx.restore()
  }

  drawBackground = () => {
    // Draw sky
    const gradient = this.ctx.createLinearGradient(0, 0, 0, window.innerHeight)
    gradient.addColorStop(0, "#BBD691")
    gradient.addColorStop(1, "#FEF1E1")
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

    // Draw hills
    this.drawHill(
      this.hill1BaseHeight,
      this.hill1Amplitude,
      this.hill1Stretch,
      "#95C629"
    )
    this.drawHill(
      this.hill2BaseHeight,
      this.hill2Amplitude,
      this.hill2Stretch,
      "#659F1C"
    )

    // Draw trees
    this.trees.forEach(tree => this.drawTree(tree.x, tree.color))
  }

  drawHill = (baseHeight, amplitude, stretch, color) => {
    this.ctx.beginPath()
    this.ctx.moveTo(0, window.innerHeight)
    this.ctx.lineTo(0, this.getHillY(0, baseHeight, amplitude, stretch))
    for (let i = 0; i < window.innerWidth; i++) {
      this.ctx.lineTo(i, this.getHillY(i, baseHeight, amplitude, stretch))
    }
    this.ctx.lineTo(window.innerWidth, window.innerHeight)
    this.ctx.fillStyle = color
    this.ctx.fill()
  }

  getHillY = (windowX, baseHeight, amplitude, stretch) => {
    const sineBaseY = window.innerHeight - baseHeight
    return (
      this.sinus(
        (this.sceneOffset * this.backgroundSpeedMultiplier + windowX) * stretch
      ) *
        amplitude +
      sineBaseY
    )
  }

  getTreeY = (x, baseHeight, amplitude) => {
    const sineBaseY = window.innerHeight - baseHeight
    return this.sinus(x) * amplitude + sineBaseY
  }

  drawTree = (x, color) => {
    this.ctx.save()
    this.ctx.translate(
      (-this.sceneOffset * this.backgroundSpeedMultiplier + x) *
        this.hill1Stretch,
      this.getTreeY(x, this.hill1BaseHeight, this.hill1Amplitude)
    )

    const treeTrunkHeight = 5
    const treeTrunkWidth = 2
    const treeCrownHeight = 25
    const treeCrownWidth = 10

    // Draw trunk
    this.ctx.fillStyle = "#7D833C"
    this.ctx.fillRect(
      -treeTrunkWidth / 2,
      -treeTrunkHeight,
      treeTrunkWidth,
      treeTrunkHeight
    )

    // Draw crown
    this.ctx.beginPath()
    this.ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight)
    this.ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight))
    this.ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight)
    this.ctx.fillStyle = color
    this.ctx.fill()

    this.ctx.restore()
  }

  drawPlatforms = () => {
    const lastStick = this.sticks[this.sticks.length - 1]
    this.platforms.forEach(({ x, w }) => {
      this.ctx.fillStyle = "black"
      this.ctx.fillRect(
        x,
        this.canvas.height - this.platformHeight,
        w,
        this.platformHeight + (window.innerHeight - this.canvas.height / 2)
      )

      // Draw perfect area only if hero did not yet reach the platform
      if (lastStick.x < x) {
        this.ctx.fillStyle = "red"
        this.ctx.fillRect(
          x + w / 2 - this.perfectAreaSize / 2,
          this.canvas.height - this.platformHeight,
          this.perfectAreaSize,
          this.perfectAreaSize
        )
      }
    })
  }

  drawRoundedRect = (x, y, width, height, radius) => {
    this.ctx.beginPath()
    this.ctx.moveTo(x, y + radius)
    this.ctx.lineTo(x, y + height - radius)
    this.ctx.arcTo(x, y + height, x + radius, y + height, radius)
    this.ctx.lineTo(x + width - radius, y + height)
    this.ctx.arcTo(
      x + width,
      y + height,
      x + width,
      y + height - radius,
      radius
    )
    this.ctx.lineTo(x + width, y + radius)
    this.ctx.arcTo(x + width, y, x + width - radius, y, radius)
    this.ctx.lineTo(x + radius, y)
    this.ctx.arcTo(x, y, x, y + radius, radius)
    this.ctx.fill()
  }

  drawHero = () => {
    this.ctx.save()
    this.ctx.fillStyle = "black"
    this.ctx.translate(
      this.heroX - this.heroWidth / 2,
      this.heroY +
        this.canvas.height -
        this.platformHeight -
        this.heroHeight / 2
    )

    // Body
    this.drawRoundedRect(
      -this.heroWidth / 2,
      -this.heroHeight / 2,
      this.heroWidth,
      this.heroHeight - 4,
      5
    )

    // Legs
    const legDistance = 5
    this.ctx.beginPath()
    this.ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false)
    this.ctx.fill()
    this.ctx.beginPath()
    this.ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false)
    this.ctx.fill()

    // Eye
    this.ctx.beginPath()
    this.ctx.fillStyle = "white"
    this.ctx.arc(5, -7, 3, 0, Math.PI * 2, false)
    this.ctx.fill()

    // Band
    this.ctx.fillStyle = "red"
    this.ctx.fillRect(-this.heroWidth / 2 - 1, -12, this.heroWidth + 2, 4.5)
    this.ctx.beginPath()
    this.ctx.moveTo(-9, -14.5)
    this.ctx.lineTo(-17, -18.5)
    this.ctx.lineTo(-14, -8.5)
    this.ctx.fill()
    this.ctx.beginPath()
    this.ctx.moveTo(-10, -10.5)
    this.ctx.lineTo(-15, -3.5)
    this.ctx.lineTo(-5, -7)
    this.ctx.fill()

    this.ctx.restore()
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

        if (lastStick.rotation > 90) {
          lastStick.rotation = 90

          const [nextPlatform, perfectHit] = this.thePlatformTheStickHits()
          if (nextPlatform) {
            // Increase score
            this.score += perfectHit ? 2 : 1
            this.scoreElement.innerText = this.score

            if (perfectHit) {
              this.perfectElement.style.opacity = 1
              setTimeout(() => (this.perfectElement.style.opacity = 0), 1000)
            }

            this.generatePlatform()
            this.generateTree()
            this.generateTree()
          }

          this.phase = "walking"
        }
        break
      }
      case "walking": {
        this.heroX += timePassed / this.walkingSpeed

        const [nextPlatform] = this.thePlatformTheStickHits()
        if (nextPlatform) {
          // If hero will reach another platform then limit it's position at it's edge
          const maxHeroX =
            nextPlatform.x + nextPlatform.w - this.heroDistanceFromEdge
          if (this.heroX > maxHeroX) {
            this.heroX = maxHeroX
            this.phase = "transitioning"
          }
        } else {
          // If hero won't reach another platform then limit it's position at the end of the pole
          const maxHeroX = lastStick.x + lastStick.length + this.heroWidth
          if (this.heroX > maxHeroX) {
            this.heroX = maxHeroX
            this.phase = "falling"
          }
        }
        break
      }
      case "transitioning": {
        this.sceneOffset += timePassed / this.transitioningSpeed

        const [nextPlatform] = this.thePlatformTheStickHits()
        if (
          this.sceneOffset >
          nextPlatform.x + nextPlatform.w - this.paddingX
        ) {
          // Add the next step
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
        if (lastStick.rotation < 180)
          lastStick.rotation += timePassed / this.turningSpeed

        this.heroY += timePassed / this.fallingSpeed
        const maxHeroY =
          this.platformHeight +
          100 +
          (this.canvas.width - this.canvas.height) / 2
        if (this.heroY > maxHeroY) {
          this.restartButton.style.display = "block"
          return
        }
        break
      }
      default:
        throw Error("Wrong this.phase")
    }

    this.draw()
    window.requestAnimationFrame(this.animate)

    this.lastTimestamp = timestamp
  }

  thePlatformTheStickHits = () => {
    const lastStick = this.sticks[this.sticks.length - 1]

    if (lastStick.rotation != 90) throw Error(`Stick is ${lastStick.rotation}°`)
    const stickFarX = lastStick.x + lastStick.length

    const platformTheStickHits = this.platforms.find(
      platform => platform.x < stickFarX && stickFarX < platform.x + platform.w
    )

    // If the stick hits the perfect area
    if (
      platformTheStickHits &&
      platformTheStickHits.x +
        platformTheStickHits.w / 2 -
        this.perfectAreaSize / 2 <
        stickFarX &&
      stickFarX <
        platformTheStickHits.x +
          platformTheStickHits.w / 2 +
          this.perfectAreaSize / 2
    )
      return [platformTheStickHits, true]

    return [platformTheStickHits, false]
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
    window.addEventListener("resize", this.handleResize)
  }
}

export default Game
