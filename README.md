# 🧠 MedGuide AI

### AI-Powered Clinical Decision Support System

MedGuide AI is an intelligent healthcare assistant that analyzes patient data, medical history, and medication combinations to generate personalized treatment recommendations.

The system uses AI to assist healthcare professionals and students in understanding treatment options, potential drug interactions, and monitoring strategies.

This project demonstrates how AI can support **clinical decision-making and healthcare analysis**.

---

# 🚀 Features

### 🩺 AI Treatment Recommendation

Analyzes patient information and generates a structured treatment plan including:

* Patient Risk Analysis
* Treatment Recommendation
* Drug Interaction Warnings
* Outcome Prediction
* Monitoring Protocol

---

### ⚠ Drug Interaction Detection

Automatically analyzes medication combinations and identifies potentially harmful drug interactions.

---

### 📊 Patient Risk Score

Calculates a patient risk score based on age, disease, and medical history and displays it using a color-coded visualization.

---

### 🎤 Voice Interaction

Supports voice-based interaction:

* Voice input for entering patient data
* Speech output to read the generated medical report

---

### 📄 PDF Treatment Report

Users can generate and download the complete AI treatment analysis as a **PDF report**.

---

### 🤖 AI Question Assistant

Users can ask follow-up questions about the generated treatment report to clarify medical recommendations or risks.

---

### 🎲 Example Patient Generator

Load randomized patient cases instantly to demonstrate the system and test different clinical scenarios.

---

### 🌗 Light / Dark Mode

Switch between professional **light mode** and **dark mode** dashboard themes.

---

# 🧠 System Workflow

```text
Patient Data Input
      ↓
Risk Score Calculation
      ↓
Drug Interaction Detection
      ↓
AI Medical Analysis
      ↓
Treatment Plan Generation
      ↓
Ask AI Follow-up Questions
      ↓
Download PDF Report
```

---

# 🏗 Project Structure

```text
medguide-ai
│
├── index.html      → User interface
├── styles.css      → Dashboard styling & themes
├── app.js          → Application logic & AI integration
└── README.md       → Project documentation
```

---

# ⚙ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### AI Integration

* OpenRouter API

### Libraries & APIs

* jsPDF (PDF generation)
* Web Speech API (voice input & speech output)

---

# 📦 Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/medguide-ai.git
cd medguide-ai
```

### 2️⃣ Start a local server

```bash
python -m http.server
```

### 3️⃣ Open the application

```
http://localhost:8000
```

---

# 🔑 Environment Setup

Add your OpenRouter API key in **app.js**

Example:

```javascript
const OPENROUTER_API_KEY = "your_api_key";
```

⚠ Do not expose API keys in public repositories.

---

# 🧪 Example Patient Case

Example input:

```
Age: 65
Gender: Male
Condition: Atrial Fibrillation
Medical History: Hypertension
Medications: Warfarin, Aspirin
Genetic Marker: CYP2C9 variant
```

The system generates a complete AI-assisted treatment analysis.

---

# 🎯 Use Cases

* Clinical decision support tools
* Medical education platforms
* Healthcare AI research prototypes
* Drug interaction awareness systems

---

# 🔮 Future Improvements

* Integration with medical knowledge databases
* Electronic Health Record (EHR) compatibility
* Advanced clinical guideline referencing
* AI confidence scoring
* Patient case history storage

---

# ⚠ Disclaimer

MedGuide AI is a prototype created for **educational and research purposes only**.
It should not be used as a substitute for professional medical advice or real clinical decision-making.

---

# 👨‍💻 Author

Developed by **Saran**

---

# ⭐ Acknowledgements

* OpenRouter API
* Web Speech API
* jsPDF

---

If you find this project useful, please ⭐ the repository.
