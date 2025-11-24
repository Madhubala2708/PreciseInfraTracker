import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaRegCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBoqProjects,
  fetchApprovedBoqList,
  fetchApprovedBoqDetails,
  setApprovedBoqList,
} from "../../../store/slice/Aqs/aqsBoqSlice";
import { getApprovedBoqDetails } from "../../../services";

const BOQCard = ({ boq, onCardClick }) => {
  const approversText =
    boq.approvers && boq.approvers.length > 0
      ? boq.approvers.map((a) => a.employeeName).join(", ")
      : "N/A";

  // Format approvedAt
  const formattedDate = boq.approvedAt
    ? new Date(boq.approvedAt).toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).replace(",", " •")
    : "N/A";

  return (
    <div className="boq-card" onClick={onCardClick} style={{ cursor: "pointer" }}>
      <div className="boq-meta">
        <p>ID - {boq.boqCode || `BOQ#${boq.boqId}`}</p>
        <p className="date">{formattedDate}</p>
      </div>

      <h3 className="boq-title">{boq.boqName || "Untitled BOQ"}</h3>

      <div className="boq-content">
        <p>
          Approved by <span className="badge badge-blue">{approversText}</span>
        </p>
        <p className="boq-content">
          Project: {boq.projectName} | Vendor: {boq.vendorName || "N/A"}
        </p>
        {boq.boqItems && boq.boqItems.length > 0 && (
          <p className="boq-content">
            Items: {boq.boqItems.length} | Total:{" "}
            {boq.boqItems.reduce((sum, item) => sum + (item.total || 0), 0)}
          </p>
        )}
      </div>
    </div>
  );
};


const BOQDashboard = () => {
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    projects,
    approvedBoqList,
    loading,
    boqListLoading,
    boqListError,
  } = useSelector((state) => state.aqsBoq);

  // Load available projects
  useEffect(() => {
    dispatch(fetchBoqProjects());
  }, [dispatch]);

  // Fetch BOQ list → Then fetch details for approvers (important!)
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSite) return;

      const result = await dispatch(fetchApprovedBoqList(selectedSite)).unwrap();

      // Enrich each BOQ with approver names by fetching details API
      const enrichedList = await Promise.all(
        result.map(async (boq) => {
          try {
            const details = await getApprovedBoqDetails(boq.boqId);
            return {
              ...boq,
              approvers: details.approvers || [],
              boqItems: details.boqItems || [],
            };
          } catch {
            return boq;
          }
        })
      );

      dispatch(setApprovedBoqList(enrichedList));
    };

    fetchData();
  }, [selectedSite, dispatch]);

  return (
    <div className="page-boq container">
      {/* Navbar */}
      <div className="navbar">
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
        >
          <option value="">Select Project</option>
          {loading && <option>Loading...</option>}
          {!loading && projects?.length > 0 ? (
            projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.projectName}
              </option>
            ))
          ) : (
            !loading && <option disabled>No Projects Available</option>
          )}
        </select>

        <div className="actions">
          <button className="sort-button me-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-filter-left"
              viewBox="0 0 16 16"
            >
              <path d="M2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2 4a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm2 4a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5z" />
            </svg>
            <span className="ms-1">Sort By</span>
          </button>

          <button
            className="create-boq-btn"
            onClick={() => navigate("/aqs/aqsboqcreate")}
          >
            + Create BOQ
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <h2>All BOQ’s</h2>
        <span className="date_Picker" onClick={() => setIsOpen(!isOpen)}>
          {selectedDate
            ? selectedDate.toLocaleDateString("en-GB")
            : "Pick a date"}
          <FaRegCalendarAlt className="calendar-icon" />
        </span>

        {isOpen && (
          <DatePicker
            selected={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setIsOpen(false);
            }}
            dateFormat="dd/MM/yyyy"
            inline
          />
        )}
      </div>

      {/* BOQ List */}
      <div className="boq-grid">
        {boqListLoading && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>
            Loading BOQs...
          </div>
        )}

        {boqListError && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "20px",
              color: "red",
            }}
          >
            Error: {typeof boqListError === "string" ? boqListError : "Failed to load BOQs"}
          </div>
        )}

        {!boqListLoading &&
        !boqListError &&
        approvedBoqList &&
        approvedBoqList.length > 0 ? (
          approvedBoqList.map((boq, index) => (
            <BOQCard
              key={boq.boqId || index}
              boq={boq}
              onCardClick={() =>
                navigate(`/aqs/aqsboqopen?boqId=${boq.boqId}`, {
                  state: { boqId: boq.boqId },
                })
              }
            />
          ))
        ) : (
          !boqListLoading &&
          !selectedSite && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>
              Please select a project to view approved BOQs
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default BOQDashboard;
