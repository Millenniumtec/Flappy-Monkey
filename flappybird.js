//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 70; //width/height ratio = 408/228 = 17/12
let birdHeight = 70;
let birdX = boardWidth / 12;
let birdY = boardHeight / 4;
let birdImg;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
}

//pipes
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//backgrounds
let backgroundDayImg = new Image();
backgroundDayImg.src = 'images/backgroundDay.png';
let backgroundNightImg = new Image();
backgroundNightImg.src = 'images/backgroundNight.png';
let currentBackground = backgroundDayImg; // Estado inicial do fundo
let nextBackground = backgroundNightImg;
let isTransitioning = false;
let backgroundTransitionAlpha = 1.0;

//physics
let velocityX = -2; //pipes moving left speed
let velocityY = 0; //bird jump speed
let gravity = 0.4;

let defaultVelocityX = -2; // Valor padrão da velocidade horizontal
let gameOver = false;
let score = 0;
let highscoreEasy = 0; // Recorde pessoal para dificuldade fácil
let highscoreMedium = 0; // Recorde pessoal para dificuldade média
let highscoreHard = 0; // Recorde pessoal para dificuldade difícil
let currentDifficulty = 'easy'; // Dificuldade atual

// Carrega o áudio de colisão
let collisionSound = new Audio('sounds/collision.mp3');
collisionSound.volume = 0.2; // Define o volume do som de colisão

// Carrega a música de fundo
let backgroundMusic = new Audio('sounds/background-music.mp3');
backgroundMusic.loop = true; // Define a música para tocar em loop
backgroundMusic.volume = 0.2; // Define o volume da música

// Carrega o som de passagem de cano
let passPipeSound = new Audio('sounds/passPipe.mp3');
passPipeSound.volume = 0.2; // Define o volume do som de passagem de cano

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    // Carrega os recordes do localStorage
    highscoreEasy = localStorage.getItem('highscoreEasy') || 0;
    highscoreMedium = localStorage.getItem('highscoreMedium') || 0;
    highscoreHard = localStorage.getItem('highscoreHard') || 0;

    //load images
    birdImg = new Image();
    birdImg.src = "images/flappybird.png";
    birdImg.onload = function () {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    }

    topPipeImg = new Image();
    topPipeImg.src = "images/toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "images/bottompipe.png";

    document.addEventListener("keydown", moveBird);
    document.addEventListener("mousedown", moveBird); // Adiciona o event listener para o clique do mouse
}

function startGame(difficulty) {
    let velocidadeDificuldade;

    // Ajusta a velocidade do jogo com base na dificuldade selecionada
    if (difficulty === 'easy') {
        velocityX = -4;
        defaultVelocityX = -4;
        velocidadeDificuldade = 1500;
        currentDifficulty = 'easy';
    } else if (difficulty === 'medium') {
        velocityX = -5;
        defaultVelocityX = -5;
        velocidadeDificuldade = 1200;
        currentDifficulty = 'medium';
    } else if (difficulty === 'hard') {
        velocityX = -6;
        defaultVelocityX = -6;
        velocidadeDificuldade = 900;
        currentDifficulty = 'hard';
    }

    // Esconde a seleção de dificuldade e mostra o canvas
    document.getElementById('difficulty-selection').style.display = 'none';
    document.getElementById('board').style.display = 'block';

    // Inicia a reprodução da música de fundo
    backgroundMusic.play();

    // Inicia o jogo
    requestAnimationFrame(update);
    setInterval(placePipes, velocidadeDificuldade); 
}

