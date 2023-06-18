// Listen for messages from the background script
browser.runtime.onMessage.addListener(function (message) {
  if (message && message.action === "replaceText" && message.newText) {
    replaceTextGmailTextAreaMethod(message.newText);
  } else if (message.action === "loaded") {
    startWatchingForGmailSendButton();
  } else if (message.action === "alert") {
    alert(message.message);
  } else if (message.action === "popup") {
    showPopupOnGmailSendButton(message.message);
  }
});

function replaceTextGmailTextAreaMethod(newText) {
  const gmailTextArea = findGmailTextEditor();

  if (gmailTextArea) {
    gmailTextArea.innerText = newText;
  }
}

function startWatchingForGmailSendButton() {
  if (!window.lookForGmailSendButtonInterval) {
    window.lookForGmailSendButtonInterval = setInterval(changeGmailButtonBehavior, 100);
  }
}

function changeGmailButtonBehavior() {
  const empathWrappedButton = findEmpathWrappedButton();

  if (!empathWrappedButton) {
    let sendButton = findGmailSendButton();

    if (sendButton) {
      // Removes all the event handlers associatted with a button
      if (!sendButton.outerHTML.includes("empath-wrapped")) {
        sendButton.outerHTML = "<div class='empath-wrapped'>" + sendButton.outerHTML + "</div>";
      }

      sendButton = findGmailSendButton();
      sendButton.addEventListener("click", () => {
        const text = getTextFromCurrentInProgressEmail();

        // Sends the event out to the background process for the extension
        browser.runtime.sendMessage({
          action: "checkText",
          text: text,
        });
      })
    }
  }
}

function findEmpathWrappedButton() {
  const empathWrappedButton = document.querySelector("div.empath-wrapped");

  if (empathWrappedButton) {
    return empathWrappedButton;
  }

  return null;
}


function findGmailSendButton() {
  const sendButton = document.querySelector("div[role='button'][data-tooltip^='Send']");

  if (sendButton) {
    return sendButton;
  }

  return null;
}


function findGmailTextEditor() {
  const textEditor = document.querySelector("div[aria-label='Message Body'][role='textbox']");

  if (textEditor) {
    return textEditor;
  }

  return null;
}

// This function gets all of the text from the email you are about to send
function getTextFromCurrentInProgressEmail() {
  const textEditor = findGmailTextEditor();

  if (textEditor) {
    const signature = getEmailSignatureBodyText();
    let text = textEditor.innerText;
    if (signature) {
      text = text.replace(signature, "")
    }

    return text;
  }

  return null;
}


function getEmailSignatureBodyText() {
  const signature = document.querySelector("div.gmail_signature");

  if (signature) {
    return signature.innerText;
  }

  return null;
}

function deletePopupIfExists() {
  const existingPopup = document.querySelector("div.empath-popup-root");
  if (existingPopup) {
    existingPopup.remove();
  }
}

