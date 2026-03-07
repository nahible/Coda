import { useEffect, useState } from "react";
import { getCurrentUser, logout, type AuthUser } from "./api/auth";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";

export default function App() {
  return <HomePage />;
}
