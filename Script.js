let mediaRecorder;
let audioChunks = [];
let conversationContext = ''; // To maintain conversation context
const talkButton = document.getElementById('talkButton'); // Reference to the talk button
const encodedKey = "c2stRFVJMDBBZXVZQ3BOVFc0dGRiTXNUM0JsYmtGSmJOZ3FNazRFdG02SWxxblFLMEwx";
const apiKey = atob(encodedKey);

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
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`, // Replace with your actual GPT-3 API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4-32k',
            messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: text }]
        })
    })
    .then(response => response.json())
    .then(data => {
        conversationContext += 'AI: ' + data.choices[0].message.content + '\n'; // Update conversation context with AI response
        console.log(data);
        textToSpeech(data.choices[0].message.content);
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
