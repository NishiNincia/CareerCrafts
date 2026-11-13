export type Role = "worker" | "employer";
export type CompanySize = "micro" | "small" | "medium" | "large";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
