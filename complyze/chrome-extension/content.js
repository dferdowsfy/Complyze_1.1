// Detect prompt box & monitor submissions
document.addEventListener('keydown', async (e) => {
     if (e.key === 'Enter') {
       const promptBox = document.querySelector('textarea') || document.querySelector('input');
       if (!promptBox) return;
   
       const userPrompt = promptBox.value;
       if (!userPrompt) return;
   
       chrome.runtime.sendMessage({ type: 'analyze_prompt', payload: userPrompt });
     }
   });