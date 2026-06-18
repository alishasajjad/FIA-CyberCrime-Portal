const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRoles = require("../middleware/roles");
const supportTicketController = require("../controllers/supportTicketController");

const router = express.Router();

// Users can create tickets; officers/admin can view/manage.
router.post(
  "/",
  authMiddleware,
  requireRoles(["User", "InvestigationOfficer", "Admin"]),
  supportTicketController.createTicket
);

router.get(
  "/",
  authMiddleware,
  requireRoles(["Admin", "InvestigationOfficer", "User"]),
  supportTicketController.listTickets
);

router.patch(
  "/:id",
  authMiddleware,
  requireRoles(["Admin", "InvestigationOfficer"]),
  supportTicketController.updateTicket
);

router.patch(
  "/:id/feedback",
  authMiddleware,
  requireRoles(["User"]),
  supportTicketController.submitFeedback
);

router.get(
  "/faq/list",
  authMiddleware,
  requireRoles(["Admin", "InvestigationOfficer", "User"]),
  supportTicketController.listFaq
);

router.delete(
  "/:id",
  authMiddleware,
  requireRoles(["Admin"]),
  supportTicketController.deleteTicket
);

module.exports = router;

