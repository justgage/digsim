/*****************************************************************************
 * Program:
 *  or-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * NOR
 * @constructor
 * @extends Component
 * @param {number} numInputs - Number of input connections.
 ****************************************************************************/
function OR(numInputs) {
    this.type        = digsim.OR;
    this.name        = 'OR';

    this.numInputs   = numInputs || 2;
    this.numOutputs  = 1;
    var size         = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension   = {'row': size, 'col': (size + 1)};  // Height and width of component
}
OR.prototype = new Component();

/*****************************************************************************
 * CHANGE NUM INPUTS
 *  Changes the number of inputs and the size of the Component.
 * @param {number} numInputs - Number of inputs to change to.
 ****************************************************************************/
OR.prototype.changeNumInputs = function(numInputs) {
    if (numInputs >= 2) {
        this.numInputs = numInputs;
        var size = (2 * (Math.floor(this.numInputs / 2))) + 1;

        if (this.rotation === 0 || this.rotation === 180)
            this.dimension = {'row': size, 'col': (size + 1)};
        else
            this.dimension = {'row': (size + 1), 'col': size};

        this.zeroDimension = {'row': size, 'col': (size + 1)};
    }
};

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate
 * @return {boolean}
 *****************************************************************************/
OR.prototype.isAGate = function() {
    return true;
};

/*****************************************************************************
 * DRAW
 *  Draw the OR gate to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
OR.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;

    // Rotation
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = -0.5;
    }
    else if (this.rotation === 270) {
        offsetH = 0.5;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw gate
    var factor = Math.floor(this.numInputs / 2);
    var gsf = digsim.gridSize * factor;

    context.moveTo(0, 0);
    context.lineTo(gsf,  0);

    // Vector calculus for computing the quadratic curve
    var t = 0.28;                            // SET THIS TO CHANGE CURVATURE
    var baseCurveature = 1.15;               // SET THIS TO CHANGE BASE CURVATURE
    var height = 2 * factor + 1;             // Height (in grids) of gate
    var x0 = gsf;                            // (x0, y0) = starting point
    var y0 = 0;
    var y1 = height * digsim.gridSize / 2;  // (x1, y1) = ending point
    var x1 = y1 * 2 + digsim.gridSize;
    var xc = (x0 + x1) / 2;                  // (xc, yc) = midpoint between start and end point
    var yc = (y0 + y1) / 2;
    var x = (y1 - y0) * t + xc;              // The x coordinate of the parameterization
    var y = (x0 - x1) * t + yc;              // The y coordinate of the parameterization

    // Top curve
    context.quadraticCurveTo(x, y, x1, y1);

    x0 = x1;
    y0 = y1;
    x1 = gsf;
    y1 = height * digsim.gridSize;
    xc = (x0 + x1) / 2;
    yc = (y0 + y1) / 2;
    x = (y1 - y0) * t + xc;
    y = (x0 - x1) * t + yc;

    // Bottom curve
    context.quadraticCurveTo(x, y, x1, y1);

    context.lineTo(0, y1);

    // Base curve
    context.quadraticCurveTo(digsim.gridSize * baseCurveature, y1 / 2,
                             0, 0);
    context.stroke();
    context.fill();

    this.drawLabel(context, lineColor);

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  ANDs all the input wires together to set the current state of the gate.
 ****************************************************************************/
OR.prototype.computeLogic = function() {
    var ins = this.inputs.get();
    var computedState = ins[0].state;

    for (var i = 1, len = ins.length; i < len; ++i) {
        computedState = computedState || ins[i].state;
    }
    this.state = (computedState ? 1 : 0);
};