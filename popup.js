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
    var prevLocated = document.getElementsByClassName('clicked');
    // Highlight the last last locate button clicked
    if(prevLocated.length > 0)
    {
        if(prevLocated[0] === locateButton)
        {
            prevLocated[0].classList.toggle('clicked');
        }
        else
        {
            prevLocated[0].classList.remove('clicked');
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

// Populates the popup with rows of mixed content
function populateTable(id, className, highlight, mixedContent)
{
    document.getElementById(id).style.display = 'block';
    var table = document.getElementsByName(id)[0];
    table.style.display = 'table';
    
    for (i = 0; i < mixedContent.length; i++) {
        var content = mixedContent[i];
        if (content.blocked != true) {
            var row = table.insertRow();
            row.className = className;
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
            var clipboard = row.insertCell();
            clipboard.className = "clipboard"
            clipboard.innerHTML = '<button class="material-icons">content_copy</button>';
            clipboard.dataset['clipboardText'] = content.url;
            clipboard.dataset['ariaLabel'] = 'Copied!'
        }
    }
}

// Callback to handle mixed content found by content.js
function handleMixedContent(mixedContent) {
	httpSources = mixedContent['sources'];
	httpLinks = mixedContent['links'];

    if( httpSources.length > 0) {
        var insecureElements = httpSources.filter(function(elem){return !elem.blocked;});
        if(insecureElements.length > 0)
        {
            populateTable('insecureElements', 'row', true, insecureElements);
        }
        
        var blockedElements = httpSources.filter(function(elem){return elem.blocked;});
        if(blockedElements.length > 0)
        {
            populateTable('blockedElements', 'row', false, blockedElements);
        } 
    }

    if ( httpLinks.length > 0) {
        var insecureLinks = httpLinks.filter(function(elem){return elem.blocked;});
        if(insecureLinks.length > 0)
        {
            populateTable('insecureLinks', 'row', false, insecureLinks);
        }  
        
        var blockedLinks = httpLinks.filter(function(elem){return !elem.blocked;});
        if(blockedLinks.length > 0)
        {
            populateTable('blockedLinks', 'row', false, blockedLinks);
        }          
  	}
    
    // If no mixed content on page display default message
    if(httpSources.length == 0 && httpLinks.length == 0)
    {
        var defaultMessage = document.getElementById('default');
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
