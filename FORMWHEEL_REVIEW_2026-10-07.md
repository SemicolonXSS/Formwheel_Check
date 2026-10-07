# Formwheel 프로젝트별 개선 검토

검토일: 2026-10-07 (한국 시간)

SemicolonXSS 계정의 Formwheel 관련 저장소 30개에서 main의 index.html과 파일 목록을 확인했습니다. 이 보고서는 코드 정적 검토입니다. 실제 서비스 플레이, 여러 기기 동시 접속, 운영 Firebase Rules·데이터·인증 설정은 검증하지 않았습니다. 코드에서 드러나는 문제와 추가 개선 제안을 구분해 설명합니다. Firebase 웹 설정의 API 키 자체를 비밀 유출로 판단하지 않았습니다.

우선순위: P0 = 개인정보 또는 게임 비밀 보호를 위해 최우선, P1 = 핵심 기능·데이터 신뢰성, P2 = 사용성·성능·유지보수 개선.

## 우선 처리

1. Casino: 평문 비밀번호를 Firebase Authentication으로 이전하고 기존 DB 비밀번호 제거.
2. Spy: 공통 방 데이터에서 제시어와 역할을 분리하고 개인별 읽기 권한 설정.
3. Button: 이전 라운드 답안 삭제로 최종 점수 누락이 생기는 구조 수정.
4. Reflex: 조기 클릭 후 연타가 측정 기록으로 들어가는 상태 전이 수정.
5. Vote·Risk·Balance·Fate·WheelB: 동시 쓰기와 중복 결과 처리를 원자적으로 보장.
6. Edit: 실제 타임라인 영상과 오디오를 내보내도록 구현.

## 프로젝트별 개선점

### Formwheel

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel/blob/b92c1da934008ec87493709ed2014661edd8b041/index.html#L1172) · 기준 커밋 b92c1da934008ec87493709ed2014661edd8b041

- **[P1] Hub의 Reflex·Marble·Vault 모드 표시를 실제 구현과 맞추기** — Reflex는 로컬 솔로이고 Marble은 한 화면 경주, Vault는 온라인 방 기능도 있는데 Hub 분류가 다릅니다.
  - 완료 기준: 각 카드의 인원·연결 표시를 해당 프로젝트 시작 화면과 대조해 일치시킨다.
- **[P2] 최근 추가를 날짜 기준으로 관리하기** — recent 불리언으로만 정렬합니다.
  - 완료 기준: addedAt 날짜로 최근 정렬과 NEW 표시 기간을 계산한다.

### Formwheel_Form

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Form/blob/5fbb2b1fb9612217b37322cfc36a0f7c1b66b164/index.html#L667) · 기준 커밋 5fbb2b1fb9612217b37322cfc36a0f7c1b66b164

- **[P1] 응답 조회를 설문 소유자 인증과 분리하기** — 설문 ID로 메타와 응답을 조회하며 코드에 소유자 인증 절차가 없습니다. 운영 Rules는 별도 확인이 필요합니다.
  - 완료 기준: 작성자만 응답을 읽고 일반 응답자는 제출만 가능한 Rules 테스트를 통과한다.
- **[P2] 응답 목록의 순차 조회를 줄이기** — loadResponses가 응답 키마다 storeGet을 순차 호출합니다.
  - 완료 기준: 페이지 단위로 응답을 조회하고 100개 응답에서도 요청 수가 응답 수만큼 증가하지 않는다.

### Formwheel_Wheel

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Wheel/blob/fbd03914cf568902cccda508439f01f679fd5f2c/index.html#L608) · 기준 커밋 fbd03914cf568902cccda508439f01f679fd5f2c

- **[P1] 로컬 계정과 온라인 계정의 의미를 명확히 하기** — 공유 저장소 대체 경로가 localStorage이고 로그인도 저장된 사용자 목록과 해시를 비교합니다.
  - 완료 기준: 다른 기기에서 로그인 가능한 인증을 도입하거나 기기 내 프로필임을 화면에 명시한다.
- **[P2] 추첨 계산과 3천 줄 화면 코드를 분리하기** — 가중치 추첨·저장·로그인·효과가 하나의 파일에 있습니다.
  - 완료 기준: 가중치·제외·마지막 항목 삭제의 경계 사례를 독립 함수로 검증한다.

