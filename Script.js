let mediaRecorder;
let audioChunks = [];
let conversationContext = ''; // To maintain conversation context
let notesContext = ''; // To maintain notes context
const talkButton = document.getElementById('talkButton'); // Reference to the talk button
const updateNotesButton = document.getElementById('updateNotesButton'); // Reference to the update notes button
const encodedKey = "c2stRFVJMDBBZXVZQ3BOVFc0dGRiTXNUM0JsYmtGSmJOZ3FNazRFdG02SWxxblFLMEwx";
const apiKey = atob(encodedKey);
let gistId = '319efc519c6a17699365d23874099a78'; // This will store the ID of the gist we're using
let notesGistId = '19ebfaf5081406185378963c89d8c581'; // Separate Gist ID for notes
let githubToken = decodeString("gzhapi_r4a2ykdYlrkslZmJwxq2ySf1xHuFsUhunyrcvObungzJwDqUhvoCpDq6cHuVi0wlelefyqjxq");
let recordingInterval;
//fdsmaxasedutu

window.onload = () => {
    loadConversationFromGist(gistId); // Existing function to load conversation
    loadNotesFromGist(); // New function to load notes
};

talkButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
        talkButton.classList.remove('stop');
        talkButton.textContent = 'Push to Talk';
        processFullConversation();
    } else {
        startRecording();
        talkButton.classList.add('stop');
        talkButton.textContent = 'Stop';
    }
});

updateNotesButton.addEventListener('click', () => {
    const notesInput = document.getElementById('notesInput').value;
    if (notesInput) {
        notesContext = notesInput;
        saveNotesToGist(notesContext);
        updateNotesWindow(notesInput);
    }
});

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            recordingInterval = setInterval(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                    mediaRecorder.start();
                }
            }, 30000); // Restart recording every 30 seconds

            mediaRecorder.addEventListener("dataavailable", event => {
                audioChunks.push(event.data);
                processAudioChunk(event.data);
            });

            stream.getAudioTracks()[0].addEventListener('ended', stopRecording);
        })
        .catch(error => console.error('Error:', error));
}

function stopRecording() {
    clearInterval(recordingInterval);
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

function processAudioChunk(audioBlob) {
    let audioFile = new File([audioBlob], "recording.mp3", {
        type: "audio/mp3",
    });

    let formData = new FormData();
    formData.append("file", audioFile);
    formData.append("model", "whisper-1");

    fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        let transcribedText = data.text;
        conversationContext += 'User: ' + transcribedText + '\n';
        updateConversationWindow(transcribedText);
    })
    .catch(error => console.error('Error:', error));
}

function processFullConversation() {
    queryGPT35Turbo(conversationContext);
}

function queryGPT35Turbo(text) {
    // Combine the latest user prompt with the notes
    const fullText = text + '\\n\\nImportant Things To Remember When Responding To This Chat:\\n' + notesContext;

    // Update the conversation context with the user's latest prompt only
    conversationContext += 'User: ' + text + '\n';

    // Update the conversation window with the current conversation context
    updateConversationWindow(conversationContext);

    let messages = conversationContext.split('\n').filter(line => line.trim() !== '').map(line => {
        let [role, ...content] = line.split(': ');
        content = content.join(': ');

        return {
            role: role.trim().toLowerCase() === 'user' ? 'user' : 'system',
            content: content
        };
    });

    // Add the fullText as the latest message to send to the API
    messages.push({
        role: 'user',
        content: fullText
    });
    let tools = [{
        "type": "function",
        "function": {
            "name": "managePersistentInstructions",
            "description": "Manage Persistent Instructions",
            "parameters": {
                "type": "object",
                "properties": {
                    "chat_completion": {
                        "type": "string",
                        "description": "The regular chat completion response"
                    },
                    "change_to_Persistent_Instructions": {
                        "type": "string",
                        "description": "When the user explicitly asks to make an addition, subtraction, or edit to the Persistent Instructions section and specifically uses the specific phrase 'persistent instructions', that change will go here."
                    }
                },
                "required": ["chat_completion", "change_to_Persistent_Instructions"]
            },
        }
    }];

    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4-1106-preview',
            messages: messages,
            tools: tools
        })
    })
    .then(response => response.json())
    .then(data => {
        let aiResponse = data.choices[0].message.content;
        conversationContext += 'AI: ' + aiResponse + '\n';
        updateConversationWindow(aiResponse);
        saveConversationToGist(conversationContext);
        textToSpeech(aiResponse);

        // Call parseChatGPTResponseForNotesUpdate here to process the response
        parseChatGPTResponseForNotesUpdate(aiResponse);
    })
    .catch(error => console.error('Error:', error));
}

