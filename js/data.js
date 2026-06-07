/**
 * RE:PIUM 사업계획서 — 데이터 & 상수 관리
 * 모든 수치·출처·브랜드명을 한 곳에서 관리합니다.
 * 수정 시 이 파일만 변경하면 전체 페이지에 반영됩니다.
 */

const BRAND = {
  name: '다시, 피움',
  nameEn: 'RE:PIUM',
  tagline: '버려질 커피박을 재활용해, 향·탈취·친환경을 담은 향초로 되살리는 사업',
  team: '임상민, 서정빈',
  item: '커피 찌꺼기(커피박) 업사이클링 친환경 향초',
};

const MARKET = {
  coffeePerCapita: 353,
  coffeeVsWorld: 2.7,
  coffeePerCapitaSource: '현대경제연구원',

  brewExtract: 0.2,
  brewWaste: 99.8,
  brewSource: '환경 관련 보도 종합',

  groundsPerYear: 15,
  groundsYear: 2019,
  groundsSource: '환경부 추정',

  policyYear: 2022,
  policyDesc: '커피박을 순환자원으로 인정·재활용 간소화 추진',
  policySource: '환경부',

  candleMarket2024: 2700,
  candleMarket2024USD: 2,
  candleCAGR: 5.0,
  candleMarket2033: 4200,
  candleMarket2033USD: 3.1,
  candleSource: 'IMARC Group (추정, 환율·시점에 따라 변동)',

  growthDrivers: [
    '웰빙·아로마테라피',
    '홈데코·선물 수요',
    '가치소비·ESG 트렌드',
    '홈카페 문화',
  ],
};

const COFFEE_GROUNDS = {
  deodorize: {
    icon: '🫧',
    title: '탈취',
    desc: '다공성(셀룰로오스 그물망) 구조가 냄새 분자 흡착 (숯과 동일 원리). 활성탄 대비 약 60~75% 수준이나 원료비 0원.',
    source: '생활정보 보도 종합',
  },
  aroma: {
    icon: '☕',
    title: '카페 향',
    desc: '커피 고유의 은은한 향이 공간에 카페 감성을 부여.',
    source: '제품 특성',
  },
  eco: {
    icon: '♻️',
    title: '친환경·탄소 저감',
    desc: '소각·매립 대신 재활용 → 탄소 배출 감소, 순환경제 기여.',
    source: '환경부',
  },
  fertilizer: {
    icon: '🌱',
    title: '끝까지 순환 (거름)',
    desc: '질소·칼륨·마그네슘 풍부, 중금속 없음 → 다 쓴 향초의 커피박을 화분 거름으로 재활용.',
    source: '생활정보 보도 종합',
  },
  summer: {
    icon: '🍃',
    title: '벌레가 싫어하는 향 (여름 에디션)',
    desc: '커피향 단독은 근거 약함. 시트로넬라·레몬그라스 천연 오일을 더한 여름 한정 에디션.',
    source: '생활정보 보도 종합 (살충 효과 아님, 기피 향 수준)',
  },
  moldRisk: {
    stat: 70,
    desc: '수분 잔류 시 24시간 내 곰팡이 발생 확률 약 70%',
    solution: '수분 10% 이하 저온 건조 필수',
    source: '생활정보 보도 종합',
  },
};

const UNIT_ECONOMICS = {
  price: 22000,
  volume: '200ml',
  positioning: '프리미엄·선물 포지셔닝',

  directMaterials: [
    { name: '소이왁스 150g', cost: 975, note: '1kg 6,500원 기준' },
    { name: '합성향료 12g', cost: 3080, note: '30g 7,700원 기준' },
    { name: '용기 1개', cost: 1000 },
    { name: '면심지+심지탭+고정재', cost: 150, note: '면심지 450cm 5개 3,000원 기준' },
    { name: '라벨·패키지', cost: 1500 },
    { name: '커피박', cost: 0, note: '팀 카페 공급' },
  ],
  directMaterialsTotal: 6705,

  variablePackingLogistics: 800,
  fundingFeeRate: 8,
  fundingFee: 1760,

  totalVariableCost: 9265,      // 6705 + 800 + 1760
  contributionMargin: 12735,    // 22000 - 9265
  contributionMarginRate: 58,   // 약 58%
};

const FIXED_COSTS = {
  total: 3000000,   // 초기 투자비(일회성) 약 300만: 설립자금 소계
  items: [
    { name: '임대보증금', detail: '', cost: 1000000 },
    { name: '시설비', detail: '식품건조기·멜팅도구·몰드·용기', cost: 1000000 },
  ],
  equipmentNote: '본격 설비 거의 불필요(저설비 제품). 핵심 장비는 커피박 건조기.',
  equipmentSmall: '소규모 시작 25~45만',
  equipmentMass: '양산 대비 70~130만',
};

