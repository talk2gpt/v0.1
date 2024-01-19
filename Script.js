let mediaRecorder;
let audioChunks = [];
let conversationContext = ''; // To maintain conversation context
const talkButton = document.getElementById('talkButton'); // Reference to the talk button
const encodedKey = "c2stRFVJMDBBZXVZQ3BOVFc0dGRiTXNUM0JsYmtGSmJOZ3FNazRFdG02SWxxblFLMEwx";
const apiKey = atob(encodedKey);
let gistId = '319efc519c6a17699365d23874099a78'; // This will store the ID of the gist we're using
let githubToken = decodeString("gzhapi_r4a2ykdYlrkslZmJwxq2ySf1xHuFsUhunyrcvObungzJwDqUhvoCpDq6cHuVi0wlelefyqjxq");
let recordingInterval;
let endOfEveryPromptText = ''; // This will hold the text to be appended at the end of every prompt
const sse = new EventSource('https://mammoth-spice-peace.glitch.me/events');
//nbvnnnn

// Call this function with the appropriate gist ID when the page loads
window.addEventListener('load', () => {
    loadEndOfEveryPromptFromGist(gistId);
});

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
    // Add user's input to the conversation context for display
    conversationContext += 'User: ' + text + '\n';
    updateConversationWindow('User: ' + text);

    // Split the conversation context into messages
    let messages = conversationContext.split('\n').filter(line => line.trim() !== '').map(line => {
        let [role, ...content] = line.split(': ');
        return {
            role: role.trim().toLowerCase() === 'user' ? 'user' : 'system',
            content: content.join(': ')
        };
    });

    // Append the 'End of Every Prompt' content to the last user message
    if (endOfEveryPromptText && messages.length > 0 && messages[messages.length - 1].role === 'user') {
        messages[messages.length - 1].content += '\n' + endOfEveryPromptText;
    }

    // Construct the payload to send to your Glitch server
    let payload = {
        model: 'gpt-4-1106-preview',
        messages: messages
    };

    // Send the payload to your Glitch server
    fetch('https://mammoth-spice-peace.glitch.me/send-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // Optionally handle the immediate response from the server if needed
    })
    .catch(error => {
        console.error('Error sending message to Glitch server:', error);
    });
}

// Utility function to update the conversation window
function updateConversationWindow(text) {
    const conversationWindow = document.getElementById('conversationWindow');
    if (conversationWindow) {
        conversationWindow.innerText += text + '\n';
        conversationWindow.scrollTop = conversationWindow.scrollHeight;
    } else {
        console.error('Conversation window element not found');
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

// Function to load and display text from the 'End of Every Prompt' gist
function loadEndOfEveryPromptFromGist(gistId) {
    fetch(`https://api.github.com/gists/${gistId}`)
        .then(response => response.json())
        .then(data => {
            // Assuming the content is stored in a file named 'endOfEveryPrompt.txt' in the gist
            endOfEveryPromptText = data.files['endOfEveryPrompt.txt'].content;

            // Update the text area with the fetched content
            document.getElementById('endOfEveryPromptInput').value = endOfEveryPromptText;
        })
        .catch(error => {
            console.error('Error loading End of Every Prompt content:', error);
            // Handle any errors here, such as displaying an error message to the user
        });
}

function saveEndOfEveryPromptToGist(updatedText) {
    const gistData = {
        description: "End of Every Prompt Content",
        public: false,
        files: {
            "endOfEveryPrompt.txt": {
                content: updatedText
            }
        }
    };

    const method = gistId ? 'PATCH' : 'POST';
    const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';

    fetch(url, {
        method: method,
        headers: {
            'Authorization': `token ${githubToken}`, // Ensure you have a valid GitHub token
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(gistData)
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.id) {
            gistIdForEndOfEveryPrompt = data.id; // Save the Gist ID for future updates
            endOfEveryPromptText = updatedText; // Update the global variable
            console.log('Gist updated successfully:', data);
        } else {
            throw new Error('Failed to update Gist');
        }
    })
    .catch(error => {
        console.error('Error updating Gist:', error);
    });
}

document.getElementById('submitEndOfEveryPromptEdit').addEventListener('click', () => {
    let userInput = document.getElementById('endOfEveryPromptInput').value;
    processEndOfEveryPromptEdit(userInput);
});



function processEndOfEveryPromptEdit(userInput) {
    // Predefined introduction text explaining the purpose of the text
    let introText = "This is the text of a set of custom instructions for an implementation of GPT-4:\n";

    // Current end of every prompt content
    let currentContent = endOfEveryPromptText;

    // User's proposed changes
    let changeRequest = "\nThe user wants to change these instrctions. This is a prompt provided by the user to change these instructions:\n" + userInput;

    // Specific instruction for GPT-4
    let instructionForGPT = "\nPlease return new custom instructions revised based on this user prompt. Only return the revised instructions exactly, with no additional text before or after.";

    // Complete prompt to send to GPT-4
    let completePrompt = introText + currentContent + changeRequest + instructionForGPT;

    // Send completePrompt to GPT-4, process the response, and update the end of every prompt text and gist
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4-1106-preview',
            messages: [{role: "system", content: completePrompt}] // Structure as per Chat API requirements
        })
    })
    .then(response => response.json())
    .then(data => {
        let revisedInstructions = data.choices[0].message.content;
        endOfEveryPromptText = revisedInstructions;
        document.getElementById('endOfEveryPromptInput').value = revisedInstructions;
        saveEndOfEveryPromptToGist(revisedInstructions); // Function to save to gist
    })
    .catch(error => {
        console.error('Error processing end of every prompt edit:', error);
    });
}

