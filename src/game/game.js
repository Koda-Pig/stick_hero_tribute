class Game {
  constructor(
    canvas,
    scoreElement,
    highscoreElement,
    controlsBtn,
    restartButton,
    introductionElement,
    perfectElement,
    congratsElement,
    scoreContainer,
    currentScoreElem,
    bgImgs,
    loadingScreenWrapper
  ) {
    this.canvas = canvas
    this.scoreElement = scoreElement
    this.highscoreElement = highscoreElement
    this.controlsBtn = controlsBtn
    this.restartButton = restartButton
    this.introductionElement = introductionElement
    this.perfectElement = perfectElement
    this.congratsElement = congratsElement
    this.scoreContainer = scoreContainer
    this.currentScoreElem = currentScoreElem
    this.bgImages = bgImgs
    this.loadingScreenWrapper = loadingScreenWrapper
    this.startButton = this.loadingScreenWrapper.querySelector("#start-btn")
    this.progressBar = this.loadingScreenWrapper.querySelector(
      "#loading-screen-bar-inner"
    )
    this.loadingText = this.loadingScreenWrapper.querySelector(
      ".loading-screen-text"
    )
    this.currentScore

    // Getting the drawing context
    this.ctx = this.canvas.getContext("2d")

    // Game state
    this.phase = "waiting" // waiting | stretching | turning | walking | transitioning | falling
    this.lastTimestamp // The timestamp of the previous animation cycle
    this.sceneOffset // Moves the whole game
    this.platforms = []
    this.sticks = []
    this.soundEffects = {}
    this.score = 0
    this.highscore = localStorage.getItem("stick-hero-tribute-highscore") || 0 // check if a high score is saved in user browser
    this.gameOver = true
    this.gameInit = false
    this.volume = {
      music: 0.3,
      soundEffects: 0.3,
    }
    this.spritesLoaded = false
    this.playerSettings = {
      soundtrackState: "playing",
      effectsState: "playing",
    }

    // Constants
    this.paddingX = 100 // Waiting position of player
    this.perfectAreaSize = 10
    this.stretchingSpeed = 4 // Milliseconds it takes to draw a pixel
    this.turningSpeed = 4 // Milliseconds it takes to turn a degree
    this.walkingSpeed = 4
    this.transitioningSpeed = 2
    this.fallingSpeed = 0.5 // The background moves slower than the player
    this.fallingAcceleration = 0.005
    this.backgroundSpeedMultiplier = 0.2
    this.hill1BaseHeight = 100
    this.hill1Amplitude = 10
    this.hill1Stretch = 1
    this.hill2BaseHeight = 70
    this.hill2Amplitude = 20
    this.hill2Stretch = 0.5
    this.loadingTime = 4000

    // Player
    /* Player sprite sheet is 768 x 768
     * There are 8 rows and 8 columns
     * Each frame is 96 x 96
     */
    this.player = {
      x: 0,
      y: 0, // Only changes when falling
      width: 96,
      height: 96,
      distanceFromEdge: 60, // While waiting
      frameX: 0,
      frameY: 0,
      maxFrame: 7, // 8 total frames, 0 indexed
      drawPlayerCount: 0,
      frameLimit: 1,
      sprite: new Image(),
    }
    this.player.sprite.src = "./images/sprites/monster.png"
    // ensure player sprite is loaded before drawing
    // but do not draw it on the canvas yet
    this.player.sprite.onload = () => {
      this.spritesLoaded = true
    }

    // Platforms
    this.platform = {
      x: 0,
      y: 0,
      height: 540,
      pillars: [
        {
          sprite: new Image(),
          url: "./images/platforms/platform-1.webp",
          width: 20,
        },
        {
          sprite: new Image(),
          url: "./images/platforms/platform-2.webp",
          width: 30,
        },
        {
          sprite: new Image(),
          url: "./images/platforms/platform-3.webp",
          width: 40,
        },
        {
          sprite: new Image(),
          url: "./images/platforms/platform-4.webp",
          width: 50,
        },
        {
          sprite: new Image(),
          url: "./images/platforms/platform-5.webp",
          width: 60,
        },
        {
          sprite: new Image(),
          url: "./images/platforms/platform-6.webp",
          width: 70,
        },
        {
          sprite: new Image(),
          url: "./images/platforms/platform-7.webp",
          width: 80,
        },
        {
          sprite: new Image(),
          url: "./images/platforms/platform-8.webp",
          width: 90,
        },
        {
          sprite: new Image(),
          url: "./images/platforms/platform-9.webp",
          width: 100,
        },
      ],
    }

    this.platform.pillars.forEach(pillar => {
      pillar.sprite.src = pillar.url
      pillar.sprite.onload = () => {
        this.platformsLoaded = true
      }
    })
  }

  // Initialize game
  init = () => {
    this.canvas.width = window.innerWidth
    this.canvasWidth = window.innerWidth
    this.canvas.height = window.innerHeight
    this.canvasHeight = window.innerHeight
    this.platformHeight = this.canvasHeight / 2

    // Background
    this.background = {
      gameWidth: this.canvasWidth,
      gameHeight: this.canvasHeight,
      images: [
        { src: this.bgImages[0], speed: 0 }, // Sky
        { src: this.bgImages[1], speed: 0.05 }, // Clouds 1
        { src: this.bgImages[2], speed: 0.1 }, // Clouds 2
        { src: this.bgImages[3], speed: 0.15 }, // Clouds 3
        { src: this.bgImages[4], speed: 0.2 }, // Clouds 4
        { src: this.bgImages[5], speed: 0.25 }, // Rocks 1
        { src: this.bgImages[6], speed: 0.3 }, // Rocks 2
      ],
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      speed: 2,
      version: 1,
      minVersion: 1,
      maxVersion: 4,
    }

    this.getAnimationDuration()
    this.loadSoundEffects()
    this.addEventListeners()
  }

  // Sinus function that takes degrees instead of radians
  sinus = degree => {
    return Math.sin((degree / 180) * Math.PI)
  }

  // Get animation duration from global css variable
  getAnimationDuration = () => {
    // get animation duration from global css variable declared on the :root as --animation-duration:
    const styles = getComputedStyle(document.documentElement)
    this.perfectAnimationDuration = parseInt(
      styles.getPropertyValue("--animation-duration")
    )
  }

  // Draw the whole scene
  draw = () => {
    this.ctx.save()
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)

    this.drawBackground()

    // Center main canvas area to the middle of the screen
    this.ctx.translate(0 - this.sceneOffset, 0)

    // Draw scene
    this.drawPlatforms()
    this.drawPlayer()
    this.drawSticks()

    // Restore the previous drawing state
    this.ctx.restore()
  }

  // Draw the background
  drawBackground = () => {
    // Calculate the scale to cover the height of the canvas
    const scale = this.canvas.height / this.background.height

    // Calculate the scaled width and height
    const scaledWidth = this.background.width * scale
    const scaledHeight = this.canvas.height // Use the height of the canvas

    // Draw the images in a loop to cover the entire canvas width
    for (let i = 0; i < this.background.images.length; i++) {
      // Update the x position of the background for parallax effect
      this.background.x =
        -(
          this.sceneOffset *
          this.background.speed *
          this.background.images[i].speed
        ) % scaledWidth

      for (let x = this.background.x; x < this.canvas.width; x += scaledWidth) {
        this.ctx.drawImage(
          this.background.images[i].src,
          0, // Source X
          0, // Source Y
          this.background.width, // Source Width
          this.background.height, // Source Height
          x, // Destination X
          0, // Destination Y
          scaledWidth, // Destination Width
          scaledHeight // Destination Height
        )
      }
    }
  }

  // Draw all platforms
  drawPlatforms = () => {
    this.platforms.forEach(({ x, w, pillar }) => {
      // draw sprite
      this.drawSprite(
        pillar.sprite,
        0,
        0,
        pillar.width,
        this.platform.height,
        x,
        this.canvasHeight / 2,
        w,
        this.canvasHeight / 2
      )

      // Draw perfect area
      this.ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
      this.ctx.fillRect(
        x + w / 2 - this.perfectAreaSize / 2,
        this.canvasHeight - this.platformHeight,
        this.perfectAreaSize,
        this.perfectAreaSize
      )
    })

    // Remove platforms that are no longer in the viewport:
    this.platforms = this.platforms.filter(
      platform => platform.x + platform.w > this.sceneOffset
    )
  }

  // Draw a rounded rectangle
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

  // Draw the player
  drawPlayer = () => {
    this.ctx.save()
    this.ctx.translate(
      this.player.x - this.player.width / 2,
      this.player.y +
        this.canvasHeight -
        this.platformHeight -
        this.player.height * 1.17
    )

    // Draw sprite
    this.drawSprite(
      this.player.sprite,
      this.player.width * this.player.frameX, // sX
      this.player.height * this.player.frameY, // sY
      this.player.width, // sWidth
      this.player.height, // sHeight
      this.player.width / 2, // dX (center the sprite)
      this.player.height / 2, // dY (center the sprite)
      this.player.width,
      this.player.height
    )

    this.animateSprite()

    this.ctx.restore()
  }

  // Animate sprite
  animateSprite = () => {
    // Limit the animation to every second frame
    if (this.player.drawPlayerCount % this.player.frameLimit === 0) {
      if (this.player.frameX < this.player.maxFrame) {
        this.player.frameX++
      } else {
        this.player.frameX = 0
        this.player.drawPlayerCount = 0
      }
    }
    this.player.drawPlayerCount++
  }

  // Draw sprite
  drawSprite = (img, sX, sY, sW, sH, dX, dY, dW, dH) => {
    /* img: image object
     * sX: x coordinate of the top left corner of the source image
     * sY: y coordinate of the top left corner of the source image
     * sW: width of the source image
     * sH: height of the source image
     * dX: x coordinate in the canvas at which to place the top left corner of the source image
     * dY: y coordinate in the canvas at which to place the top left corner of the source image
     * dW: width of the source image to use (stretch or reduce the image)
     * dH: height of the source image to use (stretch or reduce the image)
     */
    this.ctx.drawImage(img, sX, sY, sW, sH, dX, dY, dW, dH)
  }

  // Draw all sticks
  drawSticks = () => {
    this.sticks.forEach(stick => {
      this.ctx.save()

      // Move the anchor point to the start of the stick and rotate
      this.ctx.translate(stick.x, this.canvasHeight - this.platformHeight)
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

    // Remove sticks that are no longer in the viewport,
    // after the player has walked past them and thePlatformTheStickHits() has been called
    this.sticks = this.sticks.filter(
      stick => stick.x > this.sceneOffset - this.canvasWidth
    )
  }

  // Get the y coordinate of a hill
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

  // Get the y coordinate of a tree
  getTreeY = (x, baseHeight, amplitude) => {
    const sineBaseY = window.innerHeight - baseHeight
    return this.sinus(x) * amplitude + sineBaseY
  }

  // The main animation loop
  animate = timestamp => {
    if (!this.spritesLoaded || !this.platformsLoaded) return
    // Either the width of the canvas or half of it's height
    const maxLength =
      this.canvasWidth > this.canvasHeight / 2
        ? this.canvasHeight / 2
        : this.canvasWidth

    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp
      window.requestAnimationFrame(this.animate)
      return
    }

    let timePassed = timestamp - this.lastTimestamp
    const lastStick = this.sticks[this.sticks.length - 1]

    switch (this.phase) {
      case "waiting":
        this.player.frameY = 0
        this.player.frameLimit = 5
        break
      case "stretching": {
        this.player.frameY = 0
        this.player.frameLimit = 5
        lastStick.length += timePassed / this.stretchingSpeed

        if (this.playerSettings.effectsState === "playing") {
          this.soundEffects.stretching.play()
        }

        // Prevent the stick from stretching too far
        if (lastStick.length > maxLength) {
          lastStick.length = maxLength
          this.phase = "turning"
        }
        break
      }
      case "turning": {
        this.player.frameY = 0
        this.player.frameLimit = 5
        this.soundEffects.stretching.pause()
        this.soundEffects.stretching.currentTime = 0.2

        lastStick.rotation += timePassed / this.turningSpeed

        if (lastStick.rotation > 90) {
          lastStick.rotation = 90

          const [nextPlatform, perfectHit] = this.thePlatformTheStickHits()
          if (nextPlatform) {
            // Increase score
            this.score += perfectHit ? 2 : 1
            this.currentScoreElem.innerText = this.score

            if (perfectHit) {
              this.perfectElement.classList.add("highlight")
              if (this.playerSettings.effectsState === "playing") {
                this.soundEffects.perfect.play()
              }

              setTimeout(() => {
                this.perfectElement.classList.remove("highlight")
              }, this.perfectAnimationDuration)
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
        this.player.frameY = 1
        this.player.frameLimit = 1

        this.player.x += timePassed / this.walkingSpeed

        // Play walking sound
        if (this.playerSettings.effectsState === "playing") {
          this.soundEffects.walking.play()
        }

        const [nextPlatform] = this.thePlatformTheStickHits()
        if (nextPlatform) {
          // If player will reach another platform then limit it's position at it's edge
          const offsetNext = 58
          const maxPlayerX = nextPlatform.x + nextPlatform.w - offsetNext
          if (this.player.x > maxPlayerX) {
            this.player.x = maxPlayerX
            this.phase = "transitioning"
          }
        } else {
          // If player won't reach another platform then limit it's position at the end of the pole
          const offsetEnd = 30
          const maxPlayerX = lastStick.x + lastStick.length - offsetEnd
          if (this.player.x > maxPlayerX) {
            this.player.x = maxPlayerX
            this.phase = "falling"
          }
        }
        break
      }
      case "transitioning": {
        this.player.frameLimit = 5
        this.soundEffects.walking.pause()
        this.soundEffects.walking.currentTime = 0

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
        this.player.frameLimit = 2
        // need to create another sprite for falling
        this.player.frameY = 0

        if (this.playerSettings.effectsState === "playing") {
          this.soundEffects.walking.pause()
          this.soundEffects.falling.play()
        }

        this.fallingSpeed += this.fallingAcceleration * timePassed
        this.player.y += this.fallingSpeed * timePassed

        // Stick falling animation
        // Ensure stick doesn't fall further than 90 degrees
        if (lastStick.rotation < 180) {
          lastStick.rotation += this.turningSpeed * timePassed * 0.0905
        }

        const maxPlayerY =
          this.canvasHeight - this.platformHeight + this.player.height + 10

        // Player falls off screen
        if (this.player.y > maxPlayerY) {
          this.restartButton.classList.remove("hide")
          this.gameOver = true
          this.scoreElement.innerText = this.score
          this.currentScoreElem.classList.add("visually-hidden")
          this.scoreContainer.classList.remove("hide")
          this.handleHighScore()
        }
        break
      }
      default:
        throw Error("Wrong", this.phase)
    }

    this.draw()
    if (this.gameOver) return

    window.requestAnimationFrame(this.animate)

    this.lastTimestamp = timestamp
  }

  // Returns the platform the stick hits and whether it hits the perfect area
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
    ) {
      return [platformTheStickHits, true]
    }

    return [platformTheStickHits, false]
  }

  // Generates a new platform
  generatePlatform = () => {
    this.minGap = 40
    this.maxGap = 200
    this.minWidth = 20
    this.maxWidth = 100

    // X coordinate of the right edge of the furthest platform
    const lastPlatform = this.platforms[this.platforms.length - 1]
    let furthestX = lastPlatform.x + lastPlatform.w

    const x =
      furthestX +
      this.minGap +
      Math.floor(Math.random() * (this.maxGap - this.minGap))
    // Random width between 20 and 100
    const w =
      Math.floor(
        Math.random() * (this.maxWidth / 10 - 1) + this.minWidth / 10
      ) * 10

    // Select a pillar based on the w value. The pillars get progressively wider,
    // So match the pillar based on the width of the platform:
    let pillar
    if (w === 20) {
      pillar = this.platform.pillars[0]
    } else if (w === 30) {
      pillar = this.platform.pillars[1]
    } else if (w === 40) {
      pillar = this.platform.pillars[2]
    } else if (w === 50) {
      pillar = this.platform.pillars[3]
    } else if (w === 60) {
      pillar = this.platform.pillars[4]
    } else if (w === 70) {
      pillar = this.platform.pillars[5]
    } else if (w === 80) {
      pillar = this.platform.pillars[6]
    } else if (w === 90) {
      pillar = this.platform.pillars[7]
    } else {
      pillar = this.platform.pillars[8]
    }

    this.platforms.push({ x, w, pillar })
  }

  // Generates a new tree
  generateTree = () => {
    const minGap = 30
    const maxGap = 150

    // X coordinate of the right edge of the furthest tree
    const lastTree = this.trees[this.trees.length - 1]
    let furthestX = lastTree ? lastTree.x : 0

    const x = furthestX + minGap + Math.floor(Math.random() * (maxGap - minGap))

    const treeColors = ["#6D8821", "#8FAC34", "#98B333"]
    const color = treeColors[Math.floor(Math.random() * 3)]

    this.trees.push({ x, color })
  }

  // Resets game state and layout
  resetGame = () => {
    // Play track if game is first time initialized
    if (this.gameInit) {
      this.canvas.classList.add("active")

      // Only play soundtrack on restart if user has not paused it
      // Never pause the soundtrack on restart
      // const soundtrackPlaying = this.soundtrack.some(track => !track.paused)
      if (
        !this.soundtrackIsPlaying() &&
        this.playerSettings.soundtrackState !== "paused"
      ) {
        this.playPauseSoundtrack(0)
      }
    }

    // Reset game state
    this.phase = "waiting"
    this.lastTimestamp = undefined
    this.sceneOffset = 0
    this.score = 0
    this.fallingSpeed = 0.5
    this.gameOver = false

    this.introductionElement.classList.remove("hide")
    this.currentScoreElem.classList.remove("visually-hidden")
    this.currentScoreElem.classList.remove("visually-hidden")
    this.scoreContainer.classList.add("hide")

    this.restartButton.classList.add("hide")
    this.congratsElement.classList.remove("highlight")
    this.scoreElement.innerText = this.score
    this.highscoreElement.innerText = this.highscore

    // The first platform is always the same - 4th platform is 50px wide
    this.platforms = [{ x: 50, w: 50, pillar: this.platform.pillars[3] }]

    // Keep generating platforms until the screen is full
    while (this.totalPlatformWidth() < window.innerWidth) {
      this.generatePlatform()
    }

    // There's always a stick, even if it appears to be invisible (length: 0)
    this.sticks = [
      { x: this.platforms[0].x + this.platforms[0].w, length: 0, rotation: 0 },
    ]

    this.trees = []

    // Generate trees
    for (let i = 0; i < 20; i++) this.generateTree()

    // Initialize player position
    this.player.x =
      this.platforms[0].x + this.platforms[0].w - this.player.distanceFromEdge
    this.player.y = 0

    this.draw()
  }

  // Returns the total width of all platforms
  totalPlatformWidth = () => {
    // Use reduce to find the rightmost edge of the platforms
    const totalPlatformWidth = this.platforms.reduce((max, platform) => {
      const rightEdge = platform.x + platform.w
      return rightEdge > max ? rightEdge : max
    }, 0)

    return totalPlatformWidth
  }

  // Create sound effects
  loadSoundEffects = () => {
    // Stretching sound
    this.soundEffects.stretching = new Audio("./sound-effects/cartoon-rise.wav")
    this.soundEffects.stretching.playbackRate = 0.3

    // Walking sound
    this.soundEffects.walking = new Audio("./sound-effects/scuttle.wav")

    // Falling sound
    this.soundEffects.falling = new Audio("./sound-effects/falling.wav")
    this.soundEffects.falling.playbackRate = 10

    // Perfect/new highscore sound
    this.soundEffects.perfect = new Audio("./sound-effects/win.wav")

    // Preload all of the sound effects
    Object.values(this.soundEffects).forEach(sound => {
      sound.preload = "auto"
      sound.load()
      sound.volume = 0
      sound.play().catch(e => console.error("Error playing sound:", e))

      // After half the loadingTime, stop the sound
      setTimeout(() => {
        sound.pause()
        sound.currentTime = 0 // Reset the sound to the beginning
        sound.volume = this.volume.soundEffects
      }, this.loadingTime / 2)
    })

    // Load soundtrack
    this.soundtrack = []
    fetch("./data/tracklist.json")
      .then(response => response.json())
      .then(data => {
        this.soundtrack = data.map(track => {
          let audio = new Audio(track.url)
          audio.preload = "auto"
          audio.volume = this.volume.music
          return audio
        })
      })
      .catch(error => console.error(error))
  }

  // Set volume
  setVolume = (id, volume) => {
    if (id === "music-volume") {
      this.volume.music = volume
      this.soundtrack.forEach(track => {
        track.volume = this.volume.music
      })
    }
    if (id === "effects-volume") {
      this.volume.soundEffects = volume
      Object.values(this.soundEffects).forEach(sound => {
        sound.volume = this.volume.soundEffects
      })
    }
  }

  // Control soundtrack
  playPauseSoundtrack(trackindex, action = "toggle") {
    if (trackindex >= this.soundtrack.length) trackindex = 0
    if (trackindex < 0) trackindex = this.soundtrack.length - 1

    const currentTrack = this.soundtrack[trackindex]

    // If 'toggle' is selected, play or pause the track depending on its current state
    if (action === "toggle") {
      if (currentTrack.paused) currentTrack.play()
      else currentTrack.pause()
    }

    this.currentTrack = trackindex
    currentTrack.onended = () =>
      this.playPauseSoundtrack(trackindex + 1, "toggle")
  }

  playPauseEffects() {
    console.log(this.playerSettings.effectsState)
    // If 'toggle' is selected, play or pause the track depending on its current state
  }

  prevNextSoundtrack(action) {
    const currentTrack = this.soundtrack[this.currentTrack]

    // Pause and reset the current track
    if (!currentTrack.paused) {
      currentTrack.pause()
      currentTrack.currentTime = 0
    }

    // Calculate the new track index
    const newTrackIndex =
      action === "next" ? this.currentTrack + 1 : this.currentTrack - 1

    // Play the new track
    this.playPauseSoundtrack(newTrackIndex, "toggle")
  }

  soundtrackIsPlaying = () => {
    return this.soundtrack.some(track => !track.paused)
  }

  // handle mouse down/ touch start
  handleClick = e => {
    e.preventDefault()
    if (this.phase == "waiting") {
      this.lastTimestamp = undefined
      this.introductionElement.classList.add("hide")
      this.phase = "stretching"
    }
  }

  // handle mouse up/ touch end
  handleRelease = () => {
    if (this.phase == "stretching") this.phase = "turning"
  }

  // handle window resize
  handleResize = () => {
    this.canvas.width = window.innerWidth
    this.canvasWidth = window.innerWidth
    this.canvas.height = window.innerHeight
    this.canvasHeight = window.innerHeight
    this.platformHeight = this.canvasHeight / 2
    // Do not draw if game is over or not started yet
    if (this.gameOver) return
    this.draw()
  }

  // handle restart button click
  handleRestart = (e, type) => {
    if (type === "click" || (type === "keydown" && e.key === " ")) {
      e.preventDefault()
      this.resetGame()
      this.restartButton.classList.add("hide")
      window.requestAnimationFrame(this.animate)
      this.controlsBtn.classList.add("show")
    }
  }

  // handle high score
  handleHighScore = () => {
    if (this.score <= this.highscore) return
    localStorage.setItem("stick-hero-tribute-highscore", this.score)
    this.highscore = this.score
    this.highscoreElement.innerText = this.highscore
    this.congratsElement.classList.add("highlight")
    if (this.playerSettings.effectsState === "playing") {
      this.soundEffects.perfect.currentTime = 0
      this.soundEffects.perfect.play()
    }
  }

  clearHighScore = () => {
    this.highscore = 0
    localStorage.setItem("stick-hero-tribute-highscore", this.highscore)
    this.highscoreElement.innerText = this.highscore
  }

  // Loading screen
  // Set to 3 seconds to load assets
  loadingScreen = () => {
    // Increment the width of the progress bar by 1% every 20ms
    let progress = 0
    this.loadingText.classList.remove("visually-hidden")

    const interval = setInterval(() => {
      progress++
      this.progressBar.style.width = `${progress}%`

      if (progress % 30 === 0) {
        this.loadingText.innerText += "."
      }

      if (progress === 100) {
        clearInterval(interval)
        this.loadingScreenWrapper.classList.add("hide")
        this.gameInit = true
        this.resetGame()
        this.restartButton.classList.add("hide")
        window.requestAnimationFrame(this.animate)
        this.controlsBtn.classList.add("show")
      }
    }, this.loadingTime / 100)
  }

  changeBackground = () => {
    if (this.background.version === this.background.maxVersion) {
      this.background.version = this.background.minVersion
    } else {
      this.background.version++
    }
    this.bgImages.forEach((img, i) => {
      img.src = `/images/backgrounds/parallax/game_background_${this.background.version}/layers/layer_${i}.webp`
    })
  }

  // Add event listeners
  addEventListeners = () => {
    this.canvas.addEventListener("mousedown", e => this.handleClick(e))
    this.canvas.addEventListener("touchstart", e => this.handleClick(e))
    this.canvas.addEventListener("mouseup", this.handleRelease)
    this.canvas.addEventListener("touchend", this.handleRelease)
    this.startButton.addEventListener("click", () => {
      this.init()
      this.loadingScreen()
    })
    this.restartButton.addEventListener("click", e =>
      this.handleRestart(e, "click")
    )
    window.addEventListener("keydown", e => this.handleRestart(e, "keydown"))
    window.addEventListener("resize", this.handleResize)
  }
}

export default Game
