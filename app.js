/**
 * Smart City Tumakuru - Citizen Amenities Portal
 * Multi-Page Interactive Application Controller with Interactive Maps
 * Page 1: Only Areas Showcase (Cards Grid / Tumakuru City Map)
 * Page 2: Separate Next Page showing Facilities of Selected Area (Cards / Interactive Map)
 */

// Bulletproof Storage Helper (Handles local file:// DOMException / SecurityError)
const SafeStorage = {
    _memory: {},
    getItem(key) {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                return window.localStorage.getItem(key);
            }
        } catch (e) {}
        try {
            if (typeof window !== "undefined" && window.sessionStorage) {
                return window.sessionStorage.getItem(key);
            }
        } catch (e) {}
        return this._memory[key] || null;
    },
    setItem(key, value) {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.setItem(key, value);
                return;
            }
        } catch (e) {}
        try {
            if (typeof window !== "undefined" && window.sessionStorage) {
                window.sessionStorage.setItem(key, value);
                return;
            }
        } catch (e) {}
        this._memory[key] = String(value);
    },
    removeItem(key) {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.removeItem(key);
            }
        } catch (e) {}
        try {
            if (typeof window !== "undefined" && window.sessionStorage) {
                window.sessionStorage.removeItem(key);
            }
        } catch (e) {}
        delete this._memory[key];
    }
};

class SmartCityApp {
    constructor() {
        // Expose globally for any inline onclick handlers
        window.app = this;

        // App State
        this.currentUser = null;
        this.currentPage = "login"; // "login" | "areas" | "facilities" | "map"
        this.selectedAreaId = "sira-gate";
        this.currentSpotlightIndex = 0;
        this.selectedCategory = "all";
        this.searchQuery = "";
        this.onlyOpenFilter = false;

        // View Mode States
        this.areasViewMode = "cards"; // "cards" (map opens as separate page now)
        this.facilitiesViewMode = "cards"; // "cards" (map opens as separate page now)

        // Map Page State
        this.mapPageFromPage = "areas"; // which page launched the map
        this.mapPageAreaFilter = "all"; // "all" or specific area id
        this.mapPageCategoryFilter = "all"; // "all" or specific category id
        this.mapPageDisplayMode = "sites"; // "sites" (shows ONLY sites with green, red, orange dots) | "facilities"
        this.mapOnlyEmptySites = false; // When true, filters map to highlight ONLY Available (empty/vacant) sites
        this.dedicatedMap = null;
        this.dedicatedMapMarkers = [];

        // Leaflet Map Instances & Marker Registries
        this.cityMap = null;
        this.facilitiesMap = null;
        this.cityMapMarkers = [];
        this.facilitiesMapMarkers = [];

        // Multi-Page Containers
        this.pages = {
            login: document.getElementById("login-view"),
            areas: document.getElementById("page-areas"),
            facilities: document.getElementById("page-facilities"),
            map: document.getElementById("page-map"),
            layouts: document.getElementById("page-layouts"),
            booking: document.getElementById("page-site-booking")
        };

        // Layouts & Sites State
        this.selectedLayoutId = null;
        this.selectedSiteId = null;
        this.layoutMap = null;
        this.layoutMapMarkers = [];
        this.bookingSiteMap = null;

        // Login Form Elements
        this.loginForm = document.getElementById("login-form");
        this.usernameInput = document.getElementById("username");
        this.passwordInput = document.getElementById("password");
        this.rememberMeCheckbox = document.getElementById("remember-me");
        this.togglePasswordBtn = document.getElementById("toggle-password");
        this.logoutBtn = document.getElementById("logout-btn");
        this.logoutBtn2 = document.getElementById("logout-btn-2");
        this.displayUserName = document.getElementById("display-user-name");
        this.displayUserRole = document.getElementById("display-user-role");

        // Page 1: Areas Elements
        this.areasGrid = document.getElementById("areas-grid");
        this.spotlightStepBadge = document.getElementById("spotlight-step-badge");
        this.spotlightPincode = document.getElementById("spotlight-pincode");
        this.spotlightTitle = document.getElementById("spotlight-title");
        this.spotlightKannada = document.getElementById("spotlight-kannada");
        this.spotlightDesc = document.getElementById("spotlight-desc");
        this.spotlightDots = document.getElementById("spotlight-dots");
        this.spotlightPrevBtn = document.getElementById("spotlight-prev-btn");
        this.spotlightNextBtn = document.getElementById("spotlight-next-btn");
        this.spotlightActionBtn = document.getElementById("spotlight-action-btn");
        this.spotlightLayoutsBtn = document.getElementById("spotlight-layouts-btn");
        this.spotlightLayoutsText = document.getElementById("spotlight-layouts-text");
        this.totalFacilitiesCount = document.getElementById("total-facilities-count");

        // Page 1: Map Elements
        this.btnAreasCardsView = document.getElementById("btn-areas-cards-view");
        this.btnAreasMapView = document.getElementById("btn-areas-map-view");
        this.cityOverviewMapWrapper = document.getElementById("city-overview-map-wrapper");
        this.cityMapContainer = document.getElementById("city-map-container");

        // Page 2: Facilities Elements
        this.navBackToAreasBtn = document.getElementById("nav-back-to-areas-btn");
        this.breadcrumbBackBtn = document.getElementById("breadcrumb-back-btn");
        this.bottomReturnBtn = document.getElementById("bottom-return-btn");
        this.breadcrumbCurrentArea = document.getElementById("breadcrumb-current-area");
        this.navFacilityAreaName = document.getElementById("nav-facility-area-name");
        this.navFacilityAreaKannada = document.getElementById("nav-facility-area-kannada");

        this.currentAreaTitle = document.getElementById("current-area-title");
        this.currentAreaKannada = document.getElementById("current-area-kannada");
        this.currentAreaDesc = document.getElementById("current-area-desc");
        this.currentAreaPincode = document.getElementById("current-area-pincode");

        this.areaSwitcherPills = document.getElementById("area-switcher-pills");
        this.categoryTabs = document.getElementById("category-tabs");
        this.facilitiesGrid = document.getElementById("facilities-grid");
        this.facilitiesResultsCount = document.getElementById("facilities-results-count");
        this.emptyStateCard = document.getElementById("empty-state-card");

        this.globalSearchInput = document.getElementById("global-search-input");
        this.clearSearchBtn = document.getElementById("clear-search-btn");
        this.toggle24x7Filter = document.getElementById("toggle-24x7-filter");
        this.resetFiltersBtn = document.getElementById("reset-filters-btn");

        // Page 2: Map Elements
        this.btnFacilitiesCardsView = document.getElementById("btn-facilities-cards-view");
        this.btnFacilitiesMapView = document.getElementById("btn-facilities-map-view");
        this.facilitiesMapWrapper = document.getElementById("facilities-map-wrapper");
        this.facilitiesMapContainer = document.getElementById("facilities-map-container");
        this.mapAreaNameLabel = document.getElementById("map-area-name-label");
        this.btnRecenterFacilitiesMap = document.getElementById("btn-recenter-facilities-map");

        // Modal Elements
        this.facilityModal = document.getElementById("facility-modal-backdrop");
        this.modalBodyContent = document.getElementById("modal-body-content");
        this.modalCloseBtn = document.getElementById("modal-close-btn");

        // Initialize application
        this.init();
    }

    init() {
        this.setupAuthListeners();
        this.setupNavigationListeners();
        this.setupPage2FilterListeners();
        this.setupMapListeners();
        this.setupMapPageListeners();
        this.setupLayoutsAndBookingListeners();
        this.updateTotalMetrics();

        // Check if user has an existing saved session
        this.checkExistingSession();

        // If not logged in, show login page
        if (!this.currentUser) {
            this.showPage("login");
        }
    }

