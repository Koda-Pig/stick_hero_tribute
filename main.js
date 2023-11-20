import "./style.scss"
import Game from "./game.js"

// Getting nodes
const canvas = document.getElementById("game")
const scoreElement = document.getElementById("score")
const restartButton = document.getElementById("restart")

// Creating a new game instance
const game = new Game(canvas, scoreElement, restartButton)
game.init()
game.addEventListeners()
game.resetGame()
