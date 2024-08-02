
var rect;
var draw;

function onHubButtonClick(){
    var circ = draw.circle(20, 20).attr({ fill: '#f06' })
    circ.draggable();
} 

function onMouseMove(){
    var circ = draw.circle(20, 20).attr({ fill: '#f06' })
    circ.draggable();
} 

SVG.on(document, 'DOMContentLoaded', function() {

    draw = SVG().addTo('#canvas').size('100%', '100%')

    draw.mousemove()

    rect.mousedown(() => console.log('rect down'));
    rect.mouseup(() => console.log('rect up'));

    rect.draggable();
})