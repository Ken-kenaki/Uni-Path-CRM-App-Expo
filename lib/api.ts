// lib/api.ts - Centralized API client with auth handling
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.70:3000/api";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private sessionCookie: string | null = null;

  async getSessionCookie(): Promise<string | null> {
    if (this.sessionCookie) return this.sessionCookie;
    const cookie = await AsyncStorage.getItem("session-cookie");
    this.sessionCookie = cookie;
    return cookie;
  }

  setSessionCookie(cookie: string | null) {
    this.sessionCookie = cookie;
    if (cookie) {
      AsyncStorage.setItem("session-cookie", cookie);
    } else {
      AsyncStorage.removeItem("session-cookie");
    }
  }

  async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, params } = options;

    let url = `${API_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const cookie = await this.getSessionCookie();

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: `my-custom-session=${cookie}` } : {}),
        ...headers,
      },
      credentials: "include",
    };

    if (body && method !== "GET") {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      // Extract session cookie from response
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        const match = setCookie.match(/my-custom-session=([^;]+)/);
        if (match) {
          this.setSessionCookie(match[1]);
        }
      }

      // Handle redirects (unauthorized)
      if (response.redirected || response.status === 307) {
        return { success: false, error: "Session expired. Please login again." };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Request failed: ${response.status}`,
        };
      }

      return data;
    } catch (error: any) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      return {
        success: false,
        error: error.message || "Network error. Please check your connection.",
      };
    }
  }

  // Auth
  async login(email: string, password: string) {
    const result = await this.request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    return result;
  }

  async getCurrentUser() {
    return this.request("/auth/current");
  }

  async signout() {
    const result = await this.request("/auth/signout", { method: "POST" });
    this.setSessionCookie(null);
    await AsyncStorage.removeItem("user");
    return result;
  }

  async forgotPassword(email: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  }

  async resetPassword(userId: string, secret: string, password: string, passwordRepeat: string) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: { userId, secret, password, passwordRepeat },
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
  }

  // Dashboard
  async getSummary() {
    return this.request("/dashboard/summary");
  }

  // Students
  async getStudents(params?: Record<string, string>) {
    return this.request("/dashboard/students", { params });
  }

  async getStudentsPage(page = 1, limit = 20) {
    return this.request("/dashboard/students-page", {
      params: { page: String(page), limit: String(limit) },
    });
  }

  async getStudent(id: string) {
    return this.request(`/dashboard/students/${id}`);
  }

  async createStudent(data: any) {
    return this.request("/dashboard/students", { method: "POST", body: data });
  }

  async updateStudent(id: string, data: any) {
    return this.request(`/dashboard/students/${id}`, { method: "PUT", body: data });
  }

  async updateStudentStatus(id: string, status: string) {
    return this.request(`/dashboard/students/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  }

  // Student sub-resources
  async getStudentDocuments(id: string) {
    return this.request(`/dashboard/students/${id}/documents`);
  }

  async getStudentPayments(id: string) {
    return this.request(`/dashboard/students/${id}/payments`);
  }

  async getStudentComments(id: string) {
    return this.request(`/dashboard/students/${id}/comments`);
  }

  async addStudentComment(id: string, content: string) {
    return this.request(`/dashboard/students/${id}/comments`, {
      method: "POST",
      body: { content },
    });
  }

  async getStudentVisa(id: string) {
    return this.request(`/dashboard/students/${id}/visa`);
  }

  async getStudentAcademics(id: string) {
    return this.request(`/dashboard/students/${id}/academics`);
  }

  async getStudentPaymentSummary(id: string) {
    return this.request(`/dashboard/students/${id}/payment-summary`);
  }

  async getStudentAccessToken(id: string) {
    return this.request(`/dashboard/students/${id}/access-token`);
  }

  async generateStudentAccessToken(id: string) {
    return this.request(`/dashboard/students/${id}/access-token`, {
      method: "POST",
      body: { expiryDays: 30, enablePortal: true },
    });
  }

  async sendDocumentRequest(id: string) {
    return this.request(`/dashboard/students/${id}/send-document-request`, {
      method: "POST",
      body: {},
    });
  }

  async sendPaymentRequest(id: string) {
    return this.request(`/dashboard/students/${id}/send-payment-request`, {
      method: "POST",
      body: {},
    });
  }

  // Leads
  async getLeads() {
    return this.request("/dashboard/leads");
  }

  async createLead(data: any) {
    return this.request("/dashboard/leads", { method: "POST", body: data });
  }

  async updateLead(data: any) {
    return this.request("/dashboard/leads", { method: "PUT", body: data });
  }

  async deleteLead(id: string) {
    return this.request("/dashboard/leads", { method: "DELETE", body: { leadId: id } });
  }

  // Visitors
  async getVisitors() {
    return this.request("/dashboard/visitors");
  }

  async createVisitor(data: any) {
    return this.request("/dashboard/visitors", { method: "POST", body: data });
  }

  // Countries
  async getCountries() {
    return this.request("/dashboard/countries");
  }

  async getCountry(id: string) {
    return this.request(`/dashboard/countries/${id}`);
  }

  async getCountryUniversities(id: string) {
    return this.request(`/dashboard/countries/${id}/universities`);
  }

  async getCountryStudents(id: string) {
    return this.request(`/dashboard/countries/${id}/students`);
  }

  // Universities
  async getUniversities() {
    return this.request("/dashboard/universities");
  }

  async getUniversity(id: string) {
    return this.request(`/dashboard/universities/${id}`);
  }

  async getUniversityCourses(id: string) {
    return this.request(`/dashboard/universities/${id}/courses`);
  }

  // Courses
  async getCourses() {
    return this.request("/dashboard/courses");
  }

  // Branches
  async getBranches(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request(`/dashboard/branches${qs}`);
  }

  async getBranch(id: string) {
    return this.request(`/dashboard/branches/${id}`);
  }

  async createBranch(data: any) {
    return this.request("/dashboard/branches", { method: "POST", body: data });
  }

  async updateBranch(id: string, data: any) {
    return this.request(`/dashboard/branches/${id}`, { method: "PUT", body: data });
  }

  async deleteBranch(id: string) {
    return this.request(`/dashboard/branches/${id}`, { method: "DELETE" });
  }

  // Users
  async getUsers() {
    return this.request("/dashboard/users");
  }

  async getUser(id: string) {
    return this.request(`/dashboard/users/${id}`);
  }

  async updateProfile(data: any) {
    return this.request("/dashboard/users/update-profile", {
      method: "PUT",
      body: data,
    });
  }

  // Document Templates
  async getDocumentTemplates() {
    return this.request("/dashboard/documentTemplates");
  }

  async getDocumentTemplate(id: string) {
    return this.request(`/dashboard/documentTemplates/${id}`);
  }

  async createDocumentTemplate(data: any) {
    return this.request("/dashboard/documentTemplates", { method: "POST", body: data });
  }

  // Payment Templates
  async getPaymentTemplates() {
    return this.request("/dashboard/paymentsTemplates");
  }

  async getPaymentTemplate(id: string) {
    return this.request(`/dashboard/paymentsTemplates/${id}`);
  }

  async createPaymentTemplate(data: any) {
    return this.request("/dashboard/paymentsTemplates", { method: "POST", body: data });
  }

  // Payments
  async getPayments() {
    return this.request("/dashboard/payments");
  }

  async getPayment(id: string) {
    return this.request(`/dashboard/payments/${id}`);
  }

  // Visa
  async getVisas() {
    return this.request("/dashboard/visa");
  }

  // Organizations
  async getOrganizations() {
    return this.request("/dashboard/organizations");
  }

  async getOrganization(id: string) {
    return this.request(`/dashboard/organizations/${id}`);
  }
}

export const api = new ApiClient();
export type { ApiResponse };