    /* ======================================================================
       PAGE ROUTER & MULTI-PAGE SWITCHING
       ====================================================================== */
    showPage(pageName) {
        this.currentPage = pageName;

        Object.keys(this.pages).forEach(key => {
            const pageEl = this.pages[key];
            if (!pageEl) return;

            if (key === pageName) {
                pageEl.classList.add("active-page");
                pageEl.style.display = "flex";
            } else {
                pageEl.classList.remove("active-page");
                pageEl.style.display = "none";
            }
        });

        // Invalidate map size if navigating to a page with maps
        setTimeout(() => {
            if (pageName === "areas" && this.cityMap && this.areasViewMode === "map") {
                this.cityMap.invalidateSize();
            } else if (pageName === "facilities" && this.facilitiesMap && this.facilitiesViewMode === "map") {
                this.facilitiesMap.invalidateSize();
            } else if (pageName === "map" && this.dedicatedMap) {
                this.dedicatedMap.invalidateSize();
            }
        }, 200);

        // Always scroll to the top of the newly displayed page
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    showAreasPage() {
        this.showPage("areas");
        this.renderAreaCards();
        this.renderSpotlight(this.currentSpotlightIndex);
    }

    /* Navigates from Page 1 (Areas) to Page 2 (Facilities) for a selected area */
    navigateToArea(areaId) {
        if (!window.SMART_CITY_DATA) return;
        const areaIndex = SMART_CITY_DATA.areas.findIndex(a => a.id === areaId);
        if (areaIndex === -1) return;
        const area = SMART_CITY_DATA.areas[areaIndex];

        this.selectedAreaId = areaId;
        this.currentSpotlightIndex = areaIndex;

        // Update Page 2 Header & Breadcrumb
        if (this.navFacilityAreaName) this.navFacilityAreaName.textContent = area.name;
        if (this.navFacilityAreaKannada) this.navFacilityAreaKannada.textContent = area.kannadaName;
        if (this.breadcrumbCurrentArea) this.breadcrumbCurrentArea.textContent = area.name;
        if (this.mapAreaNameLabel) this.mapAreaNameLabel.textContent = `Interactive Map of ${area.name} Facilities`;

        // Update Page 2 Context Banner
        if (this.currentAreaTitle) this.currentAreaTitle.textContent = `${area.name} - Public Facilities`;
        if (this.currentAreaKannada) this.currentAreaKannada.textContent = `${area.kannadaName} ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯಗಳು`;
        if (this.currentAreaDesc) this.currentAreaDesc.textContent = `${area.tagline} — ${area.shortDesc}`;
        if (this.currentAreaPincode) this.currentAreaPincode.textContent = `PIN: ${area.pincode}`;

        // Render Page 2 elements
        this.renderAreaSwitcherPills();
        this.renderCategoryTabs();
        this.renderFacilities();

        // Switch to Page 2
        this.showPage("facilities");
        this.showToast(`Opened ${area.name} facilities on Page 2`, "info");
    }

    /* ======================================================================
       INTERACTIVE MAP CONTROLLERS (LEAFLET & OPENSTREETMAP)
       ====================================================================== */
    setupMapListeners() {
        // Page 1 "Open Full Map Page" button -> opens #page-map (from areas context)
        if (this.btnAreasMapView) {
            this.btnAreasMapView.addEventListener("click", () => this.openMapPage("areas"));
        }

        // Page 2 "Open Full Map Page" button -> opens #page-map (from facilities context)
        if (this.btnFacilitiesMapView) {
            this.btnFacilitiesMapView.addEventListener("click", () => this.openMapPage("facilities"));
        }

        // Page 2 Recenter Map Button (kept for inline map if still used)
        if (this.btnRecenterFacilitiesMap) {
            this.btnRecenterFacilitiesMap.addEventListener("click", () => {
                const area = SMART_CITY_DATA.areas.find(a => a.id === this.selectedAreaId);
                if (area && this.facilitiesMap) {
                    this.facilitiesMap.setView([area.lat, area.lng], 15, { animate: true });
                }
            });
        }
    }

    setAreasViewMode(mode) {
        this.areasViewMode = mode;
        if (mode === "cards") {
            if (this.btnAreasCardsView) this.btnAreasCardsView.classList.add("active");
            if (this.btnAreasMapView) this.btnAreasMapView.classList.remove("active");
            if (this.areasGrid) this.areasGrid.classList.remove("hidden");
            if (this.cityOverviewMapWrapper) this.cityOverviewMapWrapper.classList.add("hidden");
        } else {
            if (this.btnAreasCardsView) this.btnAreasCardsView.classList.remove("active");
            if (this.btnAreasMapView) this.btnAreasMapView.classList.add("active");
            if (this.areasGrid) this.areasGrid.classList.add("hidden");
            if (this.cityOverviewMapWrapper) this.cityOverviewMapWrapper.classList.remove("hidden");

            // Initialize or invalidate city map
            setTimeout(() => {
                if (!this.cityMap) {
                    this.initCityMap();
                } else {
                    this.cityMap.invalidateSize();
                }
            }, 100);
        }
    }

    setFacilitiesViewMode(mode) {
        this.facilitiesViewMode = mode;
        if (mode === "cards") {
            if (this.btnFacilitiesCardsView) this.btnFacilitiesCardsView.classList.add("active");
            if (this.btnFacilitiesMapView) this.btnFacilitiesMapView.classList.remove("active");
            if (this.facilitiesGrid) this.facilitiesGrid.classList.remove("hidden");
            if (this.facilitiesMapWrapper) this.facilitiesMapWrapper.classList.add("hidden");
        } else {
            if (this.btnFacilitiesCardsView) this.btnFacilitiesCardsView.classList.remove("active");
            if (this.btnFacilitiesMapView) this.btnFacilitiesMapView.classList.add("active");
            if (this.facilitiesGrid) this.facilitiesGrid.classList.add("hidden");
            if (this.facilitiesMapWrapper) this.facilitiesMapWrapper.classList.remove("hidden");

            // Initialize or render facilities map
            setTimeout(() => {
                if (!this.facilitiesMap) {
                    this.initFacilitiesMap();
                } else {
                    this.facilitiesMap.invalidateSize();
                    const area = SMART_CITY_DATA.areas.find(a => a.id === this.selectedAreaId);
                    if (area) {
                        this.facilitiesMap.setView([area.lat, area.lng], 15);
                    }
                }
            }, 100);
        }
    }

    /* Page 1: City Overview Map */
    initCityMap() {
        if (typeof L === "undefined" || !this.cityMapContainer) return;

        try {
            // Tumakuru Center Coordinates
            const center = [13.345, 77.102];
            this.cityMap = L.map("city-map-container", {
                zoomControl: true,
                attributionControl: true
            }).setView(center, 13);

            // OpenStreetMap Tile Layer
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Smart City Tumakuru',
                maxZoom: 18
            }).addTo(this.cityMap);

            // Add markers for all 5 areas on Tumakuru map
            SMART_CITY_DATA.areas.forEach(area => {
                const areaIcon = L.divIcon({
                    className: "custom-area-pin-wrapper",
                    html: `
                        <div class="custom-area-pin">
                            <i class="fa-solid fa-location-dot"></i>
                            <span>${area.name}</span>
                        </div>
                    `,
                    iconSize: [120, 36],
                    iconAnchor: [60, 18]
                });

                const popupHtml = `
                    <div class="map-popup-card">
                        <div class="popup-header">
                            <div class="popup-icon" style="background: var(--primary);">
                                <i class="fa-solid fa-city"></i>
                            </div>
                            <div>
                                <h4 class="popup-title">${area.name}</h4>
                                <div class="popup-kannada">${area.kannadaName}</div>
                            </div>
                        </div>
                        <div class="popup-info-row">
                            <i class="fa-solid fa-map-pin"></i>
                            <span>PIN Code: ${area.pincode} &bull; ${area.badge}</span>
                        </div>
                        <div class="popup-info-row">
                            <i class="fa-solid fa-layer-group"></i>
                            <span>${area.facilities.length} Public Amenities (Schools, Hospitals, Police, Banks, etc.)</span>
                        </div>
                        <div class="popup-actions" style="margin-top: 8px;">
                            <button type="button" class="btn-popup-action" style="background: var(--primary); color: #fff;" onclick="window.app.navigateToArea('${area.id}')">
                                Open Facilities on Page 2 &rarr;
                            </button>
                        </div>
                    </div>
                `;

                const marker = L.marker([area.lat, area.lng], { icon: areaIcon }).addTo(this.cityMap);
                marker.bindPopup(popupHtml);
                this.cityMapMarkers.push(marker);
            });

            setTimeout(() => {
                if (this.cityMap) this.cityMap.invalidateSize();
            }, 250);
        } catch (e) {
            console.error("Leaflet map initialization error:", e);
        }
    }

    /* Page 2: Facilities Interactive Map */
    initFacilitiesMap() {
        if (typeof L === "undefined" || !this.facilitiesMapContainer) return;

        try {
            const area = SMART_CITY_DATA.areas.find(a => a.id === this.selectedAreaId) || SMART_CITY_DATA.areas[0];
            this.facilitiesMap = L.map("facilities-map-container", {
                zoomControl: true,
                attributionControl: true
            }).setView([area.lat, area.lng], 15);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Smart City Tumakuru',
                maxZoom: 19
            }).addTo(this.facilitiesMap);

            // Render facilities markers
            this.updateFacilitiesMapMarkers();

            setTimeout(() => {
                if (this.facilitiesMap) this.facilitiesMap.invalidateSize();
            }, 250);
        } catch (e) {
            console.error("Facilities map initialization error:", e);
        }
    }

    updateFacilitiesMapMarkers(filteredFacilities = null) {
        if (!this.facilitiesMap || typeof L === "undefined") return;

        // Clear existing markers
        this.facilitiesMapMarkers.forEach(m => this.facilitiesMap.removeLayer(m));
        this.facilitiesMapMarkers = [];

        const area = SMART_CITY_DATA.areas.find(a => a.id === this.selectedAreaId);
        if (!area) return;

        const facilities = filteredFacilities || area.facilities;

        facilities.forEach(facility => {
            if (!facility.lat || !facility.lng) return;

            const catObj = SMART_CITY_DATA.categories.find(c => c.id === facility.category) || {
                icon: "fa-building",
                color: "#0284c7",
                label: "Facility"
            };

            const pinIcon = L.divIcon({
                className: "custom-map-pin-wrapper",
                html: `
                    <div class="custom-map-pin" style="background: ${catObj.color};">
                        <i class="fa-solid ${catObj.icon}"></i>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36]
            });

            const popupHtml = `
                <div class="map-popup-card">
                    <div class="popup-header">
                        <div class="popup-icon" style="background: ${catObj.color};">
                            <i class="fa-solid ${catObj.icon}"></i>
                        </div>
                        <div>
                            <span class="facility-type-badge" style="background: ${catObj.color}15; color: ${catObj.color}; font-size: 0.68rem;">
                                ${catObj.label.split("&")[0].trim()}
                            </span>
                            <h4 class="popup-title">${facility.name}</h4>
                            <div class="popup-kannada">${facility.kannadaName || ''}</div>
                        </div>
                    </div>
                    <div class="popup-info-row">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${facility.address}</span>
                    </div>
                    <div class="popup-info-row">
                        <i class="fa-regular fa-clock"></i>
                        <span>${facility.timing}</span>
                    </div>
                    <div class="popup-info-row">
                        <i class="fa-solid fa-phone"></i>
                        <span>${facility.phone}</span>
                    </div>
                    <div class="popup-actions">
                        <a href="tel:${facility.phone.replace(/[^0-9+]/g, '')}" class="btn-popup-action">
                            <i class="fa-solid fa-phone"></i> Call
                        </a>
                        <button type="button" class="btn-popup-action" style="background: var(--primary); color: #fff;" onclick="window.app.getDirections('${facility.name.replace(/'/g, "\\'")}', '${area.name}')">
                            <i class="fa-solid fa-diamond-turn-right"></i> Maps Route
                        </button>
                    </div>
                </div>
            `;

            const marker = L.marker([facility.lat, facility.lng], { icon: pinIcon }).addTo(this.facilitiesMap);
            marker.bindPopup(popupHtml);
            this.facilitiesMapMarkers.push(marker);
        });

        // Set map view to area center
        if (facilities.length > 0) {
            this.facilitiesMap.setView([area.lat, area.lng], 15);
        }
    }

    /* ======================================================================
       DEDICATED FULL MAP PAGE (PAGE 3)
       ====================================================================== */

    /**
     * Opens the separate dedicated map page (#page-map).
     * @param {string} fromPage - "areas" or "facilities" (used for back button destination)
     */
    openMapPage(fromPage) {
        this.mapPageFromPage = fromPage || "areas";

        // If launching from facilities, pre-select that area; otherwise show all
        if (fromPage === "facilities") {
            this.mapPageAreaFilter = this.selectedAreaId;
        } else {
            this.mapPageAreaFilter = "all";
        }
        this.mapPageCategoryFilter = "all";
        this.mapPageDisplayMode = "sites"; // Default to showing ONLY sites on the map

        // Update back-button label
        const backLabel = document.getElementById("map-page-back-label");
        if (backLabel) {
            backLabel.textContent = fromPage === "facilities"
                ? `\u2190 Back to ${SMART_CITY_DATA.areas.find(a => a.id === this.selectedAreaId)?.name || 'Facilities'}`
                : "\u2190 Back to Areas";
        }

        // Update subtitle
        const subtitle = document.getElementById("map-page-subtitle");
        if (subtitle) {
            const areaName = this.mapPageAreaFilter === "all"
                ? "All 5 Areas"
                : (SMART_CITY_DATA.areas.find(a => a.id === this.mapPageAreaFilter)?.name || "");
            subtitle.textContent = `${areaName} \u2022 Sites Map (Available, Booked & Reserved Dots)`;
        }

        // Build area filter pills
        this._renderMapAreaPills();

        // Build category filter pills
        this._renderMapCategoryPills();

        // Show page
        this.showPage("map");

        // Init or refresh dedicated map
        setTimeout(() => {
            if (!this.dedicatedMap) {
                this._initDedicatedMap();
            } else {
                this.dedicatedMap.invalidateSize();
                this._refreshDedicatedMapMarkers();
            }
        }, 150);
    }

    _renderMapAreaPills() {
        const container = document.getElementById("map-area-pills");
        if (!container || !window.SMART_CITY_DATA) return;
        container.innerHTML = "";

        // "All 5 Areas" pill
        const allBtn = document.createElement("button");
        allBtn.type = "button";
        allBtn.className = `btn-map-area-pill ${this.mapPageAreaFilter === "all" ? "active" : ""}`;
        allBtn.dataset.areaId = "all";
        allBtn.innerHTML = `<i class="fa-solid fa-globe"></i> All 5 Areas`;
        allBtn.addEventListener("click", () => {
            this.mapPageAreaFilter = "all";
            this._renderMapAreaPills();
            this._refreshDedicatedMapMarkers();
            this._updateMapPageSubtitle();
        });
        container.appendChild(allBtn);

        // Individual area pills
        SMART_CITY_DATA.areas.forEach(area => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `btn-map-area-pill ${this.mapPageAreaFilter === area.id ? "active" : ""}`;
            btn.dataset.areaId = area.id;
            btn.textContent = area.name;
            btn.addEventListener("click", () => {
                this.mapPageAreaFilter = area.id;
                this._renderMapAreaPills();
                this._refreshDedicatedMapMarkers();
                this._updateMapPageSubtitle();
            });
            container.appendChild(btn);
        });
    }

    _renderMapCategoryPills() {
        const container = document.getElementById("map-category-pills");
        if (!container || !window.SMART_CITY_DATA) return;
        container.innerHTML = "";

        SMART_CITY_DATA.categories.forEach(cat => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `btn-map-area-pill ${this.mapPageCategoryFilter === cat.id ? "active" : ""}`;
            btn.dataset.catId = cat.id;
            const label = cat.id === "all" ? "All" : cat.label.split("&")[0].trim();
            btn.innerHTML = `<i class="fa-solid ${cat.icon}"></i> ${label}`;
            if (this.mapPageCategoryFilter !== cat.id && cat.id !== "all") {
                btn.style.borderLeftColor = cat.color;
                btn.style.borderLeftWidth = "3px";
            }
            btn.addEventListener("click", () => {
                this.mapPageCategoryFilter = cat.id;
                this._renderMapCategoryPills();
                this._refreshDedicatedMapMarkers();
            });
            container.appendChild(btn);
        });
    }

    _updateMapPageSubtitle() {
        const subtitle = document.getElementById("map-page-subtitle");
        if (!subtitle) return;
        const areaName = this.mapPageAreaFilter === "all"
            ? "All 5 Areas"
            : (SMART_CITY_DATA.areas.find(a => a.id === this.mapPageAreaFilter)?.name || "");
        const catName = this.mapPageCategoryFilter === "all"
            ? "All Facilities"
            : (SMART_CITY_DATA.categories.find(c => c.id === this.mapPageCategoryFilter)?.label?.split("&")[0].trim() || "");
        subtitle.textContent = `${areaName} \u2022 ${catName}`;
    }

    _initDedicatedMap() {
        if (typeof L === "undefined") return;
        const container = document.getElementById("dedicated-full-map");
        if (!container) return;

        try {
            const center = [13.345, 77.102];
            this.dedicatedMap = L.map("dedicated-full-map", {
                zoomControl: true,
                attributionControl: true
            }).setView(center, 13);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Smart City Tumakuru',
                maxZoom: 19
            }).addTo(this.dedicatedMap);

            this._refreshDedicatedMapMarkers();

            setTimeout(() => {
                if (this.dedicatedMap) this.dedicatedMap.invalidateSize();
            }, 300);
        } catch (e) {
            console.error("Dedicated map init error:", e);
        }
    }

    _refreshDedicatedMapMarkers() {
        if (!this.dedicatedMap || typeof L === "undefined" || !window.SMART_CITY_DATA) return;

        // Clear old markers
        this.dedicatedMapMarkers.forEach(m => this.dedicatedMap.removeLayer(m));
        this.dedicatedMapMarkers = [];

        // Update layer mode button highlights
        const btnSites = document.getElementById("btn-map-mode-sites");
        const btnFacs = document.getElementById("btn-map-mode-facilities");
        if (btnSites && btnFacs) {
            if (this.mapPageDisplayMode === "sites") {
                btnSites.classList.add("active");
                btnSites.style.background = "linear-gradient(135deg, #059669, #047857)";
                btnSites.style.color = "#fff";
                btnFacs.classList.remove("active");
                btnFacs.style.background = "";
                btnFacs.style.color = "";
            } else {
                btnFacs.classList.add("active");
                btnFacs.style.background = "linear-gradient(135deg, #0284c7, #0369a1)";
                btnFacs.style.color = "#fff";
                btnSites.classList.remove("active");
                btnSites.style.background = "";
                btnSites.style.color = "";
            }
        }

        // ====================================================================
        // MODE 1: SHOW ONLY SITES IN THE MAP
        // Available sites: Green dot mark (#10b981)
        // Booked sites: Red dot mark (#ef4444)
        // Reserved sites: Orange dot mark (#f59e0b)
        // ====================================================================
        if (this.mapPageDisplayMode === "sites") {
            let sites = [];
            const layouts = window.SMART_CITY_LAYOUTS || [];
            const filteredLayouts = this.mapPageAreaFilter === "all"
                ? layouts
                : layouts.filter(l => l.areaId === this.mapPageAreaFilter);

            filteredLayouts.forEach(layout => {
                layout.sites.forEach(site => {
                    if (this.mapOnlyEmptySites && site.status !== "Available") {
                        return; // filter out non-empty sites when user wants to see only empty sites
                    }
                    sites.push({
                        ...site,
                        _layoutName: layout.layoutName,
                        _areaName: layout.areaName,
                        _areaId: layout.areaId
                    });
                });
            });

            // Update counter
            const counter = document.getElementById("map-facilities-counter");
            if (counter) {
                const avail = sites.filter(s => s.status === "Available").length;
                const bkd = sites.filter(s => s.status === "Booked").length;
                const rsv = sites.filter(s => s.status === "Reserved").length;
                if (this.mapOnlyEmptySites) {
                    counter.innerHTML = `<span style="color:#059669; font-weight:800;"><i class="fa-solid fa-circle-check"></i> Showing ${avail} Empty/Available Sites Marked in Green</span>`;
                } else {
                    counter.innerHTML = `<span style="color:#059669; font-weight:800;">● ${avail} Available</span> &bull; <span style="color:#dc2626; font-weight:800;">● ${bkd} Booked</span> &bull; <span style="color:#d97706; font-weight:800;">● ${rsv} Reserved</span>`;
                }
            }

            // Render sidebar list for sites
            this._renderMapSitesSidebarList(sites);

            // Plot circular dot marks for ONLY sites
            sites.forEach(site => {
                let pinColor = "#10b981"; // Green (Available)
                let dotClass = "dot-available";
                if (site.status === "Booked") {
                    pinColor = "#ef4444"; // Red (Booked)
                    dotClass = "dot-booked";
                } else if (site.status === "Reserved") {
                    pinColor = "#f59e0b"; // Orange (Reserved)
                    dotClass = "dot-reserved";
                }

                const siteIcon = L.divIcon({
                    className: "site-dot-marker-container",
                    html: `
                        <div class="site-dot-pin ${dotClass}" title="${site.siteNumber} (${site.status})">
                        </div>
                        <div class="site-dot-label-pill">
                            ${site.siteNumber.split(' ')[0]} • ${site.dimensionSqFt} sq.ft
                        </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                const popupHtml = `
                    <div class="map-popup-card" style="min-width: 270px;">
                        <div class="popup-header" style="align-items: center;">
                            <div class="popup-icon" style="background: ${pinColor}; width: 34px; height: 34px; border-radius: 50%;">
                                <span style="display: block; width: 14px; height: 14px; border-radius: 50%; background: #ffffff;"></span>
                            </div>
                            <div>
                                <h4 class="popup-title">${site.siteNumber}</h4>
                                <span style="font-size: 0.75rem; font-weight: 800; color: ${pinColor}; text-transform: uppercase;">
                                    ● ${site.status === 'Available' ? 'Empty / Available Site' : site.status + ' Site'}
                                </span>
                            </div>
                        </div>
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 700; margin-top: 4px;">
                            ${site._layoutName} &bull; ${site._areaName}
                        </div>
                        
                        <!-- 1 Square Foot Cost Detail Box -->
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px; margin: 8px 0; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.76rem; font-weight: 700; color: #166534;"><i class="fa-solid fa-tag"></i> 1 Sq.Ft Cost:</span>
                            <span style="font-size: 0.95rem; font-weight: 800; color: #15803d;">₹${site.costPerSqFt.toLocaleString('en-IN')} / Sq.Ft</span>
                        </div>

                        <!-- Physical Bounds & Blueprint Specifications -->
                        <div style="padding: 8px 0; font-size: 0.82rem; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; margin-bottom: 8px; line-height: 1.6;">
                            <div><strong>Physical Bounds:</strong> ${site.length}' (Length) &times; ${site.width}' (Width)</div>
                            <div><strong>Total Area:</strong> <span style="color: #0284c7; font-weight: 800;">${site.dimensionSqFt} Square Feet</span></div>
                            <div><strong>Facing Direction:</strong> ${site.facing}</div>
                            <div><strong>Frontage Road:</strong> ${site.roadWidth}</div>
                            <div><strong>Total Cost:</strong> <span style="color: #059669; font-weight: 800;">₹${site.totalCost.toLocaleString('en-IN')}</span> <span style="font-size: 0.72rem; color: #64748b;">(${site.dimensionSqFt} &times; ₹${site.costPerSqFt.toLocaleString('en-IN')})</span></div>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <button type="button" class="btn-primary" style="flex: 1; padding: 8px 6px; font-size: 0.78rem; font-weight: 700; border-radius: 6px; background: linear-gradient(135deg, #0284c7, #0369a1);" onclick="window.app.showSiteBlueprintModal('${site.id}')">
                                <i class="fa-solid fa-ruler-combined"></i> View Blueprint
                            </button>
                            <button type="button" class="btn-primary" style="flex: 1; padding: 8px 6px; font-size: 0.78rem; font-weight: 700; border-radius: 6px; background: linear-gradient(135deg, #059669, #047857);" onclick="window.app.showSiteBookingPage('${site.id}')">
                                <i class="fa-solid fa-file-signature"></i> Book Site &rarr;
                            </button>
                        </div>
                    </div>
                `;

                const marker = L.marker([site.lat, site.lng], { icon: siteIcon }).addTo(this.dedicatedMap);
                marker.bindPopup(popupHtml, { maxWidth: 300 });
                this.dedicatedMapMarkers.push(marker);
            });

            // Set view
            if (this.mapPageAreaFilter !== "all") {
                const area = SMART_CITY_DATA.areas.find(a => a.id === this.mapPageAreaFilter);
                if (area) this.dedicatedMap.setView([area.lat, area.lng], 15, { animate: true });
            } else {
                this.dedicatedMap.setView([13.345, 77.102], 13, { animate: true });
            }
            return;
        }

        // ====================================================================
        // MODE 2: PUBLIC FACILITIES VIEW
        // ====================================================================
        let facilities = [];
        const areas = this.mapPageAreaFilter === "all"
            ? SMART_CITY_DATA.areas
            : SMART_CITY_DATA.areas.filter(a => a.id === this.mapPageAreaFilter);

        areas.forEach(area => {
            let areaFacilities = [...area.facilities];
            if (this.mapPageCategoryFilter !== "all") {
                areaFacilities = areaFacilities.filter(f => f.category === this.mapPageCategoryFilter);
            }
            areaFacilities.forEach(f => facilities.push({ ...f, _areaName: area.name, _areaLat: area.lat, _areaLng: area.lng }));
        });

        // Update counter
        const counter = document.getElementById("map-facilities-counter");
        if (counter) {
            counter.textContent = `Showing ${facilities.length} Facilities`;
        }

        // Render sidebar list
        this._renderMapSidebarList(facilities);

        // Plot markers
        facilities.forEach(facility => {
            const catObj = SMART_CITY_DATA.categories.find(c => c.id === facility.category) || {
                icon: "fa-building", color: "#0284c7", label: "Facility"
            };

            if (!facility.lat || !facility.lng) return;

            const pinIcon = L.divIcon({
                className: "custom-map-pin-wrapper",
                html: `<div class="custom-map-pin" style="background: ${catObj.color};"><i class="fa-solid ${catObj.icon}"></i></div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -38]
            });

            const popupHtml = `
                <div class="map-popup-card">
                    <div class="popup-header">
                        <div class="popup-icon" style="background: ${catObj.color};">
                            <i class="fa-solid ${catObj.icon}"></i>
                        </div>
                        <div>
                            <span class="facility-type-badge" style="background: ${catObj.color}15; color: ${catObj.color}; font-size: 0.68rem;">
                                ${catObj.label.split("&")[0].trim()}
                            </span>
                            <h4 class="popup-title">${facility.name}</h4>
                            <div class="popup-kannada">${facility.kannadaName || ""}</div>
                            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">${facility._areaName}</div>
                        </div>
                    </div>
                    <div class="popup-info-row"><i class="fa-solid fa-location-dot"></i><span>${facility.address}</span></div>
                    <div class="popup-info-row"><i class="fa-regular fa-clock"></i><span>${facility.timing}</span></div>
                    <div class="popup-info-row"><i class="fa-solid fa-phone"></i><span>${facility.phone}</span></div>
                    <div class="popup-actions">
                        <a href="tel:${facility.phone.replace(/[^0-9+]/g, '')}" class="btn-popup-action">
                            <i class="fa-solid fa-phone"></i> Call
                        </a>
                        <button type="button" class="btn-popup-action" style="background: var(--primary); color: #fff;"
                            onclick="window.app.getDirections('${facility.name.replace(/'/g, "\\'")}', '${facility._areaName}')">
                            <i class="fa-solid fa-diamond-turn-right"></i> Directions
                        </button>
                    </div>
                </div>
            `;

            const marker = L.marker([facility.lat, facility.lng], { icon: pinIcon }).addTo(this.dedicatedMap);
            marker.bindPopup(popupHtml, { maxWidth: 300 });
            this.dedicatedMapMarkers.push(marker);
        });

        // Recenter map to fit all visible markers
        if (facilities.length > 0) {
            if (this.mapPageAreaFilter !== "all") {
                const area = SMART_CITY_DATA.areas.find(a => a.id === this.mapPageAreaFilter);
                if (area) this.dedicatedMap.setView([area.lat, area.lng], 15, { animate: true });
            } else {
                this.dedicatedMap.setView([13.345, 77.102], 13, { animate: true });
            }
        }
    }

    _renderMapSitesSidebarList(sites) {
        const listEl = document.getElementById("sidebar-list-content");
        const titleEl = document.getElementById("sidebar-title");
        if (!listEl) return;

        if (titleEl) titleEl.textContent = `${sites.length} Sites`;
        listEl.innerHTML = "";

        if (sites.length === 0) {
            listEl.innerHTML = `<div style="padding: 20px; text-align: center; color: #94a3b8;">
                <p>No sites match the current filters.</p>
            </div>`;
            return;
        }

        sites.forEach(site => {
            let pinColor = "#10b981";
            let dotClass = "dot-available";
            if (site.status === "Booked") {
                pinColor = "#ef4444";
                dotClass = "dot-booked";
            } else if (site.status === "Reserved") {
                pinColor = "#f59e0b";
                dotClass = "dot-reserved";
            }

            const item = document.createElement("div");
            item.className = "sidebar-facility-item";
            item.innerHTML = `
                <div class="site-dot-pin ${dotClass}" style="width: 18px; height: 18px; flex-shrink: 0;"></div>
                <div class="sidebar-item-info">
                    <div class="sidebar-item-title" style="display: flex; justify-content: space-between;">
                        <span>${site.siteNumber}</span>
                        <span style="color: ${pinColor}; font-weight: 800; font-size: 0.72rem;">${site.status}</span>
                    </div>
                    <div class="sidebar-item-sub">${site._layoutName} &bull; ${site._areaName}</div>
                    <div class="sidebar-item-sub" style="color: #0284c7; font-weight: 700;">
                        ${site.length}' &times; ${site.width}' (${site.dimensionSqFt} Sq.Ft) &bull; ₹${site.totalCost.toLocaleString('en-IN')}
                    </div>
                </div>
            `;

            item.addEventListener("click", () => {
                if (this.dedicatedMap && site.lat && site.lng) {
                    this.dedicatedMap.flyTo([site.lat, site.lng], 17, { animate: true, duration: 0.8 });
                    const marker = this.dedicatedMapMarkers.find(m => {
                        const ll = m.getLatLng();
                        return Math.abs(ll.lat - site.lat) < 0.0001 && Math.abs(ll.lng - site.lng) < 0.0001;
                    });
                    if (marker) setTimeout(() => marker.openPopup(), 900);
                }
            });

            listEl.appendChild(item);
        });
    }

    _renderMapSidebarList(facilities) {
        const listEl = document.getElementById("sidebar-list-content");
        const titleEl = document.getElementById("sidebar-title");
        if (!listEl) return;

        if (titleEl) titleEl.textContent = `${facilities.length} Facilities`;
        listEl.innerHTML = "";

        if (facilities.length === 0) {
            listEl.innerHTML = `<div style="padding: 20px; text-align: center; color: #94a3b8;">
                <i class="fa-solid fa-magnifying-glass-location" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>No facilities match the current filters.</p>
            </div>`;
            return;
        }

        facilities.forEach(facility => {
            const catObj = SMART_CITY_DATA.categories.find(c => c.id === facility.category) || {
                icon: "fa-building", color: "#0284c7", label: "Facility"
            };

            const item = document.createElement("div");
            item.className = "sidebar-facility-item";
            item.innerHTML = `
                <div class="sidebar-item-icon" style="background: ${catObj.color};">
                    <i class="fa-solid ${catObj.icon}"></i>
                </div>
                <div class="sidebar-item-info">
                    <div class="sidebar-item-title">${facility.name}</div>
                    <div class="sidebar-item-sub">${facility._areaName} &bull; ${catObj.label.split("&")[0].trim()}</div>
                    <div class="sidebar-item-sub">${facility.address}</div>
                </div>
            `;

            // Click sidebar item -> fly map to that marker + open popup
            item.addEventListener("click", () => {
                if (this.dedicatedMap && facility.lat && facility.lng) {
                    this.dedicatedMap.flyTo([facility.lat, facility.lng], 17, { animate: true, duration: 0.8 });
                    const marker = this.dedicatedMapMarkers.find(m => {
                        const ll = m.getLatLng();
                        return Math.abs(ll.lat - facility.lat) < 0.0001 && Math.abs(ll.lng - facility.lng) < 0.0001;
                    });
                    if (marker) setTimeout(() => marker.openPopup(), 900);
                }
            });

            listEl.appendChild(item);
        });
    }

    setupMapPageListeners() {
        // Back button on map page
        const backBtn = document.getElementById("map-page-back-btn");
        if (backBtn) {
            backBtn.addEventListener("click", () => {
                if (this.mapPageFromPage === "facilities") {
                    this.showPage("facilities");
                } else {
                    this.showAreasPage();
                }
            });
        }

        // Logout from map page
        const logoutMapBtn = document.getElementById("logout-btn-map");
        if (logoutMapBtn) {
            logoutMapBtn.addEventListener("click", () => this.handleLogout());
        }

        // Layer Mode Toggle: Show ONLY Sites vs Public Facilities
        const btnSitesMode = document.getElementById("btn-map-mode-sites");
        const btnOnlyEmpty = document.getElementById("btn-map-only-empty");
        const btnFacsMode = document.getElementById("btn-map-mode-facilities");
        const legendEl = document.getElementById("dedicated-map-legend");

        if (btnSitesMode) {
            btnSitesMode.addEventListener("click", () => {
                this.mapPageDisplayMode = "sites";
                this.mapOnlyEmptySites = false;
                if (btnOnlyEmpty) {
                    btnOnlyEmpty.classList.remove("active");
                    btnOnlyEmpty.style.background = "";
                }
                if (legendEl) {
                    legendEl.innerHTML = `
                        <span class="legend-title" style="color: #0f172a; font-weight: 800;"><i class="fa-solid fa-shapes"></i> Sites Status Dot Marks:</span>
                        <span class="legend-item" style="display: inline-flex; align-items: center; gap: 6px;"><span class="site-dot-pin dot-available" style="width: 14px; height: 14px; display: inline-block;"></span> <strong style="color: #059669;">Available Site (Green Dot)</strong></span>
                        <span class="legend-item" style="display: inline-flex; align-items: center; gap: 6px;"><span class="site-dot-pin dot-booked" style="width: 14px; height: 14px; display: inline-block;"></span> <strong style="color: #dc2626;">Booked Site (Red Dot)</strong></span>
                        <span class="legend-item" style="display: inline-flex; align-items: center; gap: 6px;"><span class="site-dot-pin dot-reserved" style="width: 14px; height: 14px; display: inline-block;"></span> <strong style="color: #d97706;">Reserved Site (Orange Dot)</strong></span>
                    `;
                }
                this._refreshDedicatedMapMarkers();
                this._updateMapPageSubtitle();
            });
        }

        if (btnOnlyEmpty) {
            btnOnlyEmpty.addEventListener("click", () => {
                this.mapPageDisplayMode = "sites";
                this.mapOnlyEmptySites = true;
                btnOnlyEmpty.classList.add("active");
                btnOnlyEmpty.style.background = "#dcfce7";
                if (btnSitesMode) {
                    btnSitesMode.classList.remove("active");
                    btnSitesMode.style.background = "";
                    btnSitesMode.style.color = "";
                }
                if (btnFacsMode) {
                    btnFacsMode.classList.remove("active");
                    btnFacsMode.style.background = "";
                    btnFacsMode.style.color = "";
                }
                if (legendEl) {
                    legendEl.innerHTML = `
                        <span class="legend-title" style="color: #059669; font-weight: 800;"><i class="fa-solid fa-circle-check"></i> Showing Empty Sites Marked:</span>
                        <span class="legend-item" style="display: inline-flex; align-items: center; gap: 6px;"><span class="site-dot-pin dot-available" style="width: 14px; height: 14px; display: inline-block;"></span> <strong style="color: #059669;">Empty / Vacant Sites Ready for Booking (Green Pulsing Dot)</strong></span>
                    `;
                }
                this._refreshDedicatedMapMarkers();
                this._updateMapPageSubtitle();
            });
        }

        if (btnFacsMode) {
            btnFacsMode.addEventListener("click", () => {
                this.mapPageDisplayMode = "facilities";
                this.mapOnlyEmptySites = false;
                if (btnOnlyEmpty) {
                    btnOnlyEmpty.classList.remove("active");
                    btnOnlyEmpty.style.background = "";
                }
                if (legendEl) {
                    legendEl.innerHTML = `
                        <span class="legend-title"><i class="fa-solid fa-layer-group"></i> Facilities Legend:</span>
                        <span class="legend-item"><span class="legend-color-dot" style="background: #2563eb;"></span> Schools</span>
                        <span class="legend-item"><span class="legend-color-dot" style="background: #dc2626;"></span> Hospitals</span>
                        <span class="legend-item"><span class="legend-color-dot" style="background: #ea580c;"></span> Post Offices</span>
                        <span class="legend-item"><span class="legend-color-dot" style="background: #059669;"></span> Medicals</span>
                        <span class="legend-item"><span class="legend-color-dot" style="background: #1e40af;"></span> Police</span>
                        <span class="legend-item"><span class="legend-color-dot" style="background: #b45309;"></span> Banks</span>
                        <span class="legend-item"><span class="legend-color-dot" style="background: #16a34a;"></span> Parks</span>
                    `;
                }
                this._refreshDedicatedMapMarkers();
                this._updateMapPageSubtitle();
            });
        }

        // Recenter button
        const recenterBtn = document.getElementById("btn-recenter-full-map");
        if (recenterBtn) {
            recenterBtn.addEventListener("click", () => {
                if (!this.dedicatedMap) return;
                if (this.mapPageAreaFilter !== "all") {
                    const area = SMART_CITY_DATA.areas.find(a => a.id === this.mapPageAreaFilter);
                    if (area) this.dedicatedMap.flyTo([area.lat, area.lng], 15, { animate: true });
                } else {
                    this.dedicatedMap.flyTo([13.345, 77.102], 13, { animate: true });
                }
            });
        }

        // Sidebar toggle button
        const toggleSidebarBtn = document.getElementById("btn-toggle-map-sidebar");
        const sidebar = document.getElementById("map-facilities-sidebar");
        if (toggleSidebarBtn && sidebar) {
            toggleSidebarBtn.addEventListener("click", () => {
                sidebar.classList.toggle("hidden");
            });
        }

        // Close sidebar button
        const closeSidebarBtn = document.getElementById("close-map-sidebar-btn");
        if (closeSidebarBtn && sidebar) {
            closeSidebarBtn.addEventListener("click", () => {
                sidebar.classList.add("hidden");
            });
        }
    }

    /* ======================================================================
       AUTHENTICATION & SESSION MANAGEMENT
       ====================================================================== */
    setupAuthListeners() {
        // Toggle password visibility
        if (this.togglePasswordBtn && this.passwordInput) {
            this.togglePasswordBtn.addEventListener("click", () => {
                const isPassword = this.passwordInput.type === "password";
                this.passwordInput.type = isPassword ? "text" : "password";
                const icon = this.togglePasswordBtn.querySelector("i");
                if (icon) {
                    if (isPassword) {
                        icon.classList.remove("fa-eye");
                        icon.classList.add("fa-eye-slash");
                    } else {
                        icon.classList.remove("fa-eye-slash");
                        icon.classList.add("fa-eye");
                    }
                }
            });
        }

        // Quick Demo Fill buttons
        const btnCitizen = document.getElementById("demo-citizen-btn");
        if (btnCitizen) {
            btnCitizen.addEventListener("click", () => {
                this.fillLoginForm("tumkur.citizen@smartcity.gov", "Tumakuru@2026", "Ramesh Kumar (Citizen)", "Verified Citizen");
            });
        }

        const btnAdmin = document.getElementById("demo-admin-btn");
        if (btnAdmin) {
            btnAdmin.addEventListener("click", () => {
                this.fillLoginForm("tumkur.officer@smartcity.gov", "Admin@Tumkur2026", "Dr. B. Manjunath (Officer)", "Municipal Smart Officer");
            });
        }

        const btnGuest = document.getElementById("demo-guest-btn");
        if (btnGuest) {
            btnGuest.addEventListener("click", () => {
                this.fillLoginForm("visitor.tumkur@smartcity.gov", "Guest@2026", "Guest Explorer", "Guest Citizen");
            });
        }

        // Direct Skip Login Button
        const btnDirectSkip = document.getElementById("direct-skip-btn");
        if (btnDirectSkip) {
            btnDirectSkip.addEventListener("click", () => {
                this.fillLoginForm("citizen.tumkur@smartcity.gov", "Tumakuru@2026", "Citizen Explorer", "Verified Citizen");
                this.handleLogin(true);
            });
        }

        // Login form submit
        if (this.loginForm) {
            this.loginForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleLogin(false);
            });
        }

        // Logout from Page 1 or Page 2
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener("click", () => this.handleLogout());
        }
        if (this.logoutBtn2) {
            this.logoutBtn2.addEventListener("click", () => this.handleLogout());
        }

        // Forgot password simulated helper
        const forgotLink = document.getElementById("forgot-password-link");
        if (forgotLink) {
            forgotLink.addEventListener("click", () => {
                this.showToast("For demo, click any of the Quick Demo buttons or enter any password.", "info");
            });
        }
    }

    fillLoginForm(user, pass, displayName, role) {
        if (this.usernameInput) this.usernameInput.value = user;
        if (this.passwordInput) this.passwordInput.value = pass;
        this.clearErrors();
        this.tempDisplayName = displayName;
        this.tempDisplayRole = role;
        this.showToast(`Autofilled credentials for ${displayName}`, "info");
    }

    clearErrors() {
        const uErr = document.getElementById("username-error");
        const pErr = document.getElementById("password-error");
        if (uErr) uErr.textContent = "";
        if (pErr) pErr.textContent = "";
        if (this.usernameInput) this.usernameInput.classList.remove("input-error");
        if (this.passwordInput) this.passwordInput.classList.remove("input-error");
    }

    handleLogin(skipValidation = false) {
        let username = this.usernameInput ? this.usernameInput.value.trim() : "";
        let password = this.passwordInput ? this.passwordInput.value.trim() : "";

        this.clearErrors();

        // Default fallback values
        if (!username) {
            username = "tumkur.citizen@smartcity.gov";
            if (this.usernameInput) this.usernameInput.value = username;
        }
        if (!password) {
            password = "Tumakuru@2026";
            if (this.passwordInput) this.passwordInput.value = password;
        }

        // Determine user profile
        let userDisplayName = this.tempDisplayName || "Citizen User";
        let userRole = this.tempDisplayRole || "Verified Citizen";

        const lowerUser = username.toLowerCase();
        if (lowerUser.includes("officer") || lowerUser.includes("admin")) {
            userDisplayName = "Dr. B. Manjunath (Officer)";
            userRole = "Municipal Smart Officer";
        } else if (lowerUser.includes("citizen")) {
            userDisplayName = "Ramesh Kumar (Citizen)";
            userRole = "Verified Citizen";
        } else if (lowerUser.includes("guest") || lowerUser.includes("visitor")) {
            userDisplayName = "Guest Explorer";
            userRole = "Guest Citizen";
        } else {
            const namePart = username.split("@")[0].replace(/[._-]/g, " ");
            userDisplayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        }

        this.currentUser = {
            username: username,
            name: userDisplayName,
            role: userRole,
            loginTime: new Date().toISOString()
        };

        SafeStorage.setItem("tumakuru_smart_city_user", JSON.stringify(this.currentUser));

        // Update profile in navbar
        if (this.displayUserName) this.displayUserName.textContent = this.currentUser.name;
        if (this.displayUserRole) this.displayUserRole.textContent = this.currentUser.role;

        this.showToast(`Welcome to Smart City Tumakuru, ${this.currentUser.name}!`, "success");

        // Navigate to First Page: Only Areas!
        this.showAreasPage();
    }

    checkExistingSession() {
        const saved = SafeStorage.getItem("tumakuru_smart_city_user");
        if (saved) {
            try {
                this.currentUser = JSON.parse(saved);
                if (this.displayUserName) this.displayUserName.textContent = this.currentUser.name;
                if (this.displayUserRole) this.displayUserRole.textContent = this.currentUser.role;
                this.showAreasPage();
            } catch (e) {
                SafeStorage.removeItem("tumakuru_smart_city_user");
                this.currentUser = null;
            }
        }
    }

    handleLogout() {
        SafeStorage.removeItem("tumakuru_smart_city_user");
        this.currentUser = null;
        this.showPage("login");
        this.showToast("Signed out successfully from Smart City Tumakuru.", "info");
    }

    /* ======================================================================
       PAGE NAVIGATION LISTENERS (PAGE 1 <-> PAGE 2)
       ====================================================================== */
    setupNavigationListeners() {
        // Back buttons on Page 2 -> Return to Page 1 (Areas)
        if (this.navBackToAreasBtn) {
            this.navBackToAreasBtn.addEventListener("click", () => this.showAreasPage());
        }
        if (this.breadcrumbBackBtn) {
            this.breadcrumbBackBtn.addEventListener("click", () => this.showAreasPage());
        }
        if (this.bottomReturnBtn) {
            this.bottomReturnBtn.addEventListener("click", () => this.showAreasPage());
        }

        // Spotlight Previous / Next / Action buttons on Page 1
        if (this.spotlightPrevBtn) {
            this.spotlightPrevBtn.addEventListener("click", () => this.navigateSpotlight(-1));
        }
        if (this.spotlightNextBtn) {
            this.spotlightNextBtn.addEventListener("click", () => this.navigateSpotlight(1));
        }
        if (this.spotlightActionBtn) {
            this.spotlightActionBtn.addEventListener("click", () => {
                const area = SMART_CITY_DATA.areas[this.currentSpotlightIndex];
                if (area) {
                    this.navigateToArea(area.id);
                }
            });
        }
        if (this.spotlightLayoutsBtn) {
            this.spotlightLayoutsBtn.addEventListener("click", () => {
                const area = SMART_CITY_DATA.areas[this.currentSpotlightIndex];
                if (area) {
                    this.showLayoutsPage(area.id);
                }
            });
        }
    }

    updateTotalMetrics() {
        if (!window.SMART_CITY_DATA || !SMART_CITY_DATA.areas) return;
        let count = 0;
        SMART_CITY_DATA.areas.forEach(a => {
            if (a.facilities) count += a.facilities.length;
        });
        if (this.totalFacilitiesCount) {
            this.totalFacilitiesCount.textContent = `${count}+`;
        }
    }

    /* ======================================================================
       PAGE 1: AREAS ONLY RENDERING (SPOTLIGHT & 5 CARDS)
       ====================================================================== */
    navigateSpotlight(direction) {
        if (!window.SMART_CITY_DATA || !SMART_CITY_DATA.areas.length) return;
        const total = SMART_CITY_DATA.areas.length;
        this.currentSpotlightIndex = (this.currentSpotlightIndex + direction + total) % total;
        this.renderSpotlight(this.currentSpotlightIndex);
    }

    renderSpotlight(index) {
        if (!window.SMART_CITY_DATA || !SMART_CITY_DATA.areas[index]) return;
        const area = SMART_CITY_DATA.areas[index];
        this.currentSpotlightIndex = index;

        if (this.spotlightStepBadge) {
            this.spotlightStepBadge.innerHTML = `<i class="fa-solid fa-compass"></i> Area ${index + 1} of ${SMART_CITY_DATA.areas.length}`;
        }
        if (this.spotlightPincode) {
            this.spotlightPincode.textContent = `PIN: ${area.pincode}`;
        }
        if (this.spotlightTitle) {
            this.spotlightTitle.textContent = area.name;
        }
        if (this.spotlightKannada) {
            this.spotlightKannada.textContent = area.kannadaName;
        }
        if (this.spotlightDesc) {
            this.spotlightDesc.textContent = `${area.tagline} — ${area.shortDesc}`;
        }
        if (this.spotlightActionBtn) {
            this.spotlightActionBtn.innerHTML = `<span>Open ${area.name} Facilities &rarr;</span>`;
        }
        if (this.spotlightLayoutsText) {
            this.spotlightLayoutsText.textContent = `Explore Layout in ${area.name} \u2192`;
        }

        // Render 5 Indicator Dots
        if (this.spotlightDots) {
            this.spotlightDots.innerHTML = "";
            SMART_CITY_DATA.areas.forEach((a, i) => {
                const dot = document.createElement("div");
                dot.className = `spotlight-dot ${i === index ? "active" : ""}`;
                dot.title = `Area 0${i + 1}: ${a.name}`;
                dot.addEventListener("click", () => {
                    this.renderSpotlight(i);
                });
                this.spotlightDots.appendChild(dot);
            });
        }
    }

    /* Renders the 5 Surrounding Area Cards on Page 1 */
    renderAreaCards() {
        if (!this.areasGrid || !window.SMART_CITY_DATA) return;
        this.areasGrid.innerHTML = "";

        SMART_CITY_DATA.areas.forEach((area, index) => {
            const card = document.createElement("div");
            card.className = "area-card";
            card.dataset.areaId = area.id;

            card.innerHTML = `
                <div class="area-card-top-strip"></div>
                <div>
                    <div class="area-badge-row">
                        <span class="area-num-tag">AREA 0${index + 1}</span>
                        <span class="area-type-tag">${area.badge}</span>
                    </div>
                    <h3 class="area-card-title">${area.name}</h3>
                    <div class="area-card-kannada">${area.kannadaName}</div>
                    <p class="area-card-desc">${area.shortDesc}</p>
                </div>
                <div class="area-card-footer">
                    <span class="area-facility-count">
                        <i class="fa-solid fa-layer-group"></i> ${area.facilities.length} Public Amenities
                    </span>
                    <span class="area-select-indicator">
                        Facilities &rarr;
                    </span>
                </div>
                <div class="area-card-layouts-bar" style="padding: 10px 18px; background: #f8fafc; border-top: 1px dashed var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.78rem; font-weight: 700; color: #0284c7;">
                        <i class="fa-solid fa-shapes"></i> Master Layout
                    </span>
                    <button type="button" class="btn-card-layouts" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; border: none; padding: 5px 12px; border-radius: 9999px; font-size: 0.76rem; font-weight: 700; cursor: pointer;" onclick="event.stopPropagation(); window.app.showLayoutsPage('${area.id}')">
                        Explore Layout & Sites &rarr;
                    </button>
                </div>
            `;

            // Clicking any area card navigates directly to Page 2 for that area!
            card.addEventListener("click", () => {
                this.navigateToArea(area.id);
            });

            this.areasGrid.appendChild(card);
        });
    }

    /* ======================================================================
       PAGE 2: FACILITIES ONLY RENDERING & FILTERS
       ====================================================================== */
    setupPage2FilterListeners() {
        // Search Input listener
        if (this.globalSearchInput) {
            this.globalSearchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                if (this.clearSearchBtn) {
                    if (this.searchQuery) {
                        this.clearSearchBtn.classList.add("visible");
                    } else {
                        this.clearSearchBtn.classList.remove("visible");
                    }
                }
                this.renderFacilities();
            });
        }

        // Clear search
        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener("click", () => {
                if (this.globalSearchInput) this.globalSearchInput.value = "";
                this.searchQuery = "";
                this.clearSearchBtn.classList.remove("visible");
                this.renderFacilities();
            });
        }

        // 24x7 filter toggle
        if (this.toggle24x7Filter) {
            this.toggle24x7Filter.addEventListener("change", (e) => {
                this.onlyOpenFilter = e.target.checked;
                this.renderFacilities();
            });
        }

        // Reset filters in empty state
        if (this.resetFiltersBtn) {
            this.resetFiltersBtn.addEventListener("click", () => {
                this.searchQuery = "";
                if (this.globalSearchInput) this.globalSearchInput.value = "";
                if (this.clearSearchBtn) this.clearSearchBtn.classList.remove("visible");
                this.onlyOpenFilter = false;
                if (this.toggle24x7Filter) this.toggle24x7Filter.checked = false;
                this.selectedCategory = "all";
                this.renderCategoryTabs();
                this.renderFacilities();
            });
        }

        // Modal close listeners
        if (this.modalCloseBtn) {
            this.modalCloseBtn.addEventListener("click", () => this.closeFacilityModal());
        }

        if (this.facilityModal) {
            this.facilityModal.addEventListener("click", (e) => {
                if (e.target === this.facilityModal) this.closeFacilityModal();
            });
        }

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.facilityModal && !this.facilityModal.classList.contains("hidden")) {
                this.closeFacilityModal();
            }
        });
    }

    /* Renders Quick Switcher pills on Page 2 */
    renderAreaSwitcherPills() {
        if (!this.areaSwitcherPills || !window.SMART_CITY_DATA) return;
        this.areaSwitcherPills.innerHTML = "";

        SMART_CITY_DATA.areas.forEach((area) => {
            const btn = document.createElement("button");
            btn.type = "button";
            const isActive = area.id === this.selectedAreaId;
            btn.className = `area-pill-btn ${isActive ? "active" : ""}`;
            btn.innerHTML = `
                <i class="fa-solid fa-location-dot"></i>
                <span>${area.name}</span>
            `;

            btn.addEventListener("click", () => {
                this.navigateToArea(area.id);
            });

            this.areaSwitcherPills.appendChild(btn);
        });
    }

    /* Renders Category Filter Tabs on Page 2 */
    renderCategoryTabs() {
        if (!this.categoryTabs || !window.SMART_CITY_DATA) return;
        const area = SMART_CITY_DATA.areas.find(a => a.id === this.selectedAreaId);
        const facilities = area ? area.facilities : [];

        this.categoryTabs.innerHTML = "";

        SMART_CITY_DATA.categories.forEach(cat => {
            const btn = document.createElement("button");
            btn.type = "button";
            const isActive = this.selectedCategory === cat.id;
            btn.className = `cat-tab-btn ${isActive ? "active" : ""}`;

            // Calculate count in current area
            let count = 0;
            if (cat.id === "all") {
                count = facilities.length;
            } else {
                count = facilities.filter(f => f.category === cat.id).length;
            }

            btn.innerHTML = `
                <i class="fa-solid ${cat.icon}" style="${isActive ? '' : `color: ${cat.color}`}"></i>
                <span>${cat.label}</span>
                <span class="cat-tab-count">${count}</span>
            `;

            btn.addEventListener("click", () => {
                this.setCategory(cat.id);
            });

            this.categoryTabs.appendChild(btn);
        });
    }

    setCategory(catId) {
        this.selectedCategory = catId;
        this.renderCategoryTabs();
        this.renderFacilities();
    }

    /* Renders both the facility cards grid AND the interactive map for the selected area on Page 2 */
    renderFacilities() {
        if (!window.SMART_CITY_DATA) return;
        const area = SMART_CITY_DATA.areas.find(a => a.id === this.selectedAreaId);
        if (!area) return;

        let filtered = [...area.facilities];

        // 1. Category Filter
        if (this.selectedCategory !== "all") {
            filtered = filtered.filter(item => item.category === this.selectedCategory);
        }

        // 2. Search Filter (by name, kannada, address, features, or landmark)
        if (this.searchQuery) {
            const q = this.searchQuery;
            filtered = filtered.filter(item => {
                const nameMatch = item.name.toLowerCase().includes(q);
                const kannadaMatch = item.kannadaName && item.kannadaName.toLowerCase().includes(q);
                const addressMatch = item.address.toLowerCase().includes(q);
                const landmarkMatch = item.landmark && item.landmark.toLowerCase().includes(q);
                const categoryMatch = item.category.toLowerCase().includes(q);
                const featureMatch = item.features && item.features.some(f => f.toLowerCase().includes(q));
                return nameMatch || kannadaMatch || addressMatch || landmarkMatch || categoryMatch || featureMatch;
            });
        }

        // 3. 24x7 / Open filter
        if (this.onlyOpenFilter) {
            filtered = filtered.filter(item => {
                const s = (item.status || "").toLowerCase();
                const b = (item.badge || "").toLowerCase();
                return s.includes("24/7") || s.includes("open now") || b.includes("24x7") || b.includes("24 hours") || b.includes("active");
            });
        }

        // Update count label
        if (this.facilitiesResultsCount) {
            this.facilitiesResultsCount.textContent = `Showing ${filtered.length} of ${area.facilities.length} Facilities in ${area.name}`;
        }

        // Update facilities map markers to sync with current filters
        this.updateFacilitiesMapMarkers(filtered);

        // Render or empty state
        if (filtered.length === 0) {
            if (this.facilitiesGrid) this.facilitiesGrid.innerHTML = "";
            if (this.emptyStateCard) this.emptyStateCard.classList.remove("hidden");
            return;
        }

        if (this.emptyStateCard) this.emptyStateCard.classList.add("hidden");
        if (!this.facilitiesGrid) return;
        this.facilitiesGrid.innerHTML = "";

        filtered.forEach(facility => {
            const catObj = SMART_CITY_DATA.categories.find(c => c.id === facility.category) || {
                icon: "fa-building",
                color: "#0284c7",
                label: "Facility"
            };

            const card = document.createElement("div");
            card.className = "facility-card";

            const is247 = facility.status && (facility.status.includes("24/7") || facility.status.includes("24 Hours") || facility.status.includes("Active"));

            card.innerHTML = `
                <div>
                    <div class="facility-header">
                        <div class="facility-cat-icon" style="background: ${catObj.color};">
                            <i class="fa-solid ${catObj.icon}"></i>
                        </div>
                        <div class="facility-titles">
                            <div class="facility-meta-pills">
                                <span class="facility-type-badge" style="background: ${catObj.color}15; color: ${catObj.color};">
                                    ${catObj.label.split("&")[0].trim()}
                                </span>
                                <span class="facility-status-pill ${is247 ? 'status-247' : 'status-open'}">
                                    <i class="fa-solid fa-circle-dot"></i> ${facility.status || 'Verified'}
                                </span>
                            </div>
                            <h4 class="facility-name">${facility.name}</h4>
                            <div class="facility-kannada">${facility.kannadaName || ''}</div>
                        </div>
                    </div>

                    <div class="facility-info-list" style="margin-top: 14px;">
                        <div class="facility-info-row">
                            <i class="fa-solid fa-location-dot"></i>
                            <div>
                                <span>${facility.address}</span>
                                ${facility.landmark ? `<br><span class="facility-landmark-tag"><i class="fa-solid fa-compass"></i> Near: ${facility.landmark}</span>` : ''}
                            </div>
                        </div>

                        <div class="facility-info-row">
                            <i class="fa-regular fa-clock"></i>
                            <span>${facility.timing}</span>
                        </div>

                        <div class="facility-info-row">
                            <i class="fa-solid fa-phone"></i>
                            <span>${facility.phone}</span>
                        </div>
                    </div>

                    ${facility.features && facility.features.length ? `
                        <div class="facility-tags-list">
                            ${facility.features.slice(0, 3).map(f => `<span class="feature-pill">${f}</span>`).join('')}
                            ${facility.features.length > 3 ? `<span class="feature-pill">+${facility.features.length - 3} more</span>` : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="facility-actions">
                    <button type="button" class="btn-card-action btn-card-call" onclick="window.app.callFacility('${facility.phone}', '${facility.name.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-phone"></i> Call Center
                    </button>
                    <button type="button" class="btn-card-action" onclick="window.app.showFacilityDetail('${facility.id}')">
                        <i class="fa-solid fa-circle-info"></i> View Details
                    </button>
                </div>
            `;

            this.facilitiesGrid.appendChild(card);
        });
    }

    /* Shows complete deep-dive modal for a facility */
    showFacilityDetail(facilityId) {
        if (!window.SMART_CITY_DATA) return;
        let foundFacility = null;
        let foundArea = null;

        for (const area of SMART_CITY_DATA.areas) {
            const fac = area.facilities.find(f => f.id === facilityId);
            if (fac) {
                foundFacility = fac;
                foundArea = area;
                break;
            }
        }

        if (!foundFacility || !this.modalBodyContent || !this.facilityModal) return;

        const catObj = SMART_CITY_DATA.categories.find(c => c.id === foundFacility.category) || {
            icon: "fa-building",
            color: "#0284c7",
            label: "Facility"
        };

        this.modalBodyContent.innerHTML = `
            <div class="modal-header-section">
                <div class="modal-cat-icon" style="background: ${catObj.color};">
                    <i class="fa-solid ${catObj.icon}"></i>
                </div>
                <div class="modal-title-group">
                    <div class="facility-meta-pills" style="margin-bottom: 6px;">
                        <span class="facility-type-badge" style="background: ${catObj.color}20; color: ${catObj.color};">
                            ${catObj.label}
                        </span>
                        <span class="area-type-tag">${foundArea.name} • PIN: ${foundArea.pincode}</span>
                        <span class="facility-status-pill ${foundFacility.status.includes('24/7') || foundFacility.status.includes('Active') ? 'status-247' : 'status-open'}">
                            ${foundFacility.status}
                        </span>
                    </div>
                    <h2>${foundFacility.name}</h2>
                    <div class="modal-kannada-title">${foundFacility.kannadaName || ''}</div>
                </div>
            </div>

            <div class="modal-details-grid">
                <div class="modal-detail-row">
                    <i class="fa-solid fa-map-location-dot"></i>
                    <div>
                        <strong>Exact Location & Landmark</strong>
                        <span>${foundFacility.address}</span>
                        ${foundFacility.landmark ? `<br><span style="color: var(--text-muted); font-size: 0.85rem;">Landmark: ${foundFacility.landmark}</span>` : ''}
                    </div>
                </div>

                <div class="modal-detail-row">
                    <i class="fa-solid fa-clock"></i>
                    <div>
                        <strong>Visiting / Operational Hours</strong>
                        <span>${foundFacility.timing}</span>
                    </div>
                </div>

                <div class="modal-detail-row">
                    <i class="fa-solid fa-phone-volume"></i>
                    <div>
                        <strong>Official Contact / Emergency Help</strong>
                        <span>${foundFacility.phone}</span>
                    </div>
                </div>

                <div class="modal-detail-row">
                    <i class="fa-solid fa-certificate"></i>
                    <div>
                        <strong>Category & Classification</strong>
                        <span>${foundFacility.badge} • Citizen Rating: ⭐ ${foundFacility.rating || '4.5'} / 5.0</span>
                    </div>
                </div>

                ${foundFacility.features && foundFacility.features.length ? `
                    <div class="modal-detail-row">
                        <i class="fa-solid fa-list-check"></i>
                        <div>
                            <strong>Key Services & Amenities Offered</strong>
                            <div class="facility-tags-list" style="margin-top: 8px;">
                                ${foundFacility.features.map(feat => `<span class="feature-pill"><i class="fa-solid fa-check" style="color: var(--accent-emerald); font-size: 0.75rem;"></i> ${feat}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>

            <div class="modal-actions-row">
                <button type="button" class="btn-primary" style="flex: 1;" onclick="window.app.getDirections('${foundFacility.name.replace(/'/g, "\\'")}', '${foundArea.name}')">
                    <i class="fa-solid fa-diamond-turn-right"></i> Get Directions to ${foundArea.name}
                </button>
                <button type="button" class="btn-secondary" style="flex: 1;" onclick="window.app.callFacility('${foundFacility.phone}', '${foundFacility.name.replace(/'/g, "\\'")}')">
                    <i class="fa-solid fa-phone"></i> Call ${foundFacility.phone.split('/')[0]}
                </button>
            </div>
        `;

        this.facilityModal.classList.remove("hidden");
    }

    closeFacilityModal() {
        if (this.facilityModal) {
            this.facilityModal.classList.add("hidden");
        }
    }

    /* Simulated Phone Call */
    callFacility(phoneNumber, facilityName) {
        const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
        this.showToast(`Dialing ${facilityName} (${phoneNumber})...`, "info");
        window.location.href = `tel:${cleanNumber}`;
    }

    /* Google Maps Directions Navigation */
    getDirections(facilityName, areaName) {
        const query = encodeURIComponent(`${facilityName}, ${areaName}, Tumakuru, Karnataka`);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
        this.showToast(`Opening Tumakuru navigation for ${facilityName}...`, "info");
        window.open(mapsUrl, "_blank");
    }

    /* Toast Notification Utility */
    showToast(message, type = "info", duration = 3800) {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;

        let icon = "fa-circle-info";
        if (type === "success") icon = "fa-circle-check";
        if (type === "error") icon = "fa-circle-exclamation";

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = "toastSlideIn 0.3s ease reverse forwards";
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /* ======================================================================
       LAYOUTS & SITES CONTROLLER IMPLEMENTATION
       Shows the 2 layouts for any selected area, site length, width,
       sq.ft area, total costs, interactive map, and booking details page
       ====================================================================== */
    setupLayoutsAndBookingListeners() {
        // Back buttons on Layouts page
        const backToAreas = document.getElementById("layouts-back-to-areas-btn");
        if (backToAreas) {
            backToAreas.addEventListener("click", () => this.showAreasPage());
        }

        const viewFacilitiesBtn = document.getElementById("layouts-view-facilities-btn");
        if (viewFacilitiesBtn) {
            viewFacilitiesBtn.addEventListener("click", () => {
                if (this.selectedAreaId) {
                    this.navigateToArea(this.selectedAreaId);
                } else {
                    this.showAreasPage();
                }
            });
        }

        const logoutLayoutsBtn = document.getElementById("logout-btn-layouts");
        if (logoutLayoutsBtn) {
            logoutLayoutsBtn.addEventListener("click", () => this.handleLogout());
        }

        // Layout map recenter
        const recenterLayoutMapBtn = document.getElementById("btn-recenter-layout-map");
        if (recenterLayoutMapBtn) {
            recenterLayoutMapBtn.addEventListener("click", () => {
                if (!this.layoutMap || !window.SMART_CITY_LAYOUTS) return;
                const layout = SMART_CITY_LAYOUTS.find(l => l.id === this.selectedLayoutId);
                if (layout) {
                    this.layoutMap.flyTo([layout.lat, layout.lng], 16, { animate: true });
                }
            });
        }

        // Sites Status Filter Dropdown
        const sitesStatusFilter = document.getElementById("sites-status-filter");
        if (sitesStatusFilter) {
            sitesStatusFilter.addEventListener("change", (e) => {
                this.renderLayoutSites(this.selectedLayoutId, e.target.value);
            });
        }

        // Booking Page Listeners
        const bookingBackBtn = document.getElementById("booking-back-to-layouts-btn");
        if (bookingBackBtn) {
            bookingBackBtn.addEventListener("click", () => {
                this.showLayoutsPage(this.selectedAreaId, this.selectedLayoutId);
            });
        }

        const bookingTrailBackBtn = document.getElementById("booking-trail-back-btn");
        if (bookingTrailBackBtn) {
            bookingTrailBackBtn.addEventListener("click", () => {
                this.showLayoutsPage(this.selectedAreaId, this.selectedLayoutId);
            });
        }

        const logoutBookingBtn = document.getElementById("logout-btn-booking");
        if (logoutBookingBtn) {
            logoutBookingBtn.addEventListener("click", () => this.handleLogout());
        }

        // Booking Modal Close
        const bookingModalCloseBtn = document.getElementById("booking-modal-close-btn");
        const bookingModal = document.getElementById("booking-confirm-modal");
        if (bookingModalCloseBtn && bookingModal) {
            bookingModalCloseBtn.addEventListener("click", () => {
                bookingModal.classList.add("hidden");
            });
            bookingModal.addEventListener("click", (e) => {
                if (e.target === bookingModal) bookingModal.classList.add("hidden");
            });
        }

        // Blueprint Modal Close
        const blueprintModalCloseBtn = document.getElementById("blueprint-modal-close-btn");
        const blueprintModal = document.getElementById("site-blueprint-modal");
        if (blueprintModalCloseBtn && blueprintModal) {
            blueprintModalCloseBtn.addEventListener("click", () => {
                blueprintModal.classList.add("hidden");
            });
            blueprintModal.addEventListener("click", (e) => {
                if (e.target === blueprintModal) blueprintModal.classList.add("hidden");
            });
        }

        // Site Booking Form Submit
        const bookingForm = document.getElementById("site-booking-form");
        if (bookingForm) {
            bookingForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSiteBookingSubmit();
            });
        }
    }

    /**
     * Navigates to the Layouts & Sites Page for a selected area.
     * Dedicated to exploring 1 layout at a time with clean single layout view.
     */
    showLayoutsPage(areaId, preselectedLayoutId = null) {
        if (!window.SMART_CITY_LAYOUTS || !window.SMART_CITY_DATA) return;
        
        const area = SMART_CITY_DATA.areas.find(a => a.id === areaId) || SMART_CITY_DATA.areas[0];
        this.selectedAreaId = area.id;

        // Fetch layouts for this area
        const areaLayouts = SMART_CITY_LAYOUTS.filter(l => l.areaId === area.id);
        if (areaLayouts.length === 0) {
            this.showToast(`No layout data currently available for ${area.name}.`, "error");
            return;
        }

        this.selectedLayoutId = preselectedLayoutId || areaLayouts[0].id;
        const currentLayout = SMART_CITY_LAYOUTS.find(l => l.id === this.selectedLayoutId) || areaLayouts[0];

        // Update Header Titles & Breadcrumbs for 1 Layout View
        const headerTitle = document.getElementById("layouts-page-area-name");
        if (headerTitle) headerTitle.textContent = `${currentLayout.layoutName}`;

        const headerKannada = document.getElementById("layouts-page-area-kannada");
        if (headerKannada) headerKannada.textContent = `${currentLayout.kannadaLayoutName}`;

        const breadcrumbArea = document.getElementById("breadcrumb-layouts-area-name");
        if (breadcrumbArea) breadcrumbArea.textContent = `${area.name} \u2022 ${currentLayout.layoutName}`;

        const bannerTitle = document.getElementById("layouts-area-header-title");
        if (bannerTitle) bannerTitle.textContent = `${currentLayout.layoutName} (${area.name})`;

        const bannerKannada = document.getElementById("layouts-area-header-kannada");
        if (bannerKannada) bannerKannada.textContent = `${currentLayout.kannadaLayoutName} (${area.kannadaName})`;

        const bannerPincode = document.getElementById("layouts-area-pincode");
        if (bannerPincode) bannerPincode.textContent = `PIN: ${area.pincode}`;

        // Render Area Switcher Pills on Layouts page
        this.renderLayoutsAreaSwitcher();

        // Render Layout Switcher (Switch between Layout 1 & Layout 2)
        this.renderLayoutTabs(areaLayouts);

        // Render Active Layout Overview Card & Sites
        this.selectLayout(this.selectedLayoutId);

        // Show page
        this.showPage("layouts");
        this.showToast(`Exploring Layout: ${currentLayout.layoutName}`, "info");
    }

    renderLayoutsAreaSwitcher() {
        const container = document.getElementById("layouts-area-switcher-pills");
        if (!container || !window.SMART_CITY_DATA) return;
        container.innerHTML = "";

        SMART_CITY_DATA.areas.forEach(area => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `area-pill-btn ${area.id === this.selectedAreaId ? 'active' : ''}`;
            btn.innerHTML = `<i class="fa-solid fa-location-dot"></i> <span>${area.name}</span>`;
            btn.addEventListener("click", () => {
                this.showLayoutsPage(area.id);
            });
            container.appendChild(btn);
        });
    }

    renderLayoutTabs(areaLayouts) {
        const container = document.getElementById("layout-tab-buttons");
        if (!container) return;
        container.innerHTML = "";

        areaLayouts.forEach((layout, index) => {
            const btn = document.createElement("button");
            btn.type = "button";
            const isActive = layout.id === this.selectedLayoutId;
            btn.className = `layout-tab-btn ${isActive ? 'active' : ''}`;
            btn.innerHTML = `
                <div class="layout-tab-badge">Layout 0${index + 1}</div>
                <div>
                    <div class="layout-tab-title">${layout.layoutName}</div>
                    <div class="layout-tab-sub">${layout.totalSites} Planned Sites &bull; ${layout.availableSites} Available</div>
                </div>
            `;
            btn.addEventListener("click", () => {
                this.selectLayout(layout.id);
            });
            container.appendChild(btn);
        });
    }

    selectLayout(layoutId) {
        this.selectedLayoutId = layoutId;
        const layout = SMART_CITY_LAYOUTS.find(l => l.id === layoutId);
        if (!layout) return;

        // Update header and banner titles dynamically for this single layout
        const headerTitle = document.getElementById("layouts-page-area-name");
        if (headerTitle) headerTitle.textContent = `${layout.layoutName}`;

        const headerKannada = document.getElementById("layouts-page-area-kannada");
        if (headerKannada) headerKannada.textContent = `${layout.kannadaLayoutName}`;

        const breadcrumbArea = document.getElementById("breadcrumb-layouts-area-name");
        if (breadcrumbArea) breadcrumbArea.textContent = `${layout.areaName} \u2022 ${layout.layoutName}`;

        const bannerTitle = document.getElementById("layouts-area-header-title");
        if (bannerTitle) bannerTitle.textContent = `${layout.layoutName} (${layout.areaName})`;

        const bannerKannada = document.getElementById("layouts-area-header-kannada");
        if (bannerKannada) bannerKannada.textContent = `${layout.kannadaLayoutName} (${layout.kannadaAreaName})`;

        // Highlight active tab
        const buttons = document.querySelectorAll(".layout-tab-btn");
        const areaLayouts = SMART_CITY_LAYOUTS.filter(l => l.areaId === this.selectedAreaId);
        buttons.forEach((btn, idx) => {
            if (areaLayouts[idx] && areaLayouts[idx].id === layoutId) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Render Active Layout Overview Card
        const overviewEl = document.getElementById("active-layout-overview");
        if (overviewEl) {
            overviewEl.innerHTML = `
                <div class="layout-info-col">
                    <div class="layout-meta-badges">
                        <span class="meta-pill-tag"><i class="fa-solid fa-circle-check" style="color: #0284c7;"></i> ${layout.approval}</span>
                        <span class="meta-pill-tag tag-rera"><i class="fa-solid fa-stamp"></i> RERA: ${layout.reraNumber.split('/')[4] || 'Approved'}</span>
                        <span class="meta-pill-tag tag-rate"><i class="fa-solid fa-indian-rupee-sign"></i> Base ₹${layout.baseRatePerSqFt.toLocaleString('en-IN')}/Sq.Ft</span>
                    </div>
                    <h3>${layout.layoutName}</h3>
                    <div class="kannada-sub">${layout.kannadaLayoutName}</div>
                    <p style="color: var(--text-secondary); font-size: 0.92rem; line-height: 1.6; margin-bottom: 14px;">
                        ${layout.description}
                    </p>
                    <div class="layout-amenities-pills">
                        ${layout.amenities.map(a => `<span class="amenity-chip"><i class="fa-solid fa-check" style="color: #059669; font-size: 0.75rem;"></i> ${a}</span>`).join('')}
                    </div>
                </div>
                <div class="layout-hero-img-wrap">
                    <img src="${layout.image}" alt="${layout.layoutName}">
                    <div class="layout-img-overlay-badge">
                        <i class="fa-solid fa-layer-group"></i> ${layout.totalSites} Sites &bull; ${layout.availableSites} Ready for Booking
                    </div>
                </div>
            `;
        }

        // Render Interactive Map for this Layout
        setTimeout(() => {
            this.initOrUpdateLayoutMap(layout);
        }, 100);

        // Render Sites Cards
        const statusFilter = document.getElementById("sites-status-filter")?.value || "all";
        this.renderLayoutSites(layoutId, statusFilter);
    }

    initOrUpdateLayoutMap(layout) {
        const mapContainer = document.getElementById("layout-map-container");
        if (!mapContainer || typeof L === "undefined") return;

        try {
            if (!this.layoutMap) {
                this.layoutMap = L.map("layout-map-container", {
                    zoomControl: true,
                    attributionControl: true
                }).setView([layout.lat, layout.lng], 16);

                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: '&copy; OpenStreetMap | Smart City Tumakuru Planning',
                    maxZoom: 19
                }).addTo(this.layoutMap);
            } else {
                this.layoutMap.invalidateSize();
                this.layoutMap.setView([layout.lat, layout.lng], 16);
            }

            // Clear old markers
            this.layoutMapMarkers.forEach(m => this.layoutMap.removeLayer(m));
            this.layoutMapMarkers = [];

            // Add Layout Center Boundary Circle
            const boundaryCircle = L.circle([layout.lat, layout.lng], {
                color: '#0284c7',
                fillColor: '#38bdf8',
                fillOpacity: 0.12,
                radius: 120
            }).addTo(this.layoutMap);
            this.layoutMapMarkers.push(boundaryCircle);

            // Add Interactive Dot Markers for each site in layout:
            // Available = Green dot mark (#10b981)
            // Booked = Red dot mark (#ef4444)
            // Reserved = Orange dot mark (#f59e0b)
            layout.sites.forEach(site => {
                let pinColor = "#10b981"; // Green (Available)
                let dotClass = "dot-available";
                if (site.status === "Booked") {
                    pinColor = "#ef4444"; // Red (Booked)
                    dotClass = "dot-booked";
                } else if (site.status === "Reserved") {
                    pinColor = "#f59e0b"; // Orange (Reserved)
                    dotClass = "dot-reserved";
                }

                const siteIcon = L.divIcon({
                    className: "site-dot-marker-container",
                    html: `
                        <div class="site-dot-pin ${dotClass}" title="${site.siteNumber} (${site.status})">
                        </div>
                        <div class="site-dot-label-pill">
                            ${site.siteNumber.split(' ')[0]} • ${site.dimensionSqFt} sq.ft
                        </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                const popupHtml = `
                    <div class="map-popup-card" style="min-width: 260px;">
                        <div class="popup-header" style="align-items: center;">
                            <div class="popup-icon" style="background: ${pinColor}; width: 34px; height: 34px; border-radius: 50%;">
                                <span style="display: block; width: 14px; height: 14px; border-radius: 50%; background: #ffffff;"></span>
                            </div>
                            <div>
                                <h4 class="popup-title">${site.siteNumber}</h4>
                                <span style="font-size: 0.75rem; font-weight: 800; color: ${pinColor}; text-transform: uppercase;">
                                    ● ${site.status} Site
                                </span>
                            </div>
                        </div>

                        <!-- 1 Square Foot Cost Detail Box -->
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px; margin: 8px 0; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.76rem; font-weight: 700; color: #166534;"><i class="fa-solid fa-tag"></i> 1 Sq.Ft Cost:</span>
                            <span style="font-size: 0.95rem; font-weight: 800; color: #15803d;">₹${site.costPerSqFt.toLocaleString('en-IN')} / Sq.Ft</span>
                        </div>

                        <!-- Physical Bounds & Blueprint Specifications -->
                        <div style="padding: 8px 0; font-size: 0.82rem; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; margin-bottom: 8px; line-height: 1.6;">
                            <div><strong>Physical Bounds:</strong> ${site.length}' (Length) &times; ${site.width}' (Width)</div>
                            <div><strong>Total Area:</strong> <span style="color: #0284c7; font-weight: 800;">${site.dimensionSqFt} Square Feet</span></div>
                            <div><strong>Facing Direction:</strong> ${site.facing}</div>
                            <div><strong>Frontage Road:</strong> ${site.roadWidth}</div>
                            <div><strong>Total Cost:</strong> <span style="color: #059669; font-weight: 800;">₹${site.totalCost.toLocaleString('en-IN')}</span> <span style="font-size: 0.72rem; color: #64748b;">(${site.dimensionSqFt} &times; ₹${site.costPerSqFt.toLocaleString('en-IN')})</span></div>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <button type="button" class="btn-primary" style="flex: 1; padding: 8px 6px; font-size: 0.78rem; font-weight: 700; border-radius: 6px; background: linear-gradient(135deg, #0284c7, #0369a1);" onclick="window.app.showSiteBlueprintModal('${site.id}')">
                                <i class="fa-solid fa-ruler-combined"></i> View Blueprint
                            </button>
                            <button type="button" class="btn-primary" style="flex: 1; padding: 8px 6px; font-size: 0.78rem; font-weight: 700; border-radius: 6px; background: linear-gradient(135deg, #059669, #047857);" onclick="window.app.showSiteBookingPage('${site.id}')">
                                <i class="fa-solid fa-file-signature"></i> Book Site &rarr;
                            </button>
                        </div>
                    </div>
                `;

                const marker = L.marker([site.lat, site.lng], { icon: siteIcon }).addTo(this.layoutMap);
                marker.bindPopup(popupHtml);
                this.layoutMapMarkers.push(marker);
            });

            setTimeout(() => {
                if (this.layoutMap) this.layoutMap.invalidateSize();
            }, 250);
        } catch (e) {
            console.error("Layout map error:", e);
        }
    }

    renderLayoutSites(layoutId, filter = "all") {
        const grid = document.getElementById("sites-cards-grid");
        if (!grid || !window.SMART_CITY_LAYOUTS) return;
        grid.innerHTML = "";

        const layout = SMART_CITY_LAYOUTS.find(l => l.id === layoutId);
        if (!layout) return;

        let sites = [...layout.sites];
        if (filter === "Available") {
            sites = sites.filter(s => s.status === "Available");
        } else if (filter === "Corner") {
            sites = sites.filter(s => s.corner === true);
        }

        if (sites.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 36px; text-align: center; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <i class="fa-solid fa-filter" style="font-size: 2.2rem; color: #94a3b8; margin-bottom: 12px;"></i>
                    <h4 style="font-weight: 700; color: #1e293b;">No Sites Match Filter</h4>
                    <p style="color: #64748b; font-size: 0.9rem;">Try selecting 'All Sites' to view all plots in this layout.</p>
                </div>
            `;
            return;
        }

        sites.forEach(site => {
            const card = document.createElement("div");
            card.className = "site-planning-card";

            let statusClass = "status-badge-available";
            if (site.status === "Booked") statusClass = "status-badge-booked";
            if (site.status === "Reserved") statusClass = "status-badge-reserved";

            card.innerHTML = `
                <div class="site-card-top-img">
                    <img src="${site.sitePlanImage}" alt="${site.siteNumber}">
                    <div class="site-sqft-hero-badge">
                        <i class="fa-solid fa-vector-square"></i>
                        <span>${site.dimensionSqFt} Sq.Ft</span>
                    </div>
                    <span class="site-status-pill-badge ${statusClass}">
                        ${site.status}
                    </span>
                </div>

                <div class="site-card-body">
                    <div class="site-title-row">
                        <h4 class="site-number-title">${site.siteNumber}</h4>
                        <span class="site-category-sub">${site.facing}</span>
                    </div>

                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
                        <i class="fa-solid fa-road"></i> Front Road: <strong>${site.roadWidth}</strong> &bull; ${site.category}
                    </div>

                    <!-- Site Dimensions Callout Box: Length, Width & Sq.Ft -->
                    <div class="site-specs-box">
                        <div class="spec-cell">
                            <span class="spec-label"><i class="fa-solid fa-ruler-horizontal"></i> Length</span>
                            <span class="spec-value">${site.length} Feet</span>
                        </div>
                        <div class="spec-cell">
                            <span class="spec-label"><i class="fa-solid fa-ruler-vertical"></i> Width</span>
                            <span class="spec-value">${site.width} Feet</span>
                        </div>
                        <div class="spec-cell">
                            <span class="spec-label"><i class="fa-solid fa-expand"></i> Dimensions</span>
                            <span class="spec-value">${site.dimension}</span>
                        </div>
                        <div class="spec-cell">
                            <span class="spec-label"><i class="fa-solid fa-chart-area"></i> Total Area</span>
                            <span class="spec-value highlight-sqft">${site.dimensionSqFt} Sq.Ft</span>
                        </div>
                    </div>

                    <!-- Pricing & Click to View Next Page -->
                    <div class="site-pricing-row">
                        <div class="price-col">
                            <span class="rate-sub">₹${site.costPerSqFt.toLocaleString('en-IN')}/sq.ft</span>
                            <div class="total-cost">₹${site.totalCost.toLocaleString('en-IN')}</div>
                        </div>

                        <button type="button" class="site-book-btn">
                            <span>Book Site</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;

            // Clicking site card opens the next page: Site Booking Details
            card.addEventListener("click", () => {
                this.showSiteBookingPage(site.id);
            });

            grid.appendChild(card);
        });
    }

    /**
     * Navigates to the Site Booking Details Page (Page 6).
     * Opens when clicking any site from the layouts page.
     */
    showSiteBookingPage(siteId) {
        if (!window.SMART_CITY_LAYOUTS) return;
        this.selectedSiteId = siteId;

        // Find site and layout
        let foundSite = null;
        let foundLayout = null;

        for (const layout of SMART_CITY_LAYOUTS) {
            const s = layout.sites.find(item => item.id === siteId);
            if (s) {
                foundSite = s;
                foundLayout = layout;
                break;
            }
        }

        if (!foundSite || !foundLayout) {
            this.showToast("Site not found.", "error");
            return;
        }

        this.selectedLayoutId = foundLayout.id;
        this.selectedAreaId = foundLayout.areaId;

        // Navbar & Breadcrumb updates
        const navSiteName = document.getElementById("booking-navbar-site-name");
        if (navSiteName) navSiteName.textContent = `${foundSite.siteNumber} (${foundSite.dimensionSqFt} Sq.Ft)`;

        const navLayoutName = document.getElementById("booking-navbar-layout-name");
        if (navLayoutName) navLayoutName.textContent = `${foundLayout.layoutName} • ${foundLayout.areaName}`;

        const breadcrumbSiteTitle = document.getElementById("breadcrumb-booking-site-title");
        if (breadcrumbSiteTitle) breadcrumbSiteTitle.textContent = `${foundSite.siteNumber}`;

        const areaLink = document.getElementById("breadcrumb-booking-area-link");
        if (areaLink) areaLink.textContent = `${foundLayout.areaName} Layouts`;

        // Render Hero Banner Card
        const heroCard = document.getElementById("booking-hero-card");
        if (heroCard) {
            heroCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <div class="layout-meta-badges">
                            <span class="meta-pill-tag"><i class="fa-solid fa-map-pin"></i> ${foundLayout.areaName}</span>
                            <span class="meta-pill-tag tag-rera"><i class="fa-solid fa-circle-check"></i> ${foundSite.khata}</span>
                            <span class="site-status-pill-badge ${foundSite.status === 'Available' ? 'status-badge-available' : 'status-badge-booked'}" style="position: static;">
                                ${foundSite.status}
                            </span>
                        </div>
                        <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 6px 0;">
                            ${foundSite.siteNumber} &bull; ${foundSite.category}
                        </h2>
                        <div style="color: var(--primary-dark); font-weight: 700; font-size: 1rem; margin-bottom: 4px;">
                            ${foundLayout.layoutName} (${foundLayout.kannadaLayoutName})
                        </div>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">
                            ${foundLayout.tagline}
                        </p>
                    </div>

                    <div style="text-align: right; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px 20px; border-radius: 12px;">
                        <span style="font-size: 0.78rem; font-weight: 700; color: #166534; text-transform: uppercase;">Total Plot Value</span>
                        <div style="font-size: 1.7rem; font-weight: 800; color: #15803d; line-height: 1.2;">
                            ₹${foundSite.totalCost.toLocaleString('en-IN')}
                        </div>
                        <span style="font-size: 0.76rem; color: #4b5563;">@ ₹${foundSite.costPerSqFt.toLocaleString('en-IN')} / sq.ft</span>
                    </div>
                </div>
            `;
        }

        // Render 2D Architectural Blueprint Diagram with Verified Bounds & 1 Sq.Ft Cost
        const blueprintBox = document.getElementById("plot-blueprint-diagram");
        if (blueprintBox) {
            blueprintBox.innerHTML = `
                <div class="blueprint-grid-box">
                    <div class="dimension-tag-top">
                        <i class="fa-solid fa-ruler-horizontal"></i> Width Frontage: ${foundSite.width} Feet (${foundSite.facing})
                    </div>
                    <div class="dimension-tag-side">
                        <i class="fa-solid fa-ruler-vertical"></i> Length Depth: ${foundSite.length} Feet
                    </div>
                    <div class="blueprint-center-badge">
                        <i class="fa-solid fa-vector-square" style="font-size: 2.2rem; color: #38bdf8; margin-bottom: 6px;"></i>
                        <span class="blueprint-sqft-number">${foundSite.dimensionSqFt} SQ.FT</span>
                        <span class="blueprint-sqft-text" style="color: #cbd5e1; font-weight: 700; margin: 4px 0;">
                            ${foundSite.dimension} &bull; ${foundSite.facing}
                        </span>
                        
                        <!-- 1 Square Foot Cost Highlight Badge in Blueprint -->
                        <div style="margin-top: 8px; background: rgba(16, 185, 129, 0.25); border: 1px solid #10b981; padding: 6px 16px; border-radius: 9999px; color: #6ee7b7; font-weight: 800; font-size: 0.95rem;">
                            <i class="fa-solid fa-tag"></i> 1 Square Foot Cost: ₹${foundSite.costPerSqFt.toLocaleString('en-IN')}
                        </div>

                        <div style="margin-top: 8px; font-size: 0.78rem; background: rgba(56, 189, 248, 0.2); padding: 4px 12px; border-radius: 9999px; color: #7dd3fc;">
                            <i class="fa-solid fa-road"></i> Verified Frontage Road: ${foundSite.roadWidth}
                        </div>
                    </div>
                </div>

                <!-- Verified Physical Bounds Summary Strip -->
                <div style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 12px 16px; margin-top: 14px; font-size: 0.85rem; color: #e2e8f0; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
                    <div><span style="color: #94a3b8;">Physical Bounds:</span> <strong>${foundSite.length}' Length &times; ${foundSite.width}' Width</strong></div>
                    <div><span style="color: #94a3b8;">Facing Direction:</span> <strong style="color: #38bdf8;">${foundSite.facing}</strong></div>
                    <div><span style="color: #94a3b8;">1 Sq.Ft Rate:</span> <strong style="color: #10b981;">₹${foundSite.costPerSqFt.toLocaleString('en-IN')} / sq.ft</strong></div>
                    <div><span style="color: #94a3b8;">Frontage Road:</span> <strong>${foundSite.roadWidth}</strong></div>
                </div>
            `;
        }

        // Render Key Metrics Grid
        const metricsGrid = document.getElementById("blueprint-metrics-grid");
        if (metricsGrid) {
            metricsGrid.innerHTML = `
                <div class="b-metric-item">
                    <span class="b-metric-label">1 Sq.Ft Cost</span>
                    <div class="b-metric-value" style="color: #059669; font-weight: 800;">₹${foundSite.costPerSqFt.toLocaleString('en-IN')}</div>
                </div>
                <div class="b-metric-item">
                    <span class="b-metric-label">Physical Length</span>
                    <div class="b-metric-value">${foundSite.length} ft</div>
                </div>
                <div class="b-metric-item">
                    <span class="b-metric-label">Physical Width</span>
                    <div class="b-metric-value">${foundSite.width} ft</div>
                </div>
                <div class="b-metric-item">
                    <span class="b-metric-label">Total Sq.Ft Area</span>
                    <div class="b-metric-value" style="color: var(--primary);">${foundSite.dimensionSqFt}</div>
                </div>
                <div class="b-metric-item">
                    <span class="b-metric-label">Facing Direction</span>
                    <div class="b-metric-value" style="font-size: 0.95rem;">${foundSite.facing.split(' ')[0]}</div>
                </div>
            `;
        }

        // Render Site Imagery Grid with square feet overlay tags
        const imagesGrid = document.getElementById("site-images-grid");
        if (imagesGrid) {
            imagesGrid.innerHTML = `
                <div class="site-photo-card">
                    <img src="${foundSite.sitePlanImage}" alt="Site Layout Angle 1">
                    <div class="photo-sqft-label">
                        <i class="fa-solid fa-expand"></i> ${foundSite.dimensionSqFt} Sq.Ft &bull; ${foundSite.dimension}
                    </div>
                </div>
                <div class="site-photo-card">
                    <img src="${foundLayout.image}" alt="Site Aerial Surrounding">
                    <div class="photo-sqft-label">
                        <i class="fa-solid fa-road"></i> ${foundSite.roadWidth} Frontage &bull; ${foundLayout.areaName}
                    </div>
                </div>
            `;
        }

        // Render Booking Cost Breakdown Card
        const costCard = document.getElementById("booking-cost-breakdown");
        if (costCard) {
            const regEst = Math.round(foundSite.totalCost * 0.05); // Approx 5% stamp duty & registration
            const khataTransfer = 2500;
            const totalWithRegistration = foundSite.totalCost + regEst + khataTransfer;

            costCard.innerHTML = `
                <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 12px;">
                    <i class="fa-solid fa-receipt" style="color: var(--primary);"></i> Price & Payment Breakdown
                </h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 8px 0; color: var(--text-secondary);">Plot Area:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 700;">${foundSite.dimensionSqFt} Sq.Ft (${foundSite.length}' &times; ${foundSite.width}')</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 8px 0; color: var(--text-secondary);">Rate per Sq.Ft:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 700;">₹${foundSite.costPerSqFt.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 8px 0; color: var(--text-secondary);">Basic Site Cost:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 700; color: var(--text-primary);">₹${foundSite.totalCost.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 8px 0; color: var(--text-secondary);">Est. Stamp Duty & Reg (5%):</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #475569;">₹${regEst.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style="border-bottom: 2px solid var(--border-light);">
                        <td style="padding: 8px 0; color: var(--text-secondary);">E-Khata Transfer Fee:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #475569;">₹${khataTransfer.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style="font-weight: 800; font-size: 1.05rem;">
                        <td style="padding: 12px 0; color: var(--text-primary);">Estimated Total:</td>
                        <td style="padding: 12px 0; text-align: right; color: #059669;">₹${totalWithRegistration.toLocaleString('en-IN')}</td>
                    </tr>
                </table>

                <div style="background: #eff6ff; border: 1px dashed #60a5fa; border-radius: 8px; padding: 12px; margin-top: 14px; text-align: center;">
                    <span style="font-size: 0.78rem; font-weight: 700; color: #1e40af; text-transform: uppercase;">Provisional Booking Token</span>
                    <div style="font-size: 1.45rem; font-weight: 800; color: #1d4ed8; margin: 2px 0;">
                        ₹${foundSite.bookingAdvance.toLocaleString('en-IN')}
                    </div>
                    <span style="font-size: 0.74rem; color: #475569;">Fully refundable within 15 days if not satisfied</span>
                </div>
            `;
        }

        // Populate hidden fields in Booking Form
        const siteIdInput = document.getElementById("booking-site-id");
        if (siteIdInput) siteIdInput.value = foundSite.id;

        const layoutIdInput = document.getElementById("booking-layout-id");
        if (layoutIdInput) layoutIdInput.value = foundLayout.id;

        // Auto-fill applicant from session
        if (this.currentUser) {
            const nameInput = document.getElementById("applicant-name");
            if (nameInput) nameInput.value = this.currentUser.name || "Ramesh Kumar";
        }

        // Render Leaflet Map for this individual site
        setTimeout(() => {
            this.initBookingSiteMap(foundSite, foundLayout);
        }, 150);

        // Show page
        this.showPage("booking");
        this.showToast(`Opened booking details for ${foundSite.siteNumber}`, "info");
    }

    initBookingSiteMap(site, layout) {
        const container = document.getElementById("booking-site-map-container");
        if (!container || typeof L === "undefined") return;

        try {
            if (!this.bookingSiteMap) {
                this.bookingSiteMap = L.map("booking-site-map-container", {
                    zoomControl: true,
                    attributionControl: true
                }).setView([site.lat, site.lng], 17);

                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: '&copy; OpenStreetMap | Smart City Tumakuru',
                    maxZoom: 19
                }).addTo(this.bookingSiteMap);
            } else {
                this.bookingSiteMap.invalidateSize();
                this.bookingSiteMap.setView([site.lat, site.lng], 17);
            }

            // Remove existing layers
            this.bookingSiteMap.eachLayer(layer => {
                if (layer instanceof L.Marker || layer instanceof L.Polygon || layer instanceof L.Rectangle || layer instanceof L.Circle) {
                    this.bookingSiteMap.removeLayer(layer);
                }
            });

            // Draw Site Boundary Rectangle
            const bounds = [
                [site.lat - 0.00035, site.lng - 0.00045],
                [site.lat + 0.00035, site.lng + 0.00045]
            ];
            L.rectangle(bounds, {
                color: "#0284c7",
                weight: 2,
                fillColor: "#38bdf8",
                fillOpacity: 0.25
            }).addTo(this.bookingSiteMap);

            // Add dot mark according to status:
            // Available = Green (#10b981)
            // Booked = Red (#ef4444)
            // Reserved = Orange (#f59e0b)
            let pinColor = "#10b981";
            let dotClass = "dot-available";
            if (site.status === "Booked") {
                pinColor = "#ef4444";
                dotClass = "dot-booked";
            } else if (site.status === "Reserved") {
                pinColor = "#f59e0b";
                dotClass = "dot-reserved";
            }

            const sitePin = L.divIcon({
                className: "site-dot-marker-container",
                html: `
                    <div class="site-dot-pin ${dotClass}" style="width: 26px; height: 26px;"></div>
                    <div class="site-dot-label-pill" style="top: -26px;">
                        ${site.siteNumber} • ${site.dimensionSqFt} Sq.Ft (${site.status})
                    </div>
                `,
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            });

            const marker = L.marker([site.lat, site.lng], { icon: sitePin }).addTo(this.bookingSiteMap);
            marker.bindPopup(`
                <div style="font-family: inherit; font-size: 0.85rem; line-height: 1.6; padding: 4px; min-width: 250px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px;">
                        <strong style="color: #0284c7; font-size: 1rem;">${site.siteNumber}</strong>
                        <span style="font-size: 0.74rem; font-weight: 800; color: ${pinColor}; text-transform: uppercase;">● ${site.status}</span>
                    </div>
                    <div style="color: #475569; font-weight: 600; font-size: 0.82rem;">${layout.layoutName}</div>

                    <!-- 1 Sq.Ft Cost Highlight in Booking Map -->
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 5px 8px; margin: 6px 0; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.74rem; font-weight: 700; color: #166534;"><i class="fa-solid fa-tag"></i> 1 Sq.Ft Cost:</span>
                        <strong style="color: #15803d; font-size: 0.92rem;">₹${site.costPerSqFt.toLocaleString('en-IN')} / Sq.Ft</strong>
                    </div>

                    <div style="margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 0.82rem;">
                        <div><strong>Verified Bounds:</strong> ${site.length}' (Length) &times; ${site.width}' (Width)</div>
                        <div><strong>Facing Direction:</strong> ${site.facing}</div>
                        <div><strong>Road Frontage:</strong> ${site.roadWidth}</div>
                        <div><strong>Total Area:</strong> <strong style="color: #0284c7;">${site.dimensionSqFt} Square Feet</strong></div>
                        <div><strong>Total Cost:</strong> <strong style="color: #059669; font-size: 0.95rem;">₹${site.totalCost.toLocaleString('en-IN')}</strong></div>
                    </div>
                </div>
            `).openPopup();

            setTimeout(() => {
                if (this.bookingSiteMap) this.bookingSiteMap.invalidateSize();
            }, 250);
        } catch (e) {
            console.error("Booking site map error:", e);
        }
    }

    /**
     * Handles Site Booking Application Submission
     */
    handleSiteBookingSubmit() {
        const siteId = document.getElementById("booking-site-id")?.value;
        const applicantName = document.getElementById("applicant-name")?.value.trim();
        const applicantPhone = document.getElementById("applicant-phone")?.value.trim();
        const applicantEmail = document.getElementById("applicant-email")?.value.trim();
        const paymentMode = document.getElementById("payment-mode")?.value;

        if (!applicantName || !applicantPhone || !applicantEmail) {
            this.showToast("Please fill all mandatory application fields.", "error");
            return;
        }

        // Find site details
        let foundSite = null;
        let foundLayout = null;
        for (const layout of SMART_CITY_LAYOUTS) {
            const s = layout.sites.find(item => item.id === siteId);
            if (s) {
                foundSite = s;
                foundLayout = layout;
                break;
            }
        }

        if (!foundSite || !foundLayout) return;

        // Generate Booking Reference Number
        const bookingRef = "TUM-LOT-" + Math.floor(100000 + Math.random() * 900000);
        const currentDate = new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        // Show Booking Slip in Confirmation Modal
        const modalBody = document.getElementById("booking-confirm-modal-body");
        const modal = document.getElementById("booking-confirm-modal");

        if (modalBody && modal) {
            modalBody.innerHTML = `
                <div class="booking-slip-modal-box">
                    <div class="slip-success-icon">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <h3 style="font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-bottom: 4px;">
                        Site Booking Confirmed!
                    </h3>
                    <p style="color: #64748b; font-size: 0.88rem;">
                        Provisional allotment registered under Tumakuru Smart City Urban Mission.
                    </p>

                    <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px; margin: 16px 0; font-family: monospace; font-size: 1rem; font-weight: 700; color: #0284c7;">
                        Reference No: ${bookingRef}
                    </div>

                    <table class="slip-receipt-table">
                        <tr>
                            <td>Applicant Name:</td>
                            <td>${applicantName}</td>
                        </tr>
                        <tr>
                            <td>Contact Phone:</td>
                            <td>${applicantPhone}</td>
                        </tr>
                        <tr>
                            <td>Selected Layout:</td>
                            <td>${foundLayout.layoutName} (${foundLayout.areaName})</td>
                        </tr>
                        <tr>
                            <td>Site Allotment:</td>
                            <td>${foundSite.siteNumber} (${foundSite.category})</td>
                        </tr>
                        <tr>
                            <td>Site Dimensions:</td>
                            <td>${foundSite.length}' Length &times; ${foundSite.width}' Width (${foundSite.facing})</td>
                        </tr>
                        <tr>
                            <td>Total Plot Area:</td>
                            <td><strong style="color: #0284c7;">${foundSite.dimensionSqFt} Square Feet</strong></td>
                        </tr>
                        <tr>
                            <td>Total Site Cost:</td>
                            <td>₹${foundSite.totalCost.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td>Booking Advance:</td>
                            <td><strong style="color: #059669;">₹${foundSite.bookingAdvance.toLocaleString('en-IN')}</strong> (${paymentMode})</td>
                        </tr>
                        <tr>
                            <td>Booking Date:</td>
                            <td>${currentDate}</td>
                        </tr>
                    </table>

                    <div style="display: flex; gap: 10px; margin-top: 18px;">
                        <button type="button" class="btn-primary" style="flex: 1;" onclick="window.print()">
                            <i class="fa-solid fa-print"></i> Print Booking Slip
                        </button>
                        <button type="button" class="btn-secondary" style="flex: 1;" onclick="document.getElementById('booking-confirm-modal').classList.add('hidden')">
                            Close
                        </button>
                    </div>
                </div>
            `;
            modal.classList.remove("hidden");
        }

        // Update site status to Booked in runtime
        foundSite.status = "Booked";
        this.showToast(`Site ${foundSite.siteNumber} booked successfully! Booking Ref: ${bookingRef}`, "success", 5000);
    }

    /**
     * Opens the Site Dimensions & Square Feet Blueprint modal
     * when clicking a site dot on the map.
     */
    showSiteBlueprintModal(siteId) {
        if (!window.SMART_CITY_LAYOUTS) return;

        let foundSite = null;
        let foundLayout = null;
        for (const layout of SMART_CITY_LAYOUTS) {
            const s = layout.sites.find(item => item.id === siteId);
            if (s) {
                foundSite = s;
                foundLayout = layout;
                break;
            }
        }

        if (!foundSite || !foundLayout) return;

        const modal = document.getElementById("site-blueprint-modal");
        const modalBody = document.getElementById("site-blueprint-modal-body");
        if (!modal || !modalBody) return;

        let pinColor = "#10b981";
        if (foundSite.status === "Booked") pinColor = "#ef4444";
        if (foundSite.status === "Reserved") pinColor = "#f59e0b";

        modalBody.innerHTML = `
            <div style="padding: 10px 4px;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 4px;">
                            <span class="site-dot-pin ${foundSite.status === 'Available' ? 'dot-available' : (foundSite.status === 'Booked' ? 'dot-booked' : 'dot-reserved')}" style="width: 14px; height: 14px;"></span>
                            <span style="font-size: 0.76rem; font-weight: 800; color: ${pinColor}; text-transform: uppercase;">● ${foundSite.status} Site</span>
                            <span class="meta-pill-tag" style="padding: 2px 8px; font-size: 0.72rem;">${foundLayout.areaName}</span>
                        </div>
                        <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 0;">
                            ${foundSite.siteNumber} &bull; Blueprint
                        </h2>
                        <div style="color: var(--primary-dark); font-weight: 700; font-size: 0.92rem; margin-top: 2px;">
                            ${foundLayout.layoutName}
                        </div>
                    </div>

                    <div style="text-align: right; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 14px; border-radius: 8px;">
                        <span style="font-size: 0.72rem; font-weight: 700; color: #166534; text-transform: uppercase;">1 Sq.Ft Rate</span>
                        <div style="font-size: 1.25rem; font-weight: 800; color: #15803d; line-height: 1.2;">
                            ₹${foundSite.costPerSqFt.toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>

                <!-- 2D Architectural Blueprint Diagram -->
                <div class="plot-blueprint-diagram" style="margin-bottom: 16px;">
                    <div class="blueprint-grid-box" style="padding: 24px 16px;">
                        <div class="dimension-tag-top">
                            <i class="fa-solid fa-ruler-horizontal"></i> Width Frontage: ${foundSite.width} Feet (${foundSite.facing})
                        </div>
                        <div class="dimension-tag-side">
                            <i class="fa-solid fa-ruler-vertical"></i> Length Depth: ${foundSite.length} Feet
                        </div>
                        <div class="blueprint-center-badge">
                            <i class="fa-solid fa-vector-square" style="font-size: 2rem; color: #38bdf8; margin-bottom: 4px;"></i>
                            <span class="blueprint-sqft-number">${foundSite.dimensionSqFt} SQ.FT</span>
                            <span class="blueprint-sqft-text" style="color: #cbd5e1; font-weight: 700;">
                                ${foundSite.dimension} &bull; ${foundSite.facing}
                            </span>
                            
                            <div style="margin-top: 8px; background: rgba(16, 185, 129, 0.25); border: 1px solid #10b981; padding: 4px 14px; border-radius: 9999px; color: #6ee7b7; font-weight: 800; font-size: 0.9rem;">
                                <i class="fa-solid fa-tag"></i> 1 Square Foot Cost: ₹${foundSite.costPerSqFt.toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Verified Physical Bounds & Metrics -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 18px;">
                    <div class="b-metric-item" style="padding: 10px;">
                        <span class="b-metric-label">1 Sq.Ft Cost</span>
                        <div class="b-metric-value" style="color: #059669; font-size: 1.05rem;">₹${foundSite.costPerSqFt.toLocaleString('en-IN')}</div>
                    </div>
                    <div class="b-metric-item" style="padding: 10px;">
                        <span class="b-metric-label">Physical Bounds</span>
                        <div class="b-metric-value" style="font-size: 0.95rem;">${foundSite.length}' &times; ${foundSite.width}'</div>
                    </div>
                    <div class="b-metric-item" style="padding: 10px;">
                        <span class="b-metric-label">Total Sq.Ft</span>
                        <div class="b-metric-value" style="color: var(--primary); font-size: 1.05rem;">${foundSite.dimensionSqFt}</div>
                    </div>
                    <div class="b-metric-item" style="padding: 10px;">
                        <span class="b-metric-label">Total Cost</span>
                        <div class="b-metric-value" style="color: #059669; font-size: 1.05rem;">₹${foundSite.totalCost.toLocaleString('en-IN')}</div>
                    </div>
                </div>

                <!-- Actions -->
                <div style="display: flex; gap: 10px;">
                    <button type="button" class="btn-primary" style="flex: 1; padding: 12px; font-weight: 700; background: linear-gradient(135deg, #059669, #047857);" onclick="document.getElementById('site-blueprint-modal').classList.add('hidden'); window.app.showSiteBookingPage('${foundSite.id}');">
                        <i class="fa-solid fa-file-signature"></i> Proceed to Site Booking &rarr;
                    </button>
                    <button type="button" class="btn-secondary" style="padding: 12px 20px; font-weight: 700;" onclick="document.getElementById('site-blueprint-modal').classList.add('hidden')">
                        Close
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove("hidden");
    }
}

// Global Application Instance with safe ready check
function startApp() {
    if (!window.app) {
        window.app = new SmartCityApp();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
} else {
    startApp();
}
