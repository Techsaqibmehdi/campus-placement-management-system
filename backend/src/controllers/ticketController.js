const SupportTicket = require("../models/SupportTicket");
const User = require("../models/User");

// Student: Create a new support/grievance ticket
const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, description, driveId } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: "Subject is required" });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    const ticket = await SupportTicket.create({
      student: req.user.id,
      subject: subject.trim(),
      category: category || "academic_discrepancy",
      priority: priority || "medium",
      description: description.trim(),
      drive: driveId || null,
      status: "open",
    });

    res.status(201).json({
      message: "Support ticket created successfully. TPO desk will review your query.",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({
      message: "Failed to create support ticket",
      error: error.message,
    });
  }
};

// Student: Fetch own submitted tickets
const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ student: req.user.id })
      .populate("drive", "jobTitle company")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Get my tickets error:", error);
    res.status(500).json({
      message: "Failed to fetch your support tickets",
      error: error.message,
    });
  }
};

// Admin: Fetch all tickets across campus with optional filters
const getAllTicketsForAdmin = async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (search && search.trim()) {
      query.$or = [
        { subject: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const tickets = await SupportTicket.find(query)
      .populate(
        "student",
        "name email rollNumber course branch college contactNumber"
      )
      .populate("drive", "jobTitle company")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 });

    const stats = {
      total: await SupportTicket.countDocuments(),
      open: await SupportTicket.countDocuments({ status: "open" }),
      in_progress: await SupportTicket.countDocuments({ status: "in_progress" }),
      resolved: await SupportTicket.countDocuments({ status: "resolved" }),
    };

    res.status(200).json({
      count: tickets.length,
      stats,
      tickets,
    });
  } catch (error) {
    console.error("Get admin tickets error:", error);
    res.status(500).json({
      message: "Failed to fetch tickets for admin desk",
      error: error.message,
    });
  }
};

// Admin: Update ticket status and write official resolution response
const resolveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }

    if (status) {
      if (!["open", "in_progress", "resolved"].includes(status)) {
        return res.status(400).json({ message: "Invalid ticket status" });
      }
      ticket.status = status;
    }

    if (adminResponse !== undefined) {
      ticket.adminResponse = adminResponse.trim();
    }

    if (status === "resolved") {
      ticket.resolvedBy = req.user.id;
      ticket.resolvedAt = new Date();
    } else if (status === "open") {
      ticket.resolvedBy = null;
      ticket.resolvedAt = null;
    } else if (status === "in_progress") {
      ticket.resolvedBy = req.user.id;
    }

    await ticket.save();

    await ticket.populate(
      "student",
      "name email rollNumber course branch college"
    );
    await ticket.populate("drive", "jobTitle company");
    await ticket.populate("resolvedBy", "name email");

    res.status(200).json({
      message: `Support ticket updated to ${ticket.status}`,
      ticket,
    });
  } catch (error) {
    console.error("Resolve ticket error:", error);
    res.status(500).json({
      message: "Failed to update ticket",
      error: error.message,
    });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTicketsForAdmin,
  resolveTicket,
};

