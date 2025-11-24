import React, { useEffect } from "react";
import { Form, Table, Dropdown } from "react-bootstrap";
import { RiArrowDropDownLine } from "react-icons/ri";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchApprovedBoqDetails } from "../../../store/slice/Aqs/aqsBoqSlice";

const BoqOpen = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const params = useParams();
    
    // Get boqId from multiple sources (route params, location state, or query params)
    const search = new URLSearchParams(location.search);
    const queryBoqId = search.get("boqId");
    const stateBoqId = location.state?.boqId;
    const paramBoqId = params.boqId || params.id;
    const boqId = paramBoqId || queryBoqId || stateBoqId;

    const { approvedBoqDetails, boqDetailsLoading, boqDetailsError } = useSelector((state) => state.aqsBoq);

    // Debug logging
    useEffect(() => {
        console.log("BoqOpen - boqId:", boqId);
        console.log("BoqOpen - location.state:", location.state);
        console.log("BoqOpen - params:", params);
        console.log("BoqOpen - approvedBoqDetails:", approvedBoqDetails);
    }, [boqId, location.state, params, approvedBoqDetails]);

    // Fetch approved BOQ details when component mounts or boqId changes
    useEffect(() => {
        if (boqId) {
            console.log("Fetching BOQ details for boqId:", boqId);
            dispatch(fetchApprovedBoqDetails(boqId));
        } else {
            console.warn("No boqId found - cannot fetch BOQ details");
        }
    }, [boqId, dispatch]);

    // Normalize approvedBoqDetails - handle both object and array responses
    const boqDetailsArray = approvedBoqDetails 
        ? (Array.isArray(approvedBoqDetails) ? approvedBoqDetails : [approvedBoqDetails])
        : [];
    
    // Get the first BOQ from the array (or handle multiple BOQs as needed)
    const selectedBoq = boqDetailsArray.length > 0 ? boqDetailsArray[0] : null;

    return (
        <div className="page-boq-open container mt-4">
        <div style={{ paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
            <span 
            onClick={() => navigate('/aqs/aqsboq')}
            style={ { cursor : 'pointer'}}
            >BOQ
            </span> &gt; <span style={{ color: '#FF6F00' }}>Open BOQ</span>
        </h2>
      </div>
     <h3 className="mt-3">{selectedBoq?.boqName || "New BOQ"}</h3>
        
        {!boqId && (
            <div className="alert alert-warning mt-3" role="alert">
                No BOQ ID provided. Please select a BOQ from the list.
            </div>
        )}

        {boqDetailsLoading && (
            <div className="text-center py-4">
                <p>Loading BOQ details...</p>
            </div>
        )}
        
        {boqDetailsError && (
            <div className="alert alert-danger mt-3" role="alert">
                Error: {typeof boqDetailsError === "string" ? boqDetailsError : "Failed to load BOQ details"}
            </div>
        )}

        {/* Display all approved BOQs - show table if we have data */}
        {!boqDetailsLoading && !boqDetailsError && boqDetailsArray.length > 0 && (
            <>
                {/* Form Section - Show first BOQ details */}
                {selectedBoq && (
                    <div className="row mt-3">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="BOQ TITLE" 
                                    value={selectedBoq.boqName || ""}
                                    readOnly
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    placeholder="Enter description" 
                                    rows={1}
                                    value={selectedBoq.description || ""}
                                    readOnly
                                />
                            </Form.Group>
                        </div>
                    </div>
                )}

                {selectedBoq && (
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Vendor</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={selectedBoq.vendorName || ""}
                                    readOnly
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>BOQ Code</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={selectedBoq.boqCode || ""}
                                    readOnly
                                />
                            </Form.Group>
                        </div>
                    </div>
                )}

                {selectedBoq && selectedBoq.approvedAt && (
                    <div className="row">
                        <div className="col-md-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Approved At</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={new Date(selectedBoq.approvedAt).toLocaleString() || ""}
                                    readOnly
                                />
                            </Form.Group>
                        </div>
                    </div>
                )}

                {/* Display BOQ Items if available */}
                {selectedBoq && selectedBoq.boqItems && selectedBoq.boqItems.length > 0 && (
                    <div className="mt-4">
                        <h4>BOQ Items</h4>
                        <div className="table-responsive">
                            <Table bordered className="tbl">
                                <thead className="table-light">
                                    <tr>
                                        <th>S. No</th>
                                        <th>Item Name</th>
                                        <th>Unit</th>
                                        <th>Rate ₹</th>
                                        <th>Quantity</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBoq.boqItems.map((item, index) => (
                                        <tr key={item.boqItemsId || index}>
                                            <td>{index + 1}</td>
                                            <td>{item.itemName}</td>
                                            <td>{item.unit}</td>
                                            <td>{item.price}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Display Approvers if available */}
                {selectedBoq && selectedBoq.approvers && selectedBoq.approvers.length > 0 && (
                    <div className="mt-4">
                        <h4>Approvers</h4>
                        <div className="table-responsive">
                            <Table bordered className="tbl">
                                <thead className="table-light">
                                    <tr>
                                        <th>Employee Name</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBoq.approvers.map((approver, index) => (
                                        <tr key={index}>
                                            <td>{approver.employeeName}</td>
                                            <td>{approver.roleName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                )}
            </>
        )}

        {/* Show message if no data and not loading */}
        {!boqDetailsLoading && !boqDetailsError && boqId && boqDetailsArray.length === 0 && (
            <div className="alert alert-info mt-4" role="alert">
                No approved BOQ details found for BOQ ID: {boqId}
            </div>
        )}
        </div>
    );
};

export default BoqOpen;
