export type Role = "worker" | "employer";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
