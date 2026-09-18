begin;
create schema if not exists extensions;
create extension if not exists vector with schema extensions;

create table public.enterprise_documents (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('jira', 'confluence', 'email', 'policy', 'manual', 'vendor_document')),
  source_id text not null unique,
  title text not null,
  content text not null,
  system text not null,
  category text not null,
  department text not null,
  created_at timestamptz not null,
  metadata jsonb not null check (metadata @> '{"synthetic": true}'::jsonb),
  embedding_model text not null check (embedding_model = 'text-embedding-3-small'),
  embedding extensions.vector(1536) not null
);

alter table public.enterprise_documents enable row level security;
revoke all on public.enterprise_documents from anon, authenticated;
grant select, insert, update on public.enterprise_documents to service_role;

-- Exact cosine search is sufficient for four documents; no premature ANN index.
create function public.match_enterprise_documents(
  query_embedding extensions.vector(1536),
  match_threshold double precision default 0.35,
  match_count integer default 4,
  expected_model text default 'text-embedding-3-small',
  dataset_version text default 'vdi-slice-1'
)
returns table (
  id uuid, source_type text, source_id text, title text, content text,
  system text, category text, department text, created_at timestamptz,
  metadata jsonb, similarity double precision
)
language sql stable security invoker
set search_path = public, extensions
as $$
  select d.id, d.source_type, d.source_id, d.title, d.content,
    d.system, d.category, d.department, d.created_at, d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.enterprise_documents d
  where d.embedding_model = expected_model
    and d.metadata ->> 'dataset_version' = match_enterprise_documents.dataset_version
    and 1 - (d.embedding <=> query_embedding) >= match_threshold
  order by d.embedding <=> query_embedding, d.source_id
  limit least(greatest(match_count, 1), 10);
$$;

revoke all on function public.match_enterprise_documents(extensions.vector, double precision, integer, text, text) from public, anon, authenticated;
grant execute on function public.match_enterprise_documents(extensions.vector, double precision, integer, text, text) to service_role;
commit;
