class Controls {
  constructor(btn, wrapper, game) {
    this.btn = btn
    this.wrapper = wrapper
    this.game = game
    this.inputEffects = this.wrapper.querySelector("#effects-volume")
    this.inputMusic = this.wrapper.querySelector("#music-volume")
    this.playPauseBtn = this.wrapper.querySelector("#play-pause-btn")
    this.playPauseSpan = this.playPauseBtn.querySelector("span")
    this.prevBtn = this.wrapper.querySelector("#prev-btn")
    this.nextBtn = this.wrapper.querySelector("#next-btn")
    this.inputs = [this.inputEffects, this.inputMusic]
  }

  init = () => {
    this.addEventListeners()
  }

  handleHamburgerClick = () => {
    let isOpen = JSON.parse(this.wrapper.getAttribute("aria-hidden"))
    this.wrapper.setAttribute("aria-hidden", !isOpen)
    this.btn.setAttribute("aria-expanded", isOpen)
  }

  handleInput = e => {
    const { value, id } = e.target
    const volume = +value
    this.game.setVolume(id, volume)
  }

  handlePlayPause = () => {
    const paused = this.playPauseBtn.getAttribute("aria-label") === "play music"
    if (paused) {
      // Play the song
      this.playPauseBtn.setAttribute("aria-label", "pause music")
      this.playPauseSpan.innerText = "pause music"
    } else {
      // Pause the song
      this.playPauseBtn.setAttribute("aria-label", "play music")
      this.playPauseSpan.innerText = "play music"
    }
    this.game.playPauseSoundtrack(this.game.currentTrack, "toggle")
  }

  handlePrevNext = action => {
    if (action === "prev") {
      this.game.prevNextSoundtrack("previous")
    }
    if (action === "next") {
      this.game.prevNextSoundtrack("next")
    }
  }

  addEventListeners = () => {
    this.btn.addEventListener("click", this.handleHamburgerClick)
    this.inputs.forEach(input => {
      input.addEventListener("change", this.handleInput)
    })
    this.playPauseBtn.addEventListener("click", this.handlePlayPause)
    this.prevBtn.addEventListener("click", () => this.handlePrevNext("prev"))
    this.nextBtn.addEventListener("click", () => this.handlePrevNext("next"))
  }
}

export default Controls
