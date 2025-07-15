-- public.client definition

-- Drop table

-- DROP TABLE client;

CREATE TABLE client (
	id uuid NOT NULL, -- Client ID
	"name" varchar(200) NOT NULL, -- Client name
	"hashedSecret" varchar(255) NOT NULL, -- Hashed secret for the client
	"isActive" bool DEFAULT true NULL, -- Indicates if the client is active
	roles varchar(255) DEFAULT ''::character varying NULL, -- Comma-separated roles for the client
	permissions varchar(255) DEFAULT ''::character varying NULL, -- Comma-separated permissions for the client
	"lastUsedAt" timestamptz NULL, -- Last time the client was used
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT client_name_key UNIQUE (name),
	CONSTRAINT client_pkey PRIMARY KEY (id)
);
CREATE INDEX client_is_active ON public.client USING btree ("isActive");
CREATE UNIQUE INDEX client_name ON public.client USING btree (name);

-- Column comments

COMMENT ON COLUMN public.client.id IS 'Client ID';
COMMENT ON COLUMN public.client."name" IS 'Client name';
COMMENT ON COLUMN public.client."hashedSecret" IS 'Hashed secret for the client';
COMMENT ON COLUMN public.client."isActive" IS 'Indicates if the client is active';
COMMENT ON COLUMN public.client.roles IS 'Comma-separated roles for the client';
COMMENT ON COLUMN public.client.permissions IS 'Comma-separated permissions for the client';
COMMENT ON COLUMN public.client."lastUsedAt" IS 'Last time the client was used';

-- password is '0000'
INSERT INTO client (id, "name", "hashedSecret", "isActive", roles, permissions, "lastUsedAt", "createdAt", "updatedAt") 
VALUES('00000000-0000-0000-0000-000000000000', 'admin', '$argon2id$v=19$m=65536,t=3,p=4$dnMTWlA3YF24/ZU0z0QmWQ$yvwLQqGLzhtGzpocaJD9FyNSR0ywhb8L1z66NhxlqxQ', true, '*', '*', null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- public.dek definition

-- Drop table

-- DROP TABLE dek;

CREATE TABLE dek (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	"key" bytea NOT NULL, -- la dek cifrata con la kek
	"kekId" varchar(100) DEFAULT 'default'::character varying NOT NULL, -- Identificatore della KEK usata per cifrare questa DEK
	"version" int4 DEFAULT 1 NOT NULL, -- Versione della DEK per rotazione
	"isActive" bool DEFAULT true NOT NULL, -- Indica se la chiave è attiva
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT dek_name_key UNIQUE (name),
	CONSTRAINT dek_pkey PRIMARY KEY (id)
);

-- Column comments

COMMENT ON COLUMN public.dek."key" IS 'la dek cifrata con la kek';
COMMENT ON COLUMN public.dek."kekId" IS 'Identificatore della KEK usata per cifrare questa DEK';
COMMENT ON COLUMN public.dek."version" IS 'Versione della DEK per rotazione';
COMMENT ON COLUMN public.dek."isActive" IS 'Indica se la chiave è attiva';


-- public.folder definition

-- Drop table

-- DROP TABLE folder;

CREATE TABLE folder (
	id uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"parentId" uuid NULL, -- Null = cartella root
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT folder_name_key UNIQUE (name),
	CONSTRAINT folder_pkey PRIMARY KEY (id),
	CONSTRAINT "folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES folder(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Column comments

COMMENT ON COLUMN public.folder."parentId" IS 'Null = cartella root';


-- public.secret definition

-- Drop table

-- DROP TABLE secret;

CREATE TABLE secret (
	id uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"lastRotation" timestamptz NULL, -- Data ultima rotazione DEK
	"dekId" int4 DEFAULT 1 NOT NULL, -- Versione DEK usata per cifrare
	"folderId" uuid NULL, -- Se null allora fa parte della cartella root
	"data" bytea NOT NULL, -- Questi dati sono cifrati
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT secret_name_key UNIQUE (name),
	CONSTRAINT secret_pkey PRIMARY KEY (id),
	CONSTRAINT "secret_dekId_fkey" FOREIGN KEY ("dekId") REFERENCES dek(id) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT "secret_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES folder(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Column comments

COMMENT ON COLUMN public.secret."lastRotation" IS 'Data ultima rotazione DEK';
COMMENT ON COLUMN public.secret."dekId" IS 'Versione DEK usata per cifrare';
COMMENT ON COLUMN public.secret."folderId" IS 'Se null allora fa parte della cartella root';
COMMENT ON COLUMN public.secret."data" IS 'Questi dati sono cifrati';