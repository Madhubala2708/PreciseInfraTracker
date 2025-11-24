// src/pages/kanban/KanbanBoard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { getticketbyidAction } from "../../../store/actions/Ceo/TicketCreateAction";
import { loginBoardDetailsSelector } from "../../../store/selector/masterSelector";
import { getLoginBoardDetailsdAction } from "../../../store/actions/kanbanAction";

// Define tag colors
const tagColors = {
  HR: "#D6FFCF",
  Finance: "#CFE2FF",
  PO: "#FFCFCF",
  Open: "#D2F4FF",
  "In Progress": "#FFEECF",
  Review: "#E4CFFF",
  Done: "#DAFFCF",
  Approved: "#DAFFCF",
};

const KanbanBoard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const state = location.state;

  const boardDetailsData = useSelector(loginBoardDetailsSelector);
  // boardDetailsData might be { data: [...] } or [...] depending on action implementation
  const data = boardDetailsData?.data ?? boardDetailsData;

  const [boardData, setBoardData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Utility: get empId from incoming state or localStorage
  const getEmpId = useCallback(() => {
    if (state?.emp_id) return state.emp_id;
    const userDataString = localStorage.getItem("userData");
    const userData = userDataString ? JSON.parse(userDataString) : null;
    return userData?.empId;
  }, [state]);

  // Initial fetch on mount
  useEffect(() => {
    const empId = getEmpId();
    if (!empId) {
      setError("User information not found. Please log in again.");
      setLoading(false);
      return;
    }
    // fetch board details
    dispatch(getLoginBoardDetailsdAction(empId));
    // keep loading until data processed in next effect
  }, [dispatch, getEmpId]);

  // Single effect to handle refresh flag coming from other pages:
  useEffect(() => {
    if (location?.state?.refreshBoard) {
      const userDataString = localStorage.getItem("userData");
      const userData = userDataString ? JSON.parse(userDataString) : null;
      const empId = userData?.empId;
      if (empId) {
        // re-fetch board data once
        dispatch(getLoginBoardDetailsdAction(empId));
      }
      // Clear the refresh flag by replacing current history entry (so it won't retrigger)
      // We keep other state properties if present, but remove refreshBoard
      const newState = { ...(location.state || {}) };
      delete newState.refreshBoard;
      navigate(location.pathname, { replace: true, state: newState });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state?.refreshBoard, dispatch]);

  // Process data when Redux store updates
  useEffect(() => {
    // If no data yet, don't set error immediately (it may be loading)
    if (!data) {
      setLoading(true);
      return;
    }

    // If data is an array and empty
    if (Array.isArray(data) && data.length === 0) {
      setError("No boards found for this user.");
      setLoading(false);
      return;
    }

    // we expect an array of boards; choose first board as default
    const board = Array.isArray(data) ? data[0] : data;
    if (!board) {
      setError("Board data is invalid.");
      setLoading(false);
      return;
    }

    try {
      setBoardData(board);

      // Build columns from labels (defensive: labels may be undefined)
      const labels = Array.isArray(board.labels) ? board.labels : [];

      const transformedColumns = labels.map((label) => {
        // Build a unique list of tickets (avoid duplicates)
        const ticketList = Array.isArray(label.tickets) ? label.tickets : [];
        const uniqueTicketsMap = {};
        const uniqueTickets = ticketList.filter((t) => {
          const id = t?.ticketId ?? t?.ticketId === 0 ? t.ticketId : null;
          if (id === null) return false;
          if (uniqueTicketsMap[id]) return false;
          uniqueTicketsMap[id] = true;
          return true;
        });

        return {
          title: label.labelName || "Unknown",
          id: label.labelId ?? Math.random().toString(36).substring(2, 9),
          count: uniqueTickets.length,
          color: tagColors[label.labelName] || "#D2F4FF",
          tasks: uniqueTickets.map((ticket) => ({
            ticketId: ticket.ticketId,
            title: ticket.ticketName || ticket.ticketNo || "Untitled",
            tags: ["PO"], // keep example tag, can be extracted dynamically
            description: ticket.ticketDescription || "",
            date: ticket.ticketCreatedDate
              ? new Date(ticket.ticketCreatedDate).toLocaleDateString("en-GB")
              : "",
            comments: 0,
            files: 0,
          })),
        };
      });

      setColumns(transformedColumns);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("Error processing board data:", err);
      setError("Failed to process board data. Please refresh the page.");
      setLoading(false);
    }
  }, [data]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [menuOpen, setMenuOpen] = useState({});
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editColumnIndex, setEditColumnIndex] = useState(null);

  const handleAddTask = () => {
    if (newTaskTitle.trim() === "") return;

    setColumns((prev) =>
      prev.map((col, index) =>
        index === 0
          ? {
              ...col,
              tasks: [
                ...col.tasks,
                {
                  title: newTaskTitle,
                  tags: ["PO"],
                  description: "New task description",
                  date: new Date().toLocaleDateString("en-GB"),
                  comments: 0,
                  files: 0,
                },
              ],
              count: col.count + 1,
            }
          : col
      )
    );

    setNewTaskTitle("");
    setShowTaskInput(false);
  };

  // route per role helper
  const getTicketRoute = (ticketId) => {
    const userRoleId = (() => {
      const val = localStorage.getItem("userRoleId");
      return val ? parseInt(val, 10) : null;
    })();

    const roleRoutes = {
      1: `/ceo/ticket/${ticketId}`,
      2: `/admin/engineerticketdetails/${ticketId}`,
      3: `/aqs/aqsticketdetails/${ticketId}`,
      4: `/aqs/aqsticketdetails/${ticketId}`,
      5: `/admin/engineerticketdetails/${ticketId}`,
      6: `/admin/engineerticketdetails/${ticketId}`,
      7: `/pm/pmticket/${ticketId}`,
      8: `/pm/pmticket/${ticketId}`,
      9: `/admin/engineerticketdetails/${ticketId}`,
      10: `/admin/engineerticketdetails/${ticketId}`,
      11: `/ticket/${ticketId}`,
      12: `/finance/financeticketdetails/${ticketId}`,
      13: `/ceo/ticket/${ticketId}`,
      15: `/hr/hrticketdetails/${ticketId}`,
      16: `/purchasemanager/hrticketdetails/${ticketId}`,
      17: `/purchasemanager/hrticketdetails/${ticketId}`,
    };

    return roleRoutes[userRoleId] || `/ticket/${ticketId}`;
  };

  const handleTaskClick = async (task) => {
    try {
      const ticketId = task.ticketId;
      const ticketDetails = await dispatch(getticketbyidAction(ticketId)).unwrap();
      const ticketRoute = getTicketRoute(ticketId);
      navigate(ticketRoute, { state: { ticket: ticketDetails, from: "index" } });
    } catch (err) {
      console.error("Failed to fetch ticket:", err);
      alert("Failed to fetch ticket details. Please try again.");
    }
  };

  const handleMenuClick = (columnIndex) => {
    setMenuOpen((prev) => ({ ...prev, [columnIndex]: !prev[columnIndex] }));
  };

  const handleEditColumn = (columnIndex) => {
    setEditTaskTitle(columns[columnIndex].title);
    setEditColumnIndex(columnIndex);
    setMenuOpen((prev) => ({ ...prev, [columnIndex]: false }));
  };

  const handleSaveEdit = () => {
    setColumns((prev) =>
      prev.map((col, colIndex) => (colIndex === editColumnIndex ? { ...col, title: editTaskTitle } : col))
    );
    setEditTaskTitle("");
    setEditColumnIndex(null);
  };

  const handleDeleteColumn = (columnIndex) => {
    if (columnIndex === 0) return; // don't delete first column
    setColumns((prev) => prev.filter((_, index) => index !== columnIndex));
    setMenuOpen((prev) => ({ ...prev, [columnIndex]: false }));
  };

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center" }}>Loading board data...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20, color: "red", textAlign: "center" }}>
        {error}
      </div>
    );
  }

  if (!loading && columns.length === 0) {
    return (
      <div style={{ padding: 20, color: "orange", textAlign: "center" }}>
        <div>Board data loaded but no columns found. Please refresh the page.</div>
        <div style={{ marginTop: 10 }}>
          <button onClick={() => window.location.reload()} style={{ padding: "8px 16px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: 4 }}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-page-container">
      <div className="kanban-header-section">
        <div className="kanban-view-toggle">
          <button className="kanban-view-button active">
            Kanban
          </button>
        </div>
      </div>

      <div className="kanban-container">
        <div className="kanban-board" style={{ display: "flex", gap: 16, overflowX: "auto" }}>
          {columns.map((column, columnIndex) => (
            <div key={column.id} className="kanban-column" style={{ minWidth: 300, backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
              <div className="kanban-header" style={{ backgroundColor: column.color, padding: 12, borderRadius: "8px 8px 0 0", display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontWeight: "bold", marginRight: 8 }}>{column.title}</span>
                  <span style={{ backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 12, padding: "2px 8px", fontSize: 12 }}>{column.count}</span>
                </div>

                <div>
                  {columnIndex === 0 && <button onClick={() => setShowTaskInput(true)}>Add +</button>}
                  <button onClick={() => handleMenuClick(columnIndex)}>⋮</button>
                  {menuOpen[columnIndex] && (
                    <div className="menu-actions">
                      <button onClick={() => handleEditColumn(columnIndex)}>Edit</button>
                      {columnIndex !== 0 && <button onClick={() => handleDeleteColumn(columnIndex)}>Delete</button>}
                    </div>
                  )}
                </div>
              </div>

              {columnIndex === 0 && showTaskInput && (
                <div className="kanban-card add-task-card" style={{ padding: 12 }}>
                  <input type="text" className="form-control" placeholder="Enter task title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => setShowTaskInput(false)} style={{ marginRight: 8 }}>Cancel</button>
                    <button onClick={handleAddTask}>Create</button>
                  </div>
                </div>
              )}

              {editColumnIndex === columnIndex ? (
                <div className="kanban-card" style={{ padding: 12 }}>
                  <input type="text" value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} style={{ width: 200, marginRight: 8 }} />
                  <button onClick={handleSaveEdit} style={{ backgroundColor: "orange" }}>Save</button>
                  <button onClick={() => { setEditTaskTitle(""); setEditColumnIndex(null); }} style={{ marginLeft: 8 }}>Cancel</button>
                </div>
              ) : (
                <div className="task-list" style={{ padding: 12, flex: 1, overflowY: "auto" }}>
                  {column.tasks && column.tasks.length > 0 ? (
                    column.tasks.map((task, taskIndex) => (
                      <div key={task.ticketId ?? taskIndex} className="kanban-card" onClick={() => handleTaskClick(task)} style={{ cursor: "pointer", backgroundColor: "#fff", borderRadius: 6, padding: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.12)", border: "1px solid #e0e0e0" }}>
                        <h6 style={{ margin: 0 }}>{task.title}</h6>
                        <div style={{ marginTop: 6 }}>
                          {task.tags && task.tags.map((tag, i) => <span key={i} style={{ display: "inline-block", marginRight: 6, padding: "3px 8px", borderRadius: 12, backgroundColor: tagColors[tag] || "#888" }}>{tag}</span>)}
                        </div>
                        <p style={{ margin: "8px 0" }}>{task.description}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <small>{task.date}</small>
                          <div style={{ display: "flex", gap: 8 }}>
                            <small>💬 {task.comments}</small>
                            <small>📎 {task.files}</small>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-column-message">No tasks in this column</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
