/* DAY 1 / DAY 2 일정 전환 기능 — 일정 문구는 schedules 객체에서 수정하세요. */
const schedules={1:['09:00 파크골프 라운딩','12:30 지역 맛집','14:00 관광 명소','17:00 숙소 체크인','19:00 로컬 맛집 및 야경'],2:['08:00 조식','09:30 지역 명소','11:30 카페','13:00 로컬 맛집','15:00 여행 마무리']};
const schedule=document.querySelector('#schedule');
function showDay(day){schedule.innerHTML='<ul>'+schedules[day].map(item=>`<li>${item}</li>`).join('')+'</ul>'}document.querySelectorAll('[data-day]').forEach(btn=>btn.addEventListener('click',()=>showDay(btn.dataset.day)));showDay(1);
