// TadkaTales - Clean Bilingual UI & Controller

let currentLang = localStorage.getItem('tadka_lang') || 'en';
let allRecipes = window.INITIAL_RECIPES || [];
let activeCategory = 'All';
let vegOnly = false;

// Concise, Professional Dictionary
const i18n = {
  en: {
    nav_studio: "Add Recipe",
    hero_title: "Recipes Made Simple & Flavorful.",
    hero_subtitle: "Authentic recipes with step-by-step instructions in English & हिन्दी.",
    search_placeholder: "Search by recipe or ingredient...",
    cat_all: "All",
    cat_main: "Latest Recipe",
    cat_snacks: "Snacks",
    cat_breakfast: "Breakfast",
    cat_desserts: "Desserts",
    filter_veg: "Vegetarian",
    section_recipes: "Latest Recipes",
    no_results_title: "No recipes found",
    no_results_desc: "Try searching with another keyword or explore categories.",
    back_home: "Back",
    btn_print: "Print",
    heading_ingredients: "Ingredients",
    tap_check: "(Tap to check)",
    heading_instructions: "Instructions",
    heading_tips: "Chef's Notes",
    heading_tags: "Tags & Categories",
    stat_prep: "Prep",
    stat_cook: "Cook",
    stat_servings: "Servings",
    stat_difficulty: "Difficulty",
    watch_youtube: "Watch Video",
    share_link: "Share",
    view_recipe: "View Recipe"
  },
  hi: {
    nav_studio: "+ नई रेसिपी",
    hero_title: "स्वादिष्ट और प्रामाणिक रेसिपीज़।",
    hero_subtitle: "हर रसोई के लिए आसान और सटीक विधि हिंदी और English में।",
    search_placeholder: "रेसिपी या सामग्री खोजें...",
    cat_all: "सभी",
    cat_main: "ताज़ा रेसिपीज़",
    cat_snacks: "स्नैक्स",
    cat_breakfast: "नाश्ता",
    cat_desserts: "मिठाई",
    filter_veg: "शाकाहारी",
    section_recipes: "ताज़ा रेसिपीज़",
    no_results_title: "कोई रेसिपी नहीं मिली",
    no_results_desc: "दूसरा शब्द खोजें या श्रेणियां देखें।",
    back_home: "वापस",
    btn_print: "प्रिंट",
    heading_ingredients: "सामग्री",
    tap_check: "(टिक करें)",
    heading_instructions: "बनाने की विधि",
    heading_tips: "शेफ के टिप्स",
    heading_tags: "टैग्स व श्रेणियां",
    stat_prep: "तैयारी",
    stat_cook: "पकाना",
    stat_servings: "सर्विंग्स",
    stat_difficulty: "कठिनाई",
    watch_youtube: "वीडियो देखें",
    share_link: "शेयर",
    view_recipe: "रेसिपी देखें"
  }
};

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('tadka_lang', lang);
  updateLanguageUI();
}

function updateLanguageUI() {
  // Update Navbar Toggle Buttons
  const btnEn = document.getElementById('lang-btn-en');
  const btnHi = document.getElementById('lang-btn-hi');
  if (btnEn && btnHi) {
    if (currentLang === 'hi') {
      btnHi.className = 'px-3 py-1.5 rounded-md lang-active font-hindi transition-all';
      btnEn.className = 'px-3 py-1.5 rounded-md lang-inactive transition-all';
    } else {
      btnEn.className = 'px-3 py-1.5 rounded-md lang-active transition-all';
      btnHi.className = 'px-3 py-1.5 rounded-md lang-inactive font-hindi transition-all';
    }
  }

  // Update Search input placeholder
  const searchInput = document.getElementById('search-input');
  if (searchInput && i18n[currentLang].search_placeholder) {
    searchInput.placeholder = i18n[currentLang].search_placeholder;
  }

  // Update Dictionary texts (data-i18n)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[currentLang] && i18n[currentLang][key]) {
      el.textContent = i18n[currentLang][key];
    }
  });

  // Update dynamic recipe page texts (.lang-text)
  document.querySelectorAll('.lang-text').forEach(el => {
    const text = el.getAttribute(`data-${currentLang}`) || el.getAttribute('data-en');
    if (text) el.textContent = text;
  });

  // Update subtitle texts (.lang-sub)
  document.querySelectorAll('.lang-sub').forEach(el => {
    const subText = el.getAttribute(`data-${currentLang}`) || el.getAttribute('data-hi');
    if (subText) el.textContent = subText;
  });

  // Toggle Recipe Lists (Ingredients & Steps)
  const enBlocks = document.querySelectorAll('.lang-block-en');
  const hiBlocks = document.querySelectorAll('.lang-block-hi');
  if (currentLang === 'hi') {
    enBlocks.forEach(b => b.classList.add('hidden'));
    hiBlocks.forEach(b => b.classList.remove('hidden'));
  } else {
    hiBlocks.forEach(b => b.classList.add('hidden'));
    enBlocks.forEach(b => b.classList.remove('hidden'));
  }

  // Re-render recipe cards if on homepage
  if (document.getElementById('recipes-grid')) {
    renderRecipes();
  }
}

// Homepage Functions
async function loadRecipes() {
  try {
    const res = await fetch('/api/recipes');
    allRecipes = await res.json();
    renderRecipes();
  } catch (err) {
    console.error("Failed to load recipes:", err);
  }
}

