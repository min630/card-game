const Symbols = [
  'https://cdn-icons-png.flaticon.com/512/1/1438.png', // 黑桃
  'https://cdn-icons-png.flaticon.com/512/138/138454.png', // 愛心
  'https://cdn-icons-png.flaticon.com/512/138/138455.png', // 方塊
  'https://cdn-icons-png.flaticon.com/512/105/105219.png' // 梅花
]
//宣告遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished'
}

const view = {
  getCardElement(index) {
    return `<div class="card back" data-index="${index}"> </div>`
  },
  setCardPosition(cards) {
    for (let i = 0; i < cards.length; i++) {
      const number = i % 13
      const line = Math.floor(i / 13) + 1
      const width = cards[i].clientWidth
      const height = cards[i].clientHeight
      cards[i].style.transform = `translate(-${number * (width + 8)}px, -${line * (height + 8)}px)`
    }
  },
  dealCards(cards) {
    for (let i = 0; i < cards.length; i++) {
      setTimeout(() => {
        cards[i].classList.add('deal-cards')
      }, 50 * (i + 1))
    }
    cards.forEach(card => {
      card.addEventListener("animationend", () => {
        card.style.transform = ''
        card.classList.remove('deal-cards')
      })
    })
  },
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `<p>${number}</p>
      <img src="${symbol}">
      <p>${number}</p>`
  },
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  displayCards(indexArray) {  //在cards下加入洗牌後的牌組
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexArray.map(index => this.getCardElement(index)).join('') //將牌組對應到內容程式碼
  },
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))  //記得把字串改成數字
        return
      }
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  renderScore(score) {
    document.querySelector(".score").innerHTML = `Score: ${score}`
  },
  renderTriedTimes(times) {
    document.querySelector(".tried").innerHTML = `You've tried: ${times} times`
  },
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event =>
        event.target.classList.remove('wrong'), { once: true })
    })
  },
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
      <p> <button class="btn">Play Again!</button></p>
      `
    const header = document.querySelector('#header')
    header.before(div)
    const finishedAnimation = [
      { transform: 'scale(0)' },
      { transform: 'scale(1)' }
    ];
    div.animate(finishedAnimation, {
      duration: 1000,
      iterations: 1,
    })
    const btn = document.querySelector('p .btn')
    btn.addEventListener('click', () => {
      window.location.reload()
    })
  },
  cardsFly(cards) {
    const randomArray = utility.getRandomNumberArray(52)
    for (let i = 0; i < cards.length; i++) {
      setTimeout(() => {
        cards[randomArray[i]].animate(
          [
            { transform: "translateY(0px)" },
            { transform: "translateY(-800px)" }
          ],
          {
            duration: 2000,
            iterations: 1,
            fill: 'forwards',
          }
        )
      }, 50 * (i + 1))
    }
  },
}

const model = {
  revealedCards: [],
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: onabort,
  triedTimes: 0
}

const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))  //得到隨機牌組
  },
  moveCards(cards) {
    view.setCardPosition(cards)
    view.dealCards(cards)
  },
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷是否配對成功
        if (model.isRevealedCardsMatched()) {
          this.currentState = GAME_STATE.CardsMatched
          view.renderScore(model.score += 10)
          view.pairCards(...model.revealedCards)
          if (model.score === 260) {
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            view.cardsFly(document.querySelectorAll('.card'))
            return
          }
          model.revealedCards = []
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    // console.log('this.currentState', this.currentState)
    // console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

//洗牌  (Fisher–Yates 洗牌演算法)
const utility = {
  getRandomNumberArray(amount) {
    const number = Array.from(Array(amount).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]] //前面的分號可避免前一個程式把這個程式當作接續
    }
    return number
  }
}


//用controller統一派發動作，controller以外的函式不要暴露在global區域
controller.generateCards()
const cards = document.querySelectorAll('.card')
controller.moveCards(cards)
//在每一個card設置監聽器
cards.forEach(card => {
  card.addEventListener('click', event => controller.dispatchCardAction(card))
})


