-- Extensions required by Arabic food search.
--
-- Postgres ships no Arabic text-search dictionary, so food search is built on
-- trigram similarity over a normalised name rather than on tsvector matching
-- (docs/DECISIONS.md, "البحث العربي"). pg_trgm provides that similarity and the
-- GIN operator classes the search index needs; unaccent strips diacritics as
-- part of the normalisation function added with the foods table in Phase 05.
--
-- They are enabled here, in the first migration, because they are a settled
-- decision and because installing an extension alongside the table that depends
-- on it makes that later migration harder to re-run cleanly.
--
-- Both live in the `extensions` schema: Supabase's convention, and it keeps
-- `public` holding only this project's own objects.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
