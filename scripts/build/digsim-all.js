 /******************************************************************************
 * Program:
 *  component.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  Base class for all Component objects.
 * @abstract
 *****************************************************************************/

/*****************************************************************************
 * Component
 * @constructor
 ****************************************************************************/
function Component() {
    this.row         = 0;      // Row of the top left corner of the Component
    this.col         = 0;      // Col of the top left corner of the Component
    this.id          = 0;      // Unique id
    this.numInputs   = 0;      // Number of input connections
    this.numOutputs  = 0;      // Number of output connections
    this.rotation    = 0;      // Rotation of Component in 90deg intervals
    this.state       = -1;     // State (0 or 1) of the Component; -1 means that Component has not been traversed
    this.type        = 0;      // Unique id for the type of Component
    this.name        = "";     // Unique name of Component; Must match the name of the class
    this.label       = "";     // Label displayed for the Component
    this.drawStatic  = true;   // If the Component should be drawn on the static context
    this.extraSpace  = 0;      // If the Component has extra space above and below
    this.connections = null;
    this.inputs      = null;
    this.outputs     = null;
    this.zeroDimension = null;
    this.dimension = {
       row : 0,
       col : 0
    };
}

/******************************************************************************
 * INIT
 *  Initiates a Component at a given row, col, and rotation.
 * @param {number} row - Initial row position.
 * @param {number} col - Initial col position.
 * @param {number} rot - Rotation of the Component in 90deg increments.
 * @param {number} id  - Unique id for the Component.
 *****************************************************************************/
Component.prototype.init = function (row, col, rot, id) {
    this.row        = row;
    this.col        = col;
    this.drawStatic = true;
    this.rotation   = rot;
    this.id         = id;
    this.label      = "";

    // Wires have no designated input/output, so we just have to keep track of their connections unit we traverse it
    if (this.type === digsim.WIRE) {
        this.connections = new ComponentList(id);  // Wire connections
    }
    this.inputs  = new ComponentList(id);          // Component input connections
    this.outputs = new ComponentList(id);          // Component output connections

    // Save rotation 0 dimensions for wire drawing
    this.zeroDimension = {'row': this.dimension.row, 'col': this.dimension.col};

    // Swap row/col
    if (rot === 90 || rot === 270) {
        this.dimension.row = this.dimension.row ^ this.dimension.col;
        this.dimension.col = this.dimension.row ^ this.dimension.col;
        this.dimension.row = this.dimension.row ^ this.dimension.col;
    }
};

/******************************************************************************
 * IS A GATE
 *  Return true if the Component is a gate.
 * @return {boolean}
 *****************************************************************************/
Component.prototype.isAGate = function() {
    return false;
};

/******************************************************************************
 * IS A DRIVER
 *  Return true if the Component is a driver.
 * @return {boolean}
 *****************************************************************************/
Component.prototype.isADriver = function() {
    return false;
};

/******************************************************************************
 * RESET
 *  Reset the state of the component.
 *****************************************************************************/
Component.prototype.reset = function() {
    this.state = -1;
};

/******************************************************************************
 * GET INPUT ROTATION
 *  Return the row, col, and index of the input based on rotation and input index.
 * @param {number} inputIndex - Index of input.
 * @param {number} skip       - Skip a specified number of row/col.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
Component.prototype.getInputRotation = function(inputIndex, skip) {
    // Skip a row/col for even input Components
    skip = (typeof skip !== 'undefined' ? skip : (this.numInputs % 2 === 0 && inputIndex >= this.numInputs / 2 ? 1 : 0));
    var row, col, index;

    // Get the row and col of the first wire (0), then modify by inputIndex
    switch(this.rotation / 90) {
        case 0:
            row = this.row + inputIndex + skip;
            col = this.col - 1;
            index = 1;
            break;
        case 1:
            row = this.row - 1;
            col = this.col + this.dimension.col - 1 - inputIndex - skip;
            index = 2;
            break;
        case 2:
            row = this.row + this.dimension.row - 1 - inputIndex - skip;
            col = this.col + this.dimension.col;
            index = 3;
            break;
        case 3:
            row = this.row + this.dimension.row;
            col = this.col + inputIndex + skip;
            index = 0;
            break;
    }

    return {row: row, col: col, index: index};
};

/******************************************************************************
 * GET OUTPUT ROTATION
 *  Return the row, col, and index of the output based on rotation and output index.
 * @param {number} outputIndex - Index of output.
 * @param {number} skip        - Skip a specified number of row/col @default 0.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
Component.prototype.getOutputRotation = function(outputIndex, skip) {
    // Skip a row/col for even input Components
    skip = (typeof skip !== 'undefined' ? skip : 0);
    var row, col, index;

    if (this.numOutputs === 1) {
        // Get the row and col of the wire
        switch (this.rotation / 90) {
            case 0:
                row = this.row + Math.floor(this.dimension.row / 2);
                col = this.col + this.dimension.col;
                index = 3;
                break;
            case 1:
                row = this.row + this.dimension.row;
                col = this.col + Math.floor(this.dimension.col / 2);
                index = 0;
                break;
            case 2:
                row = this.row + Math.floor(this.dimension.row / 2);
                col = this.col - 1;
                index = 1;
                break;
            case 3:
                row = this.row - 1;
                col = this.col + Math.floor(this.dimension.col / 2);
                index = 2;
        }
    }
    else {
        // Get the row and col of the first wire (0), then modify by outputIndex
        switch(this.rotation / 90) {
            case 0:
                row = this.row + outputIndex + skip;
                col = this.col + this.dimension.col;
                index = 3;
                break;
            case 1:
                row = this.row + this.dimension.row;
                col = this.col + this.dimension.col - 1 - outputIndex - skip;
                index = 0;
                break;
            case 2:
                row = this.row + this.dimension.row - 1 - outputIndex - skip;
                col = this.col - 1;
                index = 1;
                break;
            case 3:
                row = this.row - 1;
                col = this.col + outputIndex + skip;
                index = 2;
                break;
        }
    }

    return {row: row, col: col, index: index};
};

/******************************************************************************
 * GET COMPONENT SPACE
 *  Return every {row, col, con, index, name} that the Component fills. Helpful for setting
 *  and deleting placeholders.
 * @return {Array} array of objects of {row, col, con, index, name}. Index is
 *                 only present if space is a wire. Name is only present if space
 *                 is used for MUX or DFF.
 *****************************************************************************/
Component.prototype.getComponentSpace = function() {
    var space = [];

    // Component space
    for (var r = 0; r < this.dimension.row; r++) {
        for (var c = 0; c < this.dimension.col; c++) {
            /*****************************************************************************
             * Space
             * @param {number} row      - Row of the space
             * @param {number} col      - Column of the space
             * @param {number} index    - Index of the space if it only fills a part of a grid.
             *                            top = 0, right = 1, bottom = 2, left = 3.
             * @param {number} con      - If the space can be used for determining connections.
             * @param {number} conIndex - Which input or output wire the connection is.
             *****************************************************************************/
            space.push({
                'row': this.row + r,
                'col': this.col + c,
                'con': false
            });
        }
    }

    // Combine the input and output space arrays
    space = space.concat( this.getComponentInputSpace() ).concat( this.getComponentOutputSpace() );
    space = space.concat( this.getExtraComponentSpace( this.extraSpace ) );

    return space;
};

/******************************************************************************
 * GET COMPONENT INPUT SPACE
 *  Return every {row, col, con, index} that the Component input fills.
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Component.prototype.getComponentInputSpace = function() {
    var space = [];
    var input;

    // Input space
    for (var i = 0; i < this.numInputs; ++i) {
        // Calculate positions of connections based on rotation
        input = this.getInputRotation(i);

        space.push({
            'row'     : input.row,
            'col'     : input.col,
            'index'   : input.index,
            'con'     : true,
            'conIndex': i
        });
    }

    return space;
};

/******************************************************************************
 * GET COMPONENT OUTPUT SPACE
 *  Return every {row, col, con, index} that the Component output fills.
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Component.prototype.getComponentOutputSpace = function() {
    var space = [];
    var output;

    // Output space
    for (var i = 0; i < this.numOutputs; ++i) {
        // Calculate positions of connections based on rotation
        output = this.getOutputRotation(i);

        space.push({
            'row'     : output.row,
            'col'     : output.col,
            'index'   : output.index,
            'con'     : true,
            'conIndex': i
        });
    }

    return space;
};

/******************************************************************************
 * GET EXTRA COMPONENT SPACE
 *  Return the space {row, col, con, index} above and below the Component.
 * @param {number} length - How many spaces to return (top & bottom or left & right count as 1).
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Component.prototype.getExtraComponentSpace = function(length) {
    var space = [];
    var col = this.col, row = this.row;
    var index;

    for (var i = 0; i < length; i++) {
        // Get space based on rotations
        for (var y = 0; y < 2; ++y) {
            // Component is rotated on it's side (90 or 270)
            if (((this.rotation) / 90) % 2) {
                // Right
                if (y) {
                    col = this.col + this.dimension.col;
                    index = 3;
                }
                // Left
                else {
                    index = 1;
                    col = this.col - 1;
                }
            }
            // Component is rotated normally (0 or 180)
            else {
                // Below
                if (y) {
                    row = this.row + this.dimension.row;
                    index = 0;
                }
                // Above
                else {
                    index = 2;
                    row = this.row - 1;
                }
            }

            space.push({
                'row'  : row,
                'col'  : col,
                'con'  : false,
                'index': index
            });
        }

        if (this.rotation === 90 || this.rotation === 270) {
            ++row;
        }
        else {
            ++col;
        }
    }

    return space;
};

/*****************************************************************************
 * CHECK CONNECTIONS
 *  Checks input and output spaces for other Components to connect to.
 ****************************************************************************/
Component.prototype.checkConnections = function() {

    var inputSpace = this.getComponentInputSpace();
    var outputSpace = this.getComponentOutputSpace();
    var cons, con, spaces, space, grid, ph, comp, i, j, k;

    // Check input and output space for connections
    cons = ['inputs','outputs'];
    for (k = 0; k < cons.length; k++) {
        con = cons[k];
        spaces = (con === 'inputs' ? inputSpace : outputSpace);

        // Loop through each space
        for (j = 0; j < spaces.length; j++) {
            space = spaces[j];

            // Check every index of the space for a connection
            for (i = 0; i < 4; i++) {
                grid = digsim.placeholders[space.row][space.col];

                if (typeof grid === 'undefined') {
                   ph = null;
                } else {
                   ph   = grid[i];
                }

                // There is a Component to connect to and it is not already connected
                if (i !== space.index && ph && ph.connectable && !this[con].contains(digsim.components.getComponent(ph.ref))) {
                    comp = digsim.components.getComponent(ph.ref);

                    if (this.type === digsim.WIRE) {
                        this.connections.add(comp, space.conIndex, true);
                    }
                    else {
                        this[con].add(comp, space.conIndex, true);
                    }

                    // Save connection to namedConnections
                    if (space.name) {
                        this.namedConnections[space.name] = comp;
                    }
                    if (ph.name) {
                        comp.namedConnections[ph.name] = this;
                    }

                    console.assert(typeof comp !== "undefined", "Gage: Component is undefined (so we can't split it)");
                    // Split a Wire
                    if (comp.type === digsim.WIRE && grid[(i+2)%4] && comp.id === grid[(i+2)%4].ref)
                        comp.splitWire(space.row, space.col);
                }
            }
        }
    }
};

/*****************************************************************************
 * DELETE CONNECTIONS
 *  Remove all connections of the Component.
 ****************************************************************************/
Component.prototype.deleteConnections = function() {
    this.inputs.clear();
    this.outputs.clear();
};

/******************************************************************************
 * DRAW LABEL
 *  Draws the label for the Component.
 * @param {CanvasRenderingContext2D} context - Context to draw to.
 * @param {string}                   color   - Font color.
 *****************************************************************************/
Component.prototype.drawLabel = function(context, color) {
    context.save();

    context.font      = "10pt Calibri";
    context.fillStyle = color || 'black';
    context.textAlign = 'center';

    var x = (this.dimension.col / 2) * digsim.gridSize;
    var y = -0.25 * digsim.gridSize;

    if (this.type === digsim.SWITCH || this.type === digsim.CLOCK) {
        context.textAlign = 'right';
        x = -0.25 * digsim.gridSize;
        y = 0.5 * digsim.gridSize;
    }

    context.fillText(this.label, x, y);
    context.restore();
};

/******************************************************************************
 * DRAW WIRES
 *  Draws Component input and output wires
 * @param {CanvasRenderingContext2D} context    - Context to draw to.
 * @param {string}                   lineColor  - Color of the wire.
 * @param {number}                   wireLength - Length of the wires.
 *****************************************************************************/
Component.prototype.drawWires = function(context, lineColor, wireLength) {
    context.save();

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;

    // Set rotation and dimension back to a rotation at 0 for easy drawing
    var oldRot      = this.rotation;
    var oldDim      = this.dimension;
    this.rotation   = 0;
    this.dimension  = this.zeroDimension;

    wireLength      = wireLength || 1;
    var inputSpace  = this.getComponentInputSpace();
    var outputSpace = this.getComponentOutputSpace();
    var space, i, x, y;

    // Draw input wires
    for (i = 0; i < inputSpace.length; i++) {
        space = inputSpace[i];
        x = (space.col - this.col + 0.5) * digsim.gridSize;
        y = (space.row - this.row + 0.5) * digsim.gridSize;

        context.moveTo(x, y);
        context.lineTo(x + digsim.gridSize * wireLength, y);
    }

    // Draw output wires
    for (i = 0; i < outputSpace.length; i++) {
        space = outputSpace[i];
        x = (space.col - this.col + 0.5) * digsim.gridSize;
        y = (space.row - this.row + 0.5) * digsim.gridSize;

        context.moveTo(x, y);
        context.lineTo(x - digsim.gridSize * wireLength, y);
    }

    // Reset rotation and dimension
    this.rotation = oldRot;
    this.dimension = oldDim;

    context.stroke();

    context.restore();
};

/******************************************************************************
 * DRAW CONNECTION DOTS
 *  Draws connection dots
 * @param {CanvasRenderingContext2D} context    - Context to draw to.
 *****************************************************************************/
Component.prototype.drawConnectionDots = function(context) {
    context.save();

    // Set rotation and dimension back to a rotation at 0 for easy drawing
    var oldRot      = this.rotation;
    var oldDim      = this.dimension;
    this.rotation   = 0;
    this.dimension  = this.zeroDimension;

    // Draw connection dots
    var connectionTypes = ['inputs', 'outputs', 'connections'];
    var cons = [];
    var i, j, conType, comp, index, space, x, y;

    // Input and output connection dots
    context.beginPath();
    context.strokeStyle = '#000000';
    context.fillStyle   = '#000000';

    for (j = 0; j < connectionTypes.length; j++) {
        conType = connectionTypes[j];

        if (conType === 'inputs')
            cons = this.inputs.get();
        else if (conType === 'outputs')
            cons = this.outputs.get();
        else
            cons = [];

        for (i = 0; i < cons.length; i++) {
            comp = cons[i];
            index = this[conType].getConnectionIndex(comp);

            if (conType === 'inputs')
                space = this.getInputRotation(index);
            else if (conType === 'outputs')
                space = this.getOutputRotation(index);

            x = (space.col - this.col + 0.5) * digsim.gridSize;
            y = (space.row - this.row + 0.5) * digsim.gridSize;
            context.moveTo(x, y);
            context.arc(x, y, digsim.gridSize / 10, 0, 2 * Math.PI);
        }
    }
    context.fill();
    context.stroke();

    // Reset rotation and dimension
    this.rotation = oldRot;
    this.dimension = oldDim;

    context.restore();
};

/******************************************************************************
 * PASS STATE
 *  Passes the state of the current Component to the next Component (be it a wire,
 *  gate, LED, etc).
 * @param {number} pState - State to pass to this Component.
 *****************************************************************************/
Component.prototype.passState = function(pState) {
    if (!this.isADriver())
        throw new Error("Cannot call function 'passState' on non-driver Component.");

    var compQueue = [];  // List of non-traversed Components
    var i, len, comp, outs, input, output, index;

    // Ensure that pState is an number and not anything else
    pState = pState ? 1 : 0;
    this.state = pState;

    // Add all output Components to the queue
    outs = this.outputs.get();
    for (i = 0, len = outs.length; i < len; ++i) {
        compQueue.push(outs[i]);
    }

    // Traverse the circuit path
    while (compQueue.length) {
        comp = compQueue[0];

        // Set state
        if (comp.isAGate()) {
            comp.computeLogic();
        }
        else {
            input = comp.inputs.get()[0];  // Component can only have 1 input

            // Special output
            if (typeof input.state === 'object') {
                index = input.outputs.getConnectionIndex(comp);
                comp.state = (parseInt(input.state[index]) ? 1 : 0);
            }
            else {
                comp.state = input.state;
            }
        }

        // Prevent infinite loops in schematics
        if (digsim.passCounter >= digsim.maxSchematicLoop) {
            digsim.addMessage(digsim.ERROR, "ERROR: Schematic contains an infinite loop caused by an unstable state.");
            return;
        }
        digsim.passCounter++;

        // Add Component outputs to the queue if their state has changed
        outs = comp.outputs.get();
        for (i = 0, len = outs.length; i < len; i++) {
            output = outs[i];
            // Always add a gate to the queue to check if any of it's inputs have changed
            if (output.isAGate()) {
                compQueue.push(output);
            }
            // Special output for DFF
            else if (typeof comp.state === 'object') {
                index = comp.outputs.getConnectionIndex(output);

                if (output.state !== comp.state[index])
                    compQueue.push(output);
            }
            else if (output.state !== comp.state)
                compQueue.push(output);
        }

        // Remove the Component from the queue
        compQueue.shift();
    }
};

/******************************************************************************
 * TRAVERSE CONNECTIONS
 *  Called on a driver Component (Switch or Clock). Traverses the Component's
 *  connections arrays and sets any Wires connections to input and outputs. Called
 *  every time before SIM_MODE.
 * @return {boolean} True if the entire input chain was traversed without errors.
 *****************************************************************************/
Component.prototype.traverseConnections = function() {

    if (!this.isADriver())
        throw new Error("Cannot call function 'traverseConnections' on non-driver Component.");

    var traversedComps = new ComponentList();   // List of traversed Components
    var compQueue = [];                         // Array of non-traversed Components
    var i, len, comp, cons, con, outs, output, input;

    // Add all output Components to the queue and set their input to the driver
    outs = this.outputs.get();
    for (i = 0, len = outs.length; i < len; ++i) {
        compQueue.push(outs[i]);
        outs[i].inputs.add(this);
    }

    // Traverse the connection queue
    while (compQueue.length) {
        comp = compQueue[0];

        // Set outputs and inputs of a Wire
        if (comp.type === digsim.WIRE) {
            cons = comp.connections.get();
            input = comp.inputs.get()[0];   // Wire can only have 1 input

            for (i = 0, len = cons.length; i < len; i++) {
                con = cons[i];

                // Only add to output if the connection isn't the input Component or any output of the input Component
                if (con !== input && (!input.outputs.contains(con) || con.inputs.contains(comp))) {
                    comp.outputs.add(con);
                    con.inputs.add(comp);
                }
            }
        }
        // Error if we traverse into a driver
        else if (comp.isADriver()) {
            digsim.addMessage(digsim.ERROR, "[16]Error: Switches '" + this.label + "' and '" + comp.label + "' are driving one wire.");
            return false;
        }
        // Error if we traverse into the output of a gate
        else if (comp.isAGate()) {
            outs = comp.outputs.get();

            for (i = 0, len = outs.length; i < len; i++) {
                // If the output is also in the inputs we have an error
                if (comp.inputs.contains(outs[i])) {
                    digsim.addMessage(digsim.ERROR, "[17]Error: Switch '" + this.label + "' connected to the output of Gate '" + comp.label + ".");
                    return false;
                }

                comp.outputs.add(outs[i]);
                outs[i].inputs.add(comp);
            }
        }

        traversedComps.add(comp);

        // Add only non-traversed connections to the queue
        outs = comp.outputs.get();
        for (i = 0, len = outs.length; i < len; i++) {
            output = outs[i];

            if (!traversedComps.contains(output)) {
                compQueue.push(output);
            }
        }

        // Remove the Component from the queue
        compQueue.shift();
    }

    return true;
};

/******************************************************************************
 * Program:
 *  componentList.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *
 *****************************************************************************/

/*****************************************************************************
 * ComponentList
 *  Object for handling the storing of Components and connections between them.
 * @constructor
 * @param {number} id - Id of the Component that owns this list.
 ****************************************************************************/
function ComponentList(id) {
    // Private dictionary of Components indexed by their id. Also stores at what connection index a Component is connected.
    // Objects are just pointers so storing an object is only storing a pointer of 4 bytes
    // http://stackoverflow.com/questions/4740593/how-is-memory-handled-with-javascript-objects
    var components = {};

    /*****************************************************************************
     * ADD
     *  Add a Component to the dictionary.
     * @param {Component} comp     - Component to add.
     * @param {number}    conIndex - Connection index.
     * @param {boolean}   addBack  - Add this id to the Component.
     ****************************************************************************/
    this.add = function(comp, conIndex, addBack) {
        if (typeof comp === 'object' && !components[comp.id]) {
            components[comp.id] = comp;

            if (typeof conIndex !== 'undefined')
                components['connection_'+comp.id] = conIndex;

            // Add the Component to comp
            if (addBack)
                comp.checkConnections();
        }
    };

    /*****************************************************************************
     * REMOVE
     *  Remove a Component from the dictionary.
     * @param {Component} comp       - Component to remove.
     * @param {boolean}   removeBack - Remove this id from the Component. @default false
     ****************************************************************************/
    this.remove = function(comp, removeBack) {
        if (typeof comp === 'object' && components[comp.id]) {
            delete components[comp.id];

            if (components['connection_'+comp.id])
                delete components['connection_'+comp.id];

            // Remove this Component from the passed Component as well
            if (removeBack) {
                if (comp.inputs)
                    comp.inputs.removeId(id);
                if (comp.outputs)
                    comp.outputs.removeId(id);
                if (comp.connections)
                    comp.connections.removeId(id);
            }
        }
    };

    /*****************************************************************************
     * REMOVE ID
     *  Remove a Component from the dictionary by Component id.
     * @param {number}  compId     - Id of the Component to remove.
     * @param {boolean} removeBack - Remove this id from the Component. @default false
     ****************************************************************************/
    this.removeId = function(compId, removeBack) {
        if ((typeof compId === 'number' || typeof compId === 'string') && components[compId]) {
            var comp = components[compId];
            delete components[compId];

            if (components['connection_'+compId])
                delete components['connection_'+compId];

            // Remove this Component from the passed Component as well
            if (removeBack) {
                if (comp.inputs)
                    comp.inputs.removeId(id);
                if (comp.outputs)
                    comp.outputs.removeId(id);
                if (comp.connections)
                    comp.connections.removeId(id);
            }
        }
    };

    /*****************************************************************************
     * GET
     *  Returns an array of Components that are in the components dictionary.
     * @return {Array} Array of Components.
     ****************************************************************************/
    this.get = function() {
        var comps = [];

        for (var compId in components) {
            // Only return components and not their connection index
            if (components.hasOwnProperty(compId) && compId[0] !== 'c') {
                comps.push(components[compId]);
            }
        }

        return comps;
    };

    /*****************************************************************************
     * GET COMPONENT
     *  Return the Component that matches the id.
     * @param {number} compId - Id of the Component to get.
     * @return {Components} Found Component or undefined if not in dictionary.
     ****************************************************************************/
    this.getComponent = function(compId) {
        if ((typeof compId === 'number' || typeof compId === 'string') && components[compId])
            return components[compId];
        else
            return undefined;
    };

    /*****************************************************************************
     * GET CONNECTION INDEX
     *  Return the Component index for the component.
     * @param {number} comp - Component to get the connection index for.
     * @return {number} Connection index.
     ****************************************************************************/
    this.getConnectionIndex = function(comp) {
        if (typeof comp === 'object' && typeof components['connection_'+comp.id] !== 'undefined')
            return components['connection_'+comp.id];
        else
            return undefined;
    };

    /*****************************************************************************
     * GET CONNECTION COMPONENT
     *  Return the Components of the connection index.
     * @param {number} index - Connection index.
     * @return {Array} Array of Components that match the connection index.
     ****************************************************************************/
    this.getConnectionComponents = function(index) {
        var comps = [];

        if (typeof index === 'number' || typeof index === 'string') {
            for (var i in components) {
                if (components.hasOwnProperty(i)) {
                    if (components[i] === index)
                        comps.push(components[ i.substr(i.indexOf("_") + 1) ]);
                }
            }
        }

        return comps;
    };

    /*****************************************************************************
     * CONTAINS
     *  Returns True if the Component is in the components dictionary.
     * @param {Component} comp - Component to look for.
     * @return {boolean}
     ****************************************************************************/
    this.contains = function(comp) {
        if (typeof comp === 'object' && components[comp.id])
            return true;
        else
            return false;
    };

    /*****************************************************************************
     * LENGTH
     *  Returns the length of the components dictionary.
     * @return {number} Number of items in the components dictionary.
     ****************************************************************************/
    this.length = function() {
       return Object.keys(components).length;
    };

    /*****************************************************************************
     * CLEAR
     *  Clears the dictionary and removes all components to the Component.
     * @param {boolean} removeBack - Remove this id from the Component. @default true
     ****************************************************************************/
    this.clear = function(removeBack) {
        removeBack = (typeof removeBack === 'undefined' ? true : removeBack);

        for (var compId in components) {
            if (components.hasOwnProperty(compId)) {
                this.removeId(compId, removeBack);
            }
        }
    };
}
/*****************************************************************************
 * Program:
 *  and-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * AND
 * @constructor
 * @extends Component
 * @param {number} numInputs - Number of input connections.
 ****************************************************************************/
