# ⏱️ Time Tracker Assistant

A beautiful, modern web application for tracking productive work hours and workout habits. Built with vanilla JavaScript, HTML5, CSS3, and SQLite for local data storage.

## ✨ Features

### 📅 Today Tab

- **Interactive Stopwatch**: Start, pause, and reset to track work sessions
- **Date Picker**: View and edit any day's data
- **Manual Time Entry**: Add hours worked manually
- **Workout Tracking**: Simple yes/no checkbox for daily workouts
- **Real-time Display**: See total hours and workout status at a glance
- **Auto-save**: Data automatically saves when you make changes

### 📊 Records Tab

- **Complete History**: View all your productivity records
- **Visual Indicators**: Color-coded hour badges (excellent, good, okay, low)
- **Easy Editing**: Click "Edit" to modify any day's data
- **Quick Deletion**: Remove incorrect entries with confirmation
- **Responsive Table**: Beautiful table design that works on all devices
- **Empty State**: Helpful guidance when you haven't started tracking yet

### 📈 Statistics Tab

- **Interactive Charts**: Beautiful line chart showing productivity trends
- **Dual Metrics**: Track both work hours and workout consistency
- **Statistics Summary**:
  - Total days tracked
  - Total hours worked
  - Average hours per day
  - Workout consistency percentage
- **Smart Insights**: AI-powered suggestions based on your data
- **30-Day Trends**: Focus on recent productivity patterns

### 🎨 Modern UI/UX

- **Beautiful Design**: Modern gradient backgrounds and smooth animations
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Intuitive Navigation**: Tab-based interface with smooth transitions
- **Visual Feedback**: Loading states, notifications, and hover effects
- **Accessibility**: Proper contrast, keyboard navigation, and screen reader support

### 💾 Data Management

- **Local Storage**: All data stored locally using SQLite in your browser
- **No Server Required**: Completely offline application
- **Data Persistence**: Your data persists between browser sessions
- **CRUD Operations**: Full Create, Read, Update, Delete functionality
- **Backup Ready**: Easy to export/import data if needed

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required!

### Installation

1. **Clone or download** this repository to your local machine:

   ```bash
   git clone [repository-url]
   cd time-tracker
   ```

2. **Serve the files** using a local web server. Choose one method:

   **Option A: Python (if installed)**

   ```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option B: Node.js (if installed)**

   ```bash
   npx http-server -p 8000
   ```

   **Option C: Live Server (VS Code extension)**

   - Install the "Live Server" extension in VS Code
   - Right-click on `index.html` and select "Open with Live Server"

3. **Open your browser** and navigate to:
   ```
   http://localhost:8000
   ```

### First Time Setup

1. The app will automatically initialize with today's date
2. Start using the stopwatch or enter manual hours
3. Check the workout box if you exercised
4. Your data is automatically saved locally

## 📱 How to Use

### Tracking Your Day

1. **Navigate to the "Today" tab**
2. **Use the stopwatch**:
   - Click "▶️ Start" to begin tracking
   - Click "⏸️ Pause" to stop (time automatically adds to your total)
   - Click "🔄 Reset" to clear the current session
3. **Or enter hours manually**:
   - Type in the "Manual Hours" field
   - Data saves automatically when you change the value
4. **Mark your workout**:
   - Check the box if you worked out today
   - Visual indicator updates immediately

### Viewing Your Progress

1. **Visit the "Records" tab** to see all your entries
2. **Click "Edit"** on any row to modify that day's data
3. **Click "Delete"** to remove incorrect entries
4. **View the "Statistics" tab** for insights and trends

### Data Management

- **Editing**: Click the edit button in Records or change the date in Today tab
- **Deleting**: Use the delete button in Records (with confirmation)
- **Backup**: Data is stored in your browser's local storage
- **Reset**: Clear browser data to start fresh

## 🛠️ Technical Details

### Architecture

The application follows a modular ES6 architecture:

- **`index.html`**: Main HTML structure and styling
- **`main.js`**: Entry point and tab coordination
- **`db.js`**: SQLite database operations
- **`today.js`**: Today tab functionality
- **`records.js`**: Records tab and CRUD operations
- **`statistics.js`**: Charts and analytics

### Dependencies

- **sql.js**: SQLite database in the browser
- **Chart.js**: Beautiful charts and visualizations
- **Modern JavaScript**: ES6+ modules and async/await

### Browser Compatibility

- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

## 🔧 Customization

### Changing Colors

Edit the CSS custom properties in `index.html`:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #4ecdc4;
  --warning-color: #ff6b6b;
}
```

### Modifying Insights

Edit the `generateInsights()` function in `statistics.js` to customize the AI suggestions.

### Adding Features

The modular architecture makes it easy to add new features:

1. Create a new module file
2. Import it in `main.js`
3. Add initialization code

## 📊 Data Structure

### Database Schema

```sql
CREATE TABLE daily_records (
    date TEXT PRIMARY KEY,
    hours REAL DEFAULT 0,
    workout TEXT DEFAULT 'No',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Data Format

- **Date**: YYYY-MM-DD format
- **Hours**: Decimal number (e.g., 8.5 for 8 hours 30 minutes)
- **Workout**: 'Yes' or 'No' string

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:

1. **Check browser console** for error messages
2. **Verify browser compatibility** (see requirements above)
3. **Try in incognito mode** to rule out extension conflicts
4. **Clear browser data** if data seems corrupted
5. **Restart the local server** if pages won't load

## 🎯 Future Enhancements

- [ ] Data export/import functionality
- [ ] Goal setting and notifications
- [ ] Multiple categories of work
- [ ] Time tracking shortcuts
- [ ] Weekly/monthly reports
- [ ] Data visualization improvements
- [ ] Mobile app version
- [ ] Team/collaborative features

---

**Happy tracking! 🚀**

Made with ❤️ for productivity enthusiasts.
