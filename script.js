/* ========================================
   Metaball Chat UI - 메인 스크립트
   
   이 파일은 채팅 UI의 모든 동작을 담당합니다:
   - 메시지 전송/표시
   - 리퀴드 메타볼 효과 (버블 합치기)
   - 애니메이션
   ======================================== */

class MetaballChat {
  /* ========================================
     생성자 - 앱 초기화
     - DOM 요소 참조 저장
     - 이벤트 리스너 설정
     ======================================== */
  constructor() {
    // DOM 요소 참조 저장
    this.messagesContainer = document.getElementById('messages');   // 메시지 영역
    this.messagesWrapper = document.querySelector('.messages-wrapper'); // 메시지 래퍼
    this.messageInput = document.getElementById('messageInput');    // 입력창
    this.sendBtn = document.getElementById('sendBtn');              // 전송 버튼
    this.refreshBtn = document.getElementById('refreshBtn');        // 새로고침 버튼
    this.deviceFrame = document.querySelector('.device-frame');     // 디바이스 프레임
    
    // 모든 버블 정보를 저장하는 배열
    this.bubbles = [];
    
    // 🎨 리퀴드 합치기 타이머 (1초 후 합침)
    this.mergeTimer = null;
    this.mergeDelay = 1000;  // 밀리초 - 수정 가능
    
    // 초기화 실행
    this.init();
  }

  /* ========================================
     초기화 함수
     - 이벤트 리스너 등록
     - 초기 메시지 표시
     ======================================== */
  init() {
    // 전송 버튼 클릭 이벤트
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    
    // Enter 키 입력 이벤트
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    
    // 새로고침 버튼 클릭 이벤트
    this.refreshBtn.addEventListener('click', () => this.clearMessages());
    
    // 프로필 영역 클릭 이벤트 - 초기 메시지를 보내는 메시지로 추가
    const profileArea = document.querySelector('.profile-area');
    if (profileArea) {
      profileArea.addEventListener('click', () => {
        this.addMessage('ㅋ~ㅋ', 'received');
        setTimeout(() => this.addMessage('ㅋㅋㅋㅋㅋㅋㅋ', 'received'), 300);
        setTimeout(() => this.addMessage('진짜?ㅋ', 'received'), 600);
      });
    }
    
    /* ========================================
       입력창 포커스 이벤트
       - 포커스 시 키보드 열림 상태로 전환
       - 블러 시 원래 상태로 복귀
       ======================================== */
    this.messageInput.addEventListener('focus', () => {
      this.deviceFrame.classList.add('keyboard-open');
    });
    
    this.messageInput.addEventListener('blur', () => {
      // 약간의 딜레이 후 키보드 닫힘 처리 (버튼 클릭 허용)
      setTimeout(() => {
        if (document.activeElement !== this.messageInput) {
          this.deviceFrame.classList.remove('keyboard-open');
        }
      }, 100);
    });
    
    /* ========================================
       모바일 visualViewport 대응
       - 실제 키보드가 올라올 때 viewport 크기 변화 감지
       - CSS 변수로 실제 viewport 높이 전달
       - iOS/Android 모두 대응
       ======================================== */
    this.setupMobileViewport();

    /* ========================================
       초기 메시지 추가
       - 앱 시작 시 보여줄 샘플 메시지
       ======================================== */
    this.addMessage('앜ㅋ', 'received');
    setTimeout(() => this.addMessage('ㅋㅋㅋㅋㅋㅋㅋㅋ', 'received'), 300);
    setTimeout(() => this.addMessage('뭐행?', 'received'), 600);
  }

  /* ========================================
     메시지 전송 함수
     - 입력창의 텍스트를 가져와 메시지로 추가
     ======================================== */
  sendMessage() {
    const text = this.messageInput.value.trim();
    if (!text) return;

    this.addMessage(text, 'sent');
    this.messageInput.value = '';
  }

  /* ========================================
     채팅 초기화 함수
     - 모든 메시지 삭제 후 초기 메시지 다시 표시
     ======================================== */
  clearMessages() {
    // 타이머 취소
    if (this.mergeTimer) {
      clearTimeout(this.mergeTimer);
      this.mergeTimer = null;
    }
    
    // 모든 버블 제거
    this.messagesContainer.innerHTML = '';
    this.bubbles = [];
    
    // 스크롤 페이드 초기화
    this.updateScrollFade();
    
    // 초기 메시지 다시 추가
    this.addMessage('앜ㅋㅋ', 'received');
    setTimeout(() => this.addMessage('ㅋㅋㅋㅋㅋㅋㅋㅋ', 'received'), 300);
    setTimeout(() => this.addMessage('뭐행?', 'received'), 600);
  }

