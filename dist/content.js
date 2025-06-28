class i{constructor(){this.isExecuting=!1,this.setupMessageListener(),this.injectStyles()}setupMessageListener(){chrome.runtime.onMessage.addListener((t,e,a)=>{if(t.type==="EXECUTE_STEP")return this.executeStep(t.step).then(()=>a({success:!0})).catch(n=>a({success:!1,error:n.message})),!0})}injectStyles(){const t=document.createElement("style");t.textContent=`
      .ai-assistant-highlight {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
        background-color: rgba(59, 130, 246, 0.1) !important;
        transition: all 0.3s ease !important;
      }
      
      .ai-assistant-executing {
        position: relative !important;
      }
      
      .ai-assistant-executing::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid #3b82f6;
        border-radius: 4px;
        animation: ai-pulse 1s infinite;
        pointer-events: none;
      }
      
      @keyframes ai-pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.02); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      .ai-assistant-tooltip {
        position: absolute;
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        z-index: 10000;
        pointer-events: none;
        white-space: nowrap;
      }
      
      .ai-assistant-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: #1f2937;
      }
    `,document.head.appendChild(t)}async executeStep(t){this.isExecuting=!0;try{switch(t.action){case"navigate":await this.navigate(t.target);break;case"click":await this.clickElement(t.target);break;case"type":await this.typeText(t.target,t.value);break;case"wait":await this.wait(t.value?parseInt(t.value):1e3);break;case"scroll":await this.scroll(t.target);break;default:throw new Error(`Ação não suportada: ${t.action}`)}}finally{this.isExecuting=!1}}async navigate(t){return new Promise(e=>{window.location.href=t,setTimeout(e,2e3)})}async clickElement(t){const e=this.findElement(t);if(!e)throw new Error(`Elemento não encontrado: ${t}`);this.highlightElement(e),await this.wait(500);const a=e.getBoundingClientRect(),n=a.left+a.width/2,s=a.top+a.height/2;e.scrollIntoView({behavior:"smooth",block:"center"}),await this.wait(300),["mousedown","mouseup","click"].forEach(o=>{const r=new MouseEvent(o,{bubbles:!0,cancelable:!0,clientX:n,clientY:s});e.dispatchEvent(r)}),this.removeHighlight(e)}async typeText(t,e){const a=this.findElement(t);if(!a)throw new Error(`Campo de texto não encontrado: ${t}`);this.highlightElement(a),a.focus(),await this.wait(300),a.value="",a.dispatchEvent(new Event("input",{bubbles:!0}));for(let n=0;n<e.length;n++)a.value+=e[n],a.dispatchEvent(new Event("input",{bubbles:!0})),await this.wait(50+Math.random()*100);a.dispatchEvent(new Event("change",{bubbles:!0})),this.removeHighlight(a)}async scroll(t){const a=window.pageYOffset;let n;switch(t.toLowerCase()){case"up":n=Math.max(0,a-300);break;case"down":n=a+300;break;case"top":n=0;break;case"bottom":n=document.body.scrollHeight;break;default:n=parseInt(t)||a}window.scrollTo({top:n,behavior:"smooth"}),await this.wait(500)}findElement(t){const e=[()=>document.querySelector(t),()=>document.querySelector(`[data-testid="${t}"]`),()=>document.querySelector(`[aria-label="${t}"]`),()=>document.querySelector(`[placeholder="${t}"]`),()=>this.findByText(t),()=>this.findByPartialText(t)];for(const a of e)try{const n=a();if(n)return n}catch{continue}return null}findByText(t){const e=`//*[text()="${t}"]`;return document.evaluate(e,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue}findByPartialText(t){const e=`//*[contains(text(), "${t}")]`;return document.evaluate(e,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue}highlightElement(t){t.classList.add("ai-assistant-highlight","ai-assistant-executing");const e=document.createElement("div");e.className="ai-assistant-tooltip",e.textContent="Executando ação...";const a=t.getBoundingClientRect();e.style.left=`${a.left+a.width/2}px`,e.style.top=`${a.top-40}px`,document.body.appendChild(e),setTimeout(()=>{e.parentNode&&e.parentNode.removeChild(e)},2e3)}removeHighlight(t){t.classList.remove("ai-assistant-highlight","ai-assistant-executing")}async wait(t){return new Promise(e=>setTimeout(e,t))}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>new i):new i;
