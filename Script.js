// WWXXZZZTTTTTTTTGGGGGGGGGAAXXSSAA
//High-Level Overview
// This JavaScript code is designed to facilitate an interactive chat application that integrates OpenAI's GPT and TTS APIs.
// It includes functionality for recording audio, processing it for transcription, interacting with OpenAI's APIs, and managing the conversation flow.
// The code is structured to handle asynchronous events and API responses, ensuring a smooth user experience.

// Global Variables and Constants
// These variables are used throughout the script for various purposes.
// 'mediaRecorder' controls the audio recording functionality.
// 'audioChunks' stores chunks of audio data for processing.
// 'conversationContext' keeps track of the conversation history.
// 'accumulatedText' accumulates text from streamed data for processing.
// 'ttsQueue' manages a queue for text-to-speech requests.
// 'isProcessingTTS' flags if a text-to-speech process is currently active.
// 'audioQueue' queues audio URLs for sequential playback.
// 'isPlayingAudio' indicates if an audio is currently being played.
// 'gistId', 'githubToken', 'apiKey', and 'encodedKey' are used for API interactions.
// 'sse' initializes a new EventSource that listens to server-sent events.
let mediaRecorder;
let audioChunks = [];
let conversationContext = '';
let accumulatedText = '';
let accumulatedTextb = '';
let ttsQueue = [];
let isProcessingTTS = false;
let audioQueue = [];
let isPlayingAudio = false;
let gistId = '319efc519c6a17699365d23874099a78';
let githubToken = decodeString("gzhapi_r4a2ykdYlrkslZmJwxq2ySf1xHuFsUhunyrcvObungzJwDqUhvoCpDq6cHuVi0wlelefyqjxq");
let recordingInterval;
const talkButton = document.getElementById('talkButton');
const encodedKey = "c2stSDBGQXk1SGFqVm5BSTNoQ2c2N2NUM0JsYmtGSm5jMmpEQVdmbHloamwxVGs3cTJs";
const apiKey = atob(encodedKey);
const sse = new EventSource('https://mammoth-spice-peace.glitch.me/events');
const sendTextButton = document.getElementById('sendTextButton');
let firstChunk = true;



// Event Listeners
// These listeners respond to specific events such as page load, button clicks, or incoming SSE messages.
// They trigger appropriate functions like loading data from Gist, starting/stopping recording, and processing SSE data.


talkButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
        talkButton.classList.remove('stop');
        talkButton.textContent = 'Push to Talk';
//        processFullConversation();
    } else {
        startRecording();
        talkButton.classList.add('stop');
        talkButton.textContent = 'Stop';
    }
});

sendTextButton.addEventListener('click', () => {
    const userInput = document.getElementById('textInput').value;
    if (userInput) {
        document.getElementById('textInput').value = '';
        conversationContextb = '\n' + 'User: ' + userInput + '\n';
        conversationContext += '\n' + 'User: ' + userInput + '\n';
        console.log("Appended to conversation context:", conversationContext);
        updateConversationWindow(conversationContextb);
        queryGPT35Turbo(conversationContext);
    }
});

sse.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleStreamedData(data);
};

sse.onerror = (error) => {
    console.error('SSE Error:', error);
};

// Ensure loadConversationFromGist is called on window load
window.addEventListener('load', () => {
    loadConversationFromGist(gistId);
});

// Function Implementations
// Each function is documented with details on its purpose, input, output, and interaction with other components.

// startRecording: Initializes the media recorder and handles the audio stream. It sets up intervals to manage audio chunking.
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

// stopRecording: Stops the media recorder and clears the recording interval.
function stopRecording() {
    clearInterval(recordingInterval);
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

// processAudioChunk: Processes each audio chunk, converts it to an MP3 file, and sends it to OpenAI for transcription.
function processAudioChunk(audioBlob) {
    console.log("Processing audio chunk");
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
        console.log("Transcription received:", transcribedText);
        conversationContextb = '\n' + 'User: ' + transcribedText + '\n';
        conversationContext += '\n' + 'User: ' + transcribedText + '\n';
        console.log("Appended to conversation context:", conversationContext);
        updateConversationWindow(conversationContextb);
        queryGPT35Turbo(conversationContext);
    })
    .catch(error => console.error('Error:', error));
}

// processFullConversation: Processes the entire conversation by sending the current context to GPT-3.5 Turbo and updating the conversation window.
function processFullConversation() {
    console.log("Processing full conversation");
    queryGPT35Turbo(conversationContext);
}

