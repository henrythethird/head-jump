const W3CWebSocket = require('websocket').w3cwebsocket;

var renderComponents = []
let webSocketClient
var player = null;
const playerId = Math.floor((Math.random() * 10000) + 1)
let progressOtherPlayers = {}

function startGame() {
  myGameArea.start();

  globalContext = new GlobalContext();
}

function updateGameArea() {
  myGameArea.clear();

  if (globalContext.state == 'finished') {
    globalContext.state = 'initial';
  }

  if (globalContext.state != 'ending') {
    if (Math.random() > 0.93) {
      renderComponents.push(new Cloud());
    }
  }

  if (globalContext.state == 'running' || globalContext.state == 'ending') {
    if (globalContext.isPressed(27)) {
      globalContext.state = 'initial';
    }
  }

  if (globalContext.state == 'running') {
    if(Math.random() > 0.95) {
      renderComponents.push(new Fish());
    }

    globalContext.mainMusic.playbackRate = 1 + (player.weight / 100);

    if (player.progress >= 100) {
      globalContext.state = 'end';
    }
  }

  if (globalContext.state == 'end') {
    renderComponents.push(new Boat())
    globalContext.state = 'ending';
  }

  if (globalContext.state == 'initial') {
    globalContext.points = 0;
    renderComponents = [];
    player = null;

    globalContext.state = 'title';

    renderComponents.push(new Title());
    globalContext.loopMainMusic();
  }

  if (globalContext.state == 'title') {
    if (globalContext.isPressed(13)) {
      globalContext.state = 'starting';
    }
  }

  if (globalContext.state == 'starting') {
    renderComponents = [];
    renderComponents.push(player = new Player());
    renderComponents.push(new Points());

    globalContext.state = 'running';
    globalContext.loopGameMusic();
  }
  
  //console.log(renderComponents)
  renderComponents.sort((a, b) => a.z - b.z);

  renderComponents
    .forEach((comp) => {
      comp.update();
    })
}

class Component {
  constructor(width, height, color, x, y, z, updateCallback) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.z = z
    var ctx = myGameArea.context;
    this.color = color;
    this.updateCallback = updateCallback;
    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    var ctx = myGameArea.context;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    if (this.updateCallback) {
      this.updateCallback(ctx, this)
    }
  }
}

class Boat extends Component {
  constructor() {
    super(800, 400, "transparent", 0, 600, 70)

    this.boatImg = new Image();
    this.boatImg.src = '/images/Boat.svg';
  }

  update() {
    var ctx = myGameArea.context;
    if (this.y > 200) {
      this.y -= 10;
    } else {
      globalContext.state = 'finished';
    }
    ctx.drawImage(this.boatImg, this.x, this.y, this.width, this.height)
  }
}

class Points {
  constructor() {
    this.x = 600;
    this.y = 85;
    this.z = 101;

    this.logo42 = new Image;
    this.logo42.src = '/images/42logo.svg';
  }

  update() {
    var ctx = myGameArea.context;

    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.font = "bold 25px Arial";
    ctx.fillText(String(globalContext.points).padStart(10, '0'), this.x, this.y);
    ctx.font = "bold 16px Arial";
    ctx.fillText("points", this.x, this.y - 30);

    ctx.drawImage(this.logo42, 20, 20, 100, 100)
  }
}

class PointParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.z = 99;

    this.counter = 0;

    globalContext.points += 42;
  }

  update() {
    if (this.counter > 50) {
      return;
    }

    var ctx = myGameArea.context;

    this.y -= 5;
    this.counter++;

    ctx.fillStyle = "rgba(255, 255, 255, " + (1 - this.counter / 50.0) + ")";
    ctx.textAlign = "center";
    ctx.font = "bold 30px Arial";
    ctx.fillText("+42", this.x, this.y);
  }
}

class Player extends Component {
  constructor() {
    super(200, 150, "transparent", 300, 100, 10);

    this.weight = 50;
    this.progress = 0;
    this.speed = { x: 0, y: 0 };
    this.right = false;
    this.vertical = 0;

    this.whaleImg = new Image;
    this.whaleImg.src = '/images/Whale.svg';
  }

