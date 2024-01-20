const saveButton = document.getElementById('saveButton');
const textToSave = document.getElementById('textToSave');
const gistId = '319efc519c6a17699365d23874099a78'; // Your gist ID
const encodedGithubToken = "gzhapi_r4a2ykdYlrkslZmJwxq2ySf1xHuFsUhunyrcvObungzJwDqUhvoCpDq6cHuVi0wlelefyqjxq"; // Encoded GitHub token

saveButton.addEventListener('click', () => {
    const text = textToSave.value;
    saveConversationToGist(text);
});

function saveConversationToGist(conversationText) {
    const githubToken = decodeString(encodedGithubToken);
    const gistData = {
        description: "Test Gist Update",
        public: false,
        files: {
            "conversation.txt": {
                content: conversationText
            }
        }
    };

    const url = `https://api.github.com/gists/${gistId}`;
    fetch(url, {
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
        alert('Gist updated successfully!');
    })
    .catch(error => {
        console.error('Error updating Gist:', error);
        alert('Error updating Gist.');
    });
}

function decodeString(encodedStr) {
    return encodedStr.split('').filter((_, index) => index % 2 === 0).join('');
}