const BUDGET = {
  funding: [
    { priority: 1, source: '자기자본 (기존 자본금)', role: '초기 장비·자재·운영', note: '' },
    { priority: 2, source: '정부 창업지원금 (조달 추진 중)', role: '양산·인증·BM 고도화', note: '예: 창업중심대학 청년 예비창업자 지원 등 (2026년 공고 기준, 최대 수천만 원 규모, 금액 미확정)' },
    { priority: 3, source: '크라우드펀딩 (선주문)', role: '초기 판매·수요검증 채널', note: '필수 전제 아님, 다채널 중 하나' },
  ],
  teamNote: '팀은 만 29세 이하 생애최초 예비창업자로, 청년창업 지원 대상에 해당.',
  depositNote: '임대보증금은 회수되는 자산으로 비용 합계에서 제외 (공유공방·단기임대로 최소 가정, 별도 관리)',
  setup: [
    { name: '식품건조기', cost: 200000, source: '자기자본' },
    { name: '멜팅도구·온도계·저울', cost: 150000, source: '자기자본' },
    { name: '몰드·초기 용기', cost: 250000, source: '자기자본' },
    { name: '제품 안전 신고·시험비', cost: 400000, source: '자기자본', note: '안전확인대상생활화학제품 적합확인·신고 (KTR 등)' },
  ],
  setupTotal: 1000000,   // 100만 원
  operation: [
    { name: '인건비', cost: 0, source: '—', note: '초기 팀 직접 제작, 수익 안정화 후 반영' },
    { name: '임차료 (월 50만×6)', cost: 3000000, source: '자기자본·매출' },
    { name: '공과금·관리비 (전기·수도·인터넷 월 8만×6)', cost: 480000, source: '매출', note: '건조기·멜팅기 가동으로 전기 비중 큼' },
    { name: '마케팅비 (디자인80+촬영60+콘텐츠40)', cost: 1800000, source: '자기자본·매출' },
    { name: '소모품·예비 (초도 자재·포장재·예비)', cost: 600000, source: '자기자본' },
  ],
  operationTotal: 5880000,
  grandTotal: 6880000,    // 약 688만 원 (보증금 별도)
  period: '6개월',
  monthlyFixed: 580000,   // 월 고정비 = 임차 50만 + 공과금 8만 (인건비 0, 마케팅 일회성 제외)
};

const BEP = {
  contributionMargin: 12735,
  monthlyFixed: 580000,        // 월 고정비 58만
  monthlyBepQty: 46,           // 58만 ÷ 12,735 ≈ 46개/월
  monthlyBepRevenue: 1012000,  // 약 101만/월
  // 시나리오
  scenarios: [
    { monthly: 46,  profit: 0,      payback: '—',          note: 'BEP (흑자 전환점)' },
    { monthly: 100, profit: 693500, payback: '약 3.5개월', note: '초기투자 240만 회수' },
    { monthly: 150, profit: 1330250, payback: '약 1.8개월', note: '초기투자 240만 회수' },
  ],
  initialInvestment: 2400000,  // 시설60만 + 마케팅180만 (일회성)
  capacityUtil: 5,             // BEP 46개 / 생산능력 1,000개 = 가동률 약 5%
};

const FUNDING = {
  target1Units: 500,
  target1Revenue: 11000000,
  target1Note: '1차 목표 판매 500개 (다채널 합산: 자사몰·카페·펀딩·B2B)',
  note: '가정·예시',
  channels: ['자사몰·스마트스토어', '팀 카페·제휴 카페 입점', 'B2B (카페 PB·기업 ESG)', '크라우드펀딩 (신제품 런칭용)'],
};

const COMPETITORS = [
  {
    name: '커피어게인',
    type: '커피박 소이캔들',
    price: '7,500~11,000원',
    priceScore: 0.9,        // 만 원 단위 (평균 ~9,000원)
    diffScore: 5,           // 차별성·로컬 관계성 (10점 만점)
    features: '와디즈 펀딩 경험',
    weakness: '로컬 PB·방충 라인 없음',
    posX: 35, posY: 50,
  },
  {
    name: '커피점토 B2B',
    type: '커피박 소재·화분',
    price: 'B2B',
    priceScore: 0.5,        // 만 원 단위 (소비자가 기준 ~5,000원)
    diffScore: 3,
    features: '소재 활용',
    weakness: '소비자 접점 약함',
    posX: 20, posY: 30,
  },
  {
    name: '일반 향초 브랜드',
    type: '향초·디자인',
    price: '15,000~40,000원',
    priceScore: 2.8,        // 만 원 단위 (평균 ~28,000원)
    diffScore: 3.5,
    features: '향·디자인 강점',
    weakness: '스토리·친환경 약함',
    posX: 75, posY: 35,
  },
  {
    name: 'RE:PIUM (우리)',
    type: '로컬 순환 + 카페 PB + 탈취 + 여름 라인',
    price: '22,000원',
    priceScore: 2.2,        // 만 원 단위
    diffScore: 8,           // 로컬 관계성·PB 모델·차별화 라인업
    features: '로컬 관계성·PB 모델·차별화 라인업',
    weakness: '신규 브랜드 인지도',
    posX: 65, posY: 80,
  },
];

