export type Profile = {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
};

export type Slot = {
  id: string;
  date: string;
  time: string;
  player1_id: string | null;
  player1_name: string | null;
  player2_id: string | null;
  player2_name: string | null;
  created_at: string;
};

export type ReserveSlotResult =
  | { success: true }
  | { success: false; error:
      | "slot_full"
      | "daily_limit_exceeded"
      | "weekly_limit_exceeded"
      | "prime_time_limit_exceeded"
      | "partner_daily_limit_exceeded"
      | "partner_weekly_limit_exceeded"
      | "partner_prime_time_limit_exceeded"
      | "not_authenticated"
      | "forbidden"
      | "profile_not_found"
      | "invalid_partner"
      | "partner_not_found"
      | "invalid_time"
      | "slot_in_past"
      | "slot_not_found"
    };

// Minimal Database type used by Supabase clients
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at">; Update: Partial<Omit<Profile, "id" | "created_at">> };
      slots:    { Row: Slot;    Insert: Omit<Slot, "id" | "created_at">;    Update: Partial<Omit<Slot, "id" | "created_at">> };
    };
    Functions: Record<string, never>;
  };
};
