import './style.css';

// ===== BINANCE API INTEGRATION =====
const CRYPTO_CONFIG = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', short: 'BTC', icon: 'https://f1.tokenpost.kr/2025/08/8xbkmf223g.png' },
  { symbol: 'ETHUSDT', name: 'Ethereum', short: 'ETH', icon: 'https://f1.tokenpost.kr/2025/08/np8ieswl37.png' },
  { symbol: 'XRPUSDT', name: 'Ripple', short: 'XRP', icon: 'https://f1.tokenpost.kr/2025/08/m5veed81jd.png' },
  { symbol: 'BNBUSDT', name: 'BNB', short: 'BNB', icon: 'https://f1.tokenpost.kr/2025/08/6h4nf95a4h.png' },
  { symbol: 'SOLUSDT', name: 'Solana', short: 'SOL', icon: 'https://f1.tokenpost.kr/2025/08/pvngy2nu80.png' },
  { symbol: 'TRXUSDT', name: 'Tron', short: 'TRX', icon: 'https://f1.tokenpost.kr/2025/08/hr5ak1e8dg.png' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', short: 'DOGE', icon: 'https://f1.tokenpost.kr/2025/08/e6fcyepfzj.png' },
];

// USD to KRW exchange rate (approximate)
const USD_TO_KRW = 1450;

function formatKRW(usdPrice) {
  const krw = usdPrice * USD_TO_KRW;
  if (krw >= 1e8) {
    return `₩${(krw / 1e8).toFixed(1)}억`;
  } else if (krw >= 1e4) {
    return `₩${(krw / 1e4).toFixed(0)}만`;
  } else {
    return `₩${Math.round(krw).toLocaleString('ko-KR')}`;
  }
}

