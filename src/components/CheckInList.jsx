import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./CheckInList.css";

const API_URL = import.meta.env.VITE_API_URL;

function CheckInList() {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckIns();
  }, []);

  const fetchCheckIns = async () => {
    try {
      const response = await fetch(`${API_URL}/check-ins`, {
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch check-ins");
      }
      const data = await response.json();
      setCheckIns(data.checkIns);
    } catch (error) {
      console.error("Error fetching check-ins:", error);
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
            </div>
            {checkIns.map((checkIn, index) => (
              <div key={index} className="table-row">
                <div className="name-col">{checkIn.name}</div>
                <div className="time-col">
                  {formatTime(checkIn.submitted_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckInList;
