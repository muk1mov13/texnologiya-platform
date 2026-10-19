"""AI modulining konstantalari.

`EMBEDDING_DIM` — ustun o'lchami: o'zgartirish migratsiya talab qiladi."""

EMBEDDING_DIM = 768

INDEX_MATERIAL_JOB = "index_material"
INDEX_GLOSSARY_JOB = "index_topic_glossary"
INDEX_QUESTIONS_JOB = "index_topic_questions"
REINDEX_JOB = "reindex_all"
INDEX_LIBRARY_JOB = "index_library"
GENERATE_DRAFT_JOB = "generate_draft"
AI_CHECK_JOB = "ai_check_submission"

TOP_K = 6
HISTORY_MESSAGES = 6
MAX_MESSAGE_CHARS = 1000
DRAFT_CONTEXT_CHARS = 24_000
SUBMISSION_TEXT_CHARS = 20_000
EMBED_BATCH = 100
SUPPORT_MESSAGE_CHARS = 500
SUPPORT_HISTORY_PAIRS = 3
SUPPORT_RETENTION_DAYS = 90
SUPPORT_SITE_CHARS = 12_000
