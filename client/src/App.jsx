import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import AdminReview from "./pages/AdminReview";
import Shop from "./pages/Shop";
import Advertise from "./pages/Advertise";
import Schedule from "./pages/Schedule.jsx";
import Teams from "./pages/Teams.jsx";
import News from "./pages/News.jsx";     // optional if not created yet
import Book from "./pages/Book.jsx";     // optional if not created yet

export default function App() {
  return (
    <>
     
      {/* Page Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/review" element={<AdminReview />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/advertise" element={<Advertise />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/news" element={<News />} />
        <Route path="/book" element={<Book />} />
      </Routes>
    </>
  );
}
