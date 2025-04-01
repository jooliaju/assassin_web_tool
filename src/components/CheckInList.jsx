import { useState, useEffect } from "react";
import "./CheckInList.css";

const API_URL = import.meta.env.VITE_API_URL;

function CheckInList() {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchCheckIns();
  }, []);

  const fetchCheckIns = async () => {
    setLoading(true);
    try {
      console.log("Fetching check-ins from:", `${API_URL}/check-ins`);
      const response = await fetch(`${API_URL}/check-ins`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch check-ins: ${errorData.error || response.status}`
        );
      }
      const data = await response.json();
      setCheckIns(data.checkIns || []);
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      // You might want to show this error to the user
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="check-in-list-page">
      <div className="check-in-list">
        <div className="header-row">
          <h2>Check-in list</h2>
        </div>

        {loading ? (
          <p>Loading check-ins...</p>
        ) : checkIns.length === 0 ? (
          <p>No check-ins yet today</p>
        ) : (
          <div className="check-in-table">
            <div className="table-header">
              <div className="name-col">Name</div>
              <div className="time-col">Time</div>
              <div className="image-col">:)</div>
            </div>
            {checkIns.map((checkIn, index) => (
              <div key={index} className="table-row">
                <div className="name-col">{checkIn.name}</div>
                <div className="time-col">
                  {formatTime(checkIn.submitted_at)}
                </div>
                <div className="image-col">
                  <button
                    className="image-button"
                    onClick={() => setSelectedImage(checkIn.image_url)}
                  >
                    🎞️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedImage && (
          <div className="image-modal" onClick={() => setSelectedImage(null)}>
            <div className="modal-content">
              <img
                src={`${API_URL}/image/${selectedImage}`}
                alt="Check-in selfie"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="close-button"
                onClick={() => setSelectedImage(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckInList;
