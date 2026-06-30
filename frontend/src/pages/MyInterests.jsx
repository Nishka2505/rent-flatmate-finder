import React, { useState, useEffect } from "react";
import api from "../api";

export default function MyInterests() {
  const [interests, setInterests] = useState([]);

  useEffect(() => {
    api.get("/tenants/interest/my-requests").then((res) => setInterests(res.data));
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>My Interest Requests</h2>
      {interests.length === 0 && <p>You haven't expressed interest in any rooms yet.</p>}
      {interests.map((i) => (
        <div key={i.id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 8, borderRadius: 6 }}>
          <p>Listing ID: {i.listing_id} — Status: <strong>{i.status}</strong></p>
          {i.status === "accepted" && (
            <a href={`/chat/${i.id}`} style={{ display: "inline-block", marginTop: 6 }}>
              Open Chat →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}