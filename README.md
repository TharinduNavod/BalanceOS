🚀 BalanceOS — Personal Workload Manager

A modern, interactive personal productivity dashboard designed to help students and individuals manage their academics, fitness, daily routine, tasks, and life balance in one place.

✨ Features
🧠 Smart Dashboard
Real-time overview of your life balance
Visual balance ring (Academics / Sports / Routine)
Quick insights:
Pending tasks
Academic workload
Weekly workouts
Stored files

👉 Implemented using dynamic rendering and canvas-based UI

📚 Academics Management
Track:
Assignments
Exams
Lectures
Labs
Priority system (High / Medium / Low)
Status tracking (Pending / In Progress / Done)
🏃 Sports & Fitness Tracker
Weekly workout logging
Session tracking
Performance overview
☀️ Daily Routine Planner
Build your ideal daily schedule
Mark completed activities
Supports:
Daily / Weekday / Weekend routines
📅 Timeline & Planning
Track important milestones
View upcoming deadlines
Organized timeline visualization
✅ Task Manager
Create and manage tasks
Track progress and deadlines
Smart dashboard integration
🔔 Reminders System
Manage important events:
Lectures
Seminars
Webinars
Notification-style tracking
📁 File Management (Google Drive Integration)
Upload files directly to Google Drive
Centralized document storage

👉 Uses Google Apps Script Web API for uploads

🎨 Modern UI/UX
Clean dark theme with gradient accents
Smooth animations & transitions
Fully responsive layout

👉 Styled using custom CSS variables and design system

🧩 Tech Stack
Frontend
HTML5
CSS3 (Custom UI system)
Vanilla JavaScript
Backend
Node.js
Express.js

👉 Backend handles prompt generation & API logic

🛠️ Project Structure
BalanceOS/
│
├── index.html       # Main UI structure
├── style.css        # Main styling (dark theme)
├── script.js        # App logic & state management
├── server.js        # Backend server (Express)
├── app.js           # UI interaction logic
⚙️ How It Works
User sets up profile (name, degree, activity)
Data is stored in localStorage
App dynamically renders:
Dashboard
Tasks
Academics
Routine
Balance score is calculated based on:
Academic completion
Weekly sports activity
Routine completion

👉 State management handled via a centralized JS object

🚀 Getting Started
1. Clone the Repository
git clone https://github.com/your-username/balanceos.git
cd balanceos
2. Install Dependencies
npm install
3. Run Server
node server.js
4. Open in Browser
http://localhost:3000
🔐 Environment Setup

Create a .env file:

PORT=3000

(Optional) Add your Google Drive upload script URL inside:

const DRIVE_UPLOAD_URL = "YOUR_GOOGLE_SCRIPT_URL";
📊 Key Concepts Used
State Management (Frontend)
Dynamic UI Rendering
Canvas-based Visualization
REST API Integration
Local Storage Persistence
💡 Future Improvements
User authentication system
Cloud database integration (MongoDB / Firebase)
Mobile app version
AI-based productivity insights
Notification system (email / push)
