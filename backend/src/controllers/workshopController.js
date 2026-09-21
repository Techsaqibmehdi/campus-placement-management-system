const crypto = require("crypto");
const Razorpay = require("razorpay");
const Workshop = require("../models/Workshop");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const { sendWorkshopRegistrationEmail } = require("../services/emailService");

// Helper to get Razorpay instance
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_id && key_secret && !key_id.startsWith("placeholder")) {
    return new Razorpay({ key_id, key_secret });
  }
  return null;
};

// Create a new Skill Workshop (Admin only)
const createWorkshop = async (req, res) => {
  try {
    const {
      title,
      instructor,
      description,
      duration,
      startDate,
      endDate,
      registrationDeadline,
      mode,
      venue,
      totalSeats,
      isPaid,
      fee,
      tags,
    } = req.body;

    if (!title || !startDate || !endDate || !registrationDeadline) {
      return res.status(400).json({
        message: "Workshop Title, Start Date, End Date, and Registration Deadline are required",
      });
    }

    const workshop = await Workshop.create({
      title: title.trim(),
      instructor: instructor ? instructor.trim() : "Industry Expert",
      description: description ? description.trim() : "",
      duration: duration ? duration.trim() : "3 Days",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: new Date(registrationDeadline),
      mode: mode || "Online",
      venue: venue ? venue.trim() : "Virtual Platform / Online Meet",
      totalSeats: parseInt(totalSeats, 10) || 50,
      seatsBooked: 0,
      isPaid: Boolean(isPaid),
      fee: isPaid ? Math.max(0, parseFloat(fee) || 0) : 0,
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      status: "open",
      createdBy: req.user.id,
      participants: [],
    });

    return res.status(201).json({
      message: "Skill Workshop created successfully",
      workshop,
    });
  } catch (error) {
    console.error("Error creating workshop:", error);
    return res.status(500).json({
      message: "Failed to create workshop",
      error: error.message,
    });
  }
};

// Get all Skill Workshops (Public / Student / Admin)
const getAllWorkshops = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (type === "free") {
      query.isPaid = false;
    } else if (type === "paid") {
      query.isPaid = true;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { instructor: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ];
    }

    const workshops = await Workshop.find(query).sort({ startDate: 1 });

    const currentUserId = req.user ? req.user.id : null;

    const formattedWorkshops = workshops.map((ws) => {
      const wsObj = ws.toObject({ virtuals: true });
      const myRegistration = currentUserId
        ? ws.participants.find((p) => p.user && p.user.toString() === currentUserId.toString())
        : null;

      return {
        ...wsObj,
        hasRegistered: !!myRegistration,
        myRegistration: myRegistration
          ? {
              registeredAt: myRegistration.registeredAt,
              paymentStatus: myRegistration.paymentStatus,
              paymentId: myRegistration.paymentId,
              orderId: myRegistration.orderId,
              amountPaid: myRegistration.amountPaid,
            }
          : null,
        availableSeats: Math.max(0, ws.totalSeats - ws.seatsBooked),
        // Exclude full participants array for students/public list
        participantsCount: ws.participants.length,
        participants: req.user?.role === "admin" ? ws.participants : undefined,
      };
    });

    return res.status(200).json({
      count: formattedWorkshops.length,
      workshops: formattedWorkshops,
    });
  } catch (error) {
    console.error("Error fetching workshops:", error);
    return res.status(500).json({
      message: "Failed to fetch workshops",
      error: error.message,
    });
  }
};

// Get single workshop by ID
const getWorkshopById = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    const currentUserId = req.user ? req.user.id : null;
    const myRegistration = currentUserId
      ? workshop.participants.find((p) => p.user && p.user.toString() === currentUserId.toString())
      : null;

    const wsObj = workshop.toObject({ virtuals: true });
    wsObj.hasRegistered = !!myRegistration;
    wsObj.myRegistration = myRegistration;
    wsObj.availableSeats = Math.max(0, workshop.totalSeats - workshop.seatsBooked);

    if (req.user?.role !== "admin") {
      delete wsObj.participants;
    }

    return res.status(200).json({ workshop: wsObj });
  } catch (error) {
    console.error("Error fetching workshop:", error);
    return res.status(500).json({ message: "Failed to fetch workshop", error: error.message });
  }
};

