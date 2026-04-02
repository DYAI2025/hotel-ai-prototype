-- ============================================================
-- Hotel AI Concierge — Complete Initial Schema
-- Migration: 001_initial_schema
-- Hospitality-only. Global privacy compliance.
--
-- Regulations covered:
--   GDPR / UK GDPR   (EU, EEA, United Kingdom)
--   CCPA / CPRA      (California, USA)
--   LGPD             (Brazil)
--   APPI             (Japan)
--   PIPA             (South Korea)
--   PIPL             (China — data localization flag)
--   POPIA            (South Africa)
--   PDPA             (Thailand, Singapore)
--   Privacy Act      (Australia)
--
-- Tables (15):
--   1.  accounts
--   2.  staff
--   3.  knowledge_bases
--   4.  documents
--   5.  knowledge_embeddings  (pgvector, gte-small 384d)
--   6.  guest_profiles
--   7.  bookings
--   8.  conversations
--   9.  messages
--   10. usage
--   11. knowledge_gaps
--   12. analytics_daily
--   13. consent_records       (all regulations — Art. 6/7 GDPR, CCPA, APPI, PIPL, ...)
--   14. privacy_requests      (global — erasure, portability, do_not_sell, ...)
--   15. audit_log             (immutable — GDPR Art. 30, PIPL Art. 51, LGPD Art. 37)
--
-- Tenant isolation strategy:
--   accounts     → user_id = auth.uid()
--   all others   → account_id = auth_account_id()
--   messages     → via conversation join
--   audit_log    → insert-only, no RLS (append-only via service role)
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";          -- pgvector (built-in on Supabase)

