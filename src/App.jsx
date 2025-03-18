import { useState } from "react";
import "./App.css";
import CsvModal from "./components/CsvModal";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [hostEmail, setHostEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loading_start, setLoading_start] = useState(false);
  const [chain, setChain] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      setSelectedFile(file);
    } else {
      alert("Please drop a CSV file");
    }
  };

  const handleButtonClick = async (e) => {
    // Create a file input programmatically
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file && file.name.endsWith(".csv")) {
        setSelectedFile(file);
      }
    };

    fileInput.click();
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  const handleGenerateChain = async () => {
    if (!selectedFile || !hostEmail) {
      alert("Please upload a CSV file and enter host email first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("host_email", hostEmail);

    try {
      const response = await fetch("/generate-chain", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setChain(data.chain);
        alert("Chain generated successfully!");
      } else {
        alert(data.error || "Failed to generate chain");
      }
    } catch (error) {
      alert("Error generating chain: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadChain = () => {
    if (!chain) {
      alert("Please generate a chain first");
      return;
    }

    // Create sequential chain text
    let chainText = "";
    let currentPlayer = Object.keys(chain)[0]; // Start with any player
    const visited = new Set();

    // Follow the chain until we've seen all players
    while (!visited.has(currentPlayer)) {
      const targetPlayer = chain[currentPlayer].target;
      chainText += `${currentPlayer} → ${targetPlayer}\n`;
      visited.add(currentPlayer);
      currentPlayer = targetPlayer;
    }

    const blob = new Blob([chainText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assassin_chain.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendEmails = async () => {
    if (!chain) {
      alert("Please generate a chain first");
      return;
    }

    setLoading_start(true);
    try {
      const response = await fetch("/send-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chain: chain,
          host_email: hostEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Emails sent successfully!");
      } else {
        alert(data.error || "Failed to send emails");
      }
    } catch (error) {
      alert("Error sending emails: " + error.message);
    } finally {
      setLoading_start(false);
    }
  };

  return (
    <div className="container">
      <h1>🥷 Assassin Game</h1>

      <CsvModal isOpen={showModal} onClose={() => setShowModal(false)} />

      <div className="instruction-row">
        <div className="number-circle">1</div>
        <div className="instruction-content">
          <div className="instruction-text">
            <p>
              Upload a csv file with player names + emails, we will take care of
              the rest!
              <button
                className="info-button"
                onClick={() => setShowModal(true)}
              >
                ❓
              </button>
            </p>
          </div>

          <div className="file-upload-container">
            <button
              onClick={handleButtonClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="upload-button"
            >
              {selectedFile ? selectedFile.name : "📥 Upload or Drop"}
            </button>
            {selectedFile && (
              <button onClick={handleRemoveFile} className="remove-file-button">
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="instruction-row">
        <div className="number-circle">2</div>
        <div className="instruction-content">
          <div className="instruction-text">
            <p>Enter your email if you are the host of this game</p>
          </div>

          <input
            type="email"
            value={hostEmail}
            onChange={(e) => setHostEmail(e.target.value)}
            placeholder="📧   Enter email"
          />
        </div>
      </div>

      <div className="instruction-row">
        <div className="number-circle">3</div>
        <div className="instruction-content">
          <div className="instruction-text">
            <p>
              Generate the chain of players. You can download the chain details
              if you want to verify it.
            </p>
            <p>
              If you don&apos;t want to know the targets, you don&apos;t need to
              download it!
            </p>
          </div>

          <div className="button-container">
            <button
              onClick={handleGenerateChain}
              className="upload-button"
              disabled={!selectedFile || !hostEmail}
            >
              {loading ? "Generating..." : "⛓️ Generate Chain"}
            </button>

            <button
              onClick={handleDownloadChain}
              className="download-button"
              disabled={!chain}
            >
              🙈 See Chain
            </button>
          </div>
        </div>
      </div>

      <div className="instruction-row">
        <div className="number-circle">4</div>
        <div className="instruction-content">
          <div className="instruction-text">
            <p>
              If you are happy with the chain, this will send emails to
              everyone!
            </p>
          </div>

          <button
            onClick={handleSendEmails}
            className="upload-button"
            disabled={loading || !chain}
          >
            {loading_start ? "Sending..." : "👋  Start game"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