function AND(numInputs) {
    this.type        = digsim.AND;
    this.name        = 'AND';

    this.numInputs   = numInputs || 2;
    this.numOutputs  = 1;
    var size         = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension   = {'row': size, 'col': size};  // Height and width of component
}

AND.prototype = new Component();

/*****************************************************************************
 * CHANGE NUM INPUTS
 *  Changes the number of inputs and the size of the Component.
 * @param {number} numInputs - Number of inputs to change to.
 ****************************************************************************/
AND.prototype.changeNumInputs = function(numInputs) {
    if (numInputs >= 2) {
        this.numInputs = numInputs;
        var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
        this.dimension = {'row': size, 'col': size};
        this.zeroDimension = {'row': size, 'col': size};
    }
};

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
AND.prototype.isAGate = function() {
    return true;
};

/*****************************************************************************
 * DRAW
 *  Draw the AND gate to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
AND.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;

    // Rotate to center
    var center = {'row': (this.dimension.row / 2) * digsim.gridSize,
                  'col': (this.dimension.col / 2) * digsim.gridSize };
    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw gate
    var factor = Math.floor(this.numInputs / 2);
    var gsf = digsim.gridSize * factor;

    context.moveTo(0, 0);
    context.lineTo(gsf,  0);

    // var P0x = gsf;
    // var P0y = 0;
    // var P1x = gsf;
    var P1y = gsf * 2 + digsim.gridSize;
    // var Mx  = P1y;
    // var My  = P1y / 2;
    // var C0y = gsf;
    var Cx = (4 * P1y - gsf) / 3;
    // var C1y = gsf;
    context.bezierCurveTo(Cx, 0, Cx, P1y, gsf, P1y);
    context.lineTo(0, P1y);

    context.closePath();
    context.stroke();
    context.fill();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  ANDs all the input wires together to set the current state of the gate.
 ****************************************************************************/
AND.prototype.computeLogic = function() {
    var ins = this.inputs.get();
    var computedState = ins[0].state;

    for (var i = 1, len = ins.length; i < len; ++i) {
        computedState = computedState && ins[i].state;
    }
    this.state = (computedState ? 1 : 0);
};

/*****************************************************************************
 * Program:
 *  ascii-display.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * ASCII DISPLAY
 * @constructor
 * @extends Component
 ****************************************************************************/
function ASCIIDisplay() {
    this.type        = digsim.ASCIIDISPLAY;
    this.name        = 'ASCIIDisplay';

    this.numInputs   = 8;  // 8 address bits
    this.numOutputs  = 0;
    this.dimension   = {'row': 8, 'col': 12};  // Height and width of component
    this.previousClockState = 0;   // Keep track of clock state to know when it is on rising edge

    // Display variables
    this.text = "";
    this.numCols = 13;   // Number of columns in the display screen
    this.numRows = 4;    // Number of rows in the display screen

    // Keep track of the clock pulse (CP) connection
    this.namedConnections = {};
}
ASCIIDisplay.prototype = new Component();

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
ASCIIDisplay.prototype.isAGate = function() {
    return true;
};

/******************************************************************************
 * RESET
 *  Reset the state of the component.
 *****************************************************************************/
ASCIIDisplay.prototype.reset = function() {
    this.text = "";
    this.previousClockState = 0;
};

/*****************************************************************************
 * BINARY TO ASCII
 *  Converts a binary value to an ascii character.
 * @param {number} bin - Binary to convert.
 * @param {string} Ascii character
 ****************************************************************************/
ASCIIDisplay.prototype.bin2asc = function(bin) {
    return String.fromCharCode(parseInt(bin, 2));
};

/******************************************************************************
 * GET INPUT ROTATION
 *  Return the row, col, and index of the input based on rotation and input index.
 * @param {number} inputIndex - Index of input.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
ASCIIDisplay.prototype.getInputRotation = function(inputIndex) {
    return Component.prototype.getInputRotation.call(this, inputIndex, 0);
};

/******************************************************************************
 * GET CLOCK PULSE ROTATION
 *  Return the row, col, and index of the select based on rotation.
 * @param {number} selectIndex - Index of select.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
ASCIIDisplay.prototype.getCPRotation = function() {
    var row, col, index;

    // Get the row and col of the wire
    switch (this.rotation / 90) {
        case 0:
            row = this.row + this.dimension.row;
            col = this.col + 1;
            index = 0;
            break;
        case 1:
            row = this.row + 1;
            col = this.col - 1;
            index = 1;
            break;
        case 2:
            row = this.row - 1;
            col = this.col + this.dimension.col - 2;
            index = 2;
            break;
        case 3:
            row = this.row + this.dimension.row - 2;
            col = this.col + this.dimension.col;
            index = 3;
    }

    return {row: row, col: col, index: index};
};

/******************************************************************************
 * GET COMPONENT SPACE
 *  Return every {row, col, index} that the component fills. Helpful for setting
 *  and deleting placeholders.
 * @return {Array} array of objects of {row, col, index}. Index is
 *                 only present if space is a wire.
 *****************************************************************************/
ASCIIDisplay.prototype.getComponentSpace = function() {
    // Call parent implementations
    var spaces = Component.prototype.getComponentSpace.call(this);

    // Get the select wire space
    var space = [];
    var cp = this.getCPRotation();

    space.push({
        'row'     : cp.row,
        'col'     : cp.col,
        'index'   : cp.index,
        'con'     : true,
        'conIndex': 'cp',
        'name'    : 'cp',
    });
    return spaces.concat(space);
};

/*****************************************************************************
 * ROUND RECT
 *  Draws a rounded rectangle using the current state of the canvas.
 * @param {number} x - Top left x coordinate.
 * @param {number} y - top left y coordinate.
 * @param {number} w - Width of the rectangle.
 * @param {number} h - Height of the rectangle.
 * @param {number} r - Corner radius.
 ****************************************************************************/
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    this.closePath();
    return this;
};

/*****************************************************************************
 * DRAW
 *  Draw the ASCIIDisplay to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
ASCIIDisplay.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;
    context.font        = (digsim.gridSize / 2) + "px Arial";
    context.fontWidth   = digsim.gridSize / 4;

    // Rotation
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = -2;
    }
    else if (this.rotation === 270) {
        offsetH = 2;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // CP Wire
    context.beginPath();
    context.moveTo(1.5 * digsim.gridSize, (this.zeroDimension.row + 0.5) * digsim.gridSize);
    context.lineTo(1.5 * digsim.gridSize, (this.zeroDimension.row - 1) * digsim.gridSize);
    context.stroke();

    // Draw display
    context.beginPath();
    context.fillRect(0, 0, this.zeroDimension.col * digsim.gridSize, this.zeroDimension.row * digsim.gridSize);
    context.strokeRect(0, 0, this.zeroDimension.col * digsim.gridSize, this.zeroDimension.row * digsim.gridSize);

    // Draw display screen
    var screenWidth = (this.zeroDimension.col - 2) * digsim.gridSize;
    var screenHeight = (this.zeroDimension.row - 2) * digsim.gridSize;
    context.roundRect(digsim.gridSize, digsim.gridSize, screenWidth, screenHeight, digsim.gridSize / 2).stroke();

    // Font properties
    context.beginPath();
    context.fillStyle = lineColor || 'black';

    // Font position based on bottom left of letter
    // Inputs
    context.fillText("00", digsim.gridSize / 6, digsim.gridSize * 0.75);
    context.fillText("01", digsim.gridSize / 6, digsim.gridSize * 1.75);
    context.fillText("02", digsim.gridSize / 6, digsim.gridSize * 2.75);
    context.fillText("03", digsim.gridSize / 6, digsim.gridSize * 3.75);
    context.fillText("04", digsim.gridSize / 6, digsim.gridSize * 4.75);
    context.fillText("05", digsim.gridSize / 6, digsim.gridSize * 5.75);
    context.fillText("06", digsim.gridSize / 6, digsim.gridSize * 6.75);
    context.fillText("07", digsim.gridSize / 6, digsim.gridSize * 7.75);
    context.fillText("CP", digsim.gridSize / 6 + digsim.gridSize, digsim.gridSize * 7.75);

    context.stroke();
    context.fill();

    // Draw Component Select circle
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(digsim.gridSize * 1.5, digsim.gridSize * 8 + digsim.gridSize / 6,  // center
                digsim.gridSize / 6, 0,
                2 * Math.PI);
    context.fill();
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    // Draw display text to screen
    // Canvas does not support newline characters, so we must implement them manually
    // http://stackoverflow.com/questions/5026961/html5-canvas-ctx-filltext-wont-do-line-breaks
    var col = 0;
    var row = 0;
    var colStart = digsim.gridSize / 6 + digsim.gridSize;
    var rowStart = digsim.gridSize * 2;

    var fontWidth = digsim.gridSize / 4;
    var fontHeight = screenHeight / this.numRows;
    var fontSize = screenWidth / this.numCols * fontHeight / digsim.gridSize - fontWidth / 1.5;

    context.fillStyle = 'black';
    context.font      = fontSize + "px Arial";
    context.fontWidth = fontWidth;

    var character, index, i;
    for (i = 0; i < this.text.length; i++) {
        character = this.text[i];
        context.fillText(character, colStart + (fontSize - fontWidth) * col++, rowStart + fontHeight * row);

        // Go to next row
        if (col >= this.numCols || character === "\n") {
            row++;
            col = 0;
        }

        // Remove first row of characters
        if (row >= this.numRows && i !== this.text.length - 1) {

            // Find where the first row ends by seeing if a new line character comes before the end of a row
            index = this.text.indexOf("\n");
            if (index === -1 || index > this.numCols)
                index = this.numCols;
            else
                index++;
            this.text = this.text.substring(index);
        }
    }

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  Set state based on input address and programmed hex number.
 ****************************************************************************/
ASCIIDisplay.prototype.computeLogic = function() {
    // Ensure we have the named connections to work with
    var clock = this.namedConnections.cp;

    if (!clock) {
        return;
    }

    // Clock switched to rising edge
    if (this.previousClockState === 0 && clock.state) {
        // Get binary value of inputs
        var binary = "";
        var i, comp, state, character, code;
        for (i = this.numInputs - 1; i >= 0; i--) {
            comp = this.inputs.getConnectionComponents(i)[0];
            state = (typeof comp !== 'undefined' && comp.state >= 0 ? comp.state : 0);
            binary += state + "";
        }

        // Get ascii character
        character = this.bin2asc(binary);
        code = character.charCodeAt(0);

        // Allowed codes: C (12), D (13), 20 (32) - 7E (126)
        if (code === 12 || code === 13 || (code >= 32 && code <= 126)) {

            // Need to set the CR code to NL for JavaScript
            if (code === 13)
                character = "\n";

            // Implement a clear screen
            if (code === 12) {
                this.text = "";
                character = "";
            }

            this.text += character;

            // Trim text if too long for display
            if (this.text.length > this.numCols * this.numRows)
                this.text = this.text.substring(this.numCols);
        }
    }

    this.previousClockState = clock.state;
};
/*****************************************************************************
 * Program:
 *  clock.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * CLOCK
 * @constructor
 * @extends Component
 ****************************************************************************/
function Clock() {
    this.type        = digsim.CLOCK;
    this.name        = 'Clock';
    this.frequency   = 2;   // in Hz

    this.numInputs   = 0;
    this.numOutputs  = 1;
    this.dimension   = {'row': 1, 'col': 2};  // Height and width of component
    this.extraSpace  = 2;
}
Clock.prototype = new Component();

/******************************************************************************
 * IS A DRIVER
 *  Return true if the component is a driver.
 * @return {boolean}
 *****************************************************************************/
Clock.prototype.isADriver = function() {
    return true;
};

/****************************************************************************
 * DRAW
 *  Draw the clock to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ***************************************************************************/
Clock.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineCap     = 'round';
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

    context.moveTo(0, 0);

    // Outside rectangle
    context.rect(0, digsim.gridSize * -0.25, digsim.gridSize * 2, digsim.gridSize * 1.5);
    context.fill();
    context.stroke();

    // Inside triangle
    context.beginPath();
    context.moveTo(digsim.gridSize * 2    , digsim.gridSize * 0.25);
    context.lineTo(digsim.gridSize * 1.75 , digsim.gridSize * 0.5);
    context.lineTo(digsim.gridSize * 2    , digsim.gridSize * 0.75);
    context.stroke();

    // Clock signal
    context.beginPath();
    context.moveTo(digsim.gridSize * 5 / 3, 0);
    context.lineTo(digsim.gridSize * 5 / 3, digsim.gridSize);
    context.lineTo(digsim.gridSize        , digsim.gridSize);
    context.lineTo(digsim.gridSize        , 0);
    context.lineTo(digsim.gridSize / 3    , 0);
    context.lineTo(digsim.gridSize / 3    , digsim.gridSize);
    context.fill();
    context.stroke();

    // Connection
    context.beginPath();
    context.moveTo(digsim.gridSize * 2    , digsim.gridSize * 0.5);
    context.lineTo(digsim.gridSize * 2.5  , digsim.gridSize * 0.5);
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};
/*******************************************************************************
 * Program:
 *  dff.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ******************************************************************************/


/*****************************************************************************
 * DFF
 * @constructor
 * @extends Component
 ****************************************************************************/
function DFF() {
    this.type               = digsim.DFF;
    this.name               = 'DFF';

    this.numInputs          = 2;
    this.numOutputs         = 2;
    this.dimension          = {'row': 3, 'col': 2};  // Height and width of component
    this.previousClockState = 0;   // Keep track of clock state to know when it is on rising edge

    // DFF state : 0 = Q, 1 = Qnot
    this.state = [0, 0];
}
DFF.prototype = new Component();

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate
 * @return {boolean}
 *****************************************************************************/
DFF.prototype.isAGate = function() {
    return true;
};

/******************************************************************************
 * RESET
 *  Reset the state of the component.
 *****************************************************************************/
DFF.prototype.reset = function() {
    this.state = [0, 0];
    this.previousClockState = 0;
};

/******************************************************************************
 * GET OUTPUT ROTATION
 *  Return the row, col, and index of the output based on rotation and output index.
 * @param {number} outputIndex - Index of output.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
DFF.prototype.getOutputRotation = function(outputIndex) {
    // Skip a row/col for even input Components
    var skip = (this.numInputs % 2 === 0 && outputIndex >= this.numInputs / 2 ? 1 : 0);
    return Component.prototype.getOutputRotation.call(this, outputIndex, skip);
};

/*****************************************************************************
 * DRAW
 *  Draw the DFF to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
DFF.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;
    context.font        =  (digsim.gridSize / 2) + "px Arial";
    context.fontWidth   = digsim.gridSize / 4;

    // Rotation
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = 0.5;
    }
    else if (this.rotation === 270) {
        offsetH = -0.5;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw gate
    context.fillRect(0, 0, 2 * digsim.gridSize, 3 * digsim.gridSize);
    context.strokeRect(0, 0, 2 * digsim.gridSize, 3 * digsim.gridSize);

    // Font properties
    context.fillStyle = lineColor || 'black';

    // Font position based on bottom left of letter
    context.fillText("D", digsim.gridSize / 6, digsim.gridSize * 0.75);
    context.fillText("Q", digsim.gridSize * 1.375, digsim.gridSize * 0.75);
    context.fillText("Q", digsim.gridSize * 1.375, digsim.gridSize * 2.75);

    // Draw Q's bar
    context.beginPath();
    context.moveTo(digsim.gridSize * 1.4, digsim.gridSize * 2.3);
    context.lineTo(digsim.gridSize * 1.75, digsim.gridSize * 2.3);

    // Draw Clock triangle
    context.moveTo(0, digsim.gridSize * 2.25);
    context.lineTo(digsim.gridSize / 4, digsim.gridSize * 2.5);
    context.lineTo(0, digsim.gridSize * 2.75);
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};

/*******************************************************************************
 * COMPUTE LOGIC
 *  Truth table: *** changes only on the rising edge of the clock
 *  E/C  D     Q      Qnot       Comment
 *   0   X   Qprev   Qnotprev   No change
 *   1   0     0       1          Reset
 *   1   1     1       0           Set
 ******************************************************************************/
DFF.prototype.computeLogic = function() {

    // Ensure we have the named connections to work with
    var d = this.inputs.getConnectionComponents(0)[0];
    var clock = this.inputs.getConnectionComponents(1)[0];

    if (d && clock) {
        // Clock switched to rising edge
        if (this.previousClockState === 0 && clock.state) {
            // Set
            if (d.state) {
                this.state[0] = 1;
                this.state[1] = 0;
            }
            // Reset
            else {
                this.state[0] = 0;
                this.state[1] = 1;
            }
        }

        this.previousClockState = clock.state;
    }
};
/*******************************************************************************
 * Program:
 *  jkff.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * @deprecated
 ******************************************************************************/

/*****************************************************************************
 * JKFF
 * @constructor
 * @extends Component
 * @param {number} numInputs - Number of input connections.
 ****************************************************************************/
function JKFF(numInputs) {
    this.type = digsim.JKFF;
    this.name = 'JKFF';

    this.numInputs = 3;
    this.numOutputs = 2;
    this.dimension = {'row': 3, 'col': 2};
    this.previousClockState = 0;

    // Keep track of which connections are attached and how
    this.namedConnections = {};
    this.state = {
        'Q': false,
        'Qnot': false
    };
};
JKFF.prototype = new Component();

/*****************************************************************************
 * DRAW
 *  This will draw the and gate on the screen. Totally scalable, and able to
 *  handle any number of inputs. Props to Steven Lambert for figuring out how
 *  to draw a half circle with the bezierCurveTo method.
 ****************************************************************************/
JKFF.prototype.draw = function(context, lineColor) {

    var fontSize = digsim.gridSize / 2;
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);
    context.beginPath();
    context.fillStyle = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth = 2;

    // Rotatation
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = 0.5;
    }
    else if (this.rotation === 270) {
        offsetH = -0.5;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw gate
    context.fillRect(0, 0, 2 * digsim.gridSize, 3 * digsim.gridSize);
    context.strokeRect(0, 0, 2 * digsim.gridSize, 3 * digsim.gridSize);

    // Font properties
    context.font =  (digsim.gridSize / 2) + "px Arial";
    context.fillStyle = lineColor || 'black';

    // Font position based on bottom left of letter
    context.fillText("J", digsim.gridSize / 6, digsim.gridSize * 0.75);
    context.fillText("K", digsim.gridSize / 6, digsim.gridSize * 2.75);
    context.fillText("Q", digsim.gridSize * 1.375, digsim.gridSize * 0.75);
    context.fillText("Q", digsim.gridSize * 1.375, digsim.gridSize * 2.75);

    // Draw Q's bar
    context.moveTo(digsim.gridSize * 1.4, digsim.gridSize * 2.3);
    context.lineTo(digsim.gridSize * 1.75, digsim.gridSize * 2.3);

    // Draw Clock
    context.moveTo(0, digsim.gridSize * 1.25);
    context.lineTo(digsim.gridSize / 4, digsim.gridSize * 1.5);
    context.lineTo(0, digsim.gridSize * 1.75);

    context.stroke();
    context.restore();
};

// Infallable logic function
/*******************************************************************************
 * COMPUTE LOGIC
 *  Truth table: *** changes only on the rising edge of the clock
 *  J   K  Qnext    Comment
 *  0   0   Q       hold state
 *  0   1   0       reset
 *  1   0   1       set
 *  1   1   Qnot    toggle
 ******************************************************************************/
JKFF.prototype.computeLogic = function() {

    // Ensure we have the named connections to work with
    if (this.namedConnections['J'] && this.namedConnections['K'] && this.namedConnections['clock']) {
        // Clock switched to rising edge
        if (this.previousClockState == 0 && this.namedConnections['clock'].state) {
            // Set
            if (this.namedConnections['D'].state) {
                this.state['Q'] = 1;
                this.state['Qnot'] = 0;
            }
            // Reset
            else {
                this.state['Q'] = 0;
                this.state['Qnot'] = 1;
            }
        }

        this.previousClockState = this.namedConnections['clock'].state;
    }
};


/***************************************************************************
 * Program:
 *  led.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 **************************************************************************/

/*****************************************************************************
 * LED
 * @constructor
 * @extends Component
 ****************************************************************************/
function LED() {
    this.type        = digsim.LED;
    this.name        = 'LED';

    this.numInputs   = 1;
    this.numOutputs  = 0;
    this.dimension   = {'row': 2, 'col': 1};  // Height and width of component
}
LED.prototype = new Component();

