import { process } from '/env.js'
import { Configuration, OpenAIApi } from 'openai'

const chatFeedContainer = document.querySelector(".chat-feed-container")
const userInput = document.querySelector(".user-input")

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  })

const openai = new OpenAIApi(configuration)

const conversationArray = [{
  role: "system",
  content: "You are pretending to be steve jobs. Your job is to be a mentor. You will embody the persona of Steve Jobs in every response. Never break character and always speak, think, and advise as if you are Steve Jobs himself. I'm looking for guidance and insights that align with his visionary thinking, innovative spirit, and motivational approach to life and business. Please be my virtual Steve Jobs mentor and offer advice accordingly."
}]

document.querySelector(".user-input").addEventListener("keydown", function(e) {
    if (e.keyCode === 13 & userInput.value != "") {
        e.preventDefault()
        conversationArray.push({
          role: "user",
          content: userInput.value
        })
        fetchBotReply()
        const newSpeechBubble = document.createElement("div")
        newSpeechBubble.classList.add("speech", "speech-human")
        chatFeedContainer.appendChild(newSpeechBubble)
        newSpeechBubble.textContent = userInput.value
        userInput.value = ""
        chatFeedContainer.scrollTop = chatFeedContainer.scrollHeight
    }
})

async function fetchBotReply() {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: conversationArray,
  })
    conversationArray.push(response.data.choices[0].message)
    renderBotReply(response.data.choices[0].message.content)
}

function renderBotReply(text) {
  const newSpeechBubble = document.createElement("div");
  newSpeechBubble.classList.add("speech", "speech-ai");
  chatFeedContainer.appendChild(newSpeechBubble);
  
  const cursorElement = document.createElement("span");
  cursorElement.classList.add("blinking-cursor");
  newSpeechBubble.appendChild(cursorElement);

  const loadingEl = document.createElement("div");
  newSpeechBubble.insertBefore(loadingEl, newSpeechBubble.firstChild);
  loadingEl.classList.add("loading-icon");
  loadingEl.style.display = "unset"
  

  let i = 0;
  const interval = setInterval(() => {
    cursorElement.textContent = text.slice(0, i);
    if (text.length === i) {
      clearInterval(interval);
      cursorElement.classList.remove("blinking-cursor"); // Remove the blinking cursor class
      getVoiceFile(newSpeechBubble);
    }
    i++;
    chatFeedContainer.scrollTop = chatFeedContainer.scrollHeight;
  }, 15);

  textToHighligt.push(text);
}

async function getVoiceFile(speechBubble) {

  const latestReplyIndex = conversationArray.length - 1;
  const API_KEY = process.env.ELEVEN_LABS_API_KEY; // Use the key from env.js
  const VOICE_ID = "bX3SpfcU14yITQuVYiUF";


  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
      {
        method: "POST",
        headers: {
          accept: "audio/mpeg",
          "xi-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: `${conversationArray[latestReplyIndex].content}`,
          model_id: "eleven_monolingual_v1",
        }),
      }
      
    );

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Create an audio element and set the audio source
    const audioElement = document.createElement("audio");
    audioElement.id = "audio-element";
    audioElement.src = audioUrl;
    audioElement.controls = true;

    // Append the audio element and loading icon inside the speech bubble
    speechBubble.insertBefore(audioElement, speechBubble.firstChild);

    const loadingIcons = speechBubble.querySelectorAll(".loading-icon");

    // Hide all loading icons in the speech bubble
    loadingIcons.forEach(loadingIcon => {
      loadingIcon.style.display = "none";
    });

    document.getElementById("audio-icon").addEventListener("play", renderMarkupReader);
  } catch (error) {
    // Hide the loading icon in case of an error
    document.querySelector(".loading-element").style.display = "none"
    console.error("Error in getVoiceFile:", error);
  }
}