// Update workshop status (Admin only)
const updateWorkshopStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["open", "closed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid workshop status" });
    }

    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    workshop.status = status;
    await workshop.save();

    return res.status(200).json({
      message: `Workshop status updated to ${status}`,
      workshop,
    });
  } catch (error) {
    console.error("Error updating workshop status:", error);
    return res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};

// Get registered participants for a workshop (Admin only)
const getWorkshopParticipants = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    return res.status(200).json({
      workshopTitle: workshop.title,
      totalSeats: workshop.totalSeats,
      seatsBooked: workshop.seatsBooked,
      availableSeats: Math.max(0, workshop.totalSeats - workshop.seatsBooked),
      isPaid: workshop.isPaid,
      fee: workshop.fee,
      participants: workshop.participants,
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return res.status(500).json({ message: "Failed to fetch participants", error: error.message });
  }
};

// Register for FREE Workshop (Student only)
const registerFreeWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    if (workshop.status !== "open") {
      return res.status(400).json({ message: `Workshop is currently ${workshop.status}` });
    }

    if (workshop.isPaid && workshop.fee > 0) {
      return res.status(400).json({
        message: "This is a paid workshop. Please complete payment via Razorpay to register.",
      });
    }

    if (workshop.seatsBooked >= workshop.totalSeats) {
      return res.status(400).json({ message: "Workshop is housefull! No seats available." });
    }

    // Check if already registered
    const alreadyRegistered = workshop.participants.some(
      (p) => p.user && p.user.toString() === req.user.id.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({ message: "You are already registered for this workshop." });
    }

    // Fetch student info
    const user = await User.findById(req.user.id);
    const profile = await StudentProfile.findOne({ user: req.user.id });

    const participant = {
      user: req.user.id,
      rollNumber: user?.rollNumber || profile?.rollNumber || "N/A",
      name: user?.name || "Student",
      email: user?.email || "",
      course: user?.course || profile?.course || "B.Tech",
      branch: user?.branch || profile?.branch || "CSE",
      registeredAt: new Date(),
      paymentStatus: "free",
      paymentId: "FREE_TIER",
      orderId: `FREE-${Date.now()}`,
      amountPaid: 0,
    };

    workshop.participants.push(participant);
    workshop.seatsBooked = workshop.participants.length;
    await workshop.save();

    // Trigger confirmation email
    sendWorkshopRegistrationEmail(
      {
        name: participant.name,
        email: participant.email,
        rollNumber: participant.rollNumber,
        course: participant.course,
        branch: participant.branch,
      },
      workshop,
      {
        paymentStatus: "Complimentary (Free)",
        paymentId: "FREE_TIER",
        orderId: participant.orderId,
        amountPaid: 0,
        registeredAt: participant.registeredAt,
      }
    ).catch((err) => console.warn("Background email send failed:", err.message));

    return res.status(200).json({
      message: "Successfully registered for workshop! Confirmation email sent.",
      registration: participant,
      availableSeats: Math.max(0, workshop.totalSeats - workshop.seatsBooked),
    });
  } catch (error) {
    console.error("Error registering for free workshop:", error);
    return res.status(500).json({ message: "Failed to register for workshop", error: error.message });
  }
};

