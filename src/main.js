import "./style.scss"
import Game from "./game.js"

// Getting nodes
const canvas = document.getElementById("game")
const scoreElem = document.getElementById("score")
const highscoreElem = document.getElementById("high-score")
const restartBtn = document.getElementById("restart")
const introElem = document.getElementById("introduction")
const perfElem = document.getElementById("perfect")
const congratsElem = document.getElementById("congrats")
const scoreContainer = document.getElementById("score-container")

// Creating a new game instance
const game = new Game(
  canvas,
  scoreElem,
  highscoreElem,
  restartBtn,
  introElem,
  perfElem,
  congratsElem,
  scoreContainer
)
game.addEventListeners()
game.init()