-- ─── Helper: updated_at trigger function ────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. accounts
-- One row per hotel / property.
-- Fast onboarding: only company_name is truly required.
-- ============================================================
create table if not exists accounts (
  id                        uuid        primary key default uuid_generate_v4(),
  user_id                   uuid        references auth.users(id) on delete set null,

  -- Identity
  company_name              text        not null,
  hotel_brand               text,
  property_type             text        default 'hotel'
                              check (property_type in (
                                'hotel','boutique_hotel','resort','hostel',
                                'apartment_hotel','villa','b_and_b'
                              )),

  -- Location
  country                   text,
  city                      text,
  address                   text,
  timezone                  text        not null default 'Europe/Vienna',
  latitude                  numeric(9,6),
  longitude                 numeric(9,6),

  -- Data residency
  -- Used to enforce data localization (PIPL), route to correct DPA,
  -- and determine which privacy laws apply.
  data_region               text        not null default 'global'
                              check (data_region in (
                                'eu',             -- GDPR (EU/EEA)
                                'uk',             -- UK GDPR
                                'us',             -- CCPA/CPRA + state laws
                                'japan',          -- APPI
                                'korea',          -- PIPA
                                'china',          -- PIPL (data localization required)
                                'brazil',         -- LGPD
                                'australia',      -- Privacy Act 1988
                                'south_africa',   -- POPIA
                                'southeast_asia', -- PDPA Thailand / PDPA Singapore
                                'global'          -- Multi-region / no primary jurisdiction
                              )),
  -- PIPL (China): personal data of Chinese citizens must be stored
  -- within China's borders unless a security assessment passes.
  data_localization_required boolean     not null default false,

  -- Localization
  default_language          text        not null default 'en',
  currency                  text        not null default 'EUR',

  -- Contact
  website_url               text,
  whatsapp_number           text,
  instagram_handle          text,
  logo_url                  text,

  -- Data Protection Officer
  -- Required by: GDPR Art. 37, LGPD Art. 41, POPIA Sec. 55 (Information Officer),
  --              PIPL Art. 52, APPI (privacy manager best practice).
  dpo_name                  text,
  dpo_email                 text,

  -- PMS integration
  pms_provider              text,
  pms_api_key_enc           text,                   -- encrypted at rest
  pms_hotel_id              text,
  pms_sync_enabled          boolean     not null default false,
  pms_last_synced_at        timestamptz,

  -- Subscription
  subscription_tier         text        not null default 'trial'
                              check (subscription_tier in ('trial','starter','pro','enterprise')),
  stripe_customer_id        text,
  stripe_subscription_id    text,

  -- Legal / Compliance
  -- dpa_signed_at: Data Processing Agreement — required by GDPR Art. 28,
  --                LGPD Art. 39, POPIA Sec. 21, PDPA operator contracts.
  dpa_signed_at             timestamptz,
  data_retention_days       integer     not null default 365,
  privacy_policy_url        text,

  -- Lifecycle
  onboarding_status         text        not null default 'pending'
                              check (onboarding_status in ('pending','in_progress','complete')),
  deleted_at                timestamptz,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table accounts enable row level security;

create policy "accounts: owner select"
  on accounts for select using (user_id = auth.uid());
create policy "accounts: owner update"
  on accounts for update using (user_id = auth.uid());
create policy "accounts: owner delete"
  on accounts for delete using (user_id = auth.uid());
create policy "accounts: insert own"
  on accounts for insert with check (user_id = auth.uid());

create trigger accounts_updated_at
  before update on accounts
  for each row execute function update_updated_at();

-- ─── Helper: resolve account_id for current auth user ───────
-- Defined here (after accounts exists) so the function body compiles.
-- security definer bypasses RLS on accounts internally.
create or replace function auth_account_id()
returns uuid
language sql stable security definer as $$
  select id from public.accounts where user_id = auth.uid() limit 1;
$$;

-- ============================================================
-- 2. staff
-- Hotel staff who can receive escalations and respond.
-- ============================================================
create table if not exists staff (
  id                    uuid        primary key default uuid_generate_v4(),
  account_id            uuid        not null references accounts(id) on delete cascade,
  name                  text        not null,
  email                 text,
  phone                 text,
  role                  text        not null default 'concierge'
                          check (role in (
                            'concierge','front_desk','manager','housekeeping',
                            'maintenance','restaurant','security','admin'
                          )),
  languages             text[]      not null default '{en}',
  is_active             boolean     not null default true,
  notification_channels text[]      not null default '{email}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index staff_account_id_idx on staff(account_id);
create index staff_role_idx       on staff(account_id, role) where is_active = true;

alter table staff enable row level security;

create policy "staff: account all"
  on staff for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

create trigger staff_updated_at
  before update on staff
  for each row execute function update_updated_at();

-- ============================================================
-- 3. knowledge_bases
-- One per account (usually). Stores hotel Q&A and profile.
-- ============================================================
create table if not exists knowledge_bases (
  id                    uuid        primary key default uuid_generate_v4(),
  account_id            uuid        not null references accounts(id) on delete cascade,
  data                  jsonb       not null default '{}',
  target_nationalities  text[],
  target_languages      text[]      not null default '{en}',
  tone_profile          text        not null default 'warm'
                          check (tone_profile in ('formal','warm','casual')),
  agent_name            text,
  agent_avatar_url      text,
  embedding_model       text        not null default 'gte-small',
  embedding_dimensions  integer     not null default 384,
  completeness_score    integer     not null default 0
                          check (completeness_score between 0 and 100),
  version               integer     not null default 1,
  onboarding_source     text
                          check (onboarding_source in ('manual','import','api', null)),
  last_updated_by       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index knowledge_bases_account_id_idx on knowledge_bases(account_id);

alter table knowledge_bases enable row level security;

create policy "knowledge_bases: account all"
  on knowledge_bases for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

create trigger knowledge_bases_updated_at
  before update on knowledge_bases
  for each row execute function update_updated_at();

-- ============================================================
-- 4. documents
-- Uploaded files (PDFs, menus, policies) attached to a KB.
-- ============================================================
create table if not exists documents (
  id                  uuid        primary key default uuid_generate_v4(),
  account_id          uuid        not null references accounts(id) on delete cascade,
  knowledge_base_id   uuid        references knowledge_bases(id) on delete set null,
  category            text        not null
                        check (category in (
                          'faq','policy','amenity','restaurant',
                          'attraction','transport','event','other'
                        )),
  title               text        not null,
  content             text,
  description         text,
  file_url            text,
  file_size_bytes     integer,
  mime_type           text,
  language            text        not null default 'en',
  version             integer     not null default 1,
  proactive_trigger   jsonb,
  uploaded_by         text,
  active              boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index documents_account_id_idx    on documents(account_id);
create index documents_kb_id_idx         on documents(knowledge_base_id);
create index documents_category_idx      on documents(account_id, category);
create index documents_active_idx        on documents(account_id, active);

alter table documents enable row level security;

create policy "documents: account all"
  on documents for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

-- ============================================================
-- 5. knowledge_embeddings
-- Vector store for semantic search using Supabase gte-small.
-- 384 dimensions. HNSW index for fast cosine similarity.
-- ============================================================
create table if not exists knowledge_embeddings (
  id                uuid        primary key default uuid_generate_v4(),
  account_id        uuid        not null references accounts(id) on delete cascade,
  knowledge_base_id uuid        references knowledge_bases(id) on delete cascade,
  document_id       uuid        references documents(id) on delete cascade,
  chunk_text        text        not null,
  chunk_index       integer     not null default 0,
  chunk_tokens      integer,
  category          text,
  language          text        not null default 'en',
  metadata          jsonb       not null default '{}',
  embedding         vector(384) not null,
  created_at        timestamptz not null default now()
);

create index knowledge_embeddings_account_idx on knowledge_embeddings(account_id);

create index knowledge_embeddings_hnsw_idx
  on knowledge_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

alter table knowledge_embeddings enable row level security;

create policy "knowledge_embeddings: account all"
  on knowledge_embeddings for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

-- ============================================================
-- 6. guest_profiles
-- Persistent guest identities across stays and channels.
-- ============================================================
create table if not exists guest_profiles (
  id                        uuid        primary key default uuid_generate_v4(),
  account_id                uuid        not null references accounts(id) on delete cascade,
  guest_identifier          text        not null,
  identifier_type           text        not null default 'token'
                              check (identifier_type in ('phone','email','whatsapp','token')),

  -- Personal
  name                      text,
  email                     text,
  phone                     text,
  nationality               text,
  preferred_language        text        not null default 'en',

  -- Loyalty
  loyalty_tier              text        default 'standard'
                              check (loyalty_tier in ('standard','silver','gold','platinum')),
  vip_status                boolean     not null default false,
  external_pms_id           text,

  -- Preferences
  visit_count               integer     not null default 1,
  preferences               jsonb       not null default '{}',
  notes                     text,
  tags                      text[],

  -- Privacy / opt-outs (multi-regulation)
  marketing_opt_in          boolean     not null default false,

  -- CCPA / CPRA (California): right to opt-out of sale or sharing
  -- of personal information (CCPA § 1798.120, CPRA amendment).
  ccpa_do_not_sell          boolean     not null default false,
  ccpa_do_not_sell_at       timestamptz,

  -- Universal erasure tracking (GDPR Art. 17, LGPD Art. 18,
  --   CCPA § 1798.105, PIPL Art. 47, POPIA Sec. 24, APPI Art. 36)
  erasure_requested_at      timestamptz,
  anonymized_at             timestamptz,

  first_visit               timestamptz not null default now(),
  last_visit                timestamptz not null default now(),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  unique(account_id, guest_identifier)
);

create index guest_profiles_account_id_idx    on guest_profiles(account_id);
create index guest_profiles_identifier_idx    on guest_profiles(account_id, guest_identifier);
create index guest_profiles_last_visit_idx    on guest_profiles(account_id, last_visit desc);
create index guest_profiles_pms_id_idx        on guest_profiles(account_id, external_pms_id)
  where external_pms_id is not null;

alter table guest_profiles enable row level security;

create policy "guest_profiles: account all"
  on guest_profiles for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

create trigger guest_profiles_updated_at
  before update on guest_profiles
  for each row execute function update_updated_at();

-- ============================================================
-- 7. bookings
-- PMS-ready reservation data.
-- ============================================================
create table if not exists bookings (
  id                    uuid        primary key default uuid_generate_v4(),
  account_id            uuid        not null references accounts(id) on delete cascade,
  guest_profile_id      uuid        references guest_profiles(id) on delete set null,

  -- PMS reference
  booking_reference     text        not null,
  pms_booking_id        text,
  pms_provider          text,

  -- Stay details
  checkin_date          date        not null,
  checkout_date         date        not null,
  room_number           text,
  room_type             text,
  room_category         text,
  num_adults            integer     not null default 1,
  num_children          integer     not null default 0,
  num_nights            integer     generated always as
                          (checkout_date - checkin_date) stored,

  -- Booking origin
  source                text
                          check (source in (
                            'direct','booking_com','expedia','airbnb',
                            'gds','phone','walk_in','other', null
                          )),
  channel               text,

  -- Financials
  rate_plan             text,
  currency              text        not null default 'EUR',
  total_amount          numeric(10,2),
  paid_amount           numeric(10,2),
  payment_status        text        not null default 'pending'
                          check (payment_status in (
                            'pending','partial','paid','refunded','void'
                          )),
  folio_balance         numeric(10,2) not null default 0,

  -- Status
  status                text        not null default 'confirmed'
                          check (status in (
                            'tentative','confirmed','checked_in',
                            'checked_out','cancelled','no_show'
                          )),
  cancelled_at          timestamptz,
  cancellation_reason   text,

  -- Special requests
  special_requests      text,
  dietary_requirements  text,
  accessibility_needs   text,

  booked_at             timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique(account_id, booking_reference)
);

create index bookings_account_id_idx    on bookings(account_id);
create index bookings_guest_profile_idx on bookings(guest_profile_id);
create index bookings_checkin_idx       on bookings(account_id, checkin_date);
create index bookings_status_idx        on bookings(account_id, status);
create index bookings_reference_idx     on bookings(account_id, booking_reference);
create index bookings_pms_id_idx        on bookings(account_id, pms_booking_id)
  where pms_booking_id is not null;

alter table bookings enable row level security;

create policy "bookings: account all"
  on bookings for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

create trigger bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at();

-- ============================================================
-- 8. conversations
-- ============================================================
create table if not exists conversations (
  id                  uuid        primary key default uuid_generate_v4(),
  account_id          uuid        not null references accounts(id) on delete cascade,
  guest_profile_id    uuid        references guest_profiles(id) on delete set null,
  booking_id          uuid        references bookings(id) on delete set null,
  assigned_to         uuid        references staff(id) on delete set null,

  channel             text        not null default 'web'
                        check (channel in ('web','whatsapp','instagram','email','sms','phone')),
  client_identifier   text,

  -- Guest snapshot
  guest_name          text,
  guest_email         text,
  guest_phone         text,
  nationality         text,
  language            text        not null default 'en',

  -- Stay context snapshot
  checkin_date        date,
  checkout_date       date,
  room_number         text,
  booking_reference   text,

  -- Status
  status              text        not null default 'active'
                        check (status in ('active','resolved','escalated','closed')),
  escalation_level    integer     not null default 0
                        check (escalation_level between 0 and 3),

  satisfaction_score  integer     check (satisfaction_score between 1 and 5),
  resolution_note     text,
  consent_given       boolean     not null default false,

  last_message_at     timestamptz,
  resolved_at         timestamptz,
  source              text,
  tags                text[],
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index conversations_account_id_idx on conversations(account_id);
create index conversations_status_idx     on conversations(account_id, status);
create index conversations_channel_idx    on conversations(account_id, channel);
create index conversations_guest_idx      on conversations(guest_profile_id);
create index conversations_booking_idx    on conversations(booking_id);
create index conversations_last_msg_idx   on conversations(account_id, last_message_at desc);

alter table conversations enable row level security;

create policy "conversations: account all"
  on conversations for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();

-- ============================================================
-- 9. messages
-- ============================================================
create table if not exists messages (
  id                      uuid        primary key default uuid_generate_v4(),
  conversation_id         uuid        not null references conversations(id) on delete cascade,

  role                    text        not null check (role in ('user','assistant','system')),
  content                 text        not null,
  content_type            text        not null default 'text'
                            check (content_type in ('text','voice','image','document','template')),

  is_voice_note           boolean     not null default false,
  voice_duration_seconds  integer,
  media_url               text,

  detected_language       text,
  translated_content      text,

  intent                  text
                            check (intent in (
                              'greeting','question','complaint','emergency',
                              'booking_change','compliment','farewell', null
                            )),
  escalation_level        integer     not null default 0
                            check (escalation_level between 0 and 3),
  confidence              numeric(4,3),
  tokens_used             integer,
  response_time_ms        integer,

  sender_type             text        not null default 'guest'
                            check (sender_type in ('guest','ai','staff','system')),
  delivery_status         text        not null default 'delivered'
                            check (delivery_status in (
                              'pending','sent','delivered','read','failed'
                            )),
  channel_message_id      text,
  metadata                jsonb       not null default '{}',

  created_at              timestamptz not null default now()
);

create index messages_conversation_id_idx on messages(conversation_id);
create index messages_created_at_idx      on messages(conversation_id, created_at);
create index messages_intent_idx          on messages(conversation_id, intent)
  where intent is not null;

alter table messages enable row level security;

create policy "messages: account select"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.account_id = auth_account_id()
    )
  );

create policy "messages: account insert"
  on messages for insert
  with check (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.account_id = auth_account_id()
    )
  );

create policy "messages: account update"
  on messages for update
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.account_id = auth_account_id()
    )
  );

