import { registerSW } from "virtual:pwa-register"
import "./style.scss"
import Game from "./game/game.js"
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
const currentScoreContainer = document.getElementById("current-score")
const bgImgs = document.querySelectorAll(".bg-img")
const loadingScreen = document.getElementById("loading-screen")
//// For controls
const controlsBtn = document.getElementById("controls-btn")
const controlsWrapper = document.getElementById("controls-wrapper")

// Creating a new game instance
const game = new Game(
  canvas,
  scoreElem,
  highscoreElem,
  controlsBtn,
  restartBtn,
  introElem,
  perfElem,
  congratsElem,
  scoreContainer,
  currentScoreContainer,
  bgImgs,
  loadingScreen
)
game.init()

// Creating a new controls instance
const controls = new Controls(controlsBtn, controlsWrapper, game)
controls.init()

// Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.info("New content available, please refresh.")
    if (confirm("New version available, would you like to update?")) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.info("Ready for offline usage.")
  },
})
