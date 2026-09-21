import { useState, useEffect } from "react";
import {
  getWorkshops,
  registerFreeWorkshop,
  createWorkshopOrder,
  verifyWorkshopPayment,
} from "../api/workshopApi";

// Helper to dynamically load Razorpay checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function WorkshopsView() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "free" | "paid" | "my_workshops"
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Selected Workshop for Details Modal
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  // Receipt / Pass Modal
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    loadWorkshops();
  }, []);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getWorkshops();
      setWorkshops(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load skill workshops");
    } finally {
      setLoading(false);
    }
  };

  // Handle Free Workshop Registration
  const handleRegisterFree = async (workshop) => {
    try {
      setProcessingId(workshop._id);
      setError("");
      setSuccessMsg("");
      const res = await registerFreeWorkshop(workshop._id);
      setSuccessMsg(res.message || "Registration confirmed! Confirmation email dispatched.");
      setReceiptData({
        workshopTitle: workshop.title,
        instructor: workshop.instructor,
        duration: workshop.duration,
        startDate: workshop.startDate,
        endDate: workshop.endDate,
        fee: 0,
        paymentStatus: "Complimentary (Free)",
        paymentId: res.registration?.paymentId || "FREE_TIER",
        orderId: res.registration?.orderId || `FREE-${Date.now()}`,
        registeredAt: res.registration?.registeredAt || new Date(),
      });
      await loadWorkshops();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register for workshop");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Paid Workshop Registration via Razorpay
  const handleRegisterPaid = async (workshop) => {
    try {
      setProcessingId(workshop._id);
      setError("");
      setSuccessMsg("");

      // 1. Create order on backend
      const orderData = await createWorkshopOrder(workshop._id);

      // Check if running in demo simulation mode without live keys
      if (orderData.isDemoMode) {
        // Direct simulation for local development / testing
        const simulatedPayment = {
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: "sig_demo",
        };
        const verifyRes = await verifyWorkshopPayment(workshop._id, simulatedPayment);
        setSuccessMsg(verifyRes.message || "Payment simulated & registration confirmed!");
        setReceiptData({
          workshopTitle: workshop.title,
          instructor: workshop.instructor,
          duration: workshop.duration,
          startDate: workshop.startDate,
          endDate: workshop.endDate,
          fee: workshop.fee,
          paymentStatus: "Completed (Demo Mode)",
          paymentId: simulatedPayment.razorpay_payment_id,
          orderId: simulatedPayment.razorpay_order_id,
          registeredAt: new Date(),
        });
        await loadWorkshops();
        setProcessingId(null);
        return;
      }

      // 2. Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Razorpay SDK failed to load. Please check your internet connection.");
        setProcessingId(null);
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : {};

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "XYZ CRPC Placement Cell",
        description: `Enrolment for ${workshop.title}`,
        order_id: orderData.orderId,
        prefill: {
          name: user.name || "",
          email: user.email || "",
          contact: user.contactNumber || "",
        },
        theme: {
          color: "#0284c7",
        },
        handler: async function (response) {
          try {
            const verifyRes = await verifyWorkshopPayment(workshop._id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSuccessMsg(verifyRes.message || "Payment verified & registration confirmed!");
            setReceiptData({
              workshopTitle: workshop.title,
              instructor: workshop.instructor,
              duration: workshop.duration,
              startDate: workshop.startDate,
              endDate: workshop.endDate,
              fee: workshop.fee,
              paymentStatus: "Completed",
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              registeredAt: new Date(),
            });
            await loadWorkshops();
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || "Payment verification failed");
          } finally {
            setProcessingId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingId(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initialize Razorpay payment");
      setProcessingId(null);
    }
  };

  const displayedWorkshops = workshops.filter((ws) => {
    if (filterType === "my_workshops") {
      if (!ws.hasRegistered) return false;
    } else if (filterType === "free") {
      if (ws.isPaid && ws.fee > 0) return false;
    } else if (filterType === "paid") {
      if (!ws.isPaid || ws.fee === 0) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ws.title?.toLowerCase().includes(q);
      const matchInstructor = ws.instructor?.toLowerCase().includes(q);
      const matchDesc = ws.description?.toLowerCase().includes(q);
      const matchTag = (ws.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchInstructor || matchDesc || matchTag;
    }

    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #0369a1 100%)",
          borderRadius: "16px",
          padding: "28px 32px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(3,105,161,0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.15)",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            🚀 INDUSTRY READINESS & UPSKILLING
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: "26px", fontWeight: 800 }}>
            Skill Workshops & Masterclasses
          </h1>
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.9, maxWidth: "600px" }}>
            Participate in hands-on workshops conducted by top industry experts. Enhance your placement profile, earn verifiable certificates, and unlock career opportunities.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.1)", padding: "12px 18px", borderRadius: "12px" }}>
          <div style={{ textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.2)", paddingRight: "16px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, display: "block" }}>
              {workshops.length}
            </span>
            <span style={{ fontSize: "11px", opacity: 0.8 }}>Total Workshops</span>
          </div>
          <div style={{ textAlign: "center", paddingLeft: "4px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#86efac", display: "block" }}>
              {workshops.filter((w) => w.hasRegistered).length}
            </span>
            <span style={{ fontSize: "11px", opacity: 0.8 }}>My Enrolments</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: "12px 18px", background: "#fef2f2", color: "#b91c1c", borderRadius: "10px", border: "1px solid #fecaca", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: "12px 18px", background: "#f0fdf4", color: "#166534", borderRadius: "10px", border: "1px solid #bbf7d0", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#ffffff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Workshops" },
            { id: "free", label: "Free Workshops" },
            { id: "paid", label: "Paid Workshops" },
            { id: "my_workshops", label: "My Enrolments" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: filterType === tab.id ? "#0284c7" : "#f1f5f9",
                color: filterType === tab.id ? "#ffffff" : "#475569",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search workshops or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Workshops Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
          Loading workshops...
        </div>
      ) : displayedWorkshops.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>💡</div>
          <h3 style={{ margin: "0 0 6px", color: "#1e293b", fontSize: "17px" }}>No Workshops Found</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
            {filterType === "my_workshops"
              ? "You have not enrolled in any skill workshops yet."
              : "No workshops currently match your search or filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
          {displayedWorkshops.map((ws) => {
            const isFull = ws.availableSeats <= 0;
            const isRegistered = ws.hasRegistered;
            const isPaid = ws.isPaid && ws.fee > 0;
            const percentBooked = Math.min(100, Math.round((ws.seatsBooked / ws.totalSeats) * 100));

            const startStr = ws.startDate
              ? new Date(ws.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "";
            const endStr = ws.endDate
              ? new Date(ws.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "";

            return (
              <div
                key={ws._id}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                <div style={{ padding: "20px" }}>
                  {/* Top Badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", background: "#eff6ff", color: "#1d4ed8", borderRadius: "6px" }}>
                        🌐 {ws.mode || "Online"}
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", background: "#f8fafc", color: "#475569", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                        ⏱️ {ws.duration || "3 Days"}
                      </span>
                    </div>

                    {/* Pricing Tag */}
                    {isPaid ? (
                      <span style={{ fontSize: "13px", fontWeight: 800, padding: "4px 10px", background: "#ecfdf5", color: "#047857", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                        ₹{ws.fee}
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", fontWeight: 800, padding: "4px 10px", background: "#f0fdf4", color: "#16a34a", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                        FREE
                      </span>
                    )}
                  </div>

                  {/* Title & Instructor */}
                  <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
                    {ws.title}
                  </h3>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>👨‍🏫</span>
                    <span>Instructor: <strong>{ws.instructor}</strong></span>
                  </div>

                  {/* Schedule & Venue */}
                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #f1f5f9", fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" }}>
                    <div>📅 <strong>Date:</strong> {startStr} – {endStr}</div>
                    <div>📍 <strong>Venue:</strong> {ws.venue || "Online Platform"}</div>
                  </div>

                  {/* Seats Progress */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                      <span>Seats: <strong>{ws.totalSeats} Total</strong></span>
                      <span style={{ color: isFull ? "#dc2626" : "#0284c7" }}>
                        {isFull ? "Housefull" : `${ws.availableSeats} Seats Left`}
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${percentBooked}%`,
                          height: "100%",
                          background: isFull ? "#dc2626" : percentBooked > 80 ? "#f59e0b" : "#0284c7",
                          borderRadius: "10px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  {(ws.tags || []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "4px" }}>
                      {ws.tags.slice(0, 4).map((t, idx) => (
                        <span key={idx} style={{ fontSize: "11px", padding: "2px 8px", background: "#f1f5f9", color: "#475569", borderRadius: "4px" }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", background: "#fafafa", display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setSelectedWorkshop(ws)}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                    }}
                  >
                    View Details
                  </button>

                  {isRegistered ? (
                    <button
                      onClick={() => {
                        setReceiptData({
                          workshopTitle: ws.title,
                          instructor: ws.instructor,
                          duration: ws.duration,
                          startDate: ws.startDate,
                          endDate: ws.endDate,
                          fee: ws.myRegistration?.amountPaid ?? (isPaid ? ws.fee : 0),
                          paymentStatus: ws.myRegistration?.paymentStatus || "Completed",
                          paymentId: ws.myRegistration?.paymentId || "CONFIRMED",
                          orderId: ws.myRegistration?.orderId || "ORDER_OK",
                          registeredAt: ws.myRegistration?.registeredAt || new Date(),
                        });
                      }}
                      style={{
                        flex: 1.2,
                        padding: "9px 12px",
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#047857",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Enrolled (Pass)
                    </button>
                  ) : isFull ? (
                    <button
                      disabled
                      style={{
                        flex: 1.2,
                        padding: "9px 12px",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#94a3b8",
                        cursor: "not-allowed",
                      }}
                    >
                      Housefull
                    </button>
                  ) : (
                    <button
                      disabled={processingId === ws._id}
                      onClick={() => (isPaid ? handleRegisterPaid(ws) : handleRegisterFree(ws))}
                      style={{
                        flex: 1.2,
                        padding: "9px 12px",
                        background: isPaid ? "#0284c7" : "#059669",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#ffffff",
                        cursor: processingId === ws._id ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 6px rgba(2,132,199,0.2)",
                      }}
                    >
                      {processingId === ws._id
                        ? "Processing..."
                        : isPaid
                        ? `Register Now (₹${ws.fee})`
                        : "Register Free"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL: WORKSHOP SYLLABUS & FULL DETAILS
         ======================================================== */}
      {selectedWorkshop && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", background: selectedWorkshop.isPaid ? "#ecfdf5" : "#f0fdf4", color: selectedWorkshop.isPaid ? "#047857" : "#16a34a", borderRadius: "6px", display: "inline-block", marginBottom: "6px" }}>
                  {selectedWorkshop.isPaid ? `PAID WORKSHOP • ₹${selectedWorkshop.fee}` : "COMPLIMENTARY WORKSHOP (FREE)"}
                </span>
                <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>{selectedWorkshop.title}</h2>
              </div>
              <button onClick={() => setSelectedWorkshop(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Meta Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div><span style={{ fontSize: "11px", color: "#64748b" }}>Instructor:</span><div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{selectedWorkshop.instructor}</div></div>
                <div><span style={{ fontSize: "11px", color: "#64748b" }}>Duration:</span><div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{selectedWorkshop.duration}</div></div>
                <div><span style={{ fontSize: "11px", color: "#64748b" }}>Dates:</span><div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{new Date(selectedWorkshop.startDate).toLocaleDateString()} – {new Date(selectedWorkshop.endDate).toLocaleDateString()}</div></div>
                <div><span style={{ fontSize: "11px", color: "#64748b" }}>Mode & Venue:</span><div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{selectedWorkshop.mode} • {selectedWorkshop.venue}</div></div>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ margin: "0 0 6px", fontSize: "14px", color: "#1e293b" }}>Curriculum & Syllabus</h4>
                <div style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, whiteSpace: "pre-line", background: "#fafafa", padding: "12px 14px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                  {selectedWorkshop.description || "Comprehensive hands-on training with industry best practices, project implementation, and doubt-clearing sessions."}
                </div>
              </div>

              {/* Tags */}
              {(selectedWorkshop.tags || []).length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "13px", color: "#1e293b" }}>Technologies Covered</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {selectedWorkshop.tags.map((t, idx) => (
                      <span key={idx} style={{ padding: "4px 10px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12px", color: "#334155" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div style={{ marginTop: "10px" }}>
                {selectedWorkshop.hasRegistered ? (
                  <div style={{ padding: "12px", background: "#ecfdf5", color: "#047857", borderRadius: "8px", textAlign: "center", fontWeight: 700, fontSize: "13px" }}>
                    ✓ You are already enrolled in this workshop! Check your email for confirmation.
                  </div>
                ) : selectedWorkshop.availableSeats <= 0 ? (
                  <div style={{ padding: "12px", background: "#f1f5f9", color: "#64748b", borderRadius: "8px", textAlign: "center", fontWeight: 600, fontSize: "13px" }}>
                    Registration is full for this session.
                  </div>
                ) : (
                  <button
                    disabled={processingId === selectedWorkshop._id}
                    onClick={() => {
                      const ws = selectedWorkshop;
                      setSelectedWorkshop(null);
                      if (ws.isPaid && ws.fee > 0) {
                        handleRegisterPaid(ws);
                      } else {
                        handleRegisterFree(ws);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: selectedWorkshop.isPaid ? "#0284c7" : "#059669",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    {selectedWorkshop.isPaid
                      ? `Proceed to Razorpay Checkout (₹${selectedWorkshop.fee})`
                      : "Confirm Free Registration"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: WORKSHOP PASS & PAYMENT RECEIPT
         ======================================================== */}
      {receiptData && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.65)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "520px", padding: "26px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "inline-flex", justifyContent: "center", alignItems: "center", fontSize: "26px", marginBottom: "10px" }}>
                ✓
              </div>
              <h3 style={{ margin: "0 0 4px", fontSize: "20px", color: "#0f172a" }}>Enrolment Confirmed!</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Your seat has been reserved in the masterclass</p>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 18px", marginBottom: "18px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Workshop:</span>
                <strong style={{ color: "#0f172a" }}>{receiptData.workshopTitle}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Instructor:</span>
                <span style={{ fontWeight: 600 }}>{receiptData.instructor}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Duration:</span>
                <span style={{ fontWeight: 600 }}>{receiptData.duration}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Amount:</span>
                <strong style={{ color: "#047857" }}>{receiptData.fee > 0 ? `₹${receiptData.fee}` : "Free (Sponsored)"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Payment Status:</span>
                <strong style={{ color: "#16a34a" }}>{receiptData.paymentStatus}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #cbd5e1", paddingTop: "8px", marginTop: "4px" }}>
                <span style={{ color: "#64748b" }}>Transaction Ref:</span>
                <code style={{ fontSize: "11px", background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px" }}>{receiptData.paymentId}</code>
              </div>
            </div>

            <button
              onClick={() => setReceiptData(null)}
              style={{
                width: "100%",
                padding: "11px",
                background: "#0284c7",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Done & Return to Workshops
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

