class Controls {
  constructor(btn, wrapper, game) {
    this.menuBtn = btn
    this.wrapper = wrapper
    this.game = game
    this.inputEffects = this.wrapper.querySelector("#effects-volume")
    this.inputMusic = this.wrapper.querySelector("#music-volume")
    this.musicBtn = this.wrapper.querySelector("#music-btn")
    this.musicSpan = this.musicBtn.querySelector("span")
    this.effectsBtn = this.wrapper.querySelector("#effects-btn")
    this.effectsSpan = this.effectsBtn.querySelector("span")
    this.prevBtn = this.wrapper.querySelector("#prev-btn")
    this.nextBtn = this.wrapper.querySelector("#next-btn")
    this.inputs = [this.inputEffects, this.inputMusic]
    this.highscoreBtn = this.wrapper.querySelector("#highscore-btn")
  }

  init = () => {
    this.addEventListeners()
  }

  handleHamburgerClick = () => {
    let isOpen = JSON.parse(this.wrapper.getAttribute("aria-hidden"))
    this.wrapper.setAttribute("aria-hidden", !isOpen)
    this.menuBtn.setAttribute("aria-expanded", isOpen)
  }

  handleInput = e => {
    const { value, id } = e.target
    const volume = +value
    this.game.setVolume(id, volume)
  }

  handlePlayPauseMusic = (e, action = "change") => {
    if (this.game.gameOver) return

    const paused = this.musicBtn.getAttribute("aria-label") === "play music"
    if (paused) {
      // Play the song
      this.musicBtn.setAttribute("aria-label", "pause music")
      this.musicSpan.innerText = "pause music"
      this.game.playerSettings.soundtrackState = "playing"
    } else {
      // Pause the song
      this.musicBtn.setAttribute("aria-label", "play music")
      this.musicSpan.innerText = "play music"
      this.game.playerSettings.soundtrackState = "paused"
    }
    if (action === "change") {
      this.game.playPauseSoundtrack(this.game.currentTrack, "toggle")
    }
  }

  handlePlayPauseEffects = () => {
    if (this.game.gameOver) return
    const paused =
      this.effectsBtn.getAttribute("aria-label") === "play sound effects"
    if (paused) {
      // Play the effects
      this.effectsBtn.setAttribute("aria-label", "pause sound effects")
      this.effectsSpan.innerText = "pause sound effects"
      this.game.playerSettings.effectsState = "playing"
    } else {
      // Pause the effects
      this.effectsBtn.setAttribute("aria-label", "play sound effects")
      this.effectsSpan.innerText = "play sound effects"
      this.game.playerSettings.effectsState = "paused"
    }
    this.game.playPauseEffects()
  }

  handlePrevNext = action => {
    if (this.game.gameOver || (action !== "prev" && action !== "next")) return

    if (action === "prev") {
      this.game.prevNextSoundtrack("previous")
    }
    if (action === "next") {
      this.game.prevNextSoundtrack("next")
    }

    if (this.game.soundtrackIsPlaying()) {
      // song always starts playing when next or prev
      this.musicBtn.setAttribute("aria-label", "pause music")
      this.musicSpan.innerText = "pause music"
      this.game.playerSettings.soundtrackState = "playing"
    }
  }

  handleHighScore = () => {
    this.game.clearHighScore()
  }

  addEventListeners = () => {
    this.menuBtn.addEventListener("click", this.handleHamburgerClick)
    this.inputs.forEach(input => {
      input.addEventListener("change", this.handleInput)
    })
    this.musicBtn.addEventListener("click", e => {
      this.handlePlayPauseMusic(e, "change")
    })
    this.effectsBtn.addEventListener("click", this.handlePlayPauseEffects)
    this.prevBtn.addEventListener("click", () => this.handlePrevNext("prev"))
    this.nextBtn.addEventListener("click", () => this.handlePrevNext("next"))
    this.highscoreBtn.addEventListener("click", () => this.handleHighScore())
  }
}

export default Controls
