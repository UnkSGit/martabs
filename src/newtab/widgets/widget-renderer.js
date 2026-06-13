import { WIDGET_REGISTRY } from './widget-registry.js';
import { el } from '../../shared/render.js';
import { t } from '../../shared/i18n-helper.js';

let clockInterval = null;
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;
const SPORTS_CACHE_TTL_MS = 10 * 60 * 1000;

async function getWidgetCache(api, key) {
  try {
    const data = await api.storage.local.get(key);
    const entry = data?.[key];
    if (entry?.expiresAt && entry.expiresAt > Date.now()) {
      return entry.value;
    }
  } catch (e) {
    console.warn('Widget cache read failed:', e);
  }
  return null;
}

async function setWidgetCache(api, key, value, ttlMs) {
  try {
    await api.storage.local.set({
      [key]: {
        value,
        expiresAt: Date.now() + ttlMs
      }
    });
  } catch (e) {
    console.warn('Widget cache write failed:', e);
  }
}

export async function initializeWidgets(api, settings, widgetsContainer, widgetsGrid) {
  // Clear any existing active states
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
  widgetsGrid.innerHTML = '';
  widgetsContainer.style.display = 'none';

  if (!settings.widgets || !settings.widgets.enabled) {
    return;
  }

  const w = settings.widgets;

  const toggleBtn = widgetsContainer.querySelector('#widgets-toggle');
  if (toggleBtn) {
    const newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
    newToggleBtn.addEventListener('click', () => {
      const currentStyle = settings.widgets?.style || 'standard';
      const nextStyle = currentStyle === 'compact' ? 'standard' : 'compact';
      const updatedSettings = {
        ...settings,
        widgets: {
          ...(settings.widgets || {}),
          style: nextStyle
        }
      };
      api.storage.local.set({ settings: updatedSettings });
    });
  }

  // Handle compact vs standard style
  const style = w.style || 'standard';
  if (style === 'compact') {
    widgetsGrid.classList.add('widgets-compact');
    widgetsContainer.classList.add('widgets-style-compact');
  } else {
    widgetsGrid.classList.remove('widgets-compact');
    widgetsContainer.classList.remove('widgets-style-compact');
  }

  const defaultWidgetIds = ['clock', 'weather', 'sports', 'notes', 'checklist'];
  const savedOrder = Array.isArray(w.order) ? w.order : [];
  const widgetIds = [
    ...savedOrder.filter(id => defaultWidgetIds.includes(id)),
    ...defaultWidgetIds.filter(id => !savedOrder.includes(id))
  ];
  let hasActiveWidgets = false;

  for (const id of widgetIds) {
    const config = w[id];
    if (config && config.enabled) {
      const widgetWrapper = el('div', { class: `widget-card widget-${id}` });
      widgetsGrid.appendChild(widgetWrapper);
      hasActiveWidgets = true;

      // Call individual renderer
      renderWidgetContent(id, widgetWrapper, config, api, settings, style);
    }
  }

  if (hasActiveWidgets) {
    widgetsContainer.style.display = 'flex';
  }
}

function renderWidgetContent(id, container, config, api, settings, style) {
  switch (id) {
    case 'clock':
      renderClockWidget(container, config, api, settings, style);
      break;
    case 'weather':
      renderWeatherWidget(container, config, api, settings, style);
      break;
    case 'sports':
      renderSportsWidgetV2(container, config, api, settings, style);
      break;
    case 'notes':
      renderNotesWidget(container, config, api, settings, style);
      break;
    case 'checklist':
      renderChecklistWidget(container, config, api, settings, style);
      break;
  }
}

