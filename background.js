
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: 'https://onlinebusiness.icbc.com/webdeas-ui/login;type=driver'
  }, (tab) => {
    chrome.storage.sync.set({[tab.id.toString()]: {}});
  });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === "CONTENT_HELLO")
      sendResponse({tabId: sender.tab.id});
  }
);

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.sendMessage(tabId, {type: "TAB_UPDATED", changeInfo, tab});
});