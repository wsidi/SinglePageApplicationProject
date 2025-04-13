let userName = "";
let currentQuiz = null;
let currentQuestionIndex = 0;
let totalQuestions = 5;
let questionsRight = 0;
let questionsWrong = 0;
let score = 0;
let playerName = '';
let elapsedTime = 0;
let timerInterval = null;

const API_BASE_URL = "https://my-json-server.typicode.com/wsidi/SinglePageApplicationProject";

async function fetchQuizList() {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched quiz list:", data);
        return data;
    } catch (error) {
        console.error('Error fetching quiz list:', error);
        return [];
    }
}

async function fetchQuizById(quizId) {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const quiz = await response.json();
        console.log("Fetched quiz:", quiz);
        return quiz;
    } catch (error) {
        console.error(`Error fetching quiz ${quizId}:`, error);
        return null;
    }
}

async function fetchQuestionById(quizId, questionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/questions`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched questions:", data);
        
        if (!data[quizId]) {
            throw new Error(`Questions for quiz '${quizId}' not found in database`);
        }
        
        const question = data[quizId].find(q => q.id === questionId);
        if (!question) {
            throw new Error(`Question with ID ${questionId} not found in quiz '${quizId}'`);
        }
        
        console.log("Found question:", question);
        return question;
    } catch (error) {
        console.error(`Error fetching question ${questionId}:`, error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing quiz application...');
    showNameEntry();
});

function showNameEntry() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error('Main content element not found');
        return;
    }
    
    const template = Handlebars.compile(document.getElementById('name-entry-template').innerHTML);
    const html = template({});
    mainContent.innerHTML = html;
    
    const nameForm = document.getElementById('name-form');
    if (nameForm) {
        nameForm.addEventListener('submit', handleNameSubmit);
    } else {
        console.error('Name form not found');
    }
}

function handleNameSubmit(event) {
    event.preventDefault();
    userName = document.getElementById('user-name').value.trim();
    if (userName) {
        showQuizSelection();
    }
}

async function showQuizSelection() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error('Main content element not found');
        return;
    }
    
    try {
        const quizzes = await fetchQuizList();
        const template = Handlebars.compile(document.getElementById('quiz-selection-template').innerHTML);
        const html = template({ userName, quizzes });
        mainContent.innerHTML = html;
        
        document.querySelectorAll('[data-quiz]').forEach(button => {
            button.addEventListener('click', (event) => {
                const quizId = event.target.getAttribute('data-quiz');
                startQuiz(quizId);
            });
        });
    } catch (error) {
        console.error('Error showing quiz selection:', error);
        mainContent.innerHTML = '<div class="alert alert-danger">Error loading quizzes. Please try again later.</div>';
    }
}

async function startQuiz(quizId) {
    try {
        currentQuiz = await fetchQuizById(quizId);
        if (!currentQuiz) {
            console.error('Failed to load quiz');
            return;
        }
        
        currentQuestionIndex = 0;
        questionsRight = 0;
        questionsWrong = 0;
        
        showQuestion();
    } catch (error) {
        console.error('Error starting quiz:', error);
    }
}

async function showQuestion() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error('Main content element not found');
        return;
    }
    
    try {
        const question = await fetchQuestionById(currentQuiz.id, currentQuestionIndex + 1);
        if (!question) {
            console.error('Failed to load question');
            mainContent.innerHTML = '<div class="alert alert-danger">Error loading question. Please try again later.</div>';
            return;
        }
        
        let templateId = '';
        switch (question.type) {
            case 'text':
                templateId = 'text-response-template';
                break;
            case 'multiple-choice':
                templateId = 'multiple-choice-template';
                break;
            case 'image-selection':
                templateId = 'image-selection-template';
                break;
            default:
                console.error('Unknown question type:', question.type);
                mainContent.innerHTML = '<div class="alert alert-danger">Unknown question type. Please try again later.</div>';
                return;
        }
        
        const templateElement = document.getElementById(templateId);
        if (!templateElement) {
            console.error(`Template ${templateId} not found`);
            mainContent.innerHTML = '<div class="alert alert-danger">Error loading template. Please try again later.</div>';
            return;
        }
        
        const template = Handlebars.compile(templateElement.innerHTML);
        const html = template({
            question: question.question,
            hint: question.hint || '',
            options: question.options || [],
            imageOptions: question.imageOptions || [],
            totalQuestions: totalQuestions,
            questionsRight: questionsRight,
            questionsWrong: questionsWrong
        });
        
        mainContent.innerHTML = html;
        
        if (question.type === 'text' || question.type === 'multiple-choice') {
            document.querySelectorAll('.option-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const answer = event.target.getAttribute('data-option');
                    handleMultipleChoice(answer);
                });
            });
        } else if (question.type === 'image-selection') {
            document.querySelectorAll('.option-image').forEach(image => {
                image.addEventListener('click', (event) => {
                    const answer = event.target.getAttribute('data-option');
                    handleImageSelection(answer);
                });
            });
        }
    } catch (error) {
        console.error('Error showing question:', error);
        mainContent.innerHTML = '<div class="alert alert-danger">Error loading question. Please try again later.</div>';
    }
}

function handleMultipleChoice(answer) {
    fetchQuestionById(currentQuiz.id, currentQuestionIndex + 1)
        .then(question => {
            if (!question) {
                console.error('Failed to load question for answer validation');
                return;
            }
            
            const correctAnswer = question.correctAnswer;
            
            if (answer === correctAnswer) {
                questionsRight++;
                showCorrectAnswer();
            } else {
                questionsWrong++;
                showWrongAnswer(question);
            }
        })
        .catch(error => {
            console.error('Error validating answer:', error);
        });
}

function handleImageSelection(answer) {
    fetchQuestionById(currentQuiz.id, currentQuestionIndex + 1)
        .then(question => {
            if (!question) {
                console.error('Failed to load question for answer validation');
                return;
            }
            
            const correctAnswer = question.correctAnswer;
            
            if (answer === correctAnswer) {
                questionsRight++;
                showCorrectAnswer();
            } else {
                questionsWrong++;
                showWrongAnswer(question);
            }
        })
        .catch(error => {
            console.error('Error validating answer:', error);
        });
}

function showCorrectAnswer() {
    document.body.classList.add('correct-answer');
    
    const template = Handlebars.compile(document.getElementById('correct-answer-template').innerHTML);
    const html = template({});
    document.getElementById('main-content').innerHTML = html;
    
    setTimeout(() => {
        document.body.classList.remove('correct-answer');
        nextQuestion();
    }, 1000);
}

function showWrongAnswer(question) {
    document.body.classList.add('wrong-answer');
    
    const template = Handlebars.compile(document.getElementById('wrong-answer-template').innerHTML);
    const html = template({
        correctAnswer: question.correctAnswer,
        studyLink: question.studyLink || '#'
    });
    document.getElementById('main-content').innerHTML = html;
    
    document.getElementById('continue-btn').addEventListener('click', () => {
        document.body.classList.remove('wrong-answer');
        nextQuestion();
    });
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < totalQuestions) {
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    const percentage = (questionsRight / totalQuestions) * 100;
    const passed = percentage >= 80;
    
    const template = Handlebars.compile(document.getElementById('results-template').innerHTML);
    const html = template({
        userName: userName,
        questionsRight: questionsRight,
        totalQuestions: totalQuestions,
        percentage: percentage.toFixed(1),
        resultTitle: passed ? "Congratulations! You passed the quiz!" : "Sorry, you failed the quiz."
    });
    
    document.getElementById('main-content').innerHTML = html;
    
    document.getElementById('restart-btn').addEventListener('click', () => {
        startQuiz(currentQuiz.id);
    });
    
    document.getElementById('menu-btn').addEventListener('click', showQuizSelection);
}

Handlebars.registerHelper('onClick', function(action, param) {
    return `onclick="${action}('${param}')"`;
});
