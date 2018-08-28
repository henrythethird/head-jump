const W3CWebSocket = require('websocket').w3cwebsocket;

var renderComponents = []
let webSocketClient
var player = null;

function startGame() {
  myGameArea.start();

  globalContext = new GlobalContext();
  player = new Player();
}

function updateGameArea() {
  myGameArea.clear();

  if(Math.random() > 0.998) {
    renderComponents.push(new Fish(50, 50, "blue", 0, myGameArea.canvas.height));
  }
  
  if(Math.random() > 0.998) {
    renderComponents.push(new Cloud(50, 50, "blue", 0, myGameArea.canvas.height));
  }
  //console.log(renderComponents)
  renderComponents.forEach((comp) => {
    comp.update();
  })

  player.update();
}

class Component {
  constructor(width, height, color, x, y, updateCallback) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
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
    super(165, 210, "yellow", 0, 0);

    this.weight = 50;
    this.progress = 0;
    this.whaleImg = new Image;
    this.whaleImg.src = '/images/whale.svg';

    var that = this;

    this.healthOuter = new Component(myGameArea.canvas.width - 200, 30, "black", 100, 30)
    this.healthInner = new Component(myGameArea.canvas.width - 210, 20, "red", 105, 35, function(ctx, comp) {
      const percentage = that.weight / 100.0;
      comp.width = (myGameArea.canvas.width - 210) * percentage
    })
  }

  update() {
    var ctx = myGameArea.context;
  
    this.collide();

    // Right-arrow
    if (globalContext.isPressed(39)) { this.x += 10; }
    // Left-arrow
    if (globalContext.isPressed(37)) { this.x -= 10; }

    // Down-arrow
    if (globalContext.isPressed(38)) { this.y -= 10; }
    // Up-arrow
    if (globalContext.isPressed(40)) { this.y += 10; }
    ctx.drawImage(this.whaleImg, this.x, this.y, this.width, this.height)

    this.healthOuter.update();
    this.healthInner.update();

    this.updateProgress();
  }

  updateProgress() {
    this.progress += this.weight / 5000.0;

    // Send progress to peers
  }

  collide() {
    const c1 = this;
    const res = renderComponents.filter((other) => this.intersectRect(c1, other))
    
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
  constructor(x) {
    super(36, 70, "blue", x, myGameArea.canvas.height)
    this.fishImg = new Image;
    this.fishImg.src = '/images/Fish.svg';
    this.x = Math.floor(Math.random() * (600 - 0 + 1)) + 0;
    this.disabled = false;
  }
  update() {
    if (this.disabled) {
      return;
    }

    var ctx = myGameArea.context;
    this.y -= 1
    ctx.drawImage(this.fishImg, this.x, this.y, this.width, this.height)
  }
}

class Cloud extends Component {
  constructor(x) {
    super(841, 595, "blue", x, myGameArea.canvas.height)
    this.cloudImg = new Image;
    this.cloudImg.src = '/images/cloud1.svg';
    this.x = Math.floor(Math.random() * (100 - 0 + 1)) + 0;

  }
  update() {
    var ctx = myGameArea.context;
    this.y -= 1
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
  constructor() {
    this.userId = Math.floor((Math.random() * 10000) + 1)
  }

  toString() {
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

    sendMessage(request.toString())
  }

  webSocketClient.onclose = function() {
    console.log('echo-protocol Client Closed')
  }

  webSocketClient.onmessage = function(e) {
    if (typeof e.data !== 'string') {
      console.log('Received data is no string')
      return
    }

    console.log("Received: '" + e.data + "'")
  }
}

let request = new Request()

function sendMessage(message) {
  if (webSocketClient.readyState !== webSocketClient.OPEN) {
    console.log('Can not send message as client has not connected yet')
    return
  }

  webSocketClient.send(message)
}

startGame()
startSocket()