require("dotenv").config();
const mongoose = require("mongoose");

function required(fields) {
  return { bsonType: "object", required: fields, properties: {} };
}

function addProps(schema, props) {
  schema.properties = { ...schema.properties, ...props };
  return schema;
}

async function setValidator(db, name, jsonSchema) {
  await db.command({
    collMod: name,
    validator: { $jsonSchema: jsonSchema },
    validationLevel: "moderate",
    validationAction: "error",
  });
}

async function ensureCollection(db, name) {
  const exists = await db.listCollections({ name }).toArray();
  if (exists.length === 0) {
    await db.createCollection(name);
  }
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  // Ensure collections exist before collMod.
  const collections = [
    "users",
    "complaints",
    "evidence",
    "assignments",
    "notifications",
    "supportTickets",
    "complaintMessages",
    "faq",
    "officerApprovalLogs",
    "sessions",
  ];
  for (const c of collections) {
    await ensureCollection(db, c);
  }

  // users (backend/models/User.js)
  const usersSchema = addProps(
    required(["name", "email", "passwordHash", "role", "status"]),
    {
      name: { bsonType: "string" },
      email: { bsonType: "string" },
      passwordHash: { bsonType: "string" },
      role: { enum: ["Admin", "InvestigationOfficer", "PendingOfficer", "User"] },
      isApprovedOfficer: { bsonType: "bool" },
      officerRequestStatus: { enum: ["None", "Pending", "Approved", "Rejected"] },
      officerRequestedAt: { bsonType: "date" },
      officerReviewedAt: { bsonType: "date" },
      officerReviewedBy: { bsonType: "objectId" },
      officerReviewReason: { bsonType: "string" },
      unit: { bsonType: "string" },
      phoneNumber: { bsonType: "string" },
      phoneVerified: { bsonType: "bool" },
      cnic: { bsonType: "string" },
      status: { enum: ["Active", "Inactive"] },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    }
  );

  // complaints (backend/models/Complaint.js)
  const complaintsSchema = addProps(
    required(["complainantName", "email", "incidentType", "incidentSummary", "severity", "status"]),
    {
      referenceId: { bsonType: "string" },
      complainantName: { bsonType: "string" },
      email: { bsonType: "string" },
      phoneNumber: { bsonType: "string" },
      incidentType: { bsonType: "string" },
      department: { bsonType: "string" },
      city: { bsonType: "string" },
      incidentSummary: { bsonType: "string" },
      evidenceLinks: { bsonType: "array", items: { bsonType: "string" } },
      severity: { enum: ["Low", "Medium", "High", "Critical"] },
      status: { enum: ["Pending", "In Review", "Under Investigation", "Resolved", "Closed"] },
      caseNotes: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["text"],
          properties: {
            author: { bsonType: "objectId" },
            text: { bsonType: "string" },
          },
        },
      },
      statusHistory: {
        bsonType: "array",
        items: {
          bsonType: "object",
          properties: {
            status: { bsonType: "string" },
            at: { bsonType: "date" },
            by: { bsonType: "objectId" },
          },
        },
      },
      assignedTo: { bsonType: "objectId" },
      createdBy: { bsonType: "objectId" },
      resolvedAt: { bsonType: "date" },
      escalationLevel: { bsonType: ["int", "double", "number"] },
      escalated: { bsonType: "bool" },
      lastEscalatedAt: { bsonType: "date" },
      slaWarnedAt: { bsonType: "date" },
      evidence: { bsonType: "array", items: { bsonType: "objectId" } },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    }
  );

  // evidence (backend/models/Evidence.js)
  const evidenceSchema = addProps(required(["complaint", "originalName", "filePath"]), {
    complaint: { bsonType: "objectId" },
    uploadedBy: { bsonType: "objectId" },
    originalName: { bsonType: "string" },
    filePath: { bsonType: "string" },
    mimeType: { bsonType: "string" },
    size: { bsonType: "int" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  });

  // assignments (backend/models/Assignment.js)
  const assignmentsSchema = addProps(required(["complaint", "assignedTo", "status"]), {
    complaint: { bsonType: "objectId" },
    assignedTo: { bsonType: "objectId" },
    status: { enum: ["Assigned", "In Progress", "Completed"] },
    notes: { bsonType: "string" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  });

  // notifications (backend/models/Notification.js)
  const notificationsSchema = addProps(required(["recipient", "title", "message"]), {
    recipient: { bsonType: "objectId" },
    title: { bsonType: "string" },
    message: { bsonType: "string" },
    type: { enum: ["Complaint", "Status", "Assignment", "OTP", "Support", "System"] },
    channel: { enum: ["InApp", "Email", "SMS"] },
    meta: {},
    read: { bsonType: "bool" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  });

  // supportTickets (backend/models/SupportTicket.js)
  const supportTicketsSchema = addProps(required(["subject", "message", "status"]), {
    requester: { bsonType: "objectId" },
    requesterName: { bsonType: "string" },
    requesterEmail: { bsonType: "string" },
    category: { bsonType: "string" },
    subject: { bsonType: "string" },
    message: { bsonType: "string" },
    status: { enum: ["Open", "In Progress", "Closed"] },
    adminReply: { bsonType: "string" },
    resolvedAt: { bsonType: "date" },
    rating: { bsonType: "int" },
    feedback: { bsonType: "string" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  });

  // complaintMessages (backend/models/ComplaintMessage.js)
  const complaintMessagesSchema = addProps(required(["complaint", "sender", "senderRole", "message"]), {
    complaint: { bsonType: "objectId" },
    sender: { bsonType: "objectId" },
    senderRole: { enum: ["Admin", "InvestigationOfficer", "PendingOfficer", "User"] },
    message: { bsonType: "string" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  });

  // faq (backend/models/Faq.js)
  const faqSchema = addProps(required(["question", "answer"]), {
    question: { bsonType: "string" },
    answer: { bsonType: "string" },
    order: { bsonType: "int" },
    active: { bsonType: "bool" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  });

  // sessions (backend/models/Session.js)
  const sessionsSchema = addProps(required(["sessionId", "user", "expiresAt"]), {
    sessionId: { bsonType: "string" },
    user: { bsonType: "objectId" },
    expiresAt: { bsonType: "date" },
    revokedAt: { bsonType: "date" },
    userAgent: { bsonType: "string" },
    ipAddress: { bsonType: "string" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  });

  // officerApprovalLogs (backend/models/OfficerApprovalLog.js)
  const officerApprovalLogsSchema = addProps(required(["officer", "admin", "action"]), {
    officer: { bsonType: "objectId" },
    admin: { bsonType: "objectId" },
    action: { enum: ["Approved", "Rejected"] },
    department: { bsonType: "string" },
    reason: { bsonType: "string" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
  });

  // Apply validators
  await setValidator(db, "users", usersSchema);
  await setValidator(db, "complaints", complaintsSchema);
  await setValidator(db, "evidence", evidenceSchema);
  await setValidator(db, "assignments", assignmentsSchema);
  await setValidator(db, "notifications", notificationsSchema);
  await setValidator(db, "supportTickets", supportTicketsSchema);
  await setValidator(db, "complaintMessages", complaintMessagesSchema);
  await setValidator(db, "faq", faqSchema);
  await setValidator(db, "officerApprovalLogs", officerApprovalLogsSchema);
  await setValidator(db, "sessions", sessionsSchema);

  console.log("[Validators] Updated validators to match current schemas.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[Validators] Failed:", err?.message || err);
  process.exit(1);
});