function formatLargeNumber(num) {
  if (num >= 1e12) {
    return `$${(num / 1e12).toFixed(2)}T`;
  } else if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(1)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(1)}M`;
  }
  return `$${num.toLocaleString('en-US')}`;
}

function formatLargeKRW(usdValue) {
  const krw = usdValue * USD_TO_KRW;
  if (krw >= 1e12) {
    return `₩${(krw / 1e12).toFixed(1)}조`;
  } else if (krw >= 1e8) {
    return `₩${(krw / 1e8).toFixed(0)}억`;
  }
  return `₩${Math.round(krw).toLocaleString('ko-KR')}`;
}

async function fetchCryptoPrices() {
  // const grid = document.getElementById('cryptoGrid'); // Removed as per instruction
  try {
    const symbols = CRYPTO_CONFIG.map(c => `"${c.symbol}"`).join(',');
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`
    );
    const data = await response.json();

    // Calculate market overview stats
    let totalVolume24h = 0;
    let btcMarketCap = 0;
    let totalMarketCap = 0;

    let cardsHtml = '';

    CRYPTO_CONFIG.forEach(config => {
      const ticker = data.find(d => d.symbol === config.symbol);
      if (!ticker) return;

      const price = parseFloat(ticker.lastPrice);
      const change = parseFloat(ticker.priceChangePercent);
      const volume = parseFloat(ticker.quoteVolume);
      const isUp = change >= 0;
      const direction = isUp ? 'up' : 'down';
      const arrow = isUp ? '▲' : '▼';

      totalVolume24h += volume;

      // Approximate market caps (using circulating supply estimates)
      const supplies = {
        BTC: 19800000,
        ETH: 120000000,
        XRP: 55000000000,
        BNB: 145000000,
        SOL: 440000000,
        TRX: 88000000000,
        DOGE: 143000000000
      };
      const mc = price * (supplies[config.short] || 0);
      totalMarketCap += mc;
      if (config.short === 'BTC') btcMarketCap = mc;

      let formattedPrice;
      if (price >= 1000) {
        formattedPrice = '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      } else if (price >= 1) {
        formattedPrice = '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else {
        formattedPrice = '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
      }

      const krwPrice = formatKRW(price);
      cardsHtml += `
          <div class="crypto-card ${direction}">
            <div class="crypto-header">
              <img src="${config.icon}" alt="${config.short}" class="crypto-icon" />
              <div>
                <div class="crypto-name">${config.name}</div>
                <div class="crypto-symbol">${config.short}</div>
              </div>
            </div>
            <div class="crypto-price">${formattedPrice}</div>
            <div class="crypto-price-krw">${krwPrice}</div>
            <div class="crypto-change ${direction}">
              <span>${arrow}</span>
              <span>${Math.abs(change).toFixed(2)}%</span>
            </div>
          </div>
        `;
    });

    document.getElementById('cryptoGrid').innerHTML = cardsHtml;

    // Update market overview
    document.getElementById('totalMarketCap').textContent = formatLargeNumber(totalMarketCap);
    document.getElementById('totalMarketCapKrw').textContent = formatLargeKRW(totalMarketCap);

    document.getElementById('totalVolume').textContent = formatLargeNumber(totalVolume24h);
    document.getElementById('totalVolumeKrw').textContent = formatLargeKRW(totalVolume24h);

    const dominance = totalMarketCap > 0 ? ((btcMarketCap / totalMarketCap) * 100).toFixed(1) : '-';
    const dominanceEl = document.getElementById('btcDominance');
    if (dominanceEl) dominanceEl.textContent = `${dominance}%`;

    // Update timestamp
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} 업데이트`;
    const updateTimeEl = document.getElementById('cryptoUpdateTime');
    if (updateTimeEl) updateTimeEl.textContent = timeStr;

  } catch (error) {
    console.warn('[Crypto] Fetch failed:', error);
    // Silent fail or minimal UI update
    const grid = document.getElementById('cryptoGrid');
    if (grid) {
      grid.innerHTML = `<div class="crypto-loading"><span>⚠️ 시세 정보를 불러올 수 없습니다.</span></div>`;
    }
  }
}

// ===== SCHEDULE / EVENTS (Google Sheets 연동) =====
const SHEET_ID = '1QNsT3ba8F10FT83NhPm2oDJfEXJADeZGOtJ_6ddnMCM';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;

let macroEvents = [];
let tokenEvents = [];

// 중요도 매핑 (시트 값 → 내부 키)
const IMPORTANCE_MAP = {
  '중요': 'important',
  '관심': 'medium',
  '일반': 'normal',
};

// CSV 파싱 (따옴표 포함 처리)
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return []; // 헤더만 있으면 빈 배열

  const rows = [];
  for (let i = 1; i < lines.length; i++) { // 헤더 스킵
    const row = [];
    let current = '';
    let inQuotes = false;
    const line = lines[i];

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    row.push(current.trim());
    if (row.length >= 4) rows.push(row);
  }
  return rows;
}

// Google Sheets에서 일정 데이터 fetch
async function fetchScheduleFromSheets() {
  try {
    console.log('[Schedule] Fetching from Google Sheets...');
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csvText = await res.text();
    const rows = parseCSV(csvText);

    macroEvents = [];
    tokenEvents = [];

    // 오늘 ~ 2주 후까지만 필터링
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    rows.forEach(row => {
      const [date, name, category, importance] = row;
      if (!date || !name) return;

      // 날짜 필터: 지난 일정 제외, 2주 이내만
      const eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) return;
      if (eventDate < today || eventDate > twoWeeksLater) return;

      const event = {
        date: date,
        name: name,
        desc: '',
        importance: IMPORTANCE_MAP[importance] || 'normal',
      };

      if (category === '거시경제') {
        macroEvents.push(event);
      } else if (category === '토큰일정') {
        tokenEvents.push(event);
      }
    });

    console.log(`[Schedule] Loaded: ${macroEvents.length} macro, ${tokenEvents.length} token events`);

    // #scheduleMonth 자동 업데이트: 일정 날짜 범위에 따라 표기
    const allDates = [...macroEvents, ...tokenEvents]
      .map(ev => new Date(ev.date))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a - b);

    const monthBadge = document.getElementById('scheduleMonth');
    if (monthBadge && allDates.length > 0) {
      const first = allDates[0];
      const last = allDates[allDates.length - 1];
      const firstYear = first.getFullYear();
      const firstMonth = first.getMonth() + 1;
      const lastYear = last.getFullYear();
      const lastMonth = last.getMonth() + 1;

      if (firstYear === lastYear && firstMonth === lastMonth) {
        monthBadge.textContent = `${firstYear}년 ${firstMonth}월`;
      } else if (firstYear === lastYear) {
        monthBadge.textContent = `${firstYear}년 ${firstMonth}월-${lastMonth}월`;
      } else {
        monthBadge.textContent = `${firstYear}년 ${firstMonth}월-${lastYear}년 ${lastMonth}월`;
      }
    } else if (monthBadge) {
      const now = new Date();
      monthBadge.textContent = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
    }

    renderSchedule();
    return true;
  } catch (err) {
    console.error('[Schedule] Fetch error:', err);
    alert('구글 시트 데이터를 불러오지 못했습니다.\n' + err.message);
    return false;
  }
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function renderSchedule() {
  const macroList = document.getElementById('macroEvents');
  const tokenList = document.getElementById('tokenEvents');

  macroList.innerHTML = renderEventList(macroEvents);
  tokenList.innerHTML = renderEventList(tokenEvents);
}

function renderEventList(events) {
  return events
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(event => {
      const d = new Date(event.date);
      const day = d.getDate();
      const weekday = WEEKDAYS[d.getDay()];
      const importanceLabel = {
        important: '중요',
        medium: '관심',
        normal: '',
      };
      const tagHtml = event.importance !== 'normal'
        ? `<span class="schedule-tag ${event.importance}">${importanceLabel[event.importance]}</span>`
        : '';

      return `
        <div class="schedule-item">
          <div class="schedule-date">
            <span class="schedule-day">${day}</span>
            <span class="schedule-weekday">${weekday}</span>
          </div>
          <div class="schedule-info">
            <div class="schedule-name">${event.name}</div>
            <div class="schedule-desc">${event.desc}</div>
            ${tagHtml}
          </div>
        </div>
      `;
    }).join('');
}

// ===== EDITOR LOGIC (Phase 2) =====

function initEditor() {
  console.log('[Editor] initEditor starting (Native Accordion active)...');

  try {
    // 2. Sync basic info
    const dateInput = document.getElementById('edit-date');
    const headerDate = document.getElementById('headerDate');
    if (dateInput && headerDate) {
      dateInput.addEventListener('input', (e) => {
        headerDate.textContent = e.target.value;
      });
    }



    // 4. Sync news articles (5 slots)
    [0, 1, 2, 3, 4].forEach(idx => {
      setupArticleSync(idx, `#preview-article-${idx}`);
    });

    // 5. Sync research
    setupResearchSync();

    // 6. Sync Schedule
    initScheduleEditor();

    // 7. HTML Export
    const exportBtn = document.getElementById('btnExportHtml');
    if (exportBtn) exportBtn.addEventListener('click', exportEmailHtml);

  } catch (err) {
    console.error('[Editor Init Error]:', err);
  }
}

