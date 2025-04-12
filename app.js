let yamlLog = [];
const output = document.getElementById("output");
const isbnInput = document.getElementById("isbn-input");
const uploadInput = document.getElementById("isbn-upload");

document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    document.getElementById("manual-input").style.display = mode === "manual" ? "block" : "none";
    if (mode === "camera") alert("Camera mode not implemented yet.");
  });
});

function scanISBN() {
  const isbn = isbnInput.value.trim();
  if (!isbn) return;
  playTone(440);
  fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
    .then(res => res.json())
    .then(data => {
      if (!data.items) {
        alert("Book not found.");
        return;
      }
      const info = data.items[0].volumeInfo;
      const sale = data.items[0].saleInfo;
      const book = {
        isbn,
        title: info.title || "Unknown",
        authors: info.authors || ["Unknown"],
        publisher: info.publisher || "Unknown",
        publishedDate: info.publishedDate || "Unknown",
        price: sale?.retailPrice?.amount 
          ? sale.retailPrice.amount + " " + sale.retailPrice.currencyCode
          : "Not available"
      };
      yamlLog.push(book);
      const yamlText = jsyaml.dump(book);
      output.value += "---\n" + yamlText + "\n";
      isbnInput.value = "";
      playTone(660);
    });
}

function downloadYAML() {
  const blob = new Blob(["---\n" + yamlLog.map(b => jsyaml.dump(b)).join("---\n")], {type: "text/yaml"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "scanned_books.yaml";
  a.click();
  URL.revokeObjectURL(url);
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
      }, i * 800); // delay to prevent throttling
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
