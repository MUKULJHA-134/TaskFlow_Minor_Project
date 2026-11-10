# TaskFlow – Task Management Web Application

> **Minor Project Deliverable (Part A)**  
> Built with HTML5, CSS3, JavaScript (ES6+), and Browser Local Storage.

---

## 📌 Project Overview
**TaskFlow** is a modern, responsive client-side task management web application designed to help users create, organize, search, filter, and track tasks seamlessly across desktop, tablet, and mobile devices. 

The application requires **zero external backend dependencies** or third-party libraries; all data persistence is securely managed via the browser's native **Web Storage API (`localStorage`)**, ensuring instant responsiveness, zero latency, and persistent state across page reloads.

---

## ✨ Features

### 1. Task Management (CRUD)
- **Create**: Add new tasks with title, description, priority, category tag, and due date.
- **View / Details**: Expand any task into a dedicated details modal with full metadata and timestamps.
- **Edit**: Modify task properties in-place with instant validation.
- **Delete with Confirmation**: Custom modal safeguards against accidental deletion before permanently removing a task.
- **Completion Toggle**: Mark tasks as completed or pending with one-click checkboxes and strikethrough styling.

### 2. Dashboard Analytics & Task Organization
- **Dynamic Metrics**: Instant counts for **Total**, **Pending**, **Completed**, and **Overdue** tasks.
- **Clickable Stat Cards**: Click any metric card (e.g., Overdue) to instantly filter the task list.
- **Live Search**: Instant debounced search querying task title, description, and tags.
- **Status Filtering**: Filter by All, Pending, Completed, or Overdue.
- **Priority Filtering**: Filter by All, High, Medium, or Low priority tiers.
- **Multi-Criteria Sorting**:
  - Due Date: Soonest First / Furthest First
  - Priority: High to Low / Low to High
  - Creation Date: Newest First / Oldest First
  - Title: Alphabetical (A to Z)
- **Visual Priority & Overdue Indicators**:
  - 🔴 **High Priority**: Rose alert badge.
  - 🟡 **Medium Priority**: Amber badge.
  - 🟢 **Low Priority**: Emerald badge.
  - ⚠️ **Overdue Alert**: Bold red pill showing days overdue (`⚠️ Overdue by X days`).
  - ⏰ **Due Today**: Yellow notification tag.

### 3. Validation & Data Persistence
- Real-time client-side input validation for required fields (Title, Due Date).
- Graceful empty states for empty lists and zero-match search results.
- **Browser Local Storage**: Automatically serializes and retains tasks across page reloads.
- Pre-seeded realistic demo data on initial visit so the dashboard is immediately demonstrable.
- Utility buttons to **Load Demo Tasks** or **Clear All** data.

### 4. UI/UX & Responsiveness
- **Theme Switcher**: One-click toggle between **Dark Mode** and **Light Mode** (saved in `localStorage`).
- **View Modes**: Switch between **Grid View** (3-column responsive card layout) and **List View** (compact table-like rows).
- **Accessibility & Feedback**: Keyboard navigation (`Escape` closes modals, `Enter` submits), ARIA labels, and custom Toast notification alerts.
- **100% Mobile Responsive**: Fluid layouts that adapt gracefully to mobile phones, tablets, laptops, and ultra-wide screens.

---

## 🛠️ Technology Stack
- **Markup**: HTML5 (Semantic elements: `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<dialog>`)
- **Styling**: CSS3 (CSS Custom Properties / Variables, CSS Grid, Flexbox, Transitions & Animations)
- **Logic**: Vanilla JavaScript (ES6+, Strict Mode, Event Delegation, DOM API, Local Storage API)
- **Version Control**: Git & GitHub
- **Hosting Compatibility**: GitHub Pages, Vercel, Netlify, or any static file server

---

## 📂 Project Directory Structure

```text
TaskFlow_Minor_Project/
├── source_code/
│   ├── index.html        # Main HTML5 application markup
│   ├── style.css         # CSS3 design system & dark/light theme
│   ├── script.js         # Core application logic & localStorage handler
│   └── assets/
│       └── logo.svg      # Scalable vector application logo
├── screenshots/
│   ├── dashboard.png     # Full dashboard view with metrics and cards
│   ├── task_form.png     # Task creation/editing modal dialog
│   ├── task_list.png     # Compact list view showing priority badges & filters
│   └── mobile_view.png   # Smartphone responsive viewport
├── Project_Report.pdf     # Formal 7-page academic minor project report
├── Project_Report.md      # Markdown documentation source
├── README.md              # Setup, architectural overview, and usage manual
└── GitHub_Repository_Link.txt # Repository links and deployment instructions
```

---

## 🚀 Getting Started & Local Setup

### Option 1: Direct Browser Launch (No Build Tools Required)
1. Navigate to the `source_code/` directory.
2. Double-click `index.html` or open it with any web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
3. The application will load immediately with interactive demo tasks!

### Option 2: Local HTTP Server (Python / Node.js)
If you prefer running via a local server:

**Using Python:**
```bash
cd TaskFlow_Minor_Project/source_code
python -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

**Using Node.js (`npx serve`):**
```bash
cd TaskFlow_Minor_Project/source_code
npx serve .
```

---

## 🌐 Live Deployment Instructions

### Deploy to GitHub Pages (Free & Instant)
1. Create a new GitHub repository named `TaskFlow-Web-Application`.
2. Push the contents of the `TaskFlow_Minor_Project` or `source_code` directory to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: TaskFlow task management application"
   git branch -M main
   git remote add origin https://github.com/<your-username>/TaskFlow-Web-Application.git
   git push -u origin main
   ```
3. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Branch**, select `main` branch and `/source_code` (or root) folder.
   - Click **Save**.
4. Your application will be live at `[https://github.com/MUKULJHA-134/TaskFlow_Minor_Project]`!

### Deploy to Vercel
1. Install Vercel CLI (`npm i -g vercel`) or visit [vercel.com](https://vercel.com).
2. Run `vercel` inside `source_code/` and follow the prompts.

---

## 📋 Demonstration Walkthrough (For Evaluation)
1. **Explore the Dashboard**: Note the real-time counters (Total, Pending, Completed, Overdue).
2. **Create a Task**: Click `+ New Task`, fill in the title, priority, category, and future due date, then click `Save Task`.
3. **Filter by Metric**: Click the "Overdue" stat card to view only overdue tasks. Notice the active filter badge.
4. **Search Tasks**: Type "Design" or "CSS" into the search bar to experience live debounced filtering.
5. **Sort Tasks**: Change the "Sort By" dropdown to "Priority: High to Low" or "Due Date: Soonest First".
6. **Toggle Completion**: Click the checkbox on any task card. Notice the card strikes through and the "Completed" counter updates automatically.
7. **Safe Delete**: Click the trash icon on a task. Notice the custom confirmation modal preventing accidental deletion.
8. **Test Persistence**: Press `F5` / Refresh the browser. Notice all your changes remain intact via `localStorage`.
9. **Toggle Theme**: Click the 🌙/☀️ button in the top right to test the dark mode styling.

---

## 📄 License
This project is submitted as an academic Minor Project deliverable. Open source under the ISC License.

