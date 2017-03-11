/*******************************************************************************
*
* HTTPS Mixed Content Locator Background JS
* _________________________________________
* [2017] Pericror
* All Rights Reserved
* Use of this source code is governed by the license found in the LICENSE file.
*/

chrome.runtime.onMessage.addListener(function (msg, sender) {
    if ((msg.from === 'popup') && (msg.subject === 'showLink')) {
        chrome.tabs.create({
            url : "https://www.pericror.com/"
        });
    }
});

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && tab.active) {
        chrome.tabs.sendMessage(tabId, {from: 'background', subject: 'GetNumberOfMixedContentElements'},
            updatebadge);
    }
});

chrome.tabs.onActivated.addListener( function (activeInfo) {
    chrome.tabs.sendMessage(activeInfo.tabId, {from: 'background', subject: 'GetNumberOfMixedContentElements'},
            updatebadge);
});

function updatebadge(mixedContentDetected) {
    if (mixedContentDetected == 0) {
        chrome.browserAction.setBadgeText({'text' : ''});
    } else {
        chrome.browserAction.setBadgeText({'text' : mixedContentDetected.toString()});
        chrome.browserAction.setBadgeBackgroundColor({'color' : '#CA2E0B'});
    }
}