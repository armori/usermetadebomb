(function () {
    function parseCount(text) {
        if (!text) return 0;
        const normalized = text.toLowerCase().replace(',', '.').trim();
        const isK = normalized.endsWith('k');
        const value = parseFloat(isK ? normalized.slice(0, -1) : normalized);
        if (isNaN(value)) return 0;
        return isK ? Math.round(value * 1000) : Math.round(value);
    }

    function fmt(n) {
        if (n >= 10000) return (n / 1000).toFixed(0) + 'k';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return n.toString();
    }

    function scoreColor(score) {
        if (score >= 7.5) return { bg: '#00ce7a', cls: 'c-siteReviewScore_green' };
        if (score >= 5.0) return { bg: '#ffbd3f', cls: 'c-siteReviewScore_yellow' };
        return { bg: '#ff6b73', cls: 'c-siteReviewScore_red' };
    }

    function makeRow(label, barPct, barColor, col3Html) {
        return `
            <div class="text-xs leading-none text-[#404040] capitalize self-center">${label}</div>
            <div class="relative overflow-hidden h-2 self-center rounded-[0.3rem]">
                <div class="absolute inset-0 bg-[#f2f2f2] rounded-[0.3rem]"></div>
                <div class="absolute inset-y-0 left-0 rounded-[0.3rem]" style="width:${barPct}%;background:${barColor}"></div>
            </div>
            <div class="flex gap-1 text-xs leading-none font-semibold self-center">${col3Html}</div>`;
    }

    const GRID_SEL = '[class*="grid-cols-[max-content_1fr_max-content]"]';

    function inject() {
        const originalCard = document.querySelector('[data-testid="score-card-overview"]:not(#metadebomb-card)');
        if (!originalCard) return;

        const scoreEl = originalCard.querySelector('.c-siteReviewScore span');
        const grid = originalCard.querySelector(GRID_SEL);
        if (!scoreEl || !grid) return;

        const score = parseFloat(scoreEl.textContent.trim());
        const counts = {};
        for (let i = 0; i + 2 < grid.children.length; i += 3) {
            const label = grid.children[i].textContent.trim().toLowerCase();
            counts[label] = parseCount(grid.children[i + 2].querySelector('span')?.textContent);
        }
        const pos = counts.positive ?? 0, mix = counts.mixed ?? 0, neg = counts.negative ?? 0;
        const total = pos + mix + neg;

        if (total === 0 || isNaN(score)) return;
        const remaining = total - neg;
        if (remaining <= 0) return;

        // Si ya hay tarjeta nuestra con los mismos datos, no hacer nada; si no, rehacerla
        const sig = [score, pos, mix, neg].join('|');
        const existing = document.querySelector('#metadebomb-card');
        if (existing?.isConnected && existing.dataset.sig === sig) return;
        existing?.remove();

        // Remove negative reviews; their scores assumed uniform 0–4 (avg = 2)
        const debombed = (score * total - neg * 2) / remaining;
        const negPct = Math.round(neg / total * 100);
        const color = scoreColor(debombed);

        const newCard = originalCard.cloneNode(true);
        newCard.id = 'metadebomb-card';
        newCard.dataset.sig = sig;
        newCard.removeAttribute('data-testid'); // evita duplicar el testid de la original
        newCard.style.marginTop = '12px';

        // Update score circle value and color
        const circle = newCard.querySelector('.c-siteReviewScore');
        circle.querySelector('span').textContent = debombed.toFixed(1);
        circle.title = `Debombed score ${debombed.toFixed(1)} out of 10`;
        circle.setAttribute('aria-label', circle.title);
        circle.style.backgroundColor = color.bg;
        [...circle.classList]
            .filter(c => c.startsWith('c-siteReviewScore_') && c !== 'c-siteReviewScore_large' && c !== 'c-siteReviewScore_circle')
            .forEach(c => circle.classList.remove(c));
        [...circle.classList]
            .filter(c => c.startsWith('bg-['))
            .forEach(c => circle.classList.remove(c));
        circle.classList.add(color.cls);

        // Update left-side labels
        const scoreTitle = [...newCard.querySelectorAll('span')]
            .find(s => s.textContent.trim().toLowerCase() === 'user score');
        if (scoreTitle) scoreTitle.textContent = 'Debombed';
        const sentiment = newCard.querySelector('.score-sentiment__texts > div');
        if (sentiment) sentiment.textContent = 'Est. without review bombs';

        // Replace right grid with debombing breakdown
        const newGrid = newCard.querySelector(GRID_SEL);
        newGrid.innerHTML =
            makeRow('removed', negPct, '#ff6b73', `<span>${fmt(neg)}</span><span>(${negPct}%)</span>`) +
            makeRow('avg neg est.', 20, '#ffbd3f', `<span>2.0&thinsp;/&thinsp;10</span>`) +
            makeRow('without bombs', Math.round(debombed * 10), '#00ce7a', `<span>${debombed.toFixed(1)}&thinsp;/&thinsp;10</span>`);

        // Drop the "Edit My Review" button from the clone
        const btn = newCard.querySelector('[data-testid="add-review-button"]');
        if (btn) (btn.parentElement !== newCard ? btn.parentElement : btn).remove();
        
        originalCard.after(newCard);
    }

    // Debounce with a long window so ad/banner scripts finish their DOM churn
    // before we inject. Re-injection uses the same debounce if Vue later removes our card.
    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(inject, 2000);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial delay for the same reason — let the page fully settle first.
    setTimeout(inject, 2000);
})();
