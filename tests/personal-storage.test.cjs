const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('blocked browser storage still renders the personal checklist',()=>{
 const nodes=new Map();
 const node=()=>({children:[],textContent:'',addEventListener(){},replaceChildren(){this.children=[]},append(...items){this.children.push(...items)}});
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},createElement:node};
 const storage={getItem(){throw Error('SecurityError')},setItem(){throw Error('SecurityError')}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/personal-check.js'),'utf8'),{document,localStorage:storage,window:{addEventListener(){}},crypto:{randomUUID:()=> 'id'}});
 assert.equal(nodes.get('personalLists').children[0].textContent,'첫 체크리스트를 만들어 보세요!');
});
