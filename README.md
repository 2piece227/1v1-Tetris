# 블럭아웃 대전 · 1P vs 2P

한 화면을 좌우로 나눠 두 명이 겨루는 블럭아웃 방식 3D 테트리스.
축제 부스의 아케이드 게임기용으로, 로컬에서 키보드(또는 USB 아케이드 인코더)
두 세트로 돌아간다.

머리 위에서 우물을 수직으로 내려다보는 **탑다운 시점**이고, 깊이는 원근
축소로 읽는다. 층 경계마다 사각 링을 그려서 위에서 보면 안쪽으로 겹쳐 들어간다.

> VR 1인용판은 별도 저장소: [2piece227/Tetris](https://github.com/2piece227/Tetris)
> 게임 로직(`src/game/`)은 두 저장소가 같고, 렌더링·입력만 다르다.
> **로직 버그는 양쪽에 각각 고쳐야 한다.**

## 실행

```bash
npm install
npm run dev        # http://localhost:5174
```

## 아케이드 게임기 설정

주소창 없는 창으로 띄우려면 바로가기 하나면 된다.

```bash
chrome.exe --app=http://localhost:5174 --start-fullscreen
```

`--kiosk` 대신 `--app`을 쓰는 이유는 창 크기·위치를 직접 지정할 수 있어서다.
게임 중 <kbd>F5</kbd>는 막아뒀다(전체화면 창이 날아가는 사고 방지).

## 조작

아케이드 패널 기준으로 **4방향 스틱 + 버튼 7개 = 11개 입력**을 쓴다.
축마다 양방향 버튼이 있어서 짧은 쪽으로 돌릴 수 있다.

| | 1P | 2P |
|---|---|---|
| 이동 | <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> | 방향키 |
| 회전 X / Y / Z | <kbd>Q</kbd> <kbd>E</kbd> <kbd>R</kbd> | <kbd>U</kbd> <kbd>I</kbd> <kbd>O</kbd> |
| 반대 회전 X / Y / Z | <kbd>Z</kbd> <kbd>C</kbd> <kbd>V</kbd> | <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> |
| 하드 드롭 | <kbd>Space</kbd> | <kbd>Enter</kbd> |
| 시작 / 재시작 | <kbd>Space</kbd> 또는 <kbd>Enter</kbd> | |

키 바인딩은 `event.key`가 아니라 **`event.code`** 기준이다. 기기가 다른 자판
배열로 부팅해도 패널 버튼의 의미가 바뀌지 않는다.
바꾸려면 [`src/input/keyboard.ts`](src/input/keyboard.ts)의 `P1_KEYS` / `P2_KEYS`.

## 옆의 층 게이지

블럭아웃이 우물 옆에 붙여둔 그 표시. 장식이 아니라 **필수**다 — 수직으로
내려다보면 꽉 찬 층과 세 칸 아래 빈 층이 화면상 같은 몇 픽셀이라, 각 층이
얼마나 찼는지 읽을 수 있는 유일한 수단이다. 한 칸 남은 층은 색이 따로 뜬다.

## 미정: 공격 규칙

한쪽이 층을 지웠을 때 상대에게 무엇을 보낼지는 아직 정하지 않았다.
[`src/main.ts`](src/main.ts)의 `sendAttack()`에 비워둔 훅이 있고, 후보는 둘이다.

1. **무작위 구멍** — 일반 테트리스처럼 한 칸 빠진 층을 밀어 넣되 구멍 위치가 매번 다르다.
2. **같은 열 구멍** — 연속 공격이 같은 열에 쌓여 상대 우물에 세로 통로가 생긴다.

2번은 연속 클리어를 보상하고 그림이 재밌게 나오지만, 받는 쪽이 긴 조각 하나로
정리하기 쉬워질 수 있다. `victim.grid`만 건드리면 되고, 층을 밀어 올리는 로직은
`Grid`에 이미 있다.

## 튜닝

- 우물 크기(4×4×10)·낙하 속도·점수: [`src/config.ts`](src/config.ts)
- 조각 세트와 점수별 가방 구성: [`src/game/pieces.ts`](src/game/pieces.ts)
- 탑다운 카메라 높이·화각: `TOPDOWN` in [`src/config.ts`](src/config.ts)

> 낙하 속도는 VR판에서 그대로 가져온 값이라 대전용으로는 느릴 수 있다
> (`BASE_DROP_MS = 2000`이면 조각 하나가 바닥까지 20초). 부스에서 재보고 조정할 것.

## 배포

`main`에 푸시하면 GitHub Actions가 `dist/`를 빌드해 Pages에 올린다.
`vite.config.ts`의 `base: "./"` 덕분에 어떤 하위 경로에서도 그대로 동작한다.