// 1. Clock Widget (Local clock with date)
function renderClockWidget(container, config, api, settings, style) {
  const header = el('div', { class: 'widget-header' }, [
    el('div', { class: 'widget-title-container' }, [
      el('h4', { class: 'widget-title', text: t(api, 'clockWidget') || 'Clock' })
    ])
  ]);
  
  const timeEl = el('span', { class: 'widget-clock-time-display', text: '--:--' });
  const dateEl = el('span', { class: 'widget-clock-date-display', text: '' });
  
  const clockContainer = el('div', { class: 'widget-clock-container' }, [
    timeEl,
    dateEl
  ]);
  
  container.append(header, clockContainer);

  const format = config.format || 'locale';

  function getLocalDateString(lang) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    try {
      const dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', options);
      return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    } catch (e) {
      const dateStr = new Date().toLocaleDateString([], options);
      return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }
  }

  function formatTime(date, format) {
    if (format === '12') {
      const hours = date.getHours();
      const normalizedHours = hours % 12 || 12;
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const period = hours >= 12 ? 'PM' : 'AM';
      return { time: `${String(normalizedHours).padStart(2, '0')}:${minutes}:${seconds}`, period };
    }

    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    if (format === '24') {
      options.hour12 = false;
    }
    return { time: date.toLocaleTimeString([], options), period: '' };
  }

  function updateClock() {
    const now = new Date();
    const formattedTime = formatTime(now, format);
    timeEl.textContent = '';
    timeEl.classList.toggle('has-period', Boolean(formattedTime.period));
    timeEl.appendChild(el('span', { class: 'widget-clock-time-main', text: formattedTime.time }));
    if (formattedTime.period) {
      timeEl.appendChild(el('span', { class: 'widget-clock-period', text: formattedTime.period }));
    }
    dateEl.textContent = getLocalDateString(settings.language);
  }

  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

// 2. Weather Widget
async function renderWeatherWidget(container, config, api, settings, style) {
  const header = el('div', { class: 'widget-header' }, [
    el('div', { class: 'widget-title-container' }, [
      el('h4', { class: 'widget-title', text: t(api, 'weatherWidget') || 'Weather' })
    ])
  ]);

  const label = config.locationLabel || 'Weather';
  const iconEl = el('span', { class: 'widget-weather-large-icon', text: '🌤️' });
  const tempEl = el('span', { class: 'widget-weather-large-temp', text: '...' });
  const locationEl = el('span', { class: 'widget-weather-location', text: label });
  const descEl = el('span', { class: 'widget-weather-desc', text: '...' });

  const body = el('div', { class: 'widget-weather-body' }, [
    el('div', { class: 'widget-weather-main' }, [
      iconEl,
      tempEl
    ]),
    el('div', { class: 'widget-weather-info' }, [
      locationEl,
      descEl
    ])
  ]);

  container.append(header, body);

  const query = config.locationQuery || '';
  const units = config.units || 'metric';

  if (!query) {
    tempEl.textContent = 'No Loc';
    descEl.textContent = 'Configure query';
    return;
  }

  const cacheKey = `widgetCache:weather:${query.trim().toLowerCase()}:${units}`;

  function applyWeatherPayload(payload) {
    tempEl.textContent = payload.tempText;
    iconEl.textContent = payload.iconText;
    descEl.textContent = payload.description;
  }

  try {
    const cachedWeather = await getWidgetCache(api, cacheKey);
    if (cachedWeather) {
      applyWeatherPayload(cachedWeather);
      return;
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      tempEl.textContent = 'Loc err';
      descEl.textContent = 'Location not found';
      return;
    }

    const { latitude, longitude } = geoData.results[0];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    if (!weatherData.current_weather) {
      tempEl.textContent = 'Err';
      descEl.textContent = 'Failed to load weather';
      return;
    }

    const weather = weatherData.current_weather;
    let tempVal = weather.temperature;
    if (units === 'imperial') {
      tempVal = (tempVal * 9) / 5 + 32;
    }

    tempEl.textContent = `${Math.round(tempVal)}°${units === 'metric' ? 'C' : 'F'}`;
    iconEl.textContent = getWeatherEmoji(weather.weathercode);
    descEl.textContent = getWeatherDescription(weather.weathercode);
    await setWidgetCache(api, cacheKey, {
      tempText: tempEl.textContent,
      iconText: iconEl.textContent,
      description: descEl.textContent
    }, WEATHER_CACHE_TTL_MS);
  } catch (e) {
    console.error('Weather widget error:', e);
    tempEl.textContent = 'Offline';
    descEl.textContent = 'Network error';
  }
}

