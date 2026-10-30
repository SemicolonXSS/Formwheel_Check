(()=>{
"use strict";
const KEY="formwheel-development-v2-evaluations";
const stages=[["기획 중",0,9],["개발 초기",10,29],["개발 중",30,59],["알파",60,74],["베타",75,89],["출시 후보",90,97],["정식 출시",98,100]];
const rubric=[["핵심 기능 작동",35],["버그 및 안정성",25],["사용 편의성",20],["모바일 및 반응형",10],["마무리 및 테스트",10]];
let records={};
try { const saved=JSON.parse(localStorage.getItem(KEY)||"{}"); if(saved&&typeof saved==="object"&&!Array.isArray(saved))records=saved; }catch(e){}
const safe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const stage=n=>stages.find(s=>n>=s[1]&&n<=s[2])[0];
const clamp=n=>Math.max(0,Math.min(100,Number(n)||0));
const calc=r=>Math.round(r.scores.reduce((a,n,i)=>a+clamp(n)*rubric[i][1]/100,0));
const panel=document.createElement("section");panel.id="development-v2";panel.className="dev2-panel";
panel.innerHTML='<h2>🚀 프로젝트 개발 상태 v2.0</h2><p>혼합형(C): 평가 항목의 가중 점수로 자동 계산하고, 제작자가 최종 완성도를 조정할 수 있습니다. 기존 개선 체크리스트 및 Firebase 기록과는 별도로 저장합니다.</p><form id="dev2-add"><label>프로젝트 이름 <input name="project" maxlength="80" placeholder="예: Hub, Rapid Shop" required></label><button type="submit">프로젝트 추가</button></form><p id="dev2-notice" role="status" aria-live="polite"></p><div id="dev2-list"></div><p class="dev2-small">점수는 자동 코드 검사 결과가 아닌 평가자가 입력한 기능·품질 점수를 계산한 값입니다. 정식 출시 전에는 주요 버그와 실기기 검증을 확인하세요.</p>';
const styles=document.createElement("style");styles.textContent=`
.dev2-panel{margin:24px auto;padding:24px;max-width:1120px;border:1px solid #d9deeb;border-radius:20px;background:#fff;color:#19243b;box-sizing:border-box}
.dev2-panel h2{margin:0 0 12px}.dev2-panel p{line-height:1.6}.dev2-panel button{cursor:pointer;border-radius:9px;padding:9px 13px;background:#263e81;color:#fff;border:0}
#dev2-add{display:flex;flex-wrap:wrap;align-items:end;gap:10px;margin:16px 0}#dev2-add input{padding:10px;border:1px solid #aeb8cc;border-radius:8px;max-width:100%;display:block}
.dev2-card{border:1px solid #dce2ed;border-radius:14px;padding:17px;margin:12px 0;background:#fafbff}.dev2-top{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}
.dev2-top h3{margin:0}.dev2-bar{height:12px;background:#dfe5ed;border-radius:99px;overflow:hidden;margin:11px 0}.dev2-bar span{height:100%;display:block;background:#508de4;border-radius:99px}
.dev2-meta,.dev2-small{color:#52617a;font-size:.88rem}.dev2-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:15px 0}
.dev2-fields label{display:block;font-size:.9rem;font-weight:650}.dev2-fields input[type=range]{width:100%;display:block}.dev2-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.dev2-actions label{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.dev2-actions input[type=number]{width:75px;padding:7px;border:1px solid #aeb8cc;border-radius:8px}.dev2-card button.dev2-remove{background:#626d7d}.dev2-empty{padding:20px;background:#f3f6fb;border-radius:12px}
@media(max-width:620px){.dev2-panel{padding:15px;margin:18px 10px}.dev2-fields{grid-template-columns:1fr}}`;
document.head.appendChild(styles);
const root=document.querySelector("main");if(!root)return;
const footer=root.querySelector(".footer");if(footer)root.insertBefore(panel,footer);else root.appendChild(panel);
const list=panel.querySelector("#dev2-list"),notice=panel.querySelector("#dev2-notice");
function save(){try{localStorage.setItem(KEY,JSON.stringify(records));notice.textContent="이 브라우저에 저장했습니다. 다른 기기에는 자동 동기화되지 않습니다.";}catch(e){notice.textContent="저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.";}}
function render(){let entries=Object.entries(records);if(!entries.length){list.innerHTML='<div class="dev2-empty">평가할 프로젝트를 추가해 주세요. 기존 진행률은 변경되지 않습니다.</div>';return;}
list.innerHTML=entries.map(([id,r])=>{const auto=calc(r),final=r.override===null?auto:clamp(r.override);return `<article class="dev2-card" data-id="${safe(id)}"><div class="dev2-top"><h3>${safe(r.name)}</h3><strong>${stage(final)} · ${final}%</strong></div><div class="dev2-bar" role="progressbar" aria-label="${safe(r.name)} 개발 완성도" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${final}"><span style="width:${final}%"></span></div><p class="dev2-meta">자동 계산 ${auto}% · 최종 상태 ${stage(final)} · 마지막 평가: ${safe(r.updated||"아직 없음")}</p><div class="dev2-fields">${rubric.map(([label,w],i)=>`<label>${label} (${w}%) · <output>${r.scores[i]}</output>점<input type="range" data-score="${i}" min="0" max="100" step="5" value="${r.scores[i]}"></label>`).join("")}</div><div class="dev2-actions"><label><input type="checkbox" data-override-toggle ${r.override!==null?"checked":""}> 제작자 최종 조정</label><label>최종 점수 <input type="number" data-override min="0" max="100" value="${final}" ${r.override===null?"disabled":""}></label><button class="dev2-remove" type="button" data-remove>평가 삭제</button></div></article>`;}).join("");
}
const today=()=>new Date().toLocaleDateString("ko-KR");
panel.querySelector("#dev2-add").addEventListener("submit",e=>{e.preventDefault();const input=e.currentTarget.elements.project;const name=input.value.trim();if(!name)return;const id=name.toLocaleLowerCase();if(records[id]){notice.textContent="이미 등록된 프로젝트입니다.";return;}records[id]={name,scores:[0,0,0,0,0],override:null,updated:today()};input.value="";save();render();});
list.addEventListener("change",e=>{const el=e.target,card=el.closest("[data-id]");if(!card)return;const id=card.dataset.id,r=records[id];if(!r)return;
if(el.hasAttribute("data-score"))r.scores[Number(el.dataset.score)]=clamp(el.value);
else if(el.hasAttribute("data-override-toggle"))r.override=el.checked?calc(r):null;
else if(el.hasAttribute("data-override"))r.override=clamp(el.value);
else return;
r.updated=today();save();render();});
list.addEventListener("click",e=>{const btn=e.target.closest("[data-remove]");if(!btn)return;const id=btn.closest("[data-id]").dataset.id;if(!confirm("이 프로젝트의 v2 평가만 삭제할까요? 기존 체크리스트 데이터는 유지됩니다."))return;delete records[id];save();render();});
render();
})();