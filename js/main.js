/* =========================================================
   PLAY & TRAVEL 스크립트 (순수 JS, 라이브러리 없음)
   [수정 가이드] 일정/후기 간격 등 자주 바꾸는 값은 맨 위 설정에 모아두었습니다.
   ========================================================= */
'use strict';

/* 0. 설정 ---------------------------------------------------
   COURSES: 3번 BEST COURSE 카드(data-region)와 키가 같아야 합니다.
   일정 한 줄 = [시간, 제목, 설명] */
const COURSES = {
  jeju:{title:'제주 하루 코스',steps:[
    ['09:00','파크골프 라운딩','바다가 보이는 코스에서 가볍게 9홀'],
    ['12:30','흑돼지·갈치 점심','현지인이 찾는 식당'],
    ['14:00','해안 드라이브와 오름 산책','해 질 무렵 풍경이 좋은 구간'],
    ['17:00','숙소 체크인','바다 전망 숙소']]},
  gangwon:{title:'강원 하루 코스',steps:[
    ['09:00','파크골프 라운딩','숲 사이 코스, 아침 공기가 시원합니다'],
    ['12:30','막국수·감자옹심이 점심','강원도 향토 음식'],
    ['14:00','호수 둘레길 산책','평탄한 길로 천천히'],
    ['17:00','숙소 체크인','계곡 옆 펜션']]},
  namdo:{title:'남도 하루 코스',steps:[
    ['09:00','파크골프 라운딩','강변 코스에서 여유롭게'],
    ['12:30','남도 한정식 점심','제철 반찬이 가득한 한 상'],
    ['14:00','정원과 한옥마을 관광','그늘 많은 산책로'],
    ['17:00','숙소 체크인','한옥 스테이']]}
};
const SLIDE_INTERVAL = 5000;   // 후기 자동 전환 시간(ms)

const $  = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

/* 1. 이미지 대체 처리 ---------------------------------------
   이미지 로드에 실패하면 img에 'missing' 클래스를 붙여 CSS 그라데이션 배경이 보이게 합니다.
   (이미지를 교체하면 자동으로 정상 표시) */
$$('img').forEach(img => {
  const mark = () => img.classList.add('missing');
  img.addEventListener('error', mark);
  if (img.complete && img.naturalWidth === 0) mark();
});

/* 2. 헤더: 스크롤 배경 + 모바일 메뉴 + 현재 섹션 표시 --------- */
const header = $('#header'), nav = $('#nav'), toggle = $('#navToggle');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 60);
onScroll();
window.addEventListener('scroll', onScroll, {passive:true});

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);       // 접근성 상태 동기화
});
$$('.nav a').forEach(a => a.addEventListener('click', () => {  // 메뉴 선택 시 닫기
  nav.classList.remove('open'); toggle.setAttribute('aria-expanded', false);
}));

// IntersectionObserver: 화면 중앙에 들어온 섹션의 메뉴에 .active 부여
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    $$('.nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  });
}, {rootMargin:'-45% 0px -50% 0px'});
$$('main section[id]').forEach(s => spy.observe(s));

/* 3. 숫자 카운트업 (ABOUT) -----------------------------------
   화면에 보일 때 한 번만 0에서 data-count 값까지 올라갑니다. */
const counter = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, t0 = performance.now(), dur = 1200;
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(end * p);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    obs.unobserve(el);
  });
}, {threshold:.6});
$$('[data-count]').forEach(el => counter.observe(el));

/* 4. 추천 여행지 카드 → 하루 코스 타임라인 교체 -------------- */
const timeline = $('#timeline'), courseTitle = $('#courseTitle');
function renderCourse(key){
  const c = COURSES[key]; if (!c) return;
  courseTitle.textContent = c.title;
  // 데이터 배열을 <li>로 변환 (textContent 사용으로 XSS 방지)
  timeline.replaceChildren(...c.steps.map(([time, title, desc]) => {
    const li = document.createElement('li');
    const t = document.createElement('time'); t.textContent = time;
    const h = document.createElement('h3');   h.textContent = title;
    const p = document.createElement('p');    p.textContent = desc;
    li.append(t, h, p); return li;
  }));
}
$$('.card').forEach(card => card.addEventListener('click', () => {
  $$('.card').forEach(c => { c.classList.toggle('active', c === card); c.setAttribute('aria-selected', c === card); });
  renderCourse(card.dataset.region);
  $('#course').scrollIntoView({behavior:'smooth'});  // 선택 후 코스 영역으로 이동
}));
renderCourse('jeju');   // 첫 화면 기본값

/* 5. DESTINATION 탭 ---------------------------------------- */
$$('.tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.tab').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab); });
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab.dataset.tab));
}));

/* 6. 후기 슬라이더: 이전/다음 + 자동 재생 + 터치 스와이프 ----- */
const track = $('#track'), slides = $$('.slide'), countEl = $('#count');
let idx = 0, timer;
function go(n){
  idx = (n + slides.length) % slides.length;             // 처음/끝에서 순환
  track.style.transform = `translateX(-${idx * 100}%)`;
  countEl.textContent = `${idx + 1} / ${slides.length}`;
}
const auto = () => { clearInterval(timer); timer = setInterval(() => go(idx + 1), SLIDE_INTERVAL); };
$('#prev').addEventListener('click', () => { go(idx - 1); auto(); });
$('#next').addEventListener('click', () => { go(idx + 1); auto(); });
let x0 = null;                                            // 모바일 스와이프
track.addEventListener('touchstart', e => x0 = e.touches[0].clientX, {passive:true});
track.addEventListener('touchend', e => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0;
  if (Math.abs(dx) > 40){ go(idx + (dx < 0 ? 1 : -1)); auto(); }
  x0 = null;
});
go(0); auto();

/* 7. CTA 이메일 폼 검사 -------------------------------------
   지금은 형식만 검사합니다. 실제 접수는 form action 또는 fetch(서버 주소)를 여기에 연결하세요. */
$('#ctaForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('#email').value.trim(), msg = $('#formMsg');
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  msg.textContent = ok ? '신청되었습니다. 여행 소식을 보내드릴게요.' : '이메일 형식을 확인해 주세요. 예: name@email.com';
  if (ok) e.target.reset();
});
