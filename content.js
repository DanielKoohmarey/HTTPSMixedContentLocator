/*******************************************************************************
*
* HTTPS Mixed Content Locator Content JS
* ____________________________________
* [2017] Pericror
* All Rights Reserved
* Use of this source code is governed by the license found in the LICENSE file.
*/

//NOTE: Current limitation: Active mixed content 
// a. An insecure resource loaded from a style property
// b. XMLHTTPRequest
var passiveMixedContentTags = ["IMG", "AUDIO", "VIDEO", "SOURCE"];
var activeMixedContentTags = ["IFRAME", "SCRIPT"];
var lastHighlightedElem = null;

// Gets mixed content on current page
function getMixedContent() {
    var passiveMixedContent = [];
    var activeMixedContent = [];
    var https = false;
    
    if( window.location.href.startsWith('https') ) {
        https = true;
        
        var srcTags = Array.prototype.slice.call(
            document.querySelectorAll("*[src^='http://']"));
        for (i = 0; i < srcTags.length; i++) {
            var url = srcTags[i].getAttribute("src");
            if (passiveMixedContentTags.indexOf(srcTags[i].nodeName) > -1) {
                // Passive Mixed Content: audio, image, video, source
                passiveMixedContent.push({'nodeName' : srcTags[i].nodeName, 
                                        'url': url,
                                        'type': 'src',
                                        'blocked': false});
            } else if (activeMixedContentTags.indexOf(srcTags[i].nodeName) > -1) {
                // Active Mixed Content: iframe, script
                activeMixedContent.push({'nodeName' : srcTags[i].nodeName,
                                        'url': url,
                                        'type': 'src',
                                        'blocked': true});
            } 
        }

        // Active Mixed Content: object
        var objects = Array.prototype.slice.call(
            document.querySelectorAll("object[data^='http://']"));
        for (i = 0; i < objects.length; i++) {
            var url = objects[i].getAttribute("data");
            activeMixedContent.push({'nodeName' : objects[i].nodeName,
                                    'url': url,
                                    'type': 'data',
                                    'blocked': true});
        }
        
        // Active Mixed Content: link (stylesheet)
        var links = Array.prototype.slice.call(
            document.querySelectorAll("link[href^='http://']"));      
        for (i = 0; i < links.length; i++) {
            var url = links[i].getAttribute("href");
            if (links[i].getAttribute("rel") == "stylesheet") {
                activeMixedContent.push({'nodeName' : links[i].nodeName,
                                    'url': url,
                                    'type': 'href',
                                    'blocked': true});
            }
        }
    }
    
    return {'passiveMixedContent':passiveMixedContent,
            'activeMixedContent':activeMixedContent,
            'https':https};
}

// Removes locate element highlighting on the page
function clearHighlight() {
    var crosshairLines = document.getElementsByClassName("crosshairLine");
    if(crosshairLines.length == 4) {
        for( i = 0; i < 4; i++) {
           document.body.removeChild(crosshairLines[0]); 
        }           
    }

    if (lastHighlightedElem != null) {
        lastHighlightedElem.classList.remove('crosshairTarget');
    }
}

// Listen for disconnect when popup closes, clear any highlighting on page
chrome.runtime.onConnect.addListener(function(port){
    port.onDisconnect.addListener(function(e){
        clearHighlight();
        lastHighlightedElem = null;
    });
});

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.from == 'popup') {
        if (msg.subject == 'GetMixedContent') {
            var mixedContent = getMixedContent();
            if(mixedContent == undefined)
            {
                mixedContent = {'passiveMixedContent' : 0,
                                'activeMixedContent' : 0,
                                'https' : window.location.href.startsWith('https')};
            }
            sendResponse(mixedContent);
        } else if (msg.subject == 'Highlight') {
            clearHighlight();
            
            var query = msg.nodeName.toLowerCase() + '[' + msg.type + '^="' + msg.url + '"]';
            var highlightElem = document.querySelector(query);
        
            if(highlightElem !== lastHighlightedElem)
            {
                drawCrossHairs(highlightElem);
                lastHighlightedElem = highlightElem;           
            } else {
                lastHighlightedElem = null;
            }        
        }
    }
    else if(msg.from == 'background') {
        if (msg.subject == 'GetNumberOfMixedContentElements') {
            var mixedContent = getMixedContent();
            var mixedContentElements = mixedContent['passiveMixedContent'].length + 
                mixedContent['activeMixedContent'].length;
            sendResponse({mixedContentDetected : mixedContentElements, tabId : msg.tabId});
        }   
    }
});

/////////////////////////////////
// Crosshair highlighting code //
/////////////////////////////////

function getPosition(elem) {
    var rect = elem.getBoundingClientRect();
    return { x: rect.left, y: rect.top};
}

function getWidth() {
    return document.body.getBoundingClientRect().right;
}

function getHeight() {
    return document.body.getBoundingClientRect().bottom;
}

function getElementCrosshairLines(elem, pos) {
    var scrollY = window.scrollY;
    var width = elem.offsetWidth;
    var height = elem.offsetHeight;
    var xCenter = pos.x + Math.round(width/2);
    var yCenter = pos.y + Math.round(height/2) + scrollY;
    return [ {fromX: xCenter, fromY: 0,
           x: xCenter, y: pos.y + scrollY},
          {fromX: pos.x + width, fromY: yCenter,
           x: getWidth(), y: yCenter},
          {fromX: xCenter, fromY: pos.y + height + scrollY,
           x: xCenter, y: getHeight()},
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
    style.sheet.insertRule("div.crosshairLine{transform-origin:0 100%;\
                            height:2px;background:#00AEEF;box-shadow:0 0 5px #00AEEF;}", 0);
    style.sheet.insertRule(".crosshairTarget{box-shadow:0 0 15px #00AEEF;}", 0);
    var pos = getPosition(elem);
    var lines = getElementCrosshairLines(elem, pos);
    lines.forEach(function(line) {
        createLine(line.fromX, line.fromY, line.x, line.y);
    });
    
    elem.classList.add('crosshairTarget');
}