function setupArticleSync(idx, previewSelector) {
  const block = document.querySelector(`.article-edit-block[data-index="${idx}"]`);
  const preview = document.querySelector(previewSelector);
  if (!block || !preview) return;

  const titleInput = block.querySelector('.edit-title');
  const excerptInput = block.querySelector('.edit-excerpt');
  const imageInput = block.querySelector('.edit-image');
  const authorInput = block.querySelector('.edit-author');
  const timeInput = block.querySelector('.edit-time');
  const fetchBtn = block.querySelector('.btn-fetch');
  const urlInput = block.querySelector('.edit-url');

  // Initial sync with null safety
  const titleEl = preview.querySelector('.article-title');
  const excerptEl = preview.querySelector('.article-excerpt');
  const imgEl = preview.querySelector('img');
  const authorEl = preview.querySelector('.article-author');
  const timeEl = preview.querySelector('.meta-time');

  if (titleInput && titleEl) titleInput.value = titleEl.textContent.trim();
  if (excerptInput && excerptEl) excerptInput.value = excerptEl.textContent.trim();
  if (imageInput && imgEl) imageInput.value = imgEl.getAttribute('src') || '';
  if (authorInput && authorEl) authorInput.value = authorEl.textContent.trim();
  if (timeInput && timeEl) timeInput.value = timeEl.textContent.trim();

  // Listeners
  if (titleInput && titleEl) {
    titleInput.addEventListener('input', (e) => {
      titleEl.textContent = e.target.value;

      // Auto-sync with "Today's Headline" (Top 5 preview)
      const previewHeadline = document.querySelector(`.headline-item[data-index="${idx}"] .headline-text`);
      if (previewHeadline) {
        previewHeadline.textContent = e.target.value;
      }
    });
  }
  if (excerptInput && excerptEl) {
    excerptInput.addEventListener('input', (e) => excerptEl.textContent = e.target.value);
  }
  if (imageInput && imgEl) {
    imageInput.addEventListener('input', (e) => imgEl.src = e.target.value);
  }
  if (authorInput && authorEl) {
    authorInput.addEventListener('input', (e) => authorEl.textContent = e.target.value);
  }
  if (timeInput && timeEl) {
    timeInput.addEventListener('input', (e) => timeEl.textContent = e.target.value);
  }

  if (fetchBtn) {
    fetchBtn.addEventListener('click', () => fetchMeta(urlInput.value, block));
  }

  // URL → btn-read href 실시간 동기화
  if (urlInput) {
    const linkEl = preview.querySelector('a.btn-read');
    if (linkEl) {
      // 초기 동기화
      if (urlInput.value) linkEl.setAttribute('href', urlInput.value);
      urlInput.addEventListener('input', (e) => {
        linkEl.setAttribute('href', e.target.value || '#');
      });
    }
  }
}

function setupResearchSync() {
  const block = document.getElementById('research-edit-block');
  const preview = document.querySelector('#preview-research-0');
  if (!block || !preview) return;

  const titleInput = block.querySelector('.edit-title');
  const excerptInput = block.querySelector('.edit-excerpt');
  const imageInput = block.querySelector('.edit-image');
  const categoryInput = block.querySelector('.edit-category');
  const authorInput = block.querySelector('.edit-author');
  const roleInput = block.querySelector('.edit-role');
  const readtimeInput = block.querySelector('.edit-readtime');
  const chartsInput = block.querySelector('.edit-charts');
  const fetchBtn = block.querySelector('.btn-fetch');
  const urlInput = block.querySelector('.edit-url');

  // Elements
  const titleEl = preview.querySelector('.research-title');
  const excerptEl = preview.querySelector('.research-excerpt');
  const imgEl = preview.querySelector('.research-image img');
  const categoryEl = preview.querySelector('.research-category');
  const authorEl = preview.querySelector('.author-name');
  const roleEl = preview.querySelector('.author-role');
  const readtimeEl = preview.querySelector('.stat-readtime');
  const chartsEl = preview.querySelector('.stat-charts');
  const profileEl = preview.querySelector('.author-avatar');

  const profileInput = block.querySelector('.edit-profile');

  // Initial sync
  if (titleInput && titleEl) titleInput.value = titleEl.textContent.trim();
  if (excerptInput && excerptEl) excerptInput.value = excerptEl.textContent.trim();
  if (imageInput && imgEl) imageInput.value = imgEl.getAttribute('src') || '';
  if (categoryInput && categoryEl) categoryInput.value = categoryEl.textContent.trim();
  if (authorInput && authorEl) authorInput.value = authorEl.textContent.trim();
  if (roleInput && roleEl) roleInput.value = roleEl.textContent.trim();
  if (readtimeInput && readtimeEl) readtimeInput.value = readtimeEl.textContent.trim().replace('📊 ', '');
  if (chartsInput && chartsEl) chartsInput.value = chartsEl.textContent.trim().replace('📈 ', '');
  if (profileInput && profileEl) profileInput.value = profileEl.getAttribute('src') || '';

  // Listeners
  if (titleInput && titleEl) {
    titleInput.addEventListener('input', (e) => titleEl.textContent = e.target.value);
  }
  if (excerptInput && excerptEl) {
    excerptInput.addEventListener('input', (e) => excerptEl.textContent = e.target.value);
  }
  if (imageInput && imgEl) {
    imageInput.addEventListener('input', (e) => imgEl.src = e.target.value);
  }
  if (categoryInput && categoryEl) {
    categoryInput.addEventListener('input', (e) => categoryEl.textContent = e.target.value);
  }
  if (authorInput && authorEl) {
    authorInput.addEventListener('input', (e) => authorEl.textContent = e.target.value);
  }
  if (roleInput && roleEl) {
    roleInput.addEventListener('input', (e) => roleEl.textContent = e.target.value);
  }
  if (readtimeInput && readtimeEl) {
    readtimeInput.addEventListener('input', (e) => readtimeEl.textContent = `📊 ${e.target.value}`);
  }
  if (chartsInput && chartsEl) {
    chartsInput.addEventListener('input', (e) => chartsEl.textContent = `📈 ${e.target.value}`);
  }
  if (profileInput && profileEl) {
    profileInput.addEventListener('input', (e) => profileEl.src = e.target.value);
  }

  if (fetchBtn) {
    fetchBtn.addEventListener('click', () => fetchMeta(urlInput.value, block));
  }

  // URL → btn-read href 실시간 동기화
  if (urlInput) {
    const linkEl = preview.querySelector('a.btn-read');
    if (linkEl) {
      if (urlInput.value) linkEl.setAttribute('href', urlInput.value);
      urlInput.addEventListener('input', (e) => {
        linkEl.setAttribute('href', e.target.value || '#');
      });
    }
  }
}

