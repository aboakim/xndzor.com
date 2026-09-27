"use client";

import { useEffect } from "react";

/** Marks `<body>` on admin routes so global CSS can hide marketing chrome on phones. */
export function AdminBodyClass() {
  useEffect(() => {
    document.body.classList.add("admin-route");
    return () => {
      document.body.classList.remove("admin-route");
    };
  }, []);

  return null;
}
