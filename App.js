var draw;
var hubs = {};
var lines = {};
var conn = [];

var hubAtPtr;
var lineAtPtr;

var isConnMode = false;

var selectedHubId;
var selectedLineId;

var connFromId;

var connLine;

var potConnToId;

const inactive_color = 'gray'
const restricted_color = '#DC143C'
const default_color = 'blue'
const conn_hl_color = '#00FF00'
const selection_color = 'orange'

const default_hub_radius = 10;
const hover_hub_radius = 12;

const default_line_width = 3;
const hover_line_width = 6;

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

function onLineMouseOver(id) {
    lineAtPtr = id;
    if (!isConnMode) {
        lines[id].attr({ 'stroke-width': hover_line_width });
    }
}

function onLineMouseOut(id) {
    lineAtPtr = undefined;
    if (!isConnMode) {
        lines[id].attr({ 'stroke-width': default_line_width });
    }
}

function selectLine(id) {
    if (id) {
        selectedLine = lines[id];
        selectedLine.attr({ stroke: selection_color });
        
        selectedLineId = id;
    }
}

function deselectSelectedLine() {
    if (selectedLineId) {
        selectedLine = lines[selectedLineId];
        selectedLine.attr({ stroke: default_color })
        
        selectedLineId = undefined;
    }
}

function selectHub(id) {
    if (id) {
        selectedHub = hubs[id];
        selectedHub.attr({ fill: selection_color })

        selectedHub.draggable();

        selectedHubId = id;
    }
}

function deselectSelectedHub() {
    if (selectedHubId) {
        selectedHub = hubs[selectedHubId];
        selectedHub.attr({ fill: default_color })

        selectedHub.draggable(false);
        
        selectedHubId = undefined;
    }
}

function onLineClick(id) {
    deselectSelectedHub();

    var saved_slid = selectedLineId;
    deselectSelectedLine();
    
    if (id !== saved_slid)
        selectLine(id);
}

function onLineDblClick(id) {

    lines[id].remove();
    delete lines[id];

    conn = conn.filter(cn => cn[2] !== id);

    selectedLineId = undefined;
    lineAtPtr = undefined;

    isConnMode = false;
}

function onHubClick(id) {
    deselectSelectedLine();

    var saved_shid = selectedHubId;
    deselectSelectedHub();
    
    if (id !== saved_shid)
        selectHub(id);
}

function onHubDblClick(id) {

    hubs[id].remove();
    delete hubs[id];

    var conn_to_remove = conn.filter(cn => cn[0] === id || cn[1] === id);
    console.log(conn_to_remove);
    for (var cn of conn_to_remove) {
        lines[cn[2]].remove();
        delete lines[cn[2]];
    }

    conn = conn.filter(cn => !conn_to_remove.includes(cn));

    selectedLineId = undefined;
    selectedHubId = undefined;
    hubAtPtr = undefined;

    isConnMode = false;
}

function onHubMouseDown(id) {
    if (id == selectedHubId)
        return;

    isConnMode = true;
    connFromId = id;

    hub = hubs[id];

    var cx = hub.cx()
    var cy = hub.cy()

    connLine = draw.line(cx, cy, cx, cy);
    connLine.attr({ stroke: inactive_color, 'stroke-width': default_line_width })

    connLine.insertBefore(hubs[Object.keys(hubs)[0]]);
}

function onHubMouseUp(id) {
    if (!isConnMode)
        return;
    
    if (id === connFromId)
        return;
 
    hubs[id].attr({ fill: default_color });
 
    var isConnWithFrom = conn.filter(cn => 
        (cn[0] === connFromId && cn[1] === id) || 
        (cn[0] === id && cn[1] === connFromId)).length > 0;
    
    if (isConnWithFrom) {
        return;
    }

    var hub = hubs[id]; 
    connLine.attr({x2: hub.cx()});
    connLine.attr({y2: hub.cy()});
    connLine.attr({stroke: 'blue'});
    
    var lineId = getNextLineId();
    
    connLine.mouseover(() => onLineMouseOver(lineId));
    connLine.mouseout(() => onLineMouseOut(lineId));
    connLine.click(() => onLineClick(lineId));
    connLine.dblclick(() => onLineDblClick(lineId));
    
    lines[lineId] = connLine;
    
    conn.push([connFromId, id, lineId]);
    
    connLine = undefined;
    isConnMode = false;
    connFromId = undefined;
}

function onHubMouseOver(id) {
    hubAtPtr = id;

    if (isConnMode && id !== connFromId ) {
        var isConnWithFrom = conn.filter(cn => 
            (cn[0] === connFromId && cn[1] === id) || 
            (cn[0] === id && cn[1] === connFromId)).length > 0;
        
        if (isConnWithFrom){
            hubs[id].attr({ fill: restricted_color });
            connLine.attr({ stroke: restricted_color });
        }
        else {
            potConnToId = id;
            hubs[id].attr({ fill: conn_hl_color });
            connLine.attr({ stroke: conn_hl_color });
        }
    }

    hubs[id].radius(hover_hub_radius);
}

function onHubMouseOut(id) {
    hubAtPtr = undefined;

    if (isConnMode) {
        hubs[id].attr({ fill: default_color });
        if (id !== connFromId)
            connLine.attr({ stroke: inactive_color });
    }

    hubs[id].radius(default_hub_radius);
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

    if (isConnMode) {
        isConnMode = false;
    }
    else {
        if (!hubAtPtr && !lineAtPtr) {
            var diam = 2 * default_hub_radius;
            var hub = draw.circle(diam, diam)
            hub.center(e.offsetX,e.offsetY)
            hub.attr({ fill: default_color })
            var id = getNextHubId();

            hub.mousedown(() => onHubMouseDown(id));
            hub.mouseup(() => onHubMouseUp(id));

            hub.mouseover(() => onHubMouseOver(id));
            hub.mouseout(() => onHubMouseOut(id));

            hub.dblclick(() => onHubDblClick(id));
            
            hub.on('dragstart.namespace', () => isConnMode = false);
            hub.on('dragmove.namespace', () => onHubDragMove(id));

            hub.click(() => onHubClick(id));
            hubs[id] = hub;

            console.log(hub);
        }
    }
}

function onDrawMouseMove(e){
    if (isConnMode) {
        if (selectedHubId)
            deselectSelectedHub();
        
        if (selectedLineId)
            deselectSelectedLine();

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