var draw;
var hubs = {};
var lines = {};

var hubAtPtr;

var isConnMode = false;

var selectedId;

var connFromId;

var connLine;

var potConnToId;

var conn = []

function onDeselectClick() {
    if (!selectedId)
        return;

    selectedHub = hubs[selectedId];
    selectedHub.attr({ 'stroke-width': 0 })
    selectedHub.attr({ stroke: 'blue' })
    selectedHub.draggable(false);

    selectedId = undefined;
}

function onHubDblClick(id) {

    hubs[id].remove();
    delete hubs[id];

    for(let i=conn.length - 1; i>=0; i--) {
        var cn = conn[i];
        console.log(conn);

        if (cn[0] === id || cn[1] === id){
            var line = lines[cn[2]]; 
            line.remove();
            delete lines[cn[2]];    
            
            conn.splice(i, 1)
        }

        console.log(conn);
    }

    selectedId = undefined;

    isConnMode = false;
    hubAtPtr = undefined;
}

function getNextHubId() {
    if (hubs && Object.keys(hubs).length > 0)
        return Math.max(...Object.keys(hubs).map(Number)) + 100;
    else
        return 100;
}

function getNextLineId() {
    if (lines && Object.keys(lines).length > 0)
        return Math.max(...Object.keys(lines).map(Number)) + 100;
    else
        return 100;
}

function onNodeClick(id) {
    if (selectedId) {
        selectedHub = hubs[selectedId];
        selectedHub.attr({ stroke: 'blue' })
        selectedHub.attr({ 'stroke-width': 0 })
        selectedHub.draggable(false);
    }

    if (id !== selectedId) {
        selectedId = id;

        selectedHub = hubs[selectedId];
        selectedHub.attr({ stroke: 'orange' })
        selectedHub.attr({ 'stroke-width': 3 })
        
        selectedHub.draggable()
    }
    else {
        selectedId = undefined;
    }
}

function onNodeMouseDown(id) {
    if (id == selectedId)
        return;

    isConnMode = true;
    connFromId = id;

    hub = hubs[id];

    var cx = hub.cx()
    var cy = hub.cy()

    connLine = draw.line(cx, cy, cx, cy).stroke({ width: 3 }).attr({ stroke: 'gray' })

    connLine.insertBefore(hubs[Object.keys(hubs)[0]]);
}

function onNodeMouseUp(id) {
    if (isConnMode && id !== connFromId) {
        var hub = hubs[id]; 
        connLine.attr({x2: hub.cx()});
        connLine.attr({y2: hub.cy()});
        connLine.attr({stroke: 'blue'});
        var lineId = getNextLineId();
        lines[lineId] = connLine;
        conn.push([connFromId, id, lineId]);
        connLine = undefined;
        isConnMode = false;
        
        if (potConnToId)
            hubs[potConnToId].attr({ fill: 'blue' });
    }

    console.log('conn', conn);
}

function onNodeMouseOver(id) {
    hubAtPtr = id;

    if (isConnMode && id !== connFromId) {
        potConnToId = id;
        hubs[id].attr({ fill: 'green' });
        connLine.attr({ stroke: 'green' });
    }
}

function onNodeMouseOut(id) {
    hubAtPtr = undefined;

    hubs[id].attr({ fill: 'blue' });

    if (isConnMode && id !== connFromId) {
        connLine.attr({ stroke: 'gray' });
    }
}

function onHubDragMove(id) {
    for (let cn of conn) {
        if (cn[0] === id) {
            var line = lines[cn[2]];
            var hub = hubs[cn[0]] 
            line.attr({ x1: hub.cx() });
            line.attr({ y1: hub.cy() });    
        }

        if (cn[1] === id) {
            var line = lines[cn[2]];
            var hub = hubs[cn[1]] 
            line.attr({ x2: hub.cx() });
            line.attr({ y2: hub.cy() });    
        }
    }
}

function onDrawMouseUp(e){
    if (connLine) {
        connLine.remove();
    }

    console.log(isConnMode);

    if (isConnMode) {
        isConnMode = false;
    }
    else {
        if (!hubAtPtr) {
            var hub = draw.circle(20, 20).center(e.offsetX,e.offsetY).attr({ fill: 'blue' })
            var id = getNextHubId();

            hub.mousedown(() => onNodeMouseDown(id));
            hub.mouseup(() => onNodeMouseUp(id));
            //circ.mouseup(() => isDragMode = false);

            hub.mouseover(() => onNodeMouseOver(id));
            hub.mouseout(() => onNodeMouseOut(id));

            hub.dblclick(() => onHubDblClick(id));
            
            hub.on('dragstart.namespace', () => isConnMode = false);
            hub.on('dragmove.namespace', () => onHubDragMove(id));

            hub.click(() => onNodeClick(id));
            hubs[id] = hub;
        }

    }
}

function onDrawMouseMove(e){
    if (isConnMode) {
        //console.log(isConnectMode, e.offsetX, e.offsetY);
        var x1 = connLine.attr('x1');
        var y1 = connLine.attr('y1');

        connLine.attr({ x2: e.offsetX  + (e.offsetX > x1 ? -1 : 1)  });
        connLine.attr({ y2: e.offsetY  + (e.offsetY > y1 ? -1 : 1) });
    }
} 


SVG.on(document, 'DOMContentLoaded', function() {

    draw = SVG().addTo('#canvas').size('100%', '100%')

    draw.mousemove((e) => onDrawMouseMove(e));
    draw.mouseup((e) => onDrawMouseUp(e));
})