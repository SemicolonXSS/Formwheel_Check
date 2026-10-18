(()=>{"use strict";
const KEY="formwheel-check-personal-v1",SELECT="formwheel-check-selected-v2",PREFIX="formwheel-check-invite-v2-";
const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const button=(text,fn)=>{const n=el("button","",text);n.type="button";n.addEventListener("click",fn);return n};
const id=()=>crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,"0")).join("");
const code=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,"0")).join("").toUpperCase();
const safeRead=(key,def)=>{try{return JSON.parse(localStorage.getItem(key)||"null")??def}catch{return def}};
let lists=safeRead(KEY,[]).filter?.(x=>x&&typeof x.id==="string"&&typeof x.title==="string"&&Array.isArray(x.items))||[];
let selected=localStorage.getItem(SELECT)||"";
let improvementJoined=localStorage.getItem("formwheel-check-improvement-joined")==="yes";
const improvementId="__formwheel_improvement__";
window.addEventListener("formwheel-improvement-left",()=>{improvementJoined=false;if(selected===improvementId)selected=lists[0]?.id||"";save();render()});
const notice=$("personalNotice"),listRoot=$("personalLists"),sidebar=$("personalSidebar");
function save(){try{localStorage.setItem(KEY,JSON.stringify(lists));localStorage.setItem(SELECT,selected);notice.textContent="내 브라우저에 저장됨 · 공동 편집은 아직 활성화되지 않았어요."}catch{notice.textContent="저장 실패: 저장 공간을 확인하세요."}}
function pick(lid){selected=lid;save();render()}
function current(){return lists.find(x=>x.id===selected)}
function render(){
 sidebar.replaceChildren();listRoot.replaceChildren();
 if(improvementJoined){
   const special=button("🛠️ Formwheel 개선 프로젝트",()=>pick(improvementId));
   special.className="personal-nav-item"+(selected===improvementId?" active":"");
   sidebar.append(special);
 }
 if(selected===improvementId&&improvementJoined){
   if(typeof window.openImprovementChecklist==="function")window.openImprovementChecklist();
   listRoot.append(el("p","personal-progress","공유 개선 프로젝트가 아래에 열렸어요. 진행 상태를 확인하고 수정할 수 있어요."));
 }else if(typeof window.closeImprovementChecklist==="function")window.closeImprovementChecklist();
 for(const list of lists){
  const b=button((list.icon||"☑️")+" "+list.title,()=>pick(list.id));
  b.className="personal-nav-item"+(selected===list.id?" active":"");b.title=list.title;sidebar.append(b);
 }
 if(!lists.length){if(!improvementJoined)listRoot.append(el("p","personal-empty","첫 체크리스트를 만들어 보세요!"));return}
 if(selected===improvementId&&improvementJoined)return;
 const list=current();if(!list){selected=lists[0].id;save();render();return}
 const wrap=el("article","personal-list");
 const header=el("div","personal-list-head");header.append(el("h3","",list.title));
 const actions=el("div","personal-actions");
 actions.append(button("이름 변경",()=>{const x=prompt("체크리스트 이름",list.title);if(x===null||!x.trim())return;list.title=x.trim().slice(0,80);save();render()}));
 actions.append(button("초대 코드",()=>{if(!list.inviteCode)list.inviteCode=code();save();render();$("inviteCodeValue").textContent=list.inviteCode;$("inviteDialog").hidden=false}));
 actions.append(button("목록 삭제",()=>{if(!confirm("이 목록과 항목을 삭제할까요?"))return;lists=lists.filter(x=>x.id!==list.id);selected=lists[0]?.id||"";save();render()}));header.append(actions);wrap.append(header);
 const total=list.items.length,done=list.items.filter(x=>x.done).length;
 wrap.append(el("p","personal-progress",done+" / "+total+" 완료 ("+(total?Math.round(done/total*100):0)+"%)"));
 const track=el("div","personal-track"),fill=el("div","personal-fill");fill.style.width=(total?done/total*100:0)+"%";track.append(fill);wrap.append(track);
 const ul=el("ul","personal-items");
 for(const item of list.items){const li=el("li",item.done?"personal-done":"");const label=el("label");const ch=el("input");ch.type="checkbox";ch.checked=!!item.done;ch.addEventListener("change",()=>{item.done=ch.checked;save();render()});label.append(ch,el("span","",item.text));li.append(label);
 li.append(button("수정",()=>{const x=prompt("할 일 수정",item.text);if(x===null||!x.trim())return;item.text=x.trim().slice(0,200);save();render()}));
 li.append(button("삭제",()=>{list.items=list.items.filter(x=>x.id!==item.id);save();render()}));ul.append(li)}
 wrap.append(ul);
 const form=el("form","personal-add-item"),inp=el("input");inp.placeholder="새로운 할 일";inp.maxLength=200;inp.required=true;inp.setAttribute("aria-label","할 일");const submit=el("button","primary","항목 추가");submit.type="submit";form.append(inp,submit);
 form.addEventListener("submit",ev=>{ev.preventDefault();if(!inp.value.trim()||list.items.length>=300)return;list.items.push({id:id(),text:inp.value.trim(),done:false});save();render()});
 wrap.append(form);listRoot.append(wrap)
}
$("personalCreate").addEventListener("submit",ev=>{ev.preventDefault();const field=$("personalTitle");if(!field.value.trim()||lists.length>=100)return;const item={id:id(),title:field.value.trim().slice(0,80),inviteCode:code(),items:[]};lists.unshift(item);field.value="";pick(item.id);$("inviteCodeValue").textContent=item.inviteCode;$("inviteDialog").hidden=false});
$("inviteClose").addEventListener("click",()=>{$("inviteDialog").hidden=true});
$("inviteCopy").addEventListener("click",async()=>{const value=$("inviteCodeValue").textContent;try{await navigator.clipboard.writeText(value);notice.textContent="코드를 복사했어요. 현재 다른 기기에서는 참여할 수 없어요."}catch{prompt("복사할 코드",value)}});
$("inviteJoin").addEventListener("submit",ev=>{ev.preventDefault();const value=$("joinCode").value.replace(/\s|-/g,"").toUpperCase();if(!/^[A-F0-9]{32}$/.test(value)){alert("올바른 32자리 코드를 입력해 주세요.");return}const found=lists.find(x=>x.inviteCode===value);if(found){pick(found.id);$("joinCode").value="";return}alert("아직 클라우드 공동 편집이 연결되지 않았어요. 다른 사람의 코드는 서버 보안 규칙 적용 후 사용할 수 있습니다.")});
render();
})();