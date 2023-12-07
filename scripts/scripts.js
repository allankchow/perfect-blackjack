'use strict';


// Deck class
// create, shuffle, combine decks
class Deck {
    constructor(numberOfDecks = 4) {
        this.numberOfDecks = numberOfDecks;
        this.cards = this.createMultipleDecks(); // array of card objects
        this.shuffle(); //shuffle at start
    }

    // create a single deck
    createDeck() {
        const suits = ['diamond', 'clover', 'heart', 'spade'];
        const ranks = ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k']
        let deck = [];

        // for... of loop to index through each combination of cards to create a single deck
        for (let suit of suits) {
            for (let rank of ranks) {
                deck.push([rank, suit]);
            }
        }
        return deck;
    }

    // create a deck of decks!
    createMultipleDecks() {
        // stack decks together
        let decks = [];
        for (let i = 0; i < this.numberOfDecks; i++) {
            decks = decks.concat(this.createDeck());
        }
        return decks;
    }
    
    // shuffle the deck
    shuffle() {
        // Fisher-Yates shuffle algorithm: "shuffles" card from last card to first card in deck
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]; //swap card
        }
    }
}


// main blackjack class
// runs game functionalities
class BlackjackGame {
    constructor() {
        this.deck = new Deck();
        this.deck.shuffle(); 
        this.playerHand = [];
        this.dealerHand = [];
        this.score = 0;
        this.handsPlayed = 0;
        this._disableButtons();
    }

    // 1. Game Flow Methods                           
    
    // deal revealed card to player
    _dealCardPlayer() {
        if (this.deck.cards.length > 0) {
            // push card at top of deck into player hand and delete from deck
            this.playerHand.push(this.deck.cards.pop());
        }
    }

    // deal revealed card to dealer
    _dealCardDealer() {
        if (this.deck.cards.length > 0) {
            //  push card at top of deck into dealer hand and delete from deck
            this.dealerHand.push(this.deck.cards.pop());
        }
    }

    // deal 2 revealed cards to player and 1 to dealer
    dealInitialCards() {
        this._dealCardPlayer();
        this._dealCardPlayer();
        this._dealCardDealer();
    }

    // create new instance of deck and hand
    dealCards() {
        this.deck = new Deck(); //create new deck each deal... can change later so ev counting is possible
        this.deck.shuffle();
        this.playerHand = [];
        this.dealerHand = [];
        this.dealInitialCards();
        gameHTMLElements.evalutionText.evaluationTextHeader.textContent = "";
        gameHTMLElements.evalutionText.evaluationTextDetail.textContent = "";
    }

    // counts player or dealer's hand value
    countHandValue(hand) {
        let handValue = 0;
        // loops through each card and adds the card values to a variable
        hand.forEach((card) => {
            let [rank,suit] = card;
            // convert special cards to numbers
            if (rank === "k" || rank === "q" || rank === "j") {
                handValue += 10;
            } else if (rank === "a") {
                if (handValue <= 10) {
                    handValue += 11;
                } else {
                    handValue += 1;
                }
            } else {
                // convert rank to int and add to hand value
                handValue += parseInt(rank);
            }
        });
        // console.log(handValue);
        return handValue;
    }

    // check if hand has aces basically (this game only involves the initial deal so this is enough)
    isHandSoft(hand) {
        // Check if one of the two cards is an Ace
        return hand.some(card => card[0] === "a"); //checks if at least one element in the array satisfies the provided condition.
    }

    // checks for pair between first two cards
    checkForPairs(hand) {
        let isPair = false;
        let playerCard1 = this.playerHand[0][0];
        let playerCard2 = this.playerHand[1][0];
        let playerHandValue = this.countHandValue(this.playerHand);
        // let playerHandAceCount = this.countAces(this.playerHand);
        let isPlayerHandSoft = this.isHandSoft(this.playerHand);

        if (playerCard1 === playerCard2) { //checks for regular pairs
            isPair = true;
        } else if (playerHandValue === 20 && !isPlayerHandSoft){ //checks for pairs of 10
            isPair = true;
        } return isPair;
    }

    calcPercentage(wins, totalHands) {
        if (totalHands === 0) {
            return 0;
        } return Math.round((wins / totalHands) * 100);
    }

