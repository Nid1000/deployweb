"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Deja el error visible en consola para debug
    // eslint-disable-next-line no-console
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto w-full mt-10 p-6 border rounded-lg bg-white shadow-sm">
      <h1 className="text-2xl font-semibold mb-2">Ocurrió un error</h1>
      <p className="text-sm text-gray-700 mb-4">
        Abre la consola del navegador para ver el detalle.
      </p>
      <div className="text-xs bg-gray-50 border rounded p-3 overflow-auto">
        <div className="font-mono">{error.message}</div>
        {error.digest ? (
          <div className="font-mono mt-2 text-gray-600">digest: {error.digest}</div>
        ) : null}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          className="px-3 py-1.5 rounded border hover:bg-gray-50"
          onClick={() => reset()}
          type="button"
        >
          Reintentar
        </button>
        <a className="px-3 py-1.5 rounded border hover:bg-gray-50" href="/login">
          Ir a login
        </a>
      </div>
    </div>
  );
}

