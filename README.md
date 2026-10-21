# 좀비 돌파: 브라우저 러너 데모

휴대폰과 PC 브라우저에서 실행되는 정적 HTML5 Canvas 게임입니다. 마우스나 손가락으로 캐릭터를 좌우로 움직이고, 캐릭터가 자동으로 전진하며 무기를 발사합니다.

## 실행

`index.html`을 브라우저에서 열면 됩니다. 빌드 도구나 서버 코드는 사용하지 않습니다. 공개 버전은 GitHub Pages에서 제공됩니다.

## 파일 구조

```text
.
├── index.html
├── styles/
│   └── main.css
├── src/
│   ├── main.js
│   ├── config.js
│   ├── GameController.js
│   ├── entities/
│   │   ├── WorldEntity.js
│   │   ├── Player.js
│   │   ├── PowerGate.js
│   │   ├── ZombieHorde.js
│   │   ├── Boss.js
│   │   ├── Projectile.js
│   │   └── WeaponPickup.js
│   ├── input/
│   │   └── PointerController.js
│   ├── render/
│   │   └── GameRenderer.js
│   └── ui/
│       └── GameUI.js
└── assets/
    └── README.md
```

## 구성 원칙

- `GameController`가 게임 상태, 진행 규칙, 충돌 검사, 게임 루프를 관리합니다.
- `entities/`의 클래스는 플레이어와 각 게임 오브젝트의 상태 및 동작을 맡습니다.
- `GameRenderer`는 게임 규칙을 변경하지 않고 화면에 그리는 일만 담당합니다.
- `PointerController`는 마우스와 터치 입력을 통일된 좌우 이동 값으로 바꿉니다.
- `GameUI`는 시작·재시작 화면과 공격력, 구간, 처치 수를 표시합니다.
- `config.js`의 상수에서 공격력 상한, 게이트 수치, 보스 체력과 등장 처치 수를 조절합니다.

## 새 오브젝트 추가하기

1. `src/entities/`에 `WorldEntity`를 상속하는 클래스를 추가하고 `type`을 지정합니다.
2. 생성과 진행 규칙은 `GameController.spawnEntity()` 및 `resolveEncounters()`에 연결합니다.
3. 표현은 `GameRenderer.draw()`에 해당 `type`의 그리기 함수를 연결합니다.
4. 화면 크기와 깊이에 따른 위치는 `projectX()`와 `projectY()`를 사용합니다. 충돌 검사도 같은 투영 좌표를 사용해야 보이는 위치와 판정 위치가 어긋나지 않습니다.

## 배포

GitHub Pages가 `main` 브랜치의 루트 폴더를 게시합니다. 파일 경로는 상대 경로(`./src/...`, `./styles/...`)를 유지해야 프로젝트 페이지에서도 모듈을 찾을 수 있습니다.