function updateNotesWindow(text) {
    const notesWindow = document.getElementById('notesWindow');
    if (notesWindow) {
        notesWindow.innerText = text; // Update the notes window
    } else {
        console.error('Notes window element not found');
    }
}

function saveNotesToGist(notesText) {
    const gistData = {
        description: "Notes History",
        public: false,
        files: {
            "notes.txt": {
                content: notesText
            }
        }
    };

    const method = notesGistId ? 'PATCH' : 'POST';
    const url = notesGistId ? `https://api.github.com/gists/${notesGistId}` : 'https://api.github.com/gists';

    fetch(url, {
        method: method,
        headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(gistData)
    })
    .then(response => response.json())
    .then(data => {
        notesGistId = data.id; // Update the notesGistId with the new or existing gist ID
        console.log('Notes Gist saved:', data);
    })
    .catch(error => console.error('Error saving Notes Gist:', error));
updateNotesWindow(notesText);
}

function parseChatGPTResponseForNotesUpdate(response) {
    const updatePrefix = "i have updated the important things to remember section as follows:";
    const lowerCaseResponse = response.toLowerCase();

    if (lowerCaseResponse.includes(updatePrefix)) {
        const updateTextStartIndex = lowerCaseResponse.indexOf(updatePrefix) + updatePrefix.length;
        // Extract the update text from the original response to preserve the original case
        const updateText = response.substring(updateTextStartIndex).trim();
        notesContext += '\\n' + updateText; // Append the update to the notes context
        updateNotesWindow(notesContext); // Update the notes window with the new notes context
        saveNotesToGist(notesContext); // Save the updated notes to the gist
        console.log('Worked');
    } else {
        console.log('lowerCaseResponse:',lowerCaseResponse,'   updatePrefix:',updatePrefix);
    }
}

function textToSpeech(text) {
    fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: 'shimmer'
        })
    })
    .then(response => response.blob())
    .then(blob => {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.play();
    })
    .catch(error => console.error('TTS Error:', error));
}

function saveConversationToGist(conversationText) {
    const gistData = {
        description: "Chat Conversation History",
        public: false,
        files: {
            "conversation.txt": {
                content: conversationText
            }
        }
    };

    const method = gistId ? 'PATCH' : 'POST';
    const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';

    fetch(url, {
        method: method,
        headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(gistData)
    })
    .then(response => response.json())
    .then(data => {
        gistId = data.id;
        console.log('Gist saved:', data);
    })
    .catch(error => console.error('Error saving Gist:', error));
}

function updateConversationWindow(text) {
    const conversationWindow = document.getElementById('conversationWindow');
    if (conversationWindow) {
        conversationWindow.innerText += text + '\n'; // Append new text
        conversationWindow.scrollTop = conversationWindow.scrollHeight; // Auto-scroll to the latest message
    } else {
        console.error('Conversation window element not found');
    }
}

function loadConversationFromGist(gistId) {
    fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
            'Authorization': `token ${githubToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        conversationContext = data.files['conversation.txt'].content;
        updateConversationWindow(conversationContext);
        console.log('Gist loaded:', data);
    })
    .catch(error => console.error('Error loading Gist:', error));
}

function loadNotesFromGist() {
    if (!notesGistId) {
        console.log('No notes gist ID found');
        return;
    }

    fetch(`https://api.github.com/gists/${notesGistId}`, {
        headers: {
            'Authorization': `token ${githubToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        notesContext = data.files['notes.txt'].content;
        updateNotesWindow(notesContext);
        console.log('Notes Gist loaded:', data);
    })
    .catch(error => console.error('Error loading Notes Gist:', error));
}
loadConversationFromGist(gistId); // Call this function when the page loads

function decodeString(encodedStr) {
    return encodedStr.split('').filter((_, index) => index % 2 === 0).join('');
}

const sendTextButton = document.getElementById('sendTextButton');

sendTextButton.addEventListener('click', () => {
    const userInput = document.getElementById('textInput').value;
    if (userInput) {
        queryGPT35Turbo(userInput);
        document.getElementById('textInput').value = '';
    }
});
