export type Profile = {
  id: string;
  name: string;
  email: string;
  approved: boolean;
  is_admin: boolean;
  created_at: string;
};

export type Slot = {
  id: string;
  date: string;
  time: string;
  player1_id: string | null;
  player1_name: string | null;
  created_at: string;
};

export type ReserveSlotResult =
  | { success: true }
  | { success: false; error: "slot_full" };

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
