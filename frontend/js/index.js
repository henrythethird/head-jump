var renderComponents = []

function startGame() {
    myGameArea.start();

    globalContext = new GlobalContext();
    renderComponents.push(new Player());
    renderComponents.push(new Fish(50, 50, "blue", 0, myGameArea.canvas.height));
    renderComponents.push(new Component(myGameArea.canvas.width, 100, "black", 0, myGameArea.canvas.height - 100));
}

function updateGameArea() {
    myGameArea.clear();
    
    //console.log(renderComponents)
    renderComponents.forEach((comp) => {
        comp.update();
    })
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

        this.health = 100;
        this.whaleImg = new Image;
        this.whaleImg.src = '/images/whale.svg';

        var that = this;

        this.healthOuter = new Component(myGameArea.canvas.width - 200, 30, "black", 100, 30)
        this.healthInner = new Component(myGameArea.canvas.width - 210, 20, "red", 105, 35, function(ctx, comp) {
            const width = (myGameArea.canvas.width - 210) * that.health / 100.0;
            comp.width = width > 0 ? width : 0;
        })
    }

    update() {
        var ctx = myGameArea.context;

        ctx.drawImage(this.whaleImg, this.x, this.y, this.width, this.height)

        // Right-arrow
        if (globalContext.isPressed(39)) { this.x += 10; }
        // Down-arrow
        if (globalContext.isPressed(38)) { this.y -= 10; }
        // Up-arrow
        if (globalContext.isPressed(40)) { this.y += 10; }
        // Left-arrow
        if (globalContext.isPressed(37)) { this.x -= 10; }

        this.healthOuter.update();
        this.healthInner.update();
    }
}

class Fish extends Component {
    constructor(x) {
        super(50, 50, "blue", x, myGameArea.canvas.height)

        this.x = Math.floor(Math.random() * (600 - 0 + 1)) + 0;
    }
    update() {
        super.update()
        this.y -= 1
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