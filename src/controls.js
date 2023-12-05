class Controls {
  constructor(btn, wrapper, game) {
    this.btn = btn
    this.wrapper = wrapper
    this.game = game
    this.inputEffects = this.wrapper.querySelector("#effects-volume")
    this.inputMusic = this.wrapper.querySelector("#music-volume")

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

  addEventListeners = () => {
    this.btn.addEventListener("click", this.handleHamburgerClick)
    this.inputs.forEach(input => {
      input.addEventListener("change", this.handleInput)
    })
  }
}

export default Controls
