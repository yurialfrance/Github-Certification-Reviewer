// GitHub Foundation Certification Reviewer - Main Application
class GitHubReviewer {
    constructor() {
        this.domains = [];
        this.currentDomain = null;
        this.currentMode = null;
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        
        this.init();
    }

    async init() {
        await this.loadQuestions();
        this.setupEventListeners();
        this.renderDomainNav();
    }

    async loadQuestions() {
        try {
            const response = await fetch('questions.json');
            const data = await response.json();
            this.domains = data.domains;
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Failed to load questions. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Mode selection
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.startMode(mode);
            });
        });

        // Navigation buttons
        document.getElementById('backBtn').addEventListener('click', () => this.showModeSelector());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('prevBtn').addEventListener('click', () => this.previousQuestion());
        
        // Results buttons
        document.getElementById('retryBtn').addEventListener('click', () => this.retryQuiz());
        document.getElementById('newModeBtn').addEventListener('click', () => this.showModeSelector());
    }

    renderDomainNav() {
        const nav = document.getElementById('domainNav');
        const domainList = document.createElement('div');
        domainList.className = 'domain-list';

        this.domains.forEach(domain => {
            const btn = document.createElement('button');
            btn.className = 'domain-btn';
            btn.textContent = `D${domain.id}: ${domain.name}`;
            btn.addEventListener('click', () => this.selectDomain(domain.id));
            domainList.appendChild(btn);
        });

        nav.appendChild(domainList);
    }

    selectDomain(domainId) {
        // Remove active class from all buttons
        document.querySelectorAll('.domain-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to selected button
        const buttons = document.querySelectorAll('.domain-btn');
        buttons[domainId - 1].classList.add('active');

        // Set current domain
        this.currentDomain = this.domains.find(d => d.id === domainId);
        
        // Update progress display
        document.getElementById('currentDomain').textContent = `${domainId}. ${this.currentDomain.name}`;

        // Reset quiz if in progress
        if (this.currentMode) {
            this.startMode(this.currentMode);
        }
    }

    showModeSelector() {
        document.getElementById('modeSelector').classList.remove('hidden');
        document.getElementById('quizContainer').classList.add('hidden');
        document.getElementById('resultsContainer').classList.add('hidden');
        this.currentMode = null;
        this.updateProgress(0, 0);
    }

    startMode(mode) {
        if (!this.currentDomain) {
            alert('Please select a domain first!');
            return;
        }

        this.currentMode = mode;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;

        // Get questions for the selected mode
        const modeKey = this.getModeKey(mode);
        this.currentQuestions = this.currentDomain.questions[modeKey] || [];

        if (this.currentQuestions.length === 0) {
            alert('No questions available for this mode and domain.');
            return;
        }

        // Shuffle questions for variety
        this.currentQuestions = this.shuffleArray([...this.currentQuestions]);

        // Show quiz container
        document.getElementById('modeSelector').classList.add('hidden');
        document.getElementById('quizContainer').classList.remove('hidden');

        // Update mode badge
        document.getElementById('modeBadge').textContent = this.getModeName(mode);

        // Render first question
        this.renderQuestion();
        this.updateProgress(this.currentQuestionIndex + 1, this.currentQuestions.length);
    }

    getModeKey(mode) {
        const modeMap = {
            'multiple-choice': 'multipleChoice',
            'flashcard': 'flashcards',
            'fill-blank': 'fillInTheBlank',
            'coding': 'coding'
        };
        return modeMap[mode];
    }

    getModeName(mode) {
        const nameMap = {
            'multiple-choice': 'Multiple Choice',
            'flashcard': 'Flashcards',
            'fill-blank': 'Fill in the Blank',
            'coding': 'Coding Challenge'
        };
        return nameMap[mode];
    }

    renderQuestion() {
        const question = this.currentQuestions[this.currentQuestionIndex];
        const questionCard = document.getElementById('questionCard');
        const questionCounter = document.getElementById('questionCounter');

        questionCounter.textContent = `${this.currentQuestionIndex + 1} / ${this.currentQuestions.length}`;
        questionCard.innerHTML = '';

        switch (this.currentMode) {
            case 'multiple-choice':
                this.renderMultipleChoice(question, questionCard);
                break;
            case 'flashcard':
                this.renderFlashcard(question, questionCard);
                break;
            case 'fill-blank':
                this.renderFillBlank(question, questionCard);
                break;
            case 'coding':
                this.renderCoding(question, questionCard);
                break;
        }

        // Update button states
        document.getElementById('prevBtn').disabled = this.currentQuestionIndex === 0;
        document.getElementById('nextBtn').textContent = 
            this.currentQuestionIndex === this.currentQuestions.length - 1 ? 'Finish Quiz' : 'Next Question';
    }

    renderMultipleChoice(question, container) {
        const questionDiv = document.createElement('div');
        questionDiv.innerHTML = `
            <h3 class="question-text">${question.question}</h3>
            <div class="options-list">
                ${question.options.map((option, index) => `
                    <button class="option-btn" data-index="${index}">
                        ${option}
                    </button>
                `).join('')}
            </div>
            <div id="feedback"></div>
        `;
        container.appendChild(questionDiv);

        // Add click handlers
        questionDiv.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleMultipleChoiceAnswer(e, question));
        });

        // Restore previous answer if exists
        if (this.userAnswers[this.currentQuestionIndex] !== undefined) {
            this.showMultipleChoiceFeedback(question, this.userAnswers[this.currentQuestionIndex]);
        }
    }

    handleMultipleChoiceAnswer(e, question) {
        const selectedIndex = parseInt(e.currentTarget.dataset.index);
        this.userAnswers[this.currentQuestionIndex] = selectedIndex;
        this.showMultipleChoiceFeedback(question, selectedIndex);
    }

    showMultipleChoiceFeedback(question, selectedIndex) {
        const buttons = document.querySelectorAll('.option-btn');
        const feedbackDiv = document.getElementById('feedback');

        // Disable all buttons
        buttons.forEach(btn => btn.disabled = true);

        // Mark selected
        buttons[selectedIndex].classList.add('selected');

        // Show correct/incorrect
        const isCorrect = selectedIndex === question.correct;
        buttons[question.correct].classList.add('correct');
        
        if (!isCorrect) {
            buttons[selectedIndex].classList.add('incorrect');
        }

        // Show explanation
        feedbackDiv.innerHTML = `
            <div class="feedback-message ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong>
                <p>${question.explanation}</p>
            </div>
        `;
    }

    renderFlashcard(question, container) {
        const isFlipped = this.userAnswers[this.currentQuestionIndex] === true;
        
        const flashcardDiv = document.createElement('div');
        flashcardDiv.className = `flashcard ${isFlipped ? 'show-answer' : ''}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'flashcard-content';
        contentDiv.textContent = isFlipped ? question.back : question.front;
        
        const hintDiv = document.createElement('div');
        hintDiv.className = 'flashcard-hint';
        hintDiv.innerHTML = isFlipped 
            ? '✓ Answer Revealed | Click to see question again' 
            : '💡 Click anywhere to reveal the answer';
        
        flashcardDiv.appendChild(contentDiv);
        flashcardDiv.appendChild(hintDiv);
        
        flashcardDiv.addEventListener('click', () => {
            this.userAnswers[this.currentQuestionIndex] = !isFlipped;
            this.renderQuestion();
        });

        container.appendChild(flashcardDiv);
    }

    renderFillBlank(question, container) {
        const questionDiv = document.createElement('div');
        questionDiv.innerHTML = `
            <h3 class="question-text">${question.question}</h3>
            <input type="text" class="fill-blank-input" placeholder="Type your answer..." 
                   value="${this.userAnswers[this.currentQuestionIndex] || ''}">
            <p style="color: var(--text-tertiary); margin-top: 1rem; font-family: 'DM Mono', monospace; font-size: 0.9rem;">
                💡 Hint: ${question.hint}
            </p>
            <div id="feedback"></div>
            <button class="btn btn-primary" style="margin-top: 1.5rem;" id="checkAnswer">Check Answer</button>
        `;
        container.appendChild(questionDiv);

        const input = questionDiv.querySelector('.fill-blank-input');
        const checkBtn = questionDiv.querySelector('#checkAnswer');

        input.addEventListener('input', (e) => {
            this.userAnswers[this.currentQuestionIndex] = e.target.value;
        });

        checkBtn.addEventListener('click', () => this.checkFillBlankAnswer(question, input));

        // If already answered, show feedback
        if (this.userAnswers[this.currentQuestionIndex]) {
            this.checkFillBlankAnswer(question, input, true);
        }
    }

    checkFillBlankAnswer(question, input, silent = false) {
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = question.answer.toLowerCase();
        const isCorrect = userAnswer === correctAnswer || 
                         userAnswer.includes(correctAnswer) ||
                         correctAnswer.includes(userAnswer);

        input.classList.remove('correct', 'incorrect');
        input.classList.add(isCorrect ? 'correct' : 'incorrect');
        input.disabled = true;

        const feedbackDiv = document.getElementById('feedback');
        feedbackDiv.innerHTML = `
            <div class="feedback-message ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong>
                <p>${isCorrect ? 'Well done!' : `The correct answer is: <strong>${question.answer}</strong>`}</p>
            </div>
        `;

        document.getElementById('checkAnswer').style.display = 'none';
    }

    renderCoding(question, container) {
        const questionDiv = document.createElement('div');
        questionDiv.innerHTML = `
            <h3 class="question-text">${question.question}</h3>
            <p style="color: var(--text-tertiary); margin-bottom: 1rem; font-family: 'DM Mono', monospace; font-size: 0.9rem;">
                💡 Hint: ${question.hint}
            </p>
            <div class="code-editor">
                <textarea placeholder="Write your answer here..." spellcheck="false">${this.userAnswers[this.currentQuestionIndex] || ''}</textarea>
            </div>
            <button class="btn btn-primary" style="margin-top: 1.5rem;" id="submitCode">Submit Answer</button>
            <div id="feedback"></div>
        `;
        container.appendChild(questionDiv);

        const textarea = questionDiv.querySelector('textarea');
        const submitBtn = questionDiv.querySelector('#submitCode');

        textarea.addEventListener('input', (e) => {
            this.userAnswers[this.currentQuestionIndex] = e.target.value;
        });

        submitBtn.addEventListener('click', () => this.checkCodingAnswer(question, textarea));
    }

    checkCodingAnswer(question, textarea) {
        const userAnswer = textarea.value.trim();
        const expectedAnswer = question.expectedAnswer.trim();
        
        // Simple comparison (case-insensitive)
        const isCorrect = userAnswer.toLowerCase() === expectedAnswer.toLowerCase();

        textarea.disabled = true;

        const feedbackDiv = document.getElementById('feedback');
        feedbackDiv.innerHTML = `
            <div class="feedback-message ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong>
                <p>${isCorrect ? 'Perfect!' : `Expected answer: <code style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: 'DM Mono', monospace;">${expectedAnswer}</code>`}</p>
            </div>
        `;

        document.getElementById('submitCode').style.display = 'none';
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
            this.updateProgress(this.currentQuestionIndex + 1, this.currentQuestions.length);
        } else {
            this.showResults();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
            this.updateProgress(this.currentQuestionIndex + 1, this.currentQuestions.length);
        }
    }

    calculateScore() {
        this.score = 0;
        let total = 0;

        this.currentQuestions.forEach((question, index) => {
            const answer = this.userAnswers[index];
            
            switch (this.currentMode) {
                case 'multiple-choice':
                    if (answer !== undefined) {
                        total++;
                        if (answer === question.correct) this.score++;
                    }
                    break;
                case 'flashcard':
                    // Flashcards count as reviewed if flipped at least once
                    if (answer === true) {
                        total++;
                        this.score++;
                    }
                    break;
                case 'fill-blank':
                    if (answer !== undefined && answer.trim() !== '') {
                        total++;
                        const userAns = answer.trim().toLowerCase();
                        const correctAns = question.answer.toLowerCase();
                        if (userAns === correctAns || userAns.includes(correctAns) || correctAns.includes(userAns)) {
                            this.score++;
                        }
                    }
                    break;
                case 'coding':
                    if (answer !== undefined && answer.trim() !== '') {
                        total++;
                        const userCode = answer.trim().toLowerCase();
                        const expectedCode = question.expectedAnswer.trim().toLowerCase();
                        if (userCode === expectedCode) this.score++;
                    }
                    break;
            }
        });

        return {
            score: this.score,
            total: total,
            percentage: total > 0 ? Math.round((this.score / total) * 100) : 0
        };
    }

    showResults() {
        const results = this.calculateScore();

        document.getElementById('quizContainer').classList.add('hidden');
        document.getElementById('resultsContainer').classList.remove('hidden');

        document.getElementById('scoreValue').textContent = `${results.percentage}%`;
        document.getElementById('correctCount').textContent = results.score;
        document.getElementById('totalCount').textContent = results.total;

        this.updateProgress(results.total, results.total);
    }

    retryQuiz() {
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        
        document.getElementById('resultsContainer').classList.add('hidden');
        document.getElementById('quizContainer').classList.remove('hidden');
        
        this.renderQuestion();
        this.updateProgress(1, this.currentQuestions.length);
    }

    updateProgress(current, total) {
        document.getElementById('progressText').textContent = `${current}/${total}`;
        const percentage = total > 0 ? (current / total) * 100 : 0;
        document.getElementById('progressFill').style.width = `${percentage}%`;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GitHubReviewer();
});