### Formwheel_Quiz

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Quiz/blob/16ffe730281a9a85a10c51a54fc3f163db9f7047/index.html#L967) · 기준 커밋 16ffe730281a9a85a10c51a54fc3f163db9f7047

- **[P1] 정답과 점수 계산을 신뢰 가능한 영역으로 이동하기** — 참가자 메타에 correct가 있고 submitAnswer가 정답·속도 점수를 직접 계산해 저장합니다.
  - 완료 기준: 문제 진행 중 참가자는 정답을 읽지 못하고 변조 점수를 제출할 수 없다.
- **[P1] 답안 제출과 점수 반영을 한 번만 처리하기** — 답안 저장과 누적 점수 저장이 별개이고 기존 답안 존재 검사가 없습니다.
  - 완료 기준: 동일 라운드를 두 탭에서 제출하거나 재시도해도 한 번만 득점한다.

### Formwheel_Battle

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Battle/blob/d02132d2a3ccbf314f9a318b082e47a420d6e630/index.html#L2314) · 기준 커밋 d02132d2a3ccbf314f9a318b082e47a420d6e630

- **[P1] 참가자 정답 판정과 점수를 서버에서 검증하기** — submitAnswer에서 q.correct와 비교하고 새 점수를 클라이언트가 기록합니다.
  - 완료 기준: 참가자는 답안만 제출하고 서버가 정답·마감 시각·점수를 판정한다.
- **[P1] 답안 중복 검사를 원자적으로 수행하기** — once로 기존 답안을 읽은 다음 update하므로 검사와 쓰기 사이에 경쟁이 생길 수 있습니다.
  - 완료 기준: 두 탭에서 같은 라운드 답안을 보내도 확정 답안과 점수가 한 번만 기록된다.

### Formwheel_Bomb

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Bomb/blob/d988ae692e8c15b817ee73ae0a0d242d5814f211/index.html#L435) · 기준 커밋 d988ae692e8c15b817ee73ae0a0d242d5814f211

- **[P1] 접속 종료 시 참가자·호스트를 복구하기** — 타이머 보정과 트랜잭션은 이미 있지만 onDisconnect 기반 접속 정리는 없습니다.
  - 완료 기준: 폭탄 보유자와 호스트의 탭 종료 후 남은 참가자가 게임을 계속하거나 명확한 종료 안내를 받는다.
- **[P2] 폭탄 전달·폭발 경계 시점 회귀 검증하기** — passBomb와 explode는 트랜잭션과 동일 만료 시각을 사용합니다. 기존 개선을 유지할 검증이 필요합니다.
  - 완료 기준: 만료 직전 동시 전달·폭발에도 탈락자가 한 명이고 전달로 남은 시간이 늘지 않는다.

### Formwheel_DiceDuel

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_DiceDuel/blob/7d31943d733ca065bcf779af5f37d4704468752a/index.html#L343) · 기준 커밋 7d31943d733ca065bcf779af5f37d4704468752a

- **[P1] 두 번째 참가자 자리를 트랜잭션으로 확보하기** — get으로 빈 자리를 확인한 뒤 player2를 update합니다.
  - 완료 기준: 두 명이 동시에 참가할 때 한 명만 player2가 되고 나머지는 정원 초과 안내를 받는다.
- **[P1] 라운드 결과를 한 번만 확정하기** — 호스트의 로컬 resolvingRound 플래그와 update로 점수를 처리합니다.
  - 완료 기준: 호스트 중복 탭·재연결에도 각 라운드 점수가 한 번만 증가한다.

### Formwheel_Spy

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Spy/blob/bca736b382a63cf90d2b90231b324123ade8a1ed/index.html#L94) · 기준 커밋 bca736b382a63cf90d2b90231b324123ade8a1ed

- **[P0] 제시어와 역할을 플레이어별 비공개 경로로 분리하기** — 모든 참가자가 방 전체를 구독하며 같은 방 객체에 secret·spyId·roles가 들어갑니다.
  - 완료 기준: 공통 방 구독에는 비밀이 없고 UID별 비공개 경로는 본인만 읽는다.
- **[P1] 호스트 퇴장과 참가 제한을 처리하기** — 참가 시 phase 검사가 없고 퇴장 시 호스트 이전 없이 플레이어만 제거합니다.
  - 완료 기준: 게임 시작 후 신규 참가를 막고 호스트 종료 뒤 투표·결과 진행이 멈추지 않는다.

