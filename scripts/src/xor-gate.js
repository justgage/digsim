/*******************************************************************************
 * Program: 
 *  xor-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ******************************************************************************/

function XOR(numInputs) {
    this.type = digsim.XOR;
    this.name = 'XOR';
    
    this.next = [];
    this.prev = [];
    this.prevConnect = [];
    this.connections = [];
    this.juncts = [];
    this.numInputs = numInputs || 2;
    var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension = {'row': size, 'col': (size + 1)};

    this.outPt = 2;
};

// Create a new XOR from the Drawable
XOR.prototype = new Drawable();

/*****************************************************************************
 * CHANGE SIZE
 *  Changes the size of the gate based on numInputs
 ****************************************************************************/
XOR.prototype.changeSize = function() {
    var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension = {'row': size, 'col': (size + 1)};
}

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to 
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method. 
 ****************************************************************************/
XOR.prototype.draw = function(context, lineColor) {
    
    context.save();
    context.translate(this.col * digsim.GRID_SIZE, this.row * digsim.GRID_SIZE);
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth = 2;

    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = -0.5;
    }
    else if (this.rotation === 270) {
        offsetH = 0.5;
    }
    
    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.GRID_SIZE,
        'col': (this.dimension.col / 2 + offsetH) * digsim.GRID_SIZE};
    
    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);
    
    this.drawWires(context, lineColor);
    
    // Draw gate
    var factor = Math.floor(this.numInputs / 2); 
    var gsf = digsim.GRID_SIZE * factor;
    
    context.moveTo(0, 0);
    context.lineTo(gsf,  0);            
    
    // VECTOR CALCULUS... good luck. :)
    
    var t = 0.28;               // SET THIS TO CHANGE CURVATURE
    var baseCurveature = 1.15;  // SET THIS TO CHANGE BASE CURVATURE
    var height = 2 * factor + 1;
    var x0 = gsf;
    var y0 = 0;
    var y1 = height * digsim.GRID_SIZE / 2;
    var x1 = y1 * 2 + digsim.GRID_SIZE;
    var xc = (x0 + x1) / 2;
    var yc = (y0 + y1) / 2;
    var x = (y1 - y0) * t + xc;
    var y = (x0 - x1) * t + yc;
    
    context.quadraticCurveTo(x, y, x1, y1);
    
    x0 = x1;
    y0 = y1;
    x1 = gsf;
    y1 = height * digsim.GRID_SIZE;
    xc = (x0 + x1) / 2;
    yc = (y0 + y1) / 2;
    x = (y1 - y0) * t + xc;
    y = (x0 - x1) * t + yc;
    
    context.quadraticCurveTo(x, y, x1, y1);
    
    context.lineTo(0, y1);
    
    context.lineWidth = 1;
    context.quadraticCurveTo(digsim.GRID_SIZE * baseCurveature, y1 / 2, 
                             0, 0);
    context.stroke();
    context.fill();

    // base quadratic curve
    context.beginPath();
    context.moveTo(digsim.GRID_SIZE / -4, y1);
    context.quadraticCurveTo(digsim.GRID_SIZE * baseCurveature - digsim.GRID_SIZE / 4, y1 / 2, digsim.GRID_SIZE / -4, 0);
    context.stroke();
    context.restore();
    
    for (var i = 0; i < this.juncts.length; ++i) {
        // console.log(".onSjunct:…………………………………………");
        // console.log("ROW: " + this.row + " COL: " + this.col);

        context.beginPath();
        context.strokeStyle = '#000000';
        context.fillStyle = '#000000';
        context.arc((this.juncts[i].x + 0.5) * digsim.GRID_SIZE, (this.juncts[i].y + 0.5) * digsim.GRID_SIZE, digsim.GRID_SIZE / 10, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
    }    
};

// Infallable logic function
/*******************************************************************************
 * COMPUTE LOGIC
 *  ORs all the input wires together to set the current state of the gate. 
 ******************************************************************************/
XOR.prototype.computeLogic = function() {  

    var cnt = 0;
    for (var i = 0; i < this.numInputs; ++i) {
        cnt += (this.prev[i] ? this.prev[i].state : 0);
        console.log("PREV["+i+"].state: " + (this.prev[i] ? this.prev[i].state : 0));
    }
    this.state = cnt % 2;
};

