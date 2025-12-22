(function() {
    function applyTheme() {
        const savedTheme = localStorage.getItem('app_theme') || 'system';
        const root = document.documentElement;
        if (savedTheme === 'dark') root.setAttribute('data-theme', 'dark');
        else if (savedTheme === 'light') root.setAttribute('data-theme', 'light');
        else {
            root.removeAttribute('data-theme');
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');
        }
    }
    applyTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem('app_theme') === 'system') document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
    window.addEventListener('storage', (e) => { if (e.key === 'app_theme') applyTheme(); });
})();
