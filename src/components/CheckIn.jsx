import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./CheckIn.css";

const API_URL = import.meta.env.VITE_API_URL;

function CheckIn() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // phone or tablet detection
    // we want this since selfies are "real time"
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileDevices = /iphone|ipad|android/i;
      setIsMobile(mobileDevices.test(userAgent));
    };

    checkMobile();
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (!name.trim()) {
      alert("Please enter your name first");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("selfie", file);
      formData.append("name", name.trim());

      const response = await fetch(`${API_URL}/check-in`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload selfie");
      }

      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      setName("");
    } catch (error) {
      console.error("Error:", error);
      alert("Error uploading check-in: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <h1>SYDE Assassin Check-in</h1>

        <div className="instructions">
          <ul>
            <li>
              <p>
                submit a selfie by the
                <span style={{ fontWeight: "bold", marginInline: "0.4rem" }}>
                  SYDE Lounge
                </span>
                at minimum
                <span style={{ color: "#ff6600", marginLeft: "0.4rem" }}>
                  every day
                </span>
              </p>
            </li>
            <li>failure to do so will result in elimination 😔</li>
            <li>ty and good luck!</li>
          </ul>
        </div>

        <form className="check-in-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="name-input"
            required
          />

          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileSelect}
            className="hidden"
            id="selfie-input"
            disabled={!isMobile}
          />

          <button
            type="button"
            onClick={() => document.getElementById("selfie-input").click()}
            className={`check-in-button ${!isMobile ? "disabled" : ""}`}
            disabled={!name.trim() || loading || !isMobile}
          >
            {!isMobile
              ? "Please use a mobile device 📱"
              : loading
              ? "Uploading..."
              : "selfie time 🤳"}
          </button>
        </form>

        {showSuccessModal && (
          <div className="success-modal">
            <div className="success-content">
              <p>Beautiful, thanks for checking in! 🥷</p>
            </div>
          </div>
        )}

        <Link to="/checkinlist" className="check-in-list-link">
          See who has checked in 👀
        </Link>
      </div>
    </div>
  );
}

export default CheckIn;
