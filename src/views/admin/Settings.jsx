import React from "react";
import { apiFetch } from "services/api";
import { StatCard } from "components/ui";
import {
  MdSupportAgent,
  MdMarkEmailUnread,
  MdAutorenew,
  MdTaskAlt,
} from "react-icons/md";

const ticketStatuses = ["Open", "In Progress", "Closed"];

const Settings = () => {
  const [tickets, setTickets] = React.useState([]);
  const [faqs, setFaqs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/support-tickets");
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
      const faqData = await apiFetch("/support-tickets/faq/list");
      setFaqs(Array.isArray(faqData?.faqs) ? faqData.faqs : []);
    } catch (err) {
      window.alert(err?.message || "Failed to load tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const reply = window.prompt("Add admin reply (optional):", "") || "";
      await apiFetch(`/support-tickets/${id}`, {
        method: "PATCH",
        body: { status, adminReply: reply },
      });
      await loadTickets();
    } catch (err) {
      window.alert(err?.message || "Update failed");
    }
  };

  const removeTicket = async (id) => {
    if (!window.confirm("Delete this support ticket?")) return;
    try {
      await apiFetch(`/support-tickets/${id}`, { method: "DELETE" });
      await loadTickets();
    } catch (err) {
      window.alert(err?.message || "Delete failed");
    }
  };

  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "Open").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    closed: tickets.filter((t) => t.status === "Closed").length,
  };

  return (
    <div className="mt-3 space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">
          System Settings &amp; Support
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Review internal support tickets raised by authenticated users and
          officers. Update status as you triage requests.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={MdSupportAgent} label="Total Tickets" value={counts.total} accent="brand" loading={loading} />
        <StatCard icon={MdMarkEmailUnread} label="Open" value={counts.open} accent="amber" loading={loading} />
        <StatCard icon={MdAutorenew} label="In Progress" value={counts.inProgress} accent="blue" loading={loading} />
        <StatCard icon={MdTaskAlt} label="Closed" value={counts.closed} accent="navy" loading={loading} />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
            Support tickets
          </h3>
          <button
            type="button"
            className="rounded-xl border border-green-200 px-4 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50 dark:border-green-900 dark:text-green-200 dark:hover:bg-navy-900"
            onClick={() => loadTickets()}
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-white/10">
            <thead className="bg-gray-50 dark:bg-navy-900">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Subject
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Requester
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Message
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Reply / Feedback
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Status
                </th>
                <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan="6">
                    Loading…
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan="6">
                    No tickets yet.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t._id} className="align-top dark:hover:bg-navy-900/60">
                    <td className="px-4 py-3 font-medium text-navy-700 dark:text-white">
                      {t.subject}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      <div className="text-xs">
                        <div>{t.requesterName || "—"}</div>
                        <div className="text-gray-500">{t.requesterEmail || ""}</div>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-gray-700 dark:text-gray-200">
                      <p className="line-clamp-3 text-xs">{t.message}</p>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-gray-700 dark:text-gray-200">
                      <p>{t.adminReply || "—"}</p>
                      {t.rating ? (
                        <p className="mt-1 text-green-700">Rating: {t.rating}/5</p>
                      ) : null}
                      {t.feedback ? <p className="mt-1">{t.feedback}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-gray-200 bg-lightPrimary p-2 text-xs text-navy-700 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                        value={t.status}
                        onChange={(e) => updateStatus(t._id, e.target.value)}
                      >
                        {ticketStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300"
                        onClick={() => removeTicket(t._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
        <h3 className="text-lg font-semibold text-navy-700 dark:text-white">FAQ</h3>
        <div className="mt-3 space-y-3">
          {faqs.length === 0 ? (
            <p className="text-sm text-gray-500">No FAQ entries.</p>
          ) : (
            faqs.map((f) => (
              <div key={f.id} className="rounded-xl bg-lightPrimary p-3">
                <p className="text-sm font-semibold text-navy-700 dark:text-white">
                  {f.question}
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {f.answer}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
