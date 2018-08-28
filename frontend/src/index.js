const W3CWebSocket = require('websocket').w3cwebsocket;

var renderComponents = []
let webSocketClient
var player = null;
const playerId = Math.floor((Math.random() * 10000) + 1)
let progressOtherPlayers = {}

function startGame() {
  myGameArea.start();

  globalContext = new GlobalContext();
  player = new Player();

  renderComponents.push(player);
}

function updateGameArea() {
  myGameArea.clear();

  if(Math.random() > 0.95) {
    renderComponents.push(new Fish());
  }
  
  if(Math.random() > 0.95) {
    renderComponents.push(new Cloud());
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

class Player extends Component {
  constructor() {
    super(165, 210, "yellow", 350, 0, 10);

    this.weight = 50;
    this.progress = 0;
    this.speed = { x: 0, y: 0 };
    this.whaleImg = new Image;
    this.whaleImg.src = '/images/Whale.svg';

    var that = this;

    this.progressOuter = new Component(30, myGameArea.canvas.height - 200, "black", myGameArea.canvas.width - 50, 100, 100)
    this.progressInner = new Component(20, myGameArea.canvas.height - 210, "green", myGameArea.canvas.width - 45, 105, 101, function(ctx, comp) {
      const percentage = that.progress / 100.0;
      comp.height = (myGameArea.canvas.height - 210) * (percentage > 100 ? 100 : (percentage < 0 ? 0 : percentage))
    })
  }

  update() {
    var ctx = myGameArea.context;
  
    this.collide();

    var anyPressed = false;

    // Right-arrow
    if (globalContext.isPressed(39)) { 
      anyPressed = true;
      this.speed.x += .2;
    }
    // Left-arrow
    if (globalContext.isPressed(37)) { 
      anyPressed = true;
      this.speed.x -= .2; 
    }

    // Down-arrow
    if (globalContext.isPressed(38)) { 
      anyPressed = true;
      this.speed.y -= .2; 
    }
    // Up-arrow
    if (globalContext.isPressed(40)) { 
      anyPressed = true;
      this.speed.y += .2; 
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

    ctx.drawImage(this.whaleImg, this.x, this.y, this.width, this.height)

    this.progressOuter.update();
    this.progressInner.update();

    this.updateProgress();
  }

  updateProgress() {
    this.progress += this.weight / 5000.0;
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
    this.y -= this.velocity
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
      this.width = 76;
      this.height = 42;
      this.speed = 2;
      this.z = 5;
    }

  }
  update() {
    var ctx = myGameArea.context;
    this.y -= this.speed
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
    window.addEventListener("keyup", function(e) { that.keyup(e) });
    window.addEventListener("keydown", function(e) { that.keydown(e) });
    this.map = {};
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