create policy "messages: account delete"
  on messages for delete
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.account_id = auth_account_id()
    )
  );

-- ============================================================
-- 10. usage
-- ============================================================
create table if not exists usage (
  id                    uuid    primary key default uuid_generate_v4(),
  account_id            uuid    not null references accounts(id) on delete cascade,
  month                 date    not null,

  message_count         integer not null default 0,
  voice_note_count      integer not null default 0,
  escalation_count      integer not null default 0,

  ai_model              text    not null default 'claude-sonnet-4-20250514',
  input_tokens          integer not null default 0,
  output_tokens         integer not null default 0,
  total_tokens          integer generated always as (input_tokens + output_tokens) stored,

  avg_response_time_ms  integer,
  unique_guests         integer not null default 0,
  languages_detected    text[],
  cost_cents            integer not null default 0,

  unique(account_id, month)
);

create index usage_account_month_idx on usage(account_id, month desc);

alter table usage enable row level security;

create policy "usage: account all"
  on usage for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

-- ============================================================
-- 11. knowledge_gaps
-- ============================================================
create table if not exists knowledge_gaps (
  id                      uuid        primary key default uuid_generate_v4(),
  account_id              uuid        not null references accounts(id) on delete cascade,
  source_conversation_id  uuid        references conversations(id) on delete set null,
  source_message_id       uuid        references messages(id) on delete set null,

  question                text        not null,
  topic                   text,
  category                text,
  guest_nationality       text,
  guest_language          text,

  frequency               integer     not null default 1,
  priority                text        not null default 'medium'
                            check (priority in ('low','medium','high','critical')),
  status                  text        not null default 'open'
                            check (status in ('open','in_review','resolved','wont_fix')),

  resolved_answer         text,
  resolved_at             timestamptz,
  resolved_by             text,
  first_asked             timestamptz not null default now(),
  last_asked              timestamptz not null default now()
);