const openaiWebSocketURL = 'wss://api.openai.com/v1/chat/completions/stream';

let webSocket = new WebSocket(openaiWebSocketURL, {
    headers: {
        'Authorization': `Bearer ${apiKey}`
    }
});

webSocket.onopen = function(event) {
    console.log("WebSocket Connection Established", event);
    // Connection is open, can send data using webSocket.send()
};

webSocket.onmessage = function(event) {
    console.log("Message from WebSocket:", event.data);
    // Handle incoming messages
};

webSocket.onerror = function(event) {
    console.error("WebSocket Error:", event);
    // Handle errors
};

webSocket.onclose = function(event) {
    console.log("WebSocket Connection Closed", event);
    // Handle connection closure
};


// Event Listener for User Input

sendTextButton.addEventListener('click', () => {
    const userInput = document.getElementById('textInput').value;
    if (userInput) {
        queryGPT35Turbo(userInput); // This now sends to the Glitch server
        document.getElementById('textInput').value = ''; // Clear the input field
    }
});

function sendUserInputToChat(inputText) {
    const message = {
        role: "user",
        content: inputText
    };

    if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify(message));

        // Update conversation context and UI
        conversationContext += 'User: ' + inputText + '\n';
        updateConversationWindow('User: ' + inputText);
    } else {
        console.error("WebSocket is not open.");
        // Handle the scenario where the WebSocket is not open
    }
}

let messageBuffer = ''; // Initialize the message buffer

webSocket.onmessage = function(event) {
    console.log("Message from WebSocket:", event.data);
    messageBuffer += event.data;

    if (isMessageComplete(messageBuffer)) {
        try {
            const response = JSON.parse(messageBuffer);
            if (response && response.choices && response.choices[0] && response.choices[0].message) {
                const aiResponse = response.choices[0].message.content;
                conversationContext += 'AI: ' + aiResponse + '\n';
                updateConversationWindow('AI: ' + aiResponse);
            }
            messageBuffer = ''; // Clear the buffer
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    }
};

function isMessageComplete(buffer) {
    // Implement logic to determine if the buffered data forms a complete message
    // For example, check for a specific delimiter or closing character
    return buffer.endsWith('\n'); // Example condition
}

function updateConversationWindow(text) {
    const conversationWindow = document.getElementById('conversationWindow');
    if (conversationWindow) {
        conversationWindow.innerText += text + '\n';
        conversationWindow.scrollTop = conversationWindow.scrollHeight;
    } else {
        console.error('Conversation window element not found');
    }
}

sse.onmessage = (event) => {
    // Handle incoming data
    const data = JSON.parse(event.data);
    handleStreamedData(data);
};

sse.onerror = (error) => {
    console.error('SSE Error:', error);
    // Handle any errors that occur
};

function handleStreamedData(data) {
    // Assuming 'data' contains the response from OpenAI
    if (data.response) {
        updateConversationWindow(data.response);
        textToSpeech(data.response);
    }
}

