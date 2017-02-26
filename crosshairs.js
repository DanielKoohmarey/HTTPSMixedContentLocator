function getPosition( el ) {
    var rect = elem.getBoundingClientRect();
    return { x: rect.left, y: rect.top};
}

function GetWidth() {
  return document.getElementsByTagName('body')[0].getBoundingClientRect().right;
}

function GetHeight() {
  return document.getElementsByTagName('body')[0].getBoundingClientRect().bottom
}

function GetElementCrosshairLines(elem, pos) {
             var width = elem.offsetWidth;
             var height = elem.offsetHeight;
             var xCenter = pos.x + Math.round(width/2);
             var yCenter = pos.y + Math.round(height/2);
             return [ {fromX: xCenter, fromY: 0,
                       x: xCenter, y: pos.y},
                      {fromX: pos.x + width, fromY: yCenter,
                       x: GetWidth(), y: yCenter},
                      {fromX: xCenter, fromY: pos.y + height,
                       x: xCenter, y: GetHeight()},
                      {fromX: 0, fromY: yCenter,
                       x: pos.x, y: yCenter } ]
}

// Modified from http://www.monkeyandcrow.com/blog/drawing_lines_with_css3/
function createLine(x1,y1, x2,y2){
    var length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
    var angle  = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    var transform = 'rotate('+angle+'deg)';

    var line = document.createElement("div");
    document.getElementsByTagName('body')[0].appendChild(line);
    line.className = 'crosshairLine';
    line.style.position = 'absolute';
    line.style.transform = transform;
    line.style.width = length.toString() + 'px';
    line.style.left = x1.toString() + 'px';
    line.style.top = y1.toString() + 'px';

    return line;
}

function drawCrossHairs(elem) {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    style.sheet.insertRule("div.crosshairLine{webkit-transform-origin:0 100%;\
                            transform-origin:0 100%;height:2px;background:red;\
                            -webkit-box-shadow: 0 0 5px red;\
                            box-shadow: 0 0 5px red;}", 0);
    
    var pos = getPosition(elem);
    var lines = GetElementCrosshairLines(elem, pos);
    lines.forEach(function(line) {
        createLine(line.fromX, line.fromY, line.x, line.y);
    });
    
    elem.style.boxShadow = "0 0 15px red";
}