/******************************************************************************
 * GET INPUT ROTATION
 *  Return the row, col, and index of the input based on rotation.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
LED.prototype.getInputRotation = function() {
    var row, col, index;

    switch(this.rotation / 90) {
        case 0:
            row = this.row + this.dimension.row;
            col = this.col;
            index = 0;
            break;
        case 1:
            row = this.row;
            col = this.col -1;
            index = 1;
            break;
        case 2:
            row = this.row - 1;
            col = this.col;
            index = 2;
            break;
        case 3:
            row = this.row;
            col = this.col + this.dimension.col;
            index = 3;
            break;
    }

    return {row: row, col: col, index: index};
};

/*****************************************************************************
 * DRAW
 *  Draw the LED to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
LED.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, (this.row) * digsim.gridSize);

    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;

    // Rotation
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = 0.5;
    }
    else if (this.rotation === 270) {
        offsetH = -0.5;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    // Fill LED light part
    context.beginPath();
    var P0x = digsim.gridSize / 8;
    var P0y = digsim.gridSize * 4 / 3;
    var P1x = 7 * P0x;
    var P1y = P0y;
    var My  = digsim.gridSize / 4;
    var C0x = P0x;
    var Cy = (4 * My - P0y) / 3;
    var C1x = P1x;

    context.moveTo(P0x, P0y);
    context.bezierCurveTo(C0x, Cy, C1x, Cy, P1x, P1y);

    if (this.state === 1 && digsim.mode === digsim.SIM_MODE) {
        context.fillStyle = '#FF0000';
    }
    context.stroke();
    context.fill();

    // Bottom part
    context.beginPath();
    context.fillStyle = '#FFFFFF';

    context.moveTo(0, 4 / 3 * digsim.gridSize);
    context.lineTo(digsim.gridSize, 4 / 3 * digsim.gridSize);

    context.stroke();

    context.beginPath();
    context.moveTo(digsim.gridSize * 7 / 8, 4 / 3 * digsim.gridSize);
    context.lineTo(digsim.gridSize * 7 / 8, digsim.gridSize * 2);
    context.lineTo(digsim.gridSize / 8, digsim.gridSize * 2);
    context.lineTo(digsim.gridSize / 8, 4 / 3 * digsim.gridSize);
    context.closePath();
    context.stroke();
    context.fill();

    context.moveTo(digsim.gridSize / 2, digsim.gridSize * 2);
    context.lineTo(digsim.gridSize / 2, 5 / 2 * digsim.gridSize);
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};
/*****************************************************************************
 * Program:
 *  mux.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * MUX
 * @constructor
 * @extends Component
 * @param {number} numInputs - Number of input connections.
 ****************************************************************************/
function MUX(numInputs) {
    this.type        = digsim.MUX;
    this.name        = 'MUX';

    this.numInputs   = (numInputs != 3) ? numInputs : 2;
    this.numOutputs  = 1;
    this.dimension   = {'row': this.numInputs + 1, 'col': this.numInputs / 2};  // Height and width of component

    // Keep track of component select connections
    this.namedConnections = {};
}
MUX.prototype = new Component();

/*****************************************************************************
 * CHANGE NUM INPUTS
 *  Changes the number of inputs and the size of the Component.
 * @param {number} numInputs - Number of inputs to change to.
 ****************************************************************************/
MUX.prototype.changeNumInputs = function(numInputs) {
    if (numInputs % 2 === 0) {
        this.numInputs = numInputs;

        if (this.rotation === 0 || this.rotation === 180)
            this.dimension = {'row': this.numInputs + 1, 'col': this.numInputs / 2};
        else
            this.dimension = {'row': this.numInputs / 2, 'col': this.numInputs + 1};

        this.zeroDimension = {'row': this.numInputs + 1, 'col': this.numInputs / 2};
    }
};

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
MUX.prototype.isAGate = function() {
    return true;
};

/******************************************************************************
 * GET SELECT ROTATION
 *  Return the row, col, and index of the select based on rotation and select index.
 * @param {number} selectIndex - Index of select.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
Component.prototype.getSelectRotation = function(selectIndex) {
    var row, col, index;

    // Get the row and col of the wire
    switch (this.rotation / 90) {
        case 0:
            row = this.row + this.dimension.row;
            col = this.col + this.dimension.col - 1 - selectIndex;
            index = 0;
            break;
        case 1:
            row = this.row + this.dimension.row - 1 - selectIndex;
            col = this.col - 1;
            index = 1;
            break;
        case 2:
            row = this.row - 1;
            col = this.col + selectIndex;
            index = 2;
            break;
        case 3:
            row = this.row + selectIndex;
            col = this.col + this.dimension.col;
            index = 3;
    }

    return {row: row, col: col, index: index};
};

/******************************************************************************
 * GET COMPONENT SPACE
 *  Return every {row, col, index} that the component fills. Helpful for setting
 *  and deleting placeholders.
 * @return {Array} array of objects of {row, col, index}. Index is
 *                 only present if space is a wire.
 *****************************************************************************/
MUX.prototype.getComponentSpace = function() {
    // Call parent implementations
    var spaces = Component.prototype.getComponentSpace.call(this);

    // Get the select wire space
    var numSelect = this.numInputs / 2;
    var space = [], select;
    for (var i = 0; i < numSelect; i++) {
        select = this.getSelectRotation(i);

        space.push({
            'row'     : select.row,
            'col'     : select.col,
            'index'   : select.index,
            'con'     : true,
            'conIndex': 's'+i,
            'name'    : 's'+i,
        });
    }

    return spaces.concat(space);
};

/*****************************************************************************
 * DRAW
 *  Draw the MUX to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
MUX.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;
    context.font        = (digsim.gridSize / 2) + "px Arial";
    context.fontWidth   = digsim.gridSize / 4;

    // Rotation
    // TODO: FIX FOR BETTER SCALING
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        if (this.numInputs === 2)
            offsetV = 1;
        else
            offsetV = 1.5;
    }
    else if (this.rotation === 270) {
        if (this.numInputs === 2)
            offsetH = -1;
        else
            offsetH = -1.5;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Select Wires
    var factor = Math.floor(this.numInputs / 2);

    context.beginPath();
    context.moveTo(0.5 * digsim.gridSize, (this.numInputs + 1.5) * digsim.gridSize);
    context.lineTo(0.5 * digsim.gridSize, (this.numInputs) * digsim.gridSize);
    if (this.numInputs == 4) {
        context.moveTo(1.5 * digsim.gridSize, (this.numInputs + 1.5) * digsim.gridSize);
        context.lineTo(1.5 * digsim.gridSize, (this.numInputs) * digsim.gridSize);
    }
    context.stroke();

    // Draw body
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, (this.numInputs + 1) * digsim.gridSize);
    context.lineTo(digsim.gridSize * factor, ((this.numInputs + 1) - this.numInputs / 4) * digsim.gridSize);
    context.lineTo(digsim.gridSize * factor, digsim.gridSize * this.numInputs / 4);
    context.closePath();
    context.fill();

    // Select Line text
    var textX = digsim.gridSize * (this.numInputs == 2 ? 1 / 6 : 7 / 6);
    var textY = digsim.gridSize * (this.numInputs == 2 ? 2.5 : 4);
    context.fillStyle = context.strokeStyle;
    context.fillText("S0", textX, textY);
    if (this.numInputs == 4) {
        context.fillText("S1", textX - digsim.gridSize, textY);
    }
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  Set state based on select inputs address.
 ****************************************************************************/
MUX.prototype.computeLogic = function() {
    var select = "";
    var s, comp;
    for (var i = this.numInputs / 2 - 1; i >= 0; i--) {
        comp = this.namedConnections['s'+i];
        s = (typeof comp !== 'undefined' && comp.state >= 0 ? comp.state : 0);
        select += s + "";
    }
    var input = parseInt(select, 2);
    comp = this.inputs.getConnectionComponents(input)[0];
    if (comp)
        this.state = comp.state;
    else
        this.state = 0;
};
/*****************************************************************************
 * Program:
 *  and-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * AND
 * @constructor
 * @extends Component
 * @param {number} numInputs - Number of input connections.
 ****************************************************************************/
function NAND(numInputs) {
    this.type        = digsim.NAND;
    this.name        = 'NAND';

    this.numInputs   = numInputs || 2;
    this.numOutputs  = 1;
    var size         = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension   = {'row': size, 'col': size};  // Height and width of component
}
NAND.prototype = new Component();

/*****************************************************************************
 * CHANGE NUM INPUTS
 *  Changes the number of inputs and the size of the Component.
 * @param {number} numInputs - Number of inputs to change to.
 ****************************************************************************/
NAND.prototype.changeNumInputs = function(numInputs) {
    if (numInputs >= 2) {
        this.numInputs = numInputs;
        var size = (2 * (Math.floor(this.numInputs / 2))) + 1;
        this.dimension = {'row': size, 'col': size};
        this.zeroDimension = {'row': size, 'col': size};
    }
};

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
NAND.prototype.isAGate = function() {
    return true;
};

/*****************************************************************************
 * DRAW
 *  Draw the NAND gate to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
NAND.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;

    // Rotation
    var center = {'row': (this.dimension.row / 2) * digsim.gridSize,
        'col': (this.dimension.col / 2) * digsim.gridSize };
    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw gate
    var factor = Math.floor(this.numInputs / 2);
    var gsf = digsim.gridSize * factor;

    context.moveTo(0, 0);
    context.lineTo(gsf,  0);

    var P1y = gsf * 2 + digsim.gridSize;
    var Cx = (4 * P1y - gsf) / 3;

    context.bezierCurveTo(Cx, 0, Cx, P1y, gsf, P1y);
    context.lineTo(0, P1y);

    context.closePath();
    context.stroke();
    context.fill();

    context.moveTo(digsim.gridSize * 10 / 3, digsim.gridSize * 1.5);
    context.beginPath();

    context.arc(digsim.gridSize / 6 + (2 * factor + 1) * digsim.gridSize, (factor + 0.5) * digsim.gridSize,  // center
                digsim.gridSize / 6, 0,
                2 * Math.PI);
    context.fill();
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  ANDs all the input wires together and then inverts that to set the
 *  current state of the gate.
 ****************************************************************************/
NAND.prototype.computeLogic = function() {
    var ins = this.inputs.get();
    var computedState = ins[0].state;

    for (var i = 1, len = ins.length; i < len; ++i) {
        computedState = computedState && ins[i].state;
    }
    this.state = (!computedState ? 1 : 0);
};
/*****************************************************************************
 * Program:
 *  nor-gate.js
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
function NOR(numInputs) {
    this.type        = digsim.NOR;
    this.name        = 'NOR';

    this.numInputs   = numInputs || 2;
    this.numOutputs  = 1;
    var size         = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension   = {'row': size, 'col': (size + 1)};  // Height and width of component
}
NOR.prototype = new Component();

/*****************************************************************************
 * CHANGE NUM INPUTS
 *  Changes the number of inputs and the size of the Component.
 * @param {number} numInputs - Number of inputs to change to.
 ****************************************************************************/
