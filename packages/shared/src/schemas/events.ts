import { z } from "zod";
import { EVENT_STATUSES, TICKET_STATUSES } from "../constants/domain";

export const eventCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, "Etkinlik başlığı en az 4 karakter olmalıdır.")
      .max(140, "Etkinlik başlığı en fazla 140 karakter olabilir."),
    description: z
      .string()
      .trim()
      .min(10, "Etkinlik açıklaması en az 10 karakter olmalıdır.")
      .max(2000, "Etkinlik açıklaması en fazla 2000 karakter olabilir."),
    communityId: z.string().trim().min(1).nullable().optional(),
    location: z
      .string()
      .trim()
      .min(2, "Konum en az 2 karakter olmalıdır.")
      .max(160, "Konum en fazla 160 karakter olabilir."),
    startsAt: z.string().datetime({ message: "Geçerli bir başlangıç tarih/saati giriniz." }),
    endsAt: z.string().datetime({ message: "Geçerli bir bitiş tarih/saati giriniz." }),
    capacity: z.coerce
      .number()
      .int()
      .min(1, "Kontenjan en az 1 olmalıdır.")
      .max(5000, "Kontenjan en fazla 5000 olabilir."),
    status: z.enum(["draft", "published"]).default("published"),
  })
  .superRefine((data, ctx) => {
    if (new Date(data.endsAt).getTime() <= new Date(data.startsAt).getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Bitiş zamanı başlangıç zamanından sonra olmalıdır.",
      });
    }
  });

export type EventCreateInput = z.infer<typeof eventCreateSchema>;

export const eventStatusUpdateSchema = z.object({
  status: z.enum(EVENT_STATUSES),
});

export type EventStatusUpdateInput = z.infer<typeof eventStatusUpdateSchema>;

export const eventItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  communityId: z.string().nullable(),
  communityName: z.string().nullable(),
  location: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  capacity: z.number().int(),
  registeredCount: z.number().int(),
  status: z.enum(EVENT_STATUSES),
  myRegistrationStatus: z.enum(["confirmed", "cancelled"]).nullable(),
  myTicketStatus: z.enum(TICKET_STATUSES).nullable(),
});

export type EventItem = z.infer<typeof eventItemSchema>;

export const eventsListResponseSchema = z.object({
  items: z.array(eventItemSchema),
});

export type EventsListResponse = z.infer<typeof eventsListResponseSchema>;

export const ticketItemSchema = z.object({
  ticketId: z.string(),
  eventId: z.string(),
  eventTitle: z.string(),
  eventLocation: z.string(),
  eventStartsAt: z.string(),
  eventEndsAt: z.string(),
  communityName: z.string().nullable(),
  status: z.enum(TICKET_STATUSES),
  qrToken: z.string().nullable(),
  checkedInAt: z.string().nullable(),
  createdAt: z.string(),
});

export type TicketItem = z.infer<typeof ticketItemSchema>;

export const ticketsListResponseSchema = z.object({
  items: z.array(ticketItemSchema),
});

export type TicketsListResponse = z.infer<typeof ticketsListResponseSchema>;

export const checkInRequestSchema = z.object({
  eventId: z.string().min(1, "Etkinlik seçimi zorunludur."),
  qrToken: z.string().trim().min(16, "Geçersiz QR bilet kodu."),
});

export type CheckInRequestInput = z.infer<typeof checkInRequestSchema>;

export const checkInResponseSchema = z.object({
  result: z.enum(["checked_in", "already_checked_in"]),
  ticketId: z.string(),
  attendeeName: z.string(),
  attendeeDepartment: z.string(),
  checkedInAt: z.string(),
});

export type CheckInResponse = z.infer<typeof checkInResponseSchema>;

export const eventAttendeeItemSchema = z.object({
  userId: z.string(),
  fullName: z.string(),
  department: z.string(),
  userType: z.enum(["student", "alumni"]),
  registrationStatus: z.enum(["confirmed", "cancelled"]),
  ticketStatus: z.enum(TICKET_STATUSES).nullable(),
  checkedInAt: z.string().nullable(),
  registeredAt: z.string(),
});

export type EventAttendeeItem = z.infer<typeof eventAttendeeItemSchema>;

export const eventAttendeesResponseSchema = z.object({
  eventId: z.string(),
  eventTitle: z.string(),
  capacity: z.number().int(),
  registeredCount: z.number().int(),
  checkedInCount: z.number().int(),
  items: z.array(eventAttendeeItemSchema),
});

export type EventAttendeesResponse = z.infer<typeof eventAttendeesResponseSchema>;
