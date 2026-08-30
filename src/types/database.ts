export type UserRole = "admin" | "developer";
export type MenuCategory = "drinks" | "pastries";

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export type SiteSettings = {
  id: 1;
  business_name: string;
  tagline: string;
  logo_url: string | null;
  logo_alt: string | null;
  hero_image_url: string | null;
  hero_headline: string | null;
  hero_subtext: string | null;
  about_headline: string | null;
  about_body: string | null;
  address_line1: string | null;
  address_line2: string | null;
  map_embed_url: string | null;
  hours_weekday: string | null;
  hours_weekend: string | null;
  phone: string | null;
  email: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  footer_copyright: string | null;
  meta_description: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type NavLink = {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  is_visible: boolean;
};

export type MenuItem = {
  id: string;
  category: MenuCategory;
  name: string;
  description: string | null;
  price: number;
  badge: string | null;
  image_url: string | null;
  sort_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  avatar_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  topic: string | null;
  message: string;
  ip_address: string | null;
  status: "new" | "read" | "archived";
  created_at: string;
};

export type CustomCodeSnippet = {
  id: string;
  location: "head" | "body_start" | "body_end";
  label: string | null;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_by: string | null;
};

export type ThemeSettings = {
  id: 1;
  color_dark: string;
  color_card: string;
  color_cream: string;
  color_tan: string;
  color_accent: string;
  color_gold: string;
  font_heading: string;
  font_body: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile>; Relationships: never[] };
      site_settings: {
        Row: SiteSettings;
        Insert: Partial<SiteSettings>;
        Update: Partial<SiteSettings>;
        Relationships: never[];
      };
      nav_links: { Row: NavLink; Insert: Partial<NavLink>; Update: Partial<NavLink>; Relationships: never[] };
      menu_items: { Row: MenuItem; Insert: Partial<MenuItem>; Update: Partial<MenuItem>; Relationships: never[] };
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review>; Relationships: never[] };
      contact_submissions: {
        Row: ContactSubmission;
        Insert: Partial<ContactSubmission>;
        Update: Partial<ContactSubmission>;
        Relationships: never[];
      };
      custom_code_snippets: {
        Row: CustomCodeSnippet;
        Insert: Partial<CustomCodeSnippet>;
        Update: Partial<CustomCodeSnippet>;
        Relationships: never[];
      };
      theme_settings: {
        Row: ThemeSettings;
        Insert: Partial<ThemeSettings>;
        Update: Partial<ThemeSettings>;
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      menu_category: MenuCategory;
    };
    CompositeTypes: Record<string, never>;
  };
};