NOR.prototype.changeNumInputs = function(numInputs) {
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
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
NOR.prototype.isAGate = function() {
    return true;
};

/*****************************************************************************
 * DRAW
 *  Draw the NOR gate to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
NOR.prototype.draw = function(context, lineColor) {
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

    this.drawWires(context, lineColor, 2);

    // Draw gate
    var factor = Math.floor(this.numInputs / 2);
    var gsf = digsim.gridSize * factor;

    context.moveTo(0, 0);
    context.lineTo(gsf,  0);

    // This is explained in or-gate.js
    var t = 0.28;               // SET THIS TO CHANGE CURVATURE
    var baseCurveature = 1.15;  // SET THIS TO CHANGE BASE CURVATURE
    var height = 2 * factor + 1;
    var x0 = gsf;
    var y0 = 0;
    var y1 = height * digsim.gridSize / 2;
    var x1 = y1 * 2 + digsim.gridSize;
    var xc = (x0 + x1) / 2;
    var yc = (y0 + y1) / 2;
    var x = (y1 - y0) * t + xc;
    var y = (x0 - x1) * t + yc;

    context.quadraticCurveTo(x, y, x1, y1);

    x0 = x1;
    y0 = y1;
    x1 = gsf;
    y1 = height * digsim.gridSize;
    xc = (x0 + x1) / 2;
    yc = (y0 + y1) / 2;
    x = (y1 - y0) * t + xc;
    y = (x0 - x1) * t + yc;

    context.quadraticCurveTo(x, y, x1, y1);

    context.lineTo(0, y1);

    context.quadraticCurveTo(digsim.gridSize * baseCurveature, y1 / 2, 0, 0);
    context.stroke();
    context.fill();

    context.beginPath();
    context.arc(digsim.gridSize / 6 + (2 * factor + 2) * digsim.gridSize, (factor + 0.5) * digsim.gridSize,  // center
                digsim.gridSize / 6, 0,
                2 * Math.PI);
    context.fill();
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  ORs all the input wires together and then inverts them to set the
 *  current state of the gate.
 ****************************************************************************/
NOR.prototype.computeLogic = function() {
    var ins = this.inputs.get();
    var computedState = ins[0].state;

    for (var i = 1, len = ins.length; i < len; ++i) {
        computedState = computedState || ins[i].state;
    }
    this.state = (!computedState ? 1 : 0);
};
/*****************************************************************************
 * Program:
 *  not-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * NOT
 * @constructor
 * @extends Component
 ****************************************************************************/
function NOT() {
    this.type        = digsim.NOT;
    this.name        = 'NOT';

    this.numInputs   = 1;
    this.numOutputs  = 1;
    this.dimension   = {'row': 1, 'col': 2};  // Height and width of component
    this.extraSpace  = 1;
}
NOT.prototype = new Component();

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
NOT.prototype.isAGate = function() {
    return true;
};

/*****************************************************************************
 * DRAW
 *  Draw the NOT gate to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
NOT.prototype.draw = function(context, lineColor) {
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
    context.beginPath();
    context.moveTo(0, -digsim.gridSize / 3);
    context.lineTo(digsim.gridSize * 1.625, digsim.gridSize * 0.5);
    context.lineTo(0, digsim.gridSize * 4 / 3);
    context.closePath();
    context.fill();
    context.stroke();

    // Draw circle
    context.beginPath();
    context.moveTo(digsim.gridSize * 1.75, digsim.gridSize * 0.5);
    context.beginPath();
    context.arc(digsim.gridSize * 1.8125, digsim.gridSize * 0.5, digsim.gridSize * 3 / 16, 0, 2 * Math.PI);
    context.fill();
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  NOTs the input wire to set the current state of the gate.
 ****************************************************************************/
NOT.prototype.computeLogic = function() {
    var ins = this.inputs.get()[0];   // NOT gate can only have 1 input
    this.state = (!ins.state ? 1 : 0);
};
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

    this.drawWires(context, lineColor, 2);

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
    context.quadraticCurveTo(digsim.gridSize * baseCurveature, y1 / 2, 0, 0);
    context.stroke();
    context.fill();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

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
/*****************************************************************************
 * Program:
 *  prom.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * PROM
 * @constructor
 * @extends Component
 ****************************************************************************/
function PROM() {
    this.type        = digsim.PROM;
    this.name        = 'PROM';

    this.numInputs   = 7;  // 6 address bits and 1 component select (CS)
    this.numOutputs  = 8;  // 8 bits
    this.dimension   = {'row': 8, 'col': 4};  // Height and width of component

    // 6 bit address (decimal) to 2 hex (decimal) dictionary
    this.addresses = {};
    for (var i = 0, len = Math.pow(2, this.numInputs - 1); i < len; i++) {
        this.addresses[i] = 0;
    }

    // 8 bit state\
    this.state = [0, 0, 0, 0, 0, 0, 0, 0];
}
PROM.prototype = new Component();

/******************************************************************************
 * IS A GATE
 *  Return true if the component is a gate.
 * @return {boolean}
 *****************************************************************************/
PROM.prototype.isAGate = function() {
    return true;
};

/******************************************************************************
 * GET INPUT ROTATION
 *  Return the row, col, and index of the input based on rotation and input index.
 * @param {number} inputIndex - Index of input.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
PROM.prototype.getInputRotation = function(inputIndex) {
    // Skip a row/col for the component select wire
    var skip = (inputIndex === this.numInputs - 1 ? 1 : 0);
    var row, col, index;

    // Get the row and col of the first wire (0), then modify by inputIndex
    switch(this.rotation / 90) {
        case 0:
            row = this.row + inputIndex + skip;
            col = this.col - 1;
            index = 1;
            break;
        case 1:
            row = this.row - 1;
            col = this.col + this.dimension.col - 1 - inputIndex - skip;
            index = 2;
            break;
        case 2:
            row = this.row + this.dimension.row - 1 - inputIndex - skip;
            col = this.col + this.dimension.col;
            index = 3;
            break;
        case 3:
            row = this.row + this.dimension.row;
            col = this.col + inputIndex + skip;
            index = 0;
            break;
    }

    return {row: row, col: col, index: index};
};

/******************************************************************************
 * GET OUTPUT ROTATION
 *  Return the row, col, and index of the output based on rotation and output index.
 * @param {number} outputIndex - Index of output.
 * @return {Object} {row, col, index}.
 *****************************************************************************/
PROM.prototype.getOutputRotation = function(outputIndex) {
    return Component.prototype.getOutputRotation.call(this, outputIndex, 0);
};

/*****************************************************************************
 * DRAW
 *  Draw the PROM to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
PROM.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;
    context.font        = (digsim.gridSize / 2) + "px Arial";
    context.fontWidth   = digsim.gridSize / 4;

    // Rotation
    var offsetH = 0, offsetV = 0;
    if (this.rotation == 90) {
        offsetV = 2;
    }
    else if (this.rotation === 270) {
        offsetH = -2;
    }

    var center = {'row': (this.dimension.row / 2 + offsetV) * digsim.gridSize,
        'col': (this.dimension.col / 2 + offsetH) * digsim.gridSize};

    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    this.drawWires(context, lineColor);

    // Draw gate
    context.beginPath();
    context.fillRect(0, 0, this.zeroDimension.col * digsim.gridSize, this.zeroDimension.row * digsim.gridSize);
    context.strokeRect(0, 0, this.zeroDimension.col * digsim.gridSize, this.zeroDimension.row * digsim.gridSize);

    // Font properties
    context.fillStyle = lineColor || 'black';

    // Font position based on bottom left of letter
    // Inputs
    context.fillText("0", digsim.gridSize / 6, digsim.gridSize * 0.75);
    context.fillText("1", digsim.gridSize / 6, digsim.gridSize * 1.75);
    context.fillText("2", digsim.gridSize / 6, digsim.gridSize * 2.75);
    context.fillText("3", digsim.gridSize / 6, digsim.gridSize * 3.75);
    context.fillText("4", digsim.gridSize / 6, digsim.gridSize * 4.75);
    context.fillText("5", digsim.gridSize / 6, digsim.gridSize * 5.75);
    context.fillText("CS", digsim.gridSize / 6, digsim.gridSize * 7.75);

    // Outputs
    context.fillText("00", digsim.gridSize * 3.275, digsim.gridSize * 0.75);
    context.fillText("01", digsim.gridSize * 3.275, digsim.gridSize * 1.75);
    context.fillText("02", digsim.gridSize * 3.275, digsim.gridSize * 2.75);
    context.fillText("03", digsim.gridSize * 3.275, digsim.gridSize * 3.75);
    context.fillText("04", digsim.gridSize * 3.275, digsim.gridSize * 4.75);
    context.fillText("05", digsim.gridSize * 3.275, digsim.gridSize * 5.75);
    context.fillText("06", digsim.gridSize * 3.275, digsim.gridSize * 6.75);
    context.fillText("07", digsim.gridSize * 3.275, digsim.gridSize * 7.75);

    context.stroke();
    context.fill();

    // Draw Component Select circle
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(-digsim.gridSize / 6, digsim.gridSize * 7.5,  // center
                digsim.gridSize / 6, 0,
                2 * Math.PI);
    context.fill();
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};

/*****************************************************************************
 * COMPUTE LOGIC
 *  Set state based on input address and programmed hex number.
 ****************************************************************************/
PROM.prototype.computeLogic = function() {
    // Don't process state if the component select is off
    var componentSelect = this.inputs.getConnectionComponents(6)[0];
    if (typeof componentSelect !== 'undefined' && !componentSelect.state) {
        this.state = [0, 0, 0, 0, 0, 0, 0, 0];
        return;
    }

    // Compute address
    var address = "";
    var i, comp, s, state;
    for (i = this.numInputs - 2; i >= 0; i--) {  // Ignore CS input
        comp = this.inputs.getConnectionComponents(i)[0];
        s = (typeof comp !== 'undefined' && comp.state >= 0 ? comp.state : 0);
        address += s + "";
    }
    address = parseInt(address, 2);

    // Convert the decimal to a binary
    state = digsim.pad(digsim.dec2bin(this.addresses[address]), this.numOutputs);

    // Compute state
    var counter = this.state.length - 1;
    for (i = counter; i >= 0; i--) {
        this.state[i] = state[counter - i];
    }
};
/*****************************************************************************
 * Program:
 *  switch.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ****************************************************************************/

/*****************************************************************************
 * SWITCH
 * @constructor
 * @extends Component
 ****************************************************************************/
function Switch() {
    this.type        = digsim.SWITCH;
    this.name        = 'Switch';

    this.numInputs   = 0;
    this.numOutputs  = 1;
    this.dimension   = {'row': 1, 'col': 1};  // Height and width of component
    this.extraSpace  = 1;
}
Switch.prototype = new Component();

/******************************************************************************
 * IS A DRIVER
 *  Return true if the component is a driver.
 * @return {boolean}
 *****************************************************************************/
Switch.prototype.isADriver = function() {
    return true;
};

/*****************************************************************************
 * DRAW
 *  Draw the Switch to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
Switch.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.fillStyle   = '#FFFFFF';
    context.strokeStyle = lineColor || 'black';
    context.lineWidth   = 2;

    // Rotation
    var center = {'row': (this.dimension.row / 2) * digsim.gridSize,
        'col': (this.dimension.col / 2) * digsim.gridSize };
    context.translate(center.col, center.row);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(-center.col, -center.row);

    context.moveTo(0, 0);

    // Draw 1
    context.moveTo(digsim.gridSize / 4, -digsim.gridSize / 4);
    context.lineTo(digsim.gridSize / 4, digsim.gridSize / 4);
    context.moveTo(digsim.gridSize / 4, 0);
    context.lineTo(digsim.gridSize * 3 / 4, 0);

    // Draw connection to 1 or 0
    if (this.state && digsim.mode === digsim.SIM_MODE) {
        context.lineTo(digsim.gridSize / 4 * 5, digsim.gridSize / 2);
        context.moveTo(digsim.gridSize * 3 / 4 , digsim.gridSize);

    }
    else {
        context.moveTo(digsim.gridSize / 4 * 5, digsim.gridSize / 2);
        context.lineTo(digsim.gridSize * 3 / 4, digsim.gridSize);
    }
    context.lineTo(digsim.gridSize / 2, digsim.gridSize);
    context.stroke();

    // Draw 0
    context.beginPath();
    context.arc(digsim.gridSize / 3, digsim.gridSize, digsim.gridSize / 5, 0, 2 * Math.PI);
    context.stroke();
    context.fill();

    // Connection
    context.beginPath();
    context.moveTo(digsim.gridSize / 4 * 5, digsim.gridSize / 2);
    context.lineTo(digsim.gridSize * 1.5, digsim.gridSize / 2);
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};
/*****************************************************************************
 * Program:
 *  wire.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  Wires only go in only one direction. Changing directions will create a new Wire.
 ****************************************************************************/

/*****************************************************************************
 * WIRE
 * @constructor
 * @extends Component
 ****************************************************************************/
function Wire() {
    this.type             = digsim.WIRE;
    this.name             = 'Wire';

    this.path             = {'x': 0, 'y': 0};
    this.dimension        = {'row': 0, 'col': 0};  // Height and width of component

    // Direction is determined by getting the sign of the end of the wire subtracted by the start of the wire
    this.dy               = 0;   // Direction of the wire in the y direction (1,0)
    this.dx               = 0;   // Direction of the wire in the x direction (1,0)
}
Wire.prototype = new Component();

/******************************************************************************
 * GET COMPONENT SPACE
 *  Return every {row, col, con, index, name} that the component fills. Helpful for setting
 *  and deleting placeholders.
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Wire.prototype.getComponentSpace = function() {
    var space = [];

    // Wires row and col are always in the middle of a grid space
    var row = Math.floor(this.row);
    var col = Math.floor(this.col);

    var endRow = this.path.y + this.row;
    var endCol = this.path.x + this.col;
    var i;

    // Wire going horizontally
    if (this.dx) {
        for (i = this.col; i !== endCol; i += 0.5) {
            col = Math.floor(i);

            space.push({
                'row'  : row,
                'col'  : col,
                'con'  : true,
                'index': (i % 1 ? 1 : 3)
            });
         }
    }
    // Wire going vertically
    else {
        for (i = this.row; i !== endRow; i += 0.5) {
            row = Math.floor(i);

            space.push({
                'row'  : row,
                'col'  : col,
                'con'  : true,
                'index': (i % 1 ? 2 : 0)
            });
        }
    }

    return space;
};

/******************************************************************************
 * GET COMPONENT INPUT SPACE
 *  Return every {row, col, con, index} that the component input fills. For a
 *  Wire, the input space is the beginning of the Wire.
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Wire.prototype.getComponentInputSpace = function() {
    var space = [];

    // Wires row and col are always in the middle of a grid space
    var row = Math.floor(this.row);
    var col = Math.floor(this.col);

    var index;
    if (this.dx === 1)
        index = 1;
    else
        index = 2;

    space.push({
        'row'      : row,
        'col'      : col,
        'con'      : true,
        'index'    : index,
        'conIndex' : 'input'
    });

    return space;
};

/******************************************************************************
 * GET COMPONENT OUTPUT SPACE
 *  Return every {row, col, con, index} that the component output fills. For a
 *  Wire, the output space is the end of the Wire.
 * @return {Array} array of objects of {row, col, con, index}.
 *****************************************************************************/
Wire.prototype.getComponentOutputSpace = function() {
    var space = [];

    // Wires row and col are always in the middle of a grid space
    var row = Math.floor(this.path.y + this.row);
    var col = Math.floor(this.path.x + this.col);

    var index;
    if (this.dx === 1)
        index = 3;
    else
        index = 0;

    space.push({
        'row'      : row,
        'col'      : col,
        'con'      : true,
        'index'    : index,
        'conIndex' : 'output'
    });

    return space;
};

/*****************************************************************************
 * CHECK CONNECTION
 *  Checks adjacent spaces for other component to connect to.
 ****************************************************************************/
Wire.prototype.checkConnections = function() {
    // Check for wire merging and splitting
    var i, j, space, comp, grid, index;
    var spaces = this.getComponentInputSpace();
    spaces = spaces.concat(this.getComponentOutputSpace());

    // Loop through both input and output spaces
    for (j = 0; j < spaces.length; j++) {
        space = spaces[j];

        // Loop through all 4 indices of the space
        for (i = 0; i < 4; i++) {
            grid = digsim.placeholders[space.row][space.col] || {};
            comp = (typeof grid[i] !== 'undefined' ? digsim.components.getComponent(grid[i].ref) : 0);
            index = space.index;

            // Merge wires only if they both go in the same direction and there are no other wires in the same grid space
            if (i != index && comp && comp.type === digsim.WIRE && this.dx === comp.dx && this.dy === comp.dy &&
                typeof grid[(index+1)%4] === 'undefined' && typeof grid[ (index-1) < 0 ? 3 : (index-1) ] === 'undefined') {
                 this.mergeWires(comp);

                // This wire no longer exists so exit the function
                return;
            }

            // Split wires only if it ends or starts in the middle of another wire
            if (i != index && comp && comp.type === digsim.WIRE && grid[(i+2)%4] && comp.id === grid[(i+2)%4].ref) {
                comp.splitWire(space.row, space.col);
            }
        }
    }

    // Call parent implementation
    Component.prototype.checkConnections.call(this);
};

/*****************************************************************************
 * DELETE CONNECTIONS
 *  Remove all connections of the component.
 ****************************************************************************/
Wire.prototype.deleteConnections = function() {
    this.connections.clear();
    Component.prototype.deleteConnections.call(this);
};

/*****************************************************************************
 * MERGE WIRES
 *  Merges two separate wires into one wire.
 * @param {Wire} wire - Wire to merge with.
 ****************************************************************************/
Wire.prototype.mergeWires = function(wire) {
    // Get the four points of both wires
    var point1, point2, point3, point4, endpoint;
    point1 = {'x': this.col, 'y': this.row};
    point2 = {'x': wire.col, 'y': wire.row};
    point3 = {'x': this.col + this.path.x, 'y': this.row + this.path.y};
    point4 = {'x': wire.col + wire.path.x, 'y': wire.row + wire.path.y};

    // Update wire coordinates
    this.row = Math.min(point1.y, point2.y);
    this.col = Math.min(point1.x, point2.x);
    endpoint = {'x': Math.max(point3.x, point4.x), 'y': Math.max(point3.y, point4.y)};
    this.path = {'x': Math.abs(endpoint.x - this.col), 'y': Math.abs(endpoint.y - this.row)};

    // Update wire connections
    digsim.deletePlaceholder(this);
    wire.deleteConnections();
    this.deleteConnections();
    digsim.setPlaceholders(this, true);
    this.checkConnections();

    // Remove new wire
    digsim.components.remove(wire, false);
};

/*****************************************************************************
 * SPLIT WIRES
 *  Splits the wire into two separate wires at the coordinate.
 * @param {number} row - Row to split the wire.
 * @param {number} col - Col to split the wire.
 ****************************************************************************/
Wire.prototype.splitWire = function(row, col) {
    var newPath = {'x': Math.floor(this.col + this.path.x - col), 'y': Math.floor(this.row + this.path.y - row)};

    // Update wire
    digsim.deletePlaceholder(this);
    this.deleteConnections();
    this.path = {'x': Math.floor(col - this.col + 0.5), 'y': Math.floor(row - this.row + 0.5)};
    digsim.setPlaceholders(this, true);

    // Create new wire
    var wire = new Wire();
    wire.init(row + 0.5, col + 0.5, 0, digsim.iComp);
    wire.dx = this.dx;
    wire.dy = this.dy;
    wire.path = newPath;

    digsim.components.add(wire);
    digsim.iComp++;
    digsim.setPlaceholders(wire, true);

    // Check connections
    this.checkConnections();
    wire.checkConnections();
};

/******************************************************************************
 * DRAW CONNECTION DOTS
 *  Draws connection dots
 * @param {CanvasRenderingContext2D} context    - Context to draw to.
 *****************************************************************************/
Wire.prototype.drawConnectionDots = function(context) {
    context.beginPath();
    context.strokeStyle = '#000000';
    context.fillStyle   = '#000000';

    var inputs  = this.connections.getConnectionComponents('input');
    var outputs = this.connections.getConnectionComponents('output');
    var draw    = false;
    var i;

    for (i = 0; i < inputs.length; i++) {
        if (inputs[i].type !== digsim.WIRE) {
            draw = true;
            break;
        }
    }

    if (draw || inputs.length >= 2) {
        space = this.getComponentInputSpace()[0];

        x = (space.col - this.col + 0.5) * digsim.gridSize;
        y = (space.row - this.row + 0.5) * digsim.gridSize;
        context.moveTo(x, y);
        context.arc(x, y, digsim.gridSize / 10, 0, 2 * Math.PI);
    }

    draw = false;
    for (i = 0; i < outputs.length; i++) {
        if (outputs[i].type !== digsim.WIRE) {
            draw = true;
            break;
        }
    }

    if (draw || outputs.length >= 2) {
        space = this.getComponentOutputSpace()[0];

        x = (space.col - this.col + 0.5) * digsim.gridSize;
        y = (space.row - this.row + 0.5) * digsim.gridSize;
        context.moveTo(x, y);
        context.arc(x, y, digsim.gridSize / 10, 0, 2 * Math.PI);
    }

    context.fill();
    context.stroke();

    context.restore();
};

/*****************************************************************************
 * DRAW
 *  Draw the Wire to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
Wire.prototype.draw = function(context, lineColor) {
    context.save();
    context.translate(this.col * digsim.gridSize, this.row * digsim.gridSize);

    context.beginPath();
    context.strokeStyle = lineColor || 'black';
    context.fillStyle   = '#000000';
    context.lineWidth   = 2;
    context.lineCap     = 'round';

    // Color the wire based on state if simulating
    if (digsim.mode === digsim.SIM_MODE) {
        if (this.state === 1) {
            context.strokeStyle = '#FF0000';
        }
        else {
            context.strokeStyle = '#0000FF';
        }
    }

    context.moveTo(0, 0);
    context.lineTo(this.path.x * digsim.gridSize, this.path.y * digsim.gridSize);
    context.stroke();

    this.drawConnectionDots(context);

    context.restore();
};
/*******************************************************************************
 * Program:
 *  xor-gate.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 ******************************************************************************/

/*****************************************************************************
 * XOR
 * @constructor
 * @extends Component
 * @param {number} numInputs - Number of input connections.
 ****************************************************************************/
function XOR(numInputs) {
    this.type        = digsim.XOR;
    this.name        = 'XOR';

    this.numInputs   = numInputs || 2;
    this.numOutputs  = 1;
    var size         = (2 * (Math.floor(this.numInputs / 2))) + 1;
    this.dimension   = {'row': size, 'col': (size + 1)};  // Height and width of component
}
XOR.prototype = new Component();

/*****************************************************************************
 * CHANGE NUM INPUTS
 *  Changes the number of inputs and the size of the Component.
 * @param {number} numInputs - Number of inputs to change to.
 ****************************************************************************/
XOR.prototype.changeNumInputs = function(numInputs) {
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
XOR.prototype.isAGate = function() {
    return true;
};

/*****************************************************************************
 * DRAW
 *  Draw the XOR gate to the context.
 * @param {CanvasRenderingContext2D} context   - Context to draw to.
 * @param {string}                   lineColor - Color of the gate.
 ****************************************************************************/
XOR.prototype.draw = function(context, lineColor) {
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

    this.drawWires(context, lineColor, 2);

    // Draw gate
    var factor = Math.floor(this.numInputs / 2);
    var gsf = digsim.gridSize * factor;

    context.moveTo(0, 0);
    context.lineTo(gsf,  0);

    var t = 0.28;               // SET THIS TO CHANGE CURVATURE
    var baseCurveature = 1.15;  // SET THIS TO CHANGE BASE CURVATURE
    var height = 2 * factor + 1;
    var x0 = gsf;
    var y0 = 0;
    var y1 = height * digsim.gridSize / 2;
    var x1 = y1 * 2 + digsim.gridSize;
    var xc = (x0 + x1) / 2;
    var yc = (y0 + y1) / 2;
    var x = (y1 - y0) * t + xc;
    var y = (x0 - x1) * t + yc;

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
    context.lineWidth = 1;
    context.quadraticCurveTo(digsim.gridSize * baseCurveature, y1 / 2, 0, 0);
    context.stroke();
    context.fill();

    // Base quadratic curve
    context.beginPath();
    context.moveTo(digsim.gridSize / -4, y1);
    context.quadraticCurveTo(digsim.gridSize * baseCurveature - digsim.gridSize / 4, y1 / 2, digsim.gridSize / -4, 0);
    context.stroke();

    this.drawLabel(context, lineColor);
    this.drawConnectionDots(context);

    context.restore();
};

/*******************************************************************************
 * COMPUTE LOGIC
 *  XORs all the input wires together to set the current state of the gate.
 ******************************************************************************/
XOR.prototype.computeLogic = function() {
    var ins = this.inputs.get();

    var cnt = 0;
    for (var i = 0, len = ins.length; i < len; ++i) {
        cnt += ins[i].state;
    }
    this.state = cnt % 2;
};
/*****************************************************************************
 * Program:
 *  application.js
 *
 * Authors:
 *  Steven Lambert
 *  Zack Sheffield
 *
 * Summary:
 *  A fully functional digital circuit simulation program.
 ****************************************************************************/

/*****************************************************************************
 * DIGSIM
 *  Holds all the constants, animation, and data variables for the program
 * @constructor
 ****************************************************************************/
function Digsim() {
    // Constants
    this.GRID_ZOOM         = 5;                     // Added or subtracted to gridSize when zooming
    this.MAX_GRID_SIZE     = 40;                    // Max zoom level
    this.MIN_GRID_SIZE     = 10;                    // Min zoom level
    this.NUM_COLS          = 200;                   // Number of columns in the application
    this.NUM_ROWS          = 200;                   // Number of rows in the application

    // Type identifiers
    this.AND               = 1;
    this.NAND              = 2;
    this.OR                = 3;
    this.NOR               = 4;
    this.XOR               = 5;
    this.NOT               = 6;
    this.DFF               = 7;
    this.JKFF              = 8;
    this.MUX               = 9;
    this.PROM              = 10;
    this.CLOCK             = 11;
    this.WIRE              = 12;
    this.SWITCH            = 13;
    this.LED               = 14;
    this.ASCIIDISPLAY      = 15;

    this.DEFAULT_MODE      = 0;                     // Default application mode
    this.WIRE_MODE         = 1;                     // Placing wires
    this.SIM_MODE          = 2;                     // Simulation
    this.PLACE_MODE        = 3;                     // Placing Components
    this.EDIT_MODE         = 4;                     // Editing Component properties

    this.WARNING           = 0;                     // Orange(ish) warning messages - simulation will still run
    this.ERROR             = 1;                     // Red error messages - will not simulate

    this.TL                = 0;                     // Top, bottom, left, right selection of wires in grids
    this.TR                = 1;
    this.BR                = 2;
    this.BL                = 3;

    // Animation variables
    this.dragging          = false;                 // Know when a component is being dragged
    this.clkCnt            = 0;                     // Will count to digsim.CLK_FREQ before it resets and changes states
    this.rotation          = 0;                     // Rotation of the currently selected Component (in degrees)

    // Grid variables
    this.gridSize          = 20;                    // The size (in pixels) of a grid square
    this.gridWidth         = window.innerWidth - $('.canvases').position().left;
    this.gridHeight        = window.innerHeight - $('.canvases').position().top;
    this.mousePos          = { x: -1, y: -1 };      // Current position of the mouse on the Canvas
    this.dragStart         = {'row': 0, 'col': 0};  // Keep track of the row/col of a click to know when we should drag
    this.dragOffset        = {'row': 0, 'col': 0};  // Keep track of how far from the top-left corner the a click is for dragging
    this.wireStart         = {'row': 0, 'col': 0};  // Keep track of where a wire starts for wire placement
    this.gridToggle        = 0;                     // Toggles the grid (tri-state)
    this.hitRadius         = 0.733;                 // The size (as a percent) around a wire that will respond to a click

    // Gate identifier
    this.iComp             = 0;                     // Gives each component a unique identifier
    this.numGateInputs     = 2;                     // Number of inputs - attached to the user interface selection

    // Misc
    this.clipboard         = undefined;             // Used for cut/copy/paste
    this.selectedComponent = undefined;             // The currently selected Component
    this.mode              = 0;                     // The current mode
    this.connectionStarts  = {};                    // Absolute row/col of a connection for wire routing
    this.connectionTargets = {};                    // Relative row/col of the Component for wire routing
    this.maxSchematicLoop  = 0;                     // Prevent infinite loops (such as NOT gate looped back on itself)
    this.passCounter       = 0;                     // Counter used to prevent infinite loops
    this.endRoute          = false;                 // Know when to stop wire routing
    this.mouseDown         = false;                 // Know if the mouse is currently held down for dragging

    // Data arrays
    this.components        = new ComponentList();   // Holds all placed Components
    this.drivers           = [];                    // Holds the id of the logic drivers
    this.placeholders      = [];                    // Holds Component positions on grid
    for (var i = 0; i < this.NUM_COLS; ++i) {
        this.placeholders[i] = [];                  // Set placeholder to a 2D array
    }

    // Key codes and hot keys
    this.KEY_CODES          = {                     // Key code to button HTML ID dictionary.
        27    : 'esc',                              // 's' and 'c' refer to a 'shift' and 'ctrl' respectively.
        's65' : 'NAND',
        's82' : 'NOR',
        65    : 'AND',
        69    : 'LED',
        84    : 'NOT',
        82    : 'OR',
        83    : 'Switch',
        85    : 'Run',
        87    : 'Wire',
        88    : 'XOR',
        71    : 'Toggle_Grid',
        90    : 'Zoom_In',
        's90' : 'Zoom_Out',
        46    : 'Delete',
        8     : 'Delete',
        'c88' : 'Cut',
        'c67' : 'Copy',
        'c86' : 'Paste',
        50    : '2-input',
        51    : '3-input',
        52    : '4-input',
        67    : 'Clock',
        9     : 'Rotate_CW',
        's9'  : 'Rotate_CCW',
        68    : 'DFF',
        77    : 'MUX'

    };
    this.HOT_KEYS           = {                     // The hot key text to show for each button (by button HTML ID)
        'AND'         : 'A',
        'OR'          : 'R',
        'NOT'         : 'T',
        'NAND'        : 'shift+A',
        'NOR'         : 'shift+R',
        'XOR'         : 'X',
        'Switch'      : 'S',
        'LED'         : 'E',
        'Wire'        : 'W',
        'Run'         : 'U',
        'Toggle_Grid' : 'G',
        'Zoom_In'     : 'Z',
        'Zoom_Out'    : 'shift+Z',
        'Delete'      : 'del',
        'Cut'         : 'ctrl+X',
        'Copy'        : 'ctrl+C',
        'Paste'       : 'ctrl+V',
        '2-input'     : '2',
        '3-input'     : '3',
        '4-input'     : '4',
        'Clock'       : 'C',
        'Rotate_CW'   : 'Tab',
        'Rotate_CCW'  : 'shift+Tab',
        'DFF'         : 'D',
        'MUX'         : 'M'
    };
}

/*****************************************************************************
 * INIT
 *  Tests to see if the canvas is supported, returning true if it is.
 ****************************************************************************/
Digsim.prototype.init = function() {
    // Get the canvas element
    this.gridCanvas              = document.getElementById('grid');
    this.staticCanvas            = document.getElementById('static');
    this.movingCanvas            = document.getElementById('moving');

    // Test to see if canvas is supported
    if (this.gridCanvas.getContext) {

        // Canvas variables
        var canvasWidth          = this.gridSize * this.NUM_COLS;
        var canvasHeight         = this.gridSize * this.NUM_ROWS;

        this.gridContext         = this.gridCanvas.getContext('2d');
        this.staticContext       = this.staticCanvas.getContext('2d');
        this.movingContext       = this.movingCanvas.getContext('2d');

        this.gridCanvas.width    = canvasWidth;
        this.gridCanvas.height   = canvasHeight;
        this.staticCanvas.width  = canvasWidth;
        this.staticCanvas.height = canvasHeight;
        this.movingCanvas.width  = canvasWidth;
        this.movingCanvas.height = canvasHeight;

        $('.canvases').width(this.gridWidth-2);
        $('.canvases').height(this.gridHeight-2);

        return true;
    }

    return false;
};

/*****************************************************************************
 * RUN
 *  Runs the application on window.onload.
 ****************************************************************************/
Digsim.prototype.run = function() {
    if(this.init()) {
        // Assign functions to events
        $("canvas"       ).on( "mousedown",              this.onMouseDown);
        $("canvas"       ).on( "mouseup",                this.onMouseUp);
        $("canvas"       ).on( "click",                  this.onClick);
        $("canvas"       ).on( "dblclick",               this.onDoubleClick);
        $("canvas"       ).on( "mousemove",              this.onMouseMove);
        $("canvas"       ).on( "mouseout",               function() { digsim.mouseDown = false; });
        $("canvas"       ).on( "touchstart",             this.onMouseDown);
        $("canvas"       ).on( "touchmove",              this.onMouseMove);
        $("canvas"       ).on( "touchend",               this.onMouseUp);
        $("#New"         ).on( "click",                  this.newFile);
        $('#Save'        ).on( "click",                  this.saveFile);
        $('#uploadFile'  ).on( "change",                 this.submitFile);
        $('#fileContents').on( "load",                   this.readFileContents);
        $("#Toggle_Grid" ).on( "click",                  this.toggleGrid);
        $("#Zoom_In"     ).on( "click", {dir:  1},       this.zoom);
        $("#Zoom_Out"    ).on( "click", {dir: -1},       this.zoom);
        $('#Delete'      ).on( "click",                  this.delete);
        $('#Rotate_CCW'  ).on( "click", {dir: 270},      this.rotate);
        $('#Rotate_CW'   ).on( "click", {dir: 90},       this.rotate);
        $('#Cut'         ).on( "click",                  this.cut);
        $('#Copy'        ).on( "click",                  this.copy);
        $('#Paste'       ).on( "click",                  this.paste);
        $(".gates > ul a, .io a, .modes a").on("click",  this.onButtonClicked);
        $('#2-input, #3-input, #4-input').on("click",    this.changeNumInputs);

        // Component menu events
        $('.component-menu').draggable();
        $('#component-save').on(  "click",               this.onSaveComponentEdit);
        $('#component-cancel').on("click",               this.hideComponentMenu);

        // Set hotkey info on buttons
        var curr, hotkey;
        $("li a").each(function() {
            curr = $(this);
            hotkey = digsim.HOT_KEYS[curr.attr('id')];
            if (hotkey) {
                curr.attr('title', curr.attr('title') + " (" + hotkey + ")");
            }
        });

        // Disable buttons on start
        this.disableButton("Empty");
        this.disableControlButtons();

        this.drawGrid(this.gridContext);
        $('.messages').css('height', this.gridHeight - 37);
    }
};

/*****************************************************************************
 * CLEAR CANVAS
 *  Clears the given canvas.
 * @param {CanvasRenderingContext2D} context    - Context to clear.
 * @param {boolean}                  clearDirty - Clear only the parts that have changed.
 ****************************************************************************/
Digsim.prototype.clearCanvas = function(context, clearDirty) {
    context.save();

    // Use the identity matrix while clearing the canvas
    context.setTransform(1, 0, 0, 1, 0, 0);

    // Use a dirty rectangle to clear the canvas
    if (clearDirty) {
        var mousePos = digsim.getMousePos();
        var max = Math.max(this.gridWidth, this.gridHeight);
        var half = max / 2 | 0;

        context.clearRect(mousePos.x - half, mousePos.y - half, max, max);
    }
    // Clear the entire canvas
    else {
        context.clearRect(0, 0, context.canvas.width, context.canvas.width);
    }

    context.restore();
};

/*****************************************************************************
 * DRAW GRID
 *  Draws the underlying blue grid on the gridContext.
 ****************************************************************************/
Digsim.prototype.drawGrid = function() {
    // clear the canvas
    var context = this.gridContext;
    this.clearCanvas(context);

    var row, col;

    // Grid grid
    if (this.gridToggle % 3 === 0) {
        context.strokeStyle = '#8DCFF4';
        context.lineWidth = 1;
        context.save();
        context.translate(0.5, 0.5);
        context.beginPath();

        // Draw the columns
        for (col = 1; col < this.NUM_COLS; col++) {
            context.moveTo(col * this.gridSize, 0);
            context.lineTo(col * this.gridSize, this.NUM_COLS * this.gridSize);
        }
        // Draw the rows
        for (row = 1; row < this.NUM_ROWS; row++) {
            context.moveTo(0, row * this.gridSize);
            context.lineTo(this.NUM_ROWS * this.gridSize, row * this.gridSize);
        }
        context.stroke();
        context.restore();
    }

    // Dotted Grid
    else if (this.gridToggle % 3 === 1) {
        context.fillStyle = '#0d91db';
        context.lineWidth = 1;
        context.save();
        context.translate(digsim.gridSize / 2 - 0.5,digsim.gridSize / 2 - 0.5);
        context.beginPath();

        for (col = 0; col < this.NUM_COLS; ++col) {
            for (row = 0; row < this.NUM_ROWS; ++row) {
                context.fillRect(col * digsim.gridSize, row * digsim.gridSize, 1.5, 1.5);
            }
        }
        context.stroke();
        context.restore();
    }
};

/**************************************************************************************************************
 *      /$$$$$$                                                                              /$$
 *     /$$__  $$                                                                            | $$
 *    | $$  \__/  /$$$$$$  /$$$$$$/$$$$   /$$$$$$   /$$$$$$  /$$$$$$$   /$$$$$$  /$$$$$$$  /$$$$$$    /$$$$$$$
 *    | $$       /$$__  $$| $$_  $$_  $$ /$$__  $$ /$$__  $$| $$__  $$ /$$__  $$| $$__  $$|_  $$_/   /$$_____/
 *    | $$      | $$  \ $$| $$ \ $$ \ $$| $$  \ $$| $$  \ $$| $$  \ $$| $$$$$$$$| $$  \ $$  | $$    |  $$$$$$
 *    | $$    $$| $$  | $$| $$ | $$ | $$| $$  | $$| $$  | $$| $$  | $$| $$_____/| $$  | $$  | $$ /$$ \____  $$
 *    |  $$$$$$/|  $$$$$$/| $$ | $$ | $$| $$$$$$$/|  $$$$$$/| $$  | $$|  $$$$$$$| $$  | $$  |  $$$$/ /$$$$$$$/
 *     \______/  \______/ |__/ |__/ |__/| $$____/  \______/ |__/  |__/ \_______/|__/  |__/   \___/  |_______/
 *                                      | $$
 *                                      | $$
 *                                      |__/
 *                               /$$
 *                              | $$
 *      /$$$$$$  /$$$$$$$   /$$$$$$$
 *     |____  $$| $$__  $$ /$$__  $$
 *      /$$$$$$$| $$  \ $$| $$  | $$
 *     /$$__  $$| $$  | $$| $$  | $$
 *    |  $$$$$$$| $$  | $$|  $$$$$$$
 *     \_______/|__/  |__/ \_______/
 *
 *
 *
 *     /$$$$$$$  /$$                               /$$                 /$$       /$$
 *    | $$__  $$| $$                              | $$                | $$      | $$
 *    | $$  \ $$| $$  /$$$$$$   /$$$$$$$  /$$$$$$ | $$$$$$$   /$$$$$$ | $$  /$$$$$$$  /$$$$$$   /$$$$$$   /$$$$$$$
 *    | $$$$$$$/| $$ |____  $$ /$$_____/ /$$__  $$| $$__  $$ /$$__  $$| $$ /$$__  $$ /$$__  $$ /$$__  $$ /$$_____/
 *    | $$____/ | $$  /$$$$$$$| $$      | $$$$$$$$| $$  \ $$| $$  \ $$| $$| $$  | $$| $$$$$$$$| $$  \__/|  $$$$$$
 *    | $$      | $$ /$$__  $$| $$      | $$_____/| $$  | $$| $$  | $$| $$| $$  | $$| $$_____/| $$       \____  $$
 *    | $$      | $$|  $$$$$$$|  $$$$$$$|  $$$$$$$| $$  | $$|  $$$$$$/| $$|  $$$$$$$|  $$$$$$$| $$       /$$$$$$$/
 *    |__/      |__/ \_______/ \_______/ \_______/|__/  |__/ \______/ |__/ \_______/ \_______/|__/      |_______/
 *
 *
 *
 *****************************************************************************************************************/

/*****************************************************************************
 * DRAW ALL COMPONENTS
 *  Draw all the components on the static canvas.
 ****************************************************************************/
Digsim.prototype.drawAllComponents = function() {
    this.clearCanvas(this.staticContext);

    var comps = this.components.get();
    for (var i = 0, len = comps.length; i < len; i++) {
        var component = comps[i];

        if (component.drawStatic)
            component.draw(this.staticContext);
    }

};

/*****************************************************************************
 * DRAW COMPONENT
 *  Draw a component to a context.
 * @param {Component}                comp    - Component to draw.
 * @param {CanvasRenderingContext2D} context - Context to draw on.
 * @param {string}                   color   - Color to use to draw the object @default 'black'.
 ****************************************************************************/
Digsim.prototype.drawComponent = function(comp, context, color) {
    if (!context)
        throw new Error("Must call function 'drawComponent' with a context.");

    comp.draw(context, color);
};

/*****************************************************************************
 * GET COMPONENT
 *  Return the Component at the mouse position.
 * @return {Component}
 ****************************************************************************/
Digsim.prototype.getComponent = function() {
    var ph = digsim.placeholders[digsim.getMouseRow()][digsim.getMouseCol()];
    var index, comp;

    // Get the Component
    if (ph instanceof Array) { // NOTE:: This will be true on objects
        index = digsim.getWireIndex();
        if (index != -1 && ph[index])
            comp = digsim.components.getComponent(ph[index].ref);
    }
    else if (ph) {
        comp = digsim.components.getComponent(ph.ref);
    }

    return comp;
};

/*****************************************************************************
 * DELETE COMPONENT
 *  Remove a component from the components array, delete it from all of its
 *  connections, then delete its placeholders.
 * @param {Component} comp - Component to delete.
 ****************************************************************************/
Digsim.prototype.deleteComponent = function(comp) {
    // If it's a driver, remove it from the drivers array
    if (comp.type === this.SWITCH || comp.type === this.CLOCK) {
        this.drivers.splice(this.drivers.indexOf(comp.id), 1);
    }
    this.disableControlButtons();
    this.components.remove(comp, false);
    comp.deleteConnections();
    this.deletePlaceholder(comp);
};

/*****************************************************************************
 * SET PLACEHOLDERS
 *  Add component to the placeholders array with a unique identifier.
 * @param {Component} comp    - Component to create placeholders.
 * @param {boolean}   nocheck - Set to true to skip collision detection.
 * @return {boolean} True if all placeholders were successfully placed.
 ****************************************************************************/
Digsim.prototype.setPlaceholders = function(comp, nocheck) {
    var space = comp.getComponentSpace();
    var i, ph;

    // Check the component space for collision
    if (!nocheck) {
        for (i = 0; i < space.length; i++) {
            if (typeof space[i].index !== 'undefined') {
                // If grid space is not an array and already contains a placeholder
                if (!(this.placeholders[space[i].row][space[i].col] instanceof Array) &&
                    this.placeholders[space[i].row][space[i].col]) {
                    digsim.addMessage(digsim.WARNING, "[1]Collision detected! Unable to place component.");
                    return false;
                }
                // If grid space is an array and already contains a placeholder
                else if ((this.placeholders[space[i].row][space[i].col] instanceof Array) &&
                        this.placeholders[space[i].row][space[i].col][space[i].index]) {
                    digsim.addMessage(digsim.WARNING, "[2]Collision detected! Unable to place component.");
                    return false;
                }
            }
            else {
                // If gird space already contains a placeholder
                if (this.placeholders[space[i].row][space[i].col]) {
                    digsim.addMessage(digsim.WARNING, "[3]Collision detected! Unable to place component. ");
                    return false;
                }
            }
        }
    }

    // Set the placeholders
    for (i = 0; i < space.length; i++) {
        /*****************************************************************************
         * Placeholder
         * @param {number}  ref         - Unique id of the component whose placeholder this is.
         * @param {boolean} connectable - If the placeholder can be used for determining connections.
         * @param {number}  name        - Name of the connection (DFF)
         ****************************************************************************/
        ph = {
            'ref'         : comp.id,
            'connectable' : space[i].con,
            'name'        : space[i].name
        };

        if (typeof space[i].index !== 'undefined') {
            // If it's not a 3D array, make it a 3D array
            if (!(this.placeholders[space[i].row][space[i].col] instanceof Array)) {
                this.placeholders[space[i].row][space[i].col] = [];
            }
            this.placeholders[space[i].row][space[i].col][space[i].index] = ph;
        }
        else {
            this.placeholders[space[i].row][space[i].col] = ph;
        }

    }

    return true;
};

/*****************************************************************************
 * DELETE PLACEHOLDER
 *  Delete component placeholders
 * @param {Component} comp - Component whose placeholders to delete.
 ****************************************************************************/
Digsim.prototype.deletePlaceholder = function(comp) {

    var spaces = comp.getComponentSpace();
    var space;

    for (var i = 0; i < spaces.length; i++) {
        space = spaces[i];

        // Delete an array index
        if (typeof space.index !== 'undefined') {
            delete this.placeholders[space.row][space.col][space.index];

            // Delete empty placeholder arrays
            if (Object.keys(this.placeholders[space.row][space.col] || {}).length === 0)
                delete this.placeholders[space.row][space.col];
        }
        else {
            delete this.placeholders[space.row][space.col];
        }
    }

    // Visually remove the component from static canvas.
    this.drawAllComponents();
};


/**************************************************************************************************************
 *     /$$$$$$$                      /$$
 *    | $$__  $$                    |__/
 *    | $$  \ $$  /$$$$$$   /$$$$$$$ /$$ /$$$$$$$$  /$$$$$$
 *    | $$$$$$$/ /$$__  $$ /$$_____/| $$|____ /$$/ /$$__  $$
 *    | $$__  $$| $$$$$$$$|  $$$$$$ | $$   /$$$$/ | $$$$$$$$
 *    | $$  \ $$| $$_____/ \____  $$| $$  /$$__/  | $$_____/
 *    | $$  | $$|  $$$$$$$ /$$$$$$$/| $$ /$$$$$$$$|  $$$$$$$
 *    |__/  |__/ \_______/|_______/ |__/|________/ \_______/
 *
 *
 *
 *     /$$$$$$$$                                  /$$
 *    | $$_____/                                 | $$
 *    | $$       /$$    /$$  /$$$$$$  /$$$$$$$  /$$$$$$
 *    | $$$$$   |  $$  /$$/ /$$__  $$| $$__  $$|_  $$_/
 *    | $$__/    \  $$/$$/ | $$$$$$$$| $$  \ $$  | $$
 *    | $$        \  $$$/  | $$_____/| $$  | $$  | $$ /$$
 *    | $$$$$$$$   \  $/   |  $$$$$$$| $$  | $$  |  $$$$/
 *    |________/    \_/     \_______/|__/  |__/   \___/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * WINDOW RESIZE
 *  Change the width and height of the canvas to match the browser size.
 ****************************************************************************/
$(window).resize(function() {
    // Resize grid width and height
    digsim.gridWidth = window.innerWidth - $('.canvases').position().left;
    digsim.gridHeight = window.innerHeight - $('.canvases').position().top;

    digsim.drawGrid(digsim.gridContext);
    digsim.drawAllComponents();

    // Resize GUI elements
    $('.canvases').width(digsim.gridWidth-2).height(digsim.gridHeight-2);
    $('.messages').css('height', digsim.gridHeight - 37);
});

/**************************************************************************************************************
 *     /$$   /$$                     /$$                                           /$$
 *    | $$  /$$/                    | $$                                          | $$
 *    | $$ /$$/   /$$$$$$  /$$   /$$| $$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$$
 *    | $$$$$/   /$$__  $$| $$  | $$| $$__  $$ /$$__  $$ |____  $$ /$$__  $$ /$$__  $$
 *    | $$  $$  | $$$$$$$$| $$  | $$| $$  \ $$| $$  \ $$  /$$$$$$$| $$  \__/| $$  | $$
 *    | $$\  $$ | $$_____/| $$  | $$| $$  | $$| $$  | $$ /$$__  $$| $$      | $$  | $$
 *    | $$ \  $$|  $$$$$$$|  $$$$$$$| $$$$$$$/|  $$$$$$/|  $$$$$$$| $$      |  $$$$$$$
 *    |__/  \__/ \_______/ \____  $$|_______/  \______/  \_______/|__/       \_______/
 *                         /$$  | $$
 *                        |  $$$$$$/
 *                         \______/
 *     /$$$$$$$$                                  /$$
 *    | $$_____/                                 | $$
 *    | $$       /$$    /$$  /$$$$$$  /$$$$$$$  /$$$$$$
 *    | $$$$$   |  $$  /$$/ /$$__  $$| $$__  $$|_  $$_/
 *    | $$__/    \  $$/$$/ | $$$$$$$$| $$  \ $$  | $$
 *    | $$        \  $$$/  | $$_____/| $$  | $$  | $$ /$$
 *    | $$$$$$$$   \  $/   |  $$$$$$$| $$  | $$  |  $$$$/
 *    |________/    \_/     \_______/|__/  |__/   \___/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * KEY EVENTS
 *  Activate a button based on keyCode dictionary.
 * @param {Event} event - Key down event.
 ****************************************************************************/
document.onkeydown = function(event) {
    // Get which key was pressed.
    var keyCode = (event.keyCode ? event.keyCode : event.charCode); // Firefox and Opera use charCode instead of keyCode
    var id;

    // Don't enable hot keys if the edit menu is open
    if (digsim.mode !== digsim.EDIT_MODE) {

        // Prevent tabbing of buttons
        if (keyCode === 9) {
            event.preventDefault();
        }

        // Make the delete key on MAC delete a Component
        if (keyCode === 8) {
            keyCode = 46; // Switch the keyCode to the delete button
            event.preventDefault();
        }

        // Enter key opens the edit menu if a Component is selected
        if (keyCode === 13 && digsim.selectedComponent && digsim.selectedComponent.type !== digsim.WIRE) {
            digsim.showComponentMenu();
        }

        // Don't do anything when MAC user refreshes (shift+R is the hot key for NOR gate)
        if (!(keyCode === 82 && event.metaKey)) {

            // Add the 's' for shift key combinations
            if(event.shiftKey) {
                id = digsim.KEY_CODES['s'+keyCode];
            }
            // Add the 'c' for ctrl key combinations
            else if (event.ctrlKey) {
                id = digsim.KEY_CODES['c'+keyCode];
            }
            else {
                id = digsim.KEY_CODES[keyCode];
            }

            // Esc key
            if (id === 'esc') {
                digsim.deactivateButtons();
            }
            else if (id) {
                // Only click active buttons
                if(!$('#'+id).hasClass('disabled')) {
                    $("#" + id).click();
                }
            }
        }
    }
    else {
        // Esc key closes menu
        if (keyCode === 27) {
            digsim.hideComponentMenu();
        }
        // Enter key saves edit as long as there is focus on an input box
        if (keyCode === 13 && $('.component-menu input').is(":focus")) {
            digsim.onSaveComponentEdit();
        }
    }
};

/**************************************************************************************************************
 *     /$$      /$$
 *    | $$$    /$$$
 *    | $$$$  /$$$$  /$$$$$$  /$$   /$$  /$$$$$$$  /$$$$$$
 *    | $$ $$/$$ $$ /$$__  $$| $$  | $$ /$$_____/ /$$__  $$
 *    | $$  $$$| $$| $$  \ $$| $$  | $$|  $$$$$$ | $$$$$$$$
 *    | $$\  $ | $$| $$  | $$| $$  | $$ \____  $$| $$_____/
 *    | $$ \/  | $$|  $$$$$$/|  $$$$$$/ /$$$$$$$/|  $$$$$$$
 *    |__/     |__/ \______/  \______/ |_______/  \_______/
 *
 *
 *
 *     /$$$$$$$$                                  /$$
 *    | $$_____/                                 | $$
 *    | $$       /$$    /$$  /$$$$$$  /$$$$$$$  /$$$$$$    /$$$$$$$
 *    | $$$$$   |  $$  /$$/ /$$__  $$| $$__  $$|_  $$_/   /$$_____/
 *    | $$__/    \  $$/$$/ | $$$$$$$$| $$  \ $$  | $$    |  $$$$$$
 *    | $$        \  $$$/  | $$_____/| $$  | $$  | $$ /$$ \____  $$
 *    | $$$$$$$$   \  $/   |  $$$$$$$| $$  | $$  |  $$$$/ /$$$$$$$/
 *    |________/    \_/     \_______/|__/  |__/   \___/  |_______/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * ON MOUSE MOVE
 *  Set the mouse position and change the cursor based on the mode. Also detects
 *  when a Component is being moved.
 * @param {Event} event - Mouse move event.
 ****************************************************************************/
Digsim.prototype.onMouseMove = function(event) {
   // TODO: fix bug with scolling
    var mouseX = event.offsetX || event.layerX || event.clientX - $(".canvases").position().left;
    var mouseY = event.offsetY || event.layerY || event.clientY - $(".canvases").position().top;
    digsim.mousePos = { x: mouseX, y: mouseY };

    var comp = digsim.getComponent();

    // Show movable Components
    if (digsim.mode === digsim.DEFAULT_MODE && comp && !digsim.dragging) {
        if (comp.type === digsim.WIRE) {
            if (comp.dx)
                $("canvas").css('cursor','row-resize');
            else
                $("canvas").css('cursor','col-resize');
        }
        else
            $("canvas").css('cursor','move');
    }
    else if (digsim.mode === digsim.EDIT_MODE) {
        $("canvas").css('cursor','default');
    }
    // Show clickable Components
    else if (digsim.mode === digsim.SIM_MODE && comp && comp.type === digsim.SWITCH) {
        $("canvas").css('cursor','pointer');
    }
    else if (digsim.mode === digsim.WIRE_MODE) {
        $("canvas").css('cursor','crosshair');
    }
    // Don't change the last cursor if dragging
    else if (!digsim.dragging) {
        $("canvas").css('cursor','default');
    }

    // Set dragging if the selectedComponent has moved
    if ( digsim.mouseDown && digsim.selectedComponent && !digsim.dragging &&
        (digsim.getMouseRow() !== digsim.dragStart.row ||
         digsim.getMouseCol() !== digsim.dragStart.col) ) {
        digsim.dragging = true;
        digsim.prepDragging();
        animate();
    }
};

/*****************************************************************************
 * ON MOUSE DOWN
 *  Select a Component.
 * @param {Event} event - Mouse down event.
 ****************************************************************************/
Digsim.prototype.onMouseDown = function(event) {
    event.preventDefault();
    digsim.mouseDown = true;

    // Only handle left click events in DEFAULT_MODE
    if (event.button !== 0 || digsim.mode !== digsim.DEFAULT_MODE) {
        return;
    }

    // If there is a dragging Component we need to place it instead of move it
    // This only happens when the user moves the mouse off the canvas while still holding down the mouse button and releases
    if (digsim.dragging) {
        $("canvas").mouseup();
        return;
    }

    // Redraw Components if there is already a selected Component
    if (digsim.selectedComponent)
        digsim.drawAllComponents();

    // Select a Component
    var comp = digsim.getComponent();
    if (comp) {
        digsim.selectedComponent = comp;
        digsim.dragStart = {'row': digsim.getMouseRow(), 'col': digsim.getMouseCol()};
        digsim.dragOffset = {'row': digsim.getMouseRow() - comp.row, 'col': digsim.getMouseCol() - comp.col};
        digsim.drawComponent(comp, digsim.staticContext, 'red');

        // Show Control options
        if (comp.type !== digsim.WIRE) {
            digsim.enableButton('Cut');
            digsim.enableButton('Copy');
            digsim.enableButton('Delete');
            digsim.enableButton('Rotate_CCW');
            digsim.enableButton('Rotate_CW');
        }
        else {
            digsim.disableButton('Cut');
            digsim.disableButton('Copy');
            digsim.disableButton('Rotate_CCW');
            digsim.disableButton('Rotate_CW');
            digsim.enableButton('Delete');
        }
    }
    // Empty square
    else {
        digsim.dragStart  = {'row': 0, 'col': 0};
        digsim.dragOffset = {'row': 0, 'col': 0};
        digsim.dragging   = false;
        digsim.disableControlButtons();
    }
};

/*****************************************************************************
 * ON MOUSE UP
 *  Place a dragging Component.
 * @param {Event} event - Mouse up event.
 ****************************************************************************/
Digsim.prototype.onMouseUp = function(event) {
    event.preventDefault();
    digsim.mouseDown = false;

    // Only handle left click events in DEFAULT_MODE or PLACE_MODE
    if (event.button !== 0 || digsim.mode === digsim.WIRE_MODE || digsim.mode === digsim.SIM_MODE ||
        digsim.mode === digsim.EDIT_MODE || !digsim.dragging) {
        return;
    }

    var comp = digsim.selectedComponent;
    var validPlacement = digsim.setPlaceholders(comp);
    var Class;

    // Place a dragging Component
    if (digsim.mode === digsim.DEFAULT_MODE && validPlacement) {
        digsim.dragging = false;
        comp.drawStatic = true;
        digsim.clearCanvas(digsim.movingContext);

        // Keep Components connected by creating wires between them
        var start, target, connectedComp;
        for (var i in digsim.connectionStarts) {
            if (digsim.connectionStarts.hasOwnProperty(i)) {
                connectedComp = digsim.components.getComponent(i);
                start = digsim.connectionStarts[i];
                target = digsim.connectionTargets[i];

                target = {'r': comp.row + target.r, 'c': comp.col + target.c};

                // Update an existing Wire
                if (start.r >= 0 && target.r >= 0 && connectedComp && connectedComp.type === digsim.WIRE) {
                    digsim.route(start, target, false, connectedComp);

                    // Wire was merged out
                    if (connectedComp.path.x === 0 && connectedComp.path.y === 0) {
                        digsim.components.remove(connectedComp);
                    }
                    else {
                        connectedComp.drawStatic = true;
                        connectedComp.deleteConnections();
                        connectedComp.checkConnections();
                    }
                }
                // Create a new Wire
                else if (start.r >= 0 && target.r >= 0) {
                    digsim.route(start, target);

                    console.assert(typeof connectedComp !== "undefined", "Gage: Connected component is undefined?");
                    connectedComp.deleteConnections();
                    connectedComp.checkConnections();
                }
            }
        }

        digsim.connectionStarts = {};
        digsim.connectionTargets = {};

        comp.deleteConnections();
        comp.checkConnections();
        digsim.drawAllComponents();
        digsim.drawComponent(comp, digsim.staticContext, 'red');
    }
    // Place a new Component
    else if (digsim.mode === digsim.PLACE_MODE && validPlacement) {
        // Keep track of all drivers
        if (comp.isADriver()) {
            digsim.drivers.push(comp.id);
        }

        // Place the Component
        digsim.clearCanvas(digsim.movingContext);
        digsim.components.add(comp);
        digsim.iComp++;
        comp.checkConnections();
        digsim.drawComponent(comp, digsim.staticContext);

        // Button is active so create another Component to place
        if($('.gates > ul a').hasClass('active') || $('.io a').hasClass('active')) {
            // JavaScript Reflection
            Class = window[comp.name];
            comp = new Class(digsim.numGateInputs);
            comp.init(digsim.selectedComponent.row, digsim.selectedComponent.col, digsim.rotation, digsim.iComp);

            digsim.dragging = true;
            digsim.selectedComponent = comp;
            digsim.drawComponent(digsim.selectedComponent, digsim.movingContext);
            animate();
        }
        else {
            digsim.dragging = false;
            digsim.mode = digsim.DEFAULT_MODE;
            digsim.disableControlButtons();
        }
    }
};

/*****************************************************************************
 * ON GRID CLICK
 *  Place wires in WIRE_MODE, change states of Switches in SIM_MODE, and close
 *  the Component edit menu in EDIT_MODE.
 * @param {Event} event - Mouse click event.
 ****************************************************************************/
Digsim.prototype.onClick = function(event) {
    event.preventDefault();
    digsim.mouseDown = false;

    // Only handle left click events in WIRE_MODE, SIM_MODE, or EDIT_MODE
    if (event.button !== 0 || digsim.mode === digsim.DEFAULT_MODE || digsim.mode === digsim.PLACE_MODE) {
        return;
    }

    var row = digsim.getMouseRow();
    var col = digsim.getMouseCol();
    var comp, start, target;

    // Close the edit menu
    if (digsim.mode === digsim.EDIT_MODE) {
        digsim.hideComponentMenu();
    }
    // Place a wire
    else if (digsim.mode === digsim.WIRE_MODE) {

        // Start the placement of a Wire
        if (!digsim.dragging) {
            // Prevent wires from starting on top of placeholders
            if (!(typeof digsim.placeholders[row][col] === 'undefined' || digsim.placeholders[row][col] instanceof Array) ||
                Object.keys(digsim.placeholders[row][col] || {}).length === 4) {
                return;
            }

            digsim.dragging = true;
            digsim.wireStart.col = col + 0.5;
            digsim.wireStart.row = row + 0.5;
            animateWire();
        }
        // End the placement of a Wire
        else {
            start  = {'r': Math.floor(digsim.wireStart.row), 'c': Math.floor(digsim.wireStart.col)};
            target = {'r': row, 'c': col};

            digsim.route(start, target);
            digsim.clearCanvas(digsim.movingContext);
        }
    }
    // Change the state of a Switch
    else if (digsim.mode === digsim.SIM_MODE) {
        comp = digsim.getComponent();

        if (comp && comp.type === digsim.SWITCH) {
            digsim.passCounter = 0;
            comp.passState(!comp.state);
            digsim.drawAllComponents();
        }
    }
};

/*****************************************************************************
 * ON GRID DOUBLE CLICK
 *  Open the component edit menu if a component is selected.
 * @param {Event} event - Mouse dblclick event.
 ****************************************************************************/
Digsim.prototype.onDoubleClick = function(event) {
    event.preventDefault();
    digsim.mouseDown = false;

    // Only handle left click events in DEFAULT_MODE
    if (event.button !== 0 || digsim.mode !== digsim.DEFAULT_MODE) {
        return;
    }

    var comp = digsim.getComponent();

    if (comp && digsim.selectedComponent == comp && comp.type !== digsim.WIRE) {
        digsim.showComponentMenu();
    }
};

/**************************************************************************************************************
 *     /$$$$$$$              /$$       /$$
 *    | $$__  $$            | $$      | $$
 *    | $$  \ $$ /$$   /$$ /$$$$$$   /$$$$$$    /$$$$$$  /$$$$$$$
 *    | $$$$$$$ | $$  | $$|_  $$_/  |_  $$_/   /$$__  $$| $$__  $$
 *    | $$__  $$| $$  | $$  | $$      | $$    | $$  \ $$| $$  \ $$
 *    | $$  \ $$| $$  | $$  | $$ /$$  | $$ /$$| $$  | $$| $$  | $$
 *    | $$$$$$$/|  $$$$$$/  |  $$$$/  |  $$$$/|  $$$$$$/| $$  | $$
 *    |_______/  \______/    \___/     \___/   \______/ |__/  |__/
 *
 *
 *
 *     /$$$$$$$$                                  /$$
 *    | $$_____/                                 | $$
 *    | $$       /$$    /$$  /$$$$$$  /$$$$$$$  /$$$$$$    /$$$$$$$
 *    | $$$$$   |  $$  /$$/ /$$__  $$| $$__  $$|_  $$_/   /$$_____/
 *    | $$__/    \  $$/$$/ | $$$$$$$$| $$  \ $$  | $$    |  $$$$$$
 *    | $$        \  $$$/  | $$_____/| $$  | $$  | $$ /$$ \____  $$
 *    | $$$$$$$$   \  $/   |  $$$$$$$| $$  | $$  |  $$$$/ /$$$$$$$/
 *    |________/    \_/     \_______/|__/  |__/   \___/  |_______/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * ON BUTTON CLICKED
 *  Handle GUI Gates, I/O, and Modes button clicks.
 * @param {Event} event - Button click event.
 ****************************************************************************/
Digsim.prototype.onButtonClicked = function(event) {
    event.preventDefault();

    // Don't do anything if the button is disabled
    if ($(this).hasClass('disabled')) {
        return;
    }

    var id = $(this).attr("id");
    var comps, comp, i, j, Class, row, col, len;

    // Activate button
    if (!$(this).hasClass('active')) {
        // Remove the active class from all buttons that have it
        digsim.deactivateButtons($('ul:not(.num-inputs) .active').attr('id'));
        $(this).addClass('active');

        // Wire mode
        if (id == "Wire") {
            digsim.mode = digsim.WIRE_MODE;
        }
        // Simulate Mode
        else if (id == "Run") {
            // Error if there are no drivers in the schematic
            if (digsim.drivers.length === 0) {
                digsim.addMessage(digsim.ERROR, "[16]Error: No drivers in schematic!");
                return;
            }

            digsim.mode = digsim.SIM_MODE;

            // Clear messages every new Run
            digsim.clearMessages();

            // Count the number of connections, inputs, and outputs of the schematic
            digsim.maxSchematicLoop = 0;
            comps = digsim.components.get();
            for (j = 0, len = comps.length; j < len; ++j) {
                comp = comps[j];

                // Reset the state of all Components
                comp.reset();

                // Count the number of connections the schematic has
                if (comp.type === digsim.WIRE) {
                    digsim.maxSchematicLoop += comp.connections.length();

                    // Reset input/output connections for a Wire
                    comp.inputs.clear(false);
                    comp.outputs.clear(false);
                }
                else
                    digsim.maxSchematicLoop += comp.numInputs + comp.numOutputs;
            }
            // Define a safety buffer to pass through
            digsim.maxSchematicLoop *= 3;

            // NOTE: this may be the reason muxs somtimes missbehave.
            // Loop through each driver and pass state
            for (i = 0, len = digsim.drivers.length; i < len; ++i) {
                comp = digsim.components.getComponent(digsim.drivers[i]);

                // Pass state if successfully traversed
                if (comp.traverseConnections()) {
                    digsim.passCounter = 0;
                    comp.passState(0);
                }
                // There was an error so exit
                else
                    return;
            }

            cycleClock();
            digsim.drawAllComponents();
        }
        // Button to place a Component
        else {
            digsim.mode = digsim.PLACE_MODE;
            digsim.enableButton('Rotate_CW');
            digsim.enableButton('Rotate_CCW');

            // Use reflection to dynamically create gate based on id
            Class = window[id];
            comp = new Class(digsim.numGateInputs);
            digsim.rotation = 0;

            // Initialize the new object at the mouse position
            row = digsim.getMouseRow();
            col = digsim.getMouseCol();
            comp.init(row, col, digsim.rotation, digsim.iComp);

            digsim.dragging = true;
            digsim.dragOffset = {'row': 0, 'col': 0};
            digsim.selectedComponent = comp;
            digsim.drawComponent(digsim.selectedComponent, digsim.movingContext);
            animate();
        }
    }
    // Deactivate button
    else {
        digsim.deactivateButtons(id);
    }
};

/**************************************************************************************************************
 *     /$$$$$$$$ /$$ /$$
 *    | $$_____/|__/| $$
 *    | $$       /$$| $$  /$$$$$$
 *    | $$$$$   | $$| $$ /$$__  $$
 *    | $$__/   | $$| $$| $$$$$$$$
 *    | $$      | $$| $$| $$_____/
 *    | $$      | $$| $$|  $$$$$$$
 *    |__/      |__/|__/ \_______/
 *
 *
 *
 *     /$$$$$$$              /$$       /$$
 *    | $$__  $$            | $$      | $$
 *    | $$  \ $$ /$$   /$$ /$$$$$$   /$$$$$$    /$$$$$$  /$$$$$$$   /$$$$$$$
 *    | $$$$$$$ | $$  | $$|_  $$_/  |_  $$_/   /$$__  $$| $$__  $$ /$$_____/
 *    | $$__  $$| $$  | $$  | $$      | $$    | $$  \ $$| $$  \ $$|  $$$$$$
 *    | $$  \ $$| $$  | $$  | $$ /$$  | $$ /$$| $$  | $$| $$  | $$ \____  $$
 *    | $$$$$$$/|  $$$$$$/  |  $$$$/  |  $$$$/|  $$$$$$/| $$  | $$ /$$$$$$$/
 *    |_______/  \______/    \___/     \___/   \______/ |__/  |__/|_______/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * NEW FILE
 *  Create a new file
 ****************************************************************************/
Digsim.prototype.newFile = function() {
    // Reset information
    digsim.iComp = 0;
    digsim.components.clear();
    digsim.drivers = [];
    digsim.placeholders = [];
    for (var i = 0; i < digsim.NUM_COLS; ++i) {
        digsim.placeholders[i] = [];
    }
    $('#messages').html('');

    digsim.clearCanvas(digsim.staticContext);
    digsim.deactivateButtons();
};

/*****************************************************************************
 * SUBMIT FILE
 *  Submits the hidden file upload form to the server.
 ****************************************************************************/
Digsim.prototype.submitFile = function() {
    $('#uploadForm').submit();
};

/*****************************************************************************
 * READ FILE CONTENTS
 *  Reads the contents of the hidden iframe after the file has been submitted.
 ****************************************************************************/
Digsim.prototype.readFileContents = function() {
    var contents = $('#fileContents').contents().find('body').text();

    // Clear the form when finished
    // Prevents pop up in IE because of the method="post" of the form when refreshing the page.
    if (contents !== "") {
        document.getElementById("uploadForm").reset();
        document.getElementById('fileContents').src = "about:blank";
    }

    // Display error messages
    if (contents.substring(0, 5) === "Error") {
        digsim.addMessage(digsim.ERROR, "Error parsing file: " + contents.substring(7));
    }
    if (contents === "file") {
        digsim.addMessage(digsim.ERROR, "Error parsing file: Incorrect file type. File must be of type '.json'.");
    }
    else if (contents === "size") {
        digsim.addMessage(digsim.ERROR, "Error parsing file: File is too large.");
    }
    else if (contents !== "") {
        digsim.openFile(contents);
    }
};

/*****************************************************************************
 * OPEN FILE
 *  Open a schematic into the program.
 * @param {string} contents - JSON string of the file contents.
 ****************************************************************************/
Digsim.prototype.openFile = function(contents) {
    // Don't do anything if the button is disabled
    if ($('#Open').hasClass('disabled')) {
        return;
    }

    var comps = [];
    var components, c, comp, i, name, Class, id = 0;

    // Parse the JSON string and validate contents
    try {
       components = $.parseJSON(contents);
       digsim.validateFile(components);
    }
    catch (e) {
        digsim.addMessage(digsim.ERROR, "Error parsing file: Data missing or incomplete.");
        return;
    }

    // Use reflection to dynamically create Component based on name
    for (i = 0; i < components.length; i++) {
        c = components[i];

        name = c.name;
        Class = window[name];
        comp = new Class(c.numInputs);
        comp.init(c.row, c.col, c.rotation, c.id);

        // Copy all properties of the Component
        $.extend(comp, c);

        // Set Wire direction
        if (comp.type === digsim.WIRE) {
            comp.dx = (comp.path.x ? 1 : 0);
            comp.dy = (comp.path.y ? 1 : 0);
        }

        // Find the highest id so we can start iComp there
        if (comp.id > id)
            id = comp.id;

        comps[i] = comp;
    }

    // Reset current file
    digsim.newFile();
    digsim.iComp = id + 1;

    // Set up schematic
    for (i = 0; i < comps.length; i++) {
        comp = comps[i];
        digsim.components.add(comp);

        digsim.setPlaceholders(comp);

        if (comp.type === digsim.SWITCH || comp.type === digsim.CLOCK) {
            digsim.drivers.push(comp.id);
        }

        comp.checkConnections();
    }

    digsim.drawAllComponents();
};

/*****************************************************************************
 * VALIDATE FILE
 *  Validate that the contents of a file are correct.
 * @param {Array} components - Array of parsed JSON objects.
 ****************************************************************************/
Digsim.prototype.validateFile = function(components) {
    var comp;

    // Ensure the object is an array
    if (!$.isArray(components)) {
        throw "array";
    }

    // Check that each component has the proper data
    for (var i = 0; i < components.length; i++) {
        comp = components[i];

        try {
            digsim.validateComponent(comp);
        }
        catch (e) {
            throw e;
        }
    }
};

/*****************************************************************************
 * VALIDATE COMPONENT
 *  Validate that the a Component has all needed properties for a save or load.
 * @param {Components} comp - Component whose properties to validate.
 * @throws An error if a property is missing.
 ****************************************************************************/
Digsim.prototype.validateComponent = function(comp) {
    if (typeof comp.type === 'undefined')
        throw "type";
    if (typeof comp.id === 'undefined')
        throw "id";
    if (typeof comp.name === 'undefined')
        throw "name";
    if (typeof comp.numInputs === 'undefined')
        throw "numInputs";
    if (typeof comp.row === 'undefined')
        throw "row";
    if (typeof comp.col === 'undefined')
        throw "col";
    if (typeof comp.rotation === 'undefined')
        throw "rotation";
    if (typeof comp.label === 'undefined')
        throw "label";

    // Wire
    if (comp.type === digsim.WIRE) {
        if (typeof comp.path === 'undefined')
            throw "path";
        if (typeof comp.path.x === 'undefined' || typeof comp.path.y === 'undefined')
            throw "path.x || path.y";
    }

    // Clock
    if (comp.type === digsim.CLOCK) {
        if (typeof comp.frequency === 'undefined')
            throw "frequency";
    }

    // PROM
    if (comp.type === digsim.PROM) {
        if (typeof comp.addresses === 'undefined')
            throw "addresses";
    }
};

/*****************************************************************************
 * SAVE FILE
 *  Save the schematic to a JSON object then call a PHP script to let the user
 *  download it to their computer.
 ****************************************************************************/
Digsim.prototype.saveFile = function() {
    // Don't do anything if the button is disabled
    if ($('#Save').hasClass('disabled')) {
        return;
    }

    var components = [];
    var comps, comp, i;

    // Create a new array that will be turned into the JSON object
    // Copy so we don't modify any of the existing Components
    comps = digsim.components.get();
    for (i = 0; i < comps.length; i++)  {
        components[i] = $.extend(true, {}, comps[i]);
    }

    // Remove unneeded properties to reduce JSON string length
    for (i = 0; i < components.length; i++) {
        comp = components[i];

        delete comp.numOutputs;
        delete comp.dimension;
        delete comp.drawStatic;
        delete comp.inputs;
        delete comp.outputs;
        delete comp.zeroDimension;
        delete comp.state;
        delete comp.extraSpace;
        if (comp.type === digsim.WIRE) {
            delete comp.connections;
            delete comp.dx;
            delete comp.dy;
        }

        // Ensure we have all needed information being saved to the file
        try {
            digsim.validateComponent(comp);
        }
        catch (e) {
            digsim.addMessage(digsim.ERROR, "Error saving file: Schematic data corrupted.");
            return;
        }
    }

    // Stringify the array
    digsim.saveJson = JSON.stringify(components);

    // JavaScript does not allow files to be downloaded to the users machine (FileReader API is not supported enough to use).
    // PHP can download files to the users machine, but the user HAS to navigate to the page (can't just use an AJAX request).
    // To get around this problem, we can POST the data to the PHP script and then navigate to it.

    // POST the data to the script to be able to send large strings to the server (GET sends the data as part of the URL string)
    $.ajax({
        url: 'scripts/src/saveFile.php',
        type: 'POST',
        data: { data: digsim.saveJson },
        success: function() {
            window.location = 'scripts/src/saveFile.php';
        }
    });
};

/*****************************************************************************
 * TOGGLE GRID
 *  Toggle the gird between drawing grid lines, wire dots, or no grid at all.
 ****************************************************************************/
Digsim.prototype.toggleGrid = function() {
    digsim.gridToggle = ++digsim.gridToggle % 3;
    digsim.drawGrid(digsim.gridContext);
};

/*****************************************************************************
 * ZOOM
 *  Zoom in/out on the canvas.
 * @param {Event} event - Button click event with data attribute of dir of
 *                        1 (in) or -1 (out).
 ****************************************************************************/
Digsim.prototype.zoom = function(event) {
    var dir = event.data.dir;
    digsim.gridSize += digsim.GRID_ZOOM * dir;

    // Bound the zoom
    if (digsim.gridSize > digsim.MAX_GRID_SIZE) {
        digsim.gridSize = digsim.MAX_GRID_SIZE;
    }
    else if (digsim.gridSize < digsim.MIN_GRID_SIZE) {
        digsim.gridSize = digsim.MIN_GRID_SIZE;
    }
    else {
        // Enable the buttons for the opposite zoom
        if (dir === 1 && $('#Zoom_Out').hasClass('disabled')) {
            digsim.enableButton('Zoom_Out');
        }
        if (dir === -1 && $('#Zoom_In').hasClass('disabled')) {
            digsim.enableButton('Zoom_In');
        }

        digsim.init();
        digsim.changeHitRadius();
        digsim.drawGrid(digsim.gridContext);
        digsim.drawAllComponents();

        // Disable buttons when at the min and max levels
        if (digsim.gridSize === digsim.MAX_GRID_SIZE) {
            digsim.disableButton('Zoom_In');
        }
        if (digsim.gridSize === digsim.MIN_GRID_SIZE) {
            digsim.disableButton('Zoom_Out');
        }
    }
};

/*****************************************************************************
 * CHANGE NUM INPUTS
 *  Changes the number of inputs for a gate.
 * @param {Event} event - Button click event.
 ****************************************************************************/
Digsim.prototype.changeNumInputs = function() {
    // Don't do anything if the button is already active
    if ($(this).hasClass('active')) {
        return;
    }

    // Remove the active class from all buttons that have it
    $('.num-inputs .active').removeClass('active');
    $(this).addClass('active');

    digsim.numGateInputs = $(this).data('inputs');

    if (digsim.selectedComponent && digsim.selectedComponent.changeNumInputs) {
        digsim.selectedComponent.changeNumInputs(digsim.numGateInputs);
    }
};

/**************************************************************************************************************
 *      /$$$$$$                        /$$                         /$$
 *     /$$__  $$                      | $$                        | $$
 *    | $$  \__/  /$$$$$$  /$$$$$$$  /$$$$$$    /$$$$$$   /$$$$$$ | $$
 *    | $$       /$$__  $$| $$__  $$|_  $$_/   /$$__  $$ /$$__  $$| $$
 *    | $$      | $$  \ $$| $$  \ $$  | $$    | $$  \__/| $$  \ $$| $$
 *    | $$    $$| $$  | $$| $$  | $$  | $$ /$$| $$      | $$  | $$| $$
 *    |  $$$$$$/|  $$$$$$/| $$  | $$  |  $$$$/| $$      |  $$$$$$/| $$
 *     \______/  \______/ |__/  |__/   \___/  |__/       \______/ |__/
 *
 *
 *
 *     /$$$$$$$              /$$       /$$
 *    | $$__  $$            | $$      | $$
 *    | $$  \ $$ /$$   /$$ /$$$$$$   /$$$$$$    /$$$$$$  /$$$$$$$   /$$$$$$$
 *    | $$$$$$$ | $$  | $$|_  $$_/  |_  $$_/   /$$__  $$| $$__  $$ /$$_____/
 *    | $$__  $$| $$  | $$  | $$      | $$    | $$  \ $$| $$  \ $$|  $$$$$$
 *    | $$  \ $$| $$  | $$  | $$ /$$  | $$ /$$| $$  | $$| $$  | $$ \____  $$
 *    | $$$$$$$/|  $$$$$$/  |  $$$$/  |  $$$$/|  $$$$$$/| $$  | $$ /$$$$$$$/
 *    |_______/  \______/    \___/     \___/   \______/ |__/  |__/|_______/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * DELETE
 *  Delete a component.
 ****************************************************************************/
Digsim.prototype.delete = function() {
    // Don't do anything if the button is disabled
    if ($('#Delete').hasClass('disabled')) {
        return;
    }

    digsim.deleteComponent(digsim.selectedComponent);
};

/*****************************************************************************
 * ROTATE
 *  Rotate a Component clockwise or counter-clockwise.
 * @param {Event} event - Button click event with data attribute of dir of
 *                        90 (CW) or 270 (CCW).
 ****************************************************************************/
Digsim.prototype.rotate = function(event) {
    // Don't do anything if rotation is disabled (both are always enabled or always disabled)
    if ($('#Rotate_CW').hasClass('disabled')) {
        return;
    }

    var comp = digsim.selectedComponent;

    // Delete placed Component placeholders
    if (!digsim.dragging) {
        digsim.deletePlaceholder(comp);
        comp.deleteConnections();
    }

    digsim.rotation = (comp.rotation + event.data.dir) % 360;
    comp.rotation = digsim.rotation;

    // Swap Component dimensions
    comp.dimension.row = comp.dimension.row ^ comp.dimension.col;
    comp.dimension.col = comp.dimension.row ^ comp.dimension.col;
    comp.dimension.row = comp.dimension.row ^ comp.dimension.col;

    digsim.drawAllComponents();

    if (!digsim.dragging && digsim.setPlaceholders(comp)) {
        digsim.drawComponent(comp, digsim.staticContext, 'red');
        comp.checkConnections();
    }
    else {
        digsim.drawComponent(comp, digsim.movingContext, 'red');
    }
};

/*****************************************************************************
 * CUT
 *  Cut a component to the clipboard.
 ****************************************************************************/
Digsim.prototype.cut = function() {
    // Don't do anything if the button is disabled
    if ($('#Cut').hasClass('disabled')) {
        return;
    }

    digsim.clipboard = digsim.selectedComponent;
    digsim.deleteComponent(digsim.selectedComponent);

    // Activate the paste button
    if ($('#Paste').hasClass('disabled')) {
        digsim.enableButton('Paste');
    }
};


/*****************************************************************************
 * COPY
 *  Copy a component to the clipboard.
 ****************************************************************************/
Digsim.prototype.copy = function() {
    // Don't do anything if the button is disabled
    if ($('#Copy').hasClass('disabled')) {
        return;
    }

    digsim.clipboard = digsim.selectedComponent;

    // Activate the paste button
    if ($('#Paste').hasClass('disabled')) {
        digsim.enableButton('Paste');
    }
 };

/*****************************************************************************
 * PASTE
 *  Paste a component from the clipboard to the canvas.
 ****************************************************************************/
Digsim.prototype.paste = function() {
    // Don't do anything if the button is disabled
    if ($('#Paste').hasClass('disabled')) {
        return;
    }

    digsim.mode = digsim.PLACE_MODE;

    // Use reflection to dynamically create gate based on name
    var name  = digsim.clipboard.name;
    var Class = window[name];
    var comp  = new Class(digsim.clipboard.numInputs);

    // Copy all properties of the Component but keep the new id
    $.extend(true, comp, digsim.clipboard, {id: digsim.iComp});

    // Initialize the new Component at the mouse position
    comp.row = digsim.getMouseRow();
    comp.col = digsim.getMouseCol();

    digsim.dragging = true;
    digsim.dragOffset = {'row': 0, 'col': 0};
    digsim.selectedComponent = comp;
    digsim.drawComponent(digsim.selectedComponent, digsim.movingContext);
    animate();
};

/**************************************************************************************************************
 *     /$$   /$$           /$$
 *    | $$  | $$          | $$
 *    | $$  | $$  /$$$$$$ | $$  /$$$$$$   /$$$$$$   /$$$$$$
 *    | $$$$$$$$ /$$__  $$| $$ /$$__  $$ /$$__  $$ /$$__  $$
 *    | $$__  $$| $$$$$$$$| $$| $$  \ $$| $$$$$$$$| $$  \__/
 *    | $$  | $$| $$_____/| $$| $$  | $$| $$_____/| $$
 *    | $$  | $$|  $$$$$$$| $$| $$$$$$$/|  $$$$$$$| $$
 *    |__/  |__/ \_______/|__/| $$____/  \_______/|__/
 *                            | $$
 *                            | $$
 *                            |__/
 *     /$$$$$$$$                                 /$$     /$$
 *    | $$_____/                                | $$    |__/
 *    | $$       /$$   /$$ /$$$$$$$   /$$$$$$$ /$$$$$$   /$$  /$$$$$$  /$$$$$$$   /$$$$$$$
 *    | $$$$$   | $$  | $$| $$__  $$ /$$_____/|_  $$_/  | $$ /$$__  $$| $$__  $$ /$$_____/
 *    | $$__/   | $$  | $$| $$  \ $$| $$        | $$    | $$| $$  \ $$| $$  \ $$|  $$$$$$
 *    | $$      | $$  | $$| $$  | $$| $$        | $$ /$$| $$| $$  | $$| $$  | $$ \____  $$
 *    | $$      |  $$$$$$/| $$  | $$|  $$$$$$$  |  $$$$/| $$|  $$$$$$/| $$  | $$ /$$$$$$$/
 *    |__/       \______/ |__/  |__/ \_______/   \___/  |__/ \______/ |__/  |__/|_______/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * DECIMAL TO HEX
 *  Converts a decimal value to a hex value.
 * @param {number} dec - Decimal to convert.
 * @return {string} Hex value.
 ****************************************************************************/
Digsim.prototype.dec2hex = function(dec) {
    return Number(dec).toString(16).toUpperCase();
};

/*****************************************************************************
 * DECIMAL TO BINARY
 *  Converts a decimal value to a binary value.
 * @param {number} dec - Decimal to convert.
 * @param {string} Binary value.
 ****************************************************************************/
Digsim.prototype.dec2bin = function(dec) {
    return Number(dec).toString(2);
};

/*****************************************************************************
 * PAD
 *  Pad a value with leading values.
 * @param {number}        value   - Value to pad.
 * @param {number}        length  - Length of the
 * @param {number/string} padding - Value to pad with @default '0'. If the length
 *                                  is greater than 1, will just use the first character.
 ****************************************************************************/
Digsim.prototype.pad = function(value, length, padding) {
    if (typeof padding === 'undefined')
        padding = '0';
    else
        padding += '';

    // Can only pad with single characters
    if (padding.length > 1)
        padding = padding[0];

    value = value + '';

    return new Array(length - value.length + 1).join(padding) + value;
};

/*****************************************************************************
 * GET MOUSE POS
 *  Return the position of the mouse.
 * @return {Object} - {x, y}.
 ****************************************************************************/
Digsim.prototype.getMousePos = function() {
    return {x: digsim.mousePos.x, y: digsim.mousePos.y};
};

/*****************************************************************************
 * GET ROW
 *  Return the y position as a row.
 * @param {number} y
 * @return {number}
 ****************************************************************************/
Digsim.prototype.getRow = function(y) {
    return Math.floor(y / digsim.gridSize);
};

/*****************************************************************************
 * GET COL
 *  Return the x position as a col.
 * @param {number} x
 * @return {number}
 ****************************************************************************/
Digsim.prototype.getCol = function(x) {
    return Math.floor(x / digsim.gridSize);
};

/*****************************************************************************
 * GET MOUSE ROW
 *  Return the grid row of the current mouse position.
 * @return {number}
 ****************************************************************************/
Digsim.prototype.getMouseRow = function() {
    return digsim.getRow(digsim.mousePos.y);
};

/*****************************************************************************
 * GET MOUSE COL
 *  Return the grid col of the current mouse position.
 * @return {number}
 ****************************************************************************/
Digsim.prototype.getMouseCol = function() {
    return digsim.getCol(digsim.mousePos.x);
};

/*****************************************************************************
 * RESET COMPONENT STATES
 *  Reset the state of all Components.
 ****************************************************************************/
Digsim.prototype.resetComponentStates = function() {
    var comps = this.components.get();
    for (var i = 0, len = comps.length; i < len; i++) {
        // Reset the state of all Components
        comps[i].reset();
    }
};

/*****************************************************************************
 * GET WIRE INDEX
 *  Returns the index of the where the user clicks inside a wire array
 *  placeholder cell.
 ****************************************************************************/
Digsim.prototype.getWireIndex = function() {
    var mousePos  = this.getMousePos();
    var row       = this.getMouseRow();
    var col       = this.getMouseCol();
    var relX      = mousePos.x % digsim.gridSize;
    var relY      = mousePos.y % digsim.gridSize;

    var leftVert  = Math.ceil(digsim.gridSize * (1 - digsim.hitRadius) / 2);
    var topHor    = leftVert;
    var rightVert = digsim.gridSize - topHor;
    var bottomHor = rightVert;
    var diagSep   = digsim.gridSize - relX;
    var vert      = (relX >= topHor) && (relX <= bottomHor);
    var hor       = (relY >= leftVert) && (relY <= rightVert);
    var index     = -1;
    var array     = digsim.placeholders[row][col];

    if (vert && hor && (array[0] || array[2]) && (array[1] || array[3])) {
        // mid click and multiple wires
        // Determine grid snap for wires not connecting to other wires.
        if (relY < relX) {  // top
            if (relY < diagSep) {  // top-left
                index = digsim.TL;
            }
            else { // top-right
                index = digsim.TR;
            }
        }
        else { // bottom
            if (relY < diagSep) { // bottom-left
                index = digsim.BL;
            }
            else { // bottom-right
                index = digsim.BR;
            }
        }
    }
    else if (hor && (array[1] || array[3]) && relY >= topHor && relY <= bottomHor) {
        if (relX <= digsim.gridSize / 2) {
            index = 3;
        }
        else {
            index = 1;
        }
    }
    else if (vert && relX >= leftVert && relX <= rightVert) {
        if (relY <= digsim.gridSize / 2) {
            index = 0;
        }
        else {
            index = 2;
        }
    }

    return index;
};

/*****************************************************************************
 * PREP DRAGGING
 *  Prepare a Component for dragging by saving the connection locations (so that
 *  they can be used to quickly draw wires between).
 ****************************************************************************/
Digsim.prototype.prepDragging = function() {
    var comp = digsim.selectedComponent;
    var inputs, outputs, connections, cons, con, comps, connectedComp, index, space, k, j;

    // Get connected Components
    if (comp.type === digsim.WIRE) {
        connections = comp.connections.get();
        cons = ['connections'];
    }
    else {
        inputs = comp.inputs.get();
        outputs = comp.outputs.get();
        cons = ['inputs','outputs'];
    }

    // Loop through each connection
    for (k = 0; k < cons.length; k++) {
        con = cons[k];
        comps = (con === 'inputs' ? inputs : con === 'outputs' ? outputs : connections);

        // Loop through each Component
        for (j = 0; j < comps.length; j++) {
            connectedComp = comps[j];

            // Connection start space
            if (connectedComp.type === digsim.WIRE) {
                index = connectedComp.connections.getConnectionIndex(comp);

                // Get Wire Component space
                if (index === 'input')
                    space = connectedComp.getComponentOutputSpace()[0];
                else
                    space = connectedComp.getComponentInputSpace()[0];

                connectedComp.drawStatic = false;
                digsim.deletePlaceholder(connectedComp);
            }
            else {
                // Get Component space for a connection
                if (connectedComp.inputs.contains(comp)) {
                    index = connectedComp.inputs.getConnectionIndex(comp);
                    space = connectedComp.getInputRotation(index);
                }
                else {
                    index = connectedComp.outputs.getConnectionIndex(comp);
                    space = connectedComp.getOutputRotation(index);
                }
            }
            digsim.connectionStarts[connectedComp.id] = {'r': space.row, 'c': space.col};

            // Connection target space
            index = comp[con].getConnectionIndex(connectedComp);
            if (con === 'inputs')
                space = comp.getInputRotation(index);
            else if (con === 'outputs')
                space = comp.getOutputRotation(index);
            else {
                index = comp.connections.getConnectionIndex(connectedComp);

                if (index === 'input')
                    space = comp.getComponentInputSpace()[0];
                else
                    space = comp.getComponentOutputSpace()[0];
            }
            digsim.connectionTargets[connectedComp.id] = {'r': space.row - comp.row, 'c': space.col - comp.col};
        }
    }

    comp.drawStatic = false;
    digsim.deletePlaceholder(comp);

    digsim.drawAllComponents();
};

/*****************************************************************************
 * CHANGE HIT RADIUS
 *  Changes the hit radius so that wires will be easier to select.
 ****************************************************************************/
Digsim.prototype.changeHitRadius = function() {
    this.hitRadius = 0.80 / (digsim.MIN_GRID_SIZE - digsim.MAX_GRID_SIZE) *
                      (digsim.gridSize - digsim.MIN_GRID_SIZE) + 1;
};

/*****************************************************************************
 * DISABLE BUTTON
 *  Disable a button.
 * @param {number} id - The HTML id of the button to disable.
 ****************************************************************************/
Digsim.prototype.disableButton = function(id) {
    $('#' + id).addClass('disabled');
    $('#' + id).removeAttr('href');
    $('#' + id).removeAttr('title');
};

/*****************************************************************************
 * ENABLE BUTTON
 *  Enable a button.
 * @param {number} id - The HTML id of the button to enable.
 ****************************************************************************/
Digsim.prototype.enableButton = function(id) {
    // Button title's should not contain underscores
    var title = id.replace("_", " ");
    var hotkey = digsim.HOT_KEYS[id];

    $('#' + id).removeClass('disabled');
    $('#' + id).attr('href', '#');

    // Set the title of the button to the format of '[name] ([hot key])';
    $('#' + id).attr('title', title + (hotkey ? " (" + digsim.HOT_KEYS[id] + ")" : ""));
};

/*****************************************************************************
 * DEACTIVATE BUTTONS
 *  Removes the 'active' class from all buttons, resets states of all Components
 *  after SIM_MODE, and changes mode back to DEFAULT_MODE.
 ****************************************************************************/
 Digsim.prototype.deactivateButtons = function(id) {
    $("canvas").css('cursor','default');
    $('ul:not(.num-inputs) .active').removeClass('active');
    this.disableControlButtons();

    // Reset all states and redraw canvas if application was in RUN_MODE
    if (id === "Run" || this.mode === this.SIM_MODE) {
        this.resetComponentStates();
    }

    this.mode = this.DEFAULT_MODE;
    this.dragging = false;
    this.selectedComponent = undefined;

    this.clearCanvas(this.movingContext);
    this.drawAllComponents();
};

/*****************************************************************************
 * DISABLE CONTROL BUTTONS
 *  Disable all Control buttons.
 ****************************************************************************/
Digsim.prototype.disableControlButtons = function() {
    digsim.disableButton('Cut');
    digsim.disableButton('Copy');
    digsim.disableButton('Delete');
    digsim.disableButton('Rotate_CCW');
    digsim.disableButton('Rotate_CW');

    // Disable the paste button if nothing has been copied
    if (!digsim.clipboard) {
        digsim.disableButton('Paste');
    }

    // Draw the selected component before reseting
    if (digsim.selectedComponent) {
        digsim.drawAllComponents();
    }
    this.selectedComponent = undefined;
};

/*****************************************************************************
 * SHOW COMPONENT MENUS
 *  Shows a menu that allows the user to change information about a Component.
 ****************************************************************************/
Digsim.prototype.showComponentMenu = function() {
    this.mode = this.EDIT_MODE;
    var comp = digsim.selectedComponent;

    // Name the Edit screen with the number of inputs of a gate
    var name = comp.name;
    if (comp.isAGate() && comp.numInputs >= 2) {
        name = comp.numInputs + "-input " + name;
    }

    // Show clock frequency
    if (comp.type === digsim.CLOCK) {
        $('#clock-freq').val(comp.frequency);
        $('.clock-freq').show();
    }
    else {
        $('.clock-freq').hide();
    }

    // Show prom addresses
    if (comp.type === digsim.PROM) {
        var table = document.getElementById('prom-addresses');
        table.innerHTML = '';

        var docfrag = document.createDocumentFragment();
        var tr, th, td, label, input, num;

        tr = document.createElement("tr");

        // Headers
        th = document.createElement("th");
        th.textContent = "Address";
        tr.appendChild(th);

        th = document.createElement("th");
        th.textContent = "Hex";
        tr.appendChild(th);

        docfrag.appendChild(tr);

        for (var address in comp.addresses) {
            if (comp.addresses.hasOwnProperty(address)) {
                tr = document.createElement("tr");
                tr.id = "row-" + address;

                // Address
                num = digsim.pad(digsim.dec2bin(address), comp.numInputs - 1);

                td = document.createElement("td");
                label = document.createElement("label");

                label.setAttribute("for","hex-" + address);
                label.id = "address-" + address;
                label.className = "address-value";
                label.innerHTML = num;

                td.appendChild(label);
                tr.appendChild(td);

                // Hex
                num = digsim.pad(digsim.dec2hex(comp.addresses[address]), 2);

                td = document.createElement("td");
                input = document.createElement("input");

                input.type = "text";
                input.setAttribute('maxlength', 2);
                input.id = "hex-" + address;
                input.className = "hex-value";
                input.value = num;

                td.appendChild(input);
                tr.appendChild(td);

                docfrag.appendChild(tr);
            }
        }
        table.appendChild(docfrag);

        $('.prom-addresses').scrollTop(0);
        $('.prom-addresses').show();
    }
    else {
        $('.prom-addresses').hide();
    }

    // Set the edit menu information
    $('#component-name').html(name);
    $('#component-label').val(comp.label);
    $('.component-menu').show();
    $('#component-label').focus().select();
};

/*****************************************************************************
 * HIDE COMPONENT MENU
 *  Closes the component edit menu.
 ****************************************************************************/
Digsim.prototype.hideComponentMenu = function() {
    digsim.mode = digsim.DEFAULT_MODE;
    $('.component-menu').hide();
    $('canvas').focus();
};

/*****************************************************************************
 * ON SAVE COMPONENT EDIT
 *  Save changes to the component from the edit menu.
 ****************************************************************************/
Digsim.prototype.onSaveComponentEdit = function() {
    var comp = digsim.selectedComponent;
    var error = false;

    comp.label = $('#component-label').val();

    // Save the clock frequency. Default frequency is 2
    if (comp.type === digsim.CLOCK) {
        comp.frequency = parseInt($('#clock-freq').val(), 10) || 2;
    }

    // Save the prom addresses
    if (comp.type === digsim.PROM) {
        digsim.clearMessages();

        for (var address in comp.addresses) {
            if (comp.addresses.hasOwnProperty(address)) {
                var hex = $('#hex-' + address).val();

                // Validate hex
                if (/^[0-9A-F]+$/i.test(hex)) {
                    hex = parseInt(hex, 16);
                    comp.addresses[address] = hex;
                    $('#row-' + address).removeClass('hex-error');
                }
                else {
                    $('#row-' + address).addClass('hex-error');
                    var num = digsim.pad(digsim.dec2bin(address), comp.numInputs - 1);
                    digsim.addMessage(digsim.ERROR, 'Invalid hex value for address ' + num, false);
                    error = true;
                }
            }
        }
    }

    if (error)
        return;

    digsim.hideComponentMenu();
    digsim.drawAllComponents();
    digsim.drawComponent(comp, digsim.staticContext, 'red');
};

/*****************************************************************************
 * ADD MESSAGE
 *  Adds error and warning messages to the message window.
 * @param {number}  type       - Type of message.
 * @param {string}  msg        - Message to display.
 * @param {boolean} deactivate - Deactivate buttons @default true.
 ****************************************************************************/
Digsim.prototype.addMessage = function(type, msg, deactivate) {
    if (type === digsim.ERROR) {
        $('#messages').append("<span class='error'>" + msg + "</span><br>");
        $("#messages").scrollTop($("#messages")[0].scrollHeight);

        if (typeof deactivate === 'undefined' || deactivate)
            digsim.deactivateButtons();
    }
    else if (type === digsim.WARNING) {
        $('#messages').append("<span class='warning'>" + msg + "</span><br>");
        $("#messages").scrollTop($("#messages")[0].scrollHeight);
    }
};

/*****************************************************************************
 * CLEAR MESSAGES
 *  Clears the message window.
 ****************************************************************************/
Digsim.prototype.clearMessages = function() {
    $('#messages').html('');
};

/**************************************************************************************************************
 *     /$$      /$$ /$$
 *    | $$  /$ | $$|__/
 *    | $$ /$$$| $$ /$$  /$$$$$$   /$$$$$$
 *    | $$/$$ $$ $$| $$ /$$__  $$ /$$__  $$
 *    | $$$$_  $$$$| $$| $$  \__/| $$$$$$$$
 *    | $$$/ \  $$$| $$| $$      | $$_____/
 *    | $$/   \  $$| $$| $$      |  $$$$$$$
 *    |__/     \__/|__/|__/       \_______/
 *
 *
 *
 *     /$$$$$$$                        /$$     /$$
 *    | $$__  $$                      | $$    |__/
 *    | $$  \ $$  /$$$$$$  /$$   /$$ /$$$$$$   /$$ /$$$$$$$   /$$$$$$
 *    | $$$$$$$/ /$$__  $$| $$  | $$|_  $$_/  | $$| $$__  $$ /$$__  $$
 *    | $$__  $$| $$  \ $$| $$  | $$  | $$    | $$| $$  \ $$| $$  \ $$
 *    | $$  \ $$| $$  | $$| $$  | $$  | $$ /$$| $$| $$  | $$| $$  | $$
 *    | $$  | $$|  $$$$$$/|  $$$$$$/  |  $$$$/| $$| $$  | $$|  $$$$$$$
 *    |__/  |__/ \______/  \______/    \___/  |__/|__/  |__/ \____  $$
 *                                                           /$$  \ $$
 *                                                          |  $$$$$$/
 *                                                           \______/
 ***************************************************************************************************************/

/*****************************************************************************
 * ROUTE
 *  Route a path from start to target and adds placeholders too.
 *  Dijkstra pathfinding algorithm - www.zsheffield.net/dijkstra-pathfinding
 * @param {Object}  startRef   - Staring {row, col}.
 * @param {Object}  targetRef  - Ending {row, col}.
 * @param {boolean} returnPath - Return the path array.
 * @param {Wire}    obj        - Wire to update path (instead of creating a new one).
 ****************************************************************************/
Digsim.prototype.route = function(startRef, targetRef, returnPath, obj) {
    var start = {'c': startRef.c, 'r': startRef.r};     // JSON objects are pass by reference, and we don't want
    var target = {'c': targetRef.c, 'r': targetRef.r};  // to change the original data - so here, we make a copy...
    var placeholders = digsim.placeholders;

    // If click is in the same spot, we're done placing the wire.
    if (start.r === target.r && start.c === target.c) {
        if (!returnPath) {
            digsim.dragging = false;
            // Update existing wire
            if (obj && obj.type === digsim.WIRE) {
                obj.path.x = 0;
                obj.path.y = 0;
            }
        }
        return;
    }

    console.assert(typeof placeholders[target.r] !== "undefined", "digsim.placeholder doesn't exist");

    if ( typeof placeholders[target.r][target.c] !== 'undefined' || digsim.mode === digsim.DEFAULT_MODE ) {
        digsim.endRoute = true;
    }
    else {
        digsim.endRoute = false;
    }
    // console.log("START: r:" + start.r + " c:" + start.c);
    // console.log("TARGET: r:" + target.r + " c:" + target.c);

    /**
     * Node object
     */
    function node(r, c, p) {
        this.r = r || 0;
        this.c = c || 0;
        this.p = p || undefined;
    }

    var neighbors = [];
    var u;
    var pathfound = false;
    var alt;
    var index = 0;
    var dist = [];
    var Q = [];
    var prev = [];
    var i;
    prev.push(new node(start.r, start.c));

    // Initialize all arrays
    for (var r = 0; r < digsim.NUM_ROWS; ++r) {
        dist[r] = [];
        Q[r] = [];
        for (var c = 0; c < digsim.NUM_COLS; ++c) {
            dist[r][c] = Infinity;
            Q[r][c] = placeholders[r][c]; // placeholders go here
        }
    }

    dist[start.r][start.c] = 0;
    while (!pathfound)
    {
        if (index === prev.length) {
            break;
        }
        u = prev[index];
        // u now contains the coordinate in Q with the
        // smallest distance in dist[]

        // If we've reached our target, then we're done
        Q[u.r][u.c] = undefined;
        if (u.r === target.r && u.c === target.c) {
            pathfound = true;
            break;
        }

        if (dist[u.r][u.c] === Infinity) { // Nowhere to go
            digsim.addMessage(digsim.WARNING, "[17]Unable to find valid path for autoroute");
            pathfound = false;
            break;
        }

        // FIND NEIGHBORS
        // Neighbor above
        if ((u.r - 1) >= 0) {
            if (typeof Q[u.r - 1][u.c] === 'undefined' &&
                !(placeholders[u.r - 1][u.c] instanceof Array) &&
                typeof placeholders[u.r - 1][u.c] === 'undefined') {
                neighbors.push( {'r': u.r - 1, 'c': u.c} );
            }
            else if (placeholders[u.r - 1][u.c] instanceof Array) {
                if (digsim.checkAdj(u, 0, target)) {
                    neighbors.push( {'r': u.r - 1, 'c': u.c} );
                }
            }
        }
        // Neighbor right
        if ((u.c + 1) < (digsim.NUM_COLS - 1)) {
            if (typeof Q[u.r][u.c + 1] === 'undefined' &&
                !(placeholders[u.r][u.c + 1] instanceof Array) &&
                 typeof placeholders[u.r][u.c + 1] === 'undefined') {
                neighbors.push( {'r': u.r, 'c': u.c + 1} );
            }
            else if (placeholders[u.r][u.c + 1] instanceof Array) {
                if (digsim.checkAdj(u, 1, target)) {
                    neighbors.push( {'r': u.r, 'c': u.c + 1} );
                }
            }
        }
        // Neighbor below
        if ((u.r + 1) <= (digsim.NUM_ROWS - 1)) {
            if ((typeof Q[u.r + 1][u.c] === 'undefined') &&
                !(placeholders[u.r + 1][u.c] instanceof Array) &&
                (typeof placeholders[u.r + 1][u.c] === 'undefined')) {
                    neighbors.push( {'r': u.r + 1, 'c': u.c} );
            }
            else if (placeholders[u.r + 1][u.c] instanceof Array) {
                if (digsim.checkAdj(u, 2, target)) {
                    neighbors.push( {'r': u.r + 1, 'c': u.c} );
                }
            }
        }
        // Neighbor left
        if ((u.c - 1) >= 0) {
            if (typeof Q[u.r][u.c - 1] === 'undefined' &&
                !(placeholders[u.r][u.c - 1] instanceof Array) &&
                typeof placeholders[u.r][u.c - 1] === 'undefined') {
                    neighbors.push( {'r': u.r, 'c': u.c - 1} );
            }
            else if (placeholders[u.r][u.c - 1] instanceof Array) {
                if (digsim.checkAdj(u, 3, target)) {
                    neighbors.push( {'r': u.r, 'c': u.c - 1} );
                }
            }
        }

        // Add the right neighbor to the path
        for (i = 0; i < neighbors.length; ++i) {
            alt = dist[u.r][u.c] + 1;
            if (alt < dist[ neighbors[i].r ][ neighbors[i].c ]) {
                dist[ neighbors[i].r ][ neighbors[i].c ] = alt;
                prev.push(new node(neighbors[i].r, neighbors[i].c, u));
                if (target.r === neighbors[i].r && target.c === neighbors[i].c) {
                    pathfound = true;
                    break;
                }
            }
        }
        neighbors = [];
        ++index;
    }

    u = prev[prev.length - 1]; // This is the target
    if (u.r !== target.r || u.c !== target.c) { // no path
        digsim.addMessage(digsim.WARNING, "[18]Unable to find valid path for autoroute");
        return;
    }
    var S = [];
    while (u !== undefined) {
        S.unshift( {'r': u.r, 'c': u.c} );
        u = u.p;
    }

    // Now to actually make the wires
    // First, create the separate paths
    // console.log("Starting wire placement for autoroute");
    var path = [];
    var currBranch = {'r':0,'c':0};
    var currStart = start;
    var prevDy = S[1].r - S[0].r;
    var prevDx = S[1].c - S[0].c;
    var validPlacement;
    var wire = null;
    currBranch.r += prevDy;
    currBranch.c += prevDx;
    for (i = 1, len = S.length - 1; i < len; ++i) {
        var dx = S[i + 1].c - S[i].c;
        var dy = S[i + 1].r - S[i].r;
        if (dx !== prevDx && dy !== prevDy) {
            if (returnPath) {
                path.push( {'x':Math.abs(currBranch.c + currStart.c),'y':Math.abs(currBranch.r + currStart.r)} );
            }
            else {
                wire = new Wire();
                if (prevDx === -1 || prevDy === -1) {
                    wire.init(currStart.r + 0.5 + currBranch.r, currStart.c + 0.5 + currBranch.c, 0, digsim.iComp);
                }
                else {
                    wire.init(currStart.r + 0.5, currStart.c + 0.5, 0, digsim.iComp);
                }
                wire.dx = Math.abs(prevDx);
                wire.dy = Math.abs(prevDy);
                wire.path = { 'x':Math.abs(currBranch.c),'y':Math.abs(currBranch.r ) };

                validPlacement = digsim.setPlaceholders(wire, true);
                if (validPlacement) {
                    digsim.components.add(wire);
                    digsim.iComp++;

                    // Draws the wire on static context.
                    wire.checkConnections();
                    digsim.drawComponent(wire, digsim.staticContext);
                }
                else {
                    // DO NOT PLACE WIRE, there's something in the way.
                    wire.path.pop();
                    digsim.dragging = true;
                }
            }
            currStart.r += currBranch.r;
            currStart.c += currBranch.c;
            currBranch = {'r':0,'c':0};
            prevDx = dx;
            prevDy = dy;
            --i;
        }
        else {
            currBranch.r += prevDy;
            currBranch.c += prevDx;
            prevDx = dx;
            prevDy = dy;
        }
    }

    // Update an existing wire
    if (digsim.mode === digsim.DEFAULT_MODE && !returnPath && obj && obj.type === digsim.WIRE) {
        // Get the two points
        var point1, point2;
        if (path.length) {
            point1 = {'x': path[path.length - 1].x, 'y': path[path.length - 1].y};
        }
        else {
            point1 = {'x': currStart.c, 'y': currStart.r};
        }
        point2 = {'x': (currBranch.c + currStart.c), 'y': (currBranch.r + currStart.r)};

        // Update wire coordinates
        obj.row = Math.min(point1.y, point2.y) + 0.5;
        obj.col = Math.min(point1.x, point2.x) + 0.5;
        obj.path = {'x': Math.abs(point1.x - point2.x), 'y': Math.abs(point1.y - point2.y)};

        // Set the dx and dy of the new wire
        obj.dx = (obj.path.x ? 1 : 0);
        obj.dy = (obj.path.y ? 1 : 0);

        validPlacement = digsim.setPlaceholders(obj, true);
        obj.drawStatic = true;
    }
    else if (returnPath) {
        path.push( {'x':Math.abs(currBranch.c + currStart.c),'y':Math.abs(currBranch.r + currStart.r)} );
        return path;
    }
    // Place a new wire
    else {
        wire = new Wire();
        if (prevDx === -1 || prevDy === -1) {
            wire.init(currStart.r + 0.5 + currBranch.r, currStart.c + 0.5 + currBranch.c, 0, digsim.iComp);
        }
        else {
            wire.init(currStart.r + 0.5, currStart.c + 0.5, 0, digsim.iComp);
        }
        wire.dx = Math.abs(prevDx);
        wire.dy = Math.abs(prevDy);
        wire.path = { 'x':Math.abs(currBranch.c),'y':Math.abs(currBranch.r ) };

        validPlacement = digsim.setPlaceholders(wire, true);
        if (validPlacement) {
            digsim.components.add(wire);
            digsim.iComp++;
            // Draws the wire on static context.
            wire.checkConnections();
            digsim.drawComponent(wire, digsim.staticContext);
        }
        else {
            // DO NOT PLACE WIRE, there's something in the way.
            wire.path.pop();
            digsim.dragging = true;
        }

        if (digsim.endRoute) {
            // If we attach to something at the end, don't start another wire
            digsim.dragging = false;
        }
        else {
            // If we cannot attach to something at the end point,
            // We will start a new wire where we ended the last one
            digsim.wireStart.col = target.c + 0.5;
            digsim.wireStart.row = target.r + 0.5;
            digsim.dragging = true;
        }
    }
};

/*****************************************************************************
 * CHECK ADJACENT
 *  Used for autorouting to see if adjacent cells containing wires are valid
 *  paths.
 * @param {Node}   curr   - Current node.
 * @param {number} d      - Direction to travel.
 * @param {Node}   target - Goal node.
 ****************************************************************************/
Digsim.prototype.checkAdj = function(curr, d, target) {
    var r = curr.r;
    var c = curr.c;
    var t, array;
    if (digsim.placeholders[r][c] instanceof Array &&
        typeof digsim.placeholders[r][c][d] !== 'undefined') {
        return false;
    }
    switch (d)
    {
        case 0: // moving up
            array = digsim.placeholders[r-1][c];
            t =    (typeof array[0] === 'undefined') &&
                   (typeof array[1] !== 'undefined' && digsim.components.getComponent(array[1].ref).type === digsim.WIRE) &&
                   (typeof array[2] === 'undefined') &&
                   (typeof array[3] !== 'undefined' && digsim.components.getComponent(array[3].ref).type === digsim.WIRE);
                   // console.log("("+c+","+(r-1)+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return ((r - 1) === target.r && c === target.c) ? true : t;
        case 1: // moving right
            array = digsim.placeholders[r][c+1];
            t =    (typeof array[0] !== 'undefined' && digsim.components.getComponent(array[0].ref).type === digsim.WIRE) &&
                   (typeof array[1] === 'undefined') &&
                   (typeof array[2] !== 'undefined' && digsim.components.getComponent(array[2].ref).type === digsim.WIRE) &&
                   (typeof array[3] === 'undefined');
                   // console.log("("+(c+1)+","+r+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return (r === target.r && (c + 1) === target.c) ? true : t;
        case 2: // moving down
            array = digsim.placeholders[r+1][c];
            t =    (typeof array[0] === 'undefined') &&
                   (typeof array[1] !== 'undefined' && digsim.components.getComponent(array[1].ref).type === digsim.WIRE) &&
                   (typeof array[2] === 'undefined') &&
                   (typeof array[3] !== 'undefined' && digsim.components.getComponent(array[3].ref).type === digsim.WIRE);
                   // console.log("("+c+","+(r+1)+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return ((r + 1) === target.r && c === target.c) ? true : t;
        default: // moving left
            array = digsim.placeholders[r][c-1];
            t =    (typeof array[0] !== 'undefined' && digsim.components.getComponent(array[0].ref).type === digsim.WIRE) &&
                   (typeof array[1] === 'undefined') &&
                   (typeof array[2] !== 'undefined' && digsim.components.getComponent(array[2].ref).type === digsim.WIRE) &&
                   (typeof array[3] === 'undefined');
                   // console.log("("+(c-1)+","+r+") is "+(t?"":"not ")+"valid for current ("+c+","+r+")");
                   return (r === target.r && (c - 1) === target.c) ? true : t;
    }
};

/**************************************************************************************************************
 *      /$$$$$$            /$$                           /$$     /$$
 *     /$$__  $$          |__/                          | $$    |__/
 *    | $$  \ $$ /$$$$$$$  /$$ /$$$$$$/$$$$   /$$$$$$  /$$$$$$   /$$  /$$$$$$  /$$$$$$$
 *    | $$$$$$$$| $$__  $$| $$| $$_  $$_  $$ |____  $$|_  $$_/  | $$ /$$__  $$| $$__  $$
 *    | $$__  $$| $$  \ $$| $$| $$ \ $$ \ $$  /$$$$$$$  | $$    | $$| $$  \ $$| $$  \ $$
 *    | $$  | $$| $$  | $$| $$| $$ | $$ | $$ /$$__  $$  | $$ /$$| $$| $$  | $$| $$  | $$
 *    | $$  | $$| $$  | $$| $$| $$ | $$ | $$|  $$$$$$$  |  $$$$/| $$|  $$$$$$/| $$  | $$
 *    |__/  |__/|__/  |__/|__/|__/ |__/ |__/ \_______/   \___/  |__/ \______/ |__/  |__/
 *
 *
 *
 ***************************************************************************************************************/

/*****************************************************************************
 * ANIMATE
 *  Draw the selected Component onto the Moving canvas.
 ****************************************************************************/
function animate() {
    // Only animate if dragging a Component
    if (digsim.dragging === false) {
        return;
    }

    requestAnimFrame(animate);

    var context = digsim.movingContext;
    digsim.clearCanvas(context, true);

    // Keep the Component where the user clicked on it
    var row = digsim.getMouseRow();
    var col = digsim.getMouseCol();
    var comp = digsim.selectedComponent;

    // Only allow Wires to move either horizontal or vertical
    if (comp.type === digsim.WIRE && comp.dy)
        comp.col = col - digsim.dragOffset.col;
    else if (comp.type === digsim.WIRE && comp.dx)
        comp.row = row - digsim.dragOffset.row;
    else {
        comp.col = col - digsim.dragOffset.col;
        comp.row = row - digsim.dragOffset.row;
    }

    comp.draw(context, 'red');

    // Keep Components connected by drawing Wires between them
    var start, target, path, i, len2;
    for (i in digsim.connectionStarts) {
        if (digsim.connectionStarts.hasOwnProperty(i)) {
            start = digsim.connectionStarts[i];
            target = digsim.connectionTargets[i];

            target = {'r': comp.row + target.r, 'c': comp.col + target.c};

            if (start.r >= 0 && target.r >= 0)
                path = digsim.route(start, target, true);

            // Draw wire
            if (path) {
                context.beginPath();
                context.moveTo((start.c + 0.5) * digsim.gridSize, (start.r + 0.5) * digsim.gridSize);

                for (i = 0, len2 = path.length; i < len2; ++i) {
                    context.lineTo((path[i].x + 0.5) * digsim.gridSize, (path[i].y + 0.5) * digsim.gridSize);
                }
                context.stroke();
            }
        }
    }
}

/*****************************************************************************
 * ANIMATE WIRE
 *  Draw a Wire being placed onto the Moving canvas.
 ****************************************************************************/
function animateWire() {
    // Only animate if dragging a Wire
    if (!digsim.dragging || digsim.mode !== digsim.WIRE_MODE) {
        return;
    }

    requestAnimFrame(animateWire);

    var context = digsim.movingContext;
    digsim.clearCanvas(context);

    var row = digsim.getMouseRow();
    var col = digsim.getMouseCol();

    // Draw wire
    context.fillStyle   = '#3399FF';
    context.strokeStyle = '#3399FF';
    context.lineWidth   = 2;
    context.lineCap     = 'round';

    context.beginPath();
    context.arc(digsim.wireStart.col * digsim.gridSize, digsim.wireStart.row * digsim.gridSize, 2, 0, 2 * Math.PI);
    context.fill();
    context.moveTo(digsim.wireStart.col * digsim.gridSize, digsim.wireStart.row * digsim.gridSize);

    var x = (col + 0.5) * digsim.gridSize;
    var y = (row + 0.5) * digsim.gridSize;

    context.lineTo(x, y);
    context.stroke();
}

/*****************************************************************************
 * CLOCK CYCLE
 *  Animate function for the Clock Component.
 ****************************************************************************/
function cycleClock() {
    // Only animate when in SIM_MODE
    if (digsim.mode !== digsim.SIM_MODE) {
        return;
    }

    requestAnimFrame(cycleClock);
    ++digsim.clkCnt;

    for (var i = 0, len = digsim.drivers.length; i < len; ++i) {
        var driver = digsim.components.getComponent(digsim.drivers[i]);

        if (driver.type === digsim.CLOCK && (digsim.clkCnt % (60 / driver.frequency)) === 0) { // FPS is approximately 60 Hz
            digsim.passCounter = 0;
            driver.passState(!driver.state);
            digsim.drawAllComponents();
        }
    }

    // Reset counter to prevent number overflow
    digsim.clkCnt %= 60;
}

/*****************************************************************************
 * REQUEST ANIMATION FRAME
 *  Optimizes the 60 fps animation frame rate relative to the browser.
 ****************************************************************************/
window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback, element){
                window.setTimeout(callback, 1000 / 60);
            };
})();

