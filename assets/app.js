import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getDatabase,
  ref,
  onValue,
  update,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";


const firebaseConfig = {

  apiKey:
    "AIzaSyBreTSe1m0-xlbF4aupnU5isRZCihR25IE",

  authDomain:
    "formwheel.firebaseapp.com",

  databaseURL:
    "https://formwheel-default-rtdb.firebaseio.com",

  projectId:
    "formwheel",

  storageBucket:
    "formwheel.firebasestorage.app",

  messagingSenderId:
    "431583088241",

  appId:
    "1:431583088241:web:74e0e34ea1e3e1170c55d0",

  measurementId:
    "G-T372YXDF8D"

};


const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const checklistRef =
  ref(db, "formwheelChecklist");


window.firebaseChecklist = {
  db,
  checklistRef,
  update
};


// Start reads before an offline transaction can wait.
let receivedSnapshot=false,migrationRunning=false,migrationRetry=null;
function updateReady(){
 firebaseReady=firebaseConnected && receivedSnapshot;
 if(firebaseReady){syncReviewedItems();flushPending();}
}
async function syncReviewedItems(){
 if(!firebaseReady || reviewSynced || migrationRunning)return;
 migrationRunning=true;
 try{
  const result=await runTransaction(checklistRef,current=>{
   const next=current && typeof current==="object"?{...current}:{};
   let changed=false;for(const batch of reviewBatches){if(next[batch.version])continue;Object.assign(next,batch.items);next[batch.version]=true;changed=true;}return changed?next:undefined;
  },{applyLocally:false});
  if(reviewBatches.every(batch=>result.snapshot.val()?.[batch.version])){
   reviewSynced=true;
   if(!Object.keys(pendingChanges).length)showFirebaseStatus("☑️ 검토 결과 동기화됨 · 공유 목록");
  }
 }catch(error){
  showFirebaseStatus("검토 결과 저장 실패 · 재연결 후 재시도");
  clearTimeout(migrationRetry);migrationRetry=setTimeout(syncReviewedItems,15000);
 }finally{migrationRunning=false;}
}
showFirebaseStatus("🔄 Firebase 연결 중...");
onValue(checklistRef,snapshot=>{
 const remoteData=snapshot.val();receivedSnapshot=true;
 reviewSynced=reviewBatches.every(batch=>!!remoteData?.[batch.version]);state=reconcileState(remoteData);
 cacheState();render();updateReady();
 if(firebaseReady && !Object.keys(pendingChanges).length)
  showFirebaseStatus(reviewSynced?"☑️ Firebase 연결됨 · 공유 목록":"🔄 검토 결과 동기화 중...");
},error=>{
 receivedSnapshot=false;firebaseReady=false;
 showFirebaseStatus("❌ Firebase 읽기 실패 · 기기에 보관 중");
});
onValue(ref(db,".info/connected"),snapshot=>{
 firebaseConnected=snapshot.val()===true;updateReady();
 if(!firebaseConnected)showFirebaseStatus("기기에 보관 중 · Firebase 재연결 대기");
});
