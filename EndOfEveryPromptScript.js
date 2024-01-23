// WWXXZZZTTTTTTTTGGGGGGGGGAAAA

// Global Variables and Constants
// These variables are used throughout the script for various purposes.
// 'mediaRecorderEoE' controls the audio recording functionality.
// 'audioChunksEoE' stores chunks of audio data for processing.
// 'conversationContextEoE' keeps track of the conversation history.
// 'accumulatedTextEoE' accumulates text from streamed data for processing.
// 'ttsQueueEoE' manages a queue for text-to-speech requests.
// 'isProcessingTTSEoE' flags if a text-to-speech process is currently active.
// 'audioQueueEoE' queues audio URLs for sequential playback.
// 'isPlayingAudioEoE' indicates if an audio is currently being played.
// 'gistIdEoE', 'githubTokenEoE', 'apiKeyEoE', and 'encodedKeyEoE' are used for API interactions.
// 'sseEoE' initializes a new EventSource that listens to server-sent events.
let mediaRecorderEoE;
let audioChunksEoE = [];
let conversationContextEoE = '';
let accumulatedTextEoE = '';
let accumulatedTextEoEb = '';
let ttsQueueEoE = [];
let isProcessingTTSEoE = false;
let audioQueueEoE = [];
let isPlayingAudioEoE = false;
let gistIdEoE = '319efc519c6a17699365d23874099a78';
let githubTokenEoE = decodeString("gzhapi_r4a2ykdYlrkslZmJwxq2ySf1xHuFsUhunyrcvObungzJwDqUhvoCpDq6cHuVi0wlelefyqjxq");
let recordingIntervalEoE;
let endOfEveryPromptTextEoE = '';
const talkButtonEndOfEveryPromptEoE = document.getElementById('talkButtonEndOfEveryPromptEoE');
const encodedKeyEoE = "c2stM3RScFE4YWxydktBZ3J1OGZtNnFUM0JsYmtGSmtCSUxib1liT1NQV0k2Z2hsWERM";
const apiKeyEoE = atob(encodedKeyEoE);
const sseEoE = new EventSource('https://mammoth-spice-peace.glitch.me/events');
const submitEndOfEveryPromptEditEoE = document.getElementById('submitEndOfEveryPromptEditEoE');
let firstChunkEoE = true;



// Event Listeners
// These listeners respond to specific events such as page load, button clicks, or incoming sseEoE messages.
// They trigger appropriate functions like loading data from Gist, starting/stopping recording, and processing sseEoE data.
window.addEventListener('load', () => {
    loadEndOfEveryPromptFromGistEoE(gistIdEoE);
});

talkButtonEndOfEveryPromptEoE.addEventListener('click', () => {
    if (mediaRecorderEoE && mediaRecorderEoE.state === 'recording') {
        stopRecordingEoE();
        talkButtonEndOfEveryPromptEoE.classList.remove('stop');
        talkButtonEndOfEveryPromptEoE.textContent = 'Push to Talk';
//        processFullConversation();
    } else {
        startRecordingEoE();
        talkButtonEndOfEveryPromptEoE.classList.add('stop');
        talkButtonEndOfEveryPromptEoE.textContent = 'Stop';
    }
});

submitEndOfEveryPromptEditEoE.addEventListener('click', () => {
    const userInputEoE = document.getElementById('endOfEveryPromptInput').value;
    if (userInputEoE) {
        document.getElementById('endOfEveryPromptInput').value = '';
        conversationContextEoEb = '\n' + 'User: ' + userInputEoE + '\n';
        conversationContextEoE += '\n' + 'User: ' + userInputEoE + '\n';
        console.log("Appended to conversation context:", conversationContextEoE);
        updateConversationWindow(conversationContextEoEb);
        queryGPT35Turbo(conversationContextEoE);
    }
});

sseEoE.onmessage = (eventEoE) => {
    const dataEoE = JSON.parse(eventEoE.dataEoE);
    handleStreamedDataEoE(dataEoE);
};

sseEoE.onerror = (errorEoE) => {
    console.errorEoE('sseEoE errorEoE:', errorEoE);
};

// Ensure loadConversationFromGistEoE is called on window load
window.addEventListener('load', () => {
    loadConversationFromGistEoE(gistIdEoE);
    loadEndOfEveryPromptFromGistEoE(gistIdEoE);
});

// Function Implementations
// Each function is documented with details on its purpose, input, output, and interaction with other components.