create index knowledge_gaps_account_id_idx on knowledge_gaps(account_id);
create index knowledge_gaps_status_idx     on knowledge_gaps(account_id, status);
create index knowledge_gaps_priority_idx   on knowledge_gaps(account_id, priority);

alter table knowledge_gaps enable row level security;

create policy "knowledge_gaps: account all"
  on knowledge_gaps for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

-- ============================================================
-- 12. analytics_daily
-- ============================================================
create table if not exists analytics_daily (
  id                    uuid        primary key default uuid_generate_v4(),
  account_id            uuid        not null references accounts(id) on delete cascade,
  date                  date        not null,

  message_count         integer     not null default 0,
  conversation_count    integer     not null default 0,
  unique_guests         integer     not null default 0,
  new_guests            integer     not null default 0,
  escalation_count      integer     not null default 0,
  avg_response_time_ms  integer,
  satisfaction_avg      numeric(3,2),
  voice_note_count      integer     not null default 0,
  knowledge_gap_count   integer     not null default 0,
  top_language          text,
  top_intent            text,
  top_channel           text,
  cost_cents            integer     not null default 0,

  unique(account_id, date)
);

create index analytics_daily_account_date_idx on analytics_daily(account_id, date desc);

alter table analytics_daily enable row level security;

create policy "analytics_daily: account all"
  on analytics_daily for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

