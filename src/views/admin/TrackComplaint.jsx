import React from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "services/api";
import { getAuthRole } from "utils/auth";
import { StatusBadge, SeverityBadge } from "components/ui";
import ProgressTracker from "components/ui/ProgressTracker";
import { MdPerson, MdLocationCity, MdTag, MdArrowForward } from "react-icons/md";

const TrackComplaint = () => {
  const [complaints, setComplaints] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState({});
  const [selectedId, setSelectedId] = React.useState("");
  const [messages, setMessages] = React.useState([]);
  const [evidence, setEvidence] = React.useState([]);
  const [tickets, setTickets] = React.useState([]);
  const [faqs, setFaqs] = React.useState([]);
  const [me, setMe] = React.useState(null);
  const activeComplaint = complaints.find((c) => c._id === selectedId);

  const fetchComplaints = async (params = {}) => {
    const qs = new URLSearchParams(params);
    setLoading(true);
    try {
      const data = await apiFetch(
        `/complaints/search${qs.toString() ? `?${qs.toString()}` : ""}`
      );
      const list = Array.isArray(data?.complaints) ? data.complaints : [];
      setComplaints(list);
      setSelectedId((prev) => {
        if (prev && list.some((c) => c._id === prev)) return prev;
        return list[0]?._id || "";
      });
    } catch (err) {
      window.alert(err?.message || "Fetch error");
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchComplaints({});
    setQuery({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    const complaintId = document.getElementById("complaintId")?.value?.trim() || "";
    const params = {};
    if (complaintId) params.complaintId = complaintId;
    setQuery(params);
    fetchComplaints(params);
  };

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      if (localStorage.getItem("token")) fetchComplaints(query);
    }, 8000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchMessagesAndEvidence = async (caseId) => {
    if (!caseId) return;
    const [msgData, evData] = await Promise.all([
      apiFetch(`/complaints/${caseId}/messages`),
      apiFetch(`/complaints/${caseId}/evidence`),
    ]);
    setMessages(Array.isArray(msgData?.messages) ? msgData.messages : []);
    setEvidence(Array.isArray(evData?.evidence) ? evData.evidence : []);
  };

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      if (selectedId) fetchMessagesAndEvidence(selectedId).catch(() => {});
    }, 8000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  React.useEffect(() => {
    if (selectedId) {
      fetchMessagesAndEvidence(selectedId).catch((err) =>
        window.alert(err?.message || "Failed to load details")
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const senderLabel = (m) => {
    const name = m.sender?.name;
    if (name && m.senderRole) return `${name} (${m.senderRole})`;
    if (name) return name;
    return m.senderRole || "Participant";
  };

  const loadSupport = React.useCallback(async () => {
    if (getAuthRole() !== "User") return;
    const [ticketData, faqData] = await Promise.all([
      apiFetch("/support-tickets"),
      apiFetch("/support-tickets/faq/list"),
    ]);
    setTickets(Array.isArray(ticketData?.tickets) ? ticketData.tickets : []);
    setFaqs(Array.isArray(faqData?.faqs) ? faqData.faqs : []);
  }, []);

  React.useEffect(() => {
    loadSupport().catch(() => {});
  }, [loadSupport]);

  React.useEffect(() => {
    if (getAuthRole() !== "User") return;
    apiFetch("/users/me")
      .then((d) => setMe(d?.user || null))
      .catch(() => setMe(null));
  }, []);

  return (
    <div className="mt-3 space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
        <h2 className="text-xl font-semibold text-navy-700 dark:text-white">
          Track complaint
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Search by internal ID or reference ID. Leave blank and search to
          refresh your accessible complaints.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col md:col-span-2">
            <label className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-200">
              Complaint or reference ID
            </label>
            <input
              id="complaintId"
              type="text"
              placeholder="Mongo ID or reference (e.g. CC-2026-0012)"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="w-full rounded-xl bg-brand-700 hover:bg-brand-800 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500"
              onClick={handleSearch}
            >
              Search / refresh
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
        <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
          Complaint list
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Status and severity for cases you are allowed to view.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-white/10">
            <thead className="bg-green-50/50 dark:bg-navy-900">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                  ID
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                  Assigned to
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-250">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan="5">
                    Loading…
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-gray-500" colSpan="5">
                    No complaints found.
                  </td>
                </tr>
              ) : (
                complaints.map((row) => (
                  <tr
                    key={row._id}
                    className="cursor-pointer hover:bg-green-50/60 dark:hover:bg-navy-900"
                    onClick={() => setSelectedId(row._id)}
                  >
                    <td className="px-4 py-2 font-medium text-navy-700 dark:text-white">
                      {row.referenceId || row._id}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                      {row.incidentType}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200">
                      {row.assignedTo?.name || (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <SeverityBadge severity={row.severity} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
        <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
          Case details
        </h3>
        {!selectedId ? (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Select a complaint to view its progress, messages, and evidence.
          </p>
        ) : (
          <>
            {activeComplaint ? (
              <div className="mt-4 rounded-2xl border border-gray-150 bg-gray-50/60 p-5 dark:border-navy-700 dark:bg-navy-900/40">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Complaint Progress
                    </p>
                    <Link
                      to={`/admin/complaint/${activeComplaint._id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline dark:text-brand-400"
                    >
                      Full details <MdArrowForward className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={activeComplaint.status} />
                    <SeverityBadge severity={activeComplaint.severity} />
                    {activeComplaint.escalationLevel > 0 ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        Escalated · priority handling
                      </span>
                    ) : null}
                  </div>
                </div>
                <ProgressTracker complaint={activeComplaint} />
                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-gray-200 pt-4 text-sm dark:border-navy-700 sm:grid-cols-3">
                  <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <MdTag className="h-4 w-4 text-gray-400" aria-hidden />
                    <span className="font-semibold">{activeComplaint.referenceId || activeComplaint._id}</span>
                  </p>
                  <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <MdPerson className="h-4 w-4 text-gray-400" aria-hidden />
                    <span className="font-semibold">
                      {activeComplaint.assignedTo?.name || "Not yet assigned"}
                    </span>
                  </p>
                  <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <MdLocationCity className="h-4 w-4 text-gray-400" aria-hidden />
                    {activeComplaint.city || "City not specified"}
                  </p>
                </div>
              </div>
            ) : null}
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div>
              <h4 className="text-base font-semibold text-navy-700 dark:text-white">
                Messages
              </h4>
              {messages.length === 0 ? (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  No messages yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m._id}
                      className="rounded-xl bg-lightPrimary p-3 text-sm text-gray-800 dark:text-gray-100"
                    >
                      <p className="font-semibold text-green-700">
                        {senderLabel(m)}
                      </p>
                      <p className="mt-1">{m.message}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5">
                <h4 className="text-base font-semibold text-navy-700 dark:text-white">
                  Case notes
                </h4>
                {activeComplaint?.caseNotes?.length ? (
                  <div className="mt-3 space-y-2">
                    {activeComplaint.caseNotes
                      .slice()
                      .reverse()
                      .slice(0, 8)
                      .map((n) => (
                        <div
                          key={n._id}
                          className="rounded-xl bg-lightPrimary p-3 text-sm text-gray-800 dark:text-gray-100"
                        >
                          <p className="font-semibold text-green-700">Note</p>
                          <p className="mt-1">{n.text}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    No case notes yet.
                  </p>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-200">
                  Send message
                </label>
                <div className="flex gap-3">
                  <input
                    id="userMessage"
                    type="text"
                    placeholder="Type a message for the investigation team…"
                    className="flex-1 rounded-xl border border-gray-200 bg-lightPrimary p-3.5 text-sm text-navy-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  />
                  <button
                    type="button"
                    className="rounded-xl bg-brand-700 hover:bg-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-500"
                    onClick={async () => {
                      try {
                        const msg =
                          document.getElementById("userMessage")?.value || "";
                        if (!msg.trim()) return;
                        await apiFetch(`/complaints/${selectedId}/messages`, {
                          method: "POST",
                          body: { message: msg },
                        });
                        document.getElementById("userMessage").value = "";
                        await fetchMessagesAndEvidence(selectedId);
                      } catch (err) {
                        window.alert(err?.message || "Message error");
                      }
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold text-navy-700 dark:text-white">
                Evidence files
              </h4>
              {evidence.length === 0 ? (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  No evidence uploaded yet.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {evidence.map((ev) => (
                    <div
                      key={ev._id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-green-50/80 bg-lightPrimary p-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-navy-700 dark:text-white">
                          {ev.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ev.mimeType} • {ev.size} bytes
                        </p>
                      </div>
                      {ev.fileUrl ? (
                        <a
                          href={ev.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-green-700 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>

      {getAuthRole() === "User" ? (
        <div className="rounded-2xl bg-white p-6 shadow-md shadow-shadow-500 dark:bg-navy-800">
          <h3 className="text-lg font-semibold text-navy-700 dark:text-white">
            Help &amp; support
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Open a ticket for platform issues unrelated to a specific case.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              id="ticketSubject"
              type="text"
              placeholder="Subject"
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-700 outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
            <input
              id="ticketEmail"
              type="email"
              placeholder="Contact email (optional)"
              defaultValue={me?.email || ""}
              className="rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-700 outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
            <textarea
              id="ticketMessage"
              rows="3"
              placeholder="Describe the issue…"
              className="md:col-span-2 rounded-xl border border-gray-200 bg-lightPrimary p-3 text-sm text-navy-700 outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="rounded-xl bg-brand-700 hover:bg-brand-800 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition-all dark:bg-brand-600 dark:hover:bg-brand-500"
              onClick={async () => {
                try {
                  const subject =
                    document.getElementById("ticketSubject")?.value?.trim() || "";
                  const message =
                    document.getElementById("ticketMessage")?.value?.trim() || "";
                  const requesterEmail =
                    document.getElementById("ticketEmail")?.value?.trim() || "";
                  const u = me;
                  if (!subject || !message) {
                    window.alert("Subject and message are required.");
                    return;
                  }
                  await apiFetch("/support-tickets", {
                    method: "POST",
                    body: {
                      subject,
                      message,
                      requesterName: u?.name || "",
                      requesterEmail: requesterEmail || u?.email || "",
                    },
                  });
                  window.alert("Support ticket submitted.");
                  document.getElementById("ticketSubject").value = "";
                  document.getElementById("ticketMessage").value = "";
                  await loadSupport();
                } catch (err) {
                  window.alert(err?.message || "Ticket failed");
                }
              }}
            >
              Submit ticket
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div>
              <h4 className="text-base font-semibold text-navy-700 dark:text-white">
                My tickets
              </h4>
              <div className="mt-3 space-y-2">
                {tickets.length === 0 ? (
                  <p className="text-sm text-gray-500">No support tickets yet.</p>
                ) : (
                  tickets.map((t) => (
                    <div key={t._id} className="rounded-xl bg-lightPrimary p-3 text-sm">
                      <p className="font-semibold text-navy-700 dark:text-white">
                        {t.subject}
                      </p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        Status: {t.status}
                      </p>
                      {t.adminReply ? (
                        <p className="mt-1 text-xs text-gray-700 dark:text-gray-200">
                          Admin reply: {t.adminReply}
                        </p>
                      ) : null}
                      {t.status === "Closed" && !t.rating ? (
                        <button
                          type="button"
                          className="mt-2 rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white"
                          onClick={async () => {
                            const rating = Number(
                              window.prompt("Rate support (1-5):", "5") || 0
                            );
                            if (!rating || rating < 1 || rating > 5) return;
                            const feedback = window.prompt("Feedback (optional):", "") || "";
                            await apiFetch(`/support-tickets/${t._id}/feedback`, {
                              method: "PATCH",
                              body: { rating, feedback },
                            });
                            await loadSupport();
                          }}
                        >
                          Submit rating
                        </button>
                      ) : null}
                      {t.rating ? (
                        <p className="mt-1 text-xs text-green-700">
                          Rating: {t.rating}/5 {t.feedback ? `- ${t.feedback}` : ""}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold text-navy-700 dark:text-white">FAQ</h4>
              <div className="mt-3 space-y-2">
                {faqs.length === 0 ? (
                  <p className="text-sm text-gray-500">No FAQ entries.</p>
                ) : (
                  faqs.map((f) => (
                    <div key={f.id} className="rounded-xl bg-lightPrimary p-3 text-sm">
                      <p className="font-semibold text-navy-700 dark:text-white">
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
        </div>
      ) : null}
    </div>
  );
};

export default TrackComplaint;
