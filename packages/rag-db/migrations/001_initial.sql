CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS knowledge_bases (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  visibility text NOT NULL DEFAULT 'public',
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_bases_visibility_check CHECK (visibility IN ('public', 'private')),
  CONSTRAINT knowledge_bases_status_check CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE TABLE IF NOT EXISTS knowledge_categories (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (knowledge_base_id, slug)
);

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  category_id uuid REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  index_status text NOT NULL DEFAULT 'pending',
  index_error text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_articles_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT knowledge_articles_index_status_check CHECK (index_status IN ('pending', 'indexing', 'indexed', 'failed')),
  UNIQUE (knowledge_base_id, slug)
);

CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  category_id uuid REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  question text NOT NULL,
  answer text NOT NULL,
  aliases jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  index_status text NOT NULL DEFAULT 'pending',
  index_error text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT faq_items_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT faq_items_index_status_check CHECK (index_status IN ('pending', 'indexing', 'indexed', 'failed'))
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  embedding extensions.vector(768) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_chunks_source_type_check CHECK (source_type IN ('article', 'faq'))
);

CREATE TABLE IF NOT EXISTS rag_conversations (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rag_messages (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES rag_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rag_messages_role_check CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE INDEX IF NOT EXISTS knowledge_categories_base_sort_idx
  ON knowledge_categories(knowledge_base_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS knowledge_articles_base_status_idx
  ON knowledge_articles(knowledge_base_id, status, sort_order, updated_at DESC);

CREATE INDEX IF NOT EXISTS faq_items_base_status_idx
  ON faq_items(knowledge_base_id, status, sort_order, updated_at DESC);

CREATE INDEX IF NOT EXISTS knowledge_chunks_source_idx
  ON knowledge_chunks(source_type, source_id);

CREATE INDEX IF NOT EXISTS knowledge_chunks_base_idx
  ON knowledge_chunks(knowledge_base_id);

CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx
  ON knowledge_chunks USING hnsw (embedding extensions.vector_cosine_ops);

DROP TRIGGER IF EXISTS knowledge_bases_set_updated_at ON knowledge_bases;
CREATE TRIGGER knowledge_bases_set_updated_at
  BEFORE UPDATE ON knowledge_bases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS knowledge_categories_set_updated_at ON knowledge_categories;
CREATE TRIGGER knowledge_categories_set_updated_at
  BEFORE UPDATE ON knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS knowledge_articles_set_updated_at ON knowledge_articles;
CREATE TRIGGER knowledge_articles_set_updated_at
  BEFORE UPDATE ON knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS faq_items_set_updated_at ON faq_items;
CREATE TRIGGER faq_items_set_updated_at
  BEFORE UPDATE ON faq_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS rag_conversations_set_updated_at ON rag_conversations;
CREATE TRIGGER rag_conversations_set_updated_at
  BEFORE UPDATE ON rag_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
