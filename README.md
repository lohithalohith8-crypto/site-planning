# 🏙️ Smart City Tumakuru - Citizen Amenities Portal
### ಸ್ಮಾರ್ಟ್ ಸಿಟಿ ತುಮಕೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯಗಳ ಪೋರ್ಟಲ್

A modern, responsive multi-page web application for **Smart City Tumakuru (Tumkur)** providing citizens, officers, and visitors with instant access to essential public facilities across **5 key surrounding neighborhoods** with both **Grid View** and **Interactive Map View**.

---

## 🚀 How to Run the Website (Instant 1-Click Launch)

### Option 1: Double-Click the Launcher (Recommended for Windows)
Double-click the launcher in this folder:
```
Open_Tumakuru_Portal.bat
```
This automatically opens the website in your default browser (Google Chrome, Microsoft Edge, Brave, etc.)!

### Option 2: Open `index.html` Directly
Double-click or open directly:
```
index.html
```

---

## 🌟 Multi-Page Experience & Interactive Maps

### 🔐 Screen 1: Login Page
* Official **Smart City Tumakuru Login Screen** with pre-filled credentials.
* Click **"Sign In to Smart City"** or click **"Instant Access (Explore Portal Directly)"**.
* Quick Demo buttons available (**Citizen**, **Officer**, or **Visitor**).

---

### 📍 Page 1 (First Page): ONLY the 5 Surrounding Areas
After login, you land on the **First Page**, which shows **only the areas**:
* **Welcome Banner**: *"Welcome to Smart City Tumakuru (ಸ್ಮಾರ್ಟ್ ಸಿಟಿ ತುಮಕೂರಿಗೆ ಆತ್ಮೀಯ ಸ್ವಾಗತ)"*.
* **Two View Modes**:
  1. **⊞ Areas Grid**: Browse the 5 area cards (Sira Gate, SS Puram, Vinayaka Nagara, Bhadramma Circle, Yallapura) or use the One-by-One Spotlight Carousel.
  2. **🗺️ Tumakuru City Map**: An interactive geographic map showing the exact positions of all 5 areas across Tumakuru city with clickable pins!
* Click on any area card or map pin to navigate to **Page 2** for that area!
* **No facilities clutter this page.**

---

### 🏢 Page 2 (Separate Second Page): Facilities with Cards & Map Views
When you click on an area on Page 1, you enter its **dedicated facilities page**:
* **Header & Breadcrumb**: Includes **`← Back to Areas`** button in the navbar and breadcrumb trail.
* **Area Details Banner**: Displays the area's name in Kannada, PIN code, and quick-switcher pills.
* **7 Core Public Facility Categories**:
  - 🏫 **Schools & Education**
  - 🏥 **Hospitals & Healthcare** (with 24/7 Trauma Care)
  - 📮 **Post Offices** (Speed Post, Aadhaar & Savings)
  - 💊 **Medicals & Pharmacies** (Apollo 24x7, Generic Jan Aushadhi)
  - 🛡️ **Police Stations & Public Safety** (24/7 Beat Patrolling & Help Desk)
  - 🏦 **Banks & ATMs** (SBI, Canara, Karnataka Bank, TGM)
  - 🌳 **Parks & Recreation** (Jogging Tracks, Open Gyms)
* **Two Presentation Views for Facilities**:
  1. **⊞ Cards View**: Comprehensive cards showing addresses, hours, contact numbers, and feature badges.
  2. **🗺️ Interactive Map View**: See all facilities plotted on an **interactive OpenStreetMap** with custom color-coded category pins!
     - 🏫 Blue for Schools
     - 🏥 Red for Hospitals
     - 📮 Orange for Post Offices
     - 💊 Green for Medicals
     - 🛡️ Dark Blue for Police
     - 🏦 Amber for Banks
     - 🌳 Emerald for Parks
     - Category filter tabs dynamically filter the markers on the map!
     - Click any marker to view a popup card with direct calling and Google Maps routes.
* **Return Navigation**: Click **`← Back to Areas`** in the header or at the bottom to return to Page 1 anytime.

---

## 📁 File Structure

```
smrt/
├── Open_Tumakuru_Portal.bat  # 1-Click Windows Launcher
├── index.html                # Multi-Page layout with Leaflet Interactive Maps
├── styles.css                # Karnataka Smart City styles, animations & map styling
├── data.js                   # Verified data for 5 areas & 7 facility categories with GPS coordinates
├── app.js                    # Multi-page router, safe storage & Leaflet map controllers
└── README.md                 # User guide and documentation
```
