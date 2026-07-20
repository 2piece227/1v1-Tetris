# VR 블럭아웃 · 3D 테트리스 (Meta Quest 3)

Babylon.js + WebXR로 만든 블럭아웃 방식 3D 테트리스. 정육면체 우물(pit)에
조각이 떨어지고 X/Y/Z 세 축으로 회전시키며, 한 층이 가득 차면 사라진다.
Quest 3 브라우저에서 URL만 열면 실행되므로 앱 설치·사이드로드가 필요 없다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173  (LAN에도 노출됨 → Quest 브라우저로 접속)
```

Quest 3에서 플레이하려면 같은 Wi-Fi에서 헤드셋 브라우저로 PC의 LAN 주소
(`http://<PC-IP>:5173`)를 열고 우하단 고글 버튼을 누른다.
※ WebXR은 **HTTPS**가 필요하다. 실제 배포는 아래 참고.

## 배포 (GitHub Pages, HTTPS 자동)

```bash
npm run build      # dist/ 생성
# dist/ 내용을 gh-pages 브랜치나 Pages 설정 경로에 올림
```

## 조작

| | 키보드(데스크톱) | VR(Quest 컨트롤러) |
|---|---|---|
| 이동 X/Z | ← → ↑ ↓ | 왼쪽 스틱 |
| 회전 X축 | I / K | 오른쪽 스틱 상하 |
| 회전 Y축 | J / L | 오른쪽 스틱 좌우 |
| 회전 Z축 | U / O | A / B 버튼 |
| 하드 드롭 | Space | 오른쪽 트리거 |
| 소프트 드롭 | Shift(홀드) | 왼쪽 그립/트리거 |

## 튜닝

- 우물 크기·낙하 속도·점수: [`src/config.ts`](src/config.ts)
- 조각 세트: [`src/game/pieces.ts`](src/game/pieces.ts)
