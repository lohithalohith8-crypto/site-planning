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
            map: document.getElementById("page-map")
        };

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
            subtitle.textContent = `${areaName} \u2022 All Facilities`;
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

        // Collect facilities based on current filters
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
                        Open Facilities &rarr;
                    </span>
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
