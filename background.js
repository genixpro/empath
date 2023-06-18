const openAIAPIKey = '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';

function replaceText(newText, tab) {
  // Send a message to the content script to replace the selected text
  browser.tabs.sendMessage(tab.id, {
    action: "replaceText",
    newText: newText,
  });
}

function sendAlert(msg, tab) {
  // Send a message to the content script to replace the selected text
  browser.tabs.sendMessage(tab.id, {
    action: "alert",
    message: msg,
  });
}

function showPopup(msg, tab) {
  // Send a message to the content script to replace the selected text
  browser.tabs.sendMessage(tab.id, {
    action: "popup",
    message: msg,
  });
}


// Add an event listener for when a new tab is created
browser.tabs.onCreated.addListener(function(tab) {
  // Run your code here
  console.log('New tab created:', tab.url);
  // Send a message to the content script to replace the selected text
  browser.tabs.sendMessage(tab.id, {
    action: "loaded"
  });
});

// Add an event listener for when a tab is updated (e.g., when a new URL is loaded)
browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // Check if the page has finished loading
  if (changeInfo.status === 'complete') {
    // Run your code here
    console.log('Page loaded:', tab.url);
    // Send a message to the content script to replace the selected text
    browser.tabs.sendMessage(tab.id, {
      action: "loaded"
    });
  }
});


const checkPrompt = `Is the following message an nice and positive message to send? Just respond with yes or no, with a period and then followed by a reason in a single sentence. \n\n`;
const rewritePrompt = `Can you rewrite this email to be nicer, more professional and inclusive? Please remove any inappropriate or offensive language. \n\n`;

// Receives events sent from the in-browser code
browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "checkText") {
    runChatGptCompletion(checkPrompt + message.text).then((responseText) => {
      if (responseText.toLowerCase().includes("no")) {
        const reasonText = responseText.replace("No. ", "");
        const popupText = `I'm sorry, I can't allow you to send this email. ${reasonText}\n\nWould you like me to rewrite this email for you?`;
        showPopup(popupText, sender.tab);
      }
    });
  } else if (message.action === "rewriteText") {
    runChatGptCompletion(rewritePrompt + message.text).then((responseText) => {
      replaceText(responseText, sender.tab);
    });
  }
});

function runChatGptCompletion(text) {
  // Make an API call using the fetch API
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", // Specify the HTTP method (e.g., POST, GET, etc.)
    headers: {
      "Content-Type": "application/json", // Set the Content-Type header if required
      "Authorization": `Bearer ${openAIAPIKey}`,
    },
    body: JSON.stringify({
      "model": "gpt-3.5-turbo",
      "messages": [{"role": "user", "content": text}],
      "temperature": 0.7
    }), // Pass any data in the request body
  })
    .then((response) => response.json())
    .then((data) => {
      const responseText = data.choices[0].message.content;
      return responseText;
    })
    .catch((error) => {
      return JSON.stringify(error.toString(), null, 4);
    });
}