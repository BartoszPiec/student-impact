export type ChatPreview = {
  id: string;
  created_at: string;
  active_at: string;
  unread_count?: number;
  last_message?: string;
  type?: "inquiry" | "application" | "order" | "direct";
  other_user: {
    id: string;
    email: string;
    public_name?: string;
    avatar_url?: string;
    role?: string;
    nazwa?: string;
  };
  offer?: { tytul: string };
  package?: { title: string };
  application?: { offer?: { tytul: string } };
};
