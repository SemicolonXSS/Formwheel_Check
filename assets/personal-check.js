(()=>{"use strict";
const KEY="formwheel-check-personal-v1";
const $=id=>document.getElementById(id);
let lists=[];
try{const stored=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(stored))lists=stored.filter(x=>x&&typeof x.id==="string"&&typeof x.title==="string"&&Array.isArray(x.items)).slice(0,100)}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(lists));$("personalNotice").textContent="이 브라우저에 저장됨 · 다른 기기와는 동기화되지 않아요."}catch{$("personalNotice").textContent="저장에 실패했어요. 브라우저 저장 공간을 확인해 주세요."}};
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const btn=(label,fn,cls)=>{const e=make("button",cls||"",label);e.type="button";e.addEventListener("click",fn);return e};
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
function render(){
 const root=$("personalLists");root.replaceChildren();
 if(!lists.length)root.append(make("p","personal-empty","아직 만든 목록이 없어요. 첫 체크리스트를 만들어 보세요!"));
 for(const list of lists){
  const wrap=make("article","personal-list");
  const head=make("div","personal-list-head");
  const title=make("h3","",list.title);head.append(title);
  const actions=make("div","personal-actions");
  actions.append(btn("이름 수정",()=>{const next=prompt("체크리스트 이름",list.title);if(next===null)return;const name=next.trim().slice(0,80);if(!name)return;list.title=name;save();render()}));
  actions.append(btn("목록 삭제",()=>{if(!confirm("이 체크리스트와 모든 항목을 삭제할까요?"))return;lists=lists.filter(x=>x.id!==list.id);save();render()}));
  head.append(actions);wrap.append(head);
  const done=list.items.filter(x=>x.done).length,total=list.items.length;
  wrap.append(make("p","personal-progress",done+" / "+total+" 완료 ("+(total?Math.round(done/total*100):0)+"%)"));
  const bar=make("div","personal-track"),fill=make("div","personal-fill");fill.style.width=(total?done/total*100:0)+"%";bar.append(fill);wrap.append(bar);
  const ul=make("ul","personal-items");
  for(const item of list.items){
   const li=make("li",item.done?"personal-done":"");
   const label=make("label");const checkbox=make("input");checkbox.type="checkbox";checkbox.checked=!!item.done;
   checkbox.addEventListener("change",()=>{item.done=checkbox.checked;save();render()});
   label.append(checkbox,make("span","",item.text));li.append(label);
   li.append(btn("수정",()=>{const next=prompt("할 일 수정",item.text);if(next===null)return;const value=next.trim().slice(0,200);if(!value)return;item.text=value;save();render()}));
   li.append(btn("삭제",()=>{list.items=list.items.filter(x=>x.id!==item.id);save();render()}));
   ul.append(li);
  }wrap.append(ul);
  const form=make("form","personal-add-item");
  const input=make("input");input.placeholder="새로운 할 일";input.maxLength=200;input.required=true;input.setAttribute("aria-label",list.title+"에 할 일 추가");
  const add=make("button","primary","항목 추가");add.type="submit";form.append(input,add);
  form.addEventListener("submit",e=>{e.preventDefault();const value=input.value.trim();if(!value)return;if(list.items.length>=300){alert("목록당 최대 300개 항목까지 만들 수 있어요.");return}list.items.push({id:uid(),text:value,done:false});save();render()});
  wrap.append(form);root.append(wrap);
 }
}
$("personalCreate").addEventListener("submit",e=>{e.preventDefault();const input=$("personalTitle"),title=input.value.trim();if(!title)return;if(lists.length>=100){alert("목록은 최대 100개까지 만들 수 있어요.");return}lists.unshift({id:uid(),title:title.slice(0,80),items:[]});input.value="";save();render()});
render();
})();