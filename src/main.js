import "./style.scss"
import Game from "./game.js"
import Controls from "./controls.js"

// Getting nodes
//// For game
const canvas = document.getElementById("game")
const scoreElem = document.getElementById("score")
const highscoreElem = document.getElementById("high-score")
const restartBtn = document.getElementById("restart")
const introElem = document.getElementById("introduction")
const perfElem = document.getElementById("perfect")
const congratsElem = document.getElementById("congrats")
const scoreContainer = document.getElementById("score-container")
const bgImg = document.getElementById("bg-img")
//// For controls
const controlsBtn = document.getElementById("controls-btn")
const controlsWrapper = document.getElementById("controls-wrapper")

// Creating a new game instance
const game = new Game(
  canvas,
  scoreElem,
  highscoreElem,
  restartBtn,
  introElem,
  perfElem,
  congratsElem,
  scoreContainer,
  bgImg
)
game.init()

// Creating a new controls instance
const controls = new Controls(controlsBtn, controlsWrapper, game)
controls.init()