const BMC = {
  customerSegments: [
    '홈카페·오피스 2030',
    '친환경 선물 구매자 (전 세대)',
    '제휴 카페 (B2B2C)',
    '기업 ESG 선물',
  ],
  valueProposition: [
    '버려질 커피박 → 향+탈취+친환경+로컬 순환 스토리',
    '"카페 감성을 집·사무실로"',
    '여름 방충 라인',
  ],
  channels: [
    '와디즈/텀블벅 펀딩',
    '자사몰·스마트스토어',
    '제휴 카페 입점',
    '인스타·숏폼',
  ],
  customerRelationships: [
    '펀딩 서포터 커뮤니티',
    '거름 안내·리필 등 순환 프로그램',
    '정기구독',
  ],
  revenueStreams: [
    '제품 판매·선물세트',
    '카페 PB 공급',
    '기업 ESG 굿즈',
    'DIY 클래스',
  ],
  keyResources: [
    '팀 카페의 커피박 공급',
    '건조·조향 노하우',
    '브랜드 스토리',
    '디자인',
  ],
  keyActivities: [
    '커피박 수거·건조',
    '캔들 제조',
    '펀딩·마케팅',
    '제휴 카페 관리',
  ],
  keyPartners: [
    '팀 카페 + 제휴 카페',
    '커피박 수거 네트워크/지자체',
    '왁스·향료·패키지 공급사',
    '펀딩 플랫폼',
    '커피점토 소재사',
  ],
  costStructure: [
    '재료비',
    '인건비',
    '펀딩 수수료',
    '마케팅/촬영',
    '패키지',
    '초기 장비',
  ],
};

const ROADMAP = [
  {
    phase: 'Phase 1',
    period: '0~6개월',
    title: '수요 검증',
    items: [
      '크라우드펀딩으로 수요 검증·선주문',
      '시그니처 라인 출시',
      '팀 카페 파일럿 운영',
    ],
  },
  {
    phase: 'Phase 2',
    period: '6~18개월',
    title: '채널 확장',
    items: [
      '자사몰·스마트스토어 상시판매',
      '제휴 카페 5~10곳 입점',
      '여름 방충 에디션 출시',
    ],
  },
  {
    phase: 'Phase 3',
    period: '18개월~',
    title: '스케일업',
    items: [
      '카페 PB 제조 확대',
      '기업 ESG 굿즈 B2B',
      '라인 확장 (디퓨저·스크럽)',
    ],
  },
];

const MANUFACTURING = [
  { step: 1, name: '수거', desc: '제휴 카페에서 커피박 수거' },
  { step: 2, name: '저온 건조', desc: '수분 10% 이하까지 건조 (곰팡이 방지 핵심)' },
  { step: 3, name: '분쇄·체질', desc: '균일한 입자 크기로 가공' },
  { step: 4, name: '왁스 용해', desc: '소이왁스를 적정 온도로 용해' },
  { step: 5, name: '배합', desc: '향료·커피박·오일 배합' },
  { step: 6, name: '심지 고정', desc: '용기에 심지 센터링·고정' },
  { step: 7, name: '붓기', desc: '배합된 왁스를 용기에 주입' },
  { step: 8, name: '큐어링', desc: '24~48시간 경화·숙성' },
  { step: 9, name: 'QC·패키지', desc: '품질 검수 후 라벨·포장' },
];

const RISKS = [
  {
    risk: '신규성 부족 / 유사 제품 존재',
    response: '로컬·PB·여름방충 차별화, 카페 파일럿 진정성',
    severity: '중',
  },
  {
    risk: '곰팡이·위생 문제',
    response: '저온건조 표준화 (수분 10% 이하), QC 프로세스',
    severity: '고',
  },
  {
    risk: '수요 불확실',
    response: '펀딩 선검증 → 재고·자본 리스크 최소화',
    severity: '중',
  },
  {
    risk: '원료(커피박) 확장성',
    response: '제휴카페·지자체 수거망 확대',
    severity: '저',
  },
  {
    risk: '효능표시 법규 리스크',
    response: '단정·살충 표현 회피, "기피 향" 수준 표현',
    severity: '중',
  },
];