-- ============================================================
-- 13. consent_records
-- Multi-regulation consent tracking.
--
-- legal_basis values map to:
--   consent              → GDPR Art. 6(1)(a), LGPD Art. 7(I), PDPA Sec. 19,
--                          APPI Art. 17, PIPA Art. 15, PIPL Art. 13(1)
--   contract             → GDPR Art. 6(1)(b), LGPD Art. 7(V)
--   legal_obligation     → GDPR Art. 6(1)(c), LGPD Art. 7(II)
--   vital_interests      → GDPR Art. 6(1)(d)
--   legitimate_interests → GDPR Art. 6(1)(f), LGPD Art. 7(IX),
--                          POPIA Condition 3, Privacy Act APP 3
--   public_task          → GDPR Art. 6(1)(e)
--   ccpa_business_purpose → CCPA § 1798.140 "business purpose" (not sale)
--   appi_necessity       → APPI Art. 18 (academic/medical/legal necessity)
--   pipl_necessity       → PIPL Art. 13(2–7) (public interest, vital interest, etc.)
--   pdpa_legitimate_interests → PDPA (TH) Sec. 24 / PDPA (SG) Second Schedule
--   pipa_legitimate_interests → PIPA (KR) Art. 15(1)(6)
--   lgpd_research        → LGPD Art. 7(IV) scientific/journalistic research
--   popia_legitimate_interests → POPIA Sec. 11(1)(f)
-- ============================================================
create table if not exists consent_records (
  id                      uuid        primary key default uuid_generate_v4(),
  account_id              uuid        not null references accounts(id) on delete cascade,
  guest_profile_id        uuid        references guest_profiles(id) on delete cascade,

  -- Which regulation / legal framework applies
  regulation              text        not null default 'gdpr'
                            check (regulation in (
                              'gdpr',           -- EU / EEA
                              'uk_gdpr',        -- United Kingdom
                              'ccpa',           -- California
                              'cpra',           -- California (CCPA amendment)
                              'lgpd',           -- Brazil
                              'appi',           -- Japan
                              'pipa',           -- South Korea
                              'pipl',           -- China
                              'popia',          -- South Africa
                              'pdpa_th',        -- Thailand
                              'pdpa_sg',        -- Singapore
                              'privacy_act_au', -- Australia
                              'global'          -- Multi-region / unspecified
                            )),

  -- Legal basis for processing (see comments above)
  legal_basis             text        not null default 'consent'
                            check (legal_basis in (
                              'consent',
                              'contract',
                              'legal_obligation',
                              'vital_interests',
                              'legitimate_interests',
                              'public_task',
                              'ccpa_business_purpose',
                              'appi_necessity',
                              'pipl_necessity',
                              'pdpa_legitimate_interests',
                              'pipa_legitimate_interests',
                              'lgpd_research',
                              'popia_legitimate_interests'
                            )),

  -- What the consent covers
  consent_type            text        not null
                            check (consent_type in (
                              'ai_processing',          -- AI reads/stores conversation
                              'marketing_email',
                              'marketing_whatsapp',
                              'analytics',
                              'third_party_sharing',
                              'data_retention_extended',
                              'sensitive_data',         -- GDPR Art. 9 / PIPL Art. 29 / APPI Art. 17(2)
                              'do_not_sell'             -- CCPA opt-out record
                            )),
  granted                 boolean     not null,
  channel                 text        not null default 'web'
                            check (channel in ('web','whatsapp','instagram','email','sms')),

  -- Versioning / evidence
  privacy_policy_version  text        not null default '1.0',
  consent_text            text,
  granted_at              timestamptz not null default now(),
  withdrawn_at            timestamptz,
  expires_at              timestamptz,
  ip_address              inet,
  user_agent              text,
  metadata                jsonb       not null default '{}'
);

