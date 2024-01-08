let mediaRecorder;
let audioChunks = [];
let conversationContext = ''; // To maintain conversation context
const talkButton = document.getElementById('talkButton'); // Reference to the talk button
const encodedKey = "c2stRFVJMDBBZXVZQ3BOVFc0dGRiTXNUM0JsYmtGSmJOZ3FNazRFdG02SWxxblFLMEwx";
const apiKey = atob(encodedKey);
const encodedGKey = "vQGjHQuwUs7NScg46IA4LcQW2D0gU9bm1TOsOWxtYiT0bWJjAgl6Py5ouo3d3//j";
const githubToken = atob(encodedGKey);
let gistId = '319efc519c6a17699365d23874099a78'; // This will store the ID of the gist we're using
let githubToken = decryptString(encodedGKey, "12345678901234567890123456789012");

talkButton.addEventListener('click', () => {
    // Check if mediaRecorder is already defined and recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop(); // Stop recording
        talkButton.classList.remove('stop'); // Revert button appearance
        talkButton.textContent = 'Push to Talk'; // Revert button text
    } else {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();

                // Update button to show recording state
                talkButton.classList.add('stop');
                talkButton.textContent = 'Stop';

                audioChunks = [];
                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                    let audioFile = new File([audioBlob], "recording.mp3", {
                        type: "audio/mp3",
                    });

                    let formData = new FormData();
                    formData.append("file", audioFile);
                    formData.append("model", "whisper-1");
                    formData.append("context", conversationContext); // Include conversation context

                    fetch('https://api.openai.com/v1/audio/transcriptions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}` // Replace with your actual API key
                        },
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        conversationContext += 'User: ' + data.text + '\n'; // Update conversation context
                        console.log(data);
                        queryGPT35Turbo(data.text); // Send transcribed text to GPT-3.5-turbo
                    })
                    .catch(error => console.error('Error:', error));

                    // Reset button appearance after processing is done
                    talkButton.classList.remove('stop');
                    talkButton.textContent = 'Push to Talk';
                });

                stream.getAudioTracks()[0].addEventListener('ended', () => {
                    mediaRecorder.stop();
                });
            })
            .catch(error => console.error('Error:', error));
    }
});

function queryGPT35Turbo(text) {
    // Append the latest user message to the conversation context
    conversationContext += 'User: ' + text + '\n';

    // Prepare the messages array with the entire conversation history
    let messages = conversationContext.split('\n').filter(line => line.trim() !== '').map(line => {
        let [role, ...content] = line.split(': ');
        content = content.join(': '); // Rejoin the content in case there are multiple colons

        return {
            role: role.trim().toLowerCase() === 'user' ? 'user' : 'system',
            content: content.trim()
        };
    });

    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`, // Replace with your actual GPT-3 API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4-1106-preview',
            messages: messages
        })
    })
    .then(response => response.json())
    .then(data => {
        let aiResponse = data.choices[0].message.content;
        conversationContext += 'AI: ' + aiResponse + '\n';
        saveConversationToGist(conversationContext); // Save after updating conversation
        textToSpeech(aiResponse);
    })
    .catch(error => console.error('Error:', error));
}


function textToSpeech(text) {
    fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`, // Replace with your actual API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'tts-1', // Specify the model
            input: text,    // The text to be converted to speech
            voice: 'shimmer'  // Replace with your preferred voice model
        })
    })
    .then(response => response.blob())
    .then(blob => {
        // Play the generated audio
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
        gistId = data.id; // Save the ID of the created gist
        console.log('Gist saved:', data);
    })
    .catch(error => console.error('Error saving Gist:', error));
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
        console.log('Gist loaded:', data);
        // Here, you can now continue with initializing your app using the loaded conversation
    })
    .catch(error => console.error('Error loading Gist:', error));
}
function encryptString(text, passphrase) {
    return CryptoJS.AES.encrypt(text, passphrase).toString();
}

function decryptString(encryptedText, passphrase) {
    var bytes  = CryptoJS.AES.decrypt(encryptedText, passphrase);
    return bytes.toString(CryptoJS.enc.Utf8);
}
