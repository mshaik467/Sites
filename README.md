# Prophets of Islam Quiz for Kids

An interactive, educational quiz designed for children to learn about the Prophets mentioned in the Quran and Hadith.

## Features
- **5 Levels of Difficulty**: From beginner (Level 1) to expert (Level 5).
- **Multiple Question Formats**: Includes Multiple Choice and Fill-in-the-blanks.
- **Kid-Friendly Interface**: Colorful, fun, and easy-to-use design.
- **Islamic Values**: Adheres to Islamic principles with respectful language and no visual depictions.

## How to Run Locally

Because this application uses `fetch()` to load question data, it must be run through a local web server (opening `index.html` directly in your browser will not work due to security restrictions).

### Option 1: Using Python (Recommended)
If you have Python installed, follow these steps:
1. Open your terminal or command prompt.
2. Navigate to the project directory.
3. Run the following command:
   ```bash
   python -m http.server 8000
   ```
4. Open your web browser and go to: `http://localhost:8000`

### Option 2: Using VS Code (Live Server)
1. Open the project folder in VS Code.
2. Install the **"Live Server"** extension.
3. Click the **"Go Live"** button in the bottom right corner of VS Code.

## File Structure
- `index.html`: The main structure of the quiz.
- `css/styles.css`: Colorful and fun styling for kids.
- `js/script.js`: Interactive logic, scoring, and level management.
- `data/questions.json`: The curated database of 20 questions.