// Create Razorpay Order for Paid Workshop (Student only)
const createWorkshopOrder = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    if (workshop.status !== "open") {
      return res.status(400).json({ message: `Workshop is currently ${workshop.status}` });
    }

    if (!workshop.isPaid || (workshop.fee || 0) <= 0) {
      return res.status(400).json({
        message: "This workshop is free. You can register directly without payment.",
      });
    }

    if (workshop.seatsBooked >= workshop.totalSeats) {
      return res.status(400).json({ message: "Workshop is housefull! No seats available." });
    }

    // Check if already registered
    const alreadyRegistered = workshop.participants.some(
      (p) => p.user && p.user.toString() === req.user.id.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({ message: "You are already registered for this workshop." });
    }

    const amountInPaise = Math.round(workshop.fee * 100);
    const receiptId = `ws_${workshop._id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;

    const razorpay = getRazorpayInstance();

    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId,
        notes: {
          workshopId: workshop._id.toString(),
          studentId: req.user.id.toString(),
          title: workshop.title,
        },
      });

      return res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        workshopTitle: workshop.title,
        instructor: workshop.instructor,
        fee: workshop.fee,
      });
    } else {
      // Demo / Test Mode Simulation if Razorpay keys are not yet configured
      const mockOrderId = `order_demo_${Date.now()}`;
      return res.status(200).json({
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_demo_mode",
        workshopTitle: workshop.title,
        instructor: workshop.instructor,
        fee: workshop.fee,
        isDemoMode: true,
      });
    }
  } catch (error) {
    console.error("Error creating workshop order:", error);
    return res.status(500).json({ message: "Failed to initiate payment", error: error.message });
  }
};

// Verify Razorpay Payment & Confirm Registration (Student only)
const verifyWorkshopPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    if (workshop.seatsBooked >= workshop.totalSeats) {
      return res.status(400).json({ message: "Workshop seats are full." });
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const isConfigured = razorpayKeySecret && !razorpayKeySecret.startsWith("placeholder");

    if (isConfigured) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          message: "Payment verification failed! Invalid cryptographic signature.",
        });
      }
    } else {
      console.log("Demo Mode: Skipping real signature validation for demo test order");
    }

    // Check if already registered
    const alreadyRegistered = workshop.participants.some(
      (p) => p.user && p.user.toString() === req.user.id.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({ message: "You are already registered for this workshop." });
    }

    const user = await User.findById(req.user.id);
    const profile = await StudentProfile.findOne({ user: req.user.id });

    const participant = {
      user: req.user.id,
      rollNumber: user?.rollNumber || profile?.rollNumber || "N/A",
      name: user?.name || "Student",
      email: user?.email || "",
      course: user?.course || profile?.course || "B.Tech",
      branch: user?.branch || profile?.branch || "CSE",
      registeredAt: new Date(),
      paymentStatus: "completed",
      paymentId: razorpay_payment_id || `pay_demo_${Date.now()}`,
      orderId: razorpay_order_id || `order_demo_${Date.now()}`,
      amountPaid: workshop.fee,
    };

    workshop.participants.push(participant);
    workshop.seatsBooked = workshop.participants.length;
    await workshop.save();

    // Send confirmation email
    sendWorkshopRegistrationEmail(
      {
        name: participant.name,
        email: participant.email,
        rollNumber: participant.rollNumber,
        course: participant.course,
        branch: participant.branch,
      },
      workshop,
      {
        paymentStatus: "Completed",
        paymentId: participant.paymentId,
        orderId: participant.orderId,
        amountPaid: participant.amountPaid,
        registeredAt: participant.registeredAt,
      }
    ).catch((err) => console.warn("Background confirmation email failed:", err.message));

    return res.status(200).json({
      message: "Payment verified and registration confirmed! A confirmation email has been sent.",
      registration: participant,
      availableSeats: Math.max(0, workshop.totalSeats - workshop.seatsBooked),
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ message: "Failed to verify payment", error: error.message });
  }
};

module.exports = {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  updateWorkshopStatus,
  getWorkshopParticipants,
  registerFreeWorkshop,
  createWorkshopOrder,
  verifyWorkshopPayment,
};

