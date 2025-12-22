document.addEventListener('DOMContentLoaded', () => {
    const getEl = (id) => document.getElementById(id);

    const idInput = getEl('inp-id');
    const nameInput = getEl('inp-name');
    const descInput = getEl('inp-desc');
    const iconInput = getEl('inp-icon');
    const tagsInput = getEl('inp-tags');
    const coverInput = getEl('inp-cover');
    const coverImgInput = getEl('inp-cover-img');
    
    const btnRandom = getEl('btn-random-color');
    const btnOpenGen = getEl('btn-open-gen');
    const genModal = getEl('gen-modal');
    const genOverlay = getEl('gen-overlay');
    const genPreview = getEl('gen-preview');
    const genColor1 = getEl('gen-color1');
    const genColor2 = getEl('gen-color2');
    const genAngle = getEl('gen-angle');
    const genAngleVal = getEl('gen-angle-val');
    const btnApplyGen = getEl('btn-apply-gen');

    const prevHeroCard = getEl('prev-hero-card');
    const prevHeroImg = getEl('prev-hero-img');
    const prevHeroTitle = getEl('prev-hero-title');
    const prevHeroDesc = getEl('prev-hero-desc');
    const prevIconImg = getEl('prev-icon-img');
    const prevIconPlaceholder = getEl('prev-icon-placeholder');
    const prevListName = getEl('prev-list-name');
    const prevListMeta = getEl('prev-list-meta');

    const generateBtn = getEl('btn-generate');
    const outputArea = getEl('output-area');
    const codeResult = getEl('code-result');
    const copyBtn = getEl('btn-copy');
    const toast = getEl('toast');

    fetch('../data/apps.json?t=' + Date.now())
        .then(res => res.json())
        .then(data => {
            const maxId = data.length > 0 ? Math.max(...data.map(app => app.id)) : 0;
            if(idInput) idInput.value = maxId + 1;
        })
        .catch(() => { if(idInput) idInput.value = 1; });

    const getRandomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    const setRandomGradient = () => {
        const c1 = getRandomColor();
        const c2 = getRandomColor();
        const angle = Math.floor(Math.random() * 360);
        const gradient = `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%)`;
        if(coverInput) {
            coverInput.value = gradient;
            coverInput.dispatchEvent(new Event('input'));
        }
    };
    setRandomGradient();

    if (btnRandom) btnRandom.addEventListener('click', (e) => { e.preventDefault(); setRandomGradient(); });

    const updateGenPreview = () => {
        const c1 = genColor1.value;
        const c2 = genColor2.value;
        const angle = genAngle.value;
        genAngleVal.innerText = angle;
        genPreview.style.background = `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%)`;
    };

    if (btnOpenGen) {
        btnOpenGen.addEventListener('click', (e) => {
            e.preventDefault();
            genModal.classList.add('show');
            genOverlay.classList.add('show');
            updateGenPreview();
        });
    }

    [genColor1, genColor2, genAngle].forEach(el => { if(el) el.addEventListener('input', updateGenPreview); });

    if (genOverlay) genOverlay.addEventListener('click', () => { genModal.classList.remove('show'); genOverlay.classList.remove('show'); });

    if (btnApplyGen) {
        btnApplyGen.addEventListener('click', (e) => {
            e.preventDefault();
            coverInput.value = genPreview.style.background;
            coverInput.dispatchEvent(new Event('input'));
            genModal.classList.remove('show');
            genOverlay.classList.remove('show');
        });
    }

    if (nameInput) nameInput.addEventListener('input', () => {
        const val = nameInput.value.trim() || '应用名称';
        prevHeroTitle.innerText = val;
        prevListName.innerText = val;
    });
    if (descInput) descInput.addEventListener('input', () => prevHeroDesc.innerText = descInput.value.trim() || '一句话简介...');
    if (tagsInput) tagsInput.addEventListener('input', () => {
        const raw = tagsInput.value.trim();
        prevListMeta.innerText = raw ? raw.replace(/[,，]/g, ' · ') : '标签1 · 标签2';
    });
    if (iconInput) {
        iconInput.addEventListener('input', () => {
            const url = iconInput.value.trim();
            if (url) {
                prevIconImg.src = url;
                prevIconImg.style.display = 'block';
                prevIconPlaceholder.style.display = 'none';
            } else {
                prevIconImg.style.display = 'none';
                prevIconPlaceholder.style.display = 'flex';
            }
        });
        prevIconImg.addEventListener('error', () => {
            prevIconImg.style.display = 'none';
            prevIconPlaceholder.style.display = 'flex';
        });
    }
    if (coverInput) coverInput.addEventListener('input', () => prevHeroCard.style.background = coverInput.value);
    if (coverImgInput) {
        coverImgInput.addEventListener('input', () => {
            const url = coverImgInput.value.trim();
            if (url) {
                prevHeroImg.src = url;
                prevHeroImg.onload = () => { prevHeroImg.style.opacity = 1; };
                prevHeroImg.onerror = () => { prevHeroImg.style.opacity = 0; };
            } else {
                prevHeroImg.style.opacity = 0;
            }
        });
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const developer = getEl('inp-developer').value.trim();
            const type = getEl('inp-type').value;
            const tagsStr = getEl('inp-tags').value;
            const downloadUrl = getEl('inp-download').value.trim();
            const longDescription = getEl('inp-long-desc').value.trim();
            const screenshotsStr = getEl('inp-screenshots').value;
            const featured = getEl('inp-featured').checked;

            if (!nameInput.value.trim()) { alert('请输入应用名称'); return; }

            const tags = tagsStr.split(/[,，]/).map(t => t.trim()).filter(t => t);
            const screenshots = screenshotsStr.split('\n').map(s => s.trim()).filter(s => s);

            const newApp = {
                id: parseInt(idInput.value),
                name: nameInput.value.trim(),
                developer: developer,
                icon: iconInput.value.trim(),
                cover: coverInput.value.trim(),
                cover_image: coverImgInput.value.trim(),
                type: type,
                tags: tags,
                description: descInput.value.trim(),
                long_description: longDescription,
                screenshots: screenshots,
                featured: featured,
                download_url: downloadUrl
            };

            const jsonString = JSON.stringify(newApp, null, 2);
            codeResult.innerText = `  ,\n${jsonString}`; 
            outputArea.style.display = 'block';
            outputArea.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(codeResult.innerText).then(() => {
                showToast('已复制！请粘贴到 apps.json 末尾');
            });
        });
    }

    function showToast(msg) {
        if (!toast) return;
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
});