// queryGPT35Turbo: Sends the current conversation context to GPT-3.5 Turbo for processing and appends the AI's response to the conversation.
function queryGPT35Turbo(text) {
    firstChunk = true;
    console.log("Querying GPT-3.5 Turbo with text:", text);
    // Add user's input to the conversation context for display
    //conversationContext += 'User: ' + text + '\n';
    const conversationWindow = document.getElementById('conversationWindow');
    conversationWindow.innerText = conversationContext;
    console.log("Before splitting and formatting:", conversationContext);

    // Split the conversation context into messages
    let messages = conversationContext.split('\n').filter(line => line.trim() !== '').map(line => {
        let [role, ...content] = line.split(': ');
        return {
            role: role.trim().toLowerCase() === 'user' ? 'user' : 'assistant',
            content: content.join(': ')
        };
    });
    console.log("After splitting and formatting:", messages);
    console.log("endOfEveryPromptTextEoE is currently known by the script.js to be, before trying to use it:", endOfEveryPromptTextEoE);
    // Append the 'End of Every Prompt' content to the last user message before sending to GPT
    if (endOfEveryPromptTextEoE && messages.length > 0) {
        let lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
            lastMessage.content += '\n' + endOfEveryPromptTextEoE; // Append the extra content
        }
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
        console.log("Message sent to GPT endpoint", payload);
        // Optionally handle the immediate response from the server if needed
    })
    .catch(error => {
        console.error('Error sending message to Glitch server:', error);
    });
}

// updateConversationWindow: Updates the conversation window with new text, ensuring the latest conversation is visible to the user.
function updateConversationWindow(text) {
    const conversationWindow = document.getElementById('conversationWindow');
    if (conversationWindow) {
        conversationWindow.innerText += text;
        conversationWindow.scrollTop = conversationWindow.scrollHeight;
    } else {
        console.error('Conversation window element not found');
    }
}

// textToSpeech: Converts given text to speech using OpenAI's TTS API and queues the resulting audio URL for playback.
function textToSpeech(text, callback) {
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
        queueAudio(audioUrl);
        callback();
    })
    .catch(error => {
        console.error('TTS Error:', error);
        callback();
    });
}

// saveConversationToGist: Saves the current conversation context to a GitHub Gist for persistent storage and retrieval.
function saveConversationToGist(conversationText) {
    // Fetch the current content of the Gist
    fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
            'Authorization': `token ${githubToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        // Append new conversation text to the existing content
        let updatedContent = conversationContext;

        // Prepare data for Gist update
        const gistData = {
            description: "Chat Conversation History",
            public: false,
            files: {
                "conversation.txt": {
                    content: updatedContent
                }
            }
        };

        // Update the Gist
        fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gistData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Gist updated:', data);
        })
        .catch(error => console.error('Error updating Gist:', error));
    })
    .catch(error => console.error('Error fetching Gist:', error));
}


// loadConversationFromGist: Loads conversation history from a specified GitHub Gist to restore context.
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

// decodeString: Decodes a provided string, used for obfuscating API tokens or similar sensitive data.
function decodeString(encodedStr) {
    return encodedStr.split('').filter((_, index) => index % 2 === 0).join('');
}


function handleStreamedData(data) {
    if (data.message) {
        if (firstChunk) {
            // Prepend "AI:" only at the beginning of the first chunk of a new message
            accumulatedTextb += 'AI: ';
            firstChunk = false;
        }
        accumulatedText += data.message;
        accumulatedTextb += data.message;
        
        if (/[.?!]\s*$/.test(accumulatedText)) {
            // Queue the TTS request with the full message
            queueTTSRequest(accumulatedText);

            // Update conversation context and window, then save
            conversationContext += accumulatedTextb + ' ';
            updateConversationWindow(accumulatedTextb + ' ');    
            saveConversationToGist(conversationContext);

            // Clear accumulated texts for the next message and reset firstChunk
            accumulatedText = '';
            accumulatedTextb = '';
        }
    }
}





// queueTTSRequest: Adds a text to the TTS queue and initiates processing if not already active.
function queueTTSRequest(text) {
    ttsQueue.push(text);
    if (!isProcessingTTS) {
        processNextTTSRequest();
    }
}

// processNextTTSRequest: Processes the next item in the TTS queue, sending it to the text-to-speech API.
function processNextTTSRequest() {
    if (ttsQueue.length > 0) {
        isProcessingTTS = true;
        const text = ttsQueue.shift();
        textToSpeech(text, () => {
            isProcessingTTS = false;
            processNextTTSRequest();
        });
    }
}

// queueAudio: Adds a new audio URL to the playback queue and starts playback if not already in progress.
function queueAudio(audioUrl) {
    audioQueue.push(audioUrl);
    if (!isPlayingAudio) {
        playNextAudio();
    }
}

// playNextAudio: Plays the next audio in the queue and sets up the trigger for subsequent audios.
function playNextAudio() {
    if (audioQueue.length > 0) {
        const audioUrl = audioQueue.shift();
        const audio = new Audio(audioUrl);
        isPlayingAudio = true;
        audio.play();
        audio.onended = () => {
            isPlayingAudio = false;
            playNextAudio();
        };
    }
}
