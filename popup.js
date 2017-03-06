/*******************************************************************************
*
* HTTPS Mixed Content Locator Popup JS
* ____________________________________
* [2017] Pericror
* All Rights Reserved
* Use of this source code is governed by the license found in the LICENSE file.
*/

// Function bound to locate button that requests content.js to highlight element
function handleLocateClick(e) {
    var locateButton = e.target;
    var prevLocated = document.getElementsByClassName('clicked')[0];
    // Highlight only the last last locate button clicked
    if(prevLocated != undefined)
    {
        if(prevLocated === locateButton)
        {
            prevLocated.classList.toggle('clicked');
        }
        else
        {
            prevLocated.classList.remove('clicked');
            locateButton.classList.add('clicked');
        }
    }
    else
    {
        locateButton.classList.add('clicked');
    }
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {from: 'popup', subject: 'Highlight',
            nodeName: locateButton.dataset['nodeName'], 
            url: locateButton.dataset['url'],
            type: locateButton.dataset['type'] });
    });
}

// Function bound to clipboard button that provides visual feedback
function handleClipboardClick(e) {
    var clipboardButton = e.target;
    clipboardButton.classList.add('copied');
    setTimeout(function(){clipboardButton.classList.remove('copied')}, 375);
}

// Populates the popup with rows of mixed content
function populateTable(id, highlight, mixedContent)
{   
    document.getElementById(id).style.display = 'block';
    var table = document.getElementsByName(id)[0];
    table.style.display = 'table';
    
    // Sort mixed content by tag type
    mixedContent.sort(function(a, b) {
        var x = a.nodeName; var y = b.nodeName;
        return ((x < y) ? -1 : ((x > y) ? 1 : 0))});
    
    for (i = 0; i < mixedContent.length; i++) {
        // Create the table row describing the mixed content
        var content = mixedContent[i];
        var row = table.insertRow();
        row.className = "row";
        var tag = row.insertCell();
        tag.className = "data tag";
        tag.innerHTML = content.nodeName;
        var type = row.insertCell();
        type.className = "data type";
        type.innerHTML = content.type;
        var url = row.insertCell();
        url.className = "data url";
        if(content.url.length > 37)
        {
            url.innerHTML = "..." +
                content.url.substr(content.url.length - 37, content.url.length);
        }
        else
        {
            url.innerHTML = content.url;
        }
        // Create the copy button to copy the url to clipboard
        var clipboard = row.insertCell();
        clipboard.className = "clipboard"
        clipboard.innerHTML = '<button class="material-icons">content_copy</button>';
        clipboard.dataset['clipboardText'] = content.url;
        clipboard.onclick = handleClipboardClick;       
        // Create the locate button if element can be highlighted
        if(highlight) {
            var locate = row.insertCell();
            locate.className = "locate";
            var locateButton = document.createElement('button');
            locateButton.className = "material-icons";
            locateButton.innerHTML = 'gps_fixed';
            locateButton.onclick = handleLocateClick;
            locateButton.dataset['nodeName'] = content.nodeName;
            locateButton.dataset['url'] = content.url;
            locateButton.dataset['type'] = content.type;
            locate.appendChild(locateButton);
        }
    }
}

// Callback to handle mixed content found by content.js
function handleMixedContent(mixedContent) {
	passiveMixedContent = mixedContent['passiveMixedContent'];
	activeMixedContent = mixedContent['activeMixedContent'];
    console.log(mixedContent);

    if( passiveMixedContent.length > 0) {
        populateTable('passiveMixedContent', true, passiveMixedContent);
    }

    if ( activeMixedContent.length > 0) {
        populateTable('activeMixedContent', false, activeMixedContent);        
  	}
    
    // If no mixed content on page display default message
    if(passiveMixedContent.length == 0 && activeMixedContent.length == 0)
    {
        var defaultMessage = document.getElementById('default');
        if(!mixedContent['https'])
        {
            defaultMessage.innerHTML = '<i class="material-icons">info_outline</i>' + 
                'HTTP page, mixed content does not apply.';
        }
        defaultMessage.style.display = 'block';
        var footer = document.getElementById('footer');
        footer.style.display = 'none';
    }
}

// Load page in new tab
function loadPage() {
    chrome.runtime.sendMessage({
        from:    'popup',
        subject: 'showLink'
    });
}

var clipboard;
window.onload = function() {
    document.getElementsByTagName("a")[0].onclick = loadPage;
    clipboard = new Clipboard('.clipboard');
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {from: 'popup', subject: 'GetMixedContent'},
            handleMixedContent);
        // Connect to content to fire disconnect event when the popup closes
        chrome.tabs.connect(tabs[0].id);
    });
}

window.onunload = function(){
    clipboard.destroy();
}