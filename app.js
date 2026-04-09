document.addEventListener('DOMContentLoaded', () => {
    // API Core
    const API_KEY = "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";
    const API_URL = "https://openrouter.ai/api/v1/chat/completions";


    // DOM Elements
    const form = document.getElementById('patient-form');
    const analyzeBtn = document.getElementById('analyze-btn');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const resultsState = document.getElementById('results-state');

    // Feature 3: Action Buttons
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const speakResultsBtn = document.getElementById('speak-results-btn');
    const speakBtnText = document.getElementById('speak-btn-text');
    const loadExampleBtn = document.getElementById('load-example-btn');
    const resetBtn = document.getElementById('reset-btn');
    // Feature 6: Ask AI
    const askAiBtn = document.getElementById('ask-ai-btn');
    const aiQuestionInput = document.getElementById('ai-question-input');
    const askAiStatus = document.getElementById('ask-ai-status');
    const askAiResponse = document.getElementById('ask-ai-response');

    // Feature 5: Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            if (themeIcon) themeIcon.textContent = '🌞';
            if (themeText) themeText.textContent = 'Light Mode';
        } else {
            if (themeIcon) themeIcon.textContent = '🌙';
            if (themeText) themeText.textContent = 'Dark Mode';
        }
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
        });
    }

    // Feature 4: Controls
    const modeToggle = document.getElementById('mode-toggle-checkbox');
    const textModeContainer = document.getElementById('text-mode-container');
    const voiceModeContainer = document.getElementById('voice-mode-container');
    const micBtn = document.getElementById('mic-btn');
    const micStatus = document.getElementById('mic-status');
    const dictationNotes = document.getElementById('dictation_notes');

    // Application State
    let lastExtractedSections = null;
    let currentPatientData = null;
    let isVoiceMode = false;
    let hasGeneratedData = false;
    let isSpeaking = false;
    let globalCompiledPatientInfo = "";
    let lastReportContext = "";

    // Feature Setup
    if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', generatePDF);
    if (speakResultsBtn) speakResultsBtn.addEventListener('click', toggleSpeech);

    const examplePatients = [
        {
            age: 65,
            gender: 'Male',
            disease: 'Atrial fibrillation',
            history: 'Hypertension, coronary artery disease',
            meds: 'Warfarin, Aspirin',
            genetics: 'CYP2C9 variant'
        },
        {
            age: 58,
            gender: 'Female',
            disease: 'Type 2 Diabetes',
            history: 'Obesity, hypertension',
            meds: 'Metformin, Lisinopril',
            genetics: 'None'
        },
        {
            age: 45,
            gender: 'Male',
            disease: 'Asthma',
            history: 'Seasonal allergies',
            meds: 'Salbutamol inhaler',
            genetics: 'None'
        },
        {
            age: 72,
            gender: 'Female',
            disease: 'Heart failure',
            history: 'Hypertension, chronic kidney disease',
            meds: 'Furosemide, Lisinopril',
            genetics: 'None'
        },
        {
            age: 50,
            gender: 'Male',
            disease: 'High cholesterol',
            history: 'Family history of cardiovascular disease',
            meds: 'Simvastatin',
            genetics: 'None'
        }
    ];

    if (loadExampleBtn) {
        loadExampleBtn.addEventListener('click', () => {
            if (isVoiceMode) modeToggle.click(); // Switch to text mode
            const randomIndex = Math.floor(Math.random() * examplePatients.length);
            const patient = examplePatients[randomIndex];

            document.getElementById('age').value = patient.age;
            document.getElementById('gender').value = patient.gender;
            document.getElementById('disease').value = patient.disease;
            document.getElementById('medical_history').value = patient.history;
            document.getElementById('medications').value = patient.meds;
            document.getElementById('genetic_markers').value = patient.genetics;
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            if (isVoiceMode) modeToggle.click(); // Switch to text mode
            document.getElementById('dictation_notes').value = '';
            hasGeneratedData = false;

            // UI Reset
            emptyState.classList.remove('hidden');
            resultsState.classList.add('hidden');
            if (downloadPdfBtn) downloadPdfBtn.classList.add('hidden');
            if (speakResultsBtn) speakResultsBtn.classList.add('hidden');
            if (aiQuestionInput) aiQuestionInput.value = '';
            if (askAiResponse) {
                askAiResponse.innerHTML = '';
                askAiResponse.classList.add('hidden');
            }
            if (askAiStatus) askAiStatus.classList.add('hidden');


            // Stop speech
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                isSpeaking = false;
                speakBtnText.textContent = "Speak Results";
                speakResultsBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> <span id="speak-btn-text">Speak Results</span>`;
            }

            // Reset Risk Score
            const fillBar = document.getElementById('risk-bar-fill');
            const badge = document.getElementById('risk-score-badge');
            const text = document.getElementById('risk-score-text');
            if (fillBar) fillBar.style.width = '0%';
            if (badge) {
                badge.className = 'risk-badge';
                badge.textContent = 'Calculating...';
            }
            if (text) text.textContent = '';

            // Reset Overview
            const els = ['overview-age', 'overview-gender', 'overview-disease', 'overview-meds', 'overview-risk'];
            els.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.textContent = '-';
                    el.style.color = '';
                }
            });
        });
    }

    // Context switching: Text vs Voice
    modeToggle.addEventListener('change', (e) => {
        isVoiceMode = e.target.checked;
        if (isVoiceMode) {
            textModeContainer.classList.add('hidden');
            voiceModeContainer.classList.remove('hidden');
        } else {
            textModeContainer.classList.remove('hidden');
            voiceModeContainer.classList.add('hidden');
        }
    });


    // Voice Input: Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        let isRecording = false;

        micBtn.addEventListener('click', () => {
            if (!isRecording) {
                recognition.lang = 'en-US';

                recognition.start();
                isRecording = true;
                micBtn.classList.add('recording');
                micStatus.textContent = "Recording aloud... Click mic again to stop.";
            } else {
                recognition.stop();
                isRecording = false;
                micBtn.classList.remove('recording');
                micStatus.textContent = "Microphone stopped. You can edit the text below.";
            }
        });

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                // Append final sentences perfectly
                dictationNotes.value += (dictationNotes.value ? ' ' : '') + finalTranscript;
            }
        };

        recognition.onerror = (e) => {
            console.error("Speech Recognition Error", e);
            isRecording = false;
            micBtn.classList.remove('recording');
            micStatus.textContent = "Error occurred. Try dictating again.";
        };
    } else {
        micStatus.textContent = "Speech Recognition API not supported in this browser.";
        micBtn.disabled = true;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Collect Payload depending on mode
        let compiledPatientInfo = "";
        let medicationStringForAnalysis = "";
        let combos = [];

        if (!isVoiceMode) {
            const age = document.getElementById('age').value || "Not provided";
            const gender = document.getElementById('gender').value || "Not provided";
            const disease = document.getElementById('disease').value || "Not provided";
            const history = document.getElementById('medical_history').value || "Not provided";
            const meds = document.getElementById('medications').value || "None";
            const genetics = document.getElementById('genetic_markers').value || "None";

            currentPatientData = { age, gender, disease, history, medications: meds }; // Cache for risk/PDF

            document.getElementById('overview-age').textContent = age;
            document.getElementById('overview-gender').textContent = gender;
            document.getElementById('overview-disease').textContent = disease;
            document.getElementById('overview-meds').textContent = meds;

            globalCompiledPatientInfo = `Age: ${age}
Gender: ${gender}
Disease: ${disease}
Medical History: ${history}
Current Medications: ${meds}
Genetic Markers: ${genetics}`;

            let compiledPatientInfo = globalCompiledPatientInfo;

            medicationStringForAnalysis = meds;

        } else {
            const dictation = document.getElementById('dictation_notes').value;
            if (!dictation.trim()) {
                alert("Please dictate or type notes before analyzing.");
                return;
            }
            globalCompiledPatientInfo = `Dictated Context: ${dictation}`;
            let compiledPatientInfo = globalCompiledPatientInfo;
            currentPatientData = { age: "Unknown", gender: "Unknown", disease: "Dictated", history: dictation, medications: "Dictated" }; // Dummy cache

            document.getElementById('overview-age').textContent = "Unknown";
            document.getElementById('overview-gender').textContent = "Unknown";
            document.getElementById('overview-disease').textContent = "Dictated";
            document.getElementById('overview-meds').textContent = "Dictated";

            medicationStringForAnalysis = dictation; // To let combo logic try to find commas if user typed them, otherwise fallback
        }

        // Feature 1: Advanced Pairwise Drug Interaction Combinations
        // We attempt to split by commas globally to generate matrix
        const medsList = medicationStringForAnalysis
            .split(',')
            .map(m => m.trim().replace(/\n/g, ' '))
            .filter(m => m.length > 2); // Exclude tiny fragments

        for (let i = 0; i < medsList.length; i++) {
            for (let j = i + 1; j < medsList.length; j++) {
                combos.push(`${medsList[i]} + ${medsList[j]}`);
            }
        }

        // Strict system injection instructing fallback string if empty
        let systemFlag = "";
        if (combos.length > 0) {
            systemFlag = `System Flag: Explicitly analyze these specific medication combinations for pairwise interactions: ${combos.join(', ')}. IF NO INTERACTIONS ARE FOUND IN THESE COMBINATIONS OR ANY OTHERS MENTIONED, YOU MUST EXPLICITLY OUTPUT "No harmful drug interactions detected." IN THE DRUG INTERACTION WARNING SECTION.`;
        } else {
            systemFlag = `System Flag: IF NO HARMFUL DRUG INTERACTIONS ARE DETECTED OR MENTIONED, YOU MUST EXPLICITLY OUTPUT "No harmful drug interactions detected." IN THE DRUG INTERACTION WARNING SECTION.`;
        }



        // UI Reset
        emptyState.classList.add('hidden');
        resultsState.classList.add('hidden');
        if (downloadPdfBtn) downloadPdfBtn.classList.add('hidden');
        if (speakResultsBtn) speakResultsBtn.classList.add('hidden');
        if (aiQuestionInput) aiQuestionInput.value = '';
        if (askAiResponse) {
            askAiResponse.innerHTML = '';
            askAiResponse.classList.add('hidden');
        }
        if (askAiStatus) askAiStatus.classList.add('hidden');

        loadingState.classList.remove('hidden');
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';

        // Stop speech if running from a previous turn
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            isSpeaking = false;
            speakBtnText.textContent = "Speak Results";
            speakResultsBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> <span id="speak-btn-text">Speak Results</span>`;
        }

        try {
            // Visualize Risk Score
            calculateRiskScore(currentPatientData);

            // Construct Final Prompt
            const prompt = `Generate the medical analysis report strictly in English.

Patient Information
${compiledPatientInfo}

${systemFlag ? `\nIMPORTANT SYSTEM NOTE:\n${systemFlag}\n\n` : ''}Analyze ALL provided medications against each other for metabolic (CYP450) and pharmacodynamic interactions.

Analyze the patient and generate the following structured output EXACTLY using these headings:

Patient Risk Analysis
Treatment Recommendation
Drug Interaction Warnings
Outcome Prediction
Monitoring Protocol`;

            // Request
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'MedGuide AI Prototype'
                },
                body: JSON.stringify({
                    "model": "openai/gpt-oss-120b:free",
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`API error! status: ${response.status}`);
            }

            const data = await response.json();
            const aiText = data.choices[0].message.content;
            lastReportContext = aiText;

            // Render
            parseAndRenderResults(aiText);
            hasGeneratedData = true;

            // UI Reveal
            loadingState.classList.add('hidden');
            resultsState.classList.remove('hidden');
            if (downloadPdfBtn) downloadPdfBtn.classList.remove('hidden');
            if (speakResultsBtn) speakResultsBtn.classList.remove('hidden');

        } catch (error) {
            console.error("Analysis Error:", error);

            // Only alert if we didn't deliberately cancel a fetch, etc.
            let errorMsg = "Failed to analyze patient data.\n\n";
            if (API_KEY === "YOUR_OPENROUTER_API_KEY") {
                errorMsg += "It looks like you have not inserted your OpenRouter API Key in app.js.\nPlease replace 'YOUR_OPENROUTER_API_KEY' with your actual key.";
            } else {
                errorMsg += "Ensure your API key is correct and you have an active internet connection.";
            }
            alert(errorMsg);

            loadingState.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fa-solid fa-microchip"></i> Analyze Patient';
        }
    });

    /**
     * Parses the LLM markdown response strictly into the 5 sections.
     */
    function parseAndRenderResults(text) {
        // Ensure UI styling explicitly shows all cards
        document.getElementById('card-treatment').style.display = 'block';
        document.getElementById('card-interaction').style.display = 'block';
        document.getElementById('card-outcome').style.display = 'block';
        document.getElementById('card-monitoring').style.display = 'block';
        document.querySelector('#card-risk h3').textContent = '🧬 Patient Risk Analysis';

        const sections = {
            risk: extractSection(text, /Patient Risk Analysis/i, /Treatment Recommendation/i),
            treatment: extractSection(text, /Treatment Recommendation/i, /Drug Interaction Warning(?:s?)/i),
            interaction: extractSection(text, /Drug Interaction Warning(?:s?)/i, /Outcome Prediction/i),
            outcome: extractSection(text, /Outcome Prediction/i, /Monitoring Protocol/i),
            monitoring: extractSection(text, /Monitoring Protocol/i, /$/i)
        };

        const cleanStr = (str) => {
            if (!str) return "*No data returned for this section.*";
            return str.replace(/^[>\s]*:\s*/gm, '').trim();
        };

        lastExtractedSections = {
            risk: cleanStr(sections.risk),
            treatment: cleanStr(sections.treatment),
            interaction: cleanStr(sections.interaction),
            outcome: cleanStr(sections.outcome),
            monitoring: cleanStr(sections.monitoring)
        };

        document.getElementById('content-risk').innerHTML = marked.parse(lastExtractedSections.risk);
        document.getElementById('content-treatment').innerHTML = marked.parse(lastExtractedSections.treatment);
        document.getElementById('content-interaction').innerHTML = marked.parse(lastExtractedSections.interaction);
        document.getElementById('content-outcome').innerHTML = marked.parse(lastExtractedSections.outcome);
        document.getElementById('content-monitoring').innerHTML = marked.parse(lastExtractedSections.monitoring);
    }

    function extractSection(text, startPattern, endPattern) {
        const startRegex = new RegExp(`(?:#|^|\\s)*(?:${startPattern.source})`, 'i');
        const startMatch = text.match(startRegex);

        if (!startMatch) return "";

        const startIndex = startMatch.index + startMatch[0].length;
        const remainingText = text.substring(startIndex);

        const endMatch = remainingText.match(endPattern);
        const endIndex = endMatch ? endMatch.index : remainingText.length;

        return remainingText.substring(0, endIndex).trim();
    }

    /**
     * Calculate Patient Risk Score and Animate Bar
     */
    function calculateRiskScore(data) {
        let score = 0;

        // Age factor
        const age = parseInt(data.age) || 0;
        if (age > 60) score += 30;
        else if (age > 40) score += 15;

        // Condition factors
        const hx = (data.history + " " + data.disease).toLowerCase();
        if (hx.includes('diabetes')) score += 20;
        if (hx.includes('hypertension') || hx.includes('blood pressure')) score += 15;
        if (hx.includes('heart') || hx.includes('cardio')) score += 25;
        if (hx.includes('kidney') || hx.includes('renal')) score += 20;

        // Comorbidities
        const comorbidityCount = (data.history.match(/,/g) || []).length;
        score += (comorbidityCount * 5);

        // Voice mode override heuristics
        if (isVoiceMode) {
            const dict = hx;
            if (dict.includes('high risk') || dict.includes('severe')) score += 30;
            const voiceAgeMatch = dict.match(/(\d+)\s+year/);
            if (voiceAgeMatch && parseInt(voiceAgeMatch[1]) > 60) score += 20;
        }

        score = Math.min(score, 100);

        const fillBar = document.getElementById('risk-bar-fill');
        const badge = document.getElementById('risk-score-badge');
        const text = document.getElementById('risk-score-text');

        if (!fillBar || !badge || !text) return;

        fillBar.style.width = '0%';

        setTimeout(() => {
            fillBar.style.width = `${score}%`;
            const overviewRisk = document.getElementById('overview-risk');
            if (score <= 30) {
                badge.className = 'risk-badge low';
                badge.textContent = `Risk Score: ${score}% (Low Risk)`;
                fillBar.style.backgroundColor = 'var(--success)';
                text.textContent = 'Patient presents standard outpatient profile.';
                if (overviewRisk) {
                    overviewRisk.textContent = `${score}% (Low Risk)`;
                    overviewRisk.style.color = 'var(--success)';
                }
            } else if (score <= 60) {
                badge.className = 'risk-badge medium';
                badge.textContent = `Risk Score: ${score}% (Moderate Risk)`;
                fillBar.style.backgroundColor = 'var(--warning)';
                text.textContent = 'Patient requires careful medication titration and monitoring.';
                if (overviewRisk) {
                    overviewRisk.textContent = `${score}% (Moderate Risk)`;
                    overviewRisk.style.color = 'var(--warning)';
                }
            } else {
                badge.className = 'risk-badge high';
                badge.textContent = `Risk Score: ${score}% (High Risk)`;
                fillBar.style.backgroundColor = 'var(--danger)';
                text.textContent = 'Patient presents high risk for adverse outcomes. Strict adherence required.';
                if (overviewRisk) {
                    overviewRisk.textContent = `${score}% (High Risk)`;
                    overviewRisk.style.color = 'var(--danger)';
                }
            }
        }, 100);
    }

    /**
     * Voice Output (SpeechSynthesis)
     */
    function toggleSpeech() {
        if (!window.speechSynthesis) {
            alert("Speech Synthesis is not supported in this browser.");
            return;
        }

        if (isSpeaking) {
            // Stop speech
            window.speechSynthesis.cancel();
            isSpeaking = false;
            speakBtnText.textContent = "Speak Results";
            speakResultsBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> <span id="speak-btn-text">Speak Results</span>`;
            return;
        }

        // Start Speech
        if (!lastExtractedSections) return;

        // Strip Markdown for cleaner reading
        const stripMd = (str) => str ? str.replace(/[*#_]/g, '').trim() : '';

        const fullScript = `
            Patient Risk Analysis. ${stripMd(lastExtractedSections.risk)}
            Treatment Recommendation. ${stripMd(lastExtractedSections.treatment)}
            Drug Interaction Warnings. ${stripMd(lastExtractedSections.interaction)}
            Outcome Prediction. ${stripMd(lastExtractedSections.outcome)}
            Monitoring Protocol. ${stripMd(lastExtractedSections.monitoring)}
        `;

        const utterance = new SpeechSynthesisUtterance(fullScript);

        utterance.lang = 'en-US';

        utterance.rate = 1.0;

        utterance.onend = () => {
            isSpeaking = false;
            speakBtnText.textContent = "Speak Results";
            speakResultsBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> <span id="speak-btn-text">Speak Results</span>`;
        };

        window.speechSynthesis.speak(utterance);
        isSpeaking = true;
        speakBtnText.textContent = "Stop Playing";
        speakResultsBtn.innerHTML = `<i class="fa-regular fa-circle-stop"></i> <span id="speak-btn-text">Stop Playing</span>`;
    }

    /**
     * Generate jsPDF
     */
    function generatePDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('PDF library not loaded yet. Please try again.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const stripMd = (str) => str ? str.replace(/[*#_]/g, '').trim() : 'Not provided.';

        const marginX = 15;
        let cursorY = 20;
        const pageHeight = doc.internal.pageSize.height;

        const printLines = (text, size = 11, fontStyle = 'normal') => {
            doc.setFontSize(size);
            doc.setFont('helvetica', fontStyle);
            const lines = doc.splitTextToSize(text, 180);

            lines.forEach(line => {
                if (cursorY > pageHeight - 20) {
                    doc.addPage();
                    cursorY = 20;
                }
                doc.text(line, marginX, cursorY);
                cursorY += (size * 0.4);
            });
            cursorY += 8;
        };

        printLines('MedGuide AI - Patient Treatment Plan', 18, 'bold');
        cursorY += 5;

        // Header adaptations for Voice vs Text
        if (!isVoiceMode) {
            printLines(`Age: ${currentPatientData.age} | Gender: ${currentPatientData.gender}`, 12, 'bold');
            printLines(`Primary Complaint: ${currentPatientData.disease}`, 12, 'bold');
        } else {
            printLines(`Context: Voice Dictation Captured`, 12, 'bold');
        }
        cursorY += 5;

        if (lastExtractedSections) {
            printLines('1. Patient Risk Analysis', 14, 'bold');
            printLines(stripMd(lastExtractedSections.risk));

            printLines('2. Treatment Recommendation', 14, 'bold');
            printLines(stripMd(lastExtractedSections.treatment));

            printLines('3. Drug Interaction Warnings', 14, 'bold');
            printLines(stripMd(lastExtractedSections.interaction));

            printLines('4. Outcome Prediction', 14, 'bold');
            printLines(stripMd(lastExtractedSections.outcome));

            printLines('5. Monitoring Protocol', 14, 'bold');
            printLines(stripMd(lastExtractedSections.monitoring));
        }

        doc.save('MedGuide_Treatment_Plan.pdf');
    }

    /**
     * Ask AI a Question
     */
    if (askAiBtn) {
        askAiBtn.addEventListener('click', async () => {
            const question = aiQuestionInput.value.trim();
            if (!question) {
                alert("Please enter a question.");
                return;
            }

            if (!lastReportContext) {
                alert("No report data available. Please analyze a patient first.");
                return;
            }

            askAiStatus.classList.remove('hidden');
            askAiResponse.classList.add('hidden');
            askAiBtn.disabled = true;

            const prompt = `You are a medical assistant helping explain a treatment plan.

Here is the patient treatment report:
${lastReportContext}

User Question: ${question}

Provide a clear and medically accurate explanation.`;

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.href,
                        'X-Title': 'MedGuide AI Prototype'
                    },
                    body: JSON.stringify({
                        "model": "anthropic/claude-3-haiku",
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error(`API error! status: ${response.status}`);
                }

                const data = await response.json();
                const aiResponse = data.choices[0].message.content;

                askAiResponse.innerHTML = window.marked ? marked.parse(aiResponse) : aiResponse;
                askAiResponse.classList.remove('hidden');
                
            } catch (error) {
                console.error("Ask AI Error:", error);
                alert("Failed to get a response from AI. Please try again.");
            } finally {
                askAiStatus.classList.add('hidden');
                askAiBtn.disabled = false;
                aiQuestionInput.value = '';
            }
        });
    }
});
