/**
 * Birikim Yap (birikimyap.app) - World-Class Complete Script
 * Full Theme Synchronization, Legal Modals, Sticky CTA, Simulator Tabs
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Dark / Light Theme Sync (Web Page + Mobile Simulator Sync)
    const themeBtn = document.getElementById('themeToggleBtn');
    const htmlElement = document.documentElement;
    const mobileAppScreen = document.getElementById('mobileAppScreen');

    const savedTheme = localStorage.getItem('birikim_theme') || 'dark';
    applyTheme(savedTheme);

    themeBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('birikim_theme', newTheme);
        applyTheme(newTheme);
    });

    function applyTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';

        if (mobileAppScreen) {
            if (theme === 'light') {
                mobileAppScreen.classList.remove('dark-mode');
                mobileAppScreen.classList.add('light-mode');
            } else {
                mobileAppScreen.classList.remove('light-mode');
                mobileAppScreen.classList.add('dark-mode');
            }
        }
    }

    // 2. Interactive Phone Simulator Tabs
    const simTabHome = document.getElementById('simTabHome');
    const simTabGoals = document.getElementById('simTabGoals');
    const simTabAnalysis = document.getElementById('simTabAnalysis');
    const simTabProfile = document.getElementById('simTabProfile');
    const simDynamicContent = document.getElementById('simDynamicContent');

    if (simTabHome && simTabGoals && simTabAnalysis && simTabProfile) {
        const tabs = [simTabHome, simTabGoals, simTabAnalysis, simTabProfile];

        simTabHome.addEventListener('click', () => {
            setActiveTab(simTabHome);
            renderSimHome();
        });

        simTabGoals.addEventListener('click', () => {
            setActiveTab(simTabGoals);
            renderSimGoals();
        });

        simTabAnalysis.addEventListener('click', () => {
            setActiveTab(simTabAnalysis);
            renderSimAnalysis();
        });

        simTabProfile.addEventListener('click', () => {
            setActiveTab(simTabProfile);
            renderSimProfile();
        });

        function setActiveTab(selectedTab) {
            tabs.forEach(t => t.classList.remove('active'));
            selectedTab.classList.add('active');
        }

        function renderSimHome() {
            simDynamicContent.innerHTML = `
                <div class="m-section-header">
                    <div class="m-section-title">Son harcamalar</div>
                    <div class="m-total-pill">Toplam: ₺2.500</div>
                </div>

                <div class="m-period-filters">
                    <div class="m-filter-btn active">📅 Bugün</div>
                    <div class="m-filter-btn">📅 Bu hafta</div>
                    <div class="m-filter-btn">📅 Bu ay</div>
                </div>

                <div class="m-expense-card-list">
                    <div class="m-expense-row-item">
                        <div class="m-exp-left">
                            <div class="m-exp-icon">📦</div>
                            <div>
                                <div style="display: flex; align-items: center;">
                                    <span class="m-exp-title">Genel Harcama</span>
                                    <span class="m-exp-week-tag">1. Hafta</span>
                                </div>
                                <div class="m-exp-sub">Diğer</div>
                            </div>
                        </div>
                        <div class="m-exp-right">
                            <div class="m-exp-amount">₺1.000</div>
                            <div class="m-exp-date">06 Ağu</div>
                        </div>
                    </div>

                    <div class="m-expense-row-item">
                        <div class="m-exp-left">
                            <div class="m-exp-icon">📦</div>
                            <div>
                                <div style="display: flex; align-items: center;">
                                    <span class="m-exp-title">Genel Harcama</span>
                                    <span class="m-exp-week-tag">1. Hafta</span>
                                </div>
                                <div class="m-exp-sub">Diğer</div>
                            </div>
                        </div>
                        <div class="m-exp-right">
                            <div class="m-exp-amount">₺500</div>
                            <div class="m-exp-date">06 Ağu</div>
                        </div>
                    </div>

                    <div class="m-expense-row-item">
                        <div class="m-exp-left">
                            <div class="m-exp-icon">📦</div>
                            <div>
                                <div style="display: flex; align-items: center;">
                                    <span class="m-exp-title">Genel Harcama</span>
                                    <span class="m-exp-week-tag">1. Hafta</span>
                                </div>
                                <div class="m-exp-sub">Diğer</div>
                            </div>
                        </div>
                        <div class="m-exp-right">
                            <div class="m-exp-amount">₺1.000</div>
                            <div class="m-exp-date">06 Ağu</div>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderSimGoals() {
            simDynamicContent.innerHTML = `
                <div style="font-size: 15px; font-weight: 900; margin-bottom: 8px;">🎯 HEDEFLERİM</div>
                
                <div style="background: rgba(0,229,143,0.08); border: 1px solid rgba(0,229,143,0.25); border-radius: 20px; padding: 14px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 14px; font-weight: 900;">🏍️ Yamaha R6 Motor</div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 13px; font-weight: 900; color: #00E58F;">%13</span>
                            <span style="font-size: 13px; cursor: pointer; color: #EF4444;" title="Sil">🗑️</span>
                        </div>
                    </div>
                    <div style="font-size: 12px; font-weight: 800; color: #00E58F; margin-top: 4px;">₺4.000 / ₺30.000</div>
                    <div style="height: 7px; background: rgba(0,0,0,0.1); border-radius: 4px; margin-top: 8px; overflow: hidden;">
                        <div style="width: 13%; height: 100%; background: #00E58F;"></div>
                    </div>
                </div>

                <div style="background: rgba(185,142,75,0.1); border: 1px solid rgba(185,142,75,0.3); border-radius: 20px; padding: 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 14px; font-weight: 900;">✈️ Yurt Dışı Gezisi</div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 13px; font-weight: 900; color: #B98E4B;">%50</span>
                            <span style="font-size: 13px; cursor: pointer; color: #EF4444;" title="Sil">🗑️</span>
                        </div>
                    </div>
                    <div style="font-size: 12px; font-weight: 800; color: #B98E4B; margin-top: 4px;">₺25.000 / ₺50.000</div>
                    <div style="height: 7px; background: rgba(0,0,0,0.1); border-radius: 4px; margin-top: 8px; overflow: hidden;">
                        <div style="width: 50%; height: 100%; background: #B98E4B;"></div>
                    </div>
                </div>
            `;
        }

        function renderSimAnalysis() {
            simDynamicContent.innerHTML = `
                <div style="font-size: 15px; font-weight: 900; margin-bottom: 8px;">📊 HARCAMA ANALİZİ</div>
                
                <div style="background: rgba(0,229,143,0.08); border: 1px solid rgba(0,229,143,0.25); border-radius: 20px; padding: 14px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 800; opacity: 0.8;">BU AYKİ TOPLAM HARCAMA</div>
                    <div style="font-size: 26px; font-weight: 900; color: #00E58F; margin: 4px 0;">₺2.500</div>
                    <div style="font-size: 10px; font-weight: 700; opacity: 0.8;">Günlük Limit Aşıldı (Akıllı Dengeleme Devrede)</div>
                </div>
            `;
        }

        function renderSimProfile() {
            simDynamicContent.innerHTML = `
                <div style="font-size: 15px; font-weight: 900; margin-bottom: 8px;">👤 PROFİL & AYARLAR</div>
                
                <div style="background: rgba(0,0,0,0.04); border: 1px solid rgba(0,229,143,0.2); border-radius: 20px; padding: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <span>🌙 Karanlık Mod</span>
                        <span style="color: #00E58F;">Otomatik</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <span>📜 Yasal Bilgiler</span>
                        <span style="color: #00E58F;">✓ Onaylandı</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #EF4444; padding: 8px 0;">
                        <span>🗑️ Hesabımı Sil</span>
                        <span>›</span>
                    </div>
                </div>
            `;
        }
    }

    // 3. Dynamic Limit Calculator Widget
    const calcIncome = document.getElementById('calcIncome');
    const calcFixed = document.getElementById('calcFixed');
    const calcSavings = document.getElementById('calcSavings');
    const resultDailyLimit = document.getElementById('resultDailyLimit');
    const resultSpendableMonthly = document.getElementById('resultSpendableMonthly');

    if (calcIncome && calcFixed && calcSavings && resultDailyLimit && resultSpendableMonthly) {
        function calculateLiveLimit() {
            const income = parseFloat(calcIncome.value) || 0;
            const fixed = parseFloat(calcFixed.value) || 0;
            const savings = parseFloat(calcSavings.value) || 0;

            const remainingMonthly = Math.max(0, income - fixed);
            const spendableMonthly = Math.max(0, remainingMonthly - savings);
            const dailyLimit = Math.round(spendableMonthly / 30);

            resultDailyLimit.textContent = `${dailyLimit.toLocaleString('tr-TR')} ₺`;
            resultSpendableMonthly.textContent = `${spendableMonthly.toLocaleString('tr-TR')} ₺`;
        }

        calcIncome.addEventListener('input', calculateLiveLimit);
        calcFixed.addEventListener('input', calculateLiveLimit);
        calcSavings.addEventListener('input', calculateLiveLimit);
        calculateLiveLimit();
    }

    // 4. Siri Interactive Demo Trigger
    const siriDemoBtn = document.getElementById('siriDemoBtn');
    const siriDemoStatus = document.getElementById('siriDemoStatus');

    if (siriDemoBtn && siriDemoStatus) {
        siriDemoBtn.addEventListener('click', () => {
            siriDemoStatus.style.display = 'block';
            siriDemoStatus.innerHTML = `🎙️ <i>"Hey Siri, Birikim Yap"</i><br><strong style="color:#00E58F;">"Ne, ne kadar?"</strong>`;
            
            setTimeout(() => {
                siriDemoStatus.innerHTML += `<br>🗣️ <i>"Market 450"</i>`;
            }, 1200);

            setTimeout(() => {
                siriDemoStatus.innerHTML += `<br>✅ <b>'Market 450 ₺' harcamanız Birikim Yap'a eklendi! ✨</b>`;
            }, 2500);
        });
    }

    // 5. Live Financial Rates Auto-Fetcher (Refreshes Every Hour)
    async function fetchLiveRates() {
        try {
            const resUsd = await fetch('https://open.er-api.com/v6/latest/USD');
            const dataUsd = await resUsd.json();
            
            if (dataUsd && dataUsd.rates) {
                const usdTry = dataUsd.rates.TRY || 47.56;
                const eurRate = dataUsd.rates.EUR ? (usdTry / dataUsd.rates.EUR) : 54.83;
                const gramGold = (3350 * usdTry / 31.1035);

                const formattedTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                const formattedDate = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

                document.querySelectorAll('.ticker-date').forEach(el => el.textContent = formattedDate);
                document.querySelectorAll('.ticker-usd').forEach(el => el.textContent = `${usdTry.toFixed(2)} ₺`);
                document.querySelectorAll('.ticker-eur').forEach(el => el.textContent = `${eurRate.toFixed(2)} ₺`);
                document.querySelectorAll('.ticker-gold').forEach(el => el.textContent = `${Math.round(gramGold).toLocaleString('tr-TR')} ₺`);
                document.querySelectorAll('.ticker-time').forEach(el => el.textContent = `🟢 Canlı (${formattedTime})`);
            }
        } catch (err) {
            console.log('Live rate update error:', err);
        }
    }

    fetchLiveRates();
    setInterval(fetchLiveRates, 3600000); // 1 hour interval

    // 5. FAQ Accordion Toggle
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            faqItems.forEach(i => i.classList.remove('open'));
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });

    // 6. Working Legal Modals
    const legalModalOverlay = document.getElementById('legalModalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    const btnTermsModal = document.getElementById('btnTermsModal');
    const btnPrivacyModal = document.getElementById('btnPrivacyModal');
    const btnKvkkModal = document.getElementById('btnKvkkModal');

    if (legalModalOverlay && modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            legalModalOverlay.style.display = 'none';
        });

        legalModalOverlay.addEventListener('click', (e) => {
            if (e.target === legalModalOverlay) {
                legalModalOverlay.style.display = 'none';
            }
        });

        btnTermsModal.addEventListener('click', () => {
            openLegalModal(
                'Kullanım Koşulları',
                `<p><b>1. Taraflar ve Amaç</b><br>Birikim Yap uygulaması ve birikimyap.app web sitesi kişisel bütçe yönetimi, sesli harcama kaydı ve birikim hedefleri takibi amacıyla hizmet verir.</p>
                <p style="margin-top:12px;"><b>2. Veri Sorumluluğu</b><br>Kullanıcılar bütçe ve harcama verilerini kendi özgür iradeleriyle uygulamaya kaydeder. Verileriniz şifrelenmiş olarak cihazınızda ve Supabase altyapısında saklanır.</p>`
            );
        });

        btnPrivacyModal.addEventListener('click', () => {
            openLegalModal(
                'Gizlilik Politikası',
                `<p><b>1. Sıfır Reklam ve Reklam Takibi</b><br>Birikim Yap uygulamasında üçüncü taraf reklam ağları (Google AdMob, Meta Ads vb.) bulunmaz. Verileriniz asla reklam verenlere satılmaz.</p>
                <p style="margin-top:12px;"><b>2. Güvenli Depolama</b><br>Cihazınızdaki veriler yerel diskte şifreli saklanır. Bulut yedeklemesinde Row Level Security (RLS) kullanılır.</p>`
            );
        });

        btnKvkkModal.addEventListener('click', () => {
            openLegalModal(
                'KVKK Aydınlatma Metni',
                `<p>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca, Birikim Yap kullanıcısı olarak kişisel verileriniz yalnızca bütçe matematiği ve hesap oluşturma süreçlerinde işlenmektedir.</p>
                <p style="margin-top:12px;">Destek talepleriniz için <b>destek@birikimyap.app</b> adresi üzerinden bizimle iletişime geçebilirsiniz.</p>`
            );
        });

        function openLegalModal(title, content) {
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
            legalModalOverlay.style.display = 'flex';
        }
    }

    // 7. Sticky Bottom CTA Bar Scroll Event
    const stickyCtaBar = document.getElementById('stickyCtaBar');
    if (stickyCtaBar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                stickyCtaBar.classList.add('visible');
            } else {
                stickyCtaBar.classList.remove('visible');
            }
        });
    }
});