// startRecordingEoE: Initializes the media recorder and handles the audio streamEoE. It sets up intervals to manage audio chunking.
function startRecordingEoE() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(streamEoE => {
            mediaRecorderEoE = new mediaRecorderEoE(streamEoE);
            mediaRecorderEoE.start();
            recordingIntervalEoE = setInterval(() => {
                if (mediaRecorderEoE.state === 'recording') {
                    mediaRecorderEoE.stop();
                    mediaRecorderEoE.start();
                }
            }, 30000); // Restart recording every 30 seconds

            mediaRecorderEoE.addEventListener("dataavailable", eventEoE => {
                audioChunksEoE.push(eventEoE.dataEoE);
                processAudioChunkEoE(eventEoE.dataEoE);
            });

            streamEoE.getAudioTracks()[0].addEventListener('ended', stopRecordingEoE);
        })
        .catch(errorEoE => console.errorEoE('errorEoE:', errorEoE));
}

// stopRecordingEoE: Stops the media recorder and clears the recording interval.
function stopRecordingEoE() {
    clearInterval(recordingIntervalEoE);
    if (mediaRecorderEoE && mediaRecorderEoE.state === 'recording') {
        mediaRecorderEoE.stop();
    }
}

// processAudioChunkEoE: ProcesseEoEs each audio chunk, converts it to an MP3 file, and sends it to OpenAI for transcription.
function processAudioChunkEoE(audioBlob) {
    console.log("Processing audio chunk");
    let audioFileEoE = new File([audioBlob], "recording.mp3", {
        type: "audio/mp3",
    });

    let formdataEoE = new FormdataEoE();
    formdataEoE.append("file", audioFileEoE);
    formdataEoE.append("model", "whisper-1");

    fetch('https://api.openai.com/v1/audio/transcriptions', {
        methodEoE: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKeyEoE}`
        },
        body: formdataEoE
    })
    .then(responseEoE => responseEoE.json())
    .then(dataEoE => {
        let transcribedTextEoE = dataEoE.text;
        console.log("Transcription received:", transcribedTextEoE);
        conversationContextEoEb = '\n' + 'User: ' + transcribedTextEoE + '\n';
        conversationContextEoE += '\n' + 'User: ' + transcribedTextEoE + '\n';
        console.log("Appended to conversation context:", conversationContextEoE);
        updateConversationWindow(conversationContextEoEb);
        queryGPT35Turbo(conversationContextEoE);
    })
    .catch(errorEoE => console.errorEoE('errorEoE:', errorEoE));
}



// textToSpeechEoE: Converts given text to speech using OpenAI's TTS API and queues the resulting audio urlEoE for playback.
function textToSpeechEoE(text, callback) {
    fetch('https://api.openai.com/v1/audio/speech', {
        methodEoE: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKeyEoE}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: 'shimmer'
        })
    })
    .then(responseEoE => responseEoE.blobEoE())
    .then(blobEoE => {
        const audioUrlEoE = urlEoE.createObjectURL(blobEoE);
        queueAudioEoE(audioUrlEoE);
        callback();
    })
    .catch(errorEoE => {
        console.errorEoE('TTS errorEoE:', errorEoE);
        callback();
    });
}

// loadEndOfEveryPromptFromGistEoE: Loads additional text (used at the end of every prompt) from a GitHub Gist.
function loadEndOfEveryPromptFromGistEoE(gistIdEoE) {
    fetch(`https://api.github.com/gists/${gistIdEoE}`)
        .then(responseEoE => responseEoE.json())
        .then(dataEoE => {
            // Assuming the content is stored in a file named 'endOfEveryPrompt.txt' in the gist
            endOfEveryPromptTextEoE = dataEoE.files['endOfEveryPrompt.txt'].content;

            // Update the text area with the fetched content
            document.getElementById('endOfEveryPromptContent').value = endOfEveryPromptTextEoE;
        })
        .catch(errorEoE => {
            console.errorEoE('errorEoE loading End of Every Prompt content:', errorEoE);
            // Handle any errors here, such as displaying an errorEoE message to the user
        });
}

// saveEndOfEveryPromptToGistEoE: Saves updated 'end of every prompt' text to a GitHub Gist for future use.
function saveEndOfEveryPromptToGistEoE(updatedTextEoE) {
    const gistdataEoE = {
        description: "End of Every Prompt Content",
        public: false,
        files: {
            "endOfEveryPrompt.txt": {
                content: updatedTextEoE
            }
        }
    };

    const methodEoE = gistIdEoE ? 'PATCH' : 'POST';
    const urlEoE = gistIdEoE ? `https://api.github.com/gists/${gistIdEoE}` : 'https://api.github.com/gists';

    fetch(urlEoE, {
        methodEoE: methodEoE,
        headers: {
            'Authorization': `token ${githubTokenEoE}`, // Ensure you have a valid GitHub token
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(gistdataEoE)
    })
    .then(responseEoE => responseEoE.json())
    .then(dataEoE => {
        if (dataEoE && dataEoE.id) {
            gistIdEoEForEndOfEveryPromptEoE = dataEoE.id; // Save the Gist ID for future updates
            endOfEveryPromptTextEoE = updatedTextEoE; // Update the global variable
            console.log('Gist updated successfully:', dataEoE);
        } else {
            throw new errorEoE('Failed to update Gist');
        }
    })
    .catch(errorEoE => {
        console.errorEoE('errorEoE updating Gist:', errorEoE);
    });
}

// processeEoEndOfEveryPromptEditEoE: ProcesseEoEs user edits to the 'end of every prompt' text and updates it in the Gist.
function processeEoEndOfEveryPromptEditEoE(userInputEoE) {
    // Predefined introduction text explaining the purpose of the text
    let introTextEoE = "This is the text of a set of custom instructions for an implementation of GPT-4:\n";

    // Current end of every prompt content
    let currentContentEoE = endOfEveryPromptTextEoE;

    // User's proposed changes
    let changeRequestEoE = "\nThe user wants to change these instrctions. This is a prompt provided by the user to change these instructions:\n" + userInputEoE;

    // Specific instruction for GPT-4
    let instructionForGPTEoE = "\nPlease return new custom instructions revised based on this user prompt. Only return the revised instructions exactly, with no additional text before or after.";

    // Complete prompt to send to GPT-4
    let completePromptEoE = introTextEoE + currentContentEoE + changeRequestEoE + instructionForGPTEoE;

    // Send completePromptEoE to GPT-4, process the responseEoE, and update the end of every prompt text and gist
    fetch('https://api.openai.com/v1/chat/completions', {
        methodEoE: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKeyEoE}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4-1106-preview',
            messages: [{role: "assistant", content: completePromptEoE}] // Structure as per Chat API requirements
        })
    })
    .then(responseEoE => responseEoE.json())
    .then(dataEoE => {
        let revisedInstructionsEoE = dataEoE.choices[0].message.content;
        endOfEveryPromptTextEoE = revisedInstructionsEoE;
        document.getElementById('endOfEveryPromptInput').value = revisedInstructionsEoE;
        saveEndOfEveryPromptToGistEoE(revisedInstructionsEoE); // Function to save to gist
    })
    .catch(errorEoE => {
        console.errorEoE('errorEoE processing end of every prompt edit:', errorEoE);
    });
}

