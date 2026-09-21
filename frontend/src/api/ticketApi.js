import api from "../api";

// Student: Submit a new grievance or helpdesk ticket
export const createTicket = async (ticketData) => {
  const response = await api.post("/tickets", ticketData);
  return response.data;
};

// Student: Fetch all tickets raised by self
export const getMyTickets = async () => {
  const response = await api.get("/tickets/my-tickets");
  return response.data.tickets;
};

// Admin: Fetch all campus tickets with optional filters
export const getAllTicketsAdmin = async (params = {}) => {
  const response = await api.get("/tickets/admin", { params });
  return response.data;
};

// Admin: Resolve or update ticket status with remarks
export const resolveTicketAdmin = async (ticketId, resolutionData) => {
  const response = await api.patch(`/tickets/${ticketId}/resolve`, resolutionData);
  return response.data;
};

