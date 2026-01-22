export interface Schedule {
  id?: string;
  userId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "pending" | "completed";
  resources?: Resource[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Resource {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  scheduleId?: string;
  scheduleTitle?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

