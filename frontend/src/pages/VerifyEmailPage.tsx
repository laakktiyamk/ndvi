import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    // Poistetaan token osoiterivistä heti, ettei se jää selainhistoriaan
    window.history.replaceState({}, "", window.location.pathname);

    fetch(`${API_BASE}/api/user/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => setStatus(res.ok ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return <p>Vahvistetaan...</p>;
  if (status === "success")
    return (
      <p>
        Sähköposti vahvistettu. <a href="/login">Kirjaudu sisään</a>
      </p>
    );
  return <p>Linkki on virheellinen tai vanhentunut.</p>;
}