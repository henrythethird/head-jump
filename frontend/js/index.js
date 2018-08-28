var renderComponents = []

function startGame() {
    myGameArea.start();

    globalContext = new GlobalContext();

    renderComponents.push(new Component(100, 100, "black", 0, 0, function(ctx, comp) {
        // Right-arrow
        if (globalContext.isPressed(39)) {
            comp.x += 10
        }

        // Down-arrow
        if (globalContext.isPressed(38)) {
            comp.y -= 10
        }

        // Up-arrow
        if (globalContext.isPressed(40)) {
            comp.y += 10
        }

        // Left-arrow
        if (globalContext.isPressed(37)) {
            comp.x -= 10
        }
    }));
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