### Formwheel_GCrown

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_GCrown/blob/370cfa1f668b40fd97d5d52d243ac5ec5bb39222/index.html#L2244) · 기준 커밋 370cfa1f668b40fd97d5d52d243ac5ec5bb39222

- **[P1] 온라인 이동 권한을 UID와 Rules로 검증하기** — 방·이동 트랜잭션은 있지만 코드에 Firebase Auth 연동이 없고 자체 playerId를 씁니다.
  - 완료 기준: 상대 차례 이동·방 설정 변경·다른 플레이어 사칭 쓰기가 Rules에서 거부된다.
- **[P2] 승리·행동 제한·AI 난이도를 경계 사례로 검증하기** — 보드·AI·멀티 규칙이 한 파일에 복잡하게 결합되어 있습니다.
  - 완료 기준: 보드 크기별 마지막 행동·왕관 이동·동률·마지막 플레이어 퇴장을 재현 검증한다.

### Formwheel_Music

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Music/blob/c1905190493497ffe21901349ff772c49eabf987/index.html#L644) · 기준 커밋 c1905190493497ffe21901349ff772c49eabf987

- **[P1] 정지 시 재생 중인 오디오 노드도 중단하기** — stopPlayback는 화면 루프를 취소하지만 playTone에서 만든 oscillator를 보관·정지하지 않습니다.
  - 완료 기준: 긴 음표 재생 중 정지를 눌러도 즉시 무음이 되고 재시작 시 이전 소리가 겹치지 않는다.
- **[P2] 리듬 판정과 소리 재생을 오디오 시계에 맞추기** — 재생이 화면 프레임과 performance.now 기준으로 음표를 실행합니다.
  - 완료 기준: 낮은 프레임률과 배경 탭 복귀에서도 음표 시각과 판정 오차를 측정하고 제한한다.

### Formwheel_Chat

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Chat/blob/6a596a9276c8509926c2da0c258c76f33f410887/index.html#L2431) · 기준 커밋 6a596a9276c8509926c2da0c258c76f33f410887

- **[P1] 메시지·Producer·차단 권한의 Rules 검증을 저장소에 추가하기** — 클라이언트에 수정·삭제·차단 명령이 구현되어 있지만 저장소에 운영 Rules가 없습니다.
  - 완료 기준: 일반 사용자의 타인 메시지 수정·차단·권한 변경을 거부하는 Rules 테스트를 포함한다.
- **[P2] 메시지 변경 시 전체 재렌더를 줄이고 이전 기록을 페이지화하기** — 최근 200개 메시지를 onValue로 받아 매번 전체 메시지를 다시 그립니다.
  - 완료 기준: 새 메시지 한 개에 해당 노드만 갱신하고 스크롤 위치를 유지하며 이전 기록을 불러온다.

### Formwheel_Casino

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Casino/blob/5b74ec8c441e6bdb6d23dbd83b4803184826ce4d/index.html#L196) · 기준 커밋 5b74ec8c441e6bdb6d23dbd83b4803184826ce4d

- **[P0] 평문 비밀번호 저장을 Firebase Authentication으로 교체하기** — newUser에 password:p를 저장하고 login에서 data.password와 직접 비교합니다.
  - 완료 기준: RTDB에서 password 필드를 제거하고 Firebase Auth로 신규·기존 계정 이전을 검증한다.
- **[P1] 코인·일일 보상·게임 정산을 서버에서 확정하기** — spend와 add가 클라이언트 상태를 바꾸고 저장하며 날짜도 클라이언트 UTC 날짜입니다.
  - 완료 기준: 동시 탭·시계 변경·직접 쓰기로 잔액이나 일일 보상을 중복 획득할 수 없다.

### Formwheel_Clicker

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Clicker/blob/5ff6d96879edd2edb4b0a0cf94d083c57490fc65/index.html#L220) · 기준 커밋 5ff6d96879edd2edb4b0a0cf94d083c57490fc65

- **[P1] 경쟁 랭킹의 점수 신뢰성을 확보하기** — 인증과 최고점 트랜잭션은 있지만 제출 점수의 출처는 로컬 게임 상태입니다.
  - 완료 기준: 검증 가능한 게임 기록만 경쟁 랭킹에 넣거나 검증되지 않은 랭킹임을 명시한다.
