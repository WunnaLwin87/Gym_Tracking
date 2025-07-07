# Gym Tracker App

A simple, vanilla JavaScript-powered single-page application (SPA) for tracking gym workouts, visualizing progress, and exporting data, including integration with Google Sheets.

---

## Table of Contents

* [About the Project](#about-the-project)
* [Features](#features)
* [Technical Stack & Constraints](#technical-stack--constraints)
* [Getting Started](#getting-started)
    * [Prerequisites](#prerequisites)
    * [Installation](#installation)
    * [Google Sheets API Setup](#google-sheets-api-setup)
* [Usage](#usage)
* [Project Structure](#project-structure)
* [Contributing](#contributing)
* [License](#license)
* [Acknowledgments](#acknowledgments)

---

## About the Project

This Gym Tracker is a lightweight, client-side web application designed to help users log their workout sessions, monitor their progress over time, and manage their fitness data. Built with a focus on simplicity and direct browser execution, it utilizes local storage for data persistence and integrates with Google Sheets for robust data backup and sharing.

The primary goal was to create a functional gym tracker without the overhead of modern JavaScript frameworks or build tools, showcasing **pure HTML, CSS, and JavaScript** capabilities.

---

## Features

* **Single-Page Application (SPA):** Seamless navigation between different sections without full page reloads.
* **Persistent Navigation:** Fixed top navigation bar for easy access to all main views.
* **Light/Dark Mode:** Toggle between light and dark themes with user preference saved to local storage, respecting OS preferences initially.
* **Home View:** Quick overview with a welcome message and a summary of weekly workouts.
* **Active Workout Tracking:**
    * Real-time **stopwatch** to time workout sessions.
    * Dropdowns for selecting **muscle groups** and specific **exercises**.
    * Conditional input forms for logging:
        * **Cardio (Treadmill):** Incline, Speed, Duration.
        * **Strength Training:** Reps and Weight for individual sets, or bulk entry for multiple sets.
    * Ability to add "Next Exercise" within an ongoing workout.
    * "Finish Workout" to save the complete session.
* **Workout History:**
    * Chronological list of all past workouts with date, duration, and exercise summaries.
    * Option to **clear all stored workout history**.
* **Progress Tracking:**
    * Select a strength exercise to **visualize progress**.
    * Interactive **line chart (powered by Chart.js)** showing max weight lifted over time for the selected exercise.
    * Chart theme dynamically adapts to light/dark mode.
* **Data Export:**
    * Download complete workout history as a **CSV file**.
* **Google Sheets Synchronization:**
    * **Authorize Google account** for seamless integration.
    * **Sync workout data directly to a specified Google Sheet.**
    * Real-time status updates for authorization and sync operations.
    * Visibility of buttons (`Authorize`, `Sign Out`, `Sync`) changes based on current authentication status.
* **Local Storage:** All workout data and theme preferences are stored client-side in `localStorage`.
* **Responsive Design:** Clean, modern, and professional UI that adapts to different screen sizes.

---

## Technical Stack & Constraints

* **Frontend:** Vanilla HTML, CSS, JavaScript
* **Styling:** Pure CSS with **CSS Variables** for theming (`--c-primary`, `--c-secondary`, etc., defined for both light and `html.dark` modes).
* **Data Persistence:** Browser `localStorage`
* **Charting:** Chart.js (via CDN)
* **Google Integration:** Google API Client and Google Sign-In (GSI) Library (via CDN)
* **No Build Tools:** No Webpack, Vite, Parcel, Babel, Sass, Less, etc. The HTML, CSS, and JS files are intended to be served and run directly by the browser.
* **No Frameworks:** No React, Vue, Angular, Bootstrap, Tailwind, etc.

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* A modern web browser (e.g., Chrome, Chrome, Edge, Safari).
* (Optional, for Google Sheets sync) A Google Cloud Project with the Google Sheets API enabled and OAuth 2.0 Client ID credentials.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/gym-tracker-app.git](https://github.com/YOUR_USERNAME/gym-tracker-app.git)
    cd gym-tracker-app
    ```
    *(Note: Replace `YOUR_USERNAME` with your actual GitHub username if this is a real repo.)*

2.  **Open `index.html`:**
    Simply open the `index.html` file in your web browser. You can do this by navigating to the file in your explorer/finder and double-clicking it, or by running a simple local server if you prefer (e.g., `python -m http.server` in the project directory).

### Google Sheets API Setup (Optional)

To enable the Google Sheets synchronization feature, you'll need to set up a Google Cloud Project and obtain API credentials.

1.  **Go to Google Cloud Console:** [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a new project** (or select an existing one).
3.  **Enable the Google Sheets API:**
    * Navigate to "APIs & Services" > "Enabled APIs & services".
    * Click "+ Enable APIs and Services".
    * Search for "Google Sheets API" and **enable it**.
4.  **Create OAuth 2.0 Client ID Credentials:**
    * Go to "APIs & Services" > "Credentials".
    * Click "+ Create Credentials" > "OAuth client ID".
    * Select "Web application" as the application type.
    * Add your local development URLs to "Authorized JavaScript origins". If just opening `index.html` directly, this might be `http://localhost`, `http://127.0.0.1`, or even just leaving it blank if running directly from file system (though not recommended for production). For production, add your domain (e.g., `https://your-app.com`).
    * Add `http://localhost` (or your relevant local address) to "Authorized redirect URIs".
    * Click "Create". Note down your **Client ID**.
5.  **Create a Google Sheet:**
    * Create a new Google Sheet in your Google Drive.
    * **Crucially, make sure this sheet is accessible by the Google Account you will authorize with the app.**
    * Note down the **Spreadsheet ID** from the URL (it's the long string of characters between `/d/` and `/edit`).
6.  **Update `script.js`:**
    Open `script.js` and replace the placeholder values for `GOOGLE_CLIENT_ID` and `GOOGLE_SPREADSHEET_ID` with your actual credentials:

    ```javascript
    const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // Replace with your Client ID
    const GOOGLE_SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your Spreadsheet ID
    ```
    **Remember: These are client-side credentials visible in the browser. Do not use highly sensitive API keys here.**

---

## Usage

1.  **Start Workout:** Click "+ Start Today's Workout" on the Home screen.
2.  **Log Exercises:**
    * Select a "Muscle Group".
    * If "Treadmill", enter cardio details and click "Log Treadmill Session".
    * For strength, select an "Exercise", then log reps and weight for individual sets, or use the bulk logging option. Click "+ Add Set" or "Add All Sets".
    * Click "Next Exercise" to log another exercise, or "Finish Workout" to complete the session.
3.  **View History:** Navigate to the "History" tab to see all your recorded workouts.
4.  **Check Progress:** Go to the "Progress" tab, select an exercise, and view your max weight lifted over time.
5.  **Export Data:** In the "Export" tab, you can download your data as CSV or authorize with Google to sync to Google Sheets.
6.  **Toggle Theme:** Use the sun/moon icon in the top navigation to switch between light and dark modes.

---

## Project Structure

.
├── index.html          # Main application structure
├── styles.css          # All application styling, including theme variables
└── script.js           # All application logic (vanilla JavaScript)
└── README.md           # This file


---

## Contributing

As this project focuses on a specific set of constraints (vanilla, no build tools), direct contributions for adding complex features or frameworks are not being sought. However, if you find bugs, have suggestions for improvements within the existing constraints, or spot potential optimizations, please feel free to **open an issue or pull request**!

---

## License

Distributed under the MIT License. See `LICENSE` for more information. *(You would typically include a LICENSE file in your repository).*

---

## Acknowledgments

* [Chart.js](https://www.chartjs.org/) for the powerful and easy-to-use charting library.
* Google APIs for enabling seamless integration with Google Sheets.
