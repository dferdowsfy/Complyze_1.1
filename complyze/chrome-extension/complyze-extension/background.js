chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
     if (msg.type === 'analyze_prompt') {
          const response = await fetch("http://localhost:3000/api/prompts/analyze", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ prompt: msg.payload })
             });
   
       const result = await res.json();
       chrome.storage.local.set({ analysisResult: result });
   
       chrome.scripting.executeScript({
         target: { tabId: sender.tab.id },
         files: ["injectUI.js"]
       });
     }
   });