function handleStreamedDataEoE(dataEoE) {
    if (dataEoE.message) {
        if (firstChunkEoE) {
            // Prepend "AI:" only at the beginning of the first chunk of a new message
            accumulatedTextEoEb += 'AI: ';
            firstChunkEoE = false;
        }
        accumulatedTextEoE += dataEoE.message;
        accumulatedTextEoEb += dataEoE.message;
        
        if (/[.?!]\s*$/.test(accumulatedTextEoE)) {
            // Queue the TTS request with the full message
            queueTTSRequestEoE(accumulatedTextEoE);

            // Update conversation context and window, then save
            conversationContextEoE += accumulatedTextEoEb + ' ';
            updateConversationWindow(accumulatedTextEoEb + ' ');    
            saveConversationToGistEoE(conversationContextEoE);

            // Clear accumulated texts for the next message and reset firstChunkEoE
            accumulatedTextEoE = '';
            accumulatedTextEoEb = '';
        }
    }
}





// queueTTSRequestEoE: Adds a text to the TTS queue and initiates processing if not already active.
function queueTTSRequestEoE(text) {
    ttsQueueEoE.push(text);
    if (!isProcessingTTSEoE) {
        processNextTTSRequestEoE();
    }
}

// processNextTTSRequestEoE: ProcesseEoEs the next item in the TTS queue, sending it to the text-to-speech API.
function processNextTTSRequestEoE() {
    if (ttsQueueEoE.length > 0) {
        isProcessingTTSEoE = true;
        const textEoE = ttsQueueEoE.shift();
        textToSpeechEoE(textEoE, () => {
            isProcessingTTSEoE = false;
            processNextTTSRequestEoE();
        });
    }
}

// queueAudioEoE: Adds a new audio urlEoE to the playback queue and starts playback if not already in progress.
function queueAudioEoE(audioUrlEoE) {
    audioQueueEoE.push(audioUrlEoE);
    if (!isPlayingAudioEoE) {
        playNextAudioEoE();
    }
}

// playNextAudioEoE: Plays the next audio in the queue and sets up the trigger for subsequent audios.
function playNextAudioEoE() {
    if (audioQueueEoE.length > 0) {
        const audioUrlEoE = audioQueueEoE.shift();
        const audioEoE = new Audio(audioUrlEoE);
        isPlayingAudioEoE = true;
        audioEoE.play();
        audioEoE.onended = () => {
            isPlayingAudioEoE = false;
            playNextAudioEoE();
        };
    }
}