- **[P2] Auto 수익을 실제 경과 시간으로 계산하기** — 접속 중 Auto는 setInterval 한 번당 수익을 더합니다.
  - 완료 기준: 백그라운드 제한 뒤 복귀해도 경과 시간·상한 기준으로 일관된 수익을 계산한다.

### Formwheel_Reflex

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Reflex/blob/a64a9ca64e73b329b976d1e3e95273179b0cc026/index.html#L178) · 기준 커밋 a64a9ca64e73b329b976d1e3e95273179b0cc026

- **[P1] 조기 클릭·결과 대기 상태에서 입력을 차단하기** — early가 waiting=false로 바꿔 다음 클릭이 goAt 기준 기록으로 들어갈 수 있고 조기 클릭도 round를 소비합니다.
  - 완료 기준: 조기 연타가 기록을 만들지 않고 유효 측정 라운드 수와 times 길이가 일치한다.
- **[P2] 기록 저장 실패와 키보드 입력을 처리하기** — localStorage 접근에 예외 처리가 없고 측정 입력은 pointerdown만 있습니다.
  - 완료 기준: 저장 차단 환경에서도 게임이 실행되고 Space·Enter로 동일한 측정을 할 수 있다.

### Formwheel_Marble

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Marble/blob/11a49d77329f47accd6ce4b3ef81b9f300a4d130/index.html#L768) · 기준 커밋 11a49d77329f47accd6ce4b3ef81b9f300a4d130

- **[P2] 물리를 고정 시간 간격으로 계산하기** — loop에서 프레임 경과량 기반 dt와 랜덤 보정을 사용합니다.
  - 완료 기준: 동일 초기 시드·맵을 30/60/120fps로 실행했을 때 판정 차이를 측정하고 줄인다.
- **[P2] 공유 맵의 크기·좌표·장애물 수를 검증하기** — URL로 JSON 맵을 받아 배열을 사용하는 공유 경로가 있습니다.
  - 완료 기준: 과도한 장애물·비정상 좌표·큰 공유 문자열을 제한하고 사용자가 이해할 오류를 표시한다.

### Formwheel_Decode

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Decode/blob/d6ccc788d1e1b873726cd20db74654e5f8f8f987/index.html#L1451) · 기준 커밋 d6ccc788d1e1b873726cd20db74654e5f8f8f987

- **[P2] 변환별 왕복·오류 사례를 자동 검증하기** — UTF-8 엄격 디코딩과 여러 변환 도구가 구현되어 있습니다.
  - 완료 기준: 한글·이모지·빈 입력·깨진 바이트를 포함해 지원 변환의 왕복과 오류 표시를 검증한다.
- **[P2] 자동 인식 결과를 추정으로 표시하기** — 여러 후보의 점수를 정렬해 자동 디코딩하는 구조입니다.
  - 완료 기준: 짧은 숫자처럼 여러 해석이 가능한 입력에는 후보와 선택 이유를 표시하고 원문을 유지한다.

### Formwheel_AI

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_AI/blob/40d72bcfe7a184b1b505f60f70db397abfd38ed7/index.html#L578) · 기준 커밋 40d72bcfe7a184b1b505f60f70db397abfd38ed7

- **[P1] 사용자별 AI 기억 저장 경로를 분리하기** — AI_PATH가 고정 formwheelAI이며 전체 ai 객체를 set합니다.
  - 완료 기준: 서로 다른 사용자·탭의 기억이 덮어써지지 않고 본인 데이터만 읽고 지울 수 있다.
- **[P2] 규칙 기반 응답의 한계와 기억 수정 흐름을 표시하기** — 답변은 generateReply와 기억 검색 중심으로 구성되어 있습니다.
  - 완료 기준: 추측과 저장 기억을 구분해 표시하고 틀린 기억을 수정·내보내기할 수 있다.

### Formwheel_Piano

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Piano/blob/a78969d1946f1827750359789e8444596898aec2/index.html#L1632) · 기준 커밋 a78969d1946f1827750359789e8444596898aec2

- **[P1] 차례·카드 사용 권한을 인증과 Rules로 검증하기** — 이동 트랜잭션은 이미 있지만 자체 clientId에 기반해 클라이언트가 상태를 계산합니다.
  - 완료 기준: 타인의 말 이동·아이템 증가·차례 변경을 DB에서 거부한다.
