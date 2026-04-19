export type Profile = {
  id: string;
  name: string;
  email: string;
  approved: boolean;
  created_at: string;
};

export type Slot = {
  id: string;
  date: string;         // "2024-05-20"
  time: string;         // "08:00"
  player1_id: string | null;
  player1_name: string | null;
  player2_id: string | null;
  player2_name: string | null;
  created_at: string;
};

export type ReserveSlotResult =
  | { success: true; position: 1 | 2 }
  | { success: false; error: "weekly_limit" | "daily_limit" | "slot_full" };

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      slots: {
        Row: Slot;
        Insert: Omit<Slot, "id" | "created_at">;
        Update: Partial<Omit<Slot, "id" | "created_at">>;
      };
    };
    Functions: {
      reserve_slot: {
        Args: {
          p_date: string;
          p_time: string;
          p_user_id: string;
          p_user_name: string;
        };
        Returns: ReserveSlotResult;
      };
    };
  };
};