/**************************************************************************************************************
 *     /$$$$$$$            /$$
 *    | $$__  $$          | $$
 *    | $$  \ $$  /$$$$$$ | $$$$$$$  /$$   /$$  /$$$$$$
 *    | $$  | $$ /$$__  $$| $$__  $$| $$  | $$ /$$__  $$
 *    | $$  | $$| $$$$$$$$| $$  \ $$| $$  | $$| $$  \ $$
 *    | $$  | $$| $$_____/| $$  | $$| $$  | $$| $$  | $$
 *    | $$$$$$$/|  $$$$$$$| $$$$$$$/|  $$$$$$/|  $$$$$$$
 *    |_______/  \_______/|_______/  \______/  \____  $$
 *                                             /$$  \ $$
 *                                            |  $$$$$$/
 *                                             \______/
 *     /$$$$$$$$                                 /$$     /$$
 *    | $$_____/                                | $$    |__/
 *    | $$       /$$   /$$ /$$$$$$$   /$$$$$$$ /$$$$$$   /$$  /$$$$$$  /$$$$$$$   /$$$$$$$
 *    | $$$$$   | $$  | $$| $$__  $$ /$$_____/|_  $$_/  | $$ /$$__  $$| $$__  $$ /$$_____/
 *    | $$__/   | $$  | $$| $$  \ $$| $$        | $$    | $$| $$  \ $$| $$  \ $$|  $$$$$$
 *    | $$      | $$  | $$| $$  | $$| $$        | $$ /$$| $$| $$  | $$| $$  | $$ \____  $$
 *    | $$      |  $$$$$$/| $$  | $$|  $$$$$$$  |  $$$$/| $$|  $$$$$$/| $$  | $$ /$$$$$$$/
 *    |__/       \______/ |__/  |__/ \_______/   \___/  |__/ \______/ |__/  |__/|_______/
 *
 *
 *
 **************************************************************************************************************/
