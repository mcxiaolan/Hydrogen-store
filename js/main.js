document.addEventListener('DOMContentLoaded', () => {
    // ... (Variables setup unchanged)
    const appListContainer = document.getElementById('app-list');
    const heroContainer = document.getElementById('hero-container');
    const chipsContainer = document.getElementById('chips-container');
    const searchInput = document.getElementById('search-input');
    const drawer = document.getElementById('drawer');
    const menuBtn = document.getElementById('menu-btn');
    const scrim = document.getElementById('scrim');
    const prefBtn = document.getElementById('pref-btn');
    const prefOverlay = document.getElementById('pref-overlay');
    const closePrefBtn = document.getElementById('close-pref');
    const themeOptions = document.querySelectorAll('.theme-option');
    const detailModal = document.getElementById('detail-modal');
    const closeDetailBtn = document.getElementById('close-detail');
    const shareBtn = document.getElementById('share-btn');
    const toast = document.getElementById('toast');
    const desktopTabs = document.querySelectorAll('.dt-tab');

    let allApps = [];
    let currentDetailApp = null; 
    let isDirectAccess = false;
    let currentScope = []; 

    updateThemeUI(); 
    fetchApps();
    setupEvents();

    function updateThemeUI() {
        const currentTheme = localStorage.getItem('app_theme') || 'system';
        themeOptions.forEach(opt => {
            if (opt.dataset.val === currentTheme) opt.classList.add('selected');
            else opt.classList.remove('selected');
        });
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async function fetchApps() {
        try {
            const res = await fetch(`data/apps.json?t=${Date.now()}`);
            let data = await res.json();
            allApps = shuffleArray(data);
            renderPage('home');
            handleDeepLinkOnInit(); 
        } catch (e) { console.error(e); }
    }

    function handleDeepLinkOnInit() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedId = urlParams.get('id');
        if (sharedId) {
            const targetApp = allApps.find(app => app.id == sharedId);
            if (targetApp) {
                isDirectAccess = true;
                openDetail(targetApp, false);
            }
        }
    }

    function setupEvents() {
        window.addEventListener('popstate', (event) => {
            const urlParams = new URLSearchParams(window.location.search);
            if (!urlParams.get('id')) closeDetailModal();
            else {
                const id = urlParams.get('id');
                const app = allApps.find(a => a.id == id);
                if(app) openDetail(app, false);
            }
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query) {
                heroContainer.style.display = 'none';
                chipsContainer.style.display = 'none';
                const results = allApps.filter(app => {
                    // 🌟 增强搜索：包含包名和版本
                    const searchStr = (
                        app.name + 
                        app.description + 
                        app.developer + 
                        (app.tags ? app.tags.join('') : '') +
                        (app.package_name || '') +
                        (app.version || '')
                    ).toLowerCase();
                    return searchStr.includes(query);
                });
                renderList(results);
            } else {
                const activeTab = document.querySelector('.dt-tab.active') || document.querySelector('.nav-item.active');
                if(activeTab) renderPage(activeTab.dataset.tab);
            }
        });

        menuBtn.addEventListener('click', () => {
            if (window.innerWidth >= 800) document.body.classList.toggle('sidebar-collapsed');
            else {
                drawer.classList.add('open');
                scrim.classList.add('open');
                scrim.style.display = 'block'; 
            }
        });

        scrim.addEventListener('click', () => {
            drawer.classList.remove('open');
            scrim.classList.remove('open');
            prefOverlay.classList.remove('show');
            if (window.innerWidth >= 800 && detailModal.classList.contains('show')) closeDetailModal();
        });

        if (prefBtn) prefBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if(window.innerWidth < 800) { drawer.classList.remove('open'); scrim.classList.remove('open'); }
            setTimeout(() => prefOverlay.classList.add('show'), 100); 
        });
        if (closePrefBtn) closePrefBtn.addEventListener('click', () => prefOverlay.classList.remove('show'));
        
        themeOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                const val = opt.dataset.val;
                localStorage.setItem('app_theme', val);
                if (val === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
                else if (val === 'light') document.documentElement.setAttribute('data-theme', 'light');
                else {
                    document.documentElement.removeAttribute('data-theme');
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme', 'dark');
                }
                updateThemeUI();
            });
        });

        closeDetailBtn.addEventListener('click', () => {
            if (isDirectAccess) {
                const cleanUrl = window.location.pathname;
                history.replaceState(null, '', cleanUrl);
                closeDetailModal();
                isDirectAccess = false;
            } else {
                history.back();
            }
        });

        const switchTab = (tabName) => {
            searchInput.value = '';
            document.querySelectorAll('.nav-item').forEach(n => {
                if(n.dataset.tab === tabName) n.classList.add('active'); else n.classList.remove('active');
            });
            document.querySelectorAll('.dt-tab').forEach(n => {
                if(n.dataset.tab === tabName) n.classList.add('active'); else n.classList.remove('active');
            });
            renderPage(tabName);
            window.scrollTo(0, 0);
        };

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => { e.preventDefault(); switchTab(item.dataset.tab); });
        });

        desktopTabs.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        shareBtn.addEventListener('click', async () => {
            if (!currentDetailApp) return;
            const shareUrl = window.location.href;
            const shareData = { title: currentDetailApp.name, text: `我在氢商店发现了：${currentDetailApp.name}`, url: shareUrl };
            if (navigator.share) {
                try { await navigator.share(shareData); } catch (err) {}
            } else {
                try {
                    await navigator.clipboard.writeText(`${shareData.text} \n链接: ${shareData.url}`);
                    showToast('已复制当前页链接');
                } catch (err) { showToast('复制失败'); }
            }
        });
    }

    function renderPage(tab) {
        let title = "热门推荐";
        if (tab === 'home') {
            currentScope = allApps;
            heroContainer.style.display = 'flex';
            chipsContainer.style.display = 'flex';
        } else if (tab === 'games') {
            title = "精选游戏";
            currentScope = allApps.filter(a => a.type === 'game');
            heroContainer.style.display = 'none';
            chipsContainer.style.display = 'flex';
        } else if (tab === 'apps') {
            title = "实用工具";
            currentScope = allApps.filter(a => a.type === 'app');
            heroContainer.style.display = 'none';
            chipsContainer.style.display = 'flex';
        }
        document.querySelector('.section-header h2').innerText = title;
        if (tab === 'home') {
            const featuredApps = allApps.filter(a => a.featured);
            renderHero(featuredApps);
        }
        generateChips(currentScope);
        renderList(currentScope);
    }

    function renderList(apps) {
        appListContainer.innerHTML = '';
        if (apps.length === 0) {
            appListContainer.innerHTML = '<div style="text-align:center; padding:30px; color:#888;">无内容</div>';
            return;
        }
        apps.forEach(app => {
            const tagsText = app.tags ? app.tags.join(' · ') : '应用';
            const el = document.createElement('div');
            el.className = 'app-item';
            el.innerHTML = `
                <img src="${app.icon}" class="app-icon" loading="lazy" onerror="this.src='https://placehold.co/100?text=App'">
                <div class="app-info">
                    <div class="app-name">${app.name}</div>
                    <div class="app-meta"><span>${tagsText}</span></div>
                </div>
                <a href="${app.download_url}" class="download-btn" target="_blank" onclick="event.stopPropagation()">获取</a>
            `;
            el.addEventListener('click', () => openDetail(app, true));
            appListContainer.appendChild(el);
        });
    }

    function openDetail(app, pushHistory = true) {
        currentDetailApp = app;
        document.getElementById('d-icon').src = app.icon;
        document.getElementById('d-name').innerText = app.name;
        document.getElementById('d-developer').innerText = app.developer;
        
        // 🌟 填充新数据
        document.getElementById('d-desc').innerText = app.long_description || app.description;
        document.getElementById('d-download').href = app.download_url;
        
        document.getElementById('d-pkg').innerText = app.package_name || '-';
        document.getElementById('d-ver').innerText = app.version || '-';
        document.getElementById('d-date').innerText = app.upload_date || '-';
        document.getElementById('d-min-os').innerText = app.android_version || '-';
        // 架构是数组，展示为 A, B
        document.getElementById('d-arch').innerText = Array.isArray(app.architecture) ? app.architecture.join(', ') : (app.architecture || '-');
        
        const tagsContainer = document.getElementById('d-tags');
        tagsContainer.innerHTML = '';
        if (app.tags && app.tags.length > 0) {
            app.tags.forEach(tag => {
                const badge = document.createElement('span');
                badge.className = 'tag-badge';
                badge.innerText = tag;
                badge.onclick = () => {
                    closeDetailModal();
                    const cleanUrl = window.location.pathname;
                    history.replaceState(null, '', cleanUrl);
                    isDirectAccess = false;
                    document.querySelector('.dt-tab[data-tab="home"]').click();
                    activateTagFilter(tag);
                };
                tagsContainer.appendChild(badge);
            });
        }

        const shotContainer = document.getElementById('d-screenshots');
        shotContainer.innerHTML = '';
        if (app.screenshots?.length) {
            app.screenshots.forEach(src => {
                const img = document.createElement('img');
                img.src = src;
                img.loading = "lazy"; 
                shotContainer.appendChild(img);
            });
            shotContainer.style.display = 'flex';
        } else {
            shotContainer.style.display = 'none';
        }

        if (pushHistory) {
            const newUrl = `${window.location.pathname}?id=${app.id}`;
            history.pushState({ id: app.id }, '', newUrl);
        }

        if (window.innerWidth >= 800) {
            scrim.style.display = 'block'; 
            setTimeout(() => scrim.classList.add('open'), 10);
        }

        detailModal.classList.add('show');
    }

    function activateTagFilter(tagName) {
        searchInput.value = '';
        const homeTabBtn = document.querySelector('.nav-item[data-tab="home"]');
        if (homeTabBtn) homeTabBtn.click();

        const buttons = document.querySelectorAll('.chip');
        let found = false;
        buttons.forEach(btn => {
            if (btn.innerText === tagName) {
                btn.click();
                btn.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                found = true;
            }
        });
        if (!found) {
            const filtered = currentScope.filter(a => a.tags?.includes(tagName));
            renderList(filtered);
        }
    }

    function closeDetailModal() {
        detailModal.classList.remove('show');
        if (window.innerWidth >= 800) {
            scrim.classList.remove('open');
            setTimeout(() => scrim.style.display = '', 300); 
        }
        currentDetailApp = null;
    }

    function generateChips(scope) {
        chipsContainer.innerHTML = '';
        const allTags = new Set();
        scope.forEach(app => app.tags?.forEach(t => allTags.add(t)));
        ['全部', ...allTags].forEach((tag, idx) => {
            const btn = document.createElement('button');
            btn.className = `chip ${idx===0 ? 'active' : ''}`;
            btn.innerText = tag;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                tag === '全部' ? renderList(scope) : renderList(scope.filter(a => a.tags?.includes(tag)));
            });
            chipsContainer.appendChild(btn);
        });
    }

    function renderHero(apps) {
        heroContainer.innerHTML = '';
        if (!apps || apps.length === 0) {
            heroContainer.style.display = 'none';
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'hero-carousel';
        apps.forEach(app => {
            const card = document.createElement('div');
            card.className = `hero-card ${apps.length > 1 ? 'multiple' : ''}`;
            card.style.background = app.cover; 
            if (app.cover_image) {
                const img = document.createElement('img');
                img.className = 'hero-bg-img';
                img.src = app.cover_image;
                img.onload = () => img.classList.add('loaded');
                img.onerror = () => img.remove();
                card.appendChild(img);
            }
            const content = document.createElement('div');
            content.className = 'hero-content';
            content.innerHTML = `
                <span class="hero-tag">编辑推荐</span>
                <div class="hero-title">${app.name}</div>
                <div class="hero-desc">${app.description}</div>
            `;
            card.appendChild(content);
            card.onclick = () => openDetail(app, true);
            wrapper.appendChild(card);
        });
        heroContainer.appendChild(wrapper);
        heroContainer.style.display = 'block';
    }

    function showToast(msg) {
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
});
