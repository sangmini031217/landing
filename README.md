# RE:PIUM (다시, 피움) — 사업계획서 웹사이트

커피박 업사이클링 향초 창업 사업계획서를 한 페이지 스크롤형 웹사이트로 구현한 프로젝트입니다.

## 실행 방법

### 가장 간단한 방법
`index.html` 파일을 브라우저에서 직접 열면 됩니다.
- macOS: `open index.html`
- Windows: 파일 더블클릭 또는 브라우저에 드래그

### 로컬 서버 (선택사항)
일부 브라우저 보안 정책으로 로컬 파일 접근이 제한될 경우:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (npx)
npx serve .
```
이후 `http://localhost:8000` 접속.

## 파일 구조

```
├── index.html          메인 HTML (전체 섹션 구조)
├── css/
│   └── style.css       스타일시트 (반응형 포함)
├── js/
│   ├── data.js         모든 수치·출처·브랜드명 (상수 관리)
│   ├── charts.js       Chart.js 기반 차트 렌더링
│   └── main.js         네비게이션·스크롤·인터랙션
└── README.md           이 파일
```

## 수치 수정 방법

모든 데이터는 `js/data.js`에 집중 관리됩니다.

- **브랜드명 변경**: `BRAND.name`, `BRAND.nameEn` 수정
- **팀원 변경**: `BRAND.team` 수정
- **시장 수치**: `MARKET` 객체
- **원가 수정**: `UNIT_ECONOMICS` 객체
- **고정비 수정**: `FIXED_COSTS` 객체
- **펀딩 목표 수정**: `FUNDING` 객체

## 외부 의존성 (CDN)

| 라이브러리 | 버전 | 용도 | CDN |
|---|---|---|---|
| Chart.js | 4.4.7 | 차트 렌더링 | `https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js` |
| Noto Serif KR | - | 에디토리얼 헤드라인 | Google Fonts |
| Manrope | - | 본문 서체 (SoDoSans 대체) | Google Fonts |

> 인터넷 연결이 필요합니다 (폰트·Chart.js CDN 로드).

## 배포 안내

정적 파일만으로 구성되어 있어, 어떤 정적 호스팅이든 사용 가능합니다:

- **GitHub Pages**: 레포지토리에 push 후 Settings > Pages에서 활성화
- **Netlify/Vercel**: 폴더를 드래그 앤 드롭으로 배포
- **학교 서버**: FTP로 파일 업로드

## 주의사항

- 모든 통계 수치는 명시된 출처에 기반합니다. 임의 생성된 수치가 없습니다.
- '가정·예시·추정'으로 표기된 수치는 팀의 계획치이며, 실제와 다를 수 있습니다.
- 살충·의학적·100% 단정 표현은 의도적으로 배제했습니다.