    updateGameScore(isActionCorrect) {
        this.handsPlayed ++;
        if (isActionCorrect) {
            this.score ++;
        }
        // update game score in html.... move this late to updateUIAfterDecision
        gameHTMLElements.stats.gameScore.textContent = `Score: ${this.score}/${this.handsPlayed}`;
        gameHTMLElements.stats.winPercentage.textContent = `${this.calcPercentage(this.score,this.handsPlayed)}%`;
    }

    // formats the counted player hand to work with lookup table
    formatPlayerHandValue(playerHandValue) {
        const isPlayerHandSoft = this.isHandSoft(this.playerHand); //true means there's atleast 1 ace
        const isPlayerHandPair = this.checkForPairs(this.playerHand); //true means it's a pair

        if (isPlayerHandPair && isPlayerHandSoft) {                         // set playerHandValue to string 'a,a' if pair of aces
            playerHandValue = 'a,a';
        } else if (isPlayerHandPair) {                                      // set playerHandValue to string '#,#' if regular pair
            playerHandValue = `${playerHandValue/2},${playerHandValue/2}`;
        } else if (isPlayerHandSoft) {                                      // set playerHandValue to string 'a,#' if hand soft
            playerHandValue = `a,${playerHandValue-11}`;
        } return playerHandValue;
    }

    // formats the counted dealer hand to work with lookup table
    formatDealerHandValue(dealerHandValue) {
        if (dealerHandValue === 11) {  // set dealerHandValue to string 'a' if ace
            dealerHandValue = 'a';
        } return dealerHandValue;
    }

    // format cards BEFORE looking up strategy
    // method to find the recommended action based on perfect strategy table
    lookUpStrategyGuide(dealerHandValue, playerHandValue, isPlayerHandSoft, isPlayerHandPair) {
        let recommendedAction = '';
        if(playerHandValue <= 8 && !isPlayerHandPair && !isPlayerHandSoft){             // If hand total 8 or lower, always hit
            recommendedAction = 'hit';          
        } else if (playerHandValue >= 17 && !isPlayerHandPair && !isPlayerHandSoft){    // if hand total 17 or greater AND with no aces or pairs in player hand, always stand.
            recommendedAction = 'stand';        
        } else {                                                                        // otherwise look up the recommended action from the table
            recommendedAction = perfectStrategy[playerHandValue][dealerHandValue]; 
        } return recommendedAction;
    }

    evaluatePlayerDecision(playerAction) {
        let dealerHandValue = this.countHandValue(this.dealerHand);
        let playerHandValue = this.countHandValue(this.playerHand);
        const isPlayerHandSoft = this.isHandSoft(this.playerHand); 
        const isPlayerHandPair = this.checkForPairs(this.playerHand);
        // let recommendedAction = '';

        playerHandValue = this.formatPlayerHandValue(playerHandValue); // returns playerHandValue in lookup-table-ready format
        dealerHandValue = this.formatDealerHandValue(dealerHandValue); // returns dealerHandValue in lookup-table-ready format

        const recommendedAction = this.lookUpStrategyGuide(dealerHandValue, playerHandValue, isPlayerHandSoft, isPlayerHandPair); // get recommended action from lookup table

        // evaluates user action
        const isActionCorrect = playerAction === recommendedAction;
        this.updateGameScore(isActionCorrect);
        if (isActionCorrect) {
            gameHTMLElements.evalutionText.evaluationTextHeader.textContent = "Correct!";
            gameHTMLElements.evalutionText.evaluationTextDetail.textContent = `You always want to ${recommendedAction} in this situation`
        } else {
            gameHTMLElements.evalutionText.evaluationTextHeader.textContent = "Incorrect.";
            gameHTMLElements.evalutionText.evaluationTextDetail.textContent = `The correct action was to ${recommendedAction}.`
        }
        
        console.log(`Recommended Action: ${recommendedAction}, Is Player Hand Soft?: ${isPlayerHandSoft}, Player Hand: ${playerHandValue}, Dealer Card: ${dealerHandValue}, Player Pair?: ${isPlayerHandPair}`);
    }


    _disableButtons() {
        // disable buttons
        gameHTMLElements.button.hitButton.disabled = true;
        gameHTMLElements.button.standButton.disabled = true;
        gameHTMLElements.button.doubleDownButton.disabled = true;
        gameHTMLElements.button.splitButton.disabled = true;
        gameHTMLElements.button.surrenderButton.disabled = true;
        // re-enable deal button
        gameHTMLElements.newHand.deal.disabled = false;
    }