// This function injects a popup dialog box at the given x, y coordinates
function showPopup(x, y, text) {
  deletePopupIfExists();

  const popupElementRoot = document.createElement("div");

  // Sets the CSS position of the element
  popupElementRoot.className = "empath-popup-root";
  popupElementRoot.style.position = "absolute";
  popupElementRoot.style.left = `${x}px`;
  popupElementRoot.style.top = `${y - 150}px`;
  popupElementRoot.style.maxWidth = `400px`;
  popupElementRoot.style.display = `flex`;
  popupElementRoot.style.flexDirection = `column`;
  popupElementRoot.style.zIndex = 100000;

  const popupHeadingElement = document.createElement("div");
  // Sets the CSS position of the element
  popupHeadingElement.style.background = `#f5f5f5`;
  popupHeadingElement.style.borderTopLeftRadius = `3px`;
  popupHeadingElement.style.borderTopRightRadius = `3px`;
  popupHeadingElement.style.border = `#ddd 1px solid`;
  popupHeadingElement.style.paddingLeft = `15px`;
  popupHeadingElement.style.paddingRight = `15px`;
  popupHeadingElement.style.paddingTop = `10px`;
  popupHeadingElement.style.paddingBottom = `10px`;
  popupHeadingElement.innerText = "Emotional Assistant";

  popupElementRoot.appendChild(popupHeadingElement);

  const popupBodyElement = document.createElement("div");
  // Sets the CSS position of the element
  popupBodyElement.style.display = "flex";
  popupBodyElement.style.flexDirection = "column";
  popupBodyElement.style.background = `white`;
  popupBodyElement.style.borderLeft = `#ddd 1px solid`;
  popupBodyElement.style.borderRight = `#ddd 1px solid`;
  popupBodyElement.style.borderBottom = `#ddd 1px solid`;

  popupElementRoot.appendChild(popupBodyElement);


  const textArea = document.createElement("div");
  textArea.innerText = text;
  textArea.style.padding = `15px`;

  popupBodyElement.appendChild(textArea);

  const buttonGroup = document.createElement("div");
  buttonGroup.style.display = `flex`;
  buttonGroup.style.flexDirection = `row`;
  buttonGroup.style.justifyContent = `space-between`;

  popupBodyElement.appendChild(buttonGroup);


  const acceptRewriteButton = document.createElement("button");
  // Sets the CSS position of the element
  acceptRewriteButton.innerText = "Accept Rewrite";
  acceptRewriteButton.style.display = `inline-block`;
  acceptRewriteButton.style.margin = `0`;
  acceptRewriteButton.style.background = `#337ab7`;
  acceptRewriteButton.style.border = `1px solid #2e6da4`;
  acceptRewriteButton.style.borderRadius = `1px`;
  acceptRewriteButton.style.paddingLeft = `12px`;
  acceptRewriteButton.style.paddingRight = `12px`;
  acceptRewriteButton.style.paddingTop = `6px`;
  acceptRewriteButton.style.paddingBottom = `6px`;
  acceptRewriteButton.style.cursor = `pointer`;
  acceptRewriteButton.style.flexGrow = `1`;
  acceptRewriteButton.style.color = `white`;

  acceptRewriteButton.addEventListener("click", () => {
    // Sends the event out to the background process for the extension
    browser.runtime.sendMessage({
      action: "replaceText",
      text: text,
    });

    deletePopupIfExists();
  })

  buttonGroup.appendChild(acceptRewriteButton);


  const cancelButton = document.createElement("button");
  // Sets the CSS position of the element
  cancelButton.innerText = "Cancel";
  cancelButton.style.display = `inline-block`;
  cancelButton.style.margin = `0`;
  cancelButton.style.background = `#d9534f`;
  cancelButton.style.border = `1px solid #d43f3a`;
  cancelButton.style.borderRadius = `1px`;
  cancelButton.style.paddingLeft = `12px`;
  cancelButton.style.paddingRight = `12px`;
  cancelButton.style.paddingTop = `6px`;
  cancelButton.style.paddingBottom = `6px`;
  cancelButton.style.cursor = `pointer`;
  cancelButton.style.flexGrow = `1`;
  cancelButton.style.color = `white`;

  buttonGroup.appendChild(cancelButton);

  cancelButton.addEventListener("click", () => {
    deletePopupIfExists();
  })

  const bodyElem = document.querySelector("body");
  bodyElem.appendChild(popupElementRoot);

  window.deletePopupInterval = setInterval(() => {
    const empathWrappedButton = findEmpathWrappedButton();
    if (!empathWrappedButton) {
      popupElementRoot.remove();
      clearInterval(window.deletePopupInterval);
      window.deletePopupInterval = null;
    }
  });
}


function showPopupOnGmailSendButton(text) {
  const button = findGmailSendButton();
  const rect = button.getBoundingClientRect();
  const x = rect.right;
  const y = rect.top;

  showPopup(x, y, text);
}