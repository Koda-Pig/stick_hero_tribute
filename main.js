import "./style.scss"
import Game from "./game.js"

// Getting nodes
const canvas = document.getElementById("game")
const scoreElem = document.getElementById("score")
const restartBtn = document.getElementById("restart")
const introElem = document.getElementById("introduction")
const perfElem = document.getElementById("perfect")

// Creating a new game instance
const game = new Game(canvas, scoreElem, restartBtn, introElem, perfElem)
game.addEventListeners()
game.init()
game.resetGame()