Digsim.prototype.debug = {
    /*****************************************************************************
     * SHOW PLACEHOLDERS
     *  Debug method used to see placeholder objects visually on the grid.
     ****************************************************************************/
    showPlaceholders: function() {
        digsim.clearCanvas(digsim.gridContext);
        digsim.drawGrid(digsim.gridContext);

        var row = 0;
        var col = 0;
        var r, c;

        digsim.gridContext.fillStyle = 'black';
        digsim.gridContext.font = "10pt Calibri";

        // Output row numbers
        for (r = 0; r < digsim.NUM_ROWS; r++) {
            row = r;
            digsim.gridContext.fillText(row, digsim.gridSize / 2 - 10, row * digsim.gridSize + digsim.gridSize / 2 + 10);
        }
        // Output col numbers
        for (c = 0; c < digsim.NUM_COLS; c++) {
            col = c;
            digsim.gridContext.fillText(col, col * digsim.gridSize + digsim.gridSize / 2 - 10, digsim.gridSize / 2 + 10);
        }

        // Loop through placeholders array looking for placeholders to draw
        for (r = 0; r < digsim.NUM_ROWS; r++) {
            for (c = 0; c < digsim.NUM_COLS; c++) {
                row = r;
                col = c;

                // Draw Wire placeholders
                if (digsim.placeholders[row] && digsim.placeholders[row][col] instanceof Array) {
                    for (var z = 0; z < 4; z++) {
                        if (digsim.placeholders[row][col][z]) {
                            digsim.gridContext.save();
                            digsim.gridContext.translate(col * digsim.gridSize, row * digsim.gridSize);

                            // Rotate to the proper index
                            digsim.gridContext.translate(digsim.gridSize / 2, digsim.gridSize / 2);
                            digsim.gridContext.rotate((90 * z) * Math.PI / 180);
                            digsim.gridContext.translate(-digsim.gridSize / 2, -digsim.gridSize / 2);

                            // Draw a triangle
                            digsim.gridContext.fillStyle = 'orange';
                            digsim.gridContext.beginPath();
                            digsim.gridContext.moveTo(0,0);
                            digsim.gridContext.lineTo(digsim.gridSize, 0);
                            digsim.gridContext.lineTo(digsim.gridSize / 2, digsim.gridSize / 2);
                            digsim.gridContext.closePath();
                            digsim.gridContext.stroke();
                            digsim.gridContext.fill();
                            digsim.gridContext.restore();

                            // Display placeholder ref
                            digsim.gridContext.font = "10pt Calibri";
                            digsim.gridContext.fillStyle = 'black';
                            digsim.gridContext.fillText(digsim.placeholders[row][col][z].ref,
                                                        col * digsim.gridSize + digsim.gridSize / 2 - (z % 2 * 10),
                                                        row * digsim.gridSize + digsim.gridSize / 2 + (z % 2 * 10));
                        }
                    }
                }
                // Draw Component placeholder
                else if (digsim.placeholders[row] && digsim.placeholders[row][col]) {
                    // Draw a rectangle
                    digsim.gridContext.fillStyle = 'orange';
                    digsim.gridContext.fillRect(col * digsim.gridSize + 1,
                                                row * digsim.gridSize + 1,
                                                digsim.gridSize - 1, digsim.gridSize - 1);

                    // Display placeholder ref
                    digsim.gridContext.font = "18pt Calibri";
                    digsim.gridContext.fillStyle = 'black';
                    digsim.gridContext.fillText(digsim.placeholders[row][col].ref,
                                                col * digsim.gridSize + digsim.gridSize / 2 - 10,
                                                row * digsim.gridSize + digsim.gridSize / 2 + 10);
                }
            }
        }
    },

    /*****************************************************************************
     * OUTPUT NET LIST
     *  Debug method used to output the connections of Components.
     ****************************************************************************/
    outputNetList: function() {
        var comps = digsim.components.get();
        var comp;
        for (var i = 0, len = comps.length; i < len; i++) {
            comp = comps[i];
            console.log("ID: " + comp.id + "   TYPE: " + comp.name);

            // Output Wire connections
            if (comp.connections) {
                console.log("CONNECTIONS");
                console.log(comp.connections.get());
            }

            console.log("===INPUTS===");
            console.log(comp.inputs.get());
            console.log("===OUTPUTS===");
            console.log(comp.outputs.get());
            console.log("");
        }
    }
};