function renderRecipes() {
  const grid = document.getElementById('recipes-grid');
  const emptyMsg = document.getElementById('no-recipes-msg');
  const countBadge = document.getElementById('recipe-count');
  if (!grid) return;

  const searchQuery = (document.getElementById('search-input')?.value || '').toLowerCase().trim();

  const filtered = allRecipes.filter(r => {
    const matchCat = (activeCategory === 'All') || 
      (r.category === activeCategory) || 
      (activeCategory === 'Latest Recipe' && (r.category === 'Latest Recipe' || r.category === 'Main Course'));
    const matchVeg = !vegOnly || (r.diet === 'Veg');
    const matchSearch = !searchQuery || 
      (r.title_en || '').toLowerCase().includes(searchQuery) ||
      (r.title_hi || '').toLowerCase().includes(searchQuery) ||
      (r.description_en || '').toLowerCase().includes(searchQuery) ||
      (r.description_hi || '').toLowerCase().includes(searchQuery) ||
      (r.ingredients_en || []).some(i => i.toLowerCase().includes(searchQuery)) ||
      (r.ingredients_hi || []).some(i => i.toLowerCase().includes(searchQuery)) ||
      (r.tags || []).some(t => t.toLowerCase().includes(searchQuery));

    return matchCat && matchVeg && matchSearch;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} ${currentLang === 'hi' ? 'रेसिपीज़' : 'recipes'}`;
  }

  if (filtered.length === 0) {
    if (searchQuery || activeCategory !== 'All' || vegOnly) {
      grid.innerHTML = '';
      emptyMsg.classList.remove('hidden');
    }
    return;
  }

  emptyMsg.classList.add('hidden');
  grid.innerHTML = filtered.map(r => {
    const isHindi = currentLang === 'hi';
    const titleEn = r.title_en || (typeof r.title === 'object' ? r.title?.en : r.title) || r.id || 'Recipe';
    const titleHi = r.title_hi || (typeof r.title === 'object' ? r.title?.hi : '') || titleEn;
    const mainTitle = (isHindi ? (titleHi || titleEn) : (titleEn || titleHi)) || 'Recipe';
    const subTitle = (isHindi ? titleEn : titleHi) || '';
    
    const descEn = r.description_en || (typeof r.description === 'object' ? r.description?.en : r.description) || '';
    const descHi = r.description_hi || (typeof r.description === 'object' ? r.description?.hi : '') || descEn;
    const desc = (isHindi ? (descHi || descEn) : (descEn || descHi)) || 'Authentic traditional recipe.';
    
    const cookTime = isHindi 
      ? (r.cook_time_hi || r.cook_time_en || r.cookTime || '15 मिनट') 
      : (r.cook_time_en || r.cook_time_hi || r.cookTime || '15 mins');
      
    const servings = isHindi
      ? (r.servings_hi || r.servings_en || r.servings || '4 सर्विंग्स')
      : (r.servings_en || r.servings_hi || r.servings || '4 servings');

    const category = (r.category === 'Main Course' ? 'Latest Recipe' : r.category) || 'Latest Recipe';
    const isVeg = r.diet === 'Veg' || r.isVegetarian === true;
    
    const yId = r.youtube_id || r.youtubeId || '';
    const imgUrl = r.image_url || (yId ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600&auto=format&fit=crop');

    const tags = Array.isArray(r.tags) ? r.tags.slice(0, 3) : [];
    const tagsHtml = tags.length > 0
      ? `<div class="flex flex-wrap gap-1.5 mb-3">
          ${tags.map(t => `<span class="inline-flex items-center text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md transition-colors">#${t}</span>`).join('')}
        </div>`
      : '';

    return `
      <article class="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col">
        
        <!-- Thumbnail -->
        <a href="/recipe/${r.id}" class="block relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img src="${imgUrl}" alt="${mainTitle}" class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600&auto=format&fit=crop'">
          
          <!-- Badges -->
          <div class="absolute top-2.5 left-2.5">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/95 backdrop-blur-sm shadow-xs ${isVeg ? 'text-emerald-700' : 'text-slate-700'}">
              <span class="w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-red-500'}"></span>
              ${isVeg ? (isHindi ? 'वेज' : 'Veg') : (isHindi ? 'नॉन-वेज' : 'Non-Veg')}
            </span>
          </div>

          <div class="absolute bottom-2.5 right-2.5">
            <span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/60 backdrop-blur-sm text-white">
              ${cookTime}
            </span>
          </div>
        </a>

        <!-- Body -->
        <div class="p-4 sm:p-5 flex flex-col flex-grow">
          
          <div class="text-[11px] font-bold text-brand-600 uppercase tracking-wider mb-1">
            ${category}
          </div>

          <h3 class="text-base sm:text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors mb-1 leading-snug ${isHindi ? 'font-hindi' : ''}">
            <a href="/recipe/${r.id}">
              ${mainTitle}
            </a>
          </h3>

          <p class="text-xs text-slate-400 font-medium mb-2.5 line-clamp-1 font-hindi">
            ${subTitle || ''}
          </p>

          <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3 flex-grow">
            ${desc}
          </p>

          ${tagsHtml}

          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium mt-auto">
            <span>${servings}</span>
            <a href="/recipe/${r.id}" class="text-brand-600 font-semibold hover:underline inline-flex items-center gap-1">
              <span>${isHindi ? 'विधि पढ़ें' : 'View'}</span> &rarr;
            </a>
          </div>

        </div>

      </article>
    `;
  }).join('');
}

function filterCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.classList.remove('active');
  });
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  renderRecipes();
}

function toggleVegOnly() {
  const chk = document.getElementById('veg-toggle');
  vegOnly = chk ? chk.checked : false;
  renderRecipes();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  updateLanguageUI();
  if (document.getElementById('recipes-grid')) {
    // Check if URL has a search or tag query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('search') || urlParams.get('tag');
    const searchInput = document.getElementById('search-input');
    if (query && searchInput) {
      searchInput.value = query;
    }
    loadRecipes();
    searchInput?.addEventListener('input', renderRecipes);
  }
});
