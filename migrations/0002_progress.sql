-- One row per learner: the whole game state (same shape as the browser's localStorage), merged on sync.
create table "progress" (
  "userId" text not null primary key references "user" ("id") on delete cascade,
  "state" text not null,
  "xp" integer not null default 0,
  "updatedAt" integer not null
);
create index "progress_xp_idx" on "progress" ("xp");
