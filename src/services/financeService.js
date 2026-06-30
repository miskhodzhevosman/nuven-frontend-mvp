import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getProjectReport = (projectId) => {
  return api.get(
    `/api/finance/financial-transactions/project-report/?project_id=${projectId}`
  );
};

export const getTotalReport = () => {
  return api.get("/api/finance/financial-transactions/total-report/");
};

export const getPnLReport = () => {
  return api.get("/api/finance/financial-transactions/pnl-report/");
};