async function fetchMeta(url, block) {
  if (!url) return alert('URL을 입력해주세요.');

  // Clean URL
  url = url.trim();
  if (!url.startsWith('http')) url = 'https://' + url;

  const btn = block.querySelector('.btn-fetch');
  const originalText = btn?.textContent || '가져오기';
  if (btn) {
    btn.textContent = '...';
    btn.disabled = true;
  }

  console.log('[Fetch] Starting for:', url);

  try {
    console.log(`[Fetch] Starting proxy request for: ${url}`);
    let html;
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}&timestamp=${Date.now()}`);
      if (!response.ok) throw new Error('Proxy error');
      const data = await response.json();
      html = data.contents;
      console.log('[Fetch] AllOrigins success');
    } catch (e) {
      console.warn('[Fetch] AllOrigins failed, trying codetabs fallback...');
      try {
        const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
        html = await response.text();
        console.log('[Fetch] Codetabs success');
      } catch (e2) {
        throw new Error('모든 프록시 서버가 응답하지 않습니다.');
      }
    }

    if (!html || html.length < 100) {
      throw new Error('페이지 내용을 가져오지 못했습니다.');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const getMeta = (props) => {
      for (let prop of props) {
        const el = doc.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
        if (el && el.content) return el.content.trim();
      }
      return null;
    };

    const selectFirst = (selectors) => {
      for (let s of selectors) {
        const el = doc.querySelector(s);
        if (el) {
          if (el.tagName === 'IMG') {
            return el.getAttribute('src') || el.src;
          }
          return el.textContent.trim();
        }
      }
      return null;
    };

    // Helper to resolve absolute URL
    const resolveUrl = (target) => {
      if (!target || target.startsWith('http')) return target;
      try {
        const base = new URL(url).origin;
        if (target.startsWith('//')) return 'https:' + target;
        if (target.startsWith('/')) return base + target;
        return base + '/' + target;
      } catch (e) { return target; }
    };

    // Detect if this is a research block
    const isResearch = block.id === 'research-edit-block';

    let description;
    if (isResearch) {
      // Research: join all <p> tags, limit to 50 chars
      const paragraphs = Array.from(doc.querySelectorAll('.research_content_wrap p, .article_content p'))
        .map(p => p.textContent.trim())
        .filter(t => t.length > 0);
      const joined = paragraphs.join(' ');
      description = joined.length > 50 ? joined.substring(0, 50) + '...' : joined;
      if (!description) description = getMeta(['og:description', 'twitter:description', 'description']) || '';
    } else {
      description = selectFirst(['.research_content_wrap p:nth-child(5)', '.article_content p:nth-of-type(1)', '.article_content p:nth-of-type(2)', '.view_blue_line_text']) || getMeta(['og:description', 'twitter:description', 'description']) || '';
    }

    // Research profile image
    let profileImage = '';
    if (isResearch) {
      const profileEl = doc.querySelector('.research_analyst_img img, .research_analyst_wrap img');
      if (profileEl) {
        profileImage = resolveUrl(profileEl.getAttribute('src') || '');
      }
    }

    const meta = {
      title: selectFirst(['.view_item_title', '#viewLocation .view_top_title', 'h1.view_top_title', 'h1']) || getMeta(['og:title', 'twitter:title']) || doc.title || '',
      description,
      image: resolveUrl(selectFirst(['.research_content_wrap img', '.article_main_image_wrap img', '.view_content_image img', 'article img']) || getMeta(['og:image', 'twitter:image']) || ''),
      author: selectFirst(['.research_analyst_wrap .research_analyst_text', '.research_analyst_wrap', '.contributor_item_text span', '.author', '.writer']) || '',
      profileImage,
    };

    console.log('[Fetch] Scraped Metadata:', meta);

    // If everything is empty, the scraping likely failed silently
    if (!meta.title && !meta.description && !meta.image) {
      alert('페이지에서 기사 정보를 찾을 수 없습니다.\n직접 입력하시거나 다른 URL을 시도해주세요.');
      return;
    }

    if (meta.title) block.querySelector('.edit-title').value = meta.title;
    if (meta.description) block.querySelector('.edit-excerpt').value = meta.description;
    if (meta.image) block.querySelector('.edit-image').value = meta.image;
    if (meta.author && block.querySelector('.edit-author')) block.querySelector('.edit-author').value = meta.author;
    if (meta.profileImage && block.querySelector('.edit-profile')) block.querySelector('.edit-profile').value = meta.profileImage;

    // Trigger input events to update preview
    ['.edit-title', '.edit-excerpt', '.edit-image', '.edit-author', '.edit-profile', '.edit-url'].forEach(sel => {
      const el = block.querySelector(sel);
      if (el) el.dispatchEvent(new Event('input'));
    });

  } catch (err) {
    console.error('[Fetch] Detailed Error:', err);
    alert(`가져오기 실패: ${err.message}\n직접 입력하시거나 다시 시도해주세요.`);
  } finally {
    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
}

function initScheduleEditor() {
  const container = document.getElementById('schedule-edit-container');
  const addBtn = document.getElementById('btn-add-schedule');
  const fetchBtn = document.getElementById('btn-fetch-schedule');

  // 초기 로드: 구글 시트에서 데이터 fetch
  fetchScheduleFromSheets();

  // "시트에서 불러오기" 버튼
  if (fetchBtn) {
    fetchBtn.addEventListener('click', async () => {
      fetchBtn.disabled = true;
      fetchBtn.textContent = '불러오는 중...';
      await fetchScheduleFromSheets();
      renderScheduleInputs();
      fetchBtn.disabled = false;
      fetchBtn.textContent = '📊 시트에서 불러오기';
    });
  }

  // 수동 일정 추가 버튼
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      tokenEvents.push({ date: new Date().toISOString().slice(0, 10), name: '새 일정', desc: '', importance: 'normal' });
      renderSchedule();
      renderScheduleInputs();
    });
  }
}

function renderScheduleInputs() {
  const container = document.getElementById('schedule-edit-container');
  if (!container) return;
  container.innerHTML = '';

  // 거시경제 + 토큰일정 통합 표시
  const allEvents = [
    ...macroEvents.map((ev, i) => ({ ...ev, _type: '거시경제', _arr: macroEvents, _idx: i })),
    ...tokenEvents.map((ev, i) => ({ ...ev, _type: '토큰일정', _arr: tokenEvents, _idx: i })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  allEvents.forEach(ev => {
    const item = document.createElement('div');
    item.className = 'field-group';
    item.style.padding = '10px';
    item.style.background = '#fcfcfc';
    item.style.border = '1px solid #eee';
    item.style.borderRadius = '6px';
    item.style.marginBottom = '8px';
    item.style.position = 'relative';

    const typeColor = ev._type === '거시경제' ? '#3b82f6' : '#f59e0b';
    const typeLabel = ev._type === '거시경제' ? '거시' : '토큰';

    item.innerHTML = `
      <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 4px;">
        <span style="font-size:9px; padding:2px 6px; border-radius:4px; background:${typeColor}; color:white;">${typeLabel}</span>
        <span style="font-size:10px; color:#888;">${ev.date}</span>
      </div>
      <div style="font-size:12px; font-weight:500; color:#333;">${ev.name}</div>
      <button class="btn-del-ev" style="position:absolute;top:-5px;right:-5px;background:#ff4444;color:white;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;cursor:pointer;border:none;">×</button>
    `;

    item.querySelector('.btn-del-ev').addEventListener('click', () => {
      ev._arr.splice(ev._idx, 1);
      renderSchedule();
      renderScheduleInputs();
    });

    container.appendChild(item);
  });

  if (allEvents.length === 0) {
    container.innerHTML = '<p style="font-size:11px; color:#999; text-align:center; padding:12px;">일정이 없습니다. "시트에서 불러오기" 버튼을 눌러주세요.</p>';
  }
}

async function exportEmailHtml() {
  const container = document.getElementById('newsletterPreview');
  if (!container) return alert('미리보기 컨테이너를 찾을 수 없습니다.');


  // 2. Constrain to 600px for accurate computed styles
  const originalMaxWidth = container.style.maxWidth;
  const originalWidth = container.style.width;
  container.style.maxWidth = '600px';
  container.style.width = '600px';
  container.offsetHeight; // Force reflow

  // 3. Clone
  const clone = container.cloneNode(true);
  clone.querySelectorAll('script, style, iframe, audio, video, embed, object, noscript, form, meta, button, input, select, textarea, .top-bar, .btn-fetch, .btn-primary-sm').forEach(el => el.remove());

  // Remove HTML developer comments to save space
  const walk = document.createTreeWalker(clone, NodeFilter.SHOW_COMMENT, null, false);
  const comments = [];
  let n;
  while (n = walk.nextNode()) comments.push(n);
  comments.forEach(c => c.remove());

  // 4. Email-safe properties (Gmail strips flex, grid, gap, aspect-ratio)
  const emailSafeProps = [
    'background-color', 'border', 'border-radius', 'border-bottom', 'border-top',
    'color', 'font-family', 'font-size', 'font-weight', 'line-height',
    'margin', 'margin-bottom', 'margin-top', 'max-width',
    'padding', 'padding-bottom', 'padding-top', 'padding-left', 'padding-right',
    'text-align', 'text-decoration', 'text-transform',
    'width', 'letter-spacing', 'overflow', 'word-break', 'overflow-wrap',
    'object-fit', 'min-width'
  ];

  const skipValues = {
    'object-fit': 'fill', 'min-width': '0px', 'max-width': 'none',
    'letter-spacing': 'normal', 'text-transform': 'none',
    'word-break': 'normal', 'overflow-wrap': 'normal'
  };

  const allOriginals = Array.from(container.querySelectorAll('*'));
  const allClones = Array.from(clone.querySelectorAll('*'));
  allOriginals.unshift(container);
  allClones.unshift(clone);

  allClones.forEach((el, i) => {
    const original = allOriginals[i];
    if (!original) return;
    const computed = window.getComputedStyle(original);
    let inlineStyle = '';

    // === Display & Layout (email-safe) ===
    const display = computed.display;
    const gridCols = computed.gridTemplateColumns;
    const flexDir = computed.flexDirection;

    if (display === 'grid' || display.includes('grid')) {
      const colCount = gridCols ? gridCols.split(/\s+/).filter(v => parseFloat(v) > 0).length : 1;
      if (colCount > 1) {
        el.setAttribute('data-email-cols', colCount);
        el.setAttribute('data-email-gap', parseInt(computed.gap || computed.columnGap) || 0);
      }
      inlineStyle += 'display:block;width:100%;';
    } else if (display === 'flex' || display === 'inline-flex') {
      if (flexDir !== 'column' && flexDir !== 'column-reverse' && original.children.length > 1) {
        // Row flex with multiple children → mark for table
        el.setAttribute('data-email-row', 'true');
        el.setAttribute('data-email-gap', parseInt(computed.gap || computed.columnGap) || 0);

        // [Fix] 섹션 헤더(타이틀 + 배지) 양끝 정렬 마킹
        if (original.classList.contains('section-header')) {
          el.setAttribute('data-email-align', 'split');
        }

        // [Fix] 헤드라인 아이템: 번호 셀 고정폭, 텍스트 셀 나머지 차지
        if (original.classList.contains('headline-item')) {
          el.setAttribute('data-email-align', 'headline');
        }
      }
      inlineStyle += 'display:block;width:100%;';
    } else {
      // Don't inject 'display: block' for block-level tags to save bytes
      if (display === 'inline' || display === 'inline-block') {
        inlineStyle += `display:${display};`;
      } else if (!['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'LI', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER'].includes(el.tagName)) {
        inlineStyle += 'display:block;';
      }
    }

    const parentComputed = original.parentElement ? window.getComputedStyle(original.parentElement) : null;
    const inheritableProps = ['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'text-align', 'letter-spacing', 'word-break', 'overflow-wrap'];

    // === Inline email-safe CSS properties ===
    emailSafeProps.forEach(prop => {
      let val = computed.getPropertyValue(prop);
      if (!val) return;
      if (skipValues[prop] === val) return;
      if (val === 'initial' || val === 'none' || val === 'normal') return;

      // Aggressive size reduction: Strip all 0px properties
      if (val === '0px' || val === '0px 0px 0px 0px' || val === '0') return;
      // Strip transparent backgrounds / colors
      if (val === 'rgba(0, 0, 0, 0)' || val === 'transparent') return;
      // Strip empty borders
      if (prop.startsWith('border') && (val.includes('0px none') || val.includes('none 0px') || val.includes('transparent'))) return;

      // [CRITICAL OPTIMIZATION] Inheritance Skipping
      // If the parent has the exact same value for an inheritable property, skip it to save tons of space!
      if (parentComputed && inheritableProps.includes(prop)) {
        if (parentComputed.getPropertyValue(prop) === val) return;
      }

      // [Fix] Korean mail clients (Naver, Daum) aggressively strip "width" and "height" strings from <a> tags.
      // This turns 'line-height:22px' into 'line-:22px', causing syntax errors that break the entire style.
      if (el.tagName === 'A' && (prop.includes('width') || prop.includes('height'))) {
        return;
      }

      // [Fix] Do not hardcode exact pixel dimensions from getComputedStyle!
      // This forces elements into fixed rigid boxes and destroys mobile responsiveness.
      // We handle layout dimensions via hybrid tables and 100% wrappers instead.
      if (['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height'].includes(prop)) {
        if (val.includes('px')) {
          if (el.tagName !== 'IMG') {
            return;
          }
        }
      }

      // Font size reduction for email compactness
      if (prop === 'font-size' && val.includes('px')) {
        const px = parseFloat(val);
        if (px > 20) val = Math.round(px * 0.85) + 'px';
      }

      inlineStyle += `${prop}:${val};`;
    });

    if (el.id === 'newsletterPreview') {
      inlineStyle += 'width:100%;max-width:600px;margin:0 auto;';
    }

    // === Images: explicit dimensions ===
    if (el.tagName === 'IMG') {
      const w = original.offsetWidth;
      if (w > 0) {
        el.setAttribute('width', Math.min(w, 600));
        inlineStyle += `width:100%;max-width:${w}px;height:auto;`;
      }
    }

    // === Background properties ===
    if (computed.backgroundImage && computed.backgroundImage !== 'none') {
      inlineStyle += `background-image:${computed.backgroundImage};`;
      if (computed.backgroundSize) inlineStyle += `background-size:${computed.backgroundSize};`;
      if (computed.backgroundPosition) inlineStyle += `background-position:${computed.backgroundPosition};`;
      if (computed.backgroundRepeat) inlineStyle += `background-repeat:${computed.backgroundRepeat};`;
      if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        inlineStyle += `background-color:${computed.backgroundColor};`;
      }
    }

    // === Overflow protection & Long URL handling ===
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'DIV'].includes(el.tagName)) {
      inlineStyle += 'word-break:keep-all;overflow-wrap:break-word;';
    }
    if (el.tagName === 'A') {
      inlineStyle += 'word-break:break-all;overflow-wrap:break-word;';
    }
    if (el.closest('.newsletter-header') || el.closest('.crypto-section')) {
      inlineStyle += 'overflow:hidden;';
    }

    el.setAttribute('style', inlineStyle);

    // === Post-processing: article text overflow & button alignment ===
    // Article grid cards (2-5번): title, excerpt 2줄 제한
    // Article grid cards (2-5번): height normalization for equal-height look
    if (original.closest && original.closest('.article-grid')) {
      if (original.classList.contains('article-image')) {
        el.style.cssText += 'width:100%; height:160px; overflow:hidden; background-color:#f8f9fa;';
      }
      if (original.classList.contains('article-title')) {
        el.style.cssText += 'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;height:48px;line-height:24px;margin-bottom:8px;';
      }
      if (original.classList.contains('article-excerpt')) {
        el.style.cssText += 'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;height:44px;line-height:22px;margin-bottom:12px;';
      }
    }

    // article-image 내 img: 
    if (el.tagName === 'IMG' && original.parentElement && original.parentElement.classList.contains('article-image')) {
      el.style.cssText += 'width:100%; height:auto; display:block; object-fit:cover;';
      // If parent has fixed height, we can force height:100% or auto
      if (original.parentElement.closest && original.parentElement.closest('.article-grid')) {
        el.style.height = '160px';
      }
      el.removeAttribute('height');
    }

    // ==== BULLETPROOF BUTTONS ====
    // 버튼의 배경, 패딩을 A 태그에서 분리하여 테이블 TD로 옮김 (네이버 메일 등에서 A태그 width 무시 문제 해결)
    if (original.classList.contains('btn-read') || original.classList.contains('cal-footer-link')) {
      const comp = window.getComputedStyle(original);
      const bg = comp.backgroundColor;
      const border = comp.border;
      const radius = comp.borderRadius;
      const padding = comp.padding;
      const margin = comp.margin;

      // A 태그에는 텍스트와 링크 속성만 남김
      el.style.backgroundColor = 'transparent';
      el.style.border = 'none';
      el.style.padding = '0';
      el.style.margin = '0';
      el.style.display = 'block';
      el.style.textAlign = 'center';
      // Do not add 'width' strings here!

      // 래퍼 테이블 생성
      const btnTable = document.createElement('table');
      btnTable.setAttribute('width', '100%');
      btnTable.setAttribute('border', '0');
      btnTable.setAttribute('cellspacing', '0');
      btnTable.setAttribute('cellpadding', '0');
      btnTable.setAttribute('role', 'presentation');
      btnTable.style.margin = margin;
      btnTable.style.width = '100%';
      btnTable.style.borderCollapse = 'separate';

      const tbody = document.createElement('tbody');
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.setAttribute('align', 'center');
      td.setAttribute('valign', 'middle');
      td.setAttribute('width', '100%');

      // TD에 색상 및 패딩 적용
      td.style.backgroundColor = (bg && bg !== 'rgba(0, 0, 0, 0)') ? bg : 'transparent';
      if (border && !border.includes('0px none')) td.style.border = border;
      if (radius) td.style.borderRadius = radius;
      if (padding) td.style.padding = padding;

      tr.appendChild(td);
      tbody.appendChild(tr);
      btnTable.appendChild(tbody);

      // DOM 교체: A 태그를 테이블의 TD 안으로 이동
      el.parentNode.insertBefore(btnTable, el);
      td.appendChild(el);
    }

    // === Featured Article (1번 카드) 크기를 2-5번과 동일하게 축소 ===
    if (original.closest && original.closest('.article-card.featured')) {
      if (original.classList.contains('article-image')) {
        el.style.cssText += 'width:100%; max-height:200px; overflow:hidden; background-color:#f8f9fa;';
      }
      if (original.classList.contains('article-title')) {
        el.style.cssText += 'font-size:16px; font-weight:600; line-height:24px; margin-bottom:8px; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;';
      }
      if (original.classList.contains('article-excerpt')) {
        el.style.cssText += 'font-size:14px; line-height:22px; margin-bottom:12px; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;';
      }
      if (original.classList.contains('article-content')) {
        el.style.cssText += 'padding:16px;';
      }
      // Featured card image > img
      if (el.tagName === 'IMG' && original.parentElement && original.parentElement.classList.contains('article-image')
        && original.closest('.article-card.featured')) {
        el.style.cssText += 'width:100%; max-height:200px; height:auto; display:block; object-fit:cover;';
      }
    }

    // === Crypto Icon 크기 통일 (모든 코인 동일 32px) ===
    if (original.closest && original.closest('.crypto-section')) {
      if (original.classList.contains('crypto-icon')) {
        const iconSize = 32;
        el.style.cssText += `width:${iconSize}px; height:${iconSize}px; border-radius:50%; object-fit:cover;`;
        el.setAttribute('width', String(iconSize));
        el.setAttribute('height', String(iconSize));
      }
    }

    // === Schedule 섹션 여백 추가 ===
    if (original.closest && original.closest('.schedule-section')) {
      if (original.classList.contains('schedule-list')) {
        el.style.cssText += 'padding:12px;';
      }
      if (original.classList.contains('schedule-item')) {
        el.style.cssText += 'padding:12px; margin-bottom:4px;';
      }
      if (original.classList.contains('schedule-column')) {
        el.style.cssText += 'margin-bottom:16px;';
      }
    }

    // === Schedule Tag Important width fix ===
    if (original.classList.contains('schedule-tag') && original.classList.contains('important')) {
      el.style.width = 'fit-content';
    }

    el.removeAttribute('class');
  });

  // 5. Hybrid Layout helper (Fluid Hybrid + Outlook Ghost Tables)
  function wrapInHybridLayout(wrapper, cols, gap) {
    const children = Array.from(wrapper.children);
    if (children.length === 0) return;

    // Parent setup
    wrapper.style.textAlign = 'center';
    wrapper.style.fontSize = '0';
    wrapper.style.direction = 'ltr';
    wrapper.style.whiteSpace = 'normal'; // Force wrapping for inline-blocks

    const containerWidth = 600;
    const spacing = Math.max(Math.min(gap, 20), 12); // Min 12px gap for readability
    // Full column width — padding inside will create the visual gap
    const colWidth = Math.floor(containerWidth / cols);

    let hybridHtml = '';

    // Start Outlook Ghost Table
    hybridHtml += `<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><![endif]-->`;

    children.forEach((child, idx) => {
      // Symmetric padding: 모든 컬럼에 동일한 좌우 패딩 → 모바일 스택 시 정렬 유지
      const hPad = Math.ceil(spacing / 2);
      const bottomPad = spacing;

      // Inline block wrapper for each column (non-Outlook clients)
      const colWrapper = document.createElement('div');
      colWrapper.setAttribute('style',
        `width:100%; max-width:${colWidth}px; display:inline-block; vertical-align:top; direction:ltr; font-size:14px; box-sizing:border-box; padding:0 ${hPad}px ${bottomPad}px ${hPad}px;`
      );

      // Ensure the child card fits the wrapper
      child.style.width = '100%';
      child.style.maxWidth = '100%';
      colWrapper.appendChild(child);

      // Outlook: start new row
      if (idx > 0 && idx % cols === 0) {
        hybridHtml += `<!--[if mso | IE]></tr><tr><![endif]-->`;
      }

      // Outlook ghost table cell with matching padding
      hybridHtml += `<!--[if mso | IE]><td style="vertical-align:top; width:${colWidth}px; padding:0 ${hPad}px ${bottomPad}px ${hPad}px;"><![endif]-->`;
      hybridHtml += colWrapper.outerHTML;
      hybridHtml += `<!--[if mso | IE]></td><![endif]-->`;
    });

    // End Outlook Ghost Table
    hybridHtml += `<!--[if mso | IE]></tr></table><![endif]-->`;

    wrapper.innerHTML = hybridHtml;
  }

  // 6. Convert multi-column grids to hybrid layouts
  clone.querySelectorAll('[data-email-cols]').forEach(wrapper => {
    const cols = parseInt(wrapper.getAttribute('data-email-cols'));
    const gap = parseInt(wrapper.getAttribute('data-email-gap')) || 0;
    wrapInHybridLayout(wrapper, cols, gap);
    wrapper.removeAttribute('data-email-cols');
    wrapper.removeAttribute('data-email-gap');
  });

  // 6.5 Article grid card height normalization (Handled via table td height)
  // Since we use the hybrid layout now, height normalization inside a row is tricky without tables.
  // For Outlook, the ghost table-cells handle it. For others, cards will stack.
  clone.querySelectorAll('[id^="preview-article-"]').forEach(card => {
    if (card.id === 'preview-article-0') return; // Skip featured

    // Apply basic alignment for stacking view
    card.style.height = '100%';

    const contentDiv = card.children[1];
    if (!contentDiv) return;
    contentDiv.style.height = '100%';

    // Button alignment using table (safe for Gmail)
    const children = Array.from(contentDiv.children);
    if (children.length === 0) return;

    const innerTable = document.createElement('table');
    innerTable.setAttribute('role', 'presentation');
    innerTable.setAttribute('width', '100%');
    innerTable.setAttribute('cellpadding', '0');
    innerTable.setAttribute('cellspacing', '0');
    innerTable.setAttribute('border', '0');
    innerTable.setAttribute('style', 'width:100%; height:100%; border-collapse:collapse;');

    children.forEach((child, i) => {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.setAttribute('style', 'vertical-align:top;');

      // If it's the last element (button), set vertical-align: bottom
      if (i === children.length - 1) {
        td.setAttribute('style', 'vertical-align:bottom; padding-top:12px;');
      }

      td.appendChild(child);
      tr.appendChild(td);
      innerTable.appendChild(tr);
    });

    contentDiv.innerHTML = '';
    contentDiv.appendChild(innerTable);
  });

  // 7. Convert flex-row containers to single-row tables
  clone.querySelectorAll('[data-email-row]').forEach(wrapper => {
    const gap = parseInt(wrapper.getAttribute('data-email-gap')) || 0;
    const children = Array.from(wrapper.children);
    if (children.length === 0) return;

    const table = document.createElement('table');
    table.setAttribute('role', 'presentation');
    table.setAttribute('width', '100%');
    table.setAttribute('cellpadding', '0');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('border', '0');
    table.setAttribute('style', 'width:100%;border-collapse:collapse;');
    const tr = document.createElement('tr');

    const align = wrapper.getAttribute('data-email-align');

    children.forEach((child, idx) => {
      const td = document.createElement('td');
      td.setAttribute('valign', 'middle');
      let tdStyle = 'vertical-align:middle;';
      if (idx > 0 && gap) tdStyle += `padding-left:${Math.min(gap, 8)}px;`;

      // [Fix] section-header: polarized 정렬
      if (align === 'split' && idx === 0) {
        td.setAttribute('width', '100%');
      }
      if (align === 'split' && idx === children.length - 1) {
        tdStyle += 'text-align:right;white-space:nowrap;';
      }

      // [Fix] headline-item: 번호 셀 고정폭(36px) + 중앙정렬, 텍스트 셀 나머지 차지
      if (align === 'headline' && idx === 0) {
        td.setAttribute('width', '36');
        tdStyle += 'width:36px;text-align:center;';
        // 내부 span에도 text-align:center 강제 적용
        const innerSpan = child.querySelector('span') || child;
        if (innerSpan.tagName === 'SPAN') {
          innerSpan.style.textAlign = 'center';
        } else {
          child.style.textAlign = 'center';
        }
      }

      td.setAttribute('style', tdStyle);
      td.appendChild(child);
      tr.appendChild(td);
    });

    table.appendChild(tr);
    wrapper.innerHTML = '';
    wrapper.appendChild(table);
    wrapper.removeAttribute('data-email-row');
    wrapper.removeAttribute('data-email-gap');
  });

  // RESTORE original container styles
  container.style.maxWidth = originalMaxWidth;
  container.style.width = originalWidth;

  // 8. Build final HTML
  // Clipboard: Pure container only for Stibee compatibility (no html/head/body/meta tags)
  const exportedHtml = clone.outerHTML;

  // Preview: Full HTML document with viewport meta for proper mobile testing
  const previewHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Newsletter Preview</title>
<style>body{margin:0;padding:0;background-color:#f0f2f5;}</style>
</head>
<body>
${exportedHtml}
</body>
</html>`;

  // 9. Copy to clipboard (pure HTML for Stibee)
  const textarea = document.createElement('textarea');
  textarea.value = exportedHtml;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);

  alert('이메일 호환 HTML이 클립보드에 복사되었습니다.\n(테이블 기반 반응형 레이아웃으로 최적화되었습니다.)');

  // Open preview (full HTML doc with viewport for mobile testing)
  const blob = new Blob([previewHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

// ===== HEADER DATE =====
function updateHeaderDate() {
  const el = document.getElementById('headerDate');
  if (!el) return;
  const now = new Date();
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const text = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}`;
  el.textContent = text;
  // Also set the editor input
  const input = document.getElementById('edit-date');
  if (input) input.placeholder = text;
}

// ===== INIT =====
function startApp() {
  try {
    updateHeaderDate();
    fetchCryptoPrices();
    renderSchedule();
    initEditor();

    // Auto-refresh crypto prices every 30 seconds
    setInterval(fetchCryptoPrices, 30000);
    console.log('[App] Successfully initialized.');
  } catch (err) {
    console.error('[App] Initialization error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