const MARKETING_FUNNEL = {
  structure: '다채널 판매',
  channels: [
    { title: '자사몰·스마트스토어', desc: '상시 판매 (온라인 핵심)' },
    { title: '팀 카페·제휴 카페 입점', desc: '오프라인 체험·판매' },
    { title: 'B2B (카페 PB·기업 ESG 굿즈)', desc: '대량·반복 매출' },
    { title: '크라우드펀딩', desc: '신제품 런칭·수요검증 채널 (여러 채널 중 하나)' },
  ],
  keyMessage: '단일 채널 의존이 아닌 다채널 매출 구조. 펀딩은 신제품 런칭용 채널.',
};

const PROCESS_SIM = {
  batchSize: 50,
  activeHours: 2.7,
  yieldRate: 96,
  dryYield: 30,
  monthlyCapacity: 1000,   // 1일 1배치 × 20일
  cafeSupply: 1000,         // 팀 카페 일 150잔 → 월 약 1,000개분
  firstFunding: 500,
  productionDays: 10,       // 1차 펀딩 500개 ≈ 약 10일
  drying: {
    method: '저온 식품건조기',
    temp: '60℃ 내외',
    thickness: '0.5~1cm로 얇게 펴기',
    duration: '4~8시간',
    target: '수분 10% 이하 (손에서 부서지는 질감)',
    protocol: '당일 수거·당일 건조, 건조 후 밀폐 보관',
  },
  steps: [
    { n:1, name:'수거',      input:'젖은 커피박 ~3kg (일 150잔분)', active:10, passive:'—',        out:'3kg(습)',                  equip:'밀폐 용기' },
    { n:2, name:'저온 건조',  input:'60℃, 0.5~1cm, 4~8시간',       active:15, passive:'4~8시간',   out:'~0.9kg(건조) · 수율 ~30%', equip:'식품 건조기' },
    { n:3, name:'분쇄·체질',  input:'입자 균일·이물 제거',           active:20, passive:'—',        out:'~0.85kg · 손실 ~5%',       equip:'분쇄기·체' },
    { n:4, name:'왁스 용해',  input:'소이왁스 7.5kg · 75℃',        active:10, passive:'30분',      out:'용융 왁스 7.5kg',          equip:'멜팅기/인덕션' },
    { n:5, name:'배합',       input:'향료 0.6kg+커피박 · 60℃',     active:15, passive:'—',        out:'혼합물',                   equip:'비커·온도계' },
    { n:6, name:'심지 고정',  input:'심지 50개 중앙 고정',           active:20, passive:'—',        out:'50개 세팅',                equip:'글루건·심지탭' },
    { n:7, name:'붓기',       input:'55℃ 충전+토핑',               active:25, passive:'—',        out:'50개 충전',                equip:'계량 도구' },
    { n:8, name:'큐어링',     input:'경화·향 안정화',               active:5,  passive:'24~48시간', out:'대기',                    equip:'경화 선반' },
    { n:9, name:'QC·패키지',  input:'검수·라벨·포장',               active:40, passive:'—',        out:'양품 48개 (96%)',          equip:'작업대' },
  ],
};

const RECIPE = {
  perUnit: {
    soyWax: { amount: 150, unit: 'g' },
    fragrance: { amount: 12, unit: 'g', ratio: '약 8%' },
    driedGrounds: { amount: 18, unit: 'g', detail: '왁스 혼합 8g + 토핑 10g' },
    wick: { amount: 1, unit: '개' },
    container: { amount: 1, unit: '개' },
    totalContent: { amount: 162, unit: 'g', note: '내용물 약 162g' },
  },
  // 자재 소요 표
  requirements: [
    { item: '소이왁스', per1: '150g', per50: '7.5kg', per500: '75kg' },
    { item: '합성향료', per1: '12g', per50: '0.6kg', per500: '6kg' },
    { item: '건조 커피박', per1: '18g', per50: '0.9kg', per500: '9kg' },
    { item: '젖은 커피박 (역산)', per1: '약 60g', per50: '약 3kg', per500: '약 30kg' },
    { item: '생산 소요', per1: '—', per50: '1일', per500: '약 10일' },
  ],
  impact: {
    cupsPerCandle: '약 2.5~3잔분',
    driedPerCandle: '18g',
    funding500Dried: '약 9kg',
    funding500Wet: '약 30kg',
  },
};
