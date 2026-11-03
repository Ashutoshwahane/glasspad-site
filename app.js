(() => {
  const preview = document.getElementById('theme-preview');
  const stage = document.querySelector('.showcase-stage');
  const caption = document.getElementById('theme-caption');
  const choices = [...document.querySelectorAll('.theme-picker button')];
  if (!preview || !stage || !caption) return;
  const themes = {
    modern: { src: 'assets/launcher-modern.png?v=20261103', alt: 'Modern theme: a dark glass launcher with large app icons.', text: 'Modern. A little glass, a lot of clarity.' },
    classic: { src: 'assets/launcher-classic.png?v=20261103', alt: 'Classic theme: warm light surfaces and familiar app icons.', text: 'Classic. Familiar, warm, and easy on the eyes.' },
    retro: { src: 'assets/launcher-retro.png?v=20261103', alt: 'Retro theme: crisp green outlines on a dark launcher.', text: 'Retro. A little nostalgia for your next big idea.' }
  };
  let request = 0;
  choices.forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.theme;
    const theme = themes[name];
    if (!theme) return;
    const currentRequest = ++request;
    const image = new Image();
    caption.textContent = 'Loading ' + name + ' preview…';
    image.onload = () => {
      if (currentRequest !== request) return;
      preview.src = theme.src;
      preview.alt = theme.alt;
      stage.dataset.theme = name;
      choices.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      caption.textContent = theme.text;
    };
    image.onerror = () => {
      if (currentRequest === request) caption.textContent = 'That preview could not load. Please try the theme again.';
    };
    image.src = theme.src;
  }));
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('entered');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    document.querySelectorAll('.showcase, .control-card, .ipad-layout, .setup-steps li, .download-card').forEach(element => observer.observe(element));
  }
})();
