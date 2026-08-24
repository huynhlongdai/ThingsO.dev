BEGIN;

ALTER TABLE source_documents DROP CONSTRAINT IF EXISTS source_documents_document_type_check;

ALTER TABLE source_documents
ADD CONSTRAINT source_documents_document_type_check
CHECK (document_type IN ('readme','documentation','package','other','repository_tree','manifest','container','configuration','contributing','security','architecture','ci','source_entrypoint'));

COMMIT;