  /* ========================================
     메시지 추가 함수
     @param text - 메시지 내용
     @param type - 'sent'(보낸) 또는 'received'(받은)
     ======================================== */
  addMessage(text, type) {
    // 타이머 리셋 (새 메시지 추가 시)
    if (this.mergeTimer) {
      clearTimeout(this.mergeTimer);
    }
    
    // 버블 DOM 요소 생성
    const bubble = document.createElement('div');
    bubble.className = `bubble ${type}`;
    bubble.textContent = text;
    
    // GSAP 애니메이션 - 초기 상태 설정
    gsap.set(bubble, { 
      opacity: 0, 
      scale: 0.8,
      y: 20 
    });

    // 메시지 영역에 버블 추가
    this.messagesContainer.appendChild(bubble);
    this.bubbles.push({ element: bubble, type });

    // GSAP 애니메이션 - 등장 효과
    gsap.to(bubble, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.4,
      ease: 'back.out(1.7)',
      onComplete: () => {
        // 🌉 새 메시지 추가 후 브릿지 업데이트 (기존 merged 버블들에 대해)
        this.updateBridges();
      }
    });

    // 스크롤을 맨 아래로 이동
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    // 스크롤 페이드 업데이트
    this.updateScrollFade();
    
    // 🎨 1초 후 버블 합치기 타이머 시작
    this.mergeTimer = setTimeout(() => {
      this.mergeBubbles();
    }, this.mergeDelay);
  }

  /* ========================================
     스크롤 페이드 업데이트
     - 스크롤이 있을 때만 페이드 표시
     ======================================== */
  updateScrollFade() {
    if (!this.messagesWrapper) return;
    
    const hasScroll = this.messagesContainer.scrollHeight > this.messagesContainer.clientHeight;
    
    if (hasScroll) {
      this.messagesWrapper.classList.add('has-scroll');
    } else {
      this.messagesWrapper.classList.remove('has-scroll');
    }
  }

  /* ========================================
     🎨 버블 합치기 (리퀴드 효과)
     - 같은 타입의 연속된 버블들을 그룹화하여 합침
     - 받은 메시지 + 보낸 메시지 둘 다 적용
     ======================================== */
  mergeBubbles() {
    const groups = this.groupConsecutiveBubbles();
    
    // 🌉 merge 전에 브릿지 업데이트 (기존 merged 버블들에 대해)
    this.updateBridges();
    
    groups.forEach(group => {
      if (group.length < 2) return;  // 2개 이상이어야 합침
      
      group.forEach((bubbleData, index) => {
        const bubble = bubbleData.element;
        
        // 이미 합쳐진 상태면 스킵
        if (bubble.classList.contains('merged')) return;
        
        // 모든 버블에 merged 클래스 추가
        bubble.classList.add('merged');
        
        // 위치에 따른 클래스 추가
        if (index === 0) {
          // 첫 번째 버블
          bubble.classList.add('merged-first');
        } else if (index === group.length - 1) {
          // 마지막 버블
          bubble.classList.add('merged-last');
          // 마지막 버블에 시간 표시 추가
          this.addTimeStamp(bubble, bubbleData.type);
        } else {
          // 중간 버블
          bubble.classList.add('merged-middle');
        }
      });
    });
    
    // 🌉 merge 후에도 브릿지 업데이트 (새로 merged된 버블들 포함)
    this.updateBridges();
  }

  /* ========================================
     시간 표시 추가 함수
     - 마지막 버블에 현재 시간 표시
     - 받은 메시지: 우측 하단, 보낸 메시지: 좌측 하단
     ======================================== */
  addTimeStamp(bubble, type) {
    // 이미 시간이 있으면 스킵
    if (bubble.querySelector('.bubble-time')) return;
    
    // 현재 시간 가져오기
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // 시간 요소 생성
    const timeElement = document.createElement('span');
    timeElement.className = `bubble-time ${type}`;
    timeElement.textContent = timeString;
    
    // 버블에 시간 추가
    bubble.appendChild(timeElement);
  }

  /* ========================================
     버블 너비 측정 함수 (시간 표시 제외)
     - .bubble-time 요소를 제외한 순수 버블 너비 반환
     ======================================== */
  getBubbleWidth(bubble) {
    // 시간 요소가 있으면 임시로 숨기고 측정
    const timeElement = bubble.querySelector('.bubble-time');
    if (timeElement) {
      const originalDisplay = timeElement.style.display;
      const width = bubble.offsetWidth;
      timeElement.style.display = originalDisplay;
      return width;
    }
    return bubble.offsetWidth;
  }

  /* ========================================
     🌉 브릿지 업데이트 함수 (간단한 규칙)
     - 받는 메시지는 3개씩 그룹: 짧은 것 → 긴 것 → 짧은 것
     - 패턴: bridge-down → (없음) → bridge-up → bridge-down → ...
     ======================================== */
  updateBridges() {
    // 1. 모든 received 버블의 bridge 관련 클래스 초기화
    document.querySelectorAll('.bubble.received.bridge, .bubble.received.bridge-up, .bubble.received.bridge-down').forEach(bubble => {
      bubble.classList.remove('bridge', 'bridge-up', 'bridge-down', 'bridge-visible');
      bubble.style.removeProperty('--bridge-size');
    });
    
    // 2. 모든 merged된 received 버블 찾기
    const allReceivedBubbles = Array.from(document.querySelectorAll('.bubble.received.merged'));
    
    if (allReceivedBubbles.length < 2) return;
    
    // 3. 연속된 그룹으로 분리 (DOM 순서 기준)
    const groups = [];
    let currentGroup = [allReceivedBubbles[0]];
    
    for (let i = 1; i < allReceivedBubbles.length; i++) {
      const prev = allReceivedBubbles[i - 1];
      const curr = allReceivedBubbles[i];
      
      // 연속된 DOM 요소인지 확인 (nextElementSibling)
      if (prev.nextElementSibling === curr) {
        currentGroup.push(curr);
      } else {
        if (currentGroup.length >= 2) {
          groups.push(currentGroup);
        }
        currentGroup = [curr];
      }
    }
    
    if (currentGroup.length >= 2) {
      groups.push(currentGroup);
    }
    
    // 브릿지가 추가된 버블들을 저장
    const bridgeBubbles = [];
    
    // 4. 각 그룹에서 브릿지 처리 (새 규칙)
    // 3개씩 그룹: 짧은 것(0) → 긴 것(1) → 짧은 것(2)
    // 패턴: bridge-down(0) → 없음(1) → bridge-up(2) → 반복
    groups.forEach(group => {
      for (let i = 0; i < group.length; i++) {
        const bubble = group[i];
        const positionInTriple = i % 3;  // 0, 1, 2 반복
        
        if (positionInTriple === 0 && i + 1 < group.length) {
          // 첫 번째 버블 (짧은 것): bridge-down (아래 버블 방향으로)
          const currentWidth = this.getBubbleWidth(bubble);
          const nextWidth = this.getBubbleWidth(group[i + 1]);
          const diff = Math.abs(currentWidth - nextWidth);
          
          if (diff >= 10) {
            const bridgeSize = Math.min(diff, 36) * 0.9;
            bubble.classList.add('bridge', 'bridge-down');
            bubble.style.setProperty('--bridge-size', `${bridgeSize}px`);
            bridgeBubbles.push(bubble);
          }
        } else if (positionInTriple === 2 && i - 1 >= 0) {
          // 세 번째 버블 (짧은 것): bridge-up (위 버블 방향으로)
          const currentWidth = this.getBubbleWidth(bubble);
          const prevWidth = this.getBubbleWidth(group[i - 1]);
          const diff = Math.abs(currentWidth - prevWidth);
          
          if (diff >= 10) {
            const bridgeSize = Math.min(diff, 36) * 0.9;
            bubble.classList.add('bridge', 'bridge-up');
            bubble.style.setProperty('--bridge-size', `${bridgeSize}px`);
            bridgeBubbles.push(bubble);
          }
        }
        // positionInTriple === 1 은 긴 버블이므로 브릿지 없음
      }
    });
    
    // 5. 약간의 딜레이 후 브릿지 서서히 나타나게
    setTimeout(() => {
      bridgeBubbles.forEach(bubble => {
        bubble.classList.add('bridge-visible');
      });
    }, 50);
  }

  /* ========================================
     연속된 버블 그룹화 함수
     - 같은 타입(sent/received)의 연속된 버블들을 묶음
     - 이미 병합된 버블은 제외하고, 새 버블들만 그룹화
     ======================================== */
  groupConsecutiveBubbles() {
    const groups = [];
    let currentGroup = [];

    this.bubbles.forEach((bubble, index) => {
      // 이미 병합된 버블은 그룹 구분자 역할 (새 그룹 시작점)
      const isAlreadyMerged = bubble.element.classList.contains('merged');
      
      if (isAlreadyMerged) {
        // 이미 병합된 버블을 만나면 현재 그룹을 저장하고 새 그룹 시작
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
        // 이미 병합된 버블은 그룹에 포함하지 않음
        return;
      }
      
      if (currentGroup.length === 0) {
        currentGroup.push(bubble);
      } else if (bubble.type === currentGroup[0].type) {
        currentGroup.push(bubble);
      } else {
        // 타입이 바뀌면 현재 그룹 저장하고 새 그룹 시작
        groups.push(currentGroup);
        currentGroup = [bubble];
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /* ========================================
     📱 모바일 viewport 설정
     - visualViewport API로 실제 가용 높이 계산
     - 키보드가 올라와도 chat-container 상단 고정
     ======================================== */
  setupMobileViewport() {
    // 모바일 체크 (480px 이하)
    const isMobile = () => window.innerWidth <= 480;
    
    // CSS 변수로 viewport 높이 설정
    const setViewportHeight = () => {
      if (!isMobile()) return;
      
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--viewport-height', `${vh}px`);
    };
    
    // 스크롤 방지 함수
    const preventScroll = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };
    
    // 초기 설정
    setViewportHeight();
    
    if (window.visualViewport) {
      // visualViewport resize 이벤트
      window.visualViewport.addEventListener('resize', () => {
        if (!isMobile()) return;
        
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;
        
        // CSS 변수 업데이트
        document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
        
        // 키보드가 100px 이상 올라왔으면 keyboard-open
        if (keyboardHeight > 100) {
          this.deviceFrame.classList.add('keyboard-open');
          // 스크롤 방지
          preventScroll();
        }
      });
      
      // scroll 이벤트 - 스크롤 발생 시 원위치
      window.visualViewport.addEventListener('scroll', () => {
        if (!isMobile()) return;
        preventScroll();
        setViewportHeight();
      });
    }
    
    // 일반 resize 이벤트 (fallback)
    window.addEventListener('resize', setViewportHeight);
    
    // 전역 스크롤 방지 (모바일)
    if (isMobile()) {
      document.addEventListener('scroll', preventScroll, { passive: false });
      window.addEventListener('scroll', preventScroll, { passive: false });
    }
  }
}

/* ========================================
   앱 시작
   - DOM이 완전히 로드된 후 MetaballChat 인스턴스 생성
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  new MetaballChat();
  
  // 반응형 스케일링 초기화
  initResponsiveScale();
});

/* ========================================
   📐 반응형 스케일링
   - 화면 높이에 맞춰 디바이스 프레임 자동 축소
   - 비율 유지하며 왜곡 없이 축소
   ======================================== */
function initResponsiveScale() {
  const deviceContainer = document.querySelector('.device-container');
  if (!deviceContainer) return;
  
  // 🎨 설정값 (수정 가능)
  const DEVICE_HEIGHT = 874;    // 디바이스 프레임 높이 (px)
  const BORDER_SIZE = 10;       // 테두리 두께 (5px * 2)
  const PADDING = 40;           // 상하 여백 (px)
  const MIN_SCALE = 0.5;        // 최소 스케일 (너무 작아지지 않게)
  
  // 필요한 총 높이 계산
  const TOTAL_HEIGHT = DEVICE_HEIGHT + BORDER_SIZE + PADDING;
  
  function updateScale() {
    const viewportHeight = window.innerHeight;
    
    // 화면이 충분히 크면 스케일 1 (축소 안 함)
    if (viewportHeight >= TOTAL_HEIGHT) {
      deviceContainer.style.setProperty('--scale', '1');
      return;
    }
    
    // 스케일 계산: 화면높이 / 필요한높이
    let scale = viewportHeight / TOTAL_HEIGHT;
    
    // 최소 스케일 제한
    scale = Math.max(scale, MIN_SCALE);
    
    // 스케일 적용
    deviceContainer.style.setProperty('--scale', scale.toFixed(3));
  }
  
  // 초기 실행
  updateScale();
  
  // 창 크기 변경 시 업데이트
  window.addEventListener('resize', updateScale);
}
