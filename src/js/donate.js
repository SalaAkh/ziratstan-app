/**
 * Ziratstan Donation & Kaspi Support Logic
 * Centralized module for donation popups and card copying.
 */

(function() {
    const KASPI_CARD = '4400430320985507';
    const POPUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    const POPUP_FIRST_DELAY_MS = 60 * 1000;   // 1 minute

    // Expose functions to window
    window.copyKaspiCard = function(msgId, numId) {
        navigator.clipboard.writeText(KASPI_CARD).then(() => {
            const msg = document.getElementById(msgId || 'kaspiCopied');
            const num = document.getElementById(numId || 'kaspiCardNum');
            
            if (msg) msg.classList.add('visible');
            if (num) num.classList.add('copied');
            
            setTimeout(() => {
                if (msg) msg.classList.remove('visible');
                if (num) num.classList.remove('copied');
            }, 2500);
        }).catch(err => {
            console.warn('Clipboard copy failed, using fallback', err);
            const el = document.createElement('textarea');
            el.value = KASPI_CARD;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        });
    };

    window.copyKaspiCardPopup = function() {
        window.copyKaspiCard('donatePopupCopied');
    };

    window.showDonatePopup = function() {
        const popup = document.getElementById('donatePopup');
        const overlay = document.getElementById('donateOverlay');
        if (popup) popup.classList.add('visible');
        if (overlay) overlay.classList.add('visible');
    };

    window.closeDonatePopup = function() {
        const popup = document.getElementById('donatePopup');
        const overlay = document.getElementById('donateOverlay');
        if (popup) popup.classList.remove('visible');
        if (overlay) overlay.classList.remove('visible');
    };

    // Auto-init popup cycle
    function initDonationCycle() {
        // Only start if we are not on admin page (admin doesn't need popups usually)
        if (window.location.pathname.includes('admin.html')) return;

        setTimeout(() => {
            window.showDonatePopup();
            setInterval(window.showDonatePopup, POPUP_INTERVAL_MS);
        }, POPUP_FIRST_DELAY_MS);
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDonationCycle);
    } else {
        initDonationCycle();
    }
})();