- **[P2] 장기 미응답과 비정상 퇴장을 복구하기** — 방어 응답 대기와 턴 진행이 결합되어 있고 onDisconnect 연결 정리가 없습니다.
  - 완료 기준: 방어 응답자·현재 플레이어의 탭 종료 후 제한 시간 안에 진행하거나 종료한다.

### Formwheel_Time

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Time/blob/2058534c8baea910096a40fc22932a96dd82171b/index.html#L533) · 기준 커밋 2058534c8baea910096a40fc22932a96dd82171b

- **[P1] 대결 시작 시각을 서버 시계에 맞추기** — 시작은 Date.now()+1200이고 참가자가 로컬 시계로 계산하며 serverTimeOffset 보정이 없습니다.
  - 완료 기준: 기기 시계가 ±30초 달라도 카운트다운과 게임 시작·종료가 일치한다.
- **[P1] 호스트 연결 종료 후 결과 확정을 복구하기** — onDisconnect로 플레이어를 제거하지만 호스트가 checkBattleEnd를 진행합니다.
  - 완료 기준: 호스트 탭 종료 뒤 남은 참가자가 결과를 확인할 수 있다.

### Formwheel_Vault

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Vault/blob/a0abe426c2035c7302033451cd830c18ce8d016c/index.html#L1448) · 기준 커밋 a0abe426c2035c7302033451cd830c18ce8d016c

- **[P1] 금고 획득·보상 지급을 하나의 원자적 처리로 묶기** — 금고 openedBy 확정 뒤 별도 resolveVault에서 점수를 저장합니다.
  - 완료 기준: 금고 확보 직후 연결이 끊겨도 재접속 시 보상이 한 번만 확정된다.
- **[P1] 금고 교체와 라운드 증가를 함께 확정하기** — 새 금고 배열 교체와 round 증가가 별개 트랜잭션입니다.
  - 완료 기준: 교체와 라운드 증가 사이 실패에도 금고 세대와 라운드 번호가 어긋나지 않는다.

### Formwheel_Risk

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Risk/blob/35df7a5fac6c6e01b234f277a5a1ab7039ade794/index.html#L160) · 기준 커밋 35df7a5fac6c6e01b234f277a5a1ab7039ade794

- **[P1] 방 전체 덮어쓰기를 트랜잭션으로 교체하기** — 각 참가자가 방을 읽고 베팅을 수정한 뒤 saveRoom에서 방 전체를 set합니다.
  - 완료 기준: 동시에 두 명이 베팅해도 양쪽 베팅과 참가자 정보가 유지된다.
- **[P1] 베팅 대기 제한과 퇴장 처리를 추가하기** — 전체 베팅 완료를 기다리며 onDisconnect와 Auth가 없습니다.
  - 완료 기준: 미응답·연결 종료 참가자 때문에 라운드가 무한 대기하지 않는다.

### Formwheel_Vote

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Vote/blob/62e6bd748de62c98657d7579d17be2e25a1a4a81/index.html#L276) · 기준 커밋 62e6bd748de62c98657d7579d17be2e25a1a4a81

- **[P1] 투표 집계를 원자적으로 처리하기** — 전체 votes·voters를 읽어 수정한 뒤 update하므로 동시 투표가 유실될 수 있습니다.
  - 완료 기준: 동시 20명 투표 후 합계가 20이고 개인별 투표는 한 번만 반영된다.
- **[P1] 투표자·호스트를 닉네임 대신 인증 UID로 식별하기** — voters[currentName]으로 중복을 막으며 시작·종료 함수에 서버 권한 검증이 없습니다.
  - 완료 기준: 동명이인이 각각 투표 가능하고 일반 참가자는 투표 시작·종료를 바꿀 수 없다.

### Formwheel_Button

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Button/blob/98dea1b5f39a2e983185b334e0fb3907151e288d/index.html#L337) · 기준 커밋 98dea1b5f39a2e983185b334e0fb3907151e288d

- **[P1] 라운드 답안 누적과 점수 계산을 수정하기** — nextMulti가 answers:null로 이전 답안을 지우고 getResults는 남은 answers만 합산합니다.
  - 완료 기준: 3라운드 정답 후 최종 점수가 세 라운드 점수 합과 일치한다.
