export type NotificationChannel = "email" | "whatsapp";

export interface NotificationTemplate {
  id: number;
  channel: NotificationChannel;
  template_key: string;
  name: string;
  subject: string | null;
  body: string;
  variables: string[];
  is_active: boolean;
  updated_at: string;
}

export interface UpsertNotificationTemplateInput {
  channel: NotificationChannel;
  template_key: string;
  name: string;
  subject?: string | null;
  body: string;
  variables?: string[];
  is_active?: boolean;
}

export interface SchedulingSettings {
  timezone: string;
  active_days: number[];
  business_hours: {
    start: string;
    end: string;
  };
}

export interface RuleSettings {
  min_cancelation_hours: number;
  reschedule_limit_hours: number;
}

export interface SystemSettings {
  scheduling: SchedulingSettings;
  rules: RuleSettings;
}

export interface CarouselItem {
  id: number;
  title: string | null;
  message: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_link: string | null;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface UpsertCarouselItemInput {
  title?: string | null;
  message?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  cta_link?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export type TutorialVisibility = "professionals" | "patients" | "both";

export interface TutorialVideo {
  id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  visibility: TutorialVisibility;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpsertTutorialVideoInput {
  title: string;
  description?: string | null;
  youtube_url: string;
  visibility?: TutorialVisibility;
  display_order?: number;
  is_active?: boolean;
}