  update() {
    var ctx = myGameArea.context;
  
    this.collide();

    var anyPressed = false;

    // Right-arrow
    if (globalContext.isPressed(39)) { 
      anyPressed = true;
      this.speed.x += .3;
      this.right = true;
    }
    // Left-arrow
    if (globalContext.isPressed(37)) { 
      anyPressed = true;
      this.speed.x -= .3; 
      this.right = false;
    }

    this.vertical = 0;

    // Down-arrow
    if (globalContext.isPressed(38)) { 
      anyPressed = true;
      this.speed.y -= .3; 
      this.vertical = -1;
    }
    // Up-arrow
    if (globalContext.isPressed(40)) { 
      anyPressed = true;
      this.speed.y += .3; 
      this.vertical = 1;
    }

    if (!anyPressed) {
      this.speed.x *= 0.95;
      this.speed.y *= 0.95;
    }

    if (this.speed.x > 0) {
      if ((this.x + this.width) > myGameArea.canvas.width) { this.speed.x = 0; }
      if ((this.x + this.width) > (myGameArea.canvas.width - 10)) { this.speed.x *= 0.1; }
      if ((this.x + this.width) > (myGameArea.canvas.width - 100)) { this.speed.x *= 0.9; }
    }

    if (this.speed.x < 0) {
      if (this.x <= 0) { this.speed.x = 0; }
      if (this.x < 10) { this.speed.x *= 0.1; }
      if (this.x < 100) { this.speed.x *= 0.9; }
    }

    if (this.speed.y > 0) {
      if ((this.y + this.height) > myGameArea.canvas.height) { this.speed.y = 0; }
      if ((this.y + this.height) > (myGameArea.canvas.height - 10)) { this.speed.y *= 0.1; }
      if ((this.y + this.height) > (myGameArea.canvas.height - 100)) { this.speed.y *= 0.9; }
    }

    if (this.speed.y < 0) {
      if (this.y <= 0) { this.speed.y = 0; }
      if (this.y < 10) { this.speed.y *= 0.1; }
      if (this.y < 100) { this.speed.y *= 0.9; }
    }

    this.x += this.speed.x;
    this.y += this.speed.y;

    var infix = ''

    switch (this.vertical) {
      case -1:
        infix = '_up';
        this.width = 236;
        this.height = 126;
        break;
      case 0:
        this.width = 196;
        this.height = 151;
        break;
      case 1:
        infix = '_down';
        this.width = 166;
        this.height = 210;
    }
    
    this.whaleImg.src = '/images/Whale' + infix + (this.right ? '_right' : '') + '.svg';

    ctx.drawImage(this.whaleImg, this.x, this.y, this.width, this.height)

    this.updateProgress();
  }

  updateProgress() {
    this.progress += this.weight / 1000.0;
    if (this.progress > 100) {
      this.progress = 100;
    }

    // Send progress to peers
  }

  collide() {
    const c1 = this;
    const res = renderComponents
      .filter((obj) => obj instanceof Fish)
      .filter((other) => this.intersectRect(c1, other))
    
    res.forEach((fish) => {
      fish.disabled = true;
      c1.weight += 2;

      var snd = new Audio("/sound/crunch.mpeg");
      snd.play();
      
      renderComponents.push(new PointParticle(fish.x, fish.y));
    })
  }

  intersectRect(c1, c2) {
    if (c2.disabled) {
      return;
    }

    return !(c2.x > (c1.x + c1.width) || 
            (c2.x + c2.width) < c1.x || 
             c2.y > (c1.y + c1.height) ||
            (c2.y + c2.height) < c1.y);
  }
}

class Title extends Component {
  constructor() {
    super(100, 100, "transparent", 10, 10, 10);
    this.titleImg = new Image;
    this.titleImg.src = '/images/42.svg'

    this.ftImg = new Image;
    this.ftImg.src = '/images/Title.svg';

    this.buttonImg = new Image;
    this.buttonImg.src = '/images/Button.svg'
  }

  update() {
    var ctx = myGameArea.context;
    ctx.drawImage(this.titleImg, 350, 50, 100, 90)
    ctx.drawImage(this.ftImg, 225, 216, 355, 96)
    ctx.drawImage(this.buttonImg, 270, 465, 260, 60)
  }
}