function update() {
    requestAnimationFrame(update);
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);

    // Desenha o fundo atual
    context.globalAlpha = backgroundTransitionAlpha;
    context.drawImage(currentBackground, 0, 0, boardWidth, boardHeight);
    context.globalAlpha = 1.0;

    // Desenha o próximo fundo durante a transição
    if (isTransitioning) {
        context.globalAlpha = 1.0 - backgroundTransitionAlpha;
        context.drawImage(nextBackground, 0, 0, boardWidth, boardHeight);
        context.globalAlpha = 1.0;
    }

    //bird
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0); //apply gravity to current bird.y, limit the bird.y to top of the canvas
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        gameOver = true;
        resetGame();
    }

    //pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        // Verifica se o pássaro está no meio dos canos
        if (!pipe.passed && bird.x > pipe.x + pipe.width / 2) {
            passPipeSound.play();
            score += 0.5; //0.5 because there are 2 pipes! so 0.5*2 = 1, 1 for each set of pipes
            pipe.passed = true;
            // Toca o som de passagem de cano
            if (currentDifficulty === 'medium' || currentDifficulty === 'hard') {
                // Aumenta a velocidade horizontal para cada cano passado
                velocityX -= 0.05;
            }
        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
            collisionSound.play(); // Toca o som de colisão
            resetGame();
        }
    }

    //clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift(); //removes first element from the array
    }

    //draw score
    context.fillStyle = "white";
    context.font = "45px 'handjet', sans-serif"; // Use a fonte personalizada
    context.lineWidth = 4;
    context.strokeStyle = "black";
    context.strokeText(score, 170, 100);
    context.fillText(score, 170, 100);
    
    //draw highscore
    let highscore;
    if (currentDifficulty === 'easy') {
        highscore = highscoreEasy;
    } else if (currentDifficulty === 'medium') {
        highscore = highscoreMedium;
    } else if (currentDifficulty === 'hard') {
        highscore = highscoreHard;
    }
    
    // Define o tamanho da fonte para "MAIOR PONTUAÇÃO"
    context.font = "30px 'handjet', sans-serif"; // Use a fonte personalizada
    context.fillText("MAIOR PONTUAÇÃO", boardWidth / 2, 550);
    context.fillStyle = "white";
    context.lineWidth = 4;
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.strokeText("MAIOR PONTUAÇÃO", boardWidth / 2, 550);
    
    // Configura o alinhamento do texto para centralizado
    context.font = "45px 'handjet', sans-serif"; // Use a fonte personalizada
    context.textAlign = "center";
    
    // Desenha o highscore centralizado
    context.lineWidth = 4;
    context.strokeText(highscore, boardWidth / 2, 600);
    context.fillText(highscore, boardWidth / 2, 600);
    if (gameOver) {
        context.fillText("FIM DE JOGO", boardWidth / 2, 350);
        context.fillStyle = "white";
        context.strokeStyle = "black";
        context.lineWidth = 2;
        context.strokeText("FIM DE JOGO", boardWidth / 2, 350);

        // Atualiza o recorde se o score atual for maior
        if (currentDifficulty === 'easy' && score > highscoreEasy) {
            highscoreEasy = score;
            localStorage.setItem('highscoreEasy', highscoreEasy);
        } else if (currentDifficulty === 'medium' && score > highscoreMedium) {
            highscoreMedium = score;
            localStorage.setItem('highscoreMedium', highscoreMedium);
        } else if (currentDifficulty === 'hard' && score > highscoreHard) {
            highscoreHard = score;
            localStorage.setItem('highscoreHard', highscoreHard);
        }
    }

    // Verifica e alterna o fundo conforme necessário
    changeBackground();
}

function placePipes() {
    if (gameOver) {
        return;
    }

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 3.25;

    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(topPipe);

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX" || e.type == "mousedown") {
        //jump
        velocityY = -6;

        //reset game
        if (gameOver) {
            bird.y = birdY;
            pipeArray = [];
            score = 0;
            gameOver = false;
            velocityX = defaultVelocityX; // Reseta a velocidade horizontal para o valor padrão
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
        a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
        a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function resetGame() {
    velocityX = defaultVelocityX; // Reseta a velocidade horizontal para o valor padrão
}

// Variável para rastrear a última pontuação em que a transição ocorreu
let lastTransitionScore = 0;

// Função para alternar o fundo a cada 4 pontos
function changeBackground() {
    if (score % 15 === 0 && score !== 0 && score !== lastTransitionScore && !isTransitioning) {
        // Inicia a transição quando a pontuação é divisível por 4, não está já em transição e não é a mesma pontuação da última transição
        isTransitioning = true;
        lastTransitionScore = score; // Atualiza a última pontuação de transição
        if (currentBackground === backgroundDayImg) {
            nextBackground = backgroundNightImg;
        } else {
            nextBackground = backgroundDayImg;
        }
    }

    if (isTransitioning) {
        // Reduz o alpha gradativamente
        backgroundTransitionAlpha -= 0.02;

        // Quando a transição está completa (alpha <= 0), finalize a troca de fundo
        if (backgroundTransitionAlpha <= 0) {
            currentBackground = nextBackground;
            backgroundTransitionAlpha = 1.0;
            isTransitioning = false;
        }
    }
}