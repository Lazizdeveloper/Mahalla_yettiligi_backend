"use client";

import { useEffect, useState } from "react";
import { ApiError, listAuditLogs, type ApiAuditLog } from "@/lib/api";

export default function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await listAuditLogs({ page: 1, pageSize: 100 });
        setLogs(response.items);
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Audit loglarni yuklashda xatolik.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Audit loglar</h1>
      <p className="text-sm text-gray-600">
        Tizimdagi muhim harakatlar (loginlar, rollarni o'zgartirish va h.k.) bu sahifada ko'rsatiladi.
      </p>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="border px-2 py-1 text-left">Vaqt</th>
              <th className="border px-2 py-1 text-left">Action</th>
              <th className="border px-2 py-1 text-left">Entity</th>
              <th className="border px-2 py-1 text-left">Actor</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="border px-2 py-3 text-center text-gray-500" colSpan={4}>
                  Yuklanmoqda...
                </td>
              </tr>
            )}
            {!isLoading &&
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="border px-2 py-1">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="border px-2 py-1">{log.action}</td>
                  <td className="border px-2 py-1">
                    {log.entityType}
                    {log.entityId ? ` (${log.entityId.slice(0, 8)}...)` : ""}
                  </td>
                  <td className="border px-2 py-1">{log.actorId ?? "system"}</td>
                </tr>
              ))}
            {!isLoading && logs.length === 0 && (
              <tr>
                <td className="border px-2 py-3 text-center text-gray-500" colSpan={4}>
                  Audit log topilmadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
