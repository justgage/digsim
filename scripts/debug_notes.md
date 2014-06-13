# Bugs 
These are notes about the bugs I've found in digsim.

# 1)  TypeError: Cannot read property 'type' of undefined
Found in: `Digsim.prototype.checkAdj` about line 2523
Reproduce: manipulating wires (only happens somtimes though)

---- Wed May 14 08:55:11 MDT 2014 ----

The function `digsim.components.getComponent` will sometimes return undefined when the index inside the componentList doesn't exist. What I haven't discovered is _why_ it gets deleted.

It's usually caused from manipulating wires in a way that makes them have very little choice of where to go. Perhaps it's deleting them when it tries to merge or something.

##Places of deletion:
digsim.js
``
Digsim.prototype.deleteComponent = function(comp) {
   ...
   this.components.remove(comp, false); 
   ...
``

``
Digsim.prototype.onMouseUp = function(event) {
   ....
   // Wire was merged out
   if (connectedComp.path.x === 0 && connectedComp.path.y === 0) {
      digsim.components.remove(connectedComp);
   }
   ...
``

# 2) console.assert(typeof connectedComp !== "undefined", "Gage: Connected component is undefined?");

found in: digsim.js in` Digsim.prototype.onMouseUp`
line: ~870

``
connectedComp = digsim.components.getComponent(i);
...
connectedComp.deleteConnections();
connectedComp.checkConnections();
``

Note the fact that it uses the exact same function as Error (1) which means there's probably both related.

which means that the real issue is probably somewhere in


# 3) digsim.placeholder doesn't exist

What: When moving wires they seem to dissapear and reapear randomly this usually happens after 1)
Found in: digsim.js `Digsim.prototype.route` about line 2231
Reproduce: caused by moving wires.
Questions:
- Should the row always exist?
- where is it deleted?

``
Digsim.prototype.route = function(startRef, targetRef, returnPath, obj) {
   ...
    console.assert(typeof placeholders[target.r] !== "undefined", "digsim.placeholder doesn't exist");

    if ( typeof placeholders[target.r][target.c] !== 'undefined' || digsim.mode === digsim.DEFAULT_MODE ) {
        digsim.endRoute = true;
    }
    else {
        digsim.endRoute = false;
    }

``

# Components are still connected after clear

what: even after pushing "New" to clear the page digsim draws lines where wires used to be placed esppesially when you drag the component outside the canvas.

I think this may be due to prototype problem.

when: usually after 1




#console.assert(typeof comp !== "undefined", "Gage: Component is undefined (so we can't split it)");

This is caused by there being no way to route.

``
iUncaught TypeError: Cannot read property 'type' of undefined digsim-all.js:406
Component.checkConnections digsim-all.js:406
ComponentList.add digsim-all.js:760
Component.checkConnections digsim-all.js:390
Wire.checkConnections digsim-all.js:3089
Wire.mergeWires digsim-all.js:3125
Wire.checkConnections digsim-all.js:3075
Wire.splitWire digsim-all.js:3159
Wire.checkConnections digsim-all.js:3083
Digsim.onMouseUp digsim-all.js:4265
p.event.dispatch jquery.min.js:2
p.event.add.g.handle.h


--- Thu Jun 12 18:36:57 MDT 2014 ---

Today I found that there where tons of array checks that where trying to use instanceof I changed them all to vaid ones. 

Also worked on some places where type checking wasn't done.
``