/**************************************************************************************************************
 *     /$$$$$$$$                       /$$
 *    |__  $$__/                      | $$
 *       | $$     /$$$$$$   /$$$$$$$ /$$$$$$
 *       | $$    /$$__  $$ /$$_____/|_  $$_/
 *       | $$   | $$$$$$$$|  $$$$$$   | $$
 *       | $$   | $$_____/ \____  $$  | $$ /$$
 *       | $$   |  $$$$$$$ /$$$$$$$/  |  $$$$/
 *       |__/    \_______/|_______/    \___/
 *
 *
 *
 *     /$$$$$$$$                                 /$$     /$$
 *    | $$_____/                                | $$    |__/
 *    | $$       /$$   /$$ /$$$$$$$   /$$$$$$$ /$$$$$$   /$$  /$$$$$$  /$$$$$$$   /$$$$$$$
 *    | $$$$$   | $$  | $$| $$__  $$ /$$_____/|_  $$_/  | $$ /$$__  $$| $$__  $$ /$$_____/
 *    | $$__/   | $$  | $$| $$  \ $$| $$        | $$    | $$| $$  \ $$| $$  \ $$|  $$$$$$
 *    | $$      | $$  | $$| $$  | $$| $$        | $$ /$$| $$| $$  | $$| $$  | $$ \____  $$
 *    | $$      |  $$$$$$/| $$  | $$|  $$$$$$$  |  $$$$/| $$|  $$$$$$/| $$  | $$ /$$$$$$$/
 *    |__/       \______/ |__/  |__/ \_______/   \___/  |__/ \______/ |__/  |__/|_______/
 *
 *
 *
 ***************************************************************************************************************/

