-- NivaranAI: verified civic knowledge base for the RAG assistant (pgvector).
--
-- ADDITIVE ONLY: creates new objects (extension, table, indexes, function).
-- It does not alter or read any existing table, policy, or trigger.
-- Safe to re-run. NOT applied automatically: run it in the Supabase SQL editor
-- or with the Supabase CLI when you are ready.
--
-- Access model: the table has RLS enabled and no policies, and anon/authenticated
-- have no privileges. Only the server (service_role key) reads or writes it.

create extension if not exists vector with schema extensions;

create table if not exists public.civic_documents (
  id bigint generated always as identity primary key,
  department text not null,
  source_title text not null,                 -- e.g. 'Citizen Charter 2026 - Water Supply'
  source_url text not null check (source_url ~ '^https://'),
  chunk_text text not null check (char_length(chunk_text) between 1 and 4000),
  embedding extensions.vector(768) not null,  -- must match the embedding model's output size
  created_at timestamptz not null default now()
);

create index if not exists idx_civic_documents_embedding
  on public.civic_documents using hnsw (embedding extensions.vector_cosine_ops);
create index if not exists idx_civic_documents_department
  on public.civic_documents (department);

alter table public.civic_documents enable row level security;
revoke all on table public.civic_documents from anon, authenticated;

-- Top-N chunks above a cosine-similarity threshold (similarity = 1 - cosine distance).
create or replace function public.match_civic_documents(
  query_embedding extensions.vector,
  match_threshold double precision default 0.6,
  match_count integer default 4
)
returns table (
  id bigint,
  department text,
  source_title text,
  source_url text,
  chunk_text text,
  similarity double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select
    d.id,
    d.department,
    d.source_title,
    d.source_url,
    d.chunk_text,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.civic_documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 10);
$$;

revoke all on function public.match_civic_documents(extensions.vector, double precision, integer)
  from public, anon, authenticated;
grant execute on function public.match_civic_documents(extensions.vector, double precision, integer)
  to service_role;