    _enableButtons() {
        // enable buttons
        gameHTMLElements.button.hitButton.disabled = false;
        gameHTMLElements.button.standButton.disabled = false;
        gameHTMLElements.button.doubleDownButton.disabled = false;
        // enable split button only if player has pairs
        if (this.checkForPairs(this.playerHand)) {
            gameHTMLElements.button.splitButton.disabled = false;
        }
        gameHTMLElements.button.surrenderButton.disabled = false;
        // disable deal button
        gameHTMLElements.newHand.deal.disabled = true;
    }

    checkForBJ() {
        let playerHandValue = this.countHandValue(this.playerHand);
        if (playerHandValue === 21) {
            console.log("BJ TIME");
            gameHTMLElements.evalutionText.evaluationTextHeader.textContent = "BLACKJACK!";
            this._disableButtons();
            gameHTMLElements.newHand.deal.disabled = false;
        }
    }

    // call method to update game UI
    updateUIDeal() {
        // update player hand images
        this.playerHand.forEach((card, index) => {
            // save the rank and suit of the current card being iterated to update the cards in html
            let [rank,suit] = card;
            // update the cards in html to reflect the cards dealt to player
            let currentPlayerCard = document.getElementById(`player-card-${index + 1}`);
            currentPlayerCard.src = `images/playing-cards/${suit}-${rank}.svg`;
            //add animation class on card hand out
            currentPlayerCard.classList.add('card-animation'); 
        });

        // update dealer card hand images
        this.dealerHand.forEach((card, index) => {
            let [rank,suit] = card;
            let currentDealerCard = document.getElementById(`dealer-card-${index + 1}`);
            currentDealerCard.src = `images/playing-cards/${suit}-${rank}.svg`;
            currentDealerCard.classList.add('card-animation');
        })

        // update hand values (text)
        gameHTMLElements.player.handValue.innerHTML = `Player Hand: ${this.countHandValue(this.playerHand)}`;
        gameHTMLElements.dealer.handValue.innerHTML = `Dealer Hand: ${this.countHandValue(this.dealerHand)}`;
    }
}


// ------------------------------------------------------------------------------------------------------
// Variables and objects
// ------------------------------------------------------------------------------------------------------