- **[P1] 라운드 타이머와 셔플을 일관되게 만들기** — 구독 이벤트마다 미응답자의 roundStart를 재설정하고 셔플은 sort 랜덤 비교입니다.
  - 완료 기준: 같은 라운드 추가 갱신이 타이머를 재시작하지 않고 Fisher–Yates로 순서를 섞는다.

### Formwheel_Edit

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Edit/blob/d1cca98b5b0fc2b124eb4688c40b8d99659bd0de/index.html#L130) · 기준 커밋 d1cca98b5b0fc2b124eb4688c40b8d99659bd0de

- **[P1] 영상 내보내기를 실제 타임라인 재생으로 구현하기** — exportVideo가 draw로 선택 클립의 시작 프레임을 반복하며 최대 10초·오디오 없는 canvas 스트림을 녹화합니다.
  - 완료 기준: 두 영상과 오디오를 배치했을 때 전체 타임라인 움직임·길이·소리가 출력에 반영된다.
- **[P2] 미디어 복구와 자원 해제를 구현하기** — saveProject가 clip URL을 제거하며 불러오기 흐름이 없고 object URL 해제도 없습니다.
  - 완료 기준: 저장 프로젝트를 다시 열어 미디어를 복구하고 삭제·내보내기 후 URL·녹화 자원을 해제한다.

### Formwheel_Cook

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Cook/blob/f8eee5dc9b73f447e3b2e488256393ca54efcc82/index.html#L119) · 기준 커밋 f8eee5dc9b73f447e3b2e488256393ca54efcc82

- **[P2] 레시피 점수의 근거를 사용자에게 보여주기** — 레시피 매칭과 가열·혼합 규칙으로 점수를 계산합니다.
  - 완료 기준: 같은 음식은 같은 점수가 나오며 부족 재료·과조리·추천 다음 행동을 표시한다.
- **[P2] 요리 상태 저장과 되돌리기를 추가하기** — 작업대·도구·접시 상태는 메모리에만 있습니다.
  - 완료 기준: 실수한 이동·혼합을 되돌리고 새로고침 후 진행 중 요리를 복구한다.

### Formwheel_Fate

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Fate/blob/9da4b71827aaaad20e575cb587aade916cde6bc1/index.html#L393) · 기준 커밋 9da4b71827aaaad20e575cb587aade916cde6bc1

- **[P1] 점수 이동·스핀 완료를 라운드별 트랜잭션으로 묶기** — 애니메이션 뒤 로컬 roomData 점수로 타인의 점수까지 update합니다.
  - 완료 기준: 동시 STEAL·중복 탭 스핀에도 점수 이동이 유실되지 않고 라운드당 한 번만 처리된다.
- **[P2] 개인 결과와 전체 선택 통계의 일관성을 보장하기** — 개인 스핀 update 후 globalStats를 별도로 increment합니다.
  - 완료 기준: 중간 연결 실패·재시도에도 개인 선택 한 건당 전체 통계가 정확히 한 번 증가한다.

### Formwheel_Balance

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Balance/blob/46bcf755f2fa043d68c414f4405b2c443ee9e95a/index.html#L1134) · 기준 커밋 46bcf755f2fa043d68c414f4405b2c443ee9e95a

- **[P1] 라운드 해결에 중복 방지 상태를 추가하기** — checkRoundReady가 resolveRound를 호출하며 서버 측 라운드 잠금이 없습니다.
  - 완료 기준: 호스트 두 탭·중복 구독 이벤트에서도 같은 라운드의 이벤트와 점수가 한 번만 적용된다.
- **[P1] 플레이어 퇴장과 호스트 이전을 처리하기** — 자체 playerId와 방 상태를 쓰며 onDisconnect 접속 정리가 없습니다.
  - 완료 기준: 준비 중·이벤트 중 참가자 종료 후 남은 인원으로 진행하거나 종료 안내를 제공한다.

### Formwheel_WheelB

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_WheelB/blob/fd535900f181c3676afe426b3fc33f5c473eca54/index.html#L23) · 기준 커밋 fd535900f181c3676afe426b3fc33f5c473eca54

- **[P1] STEAL 양쪽 점수와 결과를 원자적으로 갱신하기** — 상대 점수 set·내 점수 update·done 변경이 별개 쓰기입니다.
  - 완료 기준: 양쪽 동시 STEAL과 중간 끊김에도 점수 총합이 보존되고 효과가 한 번만 적용된다.
