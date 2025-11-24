import api from "./api";
import { API } from "../constant/service";

//Fetch approved projects (sites) for BOQ dropdown
export const getBoqProjects = async () => {
  try {
    const response = await api.GET(API.GET_APPROVED_PROJECTS_BY_EMPLOYEE);
    console.log("BOQ Projects API Response:", response);
    return response?.data || [];
  } catch (error) {
    console.error("BOQ Projects API Error:", error);
    throw error;
  }
};

//Fetch approved BOQ list by project ID
export const getApprovedBoqList = async (projectId) => {
  try {
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    const response = await api.GET(`${API.GET_APPROVED_BOQ_LIST}/${projectId}`);
    console.log("Approved BOQ List API Response:", response);
    return response?.data || [];
  } catch (error) {
    console.error("Approved BOQ List API Error:", error);
    throw error;
  }
};

//Fetch approved BOQ details by boqId
export const getApprovedBoqDetails = async (boqId) => {
  try {
    if (!boqId) {
      throw new Error("BOQ ID is required");
    }
    const response = await api.GET(`${API.GET_APPROVED_BOQ_DETAILS}/${boqId}`);
    console.log("Approved BOQ Details API Response:", response);
    return response?.data || [];
  } catch (error) {
    console.error("Approved BOQ Details API Error:", error);
    throw error;
  }
};