// This strategy assumes typical casino rules: the dealer stands on soft 17, double after split is allowed, and it's late surrender. also assuming 4-8 decks
// The keys represent the player's hand total or specific card combinations.
// The values are objects where each key is the dealer's up card (2 through A), and the value is the recommended action.
const perfectStrategy = {
    // Hard totals
    '8-': {'2': 'hit', '3': 'hit', '4': 'hit', '5': 'hit', '6': 'hit', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    '9': {'2': 'hit', '3': 'double down', '4': 'double down', '5': 'double down', '6': 'double down', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    '10': {'2': 'double down', '3': 'double down', '4': 'double down', '5': 'double down', '6': 'double down', '7': 'double down', '8': 'double down', '9': 'double down', '10': 'hit', 'a': 'hit'},
    '11': {'2': 'double down', '3': 'double down', '4': 'double down', '5': 'double down', '6': 'double down', '7': 'double down', '8': 'double down', '9': 'double down', '10': 'double down', 'a': 'double down'},
    '12': {'2': 'hit', '3': 'hit', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    '13': {'2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    '14': {'2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    '15': {'2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'surrender', 'a': 'hit'},
    '16': {'2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'surrender', '10': 'surrender', 'a': 'surrender'},
    '17+': {'2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', 'a': 'stand'},

    // Soft totals
    'a,2': {'2': 'hit', '3': 'hit', '4': 'hit', '5': 'double down', '6': 'double down', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    'a,3': {'2': 'hit', '3': 'hit', '4': 'hit', '5': 'double down', '6': 'double down', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    'a,4': {'2': 'hit', '3': 'hit', '4': 'hit', '5': 'double down', '6': 'double down', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    'a,5': {'2': 'hit', '3': 'hit', '4': 'hit', '5': 'double down', '6': 'double down', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},   
    'a,6': {'2': 'hit', '3': 'double down', '4': 'double down', '5': 'double down', '6': 'double down', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    'a,7': {'2': 'stand', '3': 'double down', '4': 'double down', '5': 'double down', '6': 'double down', '7': 'stand', '8': 'stand', '9': 'hit', '10': 'hit', 'a': 'hit'},
    'a,8': {'2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', 'a': 'stand'},
    'a,9': {'2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', 'a': 'stand'},

    // Pairs
    'a,a': {'2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'split', '9': 'split', '10': 'split', 'a': 'split'},
    '2,2': {'2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    '3,3': {'2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    '4,4': {'2': 'hit', '3': 'hit', '4': 'hit', '5': 'split', '6': 'split', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    '5,5': {'2': 'double down', '3': 'double down', '4': 'double down', '5': 'double down', '6': 'double down', '7': 'double down', '8': 'double down', '9': 'double down', '10': 'hit', 'a': 'hit'},
    '6,6': {'2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', 'a': 'hit'},
    '7,7': {'2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'stand', '9': 'hit', '10': 'hit', 'a': 'hit'},
    '8,8': {'2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'split', '9': 'split', '10': 'stand', 'a': 'split'},
    '9,9': {'2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'stand', '8': 'split', '9': 'split', '10': 'stand', 'a': 'stand'},
    '10,10': {'2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', 'a': 'stand'},

};

const gameHTMLElements = {
    stats: {
        gameScore: document.getElementById('game-score'),
        winPercentage: document.getElementById('win-percentage'),
    },
    button: {
        hitButton: document.getElementById('hit-button'),
        standButton: document.getElementById('stand-button'),
        doubleDownButton: document.getElementById('double-down-button'),
        splitButton: document.getElementById('split-button'),
        surrenderButton: document.getElementById('surrender-button'),
    },
    dealer: {
        handValue: document.getElementById('dealer-hand-value'),
        dealerCard1: document.getElementById('dealer-card-1'),
        dealerCard2: document.getElementById('dealer-card-2'),
    },
    player: {
        handValue:document.getElementById('player-hand-value'),
        playerCard1: document.getElementById('player-card-1'),
        playerCard2: document.getElementById('player-card-2'),
    },
    newHand: {
        deal: document.getElementById('deal-button'),
    },
    evalutionText: {
        evaluationTextHeader: document.getElementById('evaluation-heading'),
        evaluationTextDetail: document.getElementById('evaluation-detail'),
    },
};

let playerAction = "";
let blackjackGame;


// ------------------------------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------------------------------

// start game instance
function gameStart() {
    blackjackGame = new BlackjackGame();
}




// background music function
function playBGMusic() {
    const bgMusic = document.getElementById('backgroundMusic');
    bgMusic.volume = 0.5; // Set initial volume
    bgMusic.play(); // Start playing music

    // Volume control
    document.getElementById('volumeControl').addEventListener('input', (event) => {
        bgMusic.volume = event.target.value;
    });
}


// ------------------------------------------------------------------------------------------------------
// Event Listener function
// ------------------------------------------------------------------------------------------------------

// temporary game starter condition
document.addEventListener('DOMContentLoaded', () => {
    playBGMusic();
    gameStart();
    blackjackGame.updateUIDeal();
    
    
});

// event listeners for player buttons
gameHTMLElements.button.hitButton.addEventListener('click', () => {
    playerAction = "hit";
    blackjackGame._disableButtons();
    blackjackGame.evaluatePlayerDecision(playerAction);
});
gameHTMLElements.button.standButton.addEventListener('click', () => {
    playerAction = "stand";
    blackjackGame._disableButtons();
    blackjackGame.evaluatePlayerDecision(playerAction);
});
gameHTMLElements.button.doubleDownButton.addEventListener('click', () => {
    playerAction = "double down";
    blackjackGame._disableButtons();
    blackjackGame.evaluatePlayerDecision(playerAction);
});
gameHTMLElements.button.splitButton.addEventListener('click', () => {
    playerAction = "split";
    blackjackGame._disableButtons();
    blackjackGame.evaluatePlayerDecision(playerAction);
});
gameHTMLElements.button.surrenderButton.addEventListener('click', () => {
    playerAction = "surrender";
    blackjackGame._disableButtons();
    blackjackGame.evaluatePlayerDecision(playerAction);
});
gameHTMLElements.newHand.deal.addEventListener('click', () => {
    blackjackGame.dealCards(); //bj checker in here
    blackjackGame._enableButtons();
    blackjackGame.checkForBJ();
    blackjackGame.updateUIDeal();
});