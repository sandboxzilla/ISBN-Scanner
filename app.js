// JS Version: Jv2.3.3
window.APP_VERSION = "Jv2.3.3";

let yamlLog = [];
let isWaitingForVoice = false;
let voiceTimeout = null;
let pendingInfo = null;
let pendingISBN = null;

const isbnInput = document.getElementById("isbn-input");
const priceInput = document.getElementById("price-input");
const uploadInput = document.getElementById("isbn-upload");
const logContainer = document.getElementById("log");

isbnInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    if (isWaitingForVoice) {
      playTone(400); // stop tone
      clearTimeout(voiceTimeout);
      isWaitingForVoice = false;
      finalizeBook(pendingInfo, pendingISBN, "Not available");
      pendingInfo = null;
      pendingISBN = null;
    } else {
      scanISBN();
    }
  }
});

priceInput.addEventListener("keydown", e => {
  if (e.key === "Enter") scanISBN();
});

document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    document.getElementById("manual-input").style.display = mode === "manual" ? "block" : "none";
    if (mode === "camera") alert("Camera mode not implemented yet.");
  });
});

function speak(text, callback) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onend = callback;
  speechSynthesis.speak(utterance);
}

function listenForPrice(callback) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition not supported in this browser.");
    callback(null);
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    playTone(440); // stop listening tone
    isWaitingForVoice = false;
    clearTimeout(voiceTimeout);

    const transcript = event.results[0][0].transcript.toLowerCase();
    if (["none", "no", "continue"].includes(transcript)) {
      callback(null);
    } else {
      const parsed = parseSpokenPrice(transcript);
      callback(parsed);
    }
  };

  recognition.onerror = () => {
    playTone(400);
    isWaitingForVoice = false;
    callback(null);
  };

  recognition.start();
  playTone(880); // start listening tone
  isWaitingForVoice = true;
  voiceTimeout = setTimeout(() => {
    playTone(400);
    isWaitingForVoice = false;
    recognition.abort();
    callback(null);
  }, 8000);
}

function parseSpokenPrice(input) {
  input = input.replace(/dollars|bucks|\$/gi, "").trim();
  if (/point|dot/.test(input)) {
    input = input.replace(/point|dot/, ".");
    return parseFloat(input);
  }
  const digits = input.replace(/[^\d.]/g, "");
  return parseFloat(digits);
}

function scanISBN() {
  const isbn = isbnInput.value.trim();
  const manualPrice = priceInput.value.trim();
  if (!isbn) return;
  playTone(600); // scan received

  fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
    .then(res => res.json())
    .then(data => {
      if (!data.items) {
        alert("Book not found.");
        return;
      }

      const info = data.items[0].volumeInfo;
      const sale = data.items[0].saleInfo;
      let price = "Not available";

      const book = {
        isbn,
        title: info.title || "Unknown",
        authors: info.authors || ["Unknown"],
        publisher: info.publisher || "Unknown",
        publishedDate: info.publishedDate || "Unknown",
        price
      };

      renderBook(book); // display info immediately

      if (manualPrice) {
        book.price = manualPrice;
        finalizeBook(info, isbn, manualPrice);
      } else if (sale?.retailPrice?.amount) {
        book.price = sale.retailPrice.amount + " " + sale.retailPrice.currencyCode;
        finalizeBook(info, isbn, book.price);
      } else {
        const bookTitle = book.title;
        const bookAuthor = book.authors.join(", ");
        const prompt = `Book title: ${bookTitle}. Author: ${bookAuthor}. Would you like to add a price?`;

        pendingInfo = info;
        pendingISBN = isbn;

        speak(prompt, () => {
          listenForPrice(userPrice => {
            let finalPrice = "Not available";
            if (userPrice !== null && !isNaN(userPrice)) {
              finalPrice = `$${userPrice.toFixed(2)}`;
            }
            finalizeBook(pendingInfo, pendingISBN, finalPrice);
            pendingInfo = null;
            pendingISBN = null;
          });
        });
      }
    });
}

function finalizeBook(info, isbn, price) {
  yamlLog.push({
    isbn,
    title: info.title || "Unknown",
    authors: info.authors || ["Unknown"],
    publisher: info.publisher || "Unknown",
    publishedDate: info.publishedDate || "Unknown",
    price
  });

  isbnInput.value = "";
  priceInput.value = "";
  isbnInput.focus();
  playTone(660);
}

function renderBook(book) {
  const wrapper = document.createElement("div");
  wrapper.className = "log-entry";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  const pre = document.createElement("pre");
  pre.textContent = jsyaml.dump(book);

  wrapper.appendChild(checkbox);
  wrapper.appendChild(pre);
  logContainer.appendChild(wrapper);
  wrapper.scrollIntoView({ behavior: "smooth" });
}

function downloadYAML() {
  const blob = new Blob(["---\n" + yamlLog.map(b => jsyaml.dump(b)).join("---\n")], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "scanned_books.yaml";
  a.click();
  URL.revokeObjectURL(url);
}

function clearData() {
  yamlLog = [];
  logContainer.innerHTML = "";
  isbnInput.value = "";
  priceInput.value = "";
  alert("All scanned data cleared.");
}

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split(/\r?\n/).filter(Boolean);
    lines.forEach((isbn, i) => {
      setTimeout(() => {
        isbnInput.value = isbn;
        scanISBN();
      }, i * 800);
    });
  };
  reader.readAsText(file);
});

function playTone(freq) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  osc.frequency.value = freq;
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}
