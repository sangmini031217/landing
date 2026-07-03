/**
 * auth.js — 제주모아 프로토타입 인증 모듈
 * localStorage 기반 회원가입 / 로그인 / 세션 관리
 */
(function (w) {
  'use strict';

  var USERS_KEY   = 'jmoa_users';
  var SESSION_KEY = 'jmoa_session';

  /* ── 사용자 목록 읽기/쓰기 ── */
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  /* ── 세션 ── */
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch (e) { return null; }
  }
  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      id:    user.id,
      email: user.email,
      name:  user.name,
      role:  user.role || 'farmer'
    }));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  /* ── 공개 API ── */

  /** 현재 로그인된 사용자 반환 (없으면 null) */
  function currentUser() { return getSession(); }

  /** 로그인 여부 */
  function isLoggedIn() { return !!getSession(); }

  /**
   * 회원가입
   * @returns {object} { ok: boolean, error?: string }
   */
  function register(name, email, password, role) {
    if (!name || !email || !password)
      return { ok: false, error: '모든 항목을 입력해주세요.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, error: '이메일 형식이 올바르지 않습니다.' };
    if (password.length < 6)
      return { ok: false, error: '비밀번호는 6자 이상이어야 합니다.' };

    var users = getUsers();
    if (users.find(function (u) { return u.email === email; }))
      return { ok: false, error: '이미 사용 중인 이메일입니다.' };

    var user = {
      id:       Date.now().toString(),
      name:     name,
      email:    email,
      password: password,   /* 프로토타입 — 실제 서비스에서는 해싱 필수 */
      role:     role || 'farmer',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    setSession(user);
    return { ok: true, user: user };
  }

  /**
   * 로그인
   * @returns {object} { ok: boolean, error?: string }
   */
  function login(email, password) {
    if (!email || !password)
      return { ok: false, error: '이메일과 비밀번호를 입력해주세요.' };

    var users = getUsers();
    var user = users.find(function (u) {
      return u.email === email && u.password === password;
    });
    if (!user) return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };

    setSession(user);
    return { ok: true, user: user };
  }

  /** 로그아웃 */
  function logout(redirectUrl) {
    clearSession();
    location.href = redirectUrl || '../pages/login.html';
  }

  /**
   * 로그인 보호 — 로그인 안 됐으면 login.html로 리다이렉트
   * 각 페이지 <script> 최상단에서 호출
   */
  function requireLogin(loginPath) {
    if (!isLoggedIn()) {
      var path = loginPath || 'login.html';
      /* pages/ 내부에서 호출하면 상대경로 그대로, index.html에서는 pages/ 붙임 */
      location.href = path;
    }
  }

  /**
   * 헤더에 유저 정보 + 로그아웃 버튼 주입
   * data-user-name, data-user-email 속성을 가진 요소에 자동 주입
   */
  function injectUserUI() {
    var user = currentUser();
    if (!user) return;

    /* 이름 표시 */
    document.querySelectorAll('[data-user-name]').forEach(function (el) {
      el.textContent = user.name;
    });
    /* 이메일 표시 */
    document.querySelectorAll('[data-user-email]').forEach(function (el) {
      el.textContent = user.email;
    });
    /* 역할 표시 */
    document.querySelectorAll('[data-user-role]').forEach(function (el) {
      var map = { farmer: '농업인', logistics: '물류업체', consumer: '소비자' };
      el.textContent = map[user.role] || user.role;
    });
    /* 로그아웃 버튼 */
    document.querySelectorAll('[data-logout-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var from = btn.dataset.logoutBtn || '';
        /* index 위치 기준 */
        var isRoot = !location.pathname.includes('/pages/');
        logout(isRoot ? 'pages/login.html' : 'login.html');
      });
    });
  }

  /* 전역 노출 */
  w.JMAuth = {
    currentUser:  currentUser,
    isLoggedIn:   isLoggedIn,
    register:     register,
    login:        login,
    logout:       logout,
    requireLogin: requireLogin,
    injectUserUI: injectUserUI
  };

})(window);
