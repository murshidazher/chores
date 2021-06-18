chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    name: 'Jack',
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
    chrome.scripting
      .insertCSS({
        target: { tabId: tabId },
        files: ['./foreground_styles.css'],
      })
      .then(() => {
        console.log('INJECTED THE FOREGROUND STYLES.');

        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            files: ['./foreground.js', './declutter.js'],
          })
          .then(() => {
            console.log('INJECTED THE FOREGROUND AND DECLUTTER SCRIPT.');
          });
      })
      .catch(err => console.log(err));
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'get_name') {
    chrome.storage.local.get('name', data => {
      if (chrome.runtime.lastError) {
        sendResponse({
          message: 'fail',
        });

        return;
      }

      sendResponse({
        message: 'success',
        payload: data.name,
      });
    });

    return true;
  } else if (request.message === 'change_name') {
    chrome.storage.local.set(
      {
        name: request.payload,
      },
      () => {
        if (chrome.runtime.lastError) {
          sendResponse({ message: 'fail' });
          return;
        }

        sendResponse({ message: 'success' });
      },
    );

    return true;
  }
});

chrome.runtime.sendMessage(
  {
    message: 'get_name',
  },
  response => {
    if (response.message === 'success') {
      document.querySelector('div').innerHTML = `Hello ${response.payload}`;
    }
  },
);

chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
  if (fromFb(item)) {
    suggest({
      filename: 'facebook/' + item.filename,
      conflictAction: 'overwrite',
    });
  } else if (fromImgur(item)) {
    suggest({
      filename: 'Imgur/' + item.filename,
      conflictAction: 'overwrite',
    });
  } else if (isPDF(item)) {
    suggest({
      filename: 'PDFs/' + item.filename,
      conflictAction: 'overwrite',
    });
  } else if (isZIP(item)) {
    suggest({
      filename: 'ZIPs/' + item.filename,
      conflictAction: 'overwrite',
    });
  } else if (isDocument(item)) {
    suggest({
      filename: 'docs/' + item.filename,
      conflictAction: 'prompt',
    });
  }
  suggest({
    filename: item.filename,
    conflictAction: 'prompt',
  });
});

/**
 * Returns true if the file MIME type is application/pdf
 * or if the file extension matches the regex expression
 *
 * @param item
 * @return boolean
 */
function isPDF(item) {
  if (item.mime === 'application/pdf' || item.filename.match(/\.pdf$/i))
    return true;
  return false;
}

/**
 * Returns true if the file extension matches the
 * regex expression
 *
 * @param item
 * @return boolean
 */
function isZIP(item) {
  if (item.filename.match(/\.(zip|rar)$/i)) return true;
  return false;
}

/**
 * Returns true if the file extension matches the
 * regex expression
 *
 * @param item
 * @return boolean
 */
function isDocument(item) {
  if (item.filename.match(/\.(doc|docx)$/i)) return true;
}

/**
 * Returns true if content is being
 * downloaded from Facebook
 *
 * @param item
 * @return boolean
 */
function fromFb(item) {
  if (item.url.match(/facebook/)) return true;
}

/**
 * Returns true if content is being
 * downloaded from Imgur
 *
 * @param item
 * @return boolean
 */
function fromImgur(item) {
  if (item.url.match(/imgur/)) return true;
}