function getWeatherEmoji(code) {
  if (code === 0) return '☀️';
  if ([1, 2, 3].includes(code)) return '🌤️';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57].includes(code)) return '🌧️';
  if ([61, 63, 65, 66, 67].includes(code)) return '🌧️';
  if ([71, 73, 75, 77].includes(code)) return '❄️';
  if ([80, 81, 82].includes(code)) return '🌦️';
  if ([85, 86].includes(code)) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

function getWeatherDescription(code) {
  if (code === 0) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55].includes(code)) return 'Drizzle';
  if ([61, 63, 65].includes(code)) return 'Rain';
  if ([71, 73, 75].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

// 3. Sports Widget (live scores from ESPN keyless endpoint with tabs and pager)

async function renderSportsWidgetV2(container, config, api, settings, style) {
  container.classList.add('widget-sports-card');

  const header = el('div', { class: 'widget-header' }, [
    el('div', { class: 'widget-title-container' }, [
      el('h4', { class: 'widget-title', text: t(api, 'sportsWidget') || 'Sports' })
    ])
  ]);
  const contentContainer = el('div', { class: 'widget-sports-match' });
  const footerContainer = el('div', { class: 'widget-sports-footer' });

  container.append(header);

  const league = config.league || 'soccer-esp-1';

  function getEspnLeaguePath(leagueId) {
    switch (leagueId) {
      case 'soccer-esp-1': return 'soccer/esp.1';
      case 'soccer-eng-1': return 'soccer/eng.1';
      case 'soccer-ita-1': return 'soccer/ita.1';
      case 'soccer-ger-1': return 'soccer/ger.1';
      case 'soccer-uefa-champions': return 'soccer/uefa.champions';
      case 'soccer-conmebol-libertadores': return 'soccer/conmebol.libertadores';
      case 'soccer-arg-1': return 'soccer/arg.1';
      case 'soccer-fifa-world': return 'soccer/fifa.world';
      case 'soccer-uefa-euro': return 'soccer/uefa.euro';
      case 'soccer-copa-america': return 'soccer/copa.america';
      case 'basketball-nba': return 'basketball/nba';
      case 'football-nfl': return 'football/nfl';
      default: return 'soccer/esp.1';
    }
  }

  function getCompetitors(match) {
    return match?.competitions?.[0]?.competitors || [];
  }

  function getTeamLogo(competitor) {
    const logo = competitor?.team?.logo || competitor?.team?.logos?.[0]?.href || '';
    return logo
      ? el('img', { class: 'widget-sports-logo', src: logo, alt: '' })
      : el('span', { class: 'widget-sports-logo-placeholder' });
  }

  function formatMatchDate(match) {
    const date = match?.date ? new Date(match.date) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    const locale = settings.language === 'es' ? 'es-ES' : undefined;
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'short' }).replace('.', '');
  }

  function formatMatchTime(match) {
    const date = match?.date ? new Date(match.date) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatEspnDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  function getDateRange(startOffsetDays, endOffsetDays) {
    const start = new Date();
    start.setDate(start.getDate() + startOffsetDays);
    const end = new Date();
    end.setDate(end.getDate() + endOffsetDays);
    return `${formatEspnDate(start)}-${formatEspnDate(end)}`;
  }

  async function fetchScoreboardEvents(dateRange) {
    const cacheKey = `widgetCache:sports:${league}:${dateRange}`;
    const cachedEvents = await getWidgetCache(api, cacheKey);
    if (cachedEvents) {
      return cachedEvents;
    }

    const params = dateRange ? `?dates=${dateRange}` : '';
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${getEspnLeaguePath(league)}/scoreboard${params}`);
    const data = await res.json();
    const events = data.events || [];
    await setWidgetCache(api, cacheKey, events, SPORTS_CACHE_TTL_MS);
    return events;
  }

  function uniqueEvents(eventsList) {
    const seen = new Set();
    return eventsList.filter(event => {
      const key = event.id || event.uid || event.date;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function getMatchStatus(match) {
    const state = match?.status?.type?.state;
    if (state === 'post') return match?.status?.type?.shortDetail || match?.status?.type?.detail || 'Final';
    if (state === 'in') return match?.status?.type?.shortDetail || match?.status?.type?.detail || 'Live';
    const time = formatMatchTime(match);
    const date = formatMatchDate(match);
    return time && date ? `${time} · ${date}` : (match?.status?.type?.detail || 'Scheduled');
  }

  function favoriteMatchesEvent(event) {
    if (config.mode !== 'teams' || !Array.isArray(config.favorites) || config.favorites.length === 0) {
      return true;
    }

    return getCompetitors(event).some(comp => {
      const teamId = String(comp?.team?.id || '');
      const displayName = (comp?.team?.displayName || '').toLowerCase();
      const abbreviation = (comp?.team?.abbreviation || '').toLowerCase();
      return config.favorites.some(fav => {
        if (typeof fav === 'string') {
          const text = fav.toLowerCase().trim();
          return displayName.includes(text) || abbreviation === text;
        }
        return String(fav.teamId || '') === teamId;
      });
    });
  }

  try {
    const [recentRawEvents, upcomingRawEvents] = await Promise.all([
      fetchScoreboardEvents(getDateRange(-2, 0)),
      fetchScoreboardEvents(getDateRange(0, 2))
    ]);
    const events = uniqueEvents([...recentRawEvents, ...upcomingRawEvents]).filter(favoriteMatchesEvent);

    const results = uniqueEvents(recentRawEvents)
      .filter(favoriteMatchesEvent)
      .filter(event => ['post', 'in'].includes(event.status?.type?.state));
    const upcoming = uniqueEvents(upcomingRawEvents)
      .filter(favoriteMatchesEvent)
      .filter(event => event.status?.type?.state === 'pre');

    if (events.length === 0) {
      const emptyMsg = config.mode === 'teams'
        ? (t(api, 'sportsNoFavorites') || 'No games involving favorite teams.')
        : (t(api, 'sportsNoMatches') || 'No matches found');
      contentContainer.appendChild(el('div', { class: 'widget-sports-empty', text: emptyMsg }));
      container.append(contentContainer);
      return;
    }

    let activeTab = results.length > 0 ? 'results' : 'upcoming';
    try {
      const stored = await api.storage.local.get('widgetSportsActiveTab');
      if (stored?.widgetSportsActiveTab === 'results' || stored?.widgetSportsActiveTab === 'upcoming') {
        activeTab = stored.widgetSportsActiveTab;
      }
    } catch (e) {
      console.warn('Failed to load saved sports active tab:', e);
    }
    let resultsIndex = 0;
    let upcomingIndex = 0;

    const resultTab = el('button', {
      type: 'button',
      class: `widget-sports-tab ${activeTab === 'results' ? 'active' : ''}`,
      text: t(api, 'sportsTabResults') || 'Results'
    });
    const upcomingTab = el('button', {
      type: 'button',
      class: `widget-sports-tab ${activeTab === 'upcoming' ? 'active' : ''}`,
      text: t(api, 'sportsTabUpcoming') || 'Upcoming'
    });
    const tabsWrapper = el('div', { class: 'widget-sports-tabs' }, [resultTab, upcomingTab]);

    const prevBtn = el('button', { type: 'button', class: 'sports-pager-btn', text: '‹' });
    const pageIndicator = el('span', { class: 'widget-sports-page-indicator', text: '1/1' });
    const nextBtn = el('button', { type: 'button', class: 'sports-pager-btn', text: '›' });
    const statusText = el('span', { class: 'widget-sports-status', text: '' });
    const pagerWrapper = el('div', { class: 'widget-sports-pager' }, [prevBtn, pageIndicator, nextBtn]);
    footerContainer.append(statusText, pagerWrapper);

    function setTab(tab) {
      activeTab = tab;
      resultTab.classList.toggle('active', activeTab === 'results');
      upcomingTab.classList.toggle('active', activeTab === 'upcoming');
      renderMatch();
      api.storage.local.set({ widgetSportsActiveTab: tab }).catch(err => {
        console.warn('Failed to save sports active tab:', err);
      });
    }

    resultTab.addEventListener('click', () => setTab('results'));
    upcomingTab.addEventListener('click', () => setTab('upcoming'));

    function renderMatch() {
      contentContainer.innerHTML = '';
      const list = activeTab === 'results' ? results : upcoming;
      const index = activeTab === 'results' ? resultsIndex : upcomingIndex;

      if (list.length === 0) {
        const emptyMsg = activeTab === 'results'
          ? (t(api, 'sportsNoMatches') || 'No recent results')
          : (t(api, 'sportsNoMatches') || 'No scheduled matches');
        contentContainer.appendChild(el('div', { class: 'widget-sports-empty', text: emptyMsg }));
        pageIndicator.textContent = '0/0';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        statusText.textContent = '';
        return;
      }

      const match = list[index];
      const [teamA, teamB] = getCompetitors(match);
      const isUpcoming = match.status?.type?.state === 'pre';
      const scoreText = isUpcoming ? formatMatchTime(match) : `${teamA.score} - ${teamB.score}`;
      const dateText = isUpcoming ? formatMatchDate(match) : '';
      const scoreClass = isUpcoming ? 'widget-sports-kickoff' : 'widget-sports-score';

      contentContainer.appendChild(el('div', { class: 'widget-sports-featured-match' }, [
        el('div', { class: 'widget-sports-featured-team' }, [
          getTeamLogo(teamA),
          el('span', {
            class: 'widget-sports-team-name',
            text: teamA.team.abbreviation || teamA.team.shortDisplayName || teamA.team.displayName
          })
        ]),
        el('div', { class: 'widget-sports-featured-center' }, [
          el('span', { class: scoreClass, text: scoreText || 'VS' }),
          dateText ? el('span', { class: 'widget-sports-date', text: dateText }) : null
        ]),
        el('div', { class: 'widget-sports-featured-team' }, [
          getTeamLogo(teamB),
          el('span', {
            class: 'widget-sports-team-name',
            text: teamB.team.abbreviation || teamB.team.shortDisplayName || teamB.team.displayName
          })
        ])
      ]));

      statusText.textContent = getMatchStatus(match);
      pageIndicator.textContent = `${index + 1}/${list.length}`;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === list.length - 1;
    }

    prevBtn.addEventListener('click', () => {
      if (activeTab === 'results' && resultsIndex > 0) {
        resultsIndex--;
        renderMatch();
      } else if (activeTab === 'upcoming' && upcomingIndex > 0) {
        upcomingIndex--;
        renderMatch();
      }
    });

    nextBtn.addEventListener('click', () => {
          if (activeTab === 'results' && resultsIndex < results.length - 1) {
        resultsIndex++;
        renderMatch();
      } else if (activeTab === 'upcoming' && upcomingIndex < upcoming.length - 1) {
        upcomingIndex++;
        renderMatch();
      }
    });

    container.append(tabsWrapper, contentContainer, footerContainer);
    renderMatch();
  } catch (e) {
    console.error('Sports widget error:', e);
    contentContainer.appendChild(el('div', { class: 'widget-sports-empty', text: 'Error loading scores' }));
    container.append(contentContainer);
  }
}

async function renderNotesWidget(container, config, api, settings, style) {
  const isEs = settings.language === 'es';
  const savedStr = isEs ? 'Guardado' : 'Saved';
  const savingStr = isEs ? 'Guardando...' : 'Saving...';
  const placeholderStr = isEs ? 'Escribe tus notas aquí...' : 'Type your notes here...';

  const saveStatusEl = el('span', { class: 'widget-save-status', text: savedStr });
  
  const header = el('div', { class: 'widget-header' }, [
    el('div', { class: 'widget-title-container' }, [
      el('h4', { class: 'widget-title', text: t(api, 'notesWidget') || 'Quick Notes' })
    ]),
    saveStatusEl
  ]);

  const storageKey = 'widgetNotes';
  const data = await api.storage.local.get(storageKey);
  const initialText = data[storageKey] || '';

  const textarea = el('textarea', {
    class: 'widget-notes-textarea',
    placeholder: placeholderStr,
    text: initialText
  });

  let debounceTimer;
  textarea.addEventListener('input', () => {
    saveStatusEl.textContent = savingStr;
    saveStatusEl.classList.add('saving');
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      await api.storage.local.set({ [storageKey]: textarea.value });
      saveStatusEl.textContent = savedStr;
      saveStatusEl.classList.remove('saving');
    }, 800);
  });

  container.append(header, textarea);
}

// 5. Checklist Widget
async function renderChecklistWidget(container, config, api, settings, style) {
  const isEs = settings.language === 'es';
  const placeholderStr = isEs ? 'Añadir nueva tarea...' : 'Add new task...';
  const emptyStr = isEs ? '¡No hay tareas pendientes!' : 'No pending tasks!';

  const titleStr = t(api, 'checklistWidget') || 'Checklist';
  const header = el('div', { class: 'widget-header widget-checklist-header' });
  const titleContainer = el('div', { class: 'widget-title-container widget-checklist-title-container' });
  const titleEl = el('h4', { class: 'widget-title widget-checklist-title', text: titleStr });
  const addBtn = el('button', {
    type: 'button',
    class: 'widget-checklist-add-btn',
    title: placeholderStr,
    'aria-label': placeholderStr,
    text: '+'
  });
  const inputForm = el('form', { class: 'widget-checklist-form is-inline', hidden: true });
  const inputEl = el('input', {
    type: 'text',
    class: 'widget-checklist-input',
    placeholder: placeholderStr,
    required: true
  });
  inputForm.appendChild(inputEl);
  titleContainer.append(titleEl, inputForm);
  header.append(titleContainer, addBtn);

  const storageKey = 'widgetChecklist';
  const data = await api.storage.local.get(storageKey);
  let items = data[storageKey] || [];

  const listContainer = el('div', { class: 'widget-checklist-list' });

  async function saveItems() {
    await api.storage.local.set({ [storageKey]: items });
  }

  function openAddTask() {
    titleEl.hidden = true;
    addBtn.hidden = true;
    inputForm.hidden = false;
    inputEl.focus();
  }

  function closeAddTask() {
    inputEl.value = '';
    inputForm.hidden = true;
    titleEl.hidden = false;
    addBtn.hidden = false;
  }

  function renderList() {
    listContainer.innerHTML = '';
    if (items.length === 0) {
      listContainer.appendChild(el('p', { class: 'widget-checklist-empty', text: emptyStr }));
      return;
    }

    items.forEach((item, index) => {
      const itemRow = el('div', { class: `widget-checklist-item ${item.checked ? 'checked' : ''}` });
      const label = el('label', { class: 'widget-checklist-label' });
      const checkbox = el('input', { type: 'checkbox', checked: item.checked });
      
      checkbox.addEventListener('change', async () => {
        items[index].checked = checkbox.checked;
        itemRow.classList.toggle('checked', checkbox.checked);
        await saveItems();
      });

      label.append(checkbox, el('span', { text: item.text }));

      const delBtn = el('button', {
        type: 'button',
        class: 'widget-checklist-delete',
        text: '×',
        title: 'Delete'
      });

      delBtn.addEventListener('click', async () => {
        items.splice(index, 1);
        await saveItems();
        renderList();
      });

      itemRow.append(label, delBtn);
      listContainer.appendChild(itemRow);
    });
  }

  inputForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = inputEl.value.trim();
    if (!val) {
      closeAddTask();
      return;
    }

    items.push({ text: val, checked: false });
    await saveItems();
    renderList();
    closeAddTask();
  });

  addBtn.addEventListener('click', openAddTask);

  inputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeAddTask();
    }
  });

  inputEl.addEventListener('blur', () => {
    if (!inputEl.value.trim()) {
      closeAddTask();
    }
  });

  renderList();
  container.append(header, listContainer);
}