- **[P1] 나가기 시 방 참가 정보를 정리하기** — leave는 go('home')만 실행해 참가자 레코드가 남습니다.
  - 완료 기준: 나간 자리로 새 참가자가 들어갈 수 있고 호스트 종료도 상대에게 안내된다.

### Formwheel_Check

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Check/blob/c754ab18264133d9baf27b231cf7c4e832f82b20/index.html#L1024) · 기준 커밋 c754ab18264133d9baf27b231cf7c4e832f82b20

- **[P1] 카테고리 체크 수의 반복문 인덱스 캡처 수정하기** — 체크 이벤트가 렌더 종료 후 증가된 index를 참조하여 해당 카테고리 숫자가 즉시 갱신되지 않습니다.
  - 완료 기준: 한 항목을 체크할 때 해당 카테고리와 전체 진행률이 동시에 갱신된다.
- **[P1] 체크 상태를 항목 단위 저장과 사용자별 경로로 개선하기** — 고정 formwheelChecklist 경로에 전체 state를 set하므로 공동 사용과 동시 탭 충돌 위험이 있습니다.
  - 완료 기준: 서로 다른 항목의 동시 체크가 모두 유지되고 개인 또는 공유 목록 범위를 명시한다.

### Formwheel_Tool

근거: [검토한 코드](https://github.com/SemicolonXSS/Formwheel_Tool/blob/a91d4f95cddcf6eac5873a2c651bc60bbdef4d17/index.html#L359) · 기준 커밋 a91d4f95cddcf6eac5873a2c651bc60bbdef4d17

- **[P1] 타이머를 종료 시각 기준으로 계산하기** — setInterval 호출마다 timerLeft를 1씩 줄여 배경 탭 제한 시 종료가 늦어질 수 있습니다.
  - 완료 기준: 탭을 30초 숨긴 뒤 복귀해도 남은 시간이 실제 경과 시간과 일치한다.
- **[P2] QR 생성의 외부 전송을 안내하거나 로컬 생성하기** — QR 문자열을 api.qrserver.com 이미지 URL의 data에 넣어 외부 서비스로 전송합니다.
  - 완료 기준: 입력 내용의 외부 전송 여부를 안내하고 민감한 텍스트를 위한 로컬 생성 경로를 제공한다.

## 공통 개선

- 30개 저장소 대부분은 index.html 하나뿐입니다. 기능별 로직·UI·Firebase 연결을 나누고, 프로젝트별 실행 방법과 데이터 경로를 README에 기록하세요.
- 운영 Firebase Rules가 저장소에 없으므로 실제 읽기·쓰기 허용 범위는 확인되지 않았습니다. Auth UID, 방 참가자·호스트 권한, 필드 타입·범위, 변경 불가 필드를 Rules와 테스트로 관리하세요.
- Firebase SDK 버전과 compat/module 방식이 프로젝트별로 다릅니다. 업그레이드 시 공통 버전과 초기화 방식을 정하고 각 프로젝트 기능을 검증하세요.
- 멀티플레이는 방 코드의 원자적 예약, 최대 인원·진행 중 참가 제한, 접속 종료·호스트 이전, 만료된 방 정리가 필요합니다.
- 모든 프로젝트에 새로 기능을 만드는 것보다 이미 있는 기능의 핵심 검증을 먼저 권합니다. Hub의 검색·설명·모드 표시, Bomb의 서버 시계 보정과 트랜잭션, GCrown·Piano·Vault의 트랜잭션, Clicker의 익명 인증·최고점 트랜잭션, AI의 전송 중복 방지는 이미 구현되어 있습니다.

## Formwheel_Check 반영 방식

기존 21개 카테고리의 문자열·순서·항목을 그대로 유지하고, `🔎 코드 분석 · 저장소명` 카테고리 30개에 총 60개 작업을 추가했습니다. 새 작업은 처음에는 미체크로 표시됩니다. 기존 Firebase 체크 데이터는 직접 변경하지 않습니다.

체크 이벤트에서 카테고리 인덱스를 고정해 해당 카테고리의 숫자가 즉시 갱신되도록 수정했습니다. 개인별 경로·항목별 저장은 이 변경에서 구현하지 않았으며 후속 개선 항목으로 남겼습니다. 새 카테고리 추가로 전체 작업 수가 늘어나므로 기존 완료 수가 같아도 진행률은 낮아질 수 있습니다.
