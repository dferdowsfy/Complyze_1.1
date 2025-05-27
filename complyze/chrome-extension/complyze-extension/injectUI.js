chrome.storage.local.get("analysisResult", ({ analysisResult }) => {
     const container = document.createElement('div');
     container.style = `
       position: fixed;
       top: 60px;
       right: 20px;
       width: 400px;
       background: #111827;
       color: white;
       z-index: 9999;
       padding: 16px;
       border-radius: 12px;
       font-family: Inter, sans-serif;
       box-shadow: 0 4px 24px rgba(0,0,0,0.3);
     `;
   
     container.innerHTML = `
       <h3>🔐 Complyze Prompt Analyzer</h3>
       <p><strong>Original:</strong> ${analysisResult.original_prompt}</p>
       <p><strong>Redacted:</strong> ${analysisResult.redacted_prompt}</p>
       <p><strong>Risk:</strong> ${analysisResult.risk_level} | Clarity: ${analysisResult.clarity_score} | Quality: ${analysisResult.quality_score}</p>
       <p><strong>Controls:</strong><br>${analysisResult.control_tags.join('<br>')}</p>
       <button id="copyBtn" style="margin-top:10px;padding:8px;border-radius:6px;background:white;color:black;">Copy Optimized Prompt</button>
     `;
     
     document.body.appendChild(container);
   
     document.getElementById("copyBtn").onclick = () => {
       navigator.clipboard.writeText(analysisResult.redacted_prompt);
     };
   });