create index consent_records_account_idx    on consent_records(account_id);
create index consent_records_guest_idx      on consent_records(guest_profile_id);
create index consent_records_type_idx       on consent_records(account_id, consent_type);
create index consent_records_regulation_idx on consent_records(account_id, regulation);

alter table consent_records enable row level security;

create policy "consent_records: account all"
  on consent_records for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

-- ============================================================
-- 14. privacy_requests
-- Global data subject rights request tracking.
--
-- Covers:
--   GDPR    Art. 15 (access), 16 (rectification), 17 (erasure),
--           18 (restriction), 20 (portability), 21 (objection),
--           22 (automated decision)
--   CCPA    § 1798.100 (access), 1798.105 (deletion),
--           1798.120 (do_not_sell), 1798.130 (portability)
--   LGPD    Art. 18 (access, correction, erasure, portability,
--           objection, revocation)
--   APPI    Art. 27 (disclosure), 28 (correction/erasure),
--           29 (opt-out of third-party transfer)
--   PIPA    Art. 35 (access), 36 (correction/erasure)
--   PIPL    Art. 45–50 (access, copy, correction, erasure,
--           withdrawal, portability, opt-out automated decision)
--   POPIA   Sec. 23 (access), 24 (correction/erasure),
--           11(3) (objection to processing)
--   PDPA (TH/SG) portability, erasure, objection, restriction
--   Privacy Act (AU) APP 12 (access), APP 13 (correction)
--
-- Deadline: GDPR / UK GDPR = 30 days; CCPA = 45 days;
--           LGPD = 15 days; APPI = "without delay" (~30 days);
--           PIPL = 15 days. We default to 30 days and let the
--           application layer enforce regulation-specific deadlines.
-- ============================================================
create table if not exists privacy_requests (
  id                uuid        primary key default uuid_generate_v4(),
  account_id        uuid        not null references accounts(id) on delete cascade,
  guest_profile_id  uuid        references guest_profiles(id) on delete set null,

  -- Which regulation this request is filed under
  regulation        text        not null default 'gdpr'
                      check (regulation in (
                        'gdpr','uk_gdpr','ccpa','cpra','lgpd',
                        'appi','pipa','pipl','popia',
                        'pdpa_th','pdpa_sg','privacy_act_au','global'
                      )),

  -- Type of right being exercised
  request_type      text        not null
                      check (request_type in (
                        'access',                    -- right to know / subject access request
                        'portability',               -- data export / machine-readable copy
                        'rectification',             -- correction of inaccurate data
                        'erasure',                   -- right to be forgotten / deletion
                        'restriction',               -- restrict processing (GDPR Art. 18)
                        'objection',                 -- object to processing (GDPR Art. 21, LGPD Art. 18)
                        'opt_out_automated_decision', -- GDPR Art. 22, LGPD Art. 20, PIPL Art. 24
                        'do_not_sell',               -- CCPA § 1798.120 / CPRA opt-out of sale/sharing
                        'withdrawal_of_consent'      -- withdraw previously given consent
                      )),

  requester_email   text        not null,
  requester_name    text,
  notes             text,

  -- Deadline (default 30 days; application adjusts per regulation)
  -- generated always is not allowed with timestamptz intervals (not immutable).
  -- Set via before insert trigger instead.
  received_at       timestamptz not null default now(),
  deadline_at       timestamptz,

  -- Status lifecycle
  status            text        not null default 'pending'
                      check (status in (
                        'pending','in_progress','fulfilled',
                        'rejected','partially_fulfilled'
                      )),
  fulfilled_at      timestamptz,
  fulfilled_by      text,
  rejection_reason  text,

  -- Evidence / output
  export_url        text,
  export_expires_at timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index privacy_requests_account_idx    on privacy_requests(account_id);
create index privacy_requests_status_idx     on privacy_requests(account_id, status);
create index privacy_requests_regulation_idx on privacy_requests(account_id, regulation);
create index privacy_requests_deadline_idx   on privacy_requests(deadline_at)
  where status in ('pending','in_progress');

alter table privacy_requests enable row level security;

create policy "privacy_requests: account all"
  on privacy_requests for all
  using (account_id = auth_account_id())
  with check (account_id = auth_account_id());

create trigger privacy_requests_updated_at
  before update on privacy_requests
  for each row execute function update_updated_at();

-- Set deadline_at on insert (received_at + 30 days).
-- Cannot use generated always because interval arithmetic is not immutable.
create or replace function set_privacy_request_deadline()
returns trigger language plpgsql as $$
begin
  if new.deadline_at is null then
    new.deadline_at := new.received_at + interval '30 days';
  end if;
  return new;
end;
$$;

create trigger privacy_requests_set_deadline
  before insert on privacy_requests
  for each row execute function set_privacy_request_deadline();

-- ============================================================
-- 15. audit_log
-- Immutable append-only log of all data changes.
-- GDPR Art. 30, PIPL Art. 51, LGPD Art. 37, POPIA Sec. 22,
-- APPI Art. 24 (third-party transfer records).
-- Inserted via service role only. No UPDATE/DELETE policy.
-- ============================================================
create table if not exists audit_log (
  id              uuid        primary key default uuid_generate_v4(),
  account_id      uuid        references accounts(id) on delete set null,

  actor_type      text        not null
                    check (actor_type in ('user','staff','ai','system','guest')),
  actor_id        text,
  actor_email     text,

  action          text        not null,
  resource_type   text        not null,
  resource_id     text,

  before_state    jsonb,
  after_state     jsonb,
  diff            jsonb,

  ip_address      inet,
  user_agent      text,
  request_id      text,
  metadata        jsonb       not null default '{}',

  created_at      timestamptz not null default now()
);

create index audit_log_account_idx   on audit_log(account_id, created_at desc);
create index audit_log_resource_idx  on audit_log(resource_type, resource_id);
create index audit_log_actor_idx     on audit_log(actor_id, created_at desc);

alter table audit_log enable row level security;

create policy "audit_log: account select"
  on audit_log for select
  using (account_id = auth_account_id());

-- ============================================================
-- anonymize_guest()
-- Irreversibly anonymizes a guest and all linked personal data.
-- Call this after fulfilling an erasure / do_not_sell request.
-- Works for all regulations (GDPR Art. 17, CCPA § 1798.105,
-- LGPD Art. 18, PIPL Art. 47, APPI Art. 36, POPIA Sec. 24).
-- ============================================================
create or replace function anonymize_guest(p_guest_profile_id uuid)
returns void
language plpgsql security definer as $$
declare
  v_account_id uuid;
begin
  select account_id into v_account_id
    from guest_profiles where id = p_guest_profile_id;

  -- Anonymize guest_profiles
  update guest_profiles set
    name                  = 'Anonymized',
    email                 = null,
    phone                 = null,
    guest_identifier      = 'anon_' || p_guest_profile_id::text,
    nationality           = null,
    preferences           = '{}',
    notes                 = null,
    tags                  = null,
    external_pms_id       = null,
    ccpa_do_not_sell      = false,
    erasure_requested_at  = erasure_requested_at,  -- preserve timestamp
    anonymized_at         = now()
  where id = p_guest_profile_id;

  -- Anonymize conversation snapshots
  update conversations set
    guest_name        = 'Anonymized',
    guest_email       = null,
    guest_phone       = null,
    nationality       = null,
    booking_reference = null
  where guest_profile_id = p_guest_profile_id;

  -- Redact message content
  update messages set
    content             = '[redacted]',
    translated_content  = null,
    metadata            = '{}'
  where conversation_id in (
    select id from conversations where guest_profile_id = p_guest_profile_id
  );

  -- Anonymize bookings
  update bookings set
    special_requests      = null,
    dietary_requirements  = null,
    accessibility_needs   = null
  where guest_profile_id = p_guest_profile_id;

  -- Append to audit_log
  insert into audit_log (
    account_id, actor_type, actor_id, action, resource_type, resource_id, metadata
  ) values (
    v_account_id,
    'system',
    'anonymize_guest()',
    'anonymize',
    'guest_profiles',
    p_guest_profile_id::text,
    jsonb_build_object('reason', 'privacy_erasure_request', 'timestamp', now())
  );
end;
$$;