Digsim.prototype.test = {
    /*****************************************************************************
     * VALIDATE SCHEMATIC
     *  Validate a schematic based on a truth table.
     * @param {string} truthTable - Truth table for the schematic.
     *                              Format:
     *                              "A B C\n
     *                               0 0 1\n
     *                               0 1 1\n
     *                               1 0 1\n
     *                               1 1 0"
     *                              Where both A and B are Drivers and C is an LED.
     ****************************************************************************/
    validateSchematic: function(truthTable) {
        var comps = digsim.components.get();
        var labels = {};
        var array = [];
        var results = {};
        var component = {};
        var i, j, len, comp, rows, headers, cols, valid;

        digsim.mode = digsim.SIM_MODE;

        // Count the number of connections, inputs, and outputs of the schematic
        digsim.maxSchematicLoop = 0;
        for (j = 0, len = comps.length; j < len; ++j) {
            comp = comps[j];
            comp.reset();

            // Count the number of possible pass through the current schematic could have
            if (comp.type === digsim.WIRE) {
                digsim.maxSchematicLoop += comp.connections.length();

                // Reset input/output connections for a Wire
                comp.inputs.clear(false);
                comp.outputs.clear(false);
            }
            else
                digsim.maxSchematicLoop += comp.numInputs + comp.numOutputs;

            labels[comp.label] = comp.id;
        }
        // Define a safety buffer to pass through
        digsim.maxSchematicLoop *= 3;

        rows = truthTable.split(/\r?\n/);
        headers = rows[0].split(' ');

        // Get the Component associated with the header label
        for (i = 0; i < headers.length; i++) {
            component = digsim.components.getComponent(labels[headers[i]]);

            if (component) {
                array.push(component);

                if (component.isADriver()) {
                    component.traverseConnections();
                }
            }
        }

        // If we don't have all the components, through an error
        if (headers.length !== array.length) {
            // Find each header that is missing
            var found;
            for (i = 0; i < headers.length; i++) {
                found = false;
                for (j = 0; j < array.length; j++) {
                    if (headers[i] === array[j].label) {
                        found = true;
                    }
                }

                if (!found)
                    console.warn("Cannot validate schematic; No Component labeled " + headers[i]);
            }

            digsim.mode = digsim.DEFAULT_MODE;
            return;
        }

        // Loop through each row of the truth table
        for (i = 1; i < rows.length; i++) {
            cols = rows[i].split(' ');

            // Reset all switches
            for (j = 0; j < array.length; j++) {
                if (array[j] && array[j].isADriver()) {
                    array[j].passState(0);
                }
            }

            // Pass state of each column
            for (j = 0; j < cols.length; j++) {
                component = array[j];
                digsim.passCounter = 0;

                if (component && component.isADriver()) {
                    component.passState(parseInt(cols[j], 10));
                }
                else if (component && component.type === digsim.LED) {
                    valid = (component.state == parseInt(cols[j], 10));
                    //console.warn("ROW " + i + ": " +  valid);
                    results[cols.join(", ")] = valid;
                }
            }
        }

        digsim.mode = digsim.DEFAULT_MODE;
        return results;
    }
};

/*****************************************************************************
 * NAMESPACE
 *  Create namespace for the application. If namespace already exists, don't
 *  override it
 ****************************************************************************/
var digsim = digsim || new Digsim();

