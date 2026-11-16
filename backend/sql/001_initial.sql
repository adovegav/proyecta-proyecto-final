CREATE TABLE users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name VARCHAR(120) NOT NULL CHECK (length(trim(name)) > 0),
  description VARCHAR(2000) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('planning','active','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  title VARCHAR(160) NOT NULL CHECK (length(trim(title)) > 0),
  description VARCHAR(2000) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX projects_owner_idx ON projects(owner_id);
CREATE INDEX tasks_project_idx ON tasks(project_id);
