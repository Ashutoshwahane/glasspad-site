(() => {
  // Interactive preview: a simulated GlassPad on the left drives a simulated Mac on the right.
  const phone = document.getElementById('play-phone');
  const screen = document.getElementById('play-screen');
  if (phone && screen) {
    const cursor = document.getElementById('play-cursor');
    const toastEl = document.getElementById('play-toast');
    const menuApp = document.getElementById('play-mbapp');
    const themeButtons = [...document.querySelectorAll('.play-themes button')];
    const tabs = [...document.querySelectorAll('.play-tabs [role="tab"]')];
    let toastTimer;
    const toast = message => {
      toastEl.textContent = message;
      toastEl.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
    };

    themeButtons.forEach(button => button.addEventListener('click', () => {
      phone.dataset.t = button.dataset.t;
      themeButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    }));

    const selectTab = tab => {
      tabs.forEach(other => {
        const selected = other === tab;
        other.setAttribute('aria-selected', String(selected));
        other.tabIndex = selected ? 0 : -1;
        document.getElementById('play-p-' + other.dataset.p).hidden = !selected;
      });
    };
    tabs.forEach((tab, index) => {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', event => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!step) return;
        const next = tabs[(index + step + tabs.length) % tabs.length];
        selectTab(next);
        next.focus();
      });
    });

    // Mac side
    let cx = .5, cy = .55, z = 1, front = null, notesText = '';
    const windows = {};
    const placeCursor = () => { cursor.style.left = (cx * 100) + '%'; cursor.style.top = (cy * 100) + '%'; };
    const ripple = () => {
      const dot = document.createElement('span');
      dot.className = 'play-ripple';
      dot.style.left = (cx * 100) + '%';
      dot.style.top = (cy * 100) + '%';
      screen.appendChild(dot);
      setTimeout(() => dot.remove(), 500);
    };
    const apps = {
      Safari: { color: '#1e88e5', glyph: '<circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M15 9l-2 4-4 2 2-4z" fill="#fff"/>', heading: 'glasspad.app' },
      Music: { color: '#f0384f', glyph: '<path d="M10 17V7l8-2v10" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="8" cy="17" r="2.2" fill="#fff"/><circle cx="16" cy="15" r="2.2" fill="#fff"/>', heading: 'Now playing' },
      Notes: { color: '#f5c542', glyph: '<rect x="6" y="5" width="12" height="14" rx="2" fill="#fff"/><path d="M8 10h8M8 13h8M8 16h5" stroke="#c9a227" stroke-width="1.2"/>', heading: '' },
      Calendar: { color: '#ffffff', glyph: '<rect x="5" y="5" width="14" height="4" fill="#f0384f"/><path d="M8 12h2v2H8zM11 12h2v2h-2zM14 12h2v2h-2zM8 15h2v2H8zM11 15h2v2h-2z" fill="#555"/>', heading: 'Today' },
      'Team wiki': { color: '', glyph: '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 12h14M12 5c3 3 3 11 0 14M12 5c-3 3-3 11 0 14" fill="none" stroke="currentColor" stroke-width="1.2"/>', heading: 'wiki.example.com' },
      'Focus mode': { color: '', glyph: '<path d="M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>', shortcut: true }
    };
    const lines = count => Array.from({ length: count }, (_, i) => `<span class="play-line" style="width:${55 + ((i * 37) % 45)}%"></span>`).join('');
    const focusWindow = win => {
      Object.values(windows).forEach(other => other.classList.remove('front'));
      win.classList.add('front');
      win.style.zIndex = ++z;
      front = win;
      menuApp.textContent = win.dataset.app;
    };
    const openApp = name => {
      let win = windows[name];
      if (!win) {
        const count = Object.keys(windows).length;
        win = document.createElement('div');
        win.className = 'play-win';
        win.dataset.app = name;
        win.style.left = (6 + (count * 9) % 40) + '%';
        win.style.top = (13 + (count * 7) % 28) + '%';
        const body = name === 'Notes'
          ? '<p class="play-typed"></p><span class="play-caret"></span>'
          : `<strong>${apps[name].heading}</strong>${lines(18)}`;
        win.innerHTML = `<div class="play-tb"><i></i><i></i><i></i>${name}</div><div class="play-body"><div class="play-scroller">${body}</div></div>`;
        screen.appendChild(win);
        windows[name] = win;
        if (name === 'Notes') win.querySelector('.play-typed').textContent = notesText;
      }
      focusWindow(win);
      toast(name + ' opened on your Mac');
    };

    const tiles = document.getElementById('play-tiles');
    Object.entries(apps).forEach(([name, app]) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'play-tile';
      tile.innerHTML = `<span class="play-ico${app.color ? '' : ' plain'}"${app.color ? ` style="background:${app.color}"` : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${app.glyph}</svg></span>${name}`;
      tile.addEventListener('click', () => {
        if (app.shortcut) { ripple(); toast('Shortcut “Focus mode” ran on your Mac'); }
        else openApp(name);
      });
      tiles.appendChild(tile);
    });

    const scrollTo = value => {
      if (!front) { toast('Open an app first'); return; }
      const scroller = front.querySelector('.play-scroller');
      const y = Math.max(0, Math.min(160, value));
      scroller.dataset.y = y;
      scroller.style.transform = `translateY(${-y}px)`;
    };

    const click = kind => {
      ripple();
      if (kind === 'right') { toast('Right click'); return; }
      const box = screen.getBoundingClientRect();
      const x = box.left + cx * box.width, y = box.top + cy * box.height;
      const hit = Object.values(windows)
        .sort((a, b) => b.style.zIndex - a.style.zIndex)
        .find(win => { const r = win.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
      if (hit) focusWindow(hit);
    };
    document.querySelectorAll('.play-btn').forEach(button => button.addEventListener('click', () => click(button.dataset.click)));

    const pad = document.getElementById('play-pad');
    let last = null, moved = 0, startTime = 0;
    const move = (dx, dy) => {
      cx = Math.max(0, Math.min(.97, cx + dx));
      cy = Math.max(.06, Math.min(.95, cy + dy));
      placeCursor();
    };
    pad.addEventListener('pointerdown', event => {
      pad.setPointerCapture(event.pointerId);
      last = { x: event.clientX, y: event.clientY };
      moved = 0;
      startTime = Date.now();
      pad.classList.add('touching');
    });
    pad.addEventListener('pointermove', event => {
      if (!last) return;
      const box = screen.getBoundingClientRect();
      const dx = event.clientX - last.x, dy = event.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      move(dx * 1.8 / box.width, dy * 1.8 / box.height);
      last = { x: event.clientX, y: event.clientY };
    });
    const release = () => {
      if (!last) return;
      if (moved < 6 && Date.now() - startTime < 300) click('left');
      last = null;
      pad.classList.remove('touching');
    };
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointercancel', release);
    pad.addEventListener('wheel', event => {
      if (!front) return;
      event.preventDefault();
      scrollTo((parseFloat(front.querySelector('.play-scroller').dataset.y) || 0) + event.deltaY * .4);
    }, { passive: false });
    pad.addEventListener('keydown', event => {
      const step = { ArrowLeft: [-.04, 0], ArrowRight: [.04, 0], ArrowUp: [0, -.05], ArrowDown: [0, .05] }[event.key];
      if (step) { event.preventDefault(); move(step[0], step[1]); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); click('left'); }
    });

    const input = document.getElementById('play-kb');
    document.getElementById('play-send').addEventListener('click', () => {
      const text = input.value.trim();
      if (!text) { toast('Type something first'); input.focus(); return; }
      notesText = (notesText ? notesText + '\n' : '') + text;
      openApp('Notes');
      windows.Notes.querySelector('.play-typed').textContent = notesText;
      input.value = '';
      toast('Sent to Notes on your Mac');
    });
    document.querySelectorAll('.play-keys button').forEach(button => button.addEventListener('click', () => {
      toast(button.dataset.k + ' sent to ' + (front ? front.dataset.app : 'Finder'));
    }));

    placeCursor();
    openApp('Safari');
    clearTimeout(toastTimer);
    toastEl.classList.remove('show');
  }

  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('entered');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    document.querySelectorAll('.play, .control-card, .ipad-layout, .setup-steps li, .download-card').forEach(element => observer.observe(element));
  }
})();