class Fish extends Component {
  constructor() {
    const width = Math.random() * 20 + 20;
    super(width, width / 36 * 70, "blue", 0, myGameArea.canvas.height, 10);
    this.fishImg = new Image;
    this.fishImg.src = '/images/Fish.svg';
    this.x = Math.floor(Math.random() * (600 - 0 + 1)) + 0;
    this.disabled = false;
    this.velocity = Math.random() * 5 + 3;
  }

  update() {
    if (this.disabled) {
      return;
    }

    var ctx = myGameArea.context;
    this.y -= this.velocity * (1 + player.progress / 50)
    ctx.drawImage(this.fishImg, this.x, this.y, this.width, this.height)
  }
}

class Cloud extends Component {
  constructor() {
    super(153, 84, "blue", 0, myGameArea.canvas.height, 20)
    this.cloudImg = new Image
    var sizes = ['small', 'big']
    var size;
    size = sizes[Math.floor(Math.random()*sizes.length)];
    let random;
    random = Math.floor(Math.random() * 4) + 1
    this.cloudImg.src = '/images/cloud' + random + '.svg'
    this.x = Math.floor(Math.random() * (600 - 0 + 1)) + 0
    this.speed = 6;

    if(size == 'small') {
      this.cloudImg.src = '/images/cloud' + random + '-dark.svg'
      this.width = 50;
      this.height = 27;
      this.speed = 2;
      this.z = 5;
    }

  }
  update() {
    var ctx = myGameArea.context;
    this.y -= this.speed * (1 + (player ? player.progress : 0) / 50)
    ctx.drawImage(this.cloudImg, this.x, this.y, this.width, this.height)
  }
}


var myGameArea = {
  canvas: document.createElement("canvas"),
  start: function() {
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.context = this.canvas.getContext("2d");
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.interval = setInterval(updateGameArea, 20);
  },
  clear: function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

class GlobalContext {
  constructor() {
    var that = this
    window.addEventListener("keyup", function(e) { that.keyup(e); });
    window.addEventListener("keydown", function(e) { that.keydown(e); });
    this.map = {};
    this.state = "initial";

    this.points = 0;
  }

  loopMainMusic() {
    if (this.mainMusic) {
      this.mainMusic.pause();
    }
    this.mainMusic = new Audio("/sound/Nighttime-Escape.mp3");
    this.mainMusic.volume = 0.3;
    this.mainMusic.loop = true;
    this.mainMusic.play();
  }

  loopGameMusic() {
    if (this.mainMusic) {
      this.mainMusic.pause();
    }

    this.mainMusic = new Audio("/sound/Into-Battle_v001.mp3");
    this.mainMusic.volume = 0.3;
    this.mainMusic.loop = true;
    this.mainMusic.play();
  }

  keyup(e) {
    this.map[String(e.keyCode)] = false;
  }

  keydown(e) {
    this.map[String(e.keyCode)] = true;
  }

  isPressed(keyCode) {
    return this.map[String(keyCode)];
  }
}

class Request {
  constructor(userId) {
    this.userId = userId
  }

  setProgress(progress) {
    this.progress = progress
  }

  toJson() {
    return JSON.stringify(this)
  }
}

function startSocket() {
  webSocketClient = new W3CWebSocket('ws://localhost:8080/', 'echo-protocol')

  webSocketClient.onerror = function() {
    console.log('Connection Error')
  }

  webSocketClient.onopen = function() {
    console.log('WebSocket Client Connected')

    sendProgress()
  }

  webSocketClient.onclose = function() {
    console.log('echo-protocol Client Closed')
  }

  webSocketClient.onmessage = function(e) {
    if (typeof e.data !== 'string') {
      console.log('Received data is no string')
      return
    }

    progressOtherPlayers = filterOwnProgress(JSON.parse(e.data))
    console.log(JSON.stringify(progressOtherPlayers))
  }
}

let request = new Request(playerId)

function sendProgress() {
  if (!player) { return; }
  request.setProgress(player.progress)

  sendMessage(request.toJson());
  setTimeout(sendProgress, 1000);
}

function sendMessage(message) {
  if (webSocketClient.readyState !== webSocketClient.OPEN) {
    console.log('Can not send message as client has not connected yet')
    return
  }

  webSocketClient.send(message)
}

function filterOwnProgress(progress) {
  delete(progress[playerId])

  return progress
}

startGame()
startSocket()