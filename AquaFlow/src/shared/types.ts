import z from "zod";

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const LoginResponseSchema = z.object({
  trongate_token: z.string(),
  user_role_id: z.number(),
  trongate_user_id: z.number(),
  user_id: z.number(),
  username: z.string(),
  employee_name: z.string(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const SessionSchema = z.object({
  userId: z.number(),
  trongateUserId: z.number(),
  trongateToken: z.string(),
  username: z.string(),
  employeeName: z.string(),
  userRoleId: z.number(),
});

export type Session = z.infer<typeof SessionSchema>;

export const ServiceAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const ServiceZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  parent_id: z.number(),
});

export const MeterBookSchema = z.object({
  id: z.string(),
  name: z.string(),
  service_areas_id: z.number(),
});

export const MeterSheetSchema = z.object({
  id: z.string(),
  name: z.string(),
  meter_books_id: z.number(),
});

export const TaskTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const TaskActionSchema = z.object({
  id: z.string(),
  name: z.string(),
  task_type: z.number(),
});

export const AccountTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const TariffChargeCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const MaterialPipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const MeterSizeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const TariffCategorySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
});

export const ReadingCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  has_reading: z.string(),
  has_image: z.string(),
});

export const ReadingAnomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export const ReadingAnomCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  case_id: z.string(),
});

export const IncidentTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const MeterReadingSheetSchema = z.object({
  id: z.string(),
  sheet: z.string(),
  assigned: z.string(),
  returned: z.string(),
  date_due: z.string(),
  active: z.string(),
  closed: z.string(),
});

export const MeterReadingAccountSchema = z.object({
  id: z.string(),
  account_number: z.string(),
  meters_id: z.string(),
  meter_no: z.string().nullable(),
  Location: z.string(),
  assoc_name: z.string(),
  assoc_phone: z.string(),
  assoc_email: z.string(),
  accounts_id: z.string(),
  prev_read: z.number().nullable(),
  prev_date: z.string().nullable(),
  last_date: z.string().nullable(),
  status_id: z.string(),
  geolat: z.number().nullable(),
  geolon: z.number().nullable(),
  connection: z.string(),
  acc_balance: z.string(),
  walk_no: z.number().nullable(),
});

export const TaskSchema = z.object({
  id: z.number(),
  externalId: z.string().nullable(),
  userId: z.number(),
  taskTypeId: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  priority: z.string().nullable(),
  customerName: z.string().nullable(),
  customerAccount: z.string().nullable(),
  locationAddress: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  assignedDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  completedDate: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Task = z.infer<typeof TaskSchema>;

export const IncidentSchema = z.object({
  id: z.number(),
  externalId: z.string().nullable(),
  userId: z.number(),
  typeId: z.number().nullable(),
  incidentType: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.string().nullable(),
  status: z.string(),
  customerAccount: z.string().nullable(),
  meterNumber: z.string().nullable(),
  locationAddress: z.string().nullable(),
  landmark: z.string().nullable(),
  contactName: z.string().nullable(),
  contactPhone: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  reportedDate: z.string().nullable(),
  resolvedDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Incident = z.infer<typeof IncidentSchema>;

export const MeterReadingSchema = z.object({
  id: z.number(),
  externalId: z.string().nullable(),
  userId: z.number(),
  meterNumber: z.string(),
  customerAccount: z.string().nullable(),
  customerName: z.string().nullable(),
  previousReading: z.number().nullable(),
  currentReading: z.number(),
  readingDate: z.string(),
  consumption: z.number().nullable(),
  meterStatus: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  notes: z.string().nullable(),
  photoUrl: z.string().nullable(),
  isSynced: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MeterReading = z.infer<typeof MeterReadingSchema>;

export const CustomerSchema = z.object({
  id: z.number(),
  accountNumber: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  meterNumber: z.string().nullable(),
  serviceAreaId: z.number().nullable(),
  serviceZoneId: z.number().nullable(),
  meterBookId: z.number().nullable(),
  meterSheetId: z.number().nullable(),
  connectionStatus: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export type MeterReadingSheet = {
  id: number;
  sheet: string;
  assigned: number;
  returned: number;
  dateDue: string;
  isActive: boolean;
  isClosed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export type MeterReadingAccount = {
  id: number;
  accountNumber: string;
  metersId: number;
  meterNo: string | null;
  location: string;
  assocName: string;
  assocPhone: string;
  assocEmail: string;
  accountsId: number;
  prevRead: number | null;
  prevDate: string | null;
  lastDate: string | null;
  statusId: number;
  geolat: number | null;
  geolon: number | null;
  connection: number;
  accBalance: number;
  walkNo: number | null;
  sheetId: number;
  createdAt: string;
  updatedAt: string;
};

export type ReadingCase = {
  id: number;
  name: string;
  hasReading: boolean;
  hasImage: boolean;
};

export type IncidentType = {
  id: number;
  name: string;
};
