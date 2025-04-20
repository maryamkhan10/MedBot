const apiKey = "AIzaSyA2MdA6ZL8gOrR2VjftUiphl5lcHuWsULI";
const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendButton = chatForm.querySelector("button");

// Function to add a message to the chat
function addMessage(sender, message, isLoading = false) {
    const messageContainer = document.createElement("div");
    messageContainer.className = `message-container ${sender.toLowerCase()}`;
    
    if (isLoading) {
        messageContainer.id = "loading-indicator";
        messageContainer.innerHTML = `
            <div class="message bot">
                <div class="loading-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
    } else {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender.toLowerCase()}`;
        messageDiv.innerHTML = message;
        messageContainer.appendChild(messageDiv);
    }
    
    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return messageContainer;
}

// Function to remove loading indicator
function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById("loading-indicator");
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Add health context to prompts
function enhancePromptWithContext(userQuestion) {
    return `As a friendly health assistant named MedBot, please provide accurate and helpful information about the following health question. Focus on providing medical information in a clear, concise way. Include relevant details like symptoms, causes, treatments, and prevention when appropriate. If the query is not health-related, kindly redirect to health topics. Question: ${userQuestion}`;
}

// Handle form submission
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const question = userInput.value.trim();
    if (!question) return;
    
    // Display user message
    addMessage("user", question);
    userInput.value = "";
    
    // Disable input and button while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    
    // Show loading indicator
    addMessage("bot", "", true);
    
    try {
        const enhancedPrompt = enhancePromptWithContext(question);
        
        const response = await fetch(apiURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: enhancedPrompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    topP: 0.95,
                    topK: 64,
                    maxOutputTokens: 2048,
                }
            }),
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        removeLoadingIndicator();
        
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const reply = data.candidates[0].content.parts[0].text;
            // Format the reply to handle potential markdown
            const formattedReply = formatApiResponse(reply);
            addMessage("bot", formattedReply);
        } else {
            addMessage("bot", "I'm sorry, I couldn't process that request. Could you try asking in a different way?");
        }
    } catch (error) {
        // Remove loading indicator
        removeLoadingIndicator();
        
        console.error("Error:", error);
        addMessage("bot", "I'm having trouble connecting right now. Please try again later.");
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
});

// Basic formatting for API responses
function formatApiResponse(text) {
    // Replace line breaks with <br> tags
    let formatted = text.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    
    // Bold text between ** or __
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic text between * or _
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Handle bullet lists
    formatted = formatted.replace(/- (.*?)(?:<br>|$)/g, '• $1<br>');
    
    return formatted;
}

// Focus input field when page loads
window.addEventListener('DOMContentLoaded', () => {
    userInput.focus();
});

// Allow Enter key to submit
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});